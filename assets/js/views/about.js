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
        <li><strong>Groq</strong> — ${lang === 'en' ? 'free, very fast, no region limits (recommended for TW)' : '免費、速度極快、無地區限制（台灣推薦）'}</li>
        <li><strong>Google Gemini</strong> — ${lang === 'en' ? 'free tier ~1,500 req/day (region-restricted)' : '免費額度約 1,500 請求/天（有地區限制）'}</li>
        <li><strong>OpenRouter</strong> — ${lang === 'en' ? 'gateway with free models' : '聚合閘道，含免費模型'}</li>
        <li><strong>NVIDIA NIM</strong> — ${lang === 'en' ? '1000 free credits on signup' : '註冊送 1000 免費點數'}</li>
        <li><strong>OpenCode Zen</strong> — ${lang === 'en' ? '5 free models + paid pay-as-you-go' : '5 個免費模型 + 付費隨用'}</li>
        <li><strong>OpenCode Go</strong> — ${lang === 'en' ? '$5/mo subscription, 13 open models, global access' : '月費 $5 訂閱，13 個開源模型，全球穩定'}</li>
        <li><strong>OpenAI</strong> — ${lang === 'en' ? 'paid, possible trial credits' : '付費，可能有試用額度'}</li>
      </ul>

      <h3>${ui('aboutLicense')}</h3>
      <p>${ui('aboutLicenseText')}</p>

      <p style="margin-top:24px"><a href="#/" class="btn btn-secondary">← ${ui('navModels')}</a></p>
    </div>
  `;
}
