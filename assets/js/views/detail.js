import { t, ui, catName, getLang } from '../i18n.js';

export function render(data, app, id) {
  const lang = getLang();
  const m = data.models.find(x => x.id === id);
  if (!m) {
    app.innerHTML = `<div class="empty-hint">${lang === 'en' ? 'Model not found.' : '找不到這個模式。'}<br><a href="#/">← ${ui('backToList')}</a></div>`;
    return;
  }

  const altName = lang === 'en' ? m.name_zh : m.name_en;
  const def = lang === 'en' ? m.definition_en : m.definition_zh;
  const sce = lang === 'en' ? m.scenarios_en : m.scenarios_zh;

  app.innerHTML = `
    <div class="detail-wrap">
      <a href="#/" class="back-link">${ui('backToList')}</a>
      <div class="detail-card">
        <span class="detail-num">No.${m.number} · ${m.cases ? '' : ''}</span>
        <div class="detail-cat-tag">${catName(m.category, data)}</div>
        <h1 class="detail-title-zh">${lang === 'en' ? m.name_en : m.name_zh}</h1>
        <p class="detail-title-en">${altName}</p>

        <div class="detail-section">
          <h3>📖 ${ui('definition')}</h3>
          <p>${def}</p>
        </div>

        <div class="detail-section">
          <h3>🎯 ${ui('scenarios')}</h3>
          <p>${sce}</p>
        </div>

        <div class="detail-section">
          <h3>💡 ${ui('cases')}</h3>
          <div class="case-list">
            ${m.cases.map(c => `
              <div class="case-item">
                <div class="case-title">${lang === 'en' ? c.title_en : c.title_zh}<span class="en">${lang === 'en' ? c.title_zh : c.title_en}</span></div>
                <div class="case-desc">${lang === 'en' ? c.desc_en : c.desc_zh}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="detail-actions">
          <a href="#/advisor?model=${m.id}" class="btn btn-primary">✨ ${ui('askAdvisor')}</a>
          <a href="#/" class="btn btn-secondary">${ui('backToList')}</a>
        </div>
      </div>
    </div>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
