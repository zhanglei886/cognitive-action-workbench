import { useEffect, useState } from "react";
import { AppShell, ViewKey } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import { CalendarView } from "./components/CalendarView";
import { DailyReview } from "./components/DailyReview";
import { DataManager } from "./components/DataManager";
import { FocusTimer } from "./components/FocusTimer";
import { KanbanBoard } from "./components/KanbanBoard";
import { Login } from "./components/Login";
import { Tasks } from "./components/Tasks";
import { ThoughtPool } from "./components/ThoughtPool";
import { MobileApp } from "./components/mobile/MobileApp";
import { usePersistentApp } from "./hooks/usePersistentApp";
import { signOut, UserSession } from "./lib/auth";
import { saveUserSession, clearUserSession, loadLayoutMode, saveLayoutMode, LayoutMode } from "./lib/storage";
import { isNativePlatform } from "./lib/notifications";

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);

  if (!session) {
    return (
      <Login
        onLogin={(nextSession) => {
          saveUserSession(nextSession);
          setSession(nextSession);
        }}
      />
    );
  }

  return (
    <Workspace
      key={session.userId}
      session={session}
      onLogout={async () => {
        await signOut();
        clearUserSession();
        setSession(null);
      }}
    />
  );
}

function Workspace({ session, onLogout }: { session: UserSession; onLogout: () => void }) {
  const [view, setView] = useState<ViewKey>("dashboard");
  const appState = usePersistentApp(session);
  const [layout, setLayout] = useState<LayoutMode>(() => loadLayoutMode());

  // 自动检测 Capacitor 环境
  useEffect(() => {
    if (layout !== "auto") return;
    const isCapacitor = typeof (window as any).Capacitor !== "undefined" || navigator.userAgent.includes("Capacitor") || isNativePlatform();
    if (isCapacitor) setLayout("sidebar");
  }, [layout]);

  const useMobile = layout === "sidebar";

  // 提供给子组件的布局切换函数
  const toggleLayout = () => {
    const next = useMobile ? "classic" : "sidebar";
    setLayout(next);
    saveLayoutMode(next);
  };

  if (useMobile) {
    return (
      <MobileApp
        session={session}
        onLogout={onLogout}
        onToggleLayout={toggleLayout}
        data={appState.data}
        setData={appState.setData}
        timer={appState.timer}
        setTimer={appState.setTimer}
        theme={appState.theme}
        setTheme={appState.setTheme}
        accentTheme={appState.accentTheme}
        setAccentTheme={appState.setAccentTheme}
        syncStatus={appState.syncStatus}
        dailyState={appState.dailyState}
        setDailyState={appState.setDailyState}
        replaceData={appState.replaceData}
        clearAll={appState.clearAll}
      />
    );
  }

  // Web 端——完全不变的现有代码
  return (
    <AppShell
      view={view}
      setView={setView}
      theme={appState.theme}
      toggleTheme={() => appState.setTheme(appState.theme === "dark" ? "light" : "dark")}
      userName={session.displayName}
      syncStatus={appState.syncStatus}
      onLogout={onLogout}
      data={appState.data}
    >
      {view === "dashboard" && (
        <Dashboard
          data={appState.data}
          setData={appState.setData}
          dailyState={appState.dailyState}
          setDailyState={appState.setDailyState}
          timer={appState.timer}
          setTimer={appState.setTimer}
          setView={setView}
        />
      )}
      {view === "tasks" && <Tasks data={appState.data} setData={appState.setData} setTimer={appState.setTimer} setView={setView} />}
      {view === "board" && <KanbanBoard data={appState.data} setData={appState.setData} />}
      {view === "timer" && <FocusTimer data={appState.data} setData={appState.setData} timer={appState.timer} setTimer={appState.setTimer} />}
      {view === "thoughts" && <ThoughtPool data={appState.data} setData={appState.setData} />}
      {view === "calendar" && <CalendarView data={appState.data} />}
      {view === "review" && <DailyReview data={appState.data} setData={appState.setData} />}
      {view === "data" && <DataManager data={appState.data} replaceData={appState.replaceData} clearAll={appState.clearAll} accentTheme={appState.accentTheme} setAccentTheme={appState.setAccentTheme} userId={session.userId} onToggleLayout={toggleLayout} />}
    </AppShell>
  );
}
