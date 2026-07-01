import { compactKnowledge, keywordSearch, sourceUrl } from "./knowledge.js";

const fallbackApology =
  "這題活動頁沒有明確資料，我已先幫您留下問題，會轉給後台客服處理。";

export async function answerQuestion(question) {
  const apiKey = process.env.OPENAI_API_KEY;
  const keywordHits = keywordSearch(question);

  if (!apiKey) {
    if (keywordHits.length === 0) {
      return { answered: false, answer: fallbackApology, reason: "no_openai_no_keyword_hit" };
    }
    return {
      answered: true,
      answer: `${keywordHits.map((hit) => hit.text).join("\n\n")}\n\n資料來源：${sourceUrl}`,
      reason: "keyword_fallback"
    };
  }

  const prompt = [
    {
      role: "system",
      content:
        "你是安聯00402A主動ETF LINE服務機器人，回答對象是公司FAE。只能根據提供的活動頁資料回答。若資料不足、沒有明確依據、涉及即時價格/淨值/績效預測/個人投資建議，必須回傳 answered=false，不要臆測。回答用繁體中文，簡潔、專業，避免承諾收益。"
    },
    {
      role: "user",
      content: `活動頁資料來源：${sourceUrl}\n\n${compactKnowledge()}\n\n問題：${question}\n\n請只輸出JSON：{"answered": boolean, "answer": "給使用者的回答", "reason": "簡短原因"}`
    }
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: prompt,
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  if (!parsed.answered) {
    return {
      answered: false,
      answer: fallbackApology,
      reason: parsed.reason || "insufficient_source"
    };
  }

  return {
    answered: true,
    answer: `${parsed.answer}\n\n資料來源：${sourceUrl}`,
    reason: parsed.reason || "source_answered"
  };
}
