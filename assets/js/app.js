import { applyUiTranslations, getLang } from './i18n.js';
import { render as overviewView } from './views/overview.js';
import { render as detailView } from './views/detail.js';
import { render as advisorView } from './views/advisor.js';
import { render as aboutView } from './views/about.js';

let data = null;

async function loadData() {
  const res = await fetch('data/models.json');
  if (!res.ok) throw new Error('Failed to load data');
  data = await res.json();
  return data;
}

function parseQuery(hash) {
  const qIndex = hash.indexOf('?');
  if (qIndex < 0) return {};
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  const obj = {};
  params.forEach((v, k) => { obj[k] = v; });
  return obj;
}

function route() {
  const app = document.getElementById('app');
  let hash = location.hash.slice(1) || '/';
  const query = parseQuery(hash);
  hash = hash.split('?')[0];

  setActiveNav(hash);

  if (!data) {
    app.innerHTML = `<div class="loading"><span class="spinner"></span>Loading…</div>`;
    return;
  }

  if (hash === '/' || hash === '') {
    overviewView(data, app);
  } else if (hash.startsWith('/model/')) {
    const id = hash.replace('/model/', '');
    detailView(data, app, id);
  } else if (hash.startsWith('/advisor')) {
    advisorView(data, app, query);
  } else if (hash.startsWith('/about')) {
    aboutView(data, app);
  } else {
    app.innerHTML = `<div class="empty-hint">404 · <a href="#/">${getLang() === 'en' ? 'Home' : '首頁'}</a></div>`;
  }
  window.scrollTo({ top: 0 });
}

function setActiveNav(hash) {
  const top = hash.split('/')[1] || '';
  document.querySelectorAll('.site-nav a').forEach(a => {
    const href = a.getAttribute('href');
    const matchTop = href.replace(/^#\//, '').split('/')[0] || '';
    a.classList.toggle('active', top === matchTop);
  });
}

function bindLangToggle() {
  document.getElementById('langToggle').addEventListener('click', () => {
    import('./i18n.js').then(({ toggleLang }) => {
      toggleLang();
      applyUiTranslations();
      route();
    });
  });
}

async function init() {
  applyUiTranslations();
  bindLangToggle();
  try {
    await loadData();
  } catch (e) {
    document.getElementById('app').innerHTML = `<div class="error-msg">Failed to load models data. ${e.message}</div>`;
    return;
  }
  route();
}

window.addEventListener('hashchange', route);
init();
