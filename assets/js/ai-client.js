import { getLang } from './i18n.js';

const SETTINGS_KEY = 'tm_ai_settings';
const DEFAULT_SETTINGS = { provider: 'gemini', apiKey: '', responseLang: 'auto', model: '' };

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
    label: 'Google Gemini',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyHint: {
      zh: '至 Google AI Studio 申請。注意：Gemini「免費層」有地區限制，台灣等地區可能需綁定計費帳戶才能使用。',
      en: 'Get a key at Google AI Studio. Note: Gemini free tier has region restrictions — some regions require a billing account.'
    },
    modelFallbacks: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-1.5-flash'],
    modelHint: {
      zh: '留空自動偵測；也可手動填入如 gemini-2.5-flash',
      en: 'Leave empty for auto-detect; or enter e.g. gemini-2.5-flash'
    },
  },
  groq: {
    label: 'Groq',
    keyUrl: 'https://console.groq.com/keys',
    keyHint: {
      zh: '至 Groq Console 免費申請，速度極快，無地區限制。推薦台灣使用者使用。',
      en: 'Get a free key at Groq Console. Very fast, no region restrictions. Recommended for users in restricted regions.'
    },
    modelFallbacks: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'],
    modelHint: {
      zh: '留空自動偵測；也可手動填入如 llama-3.3-70b-versatile',
      en: 'Leave empty for auto-detect; or enter e.g. llama-3.3-70b-versatile'
    },
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
  const info = PROVIDERS.gemini;
  const candidates = settings.model ? [settings.model, ...info.modelFallbacks] : info.modelFallbacks;
  const seen = new Set();
  let lastErr = null;

  for (const model of candidates) {
    if (seen.has(model)) continue;
    seen.add(model);
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
    if (res.ok) {
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
      lastErr = apiError('EMPTY_RESPONSE', '', 200);
      continue;
    }
    const errBody = await res.text().catch(() => '');
    const parsed = parseGeminiError(errBody);
    if (res.status === 404 || parsed.status === 'NOT_FOUND') {
      lastErr = apiError(`HTTP_${res.status}`, parsed.message, res.status, parsed.status);
      continue;
    }
    if (res.status === 429) {
      lastErr = apiError(`HTTP_429`, parsed.message, 429, parsed.status);
      if (parsed.isRegionBlock) throw lastErr;
      continue;
    }
    throw apiError(`HTTP_${res.status}`, parsed.message, res.status, parsed.status);
  }
  throw lastErr || apiError('ALL_MODELS_FAILED', '', 0);
}

async function callGroq(settings, systemPrompt, userPrompt) {
  const info = PROVIDERS.groq;
  const candidates = settings.model ? [settings.model, ...info.modelFallbacks] : info.modelFallbacks;
  const seen = new Set();
  let lastErr = null;

  for (const model of candidates) {
    if (seen.has(model)) continue;
    seen.add(model);
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
    if (res.ok) {
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content;
      if (text) return text;
      lastErr = apiError('EMPTY_RESPONSE', '', 200);
      continue;
    }
    const errBody = await res.text().catch(() => '');
    const parsed = parseOpenAIError(errBody);
    if (res.status === 404 || parsed.status === 'NOT_FOUND') {
      lastErr = apiError(`HTTP_${res.status}`, parsed.message, res.status, parsed.status);
      continue;
    }
    throw apiError(`HTTP_${res.status}`, parsed.message, res.status, parsed.status);
  }
  throw lastErr || apiError('ALL_MODELS_FAILED', '', 0);
}

export async function testConnection(provider, apiKey, model) {
  if (!apiKey) return { ok: false, message: 'NO_KEY' };
  if (provider === 'gemini') return testGemini(apiKey, model);
  return testGroq(apiKey, model);
}

async function testGemini(apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const parsed = parseGeminiError(body);
      return { ok: false, status: res.status, message: parsed.message, statusText: parsed.status, isRegionBlock: parsed.isRegionBlock };
    }
    const json = await res.json();
    const models = (json.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
    if (models.length === 0) return { ok: false, message: 'No text models available for this key.' };
    const preferred = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];
    const pick = model && models.includes(model) ? model : preferred.find(m => models.includes(m)) || models[0];
    return { ok: true, models, recommended: pick };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

async function testGroq(apiKey, model) {
  const url = 'https://api.groq.com/openai/v1/models';
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const parsed = parseOpenAIError(body);
      return { ok: false, status: res.status, message: parsed.message, statusText: parsed.status };
    }
    const json = await res.json();
    const models = (json.data || []).map(m => m.id);
    const preferred = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];
    const pick = model && models.includes(model) ? model : preferred.find(m => models.includes(m)) || models[0];
    return { ok: true, models, recommended: pick };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

function parseResult(raw, data) {
  let obj;
  try { obj = JSON.parse(raw); }
  catch { throw apiError('PARSE_FAIL', '', 0); }

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

function parseGeminiError(body) {
  let message = '', status = '', isRegionBlock = false;
  try {
    const j = JSON.parse(body);
    message = j?.error?.message || '';
    status = j?.error?.status || '';
  } catch { message = body.slice(0, 200); }
  if (message.includes('location') && message.includes('billing')) isRegionBlock = true;
  if (status === 'RESOURCE_EXHAUSTED' && message.includes('location')) isRegionBlock = true;
  return { message, status, isRegionBlock };
}

function parseOpenAIError(body) {
  let message = '', status = '';
  try {
    const j = JSON.parse(body);
    message = j?.error?.message || '';
    status = j?.error?.type || j?.error?.code || '';
  } catch { message = body.slice(0, 200); }
  return { message, status };
}

function apiError(code, message, httpStatus, apiStatus) {
  const e = new Error(code);
  e.code = code;
  e.message = message;
  e.httpStatus = httpStatus;
  e.apiStatus = apiStatus;
  e.isRegionBlock = !!(message && message.includes('location') && message.includes('billing'));
  return e;
}
