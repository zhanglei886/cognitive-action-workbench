import { UserSession } from "./auth";
import { AppData, DailyState, TimerState } from "../types";
import { todayKey } from "./date";

const DATA_KEY = "cognitive-action-workbench:data";
const TIMER_KEY = "cognitive-action-workbench:timer";
const THEME_KEY = "cognitive-action-workbench:theme";
const USER_KEY = "cognitive-action-workbench:user";
const SESSION_KEY = "cognitive-action-workbench:session";
const AI_KEY = "cognitive-action-workbench:ai-key";
const LEGACY_OPENAI_KEY = "cognitive-action-workbench:openai-key";

const scoped = (key: string, userName?: string) => {
  const user = userName?.trim().toLowerCase();
  return user ? `${key}:${user}` : key;
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
  thoughts: [],
  dailyStates: {
    [todayKey()]: defaultDailyState(),
  },
  todayThree: {},
  dailyReviews: {},
  timerReflections: [],
  thoughtSummaries: [],
});

export const normalizeData = (candidate: Partial<AppData> | null | undefined): AppData => {
  const fallback = defaultData();
  if (!candidate) return fallback;

  return {
    ...fallback,
    ...candidate,
    version: 1,
    tasks: Array.isArray(candidate.tasks) ? candidate.tasks : [],
    thoughts: Array.isArray(candidate.thoughts) ? candidate.thoughts : [],
    dailyStates: candidate.dailyStates && typeof candidate.dailyStates === "object" ? candidate.dailyStates : fallback.dailyStates,
    todayThree: candidate.todayThree && typeof candidate.todayThree === "object" ? candidate.todayThree : {},
    dailyReviews: candidate.dailyReviews && typeof candidate.dailyReviews === "object" ? candidate.dailyReviews : {},
    timerReflections: Array.isArray(candidate.timerReflections) ? candidate.timerReflections : [],
    thoughtSummaries: Array.isArray(candidate.thoughtSummaries) ? candidate.thoughtSummaries : [],
  };
};

export const defaultTimerState = (): TimerState => ({
  modeMinutes: 25,
  remainingSeconds: 25 * 60,
  running: false,
});

export const loadData = (userName?: string): AppData => {
  try {
    const raw = localStorage.getItem(scoped(DATA_KEY, userName));
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as AppData;
    return normalizeData(parsed);
  } catch {
    return defaultData();
  }
};

export const saveData = (data: AppData, userName?: string) => {
  localStorage.setItem(scoped(DATA_KEY, userName), JSON.stringify(data));
};

export const loadTimer = (userName?: string): TimerState => {
  try {
    const raw = localStorage.getItem(scoped(TIMER_KEY, userName));
    if (!raw) return defaultTimerState();
    return { ...defaultTimerState(), ...(JSON.parse(raw) as TimerState) };
  } catch {
    return defaultTimerState();
  }
};

export const saveTimer = (timer: TimerState, userName?: string) => {
  localStorage.setItem(scoped(TIMER_KEY, userName), JSON.stringify(timer));
};

export const loadTheme = () => localStorage.getItem(THEME_KEY) ?? "light";

export const saveTheme = (theme: "light" | "dark") => {
  localStorage.setItem(THEME_KEY, theme);
};

export const loadUserSession = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as UserSession;
      if (session.displayName && session.syncKey) return session;
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }

  const legacyName = localStorage.getItem(USER_KEY);
  return legacyName ? { displayName: legacyName, syncKey: legacyName.trim().toLowerCase() } : null;
};

export const saveUserSession = (session: UserSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(USER_KEY, session.displayName);
};

export const clearUserSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
};

export const loadAIKey = () => localStorage.getItem(AI_KEY) ?? localStorage.getItem(LEGACY_OPENAI_KEY) ?? "";

export const saveAIKey = (key: string) => {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(AI_KEY, trimmed);
  } else {
    localStorage.removeItem(AI_KEY);
  }
};

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
