import { AppData, DailyState, TimerState } from "../types";
import { UserSession } from "./auth";
import { todayKey } from "./date";

const DATA_KEY = "cognitive-action-workbench:data";
const TIMER_KEY = "cognitive-action-workbench:timer";
const THEME_KEY = "cognitive-action-workbench:theme";
const ACCENT_THEME_KEY = "cognitive-action-workbench:accent-theme";
const SESSION_KEY = "cognitive-action-workbench:session";
const AI_KEY = "cognitive-action-workbench:ai-key";
const LEGACY_OPENAI_KEY = "cognitive-action-workbench:openai-key";

export type AccentTheme = "default" | "moss" | "blue" | "warm";
export type LayoutMode = "auto" | "sidebar" | "classic";

const LAYOUT_KEY = "cognitive-action-workbench:layout";

// Scoping: 用 userId 隔离不同用户的数据
const scoped = (key: string, userId?: string) => {
  const id = userId?.trim();
  return id ? `${key}:${id}` : key;
};

export const defaultDailyState = (date = todayKey()): DailyState => ({
  date,
  energy: 3,
  mood: 3,
  focus: 3,
  fatigue: 3,
});

export const defaultData = (): AppData => ({
  version: 1,
  tasks: [],
  calendarEvents: [],
  strategicPlans: [],
  thoughts: [],
  dailyStates: {
    [todayKey()]: defaultDailyState(),
  },
  todayThree: {},
  dailyReviews: {},
  timerReflections: [],
  thoughtSummaries: [],
  weeklyReports: [],
});

export const normalizeData = (candidate: Partial<AppData> | null | undefined): AppData => {
  const fallback = defaultData();
  if (!candidate) return fallback;

  return {
    ...fallback,
    ...candidate,
    version: 1,
    tasks: Array.isArray(candidate.tasks)
      ? candidate.tasks.map((task) => ({
          ...task,
          priority: task.priority ?? "important-not-urgent",
          pinned: Boolean(task.pinned),
          tags: Array.isArray(task.tags) ? task.tags : [],
        }))
      : [],
    calendarEvents: Array.isArray(candidate.calendarEvents) ? candidate.calendarEvents : [],
    strategicPlans: Array.isArray(candidate.strategicPlans) ? candidate.strategicPlans : [],
    thoughts: Array.isArray(candidate.thoughts) ? candidate.thoughts : [],
    dailyStates: candidate.dailyStates && typeof candidate.dailyStates === "object" ? candidate.dailyStates : fallback.dailyStates,
    todayThree: candidate.todayThree && typeof candidate.todayThree === "object" ? candidate.todayThree : {},
    dailyReviews: candidate.dailyReviews && typeof candidate.dailyReviews === "object" ? candidate.dailyReviews : {},
    timerReflections: Array.isArray(candidate.timerReflections) ? candidate.timerReflections : [],
    thoughtSummaries: Array.isArray(candidate.thoughtSummaries) ? candidate.thoughtSummaries : [],
    weeklyReports: Array.isArray(candidate.weeklyReports) ? candidate.weeklyReports : [],
  };
};

export const defaultTimerState = (): TimerState => ({
  modeMinutes: 25,
  remainingSeconds: 25 * 60,
  running: false,
  targetEndAt: undefined,
});

// ============================================================
// User Session
// ============================================================

export function loadUserSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as UserSession;
    if (session.userId && session.email) return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
  return null;
}

export function saveUserSession(session: UserSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearUserSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ============================================================
// Data (localStorage ↔ Supabase bridge)
// localStorage 作为离线缓存，Supabase 是主数据源
// ============================================================

export const loadData = (userId?: string): AppData => {
  try {
    const raw = localStorage.getItem(scoped(DATA_KEY, userId));
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as AppData;
    return normalizeData(parsed);
  } catch {
    return defaultData();
  }
};

export const saveData = (data: AppData, userId?: string) => {
  localStorage.setItem(scoped(DATA_KEY, userId), JSON.stringify(data));
};

export const loadTimer = (userId?: string): TimerState => {
  try {
    const raw = localStorage.getItem(scoped(TIMER_KEY, userId));
    if (!raw) return defaultTimerState();
    return { ...defaultTimerState(), ...(JSON.parse(raw) as TimerState) };
  } catch {
    return defaultTimerState();
  }
};

export const saveTimer = (timer: TimerState, userId?: string) => {
  localStorage.setItem(scoped(TIMER_KEY, userId), JSON.stringify(timer));
};

// ============================================================
// Theme
// ============================================================

export const loadTheme = () => localStorage.getItem(THEME_KEY) ?? "light";

export const saveTheme = (theme: "light" | "dark") => {
  localStorage.setItem(THEME_KEY, theme);
};

export const loadAccentTheme = (): AccentTheme => {
  const v = localStorage.getItem(ACCENT_THEME_KEY);
  if (v === "blue") return "blue";
  if (v === "moss") return "moss";
  if (v === "warm") return "warm";
  return "default";
};

export const loadLayoutMode = (): LayoutMode => {
  const v = localStorage.getItem(LAYOUT_KEY);
  if (v === "sidebar" || v === "classic") return v;
  return "auto";
};

export const saveLayoutMode = (mode: LayoutMode) => {
  localStorage.setItem(LAYOUT_KEY, mode);
};

export const saveAccentTheme = (accentTheme: AccentTheme) => {
  localStorage.setItem(ACCENT_THEME_KEY, accentTheme);
};

// ============================================================
// AI Key（用户自填，暂时保留）
// ============================================================

export const loadAIKey = () =>
  localStorage.getItem(AI_KEY) ?? localStorage.getItem(LEGACY_OPENAI_KEY) ?? "";

export const saveAIKey = (key: string) => {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(AI_KEY, trimmed);
  } else {
    localStorage.removeItem(AI_KEY);
  }
};

// ============================================================
// 导入导出
// ============================================================

export const exportPayload = (data: AppData) =>
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2,
  );

export const importPayload = (raw: string): AppData => {
  const parsed = JSON.parse(raw);
  const candidate = parsed.data ?? parsed;
  if (!candidate || !Array.isArray(candidate.tasks) || !Array.isArray(candidate.thoughts)) {
    throw new Error("导入内容不是有效的工作台数据。");
  }
  return normalizeData(candidate);
};

// ============================================================
// 旧版数据读取（用于迁移工具）
// 读取旧格式（name-scoped）的 localStorage 数据
// ============================================================

export function loadLegacyData(legacyName: string): AppData | null {
  try {
    const namespacedKey = `${DATA_KEY}:${legacyName.trim().toLowerCase()}`;
    const unnamespacedKey = DATA_KEY;
    const raw = localStorage.getItem(namespacedKey) ?? localStorage.getItem(unnamespacedKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppData;
    return normalizeData(parsed);
  } catch {
    return null;
  }
}

export function hasLegacyData(): boolean {
  // 检查是否存在任何旧格式的数据
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(DATA_KEY) && !key.includes(":" + DATA_KEY)) {
      return true;
    }
  }
  return false;
}
