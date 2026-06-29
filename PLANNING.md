# 76 個人類思考模式 — 網站開發規劃書

> 專案代稱：`76-thinking-models`
> 規劃日期：2026-06-29
> 目標：在 GitHub 上建立一個可免費託管、免後端伺服器的雙語網站，呈現 76 種思考模式並提供 AI 情境推薦與對策功能。

---

## 一、專案目標與功能需求

### 核心功能
| 編號 | 功能 | 說明 |
|------|------|------|
| F1 | 思考模式總覽 | 以卡片／分類呈現 76 種思考模式，可點擊進入詳情 |
| F2 | 模式詳情頁 | 每種模式包含：定義、應用場景、3 個實際案例（中英雙語） |
| F3 | AI 情境推薦 | 使用者輸入自身情境，系統推薦適用的思考模式 |
| F4 | AI 對策生成 | 針對使用者情境與提議，AI 產出可行解決對策 |

### 非功能需求
- **完全免費託管**：使用 GitHub Pages，零伺服器成本
- **免後端**：AI 呼叫在瀏覽器端進行，使用者自行填入 API Key（存於 localStorage）
- **雙語**：思考模式名稱中英並列，內容以繁體中文為主、英文為輔
- **可離線瀏覽模式內容**：76 種模式資料為靜態 JSON，不需 AI 即可閱讀

---

## 二、技術架構

### 架構總覽
```
┌─────────────────────────────────────────────┐
│              GitHub Pages (免費託管)           │
│   靜態檔案：HTML / CSS / JS / JSON             │
├─────────────────────────────────────────────┤
│  瀏覽器端 (Vanilla JS SPA, hash 路由)          │
│  ├─ 總覽頁  → 讀取 data/models.json            │
│  ├─ 詳情頁  → 讀取 data/models.json            │
│  └─ 諮詢頁  → 呼叫 AI API (使用者自己的 Key)    │
└─────────────────────────────────────────────┘
        │
        ▼ (HTTPS, 瀏覽器直接呼叫)
┌─────────────────────────────────────────────┐
│   免費 AI API (Gemini / Groq / 其他)          │
└─────────────────────────────────────────────┘
```

### 技術選型
| 項目 | 選擇 | 理由 |
|------|------|------|
| 託管 | GitHub Pages | 免費、與 GitHub 倉庫整合、自訂網域支援 |
| 前端 | Vanilla JS + SPA (hash 路由) | 無建置依賴、易維護、GitHub Pages 原生支援 |
| 樣式 | 原生 CSS + CSS 變數 | 無框架包袱、檔案小 |
| 資料 | 靜態 JSON | 76 模式內容預先生成，載入即顯示 |
| AI | 瀏覽器端 fetch 呼叫 | 免後端、Key 由使用者自行保管 |
| 部署 | GitHub Actions | push 後自動部署至 Pages |

### 為何不使用框架（React/Vue）？
本站以「內容呈現 + 單一 AI 互動頁」為主，互動複雜度低。使用 Vanilla JS 可避免建置工具鏈與依賴維護負擔，並確保 GitHub Pages 部署零設定。若日後功能擴增再評估遷移。

---

## 三、免費 AI 方案比較

以下方案皆可在瀏覽器端直接呼叫（CORS 允許或可處理），免後端：

| 方案 | 模型 | 免費額度 | 速度 | 推理品質 | 需 API Key | CORS | 備註 |
|------|------|---------|------|---------|-----------|------|------|
| **Google Gemini** | Gemini 2.0 Flash | 15 RPM / 1,500 req/天 / 1M TPM | 快 | ★★★★★ | 是 | 允許 | 額度最大、中文佳、推理強 |
| **Groq** | Llama 3.3 70B | 30 RPM / ~7,000 req/天 | ★★★★★ 極快 | ★★★★ | 是 | 允許 | 速度最快、開源模型 |
| **Cerebras** | Llama 3.1 8B/70B | 免費層（較小） | 極快 | ★★★★ | 是 | 允許 | 額度較有限 |
| **Pollinations.ai** | 多種 | 無限但限流 | 中 | ★★★ | 否 | 允許 | 無需 Key 但不穩定 |
| **Hugging Face** | 多種 | 有限 | 慢 | 視模型 | 是 | 需處理 | 常排隊、不適合即時 |

### 建議
- **主推薦：Google Gemini 免費額度**——額度充足（1,500 請求/天足夠個人使用）、中文推理品質最佳、CORS 允許瀏覽器直接呼叫。
- **備援：Groq**——速度最快，可作為第二選項。
- **設計策略**：AI 客戶端設計為**多提供者架構**，使用者在設定頁可選擇 provider 並填入對應 Key，預設為 Gemini。未來可輕鬆擴充。

