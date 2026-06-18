import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Sidebar, PanelKey } from "./Sidebar";
import { SyncStatus } from "../../hooks/usePersistentApp";
import { AccentTheme } from "../../lib/storage";

interface SidebarLayoutProps {
  active: PanelKey; onChange: (key: PanelKey) => void;
  theme: "light" | "dark"; onToggleTheme: () => void;
  syncStatus: SyncStatus; accent: AccentTheme;
  children: ReactNode;
}

export function SidebarLayout({ active, onChange, theme, onToggleTheme, syncStatus, accent, children }: SidebarLayoutProps) {
  return (
    <div className={`relative min-h-[100dvh] ${theme === "dark" ? "dark" : ""}`}>
      <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-white min-h-[100dvh]">
        <TopBar theme={theme} onToggleTheme={onToggleTheme} syncStatus={syncStatus} />
        <Sidebar active={active} onChange={onChange} accent={accent} />
        <main className="pl-14">
          <div className="px-4 py-3 min-h-[calc(100dvh-44px)] animate-fade-in" key={active}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
