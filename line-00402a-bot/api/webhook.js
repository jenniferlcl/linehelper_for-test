import { answerQuestion } from "../lib/openai.js";
import { replyMessage, textMessage, verifyLineSignature } from "../lib/line.js";
import { clearState, getState, listRecords, saveRecord, setState } from "../lib/storage.js";

const registrationFields = [
  { key: "name", label: "姓名" },
  { key: "company", label: "公司/單位" },
  { key: "email", label: "Email" },
  { key: "phone", label: "手機" },
  { key: "session", label: "想參加的場次或方便聯絡時間" }
];

function wantsRegistration(text) {
  return /(報名|說明會|參加|講座|seminar|webinar)/i.test(text);
}

function wantsCancel(text) {
  return /^(取消|不要了|先不用|cancel)$/i.test(text.trim());
}

function isThanks(text) {
  return /^(謝謝|感謝|thanks|thank you|ok|好的|了解|收到|辛苦了)[！!。.\s]*$/i.test(text.trim());
}

function firstPrompt() {
  return "好的，我先幫您登記00402A主動ETF說明會。\n請回覆您的姓名。若要中止，請輸入「取消」。";
}

function nextFieldPrompt(state) {
  const field = registrationFields[state.step];
  return `請回覆${field.label}。`;
}

function formatSummary(data) {
  return registrationFields.map((field) => `${field.label}：${data[field.key]}`).join("\n");
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function handleRegistrationMessage({ text, userId, source }) {
  const current = await getState(userId);

  if (wantsCancel(text)) {
    await clearState(userId);
    return "已取消本次登記。";
  }

  if (!current) {
    await setState(userId, {
      flow: "registration",
      step: 0,
      data: {},
      startedAt: new Date().toISOString()
    });
    return firstPrompt();
  }

  if (current.flow !== "registration") return null;

  const field = registrationFields[current.step];
  current.data[field.key] = text.trim();
  current.step += 1;

  if (current.step < registrationFields.length) {
    await setState(userId, current);
    return nextFieldPrompt(current);
  }

  const record = await saveRecord("registration", {
    userId,
    source,
    data: current.data
  });
  await clearState(userId);

  return `已完成報名登記，後台編號：${record.id}\n\n${formatSummary(current.data)}\n\n後台同仁會再確認細節。`;
}

async function handleQuestion({ text, userId, source }) {
  const result = await answerQuestion(text);
  if (!result.answered) {
    await saveRecord("unanswered_question", {
      userId,
      source,
      question: text,
      reason: result.reason
    });
  } else {
    await saveRecord("answered_question", {
      userId,
      source,
      question: text,
      answer: result.answer,
      reason: result.reason
    });
  }
  return result.answer;
}

async function handleTextEvent(event) {
  const text = event.message?.text?.trim();
  const userId = event.source?.userId || event.source?.groupId || event.source?.roomId || "unknown";
  const source = event.source || {};

  if (!text) return null;

  const state = await getState(userId);
  if (state?.flow === "registration" || wantsRegistration(text)) {
    return handleRegistrationMessage({ text, userId, source });
  }

  if (isThanks(text)) {
    return "不客氣。如需報名說明會或詢問00402A相關問題，可以直接留言給我。";
  }

  if (/^(help|幫助|使用說明)$/i.test(text)) {
    return "您可以直接輸入：\n1.「我要報名說明會」開始登記\n2. 直接詢問00402A主動ETF相關問題\n若活動頁沒有資料，我會留下問題轉後台客服。";
  }

  return handleQuestion({ text, userId, source });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const records = await listRecords(Number(req.query.limit || 50));
    res.status(200).json({ records });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-line-signature"];

  if (!verifyLineSignature(rawBody, signature)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const body = JSON.parse(rawBody);
  const events = body.events || [];

  await Promise.all(
    events.map(async (event) => {
      if (event.type !== "message" || event.message?.type !== "text") return;
      const reply = await handleTextEvent(event);
      if (reply && event.replyToken) {
        await replyMessage(event.replyToken, textMessage(reply));
      }
    })
  );

  res.status(200).json({ ok: true });
}

export const config = {
  api: {
    bodyParser: false
  }
};
