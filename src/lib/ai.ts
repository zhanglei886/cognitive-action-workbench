// ============================================================
// AI 调用层 — 直接调用 DeepSeek API（用户自填 Key）
// ============================================================

import { AppData, Thought } from "../types";
import { loadAIKey } from "./storage";

const BASE = "https://api.deepseek.com/v1";
const MODEL = "deepseek-chat";

const SYS_SUMMARY = `你是一位温暖而敏锐的个人洞察教练。你会阅读用户的思考笔记，结合心理学视角帮助他们获得更深的自省。语气温暖、敏锐、友善，像一位了解你的朋友。不要评判，不要说教，不要用"你应该"。输出中文 Markdown。结构：## 个人洞察（找出反复出现的主题，用心理学理论解释，引用具体笔记）；## 行动建议（3-4 条具体可执行的建议）。不超过 400 字。`;

const SYS_REPORT = `你是一位温和敏锐的周报叙事者。阅读用户一周数据，写一篇像老朋友聊天的周报。语气自然温和，要具体，提到真实任务名。输出中文 Markdown。结构：## 这一周的你；## 值得注意的瞬间；## 小小的建议。不超过 500 字。`;

export async function summarizeThoughts(thoughts: Thought[]) {
  const apiKey = loadAIKey();
  if (!apiKey) throw new Error("请先在设置中填写 DeepSeek API Key。");

  const resp = await fetch(`${BASE}/chat/completions`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 900, messages: [{ role: "system", content: SYS_SUMMARY }, { role: "user", content: `以下是我的思考笔记，给我个人洞察和行动建议。引用时用"想法#编号"标注：\n${thoughts.map((t, i) => `想法#${i + 1} [${t.tag}/${t.status}] ${t.content.slice(0, 600)}`).join("\n")}` }] }),
  });

  const payload = await readPayload(resp);
  if (!resp.ok) throw new Error(payload.error ?? "AI 总结失败");
  return extractText(payload) ?? "";
}

export async function generateWeeklyReport(data: AppData, weekStart: string, weekEnd: string) {
  const apiKey = loadAIKey();
  if (!apiKey) throw new Error("请先在设置中填写 DeepSeek API Key。");

  const resp = await fetch(`${BASE}/chat/completions`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 1200, messages: [{ role: "system", content: SYS_REPORT }, { role: "user", content: buildReportPrompt(data, weekStart, weekEnd) }] }),
  });

  const payload = await readPayload(resp);
  if (!resp.ok) throw new Error(payload.error ?? "周报生成失败");
  return extractText(payload) ?? "";
}

function buildReportPrompt(data: AppData, weekStart: string, weekEnd: string) {
  const tasks = data.tasks.filter((t) => isInRange(t.createdAt, weekStart, weekEnd) || Boolean(t.completedAt && isInRange(t.completedAt, weekStart, weekEnd)) || Boolean(t.deadline && isInRange(t.deadline, weekStart, weekEnd)));
  const reflections = data.timerReflections.filter((r) => isInRange(r.createdAt, weekStart, weekEnd));
  const reviews = Object.entries(data.dailyReviews).filter(([d]) => d >= weekStart && d <= weekEnd);
  const focus = reflections.reduce((a, r) => a + r.modeMinutes, 0);
  return ["时间：" + weekStart + " ~ " + weekEnd, "专注：" + focus + "分钟", "", "## 任务", ...tasks.slice(0, 15).map((t, i) => (i + 1) + ". [" + (t.completed ? "✓" : "○") + "] " + t.title), "", "## 计时", ...reflections.slice(0, 8).map((r, i) => (i + 1) + ". " + (r.completedWhat || "-")), "", "## 复盘", ...reviews.map(([d, r]) => d + ": " + (r as any).achieved)].join("\n");
}

function isInRange(iso: string, s: string, e: string) { const k = iso.slice(0, 10); return k >= s && k <= e; }
function extractText(p: any) { const c = p?.choices?.[0]?.message?.content; return typeof c === "string" ? c.trim() : ""; }
async function readPayload(r: Response) { const t = await r.text(); if (!t) return {}; try { return JSON.parse(t); } catch { return { error: t.slice(0, 300) }; } }
