import { ui, getLang, catName } from '../i18n.js';
import { getSettings, saveSettings, hasKey, analyze, getProviders, getProviderInfo, testConnection } from '../ai-client.js';

let working = false;

export function render(data, app, query) {
  const lang = getLang();
  const settings = getSettings();
  const providers = getProviders();
  const prefillModel = query.model ? data.models.find(m => m.id === query.model) : null;

  app.innerHTML = `
    <div class="advisor-wrap">
      <div class="advisor-card">
        <h2>✨ ${ui('advisorTitle')}</h2>
        <p class="sub">${ui('advisorSub')}</p>

        ${prefillModel ? `
          <div class="case-item" style="margin-bottom:18px;border-color:var(--accent)">
            <div class="case-title">${lang === 'en' ? 'Context model' : '參考模式'}：${lang === 'en' ? prefillModel.name_en : prefillModel.name_zh}<span class="en">${lang === 'en' ? prefillModel.name_zh : prefillModel.name_en}</span></div>
            <div class="case-desc">${lang === 'en' ? prefillModel.definition_en : prefillModel.definition_zh}</div>
          </div>
        ` : ''}

        <div class="form-group">
          <label>${ui('situationLabel')}</label>
          <textarea id="situation" placeholder="${ui('situationPlaceholder')}"></textarea>
        </div>
        <div class="form-group">
          <label>${ui('proposalLabel')}</label>
          <textarea id="proposal" placeholder="${ui('proposalPlaceholder')}"></textarea>
        </div>

        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <button id="analyzeBtn" class="btn btn-primary">🔍 ${ui('analyze')}</button>
          <button id="settingsToggle" class="settings-toggle">⚙ ${ui('settings')}</button>
          <span id="keyStatus" class="api-status ${hasKey() ? 'ok' : 'missing'}">${hasKey() ? (lang === 'en' ? '✓ Key set' : '✓ 已設定 Key') : (lang === 'en' ? '⚠ No key' : '⚠ 未設定 Key')}</span>
        </div>

        <div class="settings-panel" id="settingsPanel">
          <div class="form-group">
            <label>${ui('providerLabel')}</label>
            <select id="providerSelect">
              ${providers.map(p => `<option value="${p.id}" ${p.id === settings.provider ? 'selected' : ''}>${p.label}</option>`).join('')}
            </select>
            <p class="hint" id="providerHint"></p>
          </div>
          <div class="form-group">
            <label>${ui('apiKeyLabel')}</label>
            <input type="password" id="apiKeyInput" value="${settings.apiKey.replace(/"/g, '&quot;')}" placeholder="paste your API key" autocomplete="off" />
            <p class="hint">${ui('apiKeyHint')} <a href="#" id="keyUrl" target="_blank" rel="noopener">${ui('getKey')}</a></p>
          </div>
          <div class="form-group">
            <label>${ui('modelLabel')}</label>
            <input type="text" id="modelInput" value="${settings.model || ''}" placeholder="${ui('modelPlaceholder')}" autocomplete="off" />
            <p class="hint" id="modelHint"></p>
          </div>
          <div class="form-group">
            <label>${ui('resultInLang')}</label>
            <select id="respLang">
              <option value="auto" ${settings.responseLang === 'auto' ? 'selected' : ''}>${ui('followLang')}</option>
              <option value="zh" ${settings.responseLang === 'zh' ? 'selected' : ''}>繁體中文</option>
              <option value="en" ${settings.responseLang === 'en' ? 'selected' : ''}>English</option>
            </select>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <button id="testBtn" class="btn btn-secondary">🔌 ${ui('testConnection')}</button>
            <button id="saveSettings" class="btn btn-primary">💾 ${ui('save')}</button>
            <span id="saveStatus" class="hint"></span>
          </div>
          <div id="testResult" style="margin-top:12px"></div>
        </div>
      </div>

      <div id="resultArea">
        <div class="empty-hint">${ui('emptyResult')}</div>
      </div>
    </div>
  `;

  bind(data, prefillModel);
  updateProviderHint();
}

function bind(data, prefillModel) {
  const lang = getLang();

  document.getElementById('settingsToggle').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.toggle('open');
  });

  document.getElementById('providerSelect').addEventListener('change', () => {
    updateProviderHint();
    document.getElementById('modelInput').value = '';
  });

  document.getElementById('saveSettings').addEventListener('click', () => {
    const next = saveSettings({
      provider: document.getElementById('providerSelect').value,
      apiKey: document.getElementById('apiKeyInput').value.trim(),
      model: document.getElementById('modelInput').value.trim(),
      responseLang: document.getElementById('respLang').value,
    });
    const status = document.getElementById('keyStatus');
    status.className = 'api-status ' + (next.apiKey ? 'ok' : 'missing');
    status.textContent = next.apiKey ? (lang === 'en' ? '✓ Key set' : '✓ 已設定 Key') : (lang === 'en' ? '⚠ No key' : '⚠ 未設定 Key');
    const sv = document.getElementById('saveStatus');
    sv.textContent = ui('saved');
    setTimeout(() => { sv.textContent = ''; }, 2000);
  });

  document.getElementById('testBtn').addEventListener('click', runTest);
  document.getElementById('analyzeBtn').addEventListener('click', () => runAnalyze(data, prefillModel));
}

