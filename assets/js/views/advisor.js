import { ui, getLang, catName } from '../i18n.js';
import { getSettings, saveSettings, hasKey, analyze, getProviders, getProviderInfo } from '../ai-client.js';

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
            <label>${ui('resultInLang')}</label>
            <select id="respLang">
              <option value="auto" ${settings.responseLang === 'auto' ? 'selected' : ''}>${ui('followLang')}</option>
              <option value="zh" ${settings.responseLang === 'zh' ? 'selected' : ''}>繁體中文</option>
              <option value="en" ${settings.responseLang === 'en' ? 'selected' : ''}>English</option>
            </select>
          </div>
          <button id="saveSettings" class="btn btn-secondary">💾 ${ui('save')}</button>
          <span id="saveStatus" class="hint" style="margin-left:8px"></span>
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

  document.getElementById('providerSelect').addEventListener('change', updateProviderHint);

  document.getElementById('saveSettings').addEventListener('click', () => {
    const next = saveSettings({
      provider: document.getElementById('providerSelect').value,
      apiKey: document.getElementById('apiKeyInput').value.trim(),
      responseLang: document.getElementById('respLang').value,
    });
    const status = document.getElementById('keyStatus');
    status.className = 'api-status ' + (next.apiKey ? 'ok' : 'missing');
    status.textContent = next.apiKey ? (lang === 'en' ? '✓ Key set' : '✓ 已設定 Key') : (lang === 'en' ? '⚠ No key' : '⚠ 未設定 Key');
    const sv = document.getElementById('saveStatus');
    sv.textContent = ui('saved');
    setTimeout(() => { sv.textContent = ''; }, 2000);
  });

  document.getElementById('analyzeBtn').addEventListener('click', () => runAnalyze(data, prefillModel));
}

function updateProviderHint() {
  const id = document.getElementById('providerSelect').value;
  const info = getProviderInfo(id);
  const lang = getLang();
  const hint = document.getElementById('providerHint');
  hint.innerHTML = `${info.keyHint[lang]} <a href="${info.keyUrl}" target="_blank" rel="noopener">${info.keyUrl}</a>`;
  const keyUrl = document.getElementById('keyUrl');
  if (keyUrl) { keyUrl.href = info.keyUrl; }
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
  let msg = ui('errorGeneric');
  if (err.code && err.code.startsWith('HTTP_')) {
    const status = err.code.replace('HTTP_', '');
    if (status === '400' || status === '401' || status === '403') {
      msg = lang === 'en' ? 'API key invalid or request rejected. Please check your key.' : 'API Key 無效或請求被拒，請檢查金鑰。';
    } else if (status === '429') {
      msg = lang === 'en' ? 'Rate limit reached — wait a moment and retry.' : '已達免費額度上限，請稍後再試。';
    } else {
      msg = `${msg} (HTTP ${status})`;
    }
  } else if (err.code === 'PARSE_FAIL') {
    msg = lang === 'en' ? 'AI response could not be parsed. Try again.' : 'AI 回應格式無法解析，請重試。';
  } else if (err.code === 'EMPTY_RESPONSE') {
    msg = lang === 'en' ? 'AI returned an empty response. Try again.' : 'AI 回應為空，請重試。';
  }
  return `<div class="error-msg">${msg}</div>`;
}
