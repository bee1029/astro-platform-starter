"use client";

import { useMemo, useState } from "react";

const levelText = {
  high: "高度可行",
  medium: "中等可行",
  low: "需要重整"
};

const levelColor = {
  high: "#0e9384",
  medium: "#d89511",
  low: "#d92d5b"
};

const dimensionLabels = {
  clarity: "清晰度",
  control: "可控性",
  resourceFit: "資源匹配",
  timeFit: "時間合理"
};

export default function Home() {
  const [wish, setWish] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dimensions = useMemo(() => {
    if (!result?.dimensions) return [];
    return Object.entries(result.dimensions);
  }, [result]);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = wish.trim();

    if (!text) {
      setError("請先輸入願望。");
      return;
    }

    if (text.length > 500) {
      setError("願望請控制在 500 字以內。");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish: text })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "分析失敗");
      setResult(payload);
    } catch (err) {
      setError(err.message || "分析失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workbench" aria-labelledby="app-title">
        <div className="brand-row">
          <img src="/spark.svg" alt="" className="brand-mark" />
          <div>
            <p className="eyebrow">WishMaker</p>
            <h1 id="app-title">發願器</h1>
          </div>
        </div>

        <form className="wish-form" onSubmit={handleSubmit}>
          <label htmlFor="wish-input">輸入你的願望</label>
          <textarea
            id="wish-input"
            maxLength={500}
            value={wish}
            onChange={(event) => {
              setWish(event.target.value);
              setError("");
            }}
            placeholder="例：我希望三個月內完成一套 AI 客戶開發 Web System，並整理成可交付的專案計劃書。"
          />
          <div className="form-footer">
            <span>{wish.length} / 500</span>
            <button type="submit" disabled={loading}>
              <span className="button-icon">✦</span>
              {loading ? "分析中" : "開始發願"}
            </button>
          </div>
          <p className="form-error" role="alert">{error}</p>
        </form>
      </section>

      <section className="result-panel" aria-live="polite">
        {!loading && !result && (
          <div className="empty-state">
            <div className="orbit"><span /></div>
            <h2>願望會在這裡變成計劃</h2>
            <p>送出後會得到願望點數、可行性分析、風險與下一步。</p>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="loader" />
            <p>正在校準願望能量...</p>
          </div>
        )}

        {result && (
          <article className="result-card">
            <div className="score-row">
              <div>
                <p className="eyebrow">願望點數</p>
                <div className="score">
                  <span>{result.wishPoints}</span><small>/100</small>
                </div>
              </div>
              <span className="source-pill">
                {result.source === "ai" ? "AI 分析" : "本地快速分析"}
              </span>
            </div>

            <div className="meter" aria-hidden="true">
              <span style={{ width: `${result.wishPoints}%` }} />
            </div>

            <div className="feasibility">
              <span style={{ background: levelColor[result.feasibilityLevel] || levelColor.medium }} />
              <strong>{levelText[result.feasibilityLevel] || levelText.medium}</strong>
            </div>

            {(result.safetyNote || result.aiError) && (
              <div className="safety-note">{result.safetyNote || result.aiError}</div>
            )}

            <div className="dimension-grid">
              {dimensions.map(([key, value]) => (
                <div className="dimension" key={key}>
                  <span>{dimensionLabels[key] || key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="analysis-grid">
              <section>
                <h3>分析理由</h3>
                <ul>
                  {(result.reasons || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
              <section>
                <h3>風險提醒</h3>
                <ul>
                  {(result.risks || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
              <section className="wide">
                <h3>下一步</h3>
                <ol>
                  {(result.nextSteps || []).map((item) => <li key={item}>{item}</li>)}
                </ol>
              </section>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
