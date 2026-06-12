import { AppData, Thought } from "../types";
import { loadAIKey } from "./storage";

const summaryEndpoint = "/.netlify/functions/summarize-thoughts";
const weeklyReportEndpoint = "/.netlify/functions/weekly-report";

export async function summarizeThoughts(thoughts: Thought[]) {
  const apiKey = loadAIKey();
  const response = await fetch(summaryEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-qwen-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      thoughts: thoughts.map(({ content, tag, status, createdAt }) => ({ content, tag, status, createdAt })),
    }),
  });

  const payload = await readPayload(response);
  if (!response.ok) throw new Error(payload.error ?? "AI 总结失败。");
  return payload.summary ?? "";
}

export async function generateWeeklyReport(data: AppData, weekStart: string, weekEnd: string) {
  const apiKey = loadAIKey();
  const response = await fetch(weeklyReportEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-qwen-api-key": apiKey } : {}),
    },
    body: JSON.stringify(buildWeeklyReportPayload(data, weekStart, weekEnd)),
  });

  const payload = await readPayload(response);
  if (!response.ok) throw new Error(payload.error ?? "AI 周报生成失败。");
  return payload.report ?? "";
}

function buildWeeklyReportPayload(data: AppData, weekStart: string, weekEnd: string) {
  const tasks = data.tasks.filter(
    (task) =>
      isInDayRange(task.createdAt, weekStart, weekEnd) ||
      Boolean(task.completedAt && isInDayRange(task.completedAt, weekStart, weekEnd)) ||
      Boolean(task.deadline && isInDayRange(task.deadline, weekStart, weekEnd)),
  );
  const thoughts = data.thoughts.filter((thought) => isInDayRange(thought.createdAt, weekStart, weekEnd));
  const calendarEvents = (data.calendarEvents ?? []).filter((event) => isInDayRange(event.date, weekStart, weekEnd));
  const strategicPlans = (data.strategicPlans ?? []).filter(
    (plan) =>
      isInDayRange(plan.createdAt, weekStart, weekEnd) ||
      Boolean(plan.nextReviewAt && isInDayRange(plan.nextReviewAt, weekStart, weekEnd)) ||
      plan.status === "active" ||
      plan.status === "deciding",
  );
  const timerReflections = data.timerReflections.filter((record) => isInDayRange(record.createdAt, weekStart, weekEnd));
  const dailyReviews = Object.fromEntries(Object.entries(data.dailyReviews).filter(([date]) => date >= weekStart && date <= weekEnd));
  const dailyStates = Object.fromEntries(Object.entries(data.dailyStates).filter(([date]) => date >= weekStart && date <= weekEnd));
  const focusMinutes = timerReflections.reduce((total, record) => total + record.modeMinutes, 0);

  return {
    weekStart,
    weekEnd,
    metrics: {
      focusMinutes,
      completedTasks: tasks.filter((task) => task.completedAt && isInDayRange(task.completedAt, weekStart, weekEnd)).length,
      capturedThoughts: thoughts.length,
      deadlines: tasks.filter((task) => task.deadline && isInDayRange(task.deadline, weekStart, weekEnd)).length + calendarEvents.length,
    },
    tasks,
    calendarEvents,
    strategicPlans,
    thoughts,
    dailyReviews,
    dailyStates,
    timerReflections,
  };
}

function isInDayRange(iso: string, startKey: string, endKey: string) {
  const key = iso.slice(0, 10);
  return key >= startKey && key <= endKey;
}

async function readPayload(response: Response): Promise<{ summary?: string; report?: string; error?: string }> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as { summary?: string; report?: string; error?: string };
  } catch {
    return { error: text.slice(0, 300) };
  }
}
