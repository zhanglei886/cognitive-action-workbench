import { useState } from "react";
import { AppShell, ViewKey } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import { CalendarView } from "./components/CalendarView";
import { DailyReview } from "./components/DailyReview";
import { DataManager } from "./components/DataManager";
import { FocusTimer } from "./components/FocusTimer";
import { Login } from "./components/Login";
import { Tasks } from "./components/Tasks";
import { ThoughtPool } from "./components/ThoughtPool";
import { usePersistentApp } from "./hooks/usePersistentApp";
import { UserSession } from "./lib/auth";
import { clearUserSession, loadUserSession, saveUserSession } from "./lib/storage";

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => loadUserSession());

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
      key={session.syncKey}
      session={session}
      onLogout={() => {
        clearUserSession();
        setSession(null);
      }}
    />
  );
}

function Workspace({ session, onLogout }: { session: UserSession; onLogout: () => void }) {
  const [view, setView] = useState<ViewKey>("dashboard");
  const { data, setData, timer, setTimer, theme, setTheme, syncStatus, dailyState, setDailyState, replaceData, clearAll } = usePersistentApp(session.syncKey);

  return (
    <AppShell
      view={view}
      setView={setView}
      theme={theme}
      toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      userName={session.displayName}
      syncStatus={syncStatus}
      onLogout={onLogout}
    >
      {view === "dashboard" && <Dashboard data={data} dailyState={dailyState} setDailyState={setDailyState} timer={timer} />}
      {view === "tasks" && <Tasks data={data} setData={setData} />}
      {view === "timer" && <FocusTimer data={data} setData={setData} timer={timer} setTimer={setTimer} />}
      {view === "thoughts" && <ThoughtPool data={data} setData={setData} />}
      {view === "calendar" && <CalendarView data={data} />}
      {view === "review" && <DailyReview data={data} setData={setData} />}
      {view === "data" && <DataManager data={data} replaceData={replaceData} clearAll={clearAll} />}
    </AppShell>
  );
}
