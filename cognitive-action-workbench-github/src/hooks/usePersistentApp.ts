import { useEffect, useMemo, useState } from "react";
import { AppData, DailyState, Thought, TimerState } from "../types";
import { todayKey } from "../lib/date";
import { defaultDailyState, defaultData, defaultTimerState, loadData, loadTheme, loadTimer, normalizeData, saveData, saveTheme, saveTimer } from "../lib/storage";
import { pullCloudData, pushCloudData } from "../lib/cloud";

export type SyncStatus = "offline" | "loading" | "synced" | "saving" | "error";

export function usePersistentApp(userName: string) {
  const [data, setData] = useState<AppData>(() => refreshThoughts(loadData(userName)));
  const [timer, setTimer] = useState<TimerState>(() => loadTimer(userName));
  const [theme, setTheme] = useState<"light" | "dark">(() => (loadTheme() === "dark" ? "dark" : "light"));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [cloudReady, setCloudReady] = useState(false);

  useEffect(() => {
    saveData(data, userName);
  }, [data, userName]);

  useEffect(() => {
    saveTimer(timer, userName);
  }, [timer, userName]);

  useEffect(() => {
    let cancelled = false;
    setSyncStatus("loading");
    pullCloudData(userName)
      .then((cloudData) => {
        if (cancelled) return;
        if (cloudData) {
          setData(refreshThoughts(normalizeData(cloudData)));
        }
        setCloudReady(true);
        setSyncStatus("synced");
      })
      .catch(() => {
        if (cancelled) return;
        setCloudReady(true);
        setSyncStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, [userName]);

  useEffect(() => {
    if (!cloudReady) return;
    const handle = window.setTimeout(() => {
      setSyncStatus("saving");
      pushCloudData(userName, data)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }, 800);
    return () => window.clearTimeout(handle);
  }, [cloudReady, data, userName]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setData((current) => refreshThoughts(current));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

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
    syncStatus,
    today,
    dailyState,
    setDailyState,
    replaceData,
    clearAll,
  };
}

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
