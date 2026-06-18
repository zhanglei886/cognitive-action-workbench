import { LayoutDashboard, Timer, CheckSquare, Lightbulb, Sparkles, CalendarDays, FileText, RotateCcw, Settings } from "lucide-react";
import { AccentTheme } from "../../lib/storage";
import { cx } from "../ui";

export type PanelKey = "today" | "timer" | "tasks" | "thoughts" | "ai" | "calendar" | "report" | "review" | "settings" | "pro";

const items: Array<{ key: PanelKey; icon: any }> = [
  { key: "today", icon: LayoutDashboard },
  { key: "timer", icon: Timer },
  { key: "tasks", icon: CheckSquare },
  { key: "thoughts", icon: Lightbulb },
  { key: "ai", icon: Sparkles },
  { key: "calendar", icon: CalendarDays },
  { key: "report", icon: FileText },
  { key: "review", icon: RotateCcw },
  { key: "settings", icon: Settings },
];

// 三档主题的选中态颜色
const accentBg: Record<AccentTheme, string> = { default: "bg-gray-200 dark:bg-white/15", moss: "bg-green-100 dark:bg-green-500/20", blue: "bg-blue-100 dark:bg-blue-500/20", warm: "bg-orange-100 dark:bg-orange-500/20" };
const accentText: Record<AccentTheme, string> = { default: "text-gray-900 dark:text-white", moss: "text-green-700 dark:text-green-300", blue: "text-blue-700 dark:text-blue-300", warm: "text-orange-700 dark:text-orange-300" };
const accentBar: Record<AccentTheme, string> = { default: "bg-gray-400 dark:bg-white", moss: "bg-green-600 dark:bg-green-400", blue: "bg-blue-600 dark:bg-blue-400", warm: "bg-orange-600 dark:bg-orange-400" };

interface SidebarProps { active: PanelKey; onChange: (k: PanelKey) => void; accent: AccentTheme; }

export function Sidebar({ active, onChange, accent }: SidebarProps) {
  const selBg = accentBg[accent];
  const selText = accentText[accent];
  const selBar = accentBar[accent];

  return (
    <nav className="fixed left-0 top-0 bottom-0 z-40 flex w-14 flex-col items-center gap-1 pt-12 pb-4 bg-gray-50/95 dark:bg-black/95 border-r border-gray-200 dark:border-white/10 safe-bottom">
      {items.map(({ key, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cx(
              "relative flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-90",
              isActive ? selBg + " " + selText : "text-gray-400 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/50"
            )}
          >
            {isActive && <span className={cx("absolute left-0 top-1/2 -translate-y-1/2 h-7 w-0.5 rounded-r-full", selBar)} />}
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
          </button>
        );
      })}
    </nav>
  );
}
