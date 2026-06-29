const LANG_KEY = 'tm_lang';
let lang = localStorage.getItem(LANG_KEY) || 'zh';

export function getLang() { return lang; }
export function setLang(l) { lang = l; localStorage.setItem(LANG_KEY, l); }
export function toggleLang() { return (lang = lang === 'zh' ? 'en' : 'zh'); }

export function t(field) {
  return field[lang] ?? field.zh ?? field.en ?? '';
}

const UI = {
  siteTitle: { zh: '76 個人類思考模式', en: '76 Thinking Models' },
  navModels: { zh: '思考模式', en: 'Models' },
  navAdvisor: { zh: 'AI 諮詢', en: 'AI Advisor' },
  navAbout: { zh: '關於', en: 'About' },
  footerText: { zh: '76 個人類思考模式 · 內容以 CC BY 4.0 授權 · 程式碼以 MIT 授權', en: '76 Thinking Models · Content CC BY 4.0 · Code MIT' },
  heroSubtitle: { zh: '認識思考工具，升級你的決策品質', en: 'Mental tools to upgrade your decision-making' },
  browseModels: { zh: '瀏覽 76 種模式', en: 'Browse 76 models' },
  tryAdvisor: { zh: '試試 AI 諮詢', en: 'Try AI advisor' },
  searchPlaceholder: { zh: '搜尋模式名稱或關鍵字…', en: 'Search models…' },
  allCategories: { zh: '全部', en: 'All' },
  definition: { zh: '定義', en: 'Definition' },
  scenarios: { zh: '應用場景', en: 'When to Apply' },
  cases: { zh: '實際案例', en: 'Real-World Cases' },
  backToList: { zh: '← 返回列表', en: '← Back to list' },
  askAdvisor: { zh: '用此模式諮詢 AI', en: 'Ask AI with this model' },
  advisorTitle: { zh: 'AI 思考諮詢', en: 'AI Thinking Advisor' },
  advisorSub: { zh: '輸入你的情境，AI 會推薦適用的思考模式並提供解決對策。', en: 'Describe your situation — AI recommends fitting models and proposes strategies.' },
  situationLabel: { zh: '你的情境', en: 'Your situation' },
  situationPlaceholder: { zh: '例如：我考慮辭職創業，但不確定風險該不該承擔…', en: 'e.g., I\'m considering quitting to start a business but unsure about the risk…' },
  proposalLabel: { zh: '你的初步想法（選填）', en: 'Your initial idea (optional)' },
  proposalPlaceholder: { zh: '你目前傾向的做法或方案…', en: 'The approach you\'re currently leaning toward…' },
  analyze: { zh: '分析', en: 'Analyze' },
  analyzing: { zh: '分析中…', en: 'Analyzing…' },
  recommended: { zh: '推薦的思考模式', en: 'Recommended Models' },
  strategies: { zh: '解決對策', en: 'Strategies' },
  settings: { zh: '設定', en: 'Settings' },
  providerLabel: { zh: 'AI 服務', en: 'AI provider' },
  apiKeyLabel: { zh: 'API Key', en: 'API Key' },
  apiKeyHint: { zh: '金鑰僅存在你的瀏覽器，不會送出本站。', en: 'Your key stays in your browser only — never sent to this site.' },
  save: { zh: '儲存', en: 'Save' },
  saved: { zh: '已儲存', en: 'Saved' },
  noKeyWarn: { zh: '尚未設定 API Key，請先在「設定」中填入。', en: 'No API key set — add one in Settings first.' },
  getKey: { zh: '如何取得免費 Key？', en: 'How to get a free key?' },
  modelLabel: { zh: '模型名稱（選填）', en: 'Model name (optional)' },
  modelPlaceholder: { zh: '留空自動偵測', en: 'Leave empty for auto-detect' },
  testConnection: { zh: '測試連線', en: 'Test connection' },
  resultInLang: { zh: '回應語言', en: 'Response language' },
  followLang: { zh: '跟隨介面', en: 'Follow UI' },
  emptyResult: { zh: '分析結果會顯示在這裡。', en: 'Results will appear here.' },
  aboutTitle: { zh: '關於本站', en: 'About' },
  aboutIntro: { zh: '本站彙整 76 個來自決策、系統、心理、經濟、機率、自然等領域的通用思考模式（心智模型），協助你升級決策品質。', en: 'This site compiles 76 general-purpose thinking models (mental models) from decision-making, systems, psychology, economics, probability, and nature to upgrade your decisions.' },
  aboutContent: { zh: '所有模式', en: 'All models' },
  aboutAI: { zh: 'AI 諮詢功能', en: 'AI advisor' },
  aboutAIText: { zh: 'AI 諮詢在瀏覽器端直接呼叫免費 AI API，不需後端伺服器。你的 API Key 只存在自己的瀏覽器中。', en: 'The advisor calls free AI APIs directly from your browser — no backend. Your API key lives only in your browser.' },
  aboutLicense: { zh: '授權', en: 'License' },
  aboutLicenseText: { zh: '內容以 CC BY 4.0 授權，程式碼以 MIT 授權。所有文字描述與案例皆為原創，未抄襲任何書籍原文。', en: 'Content is CC BY 4.0, code is MIT. All descriptions and cases are original — no book text was copied.' },
  errorGeneric: { zh: '發生錯誤，請檢查 API Key 與網路連線後重試。', en: 'An error occurred — check your API key and network, then retry.' },
  cat_decision: { zh: '決策與判斷', en: 'Decision & Judgment' },
  cat_systems: { zh: '系統與複雜性', en: 'Systems & Complexity' },
  cat_psychology: { zh: '心理與認知偏誤', en: 'Psychology & Cognitive Biases' },
  cat_economics: { zh: '經濟與策略', en: 'Economics & Strategy' },
  cat_probability: { zh: '機率與統計', en: 'Probability & Statistics' },
  cat_nature: { zh: '物理與生物類比', en: 'Physics & Biology Analogies' },
};

export function ui(key) {
  const entry = UI[key];
  if (!entry) return key;
  return entry[lang] ?? entry.zh ?? key;
}

export function catName(id, data) {
  const c = data.categories.find(c => c.id === id);
  if (!c) return id;
  return lang === 'en' ? c.name_en : c.name_zh;
}

export function applyUiTranslations() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (UI[key]) el.textContent = ui(key);
  });
}
