import { Moon, Sun } from "lucide-react";
import { SyncStatus } from "../../hooks/usePersistentApp";

interface TopBarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  syncStatus: SyncStatus;
}

const syncDot: Record<SyncStatus, string> = {
  loading: "bg-yellow-400", saving: "bg-blue-400", synced: "bg-green-400",
  offline: "bg-gray-400", error: "bg-red-400",
};

export function TopBar({ theme, onToggleTheme, syncStatus }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-11 bg-white/90 dark:bg-black/90 backdrop-blur border-b border-gray-200 dark:border-white/10 safe-top">
      <h1 className="text-base font-semibold text-gray-900 dark:text-white pl-14">认知工作台</h1>
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${syncDot[syncStatus]}`} title={syncStatus} />
        <button
          onClick={onToggleTheme}
          className="rounded-full p-1.5 text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
