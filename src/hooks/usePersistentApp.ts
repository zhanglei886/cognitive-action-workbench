import { useEffect, useMemo, useRef, useState } from "react";
import { AppData, DailyState, Thought, TimerState } from "../types";
import { todayKey } from "../lib/date";
import { UserSession } from "../lib/auth";
import { pullAllData, pushAllData } from "../lib/cloud";
import {
  defaultDailyState,
  defaultData,
  defaultTimerState,
  loadAccentTheme,
  loadData,
  loadTheme,
  loadTimer,
  saveAccentTheme,
  saveData,
  saveTheme,
  saveTimer,
  normalizeData,
} from "../lib/storage";

export type SyncStatus = "offline" | "loading" | "synced" | "saving" | "error";

export function usePersistentApp(userSession: UserSession) {
  const userId = userSession.userId;

  // 初始化：优先从 localStorage 快速加载，然后从 Supabase 拉取最新数据
  const [data, setData] = useState<AppData>(() => refreshThoughts(loadData(userId)));
  const [timer, setTimer] = useState<TimerState>(() => loadTimer(userId));
  const [theme, setTheme] = useState<"light" | "dark">(() => (loadTheme() === "dark" ? "dark" : "light"));
  const [accentTheme, setAccentTheme] = useState(() => loadAccentTheme());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [cloudReady, setCloudReady] = useState(false);

  const cloudPulled = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushed = useRef<string>("");

  // ---- 从 Supabase 拉取全量数据 ----
  useEffect(() => {
    if (cloudPulled.current) return;
    cloudPulled.current = true;

    setSyncStatus("loading");

    // 兜底：4 秒后无论如何切到离线模式
    const fallbackTimer = setTimeout(() => {
      setCloudReady(true);
      setSyncStatus("offline");
    }, 4000);

    pullAllData(userId)
      .then((cloudData) => {
        clearTimeout(fallbackTimer);
        if (cloudData) {
          setData((prev) => refreshThoughts(normalizeData(cloudData)));
          saveData(cloudData, userId);
        }
        setCloudReady(true);
        setSyncStatus("synced");
      })
      .catch(() => {
        clearTimeout(fallbackTimer);
        setCloudReady(true);
        setSyncStatus("offline");
      });

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [userId]);

  // ---- 数据变更：立即存 localStorage，debounce 推送 Supabase ----
  useEffect(() => {
    saveData(data, userId);
  }, [data, userId]);

  useEffect(() => {
    if (!cloudReady) return;

    const payload = JSON.stringify(data);
    if (payload === lastPushed.current) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);

    pushTimer.current = setTimeout(() => {
      lastPushed.current = payload;
      setSyncStatus("saving");
      pushAllData(userId, data)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }, 800);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [cloudReady, data, userId]);

  // ---- Timer 持久化 ----
  useEffect(() => {
    saveTimer(timer, userId);
  }, [timer, userId]);

  // ---- Theme ----
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.remove("accent-moss", "accent-blue", "accent-warm");
    if (accentTheme !== "default") document.documentElement.classList.add(`accent-${accentTheme}`);
    document.documentElement.setAttribute("data-accent", accentTheme);
    saveAccentTheme(accentTheme);
  }, [accentTheme]);

  // ---- 冷却期检查（每分钟） ----
  useEffect(() => {
    const id = window.setInterval(() => {
      setData((current) => refreshThoughts(current));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // ---- Daily State ----
  const today = todayKey();
  const dailyState = useMemo(() => data.dailyStates[today] ?? defaultDailyState(today), [data.dailyStates, today]);

  const setDailyState = (patch: Partial<DailyState>) => {
    setData((current) => ({
      ...current,
      dailyStates: {
        ...current.dailyStates,
        [today]: { ...(current.dailyStates[today] ?? defaultDailyState(today)), ...patch },
      },
    }));
  };

  // ---- 数据导入/清空 ----
  const replaceData = (next: AppData) => {
    setData(refreshThoughts(next));
    setTimer(defaultTimerState());
  };

  const clearAll = () => {
    setData(defaultData());
    setTimer(defaultTimerState());
  };

  return {
    data,
    setData,
    timer,
    setTimer,
    theme,
    setTheme,
    accentTheme,
    setAccentTheme,
    syncStatus,
    today,
    dailyState,
    setDailyState,
    replaceData,
    clearAll,
  };
}

// ============================================================
// 冷却期检查
// ============================================================

export function refreshThoughts(data: AppData): AppData {
  const now = Date.now();
  let changed = false;
  const thoughts: Thought[] = data.thoughts.map((thought) => {
    if (thought.status === "cooling" && new Date(thought.availableAt).getTime() <= now) {
      changed = true;
      return { ...thought, status: "ready" };
    }
    return thought;
  });
  return changed ? { ...data, thoughts } : data;
}
