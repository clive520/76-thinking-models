import { t, ui, catName, getLang } from '../i18n.js';

let activeFilter = 'all';
let searchTerm = '';

export function render(data, app) {
  app.innerHTML = `
    <section class="hero">
      <h1>${ui('siteTitle')}</h1>
      <p>${ui('heroSubtitle')}</p>
      <div class="hero-actions">
        <a href="#/advisor" class="btn btn-primary">✨ ${ui('tryAdvisor')}</a>
        <a href="#/about" class="btn btn-secondary">${ui('navAbout')}</a>
      </div>
    </section>

    <div class="filter-bar" id="filterBar">
      <input type="search" class="search-box" id="searchBox" placeholder="${ui('searchPlaceholder')}" />
      <button class="filter-chip active" data-cat="all">${ui('allCategories')}</button>
      ${data.categories.map(c => `<button class="filter-chip" data-cat="${c.id}">${catName(c.id, data)}</button>`).join('')}
    </div>

    <div id="modelSections"></div>
  `;

  bind(data);
  drawSections(data);
}

function bind(data) {
  const searchBox = document.getElementById('searchBox');
  searchBox.value = searchTerm;
  searchBox.addEventListener('input', e => {
    searchTerm = e.target.value.trim().toLowerCase();
    drawSections(data);
  });

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.cat;
      drawSections(data);
    });
  });
}

function drawSections(data) {
  const wrap = document.getElementById('modelSections');
  const lang = getLang();
  const cats = activeFilter === 'all' ? data.categories : data.categories.filter(c => c.id === activeFilter);

  let totalShown = 0;
  const html = cats.map(cat => {
    let models = data.models.filter(m => m.category === cat.id);
    if (searchTerm) {
      models = models.filter(m => {
        const hay = `${m.name_zh} ${m.name_en} ${m.definition_zh} ${m.definition_en} ${m.scenarios_zh} ${m.scenarios_en}`.toLowerCase();
        return hay.includes(searchTerm);
      });
    }
    if (models.length === 0) return '';
    totalShown += models.length;
    return `
      <section class="cat-section">
        <div class="cat-header">
          <h2>${catName(cat.id, data)}</h2>
          <span class="cat-count">${models.length}</span>
        </div>
        <div class="model-grid">
          ${models.map(m => `
            <a class="model-card" href="#/model/${m.id}">
              <span class="num">No.${m.number}</span>
              <span class="name-zh">${lang === 'en' ? m.name_en : m.name_zh}</span>
              <span class="name-en">${lang === 'en' ? m.name_zh : m.name_en}</span>
              <span class="def">${lang === 'en' ? m.definition_en : m.definition_zh}</span>
            </a>
          `).join('')}
        </div>
      </section>
    `;
  }).join('');

  wrap.innerHTML = html || `<div class="empty-hint">${searchTerm ? '🔍 ' + (lang === 'en' ? 'No models found' : '找不到符合的模式') : ''}</div>`;
}
