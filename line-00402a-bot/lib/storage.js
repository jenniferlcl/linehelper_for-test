import { appendFile, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";

const localFile = process.env.VERCEL ? join(tmpdir(), "line-00402a-records.jsonl") : "local-records.jsonl";
const memoryState = new Map();

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvCommand(command) {
  const response = await fetch(process.env.KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`KV command failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.result;
}

export async function getState(userId) {
  if (!userId) return null;
  if (!hasKv()) return memoryState.get(userId) || null;
  const raw = await kvCommand(["GET", `state:${userId}`]);
  return raw ? JSON.parse(raw) : null;
}

export async function setState(userId, state) {
  if (!userId) return;
  if (!hasKv()) {
    memoryState.set(userId, state);
    return;
  }
  await kvCommand(["SET", `state:${userId}`, JSON.stringify(state), "EX", 60 * 60 * 24]);
}

export async function clearState(userId) {
  if (!userId) return;
  if (!hasKv()) {
    memoryState.delete(userId);
    return;
  }
  await kvCommand(["DEL", `state:${userId}`]);
}

export async function saveRecord(type, payload) {
  const record = {
    id: randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    ...payload
  };

  try {
    if (hasKv()) {
      await kvCommand(["LPUSH", "records", JSON.stringify(record)]);
      await kvCommand(["LTRIM", "records", 0, 999]);
    } else {
      await appendFile(localFile, `${JSON.stringify(record)}\n`, "utf8");
    }
  } catch (error) {
    console.error("saveRecord failed", error);
  }

  return record;
}

export async function listRecords(limit = 50) {
  if (hasKv()) {
    const rows = await kvCommand(["LRANGE", "records", 0, Math.max(0, limit - 1)]);
    return rows.map((row) => JSON.parse(row));
  }

  try {
    const raw = await readFile(localFile, "utf8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .reverse()
      .slice(0, limit);
  } catch {
    return [];
  }
}
