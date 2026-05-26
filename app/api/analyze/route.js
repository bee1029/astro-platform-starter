import { NextResponse } from "next/server";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scoreWish(wish) {
  const normalized = wish.trim();
  const timeWords = /(今天|明天|本週|這週|下週|月底|年底|三個月|半年|一年|[0-9０-９]+天|[0-9０-９]+週|[0-9０-９]+個月|[0-9０-９]+年)/;
  const actionWords = /(完成|建立|設計|學會|推出|開發|整理|改善|增加|降低|找到|準備|實作|規劃|執行|發表|上線)/;
  const outcomeWords = /(作品|計劃|系統|APP|網站|報告|課程|收入|客戶|證照|專案|流程|KPI|成果|產品)/i;
  const vagueWords = /(幸福|成功|變好|順利|有錢|厲害|自由|人生|未來)/;
  const uncontrollableWords = /(希望.*他|希望.*她|中樂透|一夜爆紅|所有人|一定要|保證)/;
  const riskyWords = /(股票|投資|診斷|生病|藥|法律|訴訟|貸款|保險|合約|醫療|財務)/;

  const clarity = clamp(
    35 +
      Math.min(normalized.length, 120) * 0.22 +
      (timeWords.test(normalized) ? 18 : 0) +
      (outcomeWords.test(normalized) ? 18 : 0) -
      (vagueWords.test(normalized) ? 16 : 0)
  );
  const control = clamp(
    55 +
      (actionWords.test(normalized) ? 22 : 0) -
      (uncontrollableWords.test(normalized) ? 24 : 0)
  );
  const resourceFit = clamp(
    50 +
      (/(每天|每週|預算|時間|團隊|工具|資料|學員|客戶|同事|講師)/.test(normalized) ? 20 : 0) +
      (normalized.length > 260 ? -8 : 0)
  );
  const timeFit = clamp(
    48 +
      (timeWords.test(normalized) ? 24 : 0) -
      (/(一天|明天).*(完成|上線|成功|賺)/.test(normalized) ? 18 : 0)
  );

  const wishPoints = Math.round(
    clarity * 0.3 + control * 0.3 + resourceFit * 0.2 + timeFit * 0.2
  );

  return {
    id: crypto.randomUUID(),
    wishPoints,
    feasibilityLevel: wishPoints >= 75 ? "high" : wishPoints >= 50 ? "medium" : "low",
    dimensions: {
      clarity: Math.round(clarity),
      control: Math.round(control),
      resourceFit: Math.round(resourceFit),
      timeFit: Math.round(timeFit)
    },
    reasons: [
      timeWords.test(normalized)
        ? "願望包含時間線，較容易拆成階段任務。"
        : "目前尚未看到明確期限，補上時間線後會更容易執行。",
      actionWords.test(normalized)
        ? "願望中有可執行動作，能轉成具體任務。"
        : "願望偏結果導向，建議加入你會採取的行動。",
      outcomeWords.test(normalized)
        ? "有可辨識的成果物，方便設定驗收標準。"
        : "成果物還可以再具體，例如文件、網站、作品或數字指標。"
    ],
    risks: [
      vagueWords.test(normalized)
        ? "願望描述較抽象，後續可能難以判斷是否完成。"
        : "若範圍持續擴大，可能造成時間與資源不足。",
      uncontrollableWords.test(normalized)
        ? "願望含有他人或外部結果，建議改寫成自己可控制的行動。"
        : "需要定期檢查進度，避免只有想法而沒有交付物。"
    ],
    nextSteps: [
      "把願望改寫成一句「在什麼時間前，完成什麼成果」的目標。",
      "列出三個本週可以開始的小任務。",
      "設定一個可檢查的成果物，例如文件、原型、簡報或數據。"
    ],
    source: "fallback",
    safetyNote: riskyWords.test(normalized)
      ? "這個願望可能涉及醫療、法律或財務等高風險議題。本分析只能作為目標整理參考，不能取代專業意見。"
      : null
  };
}

function buildPrompt(wish) {
  return [
    {
      role: "system",
      content:
        "你是願望可行性分析器。只輸出 JSON，不要輸出 Markdown。分數必須介於 0 到 100。欄位：wishPoints, feasibilityLevel, dimensions{clarity,control,resourceFit,timeFit}, reasons, risks, nextSteps, safetyNote。高風險醫療、法律、財務內容需加入安全提醒，不保證結果實現。"
    },
    {
      role: "user",
      content: `請分析這個願望：${wish}`
    }
  ];
}

async function callOpenAI(wish) {
  if (!process.env.OPENAI_API_KEY) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: buildPrompt(wish),
      temperature: 0.4,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response missing content");

  const parsed = JSON.parse(content);
  return {
    id: crypto.randomUUID(),
    wishPoints: clamp(Number(parsed.wishPoints || 0)),
    feasibilityLevel: ["low", "medium", "high"].includes(parsed.feasibilityLevel)
      ? parsed.feasibilityLevel
      : "medium",
    dimensions: {
      clarity: clamp(Number(parsed.dimensions?.clarity || 0)),
      control: clamp(Number(parsed.dimensions?.control || 0)),
      resourceFit: clamp(Number(parsed.dimensions?.resourceFit || 0)),
      timeFit: clamp(Number(parsed.dimensions?.timeFit || 0))
    },
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 4) : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 4) : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.slice(0, 5) : [],
    source: "ai",
    safetyNote: parsed.safetyNote || null
  };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 格式錯誤" }, { status: 400 });
  }

  const wish = String(body.wish || "").trim();
  if (!wish) {
    return NextResponse.json({ error: "請先輸入願望" }, { status: 400 });
  }
  if (wish.length > 500) {
    return NextResponse.json({ error: "願望請控制在 500 字以內" }, { status: 400 });
  }

  try {
    const aiResult = await callOpenAI(wish);
    return NextResponse.json(aiResult || scoreWish(wish));
  } catch {
    const fallback = scoreWish(wish);
    fallback.aiError = "AI 暫時無法回應，目前使用本地快速分析。";
    return NextResponse.json(fallback);
  }
}
