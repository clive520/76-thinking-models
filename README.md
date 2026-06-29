# 76 個人類思考模式 · 76 Thinking Models

> 認識思考工具，升級你的決策品質。
> Mental tools to upgrade your decision-making.

一個免費託管於 GitHub Pages 的雙語網站，呈現 76 種思考模式（心智模型），並提供 AI 情境推薦與對策功能。免後端伺服器，AI 呼叫在瀏覽器端直接進行。

🌐 **線上版**：<https://clive520.github.io/76-thinking-models/>

---

## 功能 Features

1. **76 種思考模式總覽** — 依分類瀏覽，支援搜尋與分類篩選
2. **模式詳情** — 每種模式含定義、應用場景、3 個實際案例（中英雙語）
3. **AI 情境諮詢** — 輸入你的情境，AI 推薦適用的思考模式並提出解決對策
4. **中英雙語切換** — 全站內容中英並列，一鍵切換

## 76 種模式分類

| 分類 | 數量 |
|------|------|
| 決策與判斷 Decision & Judgment | 13 |
| 系統與複雜性 Systems & Complexity | 12 |
| 心理與認知偏誤 Psychology & Cognitive Biases | 15 |
| 經濟與策略 Economics & Strategy | 15 |
| 機率與統計 Probability & Statistics | 12 |
| 物理與生物類比 Physics & Biology Analogies | 9 |
| **合計** | **76** |

---

## 使用 AI 諮詢功能

AI 諮詢功能需要你自己免費申請一組 API Key（金鑰只存在你的瀏覽器 `localStorage`，不會送出本站、不會進入倉庫）。

### 步驟
1. 進入「AI 諮詢」頁面，點「設定」
2. 選擇 AI 服務（預設 Gemini），貼入 API Key，儲存
3. 在情境欄描述你的情況，點「分析」即可獲得推薦與對策

### 免費 API Key 取得

#### Google Gemini（推薦，額度最大）
1. 前往 <https://aistudio.google.com/apikey>
2. 以 Google 帳號登入，點「Create API key」
3. 免費層級：約 15 請求/分鐘、1,500 請求/天（**免信用卡**）
4. 複製金鑰貼入網站設定

#### Groq（速度最快）
1. 前往 <https://console.groq.com/keys>
2. 註冊後建立 API Key
3. 免費層級：約 30 請求/分鐘、數千請求/天
4. 複製金鑰貼入網站設定，並將 provider 切換為 Groq

> 金鑰安全：本站是純前端靜態網站，沒有後端。金鑰呼叫 AI API 後只存在你自己的瀏覽器中，不會被收集或傳送給本站伺服器。

---

## 本地執行

由於使用 ES Modules，需透過 HTTP 伺服器執行（不能直接以 `file://` 開啟）：

```bash
# 在專案根目錄
python -m http.server 8080
# 或
npx serve
```

開啟 <http://localhost:8080>

---

## 技術架構

- **託管**：GitHub Pages（免費）
- **前端**：Vanilla JS + SPA（hash 路由），無框架、無建置工具
- **樣式**：原生 CSS
- **資料**：靜態 JSON（`data/models.json`），76 模式預先生成
- **AI**：瀏覽器端 `fetch` 呼叫 Gemini / Groq 免費 API
- **部署**：GitHub Actions 自動部署

### 目錄結構

```
├── index.html                  # SPA 入口
├── assets/
│   ├── css/style.css           # 樣式
│   └── js/
│       ├── app.js              # 路由與主邏輯
│       ├── i18n.js             # 雙語切換
│       ├── ai-client.js        # AI API 封裝（Gemini + Groq）
│       └── views/
│           ├── overview.js     # 總覽頁
│           ├── detail.js       # 詳情頁
│           ├── advisor.js      # AI 諮詢頁
│           └── about.js        # 關於頁
├── data/models.json            # 76 模式完整資料
├── .github/workflows/deploy.yml
├── PLANNING.md                 # 開發規劃書
├── LICENSE                     # MIT
└── README.md
```

---

## 授權 License

- **程式碼**：[MIT License](./LICENSE)
- **內容（模式定義、場景、案例）**：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

所有文字描述與案例皆為原創撰寫，未抄襲任何書籍原文。76 個思考模式為通用概念，名稱與概念本身不受版權保護。

---

## 開發規劃

詳見 [PLANNING.md](./PLANNING.md)。