function updateProviderHint() {
  const id = document.getElementById('providerSelect').value;
  const info = getProviderInfo(id);
  const lang = getLang();
  document.getElementById('providerHint').innerHTML = info.keyHint[lang] + ' <a href="' + info.keyUrl + '" target="_blank" rel="noopener">' + info.keyUrl + '</a>';
  const keyUrl = document.getElementById('keyUrl');
  if (keyUrl) keyUrl.href = info.keyUrl;
  const modelHint = document.getElementById('modelHint');
  if (modelHint) modelHint.textContent = info.modelHint[lang];
}

async function runTest() {
  const lang = getLang();
  const provider = document.getElementById('providerSelect').value;
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const model = document.getElementById('modelInput').value.trim();
  const out = document.getElementById('testResult');

  if (!apiKey) {
    out.innerHTML = `<div class="error-msg">${lang === 'en' ? 'Please enter an API key first.' : '請先輸入 API Key。'}</div>`;
    return;
  }

  const btn = document.getElementById('testBtn');
  btn.disabled = true;
  btn.textContent = '⏳ ' + (lang === 'en' ? 'Testing…' : '測試中…');
  out.innerHTML = `<div class="loading"><span class="spinner"></span>${lang === 'en' ? 'Testing connection…' : '測試連線中…'}</div>`;

  try {
    const result = await testConnection(provider, apiKey, model);
    if (result.ok) {
      const modelsList = result.models.slice(0, 12).join(', ') + (result.models.length > 12 ? '…' : '');
      out.innerHTML = `
        <div class="api-status ok" style="padding:14px;background:rgba(107,207,127,0.1);border:1px solid rgba(107,207,127,0.3);border-radius:8px">
          ✅ ${lang === 'en' ? 'Connection OK!' : '連線成功！'}<br>
          <strong>${lang === 'en' ? 'Recommended model' : '建議模型'}:</strong> <code>${result.recommended}</code><br>
          <details style="margin-top:6px"><summary style="cursor:pointer;color:var(--text-muted)">${lang === 'en' ? 'Available models' : '可用模型'} (${result.models.length})</summary><div style="margin-top:6px;font-size:0.85rem;color:var(--text-muted)">${modelsList}</div></details>
        </div>`;
      const modelInput = document.getElementById('modelInput');
      if (!modelInput.value.trim()) modelInput.value = result.recommended;
    } else {
      const msg = result.message || 'Unknown error';
      const isRegion = result.isRegionBlock || (msg.includes('location') && msg.includes('billing'));
      out.innerHTML = `
        <div class="error-msg">
          ❌ ${lang === 'en' ? 'Connection failed' : '連線失敗'} (HTTP ${result.status || '?'})<br>
          <span style="font-size:0.9rem">${escapeHtml(msg)}</span>
          ${isRegion ? `
            <div style="margin-top:10px;padding:10px;background:rgba(255,180,84,0.1);border-radius:6px;border:1px solid rgba(255,180,84,0.3)">
              ⚠️ <strong>${lang === 'en' ? 'Region restriction detected.' : '偵測到地區限制。'}</strong>
              ${lang === 'en'
                ? 'Gemini free tier is not available in your region. Options: (1) Link a billing account to your Google AI project (paid, pay-per-use); (2) Switch to <strong>Groq</strong> which has no region restrictions.'
                : 'Gemini 免費層在你的地區無法使用。可選：(1) 在 Google AI 專案綁定計費帳戶（付費，按用量計）；(2) 切換到 <strong>Groq</strong>，無地區限制。'}
            </div>` : ''}
        </div>`;
    }
  } catch (e) {
    out.innerHTML = `<div class="error-msg">${escapeHtml(e.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '🔌 ' + ui('testConnection');
  }
}

async function runAnalyze(data, prefillModel) {
  if (working) return;
  const lang = getLang();
  const situation = document.getElementById('situation').value.trim();
  const proposal = document.getElementById('proposal').value.trim();
  const area = document.getElementById('resultArea');

  if (!situation) {
    area.innerHTML = `<div class="error-msg">${lang === 'en' ? 'Please describe your situation first.' : '請先描述你的情境。'}</div>`;
    return;
  }
  if (!hasKey()) {
    document.getElementById('settingsPanel').classList.add('open');
    area.innerHTML = `<div class="error-msg">${ui('noKeyWarn')}</div>`;
    return;
  }

  working = true;
  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.textContent = '⏳ ' + ui('analyzing');
  area.innerHTML = `<div class="loading"><span class="spinner"></span>${ui('analyzing')}</div>`;

  const fullSituation = prefillModel
    ? `${situation}\n\n[${lang === 'en' ? 'I am referencing this model' : '我想參考這個模式'}: ${lang === 'en' ? prefillModel.name_en : prefillModel.name_zh}]`
    : situation;

  try {
    const result = await analyze(data, fullSituation, proposal);
    area.innerHTML = renderResult(result, data, lang);
  } catch (err) {
    area.innerHTML = renderError(err, lang);
  } finally {
    working = false;
    btn.disabled = false;
    btn.textContent = '🔍 ' + ui('analyze');
  }
}

function renderResult(result, data, lang) {
  const recs = result.recommendations || [];
  const strategies = result.strategies || [];

  if (recs.length === 0 && strategies.length === 0) {
    return `<div class="error-msg">${ui('errorGeneric')}</div>`;
  }

  return `
    <div class="advisor-card">
      ${recs.length ? `
        <div class="result-section">
          <h3>🧠 ${ui('recommended')}</h3>
          <div class="rec-list">
            ${recs.map((r, i) => `
              <div class="rec-item">
                <span class="rec-num">${i + 1}</span>
                <div class="rec-body">
                  <div class="rec-name"><a href="#/model/${r.model.id}">${lang === 'en' ? r.model.name_en : r.model.name_zh}</a> <span style="color:var(--text-muted);font-size:0.85rem">${lang === 'en' ? r.model.name_zh : r.model.name_en}</span></div>
                  <div class="rec-reason">${r.reason}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${strategies.length ? `
        <div class="result-section">
          <h3>🎯 ${ui('strategies')}</h3>
          <div class="strategy-list">
            ${strategies.map(s => `
              <div class="strategy-item">
                <div class="s-title">${s.title}</div>
                <div class="s-desc">${s.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderError(err, lang) {
  if (err.code === 'NO_KEY') {
    return `<div class="error-msg">${ui('noKeyWarn')}</div>`;
  }

  const apiMsg = err.message || '';
  const isRegion = err.isRegionBlock || (apiMsg.includes('location') && apiMsg.includes('billing'));

  if (err.code === 'HTTP_429') {
    if (isRegion) {
      return `<div class="error-msg">
        ❌ ${lang === 'en' ? '<strong>Region restriction</strong>' : '<strong>地區限制</strong>'}
        <div style="margin-top:8px">${escapeHtml(apiMsg)}</div>
        <div style="margin-top:10px;padding:10px;background:rgba(255,180,84,0.1);border-radius:6px;border:1px solid rgba(255,180,84,0.3)">
          ⚠️ ${lang === 'en'
            ? 'Gemini free tier is not available in your region. <strong>Switch to Groq</strong> in Settings (no region restrictions), or link a billing account to your Google AI project.'
            : 'Gemini 免費層在你的地區無法使用。請在設定中<strong>切換到 Groq</strong>（無地區限制），或在 Google AI 專案綁定計費帳戶。'}
        </div>
      </div>`;
    }
    return `<div class="error-msg">⏳ ${lang === 'en' ? 'Rate limit reached — wait a minute and retry.' : '已達速率限制，請稍候一分鐘再試。'}<br><span style="font-size:0.85rem">${escapeHtml(apiMsg)}</span></div>`;
  }
  if (err.code === 'HTTP_404') {
    return `<div class="error-msg">❌ ${lang === 'en' ? 'Model not found. The model may have been deprecated. Use the "Test connection" button to find available models.' : '找不到模型，可能已被淘汰。請用「測試連線」按鈕查詢可用模型。'}<br><span style="font-size:0.85rem">${escapeHtml(apiMsg)}</span></div>`;
  }
  if (err.code === 'HTTP_401' || err.code === 'HTTP_403') {
    return `<div class="error-msg">🔑 ${lang === 'en' ? 'API key invalid or access denied. Check your key.' : 'API Key 無效或被拒，請檢查金鑰。'}<br><span style="font-size:0.85rem">${escapeHtml(apiMsg)}</span></div>`;
  }
  if (err.code === 'PARSE_FAIL') {
    return `<div class="error-msg">${lang === 'en' ? 'AI response could not be parsed. Try again.' : 'AI 回應格式無法解析，請重試。'}</div>`;
  }
  if (err.code === 'EMPTY_RESPONSE') {
    return `<div class="error-msg">${lang === 'en' ? 'AI returned an empty response. Try again.' : 'AI 回應為空，請重試。'}</div>`;
  }
  if (err.code === 'ALL_MODELS_FAILED') {
    return `<div class="error-msg">${lang === 'en' ? 'All model options failed. Use "Test connection" to check available models.' : '所有模型皆失敗，請用「測試連線」檢查可用模型。'}<br><span style="font-size:0.85rem">${escapeHtml(apiMsg)}</span></div>`;
  }
  return `<div class="error-msg">${ui('errorGeneric')}<br><span style="font-size:0.85rem;color:var(--text-muted)">${escapeHtml(apiMsg || err.code)}</span></div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
