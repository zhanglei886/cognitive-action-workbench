import { BarChart3, Brain, CalendarDays, CheckSquare, Database, Download, LogOut, Moon, RotateCcw, Sun, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { SyncStatus } from "../hooks/usePersistentApp";
import { Button, cx } from "./ui";

export type ViewKey = "dashboard" | "tasks" | "timer" | "thoughts" | "calendar" | "review" | "data";

const nav = [
  { key: "dashboard", label: "首页", icon: BarChart3 },
  { key: "tasks", label: "任务", icon: CheckSquare },
  { key: "timer", label: "计时", icon: Timer },
  { key: "thoughts", label: "思考池", icon: Brain },
  { key: "calendar", label: "日历", icon: CalendarDays },
  { key: "review", label: "复盘", icon: RotateCcw },
  { key: "data", label: "数据", icon: Database },
] as const;

export function AppShell({
  view,
  setView,
  theme,
  toggleTheme,
  children,
  userName,
  syncStatus,
  onLogout,
}: {
  view: ViewKey;
  setView: (view: ViewKey) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  children: React.ReactNode;
  userName: string;
  syncStatus: SyncStatus;
  onLogout: () => void;
}) {
  const installPrompt = useInstallPrompt();

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-50 pb-44 text-ink-900 transition dark:bg-[#10120f] dark:text-ink-50 lg:pb-28">
      <div className="calm-grid pointer-events-none absolute inset-0 opacity-80" />
      <header className="sticky top-0 z-20 border-b border-white/70 bg-ink-50/78 backdrop-blur-xl dark:border-white/10 dark:bg-[#10120f]/82">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-normal sm:text-2xl">个人认知与行动工作台</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-ink-700/65 dark:text-ink-100/55">
              <span className="max-w-28 truncate sm:max-w-none">{userName}</span>
              <span className={cx("h-1.5 w-1.5 rounded-full", syncStatus === "error" ? "bg-clay-600" : syncStatus === "saving" || syncStatus === "loading" ? "bg-clay-400" : "bg-moss-500")} />
              <span>{syncText(syncStatus)}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <nav className="hidden flex-wrap gap-1 rounded-xl border border-white/75 bg-white/78 p-1 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:shadow-none lg:flex">
              {nav.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={cx(
                    "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
                    view === key
                      ? "bg-ink-900 text-white shadow-soft dark:bg-ink-50 dark:text-ink-900"
                      : "text-ink-700/78 hover:bg-ink-100 dark:text-ink-100/75 dark:hover:bg-white/10",
                  )}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            {installPrompt.canInstall && (
              <Button variant="secondary" onClick={installPrompt.install} title="安装为应用" className="hidden h-10 px-3 sm:inline-flex">
                <Download size={16} className="mr-2" />
                安装
              </Button>
            )}
            <Button variant="secondary" onClick={toggleTheme} title="切换暗色模式" className="h-10 w-10 px-0">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <Button variant="secondary" onClick={onLogout} title="退出当前名字" className="h-10 w-10 px-0">
              <LogOut size={17} />
            </Button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8">{children}</main>
      <footer className="fixed inset-x-0 bottom-16 z-30 border-t border-white/80 bg-white/86 px-3 py-2 text-center text-[11px] leading-4 text-ink-700/70 shadow-[0_-18px_45px_rgba(24,26,23,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/88 dark:text-ink-100/65 lg:bottom-0 lg:px-4 lg:py-3 lg:text-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
          <span>想法先进池子，行动先做一步。</span>
          <span>没有冲突，不强行深刻。</span>
          <span>没有行动，不继续分析。</span>
        </div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-white/80 bg-white/92 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-18px_45px_rgba(24,26,23,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/92 lg:hidden">
        {nav.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cx(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition",
              view === key
                ? "bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900"
                : "text-ink-700/68 active:bg-ink-100 dark:text-ink-100/65 dark:active:bg-white/10",
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<any>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return {
    canInstall: Boolean(promptEvent),
    install: async () => {
      if (!promptEvent) return;
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
    },
  };
}

function syncText(status: SyncStatus) {
  const map: Record<SyncStatus, string> = {
    loading: "正在读取云端",
    saving: "正在同步",
    synced: "已同步",
    offline: "离线缓存",
    error: "同步失败",
  };
  return map[status];
}
