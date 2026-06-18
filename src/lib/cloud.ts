// ============================================================
// Supabase 数据操作层
// ============================================================

import { AppData, DailyState } from "../types";
import { getSupabase } from "./supabase";

// Helper: Promise 超时包装
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

// ============================================================
// 拉取全量数据
// ============================================================

export async function pullAllData(userId: string): Promise<AppData | null> {
  const supabase = getSupabase();

  const [
    { data: tasks },
    { data: calendarEvents },
    { data: strategicPlans },
    { data: thoughts },
    { data: dailyStatesRows },
    { data: dailyReviewsRows },
    { data: timerReflections },
    { data: thoughtSummaries },
    { data: weeklyReports },
    { data: todayThreeRows },
  ] = await withTimeout(Promise.all([
    supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("calendar_events").select("*").eq("user_id", userId).order("date", { ascending: true }),
    supabase.from("strategic_plans").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("thoughts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("daily_states").select("*").eq("user_id", userId),
    supabase.from("daily_reviews").select("*").eq("user_id", userId),
    supabase.from("timer_reflections").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("thought_summaries").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("weekly_reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("today_three").select("*").eq("user_id", userId),
  ]), 3000);

  if (!tasks?.length && !thoughts?.length && !calendarEvents?.length) return null;

  return buildAppData({
    tasks: tasks ?? [], calendarEvents: calendarEvents ?? [],
    strategicPlans: strategicPlans ?? [], thoughts: thoughts ?? [],
    dailyStatesRows: dailyStatesRows ?? [], dailyReviewsRows: dailyReviewsRows ?? [],
    timerReflections: timerReflections ?? [], thoughtSummaries: thoughtSummaries ?? [],
    weeklyReports: weeklyReports ?? [], todayThreeRows: todayThreeRows ?? [],
  });
}

// ============================================================
// 推送全量数据
// ============================================================

export async function pushAllData(userId: string, data: AppData): Promise<void> {
  const supabase = getSupabase();

  // 逐表顺序执行，方便定位是哪个表报错
  const ops: Array<[string, () => Promise<void>]> = [
    ["tasks", async () => { await upsertById(supabase, "tasks", userId, data.tasks.map((t) => addUserId(toTaskRow(t), userId))); }],
    ["thoughts", async () => { await upsertById(supabase, "thoughts", userId, data.thoughts.map((t) => addUserId(toThoughtRow(t), userId))); }],
    ["calendar_events", async () => { await upsertById(supabase, "calendar_events", userId, (data.calendarEvents ?? []).map((e) => addUserId(toCalendarRow(e), userId))); }],
    ["strategic_plans", async () => { await upsertById(supabase, "strategic_plans", userId, (data.strategicPlans ?? []).map((p) => addUserId(toStrategicRow(p), userId))); }],
    ["timer_reflections", async () => { await upsertById(supabase, "timer_reflections", userId, (data.timerReflections ?? []).map((r) => addUserId(toTimerReflectionRow(r), userId))); }],
    ["thought_summaries", async () => { await upsertById(supabase, "thought_summaries", userId, (data.thoughtSummaries ?? []).map((s) => addUserId(toThoughtSummaryRow(s), userId))); }],
    ["weekly_reports", async () => { await upsertById(supabase, "weekly_reports", userId, (data.weeklyReports ?? []).map((r) => addUserId(toWeeklyReportRow(r), userId))); }],
    ["daily_states", async () => { await replaceByDelete(supabase, "daily_states", userId, buildDailyStatesRows(userId, data)); }],
    ["daily_reviews", async () => { await replaceByDelete(supabase, "daily_reviews", userId, buildDailyReviewsRows(userId, data)); }],
    ["today_three", async () => { await replaceByDelete(supabase, "today_three", userId, buildTodayThreeRows(userId, data)); }],
  ];

  for (const [name, fn] of ops) {
    try {
      await withTimeout(fn(), 5000);
    } catch (err) {
      console.error(`[SYNC] ${name} FAILED:`, err);
    }
  }
}

// ============================================================
// Upsert（有 id 的表，用主键冲突检测）
// ============================================================

async function upsertById(supabase: ReturnType<typeof getSupabase>, table: string, userId: string, rows: Record<string, unknown>[]) {
  // upsert 本地所有行
  for (let i = 0; i < rows.length; i += 100) {
    await supabase.from(table).upsert(rows.slice(i, i + 100) as any, { onConflict: "id" });
  }
  // 删除云端多余的行（本地已删的）
  if (rows.length === 0) {
    await supabase.from(table).delete().eq("user_id", userId);
  } else {
    const ids = rows.map((r) => `"${r.id}"`).join(",");
    await supabase.from(table).delete().eq("user_id", userId).not("id", "in", `(${ids})`);
  }
}

// ============================================================
// 先删后插（无 id 的表，或数据量极小的表）
// ============================================================

async function replaceByDelete(supabase: ReturnType<typeof getSupabase>, table: string, userId: string, rows: Record<string, unknown>[]) {
  await supabase.from(table).delete().eq("user_id", userId);
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += 100) {
    await supabase.from(table).insert(rows.slice(i, i + 100) as any);
  }
}

// ============================================================
// 辅助
// ============================================================

function addUserId(obj: Record<string, unknown>, userId: string) {
  return { ...obj, user_id: userId };
}

// ============================================================
// 行转换函数（不含 user_id，由 addUserId 统一添加）
// ============================================================

function toTaskRow(t: any) { return { id: t.id, title: t.title, next_action: t.nextAction ?? "", type: t.type, priority: t.priority, pinned: t.pinned, tags: t.tags ?? [], deadline: t.deadline ?? null, estimated_minutes: t.estimatedMinutes, completed: t.completed, created_at: t.createdAt, completed_at: t.completedAt ?? null }; }
function toThoughtRow(t: any) { return { id: t.id, content: t.content, tag: t.tag, status: t.status, created_at: t.createdAt, available_at: t.availableAt, processed_at: t.processedAt ?? null }; }
function toCalendarRow(e: any) { return { id: e.id, title: e.title, date: e.date, type: e.type, note: e.note ?? "", created_at: e.createdAt }; }
function toStrategicRow(p: any) { return { id: p.id, title: p.title, question: p.question ?? null, area: p.area ?? null, horizon: p.horizon ?? null, status: p.status, next_review_at: p.nextReviewAt ?? null, notes: p.notes ?? "", created_at: p.createdAt }; }
function toTimerReflectionRow(r: any) { return { id: r.id, task_id: r.taskId ?? null, mode_minutes: r.modeMinutes, completed_what: r.completedWhat ?? "", interrupted_by: r.interruptedBy ?? "", next_step: r.nextStep ?? "", created_at: r.createdAt }; }
function toThoughtSummaryRow(s: any) { return { id: s.id, scope: s.scope, content: s.content, thought_count: s.thoughtCount, created_at: s.createdAt }; }
function toWeeklyReportRow(r: any) { return { id: r.id, week_start: r.weekStart, week_end: r.weekEnd, content: r.content, created_at: r.createdAt }; }

function buildDailyStatesRows(userId: string, data: AppData) {
  return Object.entries(data.dailyStates).map(([date, s]) => ({ user_id: userId, date, energy: s.energy, mood: s.mood, focus: s.focus, fatigue: s.fatigue }));
}
function buildDailyReviewsRows(userId: string, data: AppData) {
  return Object.entries(data.dailyReviews).map(([date, r]) => ({ user_id: userId, date, achieved: r.achieved ?? "", emotion: r.emotion ?? "", adjustment: r.adjustment ?? "" }));
}
function buildTodayThreeRows(userId: string, data: AppData) {
  const rows: Array<{ user_id: string; date: string; slot: string; task_id: string | null }> = [];
  for (const [date, slots] of Object.entries(data.todayThree)) {
    for (const slot of ["must", "move", "care"] as const) {
      rows.push({ user_id: userId, date, slot, task_id: slots[slot] ?? null });
    }
  }
  return rows;
}

// ============================================================
// AppData 构建
// ============================================================

function buildAppData(raw: {
  tasks: any[]; calendarEvents: any[]; strategicPlans: any[]; thoughts: any[];
  dailyStatesRows: any[]; dailyReviewsRows: any[]; timerReflections: any[];
  thoughtSummaries: any[]; weeklyReports: any[]; todayThreeRows: any[];
}): AppData {
  const dailyStates: Record<string, DailyState> = {};
  for (const row of raw.dailyStatesRows) dailyStates[row.date] = { date: row.date, energy: row.energy, mood: row.mood, focus: row.focus, fatigue: row.fatigue };

  const dailyReviews: Record<string, any> = {};
  for (const row of raw.dailyReviewsRows) dailyReviews[row.date] = { date: row.date, achieved: row.achieved ?? "", emotion: row.emotion ?? "", adjustment: row.adjustment ?? "" };

  const todayThree: Record<string, any> = {};
  for (const row of raw.todayThreeRows) {
    if (!todayThree[row.date]) todayThree[row.date] = {};
    todayThree[row.date][row.slot] = row.task_id ?? undefined;
  }

  return {
    version: 1,
    tasks: raw.tasks.map(mapTask), calendarEvents: raw.calendarEvents.map(mapCal),
    strategicPlans: raw.strategicPlans.map(mapPlan), thoughts: raw.thoughts.map(mapThought),
    dailyStates, todayThree, dailyReviews,
    timerReflections: raw.timerReflections.map(mapRefl),
    thoughtSummaries: raw.thoughtSummaries.map(mapSum),
    weeklyReports: raw.weeklyReports.map(mapReport),
  };
}

function mapTask(r: any) { return { id: r.id, title: r.title, nextAction: r.next_action ?? "", type: r.type, priority: r.priority, pinned: r.pinned, tags: r.tags ?? [], deadline: r.deadline ?? undefined, estimatedMinutes: r.estimated_minutes, completed: r.completed, createdAt: r.created_at, completedAt: r.completed_at ?? undefined }; }
function mapCal(r: any) { return { id: r.id, title: r.title, date: r.date, type: r.type, note: r.note ?? "", createdAt: r.created_at }; }
function mapPlan(r: any) { return { id: r.id, title: r.title, question: r.question ?? undefined, area: r.area ?? undefined, horizon: r.horizon ?? undefined, status: r.status, nextReviewAt: r.next_review_at ?? undefined, notes: r.notes ?? "", createdAt: r.created_at }; }
function mapThought(r: any) { return { id: r.id, content: r.content, tag: r.tag, status: r.status, createdAt: r.created_at, availableAt: r.available_at, processedAt: r.processed_at ?? undefined }; }
function mapRefl(r: any) { return { id: r.id, taskId: r.task_id ?? undefined, modeMinutes: r.mode_minutes, completedWhat: r.completed_what ?? "", interruptedBy: r.interrupted_by ?? "", nextStep: r.next_step ?? "", createdAt: r.created_at }; }
function mapSum(r: any) { return { id: r.id, scope: r.scope, content: r.content, thoughtCount: r.thought_count, createdAt: r.created_at }; }
function mapReport(r: any) { return { id: r.id, weekStart: r.week_start, weekEnd: r.week_end, content: r.content, createdAt: r.created_at }; }
