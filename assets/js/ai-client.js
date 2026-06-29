import { getLang } from './i18n.js';

const SETTINGS_KEY = 'tm_ai_settings';
const DEFAULT_SETTINGS = { provider: 'gemini', apiKey: '', responseLang: 'auto' };

export function getSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...s };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(s) {
  const cur = getSettings();
  const next = { ...cur, ...s };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function hasKey() {
  return !!getSettings().apiKey;
}

const PROVIDERS = {
  gemini: {
    label: 'Google Gemini (2.0 Flash)',
    models: { default: 'gemini-2.0-flash' },
    keyUrl: 'https://aistudio.google.com/apikey',
    keyHint: { zh: '至 Google AI Studio 免費申請，免信用卡。', en: 'Get one free at Google AI Studio, no credit card needed.' },
  },
  groq: {
    label: 'Groq (Llama 3.3 70B)',
    models: { default: 'llama-3.3-70b-versatile' },
    keyUrl: 'https://console.groq.com/keys',
    keyHint: { zh: '至 Groq Console 免費申請，速度快。', en: 'Get one free at Groq Console, very fast.' },
  },
};

export function getProviderInfo(id) { return PROVIDERS[id] || PROVIDERS.gemini; }
export function getProviders() { return Object.entries(PROVIDERS).map(([id, v]) => ({ id, ...v })); }

function buildSystemPrompt(data, lang) {
  const list = data.models.map(m =>
    `${m.id} | ${m.name_zh} / ${m.name_en} | ${m.category} | ${lang === 'en' ? m.definition_en : m.definition_zh}`
  ).join('\n');

  const instr = lang === 'en'
    ? `You are a thinking-models advisor. The user describes a real situation (and optionally their initial idea). Your job:
1. Recommend 2-4 thinking models FROM THE PROVIDED LIST ONLY that best fit the situation. Use exact ids.
2. For each recommendation, explain in 1-2 sentences why it fits.
3. Propose 3-5 concrete strategies/actions the user can take, each with a short title and explanation.
Respond ONLY as JSON with this exact shape:
{"recommendations":[{"id":"model_id","reason":"why it fits"}],"strategies":[{"title":"action title","desc":"what to do and why"}]}`
    : `你是一位思考模式顧問。使用者描述一個真實情境（可能附上初步想法）。你的任務：
1. 從下方清單中「僅」挑選 2-4 個最適用該情境的思考模式，使用精確的 id。
2. 為每個推薦用 1-2 句話說明為何適用。
3. 提出 3-5 個使用者可執行的具體對策，每個含簡短標題與說明。
僅以 JSON 回應，結構如下：
{"recommendations":[{"id":"模式id","reason":"為何適用"}],"strategies":[{"title":"對策標題","desc":"具體做法與理由"}]}`;

  return `${instr}

AVAILABLE MODELS (id | name | category | definition):
${list}`;
}

function buildUserPrompt(situation, proposal, lang) {
  const p = lang === 'en' ? 'Initial idea: ' : '初步想法：';
  const s = lang === 'en' ? 'Situation: ' : '情境：';
  return `${s}${situation}${proposal ? `\n${p}${proposal}` : ''}`;
}

export async function analyze(data, situation, proposal) {
  const settings = getSettings();
  if (!settings.apiKey) {
    const err = new Error('NO_KEY');
    err.code = 'NO_KEY';
    throw err;
  }
  const lang = settings.responseLang === 'auto' ? getLang() : settings.responseLang;
  const systemPrompt = buildSystemPrompt(data, lang);
  const userPrompt = buildUserPrompt(situation, proposal, lang);

  let raw;
  if (settings.provider === 'gemini') {
    raw = await callGemini(settings, systemPrompt, userPrompt);
  } else {
    raw = await callGroq(settings, systemPrompt, userPrompt);
  }
  return parseResult(raw, data);
}

async function callGemini(settings, systemPrompt, userPrompt) {
  const model = PROVIDERS.gemini.models.default;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw httpError(res.status, txt);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text;
}

async function callGroq(settings, systemPrompt, userPrompt) {
  const model = PROVIDERS.groq.models.default;
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw httpError(res.status, txt);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error('EMPTY_RESPONSE');
  return text;
}

function parseResult(raw, data) {
  let obj;
  try { obj = JSON.parse(raw); }
  catch { throw new Error('PARSE_FAIL'); }

  const recs = (obj.recommendations || []).map(r => {
    const model = data.models.find(m => m.id === r.id);
    return { id: r.id, reason: r.reason || '', model };
  }).filter(r => r.model);

  const strategies = (obj.strategies || []).map(s => ({
    title: s.title || '',
    desc: s.desc || '',
  }));

  return { recommendations: recs, strategies };
}

function httpError(status, txt) {
  const e = new Error(`HTTP_${status}`);
  e.code = `HTTP_${status}`;
  e.detail = txt.slice(0, 300);
  return e;
}
