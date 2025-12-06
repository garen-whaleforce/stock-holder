# My Portfolio Helper - 投資組合追蹤工具

一個簡潔美觀的美股投資組合追蹤網站，支援即時報價查詢與 AI 投資建議功能。

## 功能特色

- **多組合管理**：支援建立多個投資組合（如主帳戶、退休金、高風險實驗等）
- **即時報價**：整合 FMP API 獲取美股即時報價
- **損益計算**：自動計算未實現損益、報酬率、持股佔比
- **視覺化圖表**：持股佔比圓餅圖，一目了然
- **AI 投資建議**：整合 Azure OpenAI，提供加碼/減碼建議
- **RWD 響應式**：手機、平板、桌機皆可使用
- **本地儲存**：資料存於瀏覽器 localStorage，無需註冊登入

## 技術棧

- **框架**: Next.js 14 + TypeScript + App Router
- **UI**: Tailwind CSS + Recharts
- **後端 API**: Next.js API Routes
- **第三方服務**:
  - FMP (Financial Modeling Prep) API - 股票報價
  - Azure OpenAI (GPT) - AI 建議

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env`，並填入您的 API 金鑰：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```env
# FMP (Financial Modeling Prep) API
# 取得金鑰：https://financialmodelingprep.com/developer/docs/
FMP_API_KEY=your_fmp_premium_api_key

# Azure OpenAI API
# 在 Azure Portal 建立 OpenAI 資源後取得
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5-1
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器造訪 [http://localhost:3000](http://localhost:3000)

### 4. 建置與部署

```bash
# 建置生產版本
npm run build

# 啟動生產伺服器
npm start
```

## 部署到 Zeabur

1. 將專案推送到 GitHub
2. 在 Zeabur 建立新專案，連結 GitHub 儲存庫
3. 在 Zeabur 設定環境變數（同 `.env.example`）
4. 部署完成！

## 專案結構

```
stock-holder/
├── app/
│   ├── api/
│   │   ├── advice/
│   │   │   └── route.ts          # AI 建議 API
│   │   └── quotes/
│   │       └── route.ts          # 股票報價 API
│   ├── components/
│   │   ├── AddHoldingForm.tsx    # 新增持股表單
│   │   ├── AdvicePanel.tsx       # AI 建議面板
│   │   ├── HoldingsTable.tsx     # 持股表格
│   │   ├── PieChartCard.tsx      # 圓餅圖卡片
│   │   ├── PortfolioPage.tsx     # 主頁面元件
│   │   ├── ProfileSelector.tsx   # 組合選擇器
│   │   ├── SummaryCards.tsx      # 摘要卡片
│   │   └── Toast.tsx             # 提示訊息
│   ├── globals.css               # 全域樣式
│   ├── layout.tsx                # 根佈局
│   └── page.tsx                  # 首頁
├── lib/
│   ├── azureOpenAI.ts            # Azure OpenAI 工具函式
│   ├── fmp.ts                    # FMP API 工具函式
│   ├── portfolio.ts              # 投資組合計算邏輯
│   ├── storage.ts                # localStorage 存取
│   └── types.ts                  # TypeScript 類型定義
├── .env.example                  # 環境變數範本
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── README.md
```

## 使用說明

### 新增持股

1. 在「新增持股」區塊輸入股票代碼（如 AAPL）
2. 填入持有股數與平均成本
3. 點擊「新增」按鈕

### 更新報價

點擊「更新報價」按鈕，系統會從 FMP API 獲取所有持股的最新價格。

### 取得 AI 建議

1. 確保已更新報價（需要有現價資料）
2. 點擊「取得 AI 組合建議」按鈕
3. 等待 AI 分析完成，即可看到針對每檔持股的建議

### 管理多個組合

- 使用右上角的下拉選單切換組合
- 點擊 + 按鈕建立新組合
- 點擊編輯按鈕修改組合名稱與風險偏好
- 點擊刪除按鈕移除組合

## 注意事項

- 本工具僅供參考，**不構成任何投資建議**
- 投資有風險，決策請謹慎
- 所有資料僅存於您的瀏覽器中，清除瀏覽器資料將會遺失所有記錄
- FMP API 有請求次數限制，請留意使用量
- AI 建議由 Azure OpenAI 生成，內容僅供參考

## 開發

```bash
# 啟動開發伺服器（含熱重載）
npm run dev

# 類型檢查
npx tsc --noEmit

# 程式碼檢查
npm run lint
```

## 授權

MIT License
