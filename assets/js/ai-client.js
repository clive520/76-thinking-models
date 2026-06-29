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
    apiType: 'gemini',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyHint: {
      zh: '至 Google AI Studio 申請。注意：Gemini「免費層」有地區限制，台灣等地區可能需綁定計費帳戶才能使用。',
      en: 'Get a key at Google AI Studio. Note: Gemini free tier has region restrictions — some regions require a billing account.'
    },
    modelFallbacks: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-1.5-flash'],
    modelHint: { zh: '留空自動偵測；也可手動填入如 gemini-2.5-flash', en: 'Leave empty for auto-detect; or enter e.g. gemini-2.5-flash' },
  },
  groq: {
    label: 'Groq',
    apiType: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com/keys',
    keyHint: { zh: '至 Groq Console 免費申請，速度極快，無地區限制。推薦台灣使用者使用。', en: 'Get a free key at Groq Console. Very fast, no region restrictions. Recommended for restricted regions.' },
    modelFallbacks: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'],
    modelHint: { zh: '留空自動偵測；也可手動填入如 llama-3.3-70b-versatile', en: 'Leave empty for auto-detect; or enter e.g. llama-3.3-70b-versatile' },
  },
  openai: {
    label: 'OpenAI',
    apiType: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyHint: { zh: '付費服務，需綁定信用卡。新帳號可能有免費試用額度。', en: 'Paid service, credit card required. New accounts may have trial credits.' },
    modelFallbacks: ['gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o-mini', 'gpt-4o'],
    modelHint: { zh: '留空自動偵測；也可手動填入如 gpt-4.1-mini', en: 'Leave empty for auto-detect; or enter e.g. gpt-4.1-mini' },
  },
  openrouter: {
    label: 'OpenRouter',
    apiType: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai/keys',
    keyHint: { zh: '聚合 300+ 模型的閘道，含免費模型（名稱結尾 :free）。', en: 'Gateway to 300+ models, includes free ones (names ending :free).' },
    modelFallbacks: ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.1-8b-instruct:free'],
    modelHint: { zh: '留空自動偵測；免費模型名稱含 :free，例如 meta-llama/llama-3.3-70b-instruct:free', en: 'Leave empty for auto-detect; free models end with :free, e.g. meta-llama/llama-3.3-70b-instruct:free' },
    extraHeaders: { 'X-Title': '76 Thinking Models' },
  },
  nvidia: {
    label: 'NVIDIA NIM',
    apiType: 'openai',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    keyUrl: 'https://build.nvidia.com',
    keyHint: { zh: '至 NVIDIA build.ngc.nvidia.com 申請 NGC API Key，註冊即送 1000 免費點數。', en: 'Get an NGC API key at build.nvidia.com — 1000 free credits on signup.' },
    modelFallbacks: ['meta/llama-3.3-70b-instruct', 'meta/llama-3.1-70b-instruct', 'meta/llama-3.1-8b-instruct'],
    modelHint: { zh: '留空自動偵測；也可手動填入如 meta/llama-3.3-70b-instruct', en: 'Leave empty for auto-detect; or enter e.g. meta/llama-3.3-70b-instruct' },
  },
  opencode: {
    label: 'OpenCode Zen',
    apiType: 'openai',
    baseUrl: 'https://opencode.ai/zen/v1',
    keyUrl: 'https://opencode.ai/auth',
    keyHint: { zh: 'OpenCode Zen 付費閘道（加值 20 美元起），含 5 個免費模型可試用。', en: 'OpenCode Zen paid gateway ($20 top-up), includes 5 free trial models.' },
    modelFallbacks: ['big-pickle', 'deepseek-v4-flash-free', 'mimo-v2.5-free', 'north-mini-code-free', 'nemotron-3-ultra-free', 'glm-5.2'],
    modelHint: { zh: '留空自動偵測；免費模型如 big-pickle、deepseek-v4-flash-free', en: 'Leave empty for auto-detect; free models like big-pickle, deepseek-v4-flash-free' },
  },
  'opencode-go': {
    label: 'OpenCode Go',
    apiType: 'openai',
    baseUrl: 'https://opencode.ai/zen/go/v1',
    keyUrl: 'https://opencode.ai/auth',
    keyHint: { zh: 'OpenCode Go 低價訂閱：首月 $5、之後 $10/月，含 13 個開源模型（GLM-5.2、DeepSeek V4、Kimi K2.7 等）。主機在美/歐/新加坡，全球穩定。', en: 'OpenCode Go low-cost subscription: $5 first month, then $10/month, 13 open models (GLM-5.2, DeepSeek V4, Kimi K2.7...). Hosted in US/EU/Singapore.' },
    modelFallbacks: ['glm-5.2', 'deepseek-v4-flash', 'kimi-k2.7', 'glm-5.1', 'mimo-v2.5-pro', 'deepseek-v4-pro', 'kimi-k2.6', 'mimo-v2.5'],
    modelHint: { zh: '留空自動偵測；可填 glm-5.2、deepseek-v4-flash、kimi-k2.7 等', en: 'Leave empty for auto-detect; e.g. glm-5.2, deepseek-v4-flash, kimi-k2.7' },
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
    const err = apiError('NO_KEY', '', 0);
    throw err;
  }
  const info = getProviderInfo(settings.provider);
  const lang = settings.responseLang === 'auto' ? getLang() : settings.responseLang;
  const systemPrompt = buildSystemPrompt(data, lang);
  const userPrompt = buildUserPrompt(situation, proposal, lang);

  let raw;
  if (info.apiType === 'gemini') {
    raw = await callGemini(settings, info, systemPrompt, userPrompt);
  } else {
    raw = await callOpenAICompatible(settings, info, systemPrompt, userPrompt);
  }
  return parseResult(raw, data);
}

