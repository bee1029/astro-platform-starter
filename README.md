# 發願器 WishMaker

這是一份完整 Next.js 專案根目錄，可直接上傳部署。

## 專案內容
- `package.json`
- `next.config.js`
- `app/`
- `public/`
- `.gitignore`

## 本地啟動
```bash
npm install
npm run dev
```

開啟：
```text
http://localhost:3000
```

## AI 模式
如果部署環境有設定 `OPENAI_API_KEY`，API 會呼叫 OpenAI。

若沒有設定金鑰，系統會自動使用本地 fallback 分析，仍可正常產生願望點數與可行性分析。

可選環境變數：
```text
OPENAI_API_KEY=你的金鑰
OPENAI_MODEL=gpt-4o-mini
```
