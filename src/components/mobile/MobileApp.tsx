import { useEffect, useState } from "react";
import { AppData, DailyState, TimerState } from "../../types";
import { UserSession } from "../../lib/auth";
import { SyncStatus } from "../../hooks/usePersistentApp";
import { AccentTheme } from "../../lib/storage";
import { initNativeBridge, setupBackButton, scheduleReviewReminder } from "../../lib/notifications";
import { SidebarLayout } from "./SidebarLayout";
import { PanelKey } from "./Sidebar";
import { TodayPanel } from "./panels/TodayPanel";
import { TimerPanel } from "./panels/TimerPanel";
import { TaskPanel } from "./panels/TaskPanel";
import { ThoughtPanel } from "./panels/ThoughtPanel";
import { AIPanel } from "./panels/AIPanel";
import { CalendarPanel } from "./panels/CalendarPanel";
import { ReportPanel } from "./panels/ReportPanel";
import { ReviewPanel } from "./panels/ReviewPanel";
import { SettingsPanel } from "./panels/SettingsPanel";

interface MobileAppProps {
  session: UserSession;
  onLogout: () => void;
  onToggleLayout: () => void;
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  timer: TimerState;
  setTimer: React.Dispatch<React.SetStateAction<TimerState>>;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  accentTheme: AccentTheme;
  setAccentTheme: (t: AccentTheme) => void;
  syncStatus: SyncStatus;
  dailyState: DailyState;
  setDailyState: (p: Partial<DailyState>) => void;
  replaceData: (d: AppData) => void;
  clearAll: () => void;
}

export function MobileApp(props: MobileAppProps) {
  const { session, theme, setTheme, syncStatus } = props;
  const [panel, setPanel] = useState<PanelKey>("today");

  useEffect(() => { initNativeBridge().then(() => scheduleReviewReminder()); }, []);
  useEffect(() => { setupBackButton(() => setPanel("today")); }, []);

  const startTimer = (taskId?: string) => {
    if (taskId) props.setTimer((prev) => ({ ...prev, selectedTaskId: taskId }));
    setPanel("timer");
  };

  const renderPanel = () => {
    switch (panel) {
      case "today": return <TodayPanel data={props.data} setData={props.setData} dailyState={props.dailyState} setDailyState={props.setDailyState} onStartTimer={startTimer} />;
      case "timer": return <TimerPanel data={props.data} setData={props.setData} timer={props.timer} setTimer={props.setTimer} />;
      case "tasks": return <TaskPanel data={props.data} setData={props.setData} onStartTimer={startTimer} />;
      case "thoughts": return <ThoughtPanel data={props.data} setData={props.setData} />;
      case "ai": return <AIPanel data={props.data} setData={props.setData} />;
      case "calendar": return <CalendarPanel data={props.data} setData={props.setData} />;
      case "report": return <ReportPanel data={props.data} setData={props.setData} />;
      case "review": return <ReviewPanel data={props.data} setData={props.setData} />;
      case "settings": return (
        <SettingsPanel
          data={props.data} replaceData={props.replaceData} clearAll={props.clearAll}
          accentTheme={props.accentTheme} setAccentTheme={props.setAccentTheme}
          userId={session.userId} theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onLogout={props.onLogout} onToggleLayout={props.onToggleLayout}
        />
      );
    }
  };

  return (
    <SidebarLayout active={panel} onChange={setPanel} theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} syncStatus={syncStatus} accent={props.accentTheme}>
      {renderPanel()}
    </SidebarLayout>
  );
}