### API Key 安全說明
- Key 僅存在使用者自己瀏覽器的 `localStorage`，**不會**進入倉庫或伺服器。
- 網站不會收集或傳送任何 Key。
- 建議檔案與程式碼中不放任何硬編碼 Key（倉庫內僅放說明文件）。

---

## 四、76 個思考模式分類清單

以下清單由公開、通用的思考模型概念彙整而成（概念本身不受版權保護，**所有文字描述與案例皆為原創撰寫**，不抄襲任何特定書籍內容）。分為 8 大類：

### A. 決策與判斷（Decision & Judgment）— 13 項
1. 逆向思考 Inversion
2. 二階思考 Second-Order Thinking
3. 機會成本 Opportunity Cost
4. 沉沒成本謬誤 Sunk Cost Fallacy
5. 成本效益分析 Cost-Benefit Analysis
6. 邊際思考 Marginal Thinking
7. 漢隆剃刀 Hanlon's Razor
8. 奧坎剃刀 Occam's Razor
9. 能力圈 Circle of Competence
10. 對比原理 Contrast Principle
11. 決策矩陣 Decision Matrix
12. 事前驗屍 Pre-Mortem
13. 艾森豪矩陣 Eisenhower Matrix

### B. 系統與複雜性（Systems & Complexity）— 12 項
14. 第一性原理 First Principles Thinking
15. 系統思考 Systems Thinking
16. 回饋迴圈 Feedback Loops
17. 瓶頸理論 Theory of Constraints
18. 帕累托法則 Pareto Principle (80/20)
19. 關鍵路徑 Critical Path
20. 湧現 Emergence
21. 網路效應 Network Effects
22. 規模經濟 Economies of Scale
23. 邊際報酬遞減 Diminishing Returns
24. 臨界質量 Critical Mass
25. 路徑依賴 Path Dependence

### C. 心理與認知偏誤（Psychology & Cognitive Biases）— 15 項
26. 確認偏誤 Confirmation Bias
27. 易得性偏誤 Availability Bias
28. 錨定效應 Anchoring Effect
29. 框架效應 Framing Effect
30. 損失趨避 Loss Aversion
31. 後見之明偏誤 Hindsight Bias
32. 倖存者偏差 Survivorship Bias
33. 達克效應 Dunning-Kruger Effect
34. 基本歸因謬誤 Fundamental Attribution Error
35. 月暈效應 Halo Effect
36. 羊群效應 Bandwagon Effect
37. 近因偏誤 Recency Bias
38. 現狀偏誤 Status Quo Bias
39. 偏見盲點 Bias Blind Spot
40. 知識詛咒 Curse of Knowledge

### D. 經濟與策略（Economics & Strategy）— 15 項
41. 供需法則 Supply and Demand
42. 比較利益 Comparative Advantage
43. 賽局理論 Game Theory
44. 奈許均衡 Nash Equilibrium
45. 囚犯困境 Prisoner's Dilemma
46. 訊號理論 Signaling
47. 道德風險 Moral Hazard
48. 逆向選擇 Adverse Selection
49. 委託代理問題 Principal-Agent Problem
50. 公有地悲劇 Tragedy of the Commons
51. 轉換成本 Switching Costs
52. 搭售 Bundling
53. 價格歧視 Price Discrimination
54. 贏家詛咒 Winner's Curse
55. 貨幣時間價值 Time Value of Money

### E. 機率與統計（Probability & Statistics）— 12 項
56. 基礎比率 Base Rate
57. 貝氏定理 Bayes' Theorem
58. 期望值 Expected Value
59. 大數法則 Law of Large Numbers
60. 中央極限定理 Central Limit Theorem
61. 均值回歸 Regression to the Mean
62. 常態分配 Normal Distribution
63. 相關不等於因果 Correlation vs. Causation
64. 標準差 Standard Deviation
65. 條件機率 Conditional Probability
66. 賭徒謬誤 Gambler's Fallacy
67. 辛普森悖論 Simpson's Paradox

### F. 物理與生物類比（Physics & Biology Analogies）— 9 項
68. 慣性 Inertia
69. 動能 Momentum
70. 槓桿 Leverage
71. 摩擦力 Friction
72. 熵 Entropy
73. 天擇 Natural Selection
74. 演化 Evolution
75. 生態系 Ecosystem
76. 複利 Compounding

> 合計 76 項。每項將由 AI 預先生成：定義、應用場景、3 個實際案例（中英雙語），寫入靜態 JSON。

---

## 五、倉庫結構