async function callGemini(settings, info, systemPrompt, userPrompt) {
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

async function callOpenAICompatible(settings, info, systemPrompt, userPrompt) {
  const candidates = settings.model ? [settings.model, ...info.modelFallbacks] : info.modelFallbacks;
  const seen = new Set();
  let lastErr = null;
  const url = `${info.baseUrl}/chat/completions`;

  for (const model of candidates) {
    if (seen.has(model)) continue;
    seen.add(model);
    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    };
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` };
    if (info.extraHeaders) Object.assign(headers, info.extraHeaders);

    const res = await fetch(url, {
      method: 'POST',
      headers,
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
    if (res.status === 404 || parsed.status === 'NOT_FOUND' || /not found|does not exist|deprecat/i.test(parsed.message)) {
      lastErr = apiError(`HTTP_${res.status}`, parsed.message, res.status, parsed.status);
      continue;
    }
    if (res.status === 429) {
      lastErr = apiError(`HTTP_429`, parsed.message, 429, parsed.status);
      continue;
    }
    throw apiError(`HTTP_${res.status}`, parsed.message, res.status, parsed.status);
  }
  throw lastErr || apiError('ALL_MODELS_FAILED', '', 0);
}

export async function testConnection(providerId, apiKey, model) {
  if (!apiKey) return { ok: false, message: 'NO_KEY' };
  const info = getProviderInfo(providerId);
  if (info.apiType === 'gemini') return testGemini(apiKey, model, info);
  return testOpenAICompatible(apiKey, model, info);
}

async function testGemini(apiKey, model, info) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const parsed = parseGeminiError(body);
      return { ok: false, status: res.status, message: parsed.message, isRegionBlock: parsed.isRegionBlock };
    }
    const json = await res.json();
    const models = (json.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
    if (models.length === 0) return { ok: false, message: 'No text models available for this key.' };
    const pick = model && models.includes(model) ? model : info.modelFallbacks.find(m => models.includes(m)) || models[0];
    return { ok: true, models, recommended: pick };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

async function testOpenAICompatible(apiKey, model, info) {
  const url = `${info.baseUrl}/models`;
  try {
    const headers = { Authorization: `Bearer ${apiKey}` };
    if (info.extraHeaders) Object.assign(headers, info.extraHeaders);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const parsed = parseOpenAIError(body);
      return { ok: false, status: res.status, message: parsed.message };
    }
    const json = await res.json();
    const models = (json.data || json.models || []).map(m => m.id || m.name || '');
    const filtered = models.filter(Boolean);
    if (filtered.length === 0) return { ok: false, message: 'No models returned for this key.' };
    const pick = model && filtered.includes(model) ? model : info.modelFallbacks.find(m => filtered.includes(m)) || filtered[0];
    return { ok: true, models: filtered, recommended: pick };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

function parseResult(raw, data) {
  const cleaned = extractJson(raw);
  let obj;
  try { obj = JSON.parse(cleaned); }
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

function extractJson(text) {
  if (!text) return '';
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  if (s.startsWith('{') || s.startsWith('[')) return s;
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) return s.slice(first, last + 1);
  return s;
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
    message = j?.error?.message || j?.message || '';
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
