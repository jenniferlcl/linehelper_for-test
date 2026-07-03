# LINE 00402A 主動ETF 服務機器人

這是一個可部署到 Vercel 的 LINE Messaging API webhook，服務公司 FAE：

1. 直接提出「報名主動ETF說明會」，系統逐步收集姓名、公司、Email、手機、場次/方便聯絡時間，並寫入後台記錄。
2. 直接提出 00402A 主動ETF 問題，系統只根據安聯活動頁資料回答；若資料不足，會留下問題轉後台客服處理。

資料來源：<https://etf.allianzgi.com.tw/eventsite/00402A/index.html>

## 重要安全提醒

請不要把 OpenAI key、LINE channel secret、LINE channel access token 寫進程式碼或 GitHub。請放在 Vercel Environment Variables。

如果金鑰曾經貼到聊天、文件或任何共享位置，建議到 OpenAI 與 LINE Developers 後台重新產生/輪替金鑰。

## 專案結構

```text
api/webhook.js      LINE webhook 與後台記錄查詢
api/health.js       健康檢查
lib/knowledge.js    00402A 活動頁知識庫
lib/openai.js       嚴格根據知識庫回答，不足則轉客服
lib/storage.js      Vercel KV/Upstash REST 儲存，無 KV 時本機寫 JSONL
lib/line.js         LINE 簽章驗證與回覆
scripts/self-test.mjs
```

## 環境變數

在 Vercel Project Settings → Environment Variables 新增：

```text
LINE_CHANNEL_SECRET=你的 LINE channel secret
LINE_CHANNEL_ACCESS_TOKEN=你的 LINE channel access token
OPENAI_API_KEY=你的 OpenAI key
OPENAI_MODEL=gpt-4.1-mini
ADMIN_TOKEN=一組後台查詢用的長隨機字串
```

建議同時開啟 Vercel KV 或 Upstash Redis，並設定：

```text
KV_REST_API_URL=Vercel/Upstash 提供
KV_REST_API_TOKEN=Vercel/Upstash 提供
```

沒有 KV 時，本機測試會寫入 `local-records.jsonl`；但 Vercel Serverless 不適合用檔案保存正式資料，所以正式部署請務必設定 KV。

## 本機測試

1. 安裝 Node.js 20 以上。
2. 複製環境變數：

```bash
cp .env.example .env
```

3. 編輯 `.env`，填入 LINE/OpenAI/KV 變數。
4. 安裝套件：

```bash
npm install
```

5. 執行基本測試：

```bash
npm test
```

6. 啟動本機 Vercel：

```bash
npm run dev
```

健康檢查：

```text
http://localhost:3000/api/health
```

## 部署到 Vercel

1. 把這個資料夾推到 GitHub repository。
2. 到 Vercel 新增 Project，Import GitHub repository。
3. Framework Preset 選 Other，Build Command 可留空，Output Directory 留空。
4. 在 Environment Variables 填入上方變數。
5. Deploy。
6. 部署完成後取得網址，例如：

```text
https://your-project.vercel.app
```

7. LINE Developers → Messaging API → Webhook URL 設定：

```text
https://your-project.vercel.app/api/webhook
```

8. 開啟 Use webhook。
9. 按 Verify，成功後用 LINE 對機器人測試。

## LINE 測試話術

報名流程：

```text
我要報名主動ETF說明會
```

機器人會依序詢問姓名、公司/單位、Email、手機、想參加的場次或方便聯絡時間。

問答流程：

```text
00402A 是追蹤哪個指數？
00402A 可以去哪裡買？
00402A 的風險等級是多少？
配息有保證嗎？
```

若活動頁沒有足夠資料，機器人會回覆已留下問題並寫入 `unanswered_question`。

## 查詢後台記錄

用瀏覽器或 API 工具查：

```bash
curl -H "Authorization: Bearer 你的_ADMIN_TOKEN" \
  https://your-project.vercel.app/api/webhook?limit=50
```

記錄類型：

```text
registration          說明會報名
answered_question     已回答問題
unanswered_question   轉客服問題
self_test             本機測試記錄
```

## 運作原則

機器人回答 ETF 問題時只使用 `lib/knowledge.js` 的活動頁資料。涉及即時淨值、即時價格、績效預測、個人投資建議，或活動頁沒有明確資料時，會自動轉為客服待處理問題。