```
76-thinking-models/
├── index.html                  # SPA 入口
├── assets/
│   ├── css/
│   │   └── style.css           # 全站樣式（含響應式）
│   └── js/
│       ├── app.js              # 路由與應用主邏輯
│       ├── views/
│       │   ├── overview.js     # 總覽頁
│       │   ├── detail.js       # 詳情頁
│       │   └── advisor.js      # AI 諮詢頁
│       ├── ai-client.js        # AI API 封裝（多 provider）
│       └── i18n.js             # 雙語切換
├── data/
│   └── models.json             # 76 模式完整資料（預先生成）
├── scripts/
│   └── generate-data.js        # 以 AI 生成資料的腳本（本地執行）
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages 自動部署
├── .gitignore
├── README.md                   # 專案說明與使用指引
├── PLANNING.md                 # 本規劃書
└── LICENSE                     # MIT
```

---

## 六、資料結構（models.json 範例）

```json
{
  "categories": [
    { "id": "decision", "name_zh": "決策與判斷", "name_en": "Decision & Judgment" }
  ],
  "models": [
    {
      "id": "inversion",
      "number": 1,
      "category": "decision",
      "name_zh": "逆向思考",
      "name_en": "Inversion",
      "definition_zh": "不問「如何成功」，而是問「如何必定失敗」，再避免那些事。",
      "definition_en": "Instead of asking how to succeed, ask how to guarantee failure, then avoid those things.",
      "scenarios_zh": "適用於風險管理、長期規劃、避免重大錯誤的決策情境。",
      "scenarios_en": "Useful for risk management, long-term planning, and avoiding catastrophic errors.",
      "cases": [
        {
          "title_zh": "投資避險",
          "title_en": "Investment Risk Avoidance",
          "desc_zh": "（AI 生成案例內容）",
          "desc_en": "(AI-generated case content)"
        }
      ]
    }
  ]
}
```

---

## 七、開發步驟與時程

| 階段 | 工作內容 | 產出 |
|------|---------|------|
| **1. 倉庫初始化** | 建立 GitHub 倉庫、基礎檔案、gitignore、README、License | 遠端倉庫 |
| **2. 資料生成** | 撰寫生成腳本，以 AI 為 76 模式各生成定義+場景+3 案例（雙語） | models.json |
| **3. 前端骨架** | SPA 路由、總覽頁、詳情頁、樣式 | 可瀏覽的網站 |
| **4. AI 諮詢頁** | 情境輸入、推薦模式、生成對策、API Key 設定 | F3+F4 功能 |
| **5. 雙語切換** | 中英切換、i18n 邏輯 | 雙語完整 |
| **6. 部署** | GitHub Actions 部署至 Pages、驗證線上版本 | 公開網站 |
| **7. 文件完善** | README 使用說明、API Key 取得指引 | 完整文件 |

---

## 八、AI 諮詢功能設計

### 使用者流程
1. 進入「AI 諮詢」頁
2. 首次使用：在設定區選擇 AI provider（預設 Gemini），貼入 API Key（存 localStorage）
3. 輸入情境描述（例如：「我考慮辭職創業，但不確定風險」）
4. 點擊「分析」→ AI 回應：
   - (a) 推薦 2–4 個適用的思考模式（含名稱與簡述）
   - (b) 針對情境的解決對策（條列式建議）
5. 可點擊推薦的模式直接跳轉詳情頁

### Prompt 設計（系統提示）
- 系統提示會注入 76 模式的 id 與名稱清單，要求 AI 僅從中推薦
- 要求輸出結構化 JSON（推薦模式陣列 + 對策陣列），前端渲染
- 要求以使用者選擇的語言回應

---

## 九、版權與內容處理

- 76 個思考模式為**通用概念**，名稱與概念不受版權保護
- 所有**定義、場景、案例的文字**皆為原創（由 AI 生成後人工審核），不抄襲任何書籍原文
- 專案程式碼以 **MIT License** 開源
- 資料內容以 **CC BY 4.0** 授權，允許他人使用標註來源

---

## 十、待確認事項

1. **AI 方案選擇**：請參閱第三節比較表，決定主方案（建議 Gemini，可保留 Groq 備援）
2. **倉庫可見性**：Public（免費 Pages、可被搜尋）或 Private（需 GitHub Pro 才能用 Pages）？**建議 Public**
3. **倉庫名稱**：建議 `76-thinking-models`，可更改
4. **是否啟用自訂網域**：預設使用 `clive520.github.io/76-thinking-models`，日後可綁網域

---

確認本規劃書後，我將依第七節步驟依序執行：建立倉庫 → 生成資料 → 開發前端 → 部署上線。
