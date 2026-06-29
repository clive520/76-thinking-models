import { ui, getLang } from '../i18n.js';

export function render(data, app) {
  const lang = getLang();
  const counts = {};
  data.models.forEach(m => counts[m.category] = (counts[m.category] || 0) + 1);
  const catNames = {
    decision: { zh: '決策與判斷', en: 'Decision & Judgment' },
    systems: { zh: '系統與複雜性', en: 'Systems & Complexity' },
    psychology: { zh: '心理與認知偏誤', en: 'Psychology & Cognitive Biases' },
    economics: { zh: '經濟與策略', en: 'Economics & Strategy' },
    probability: { zh: '機率與統計', en: 'Probability & Statistics' },
    nature: { zh: '物理與生物類比', en: 'Physics & Biology Analogies' },
  };

  app.innerHTML = `
    <div class="about-wrap">
      <h2>${ui('aboutTitle')}</h2>
      <p>${ui('aboutIntro')}</p>

      <h3>${ui('aboutContent')}</h3>
      <ul>
        ${data.categories.map(c => `<li>${catNames[c.id][lang]} — ${counts[c.id]} ${lang === 'en' ? 'models' : '項'}</li>`).join('')}
      </ul>
      <p>共 ${data.models.length} ${lang === 'en' ? 'models' : '個模式'}，每個模式含定義、應用場景與 3 個實際案例。</p>

      <h3>${ui('aboutAI')}</h3>
      <p>${ui('aboutAIText')}</p>
      <ul>
        <li>${lang === 'en' ? 'Google Gemini 2.0 Flash — generous free tier (~1,500 req/day)' : 'Google Gemini 2.0 Flash — 免費額度大（約 1,500 請求/天）'}</li>
        <li>${lang === 'en' ? 'Groq Llama 3.3 70B — very fast, free tier' : 'Groq Llama 3.3 70B — 速度極快，免費額度'}</li>
      </ul>

      <h3>${ui('aboutLicense')}</h3>
      <p>${ui('aboutLicenseText')}</p>

      <p style="margin-top:24px"><a href="#/" class="btn btn-secondary">← ${ui('navModels')}</a></p>
    </div>
  `;
}
