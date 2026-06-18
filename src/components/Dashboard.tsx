import { useEffect, useMemo, useState } from "react";
import { Activity, Battery, Brain, CalendarClock, CheckCircle2, Heart, Play, RotateCcw, X } from "lucide-react";
import { ViewKey } from "./AppShell";
import { AppData, CalendarEventType, DailyReview, DailyState, Task, TimerState, TodaySlot } from "../types";
import { formatShortDateTime, formatTime, getTimerRemainingSeconds, todayKey } from "../lib/date";
import { Button, cx, EmptyState, Field, Panel, Textarea } from "./ui";

const slots: Array<[TodaySlot, string, string]> = [
  ["must", "必须完成", "今天最不能掉的一件事"],
  ["move", "推进一点", "让重要事项往前挪一点"],
  ["care", "保底收尾", "低阻力但有用的收尾动作"],
];

export function Dashboard({
  data,
  setData,
  dailyState,
  setDailyState,
  timer,
  setTimer,
  setView,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  dailyState: DailyState;
  setDailyState: (patch: Partial<DailyState>) => void;
  timer: TimerState;
  setTimer: React.Dispatch<React.SetStateAction<TimerState>>;
  setView: (view: ViewKey) => void;
}) {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const today = todayKey();
  const todayThree = data.todayThree[today] ?? {};
  const review: DailyReview = data.dailyReviews[today] ?? { date: today, achieved: "", emotion: "", adjustment: "" };
  const lowEnergy = dailyState.energy <= 2 || dailyState.fatigue >= 4 || dailyState.focus <= 2;
  const todayStats = useMemo(() => getTodayStats(data, today), [data, today]);
  const recentImportantDates = useMemo(() => getRecentImportantDates(data), [data]);
  const stateTrend = useMemo(() => getStateTrend(data.dailyStates, dailyState, today), [data.dailyStates, dailyState, today]);

  const startTask = (task?: Task, minutes = lowEnergy ? 15 : 25) => {
    if (!task) { setView("tasks"); return; }
    setTimer((current) => ({
      ...current,
      selectedTaskId: task.id,
      modeMinutes: minutes,
      remainingSeconds: minutes * 60,
      running: false,
      startedAt: undefined,
      targetEndAt: undefined,
    }));
    setView("timer");
  };

  const completeTask = (task: Task) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((item) => (item.id === task.id ? { ...item, completed: true, completedAt: new Date().toISOString() } : item)),
    }));
  };

  const updateReview = (patch: Partial<DailyReview>) => {
    setData((current) => ({
      ...current,
      dailyReviews: {
        ...current.dailyReviews,
        [today]: { ...review, ...patch },
      },
    }));
  };

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <WeeklyStatsPanel tasks={data.tasks} timerReflections={data.timerReflections} thoughts={data.thoughts} timer={timer} setTimer={setTimer} setView={setView} />

        <Panel className="min-h-[260px] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">今日状态</h2>
              <p className="mt-1 text-xs text-ink-700/55 dark:text-ink-100/45">{lowEnergy ? "建议 15 分钟启动，先做保底收尾。" : "状态够用，先开始一个明确动作。"}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" onClick={() => setShowCloseModal(true)} className="h-9 px-3 text-xs">
                <RotateCcw size={14} className="mr-1.5" />
                收工
              </Button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <CompactScoreField label="精力" value={dailyState.energy} onChange={(energy) => setDailyState({ energy })} icon={<Battery size={14} />} />
            <CompactScoreField label="情绪" value={dailyState.mood} onChange={(mood) => setDailyState({ mood })} icon={<Heart size={14} />} />
            <CompactScoreField label="专注" value={dailyState.focus} onChange={(focus) => setDailyState({ focus })} icon={<Brain size={14} />} />
            <CompactScoreField label="疲劳" value={dailyState.fatigue} onChange={(fatigue) => setDailyState({ fatigue })} icon={<Activity size={14} />} />
          </div>
          <StateTrendPlot points={stateTrend} />
        </Panel>

        <Panel className="min-h-[260px] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">今日三件事</h2>
            <Button variant="ghost" onClick={() => setView("tasks")} className="h-8 px-2 text-xs">管理</Button>
          </div>
          <div className="mt-3 grid gap-2">
            {slots.map(([slot, label, helper]) => {
              const task = data.tasks.find((item) => item.id === todayThree[slot]);
              return (
                <div key={slot} className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 dark:border-white/10">
                  <span className="text-xs font-medium text-ink-700/45 dark:text-ink-100/40 w-14 shrink-0">{label}</span>
                  <span className={cx("min-w-0 flex-1 text-sm truncate", task?.completed && "line-through text-ink-700/40 dark:text-ink-100/30")}>
                    {task?.title ?? "还没有设置"}
                  </span>
                  {task && !task.completed && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="secondary" onClick={() => startTask(task, slot === "care" || lowEnergy ? 15 : 25)} className="h-10 w-10 px-0"><Play size={20} /></Button>
                      <Button variant="secondary" onClick={() => completeTask(task)} className="h-10 w-10 px-0"><CheckCircle2 size={22} /></Button>
                    </div>
                  )}
                  {task?.completed && <CheckCircle2 size={20} className="shrink-0 text-moss-600 dark:text-moss-300" />}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="min-h-[260px] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">近期重要日期</h2>
            <CalendarClock className="text-clay-600 dark:text-clay-100" size={19} />
          </div>
          <div className="mt-3 grid gap-2">
            {recentImportantDates.length === 0 && <EmptyState text="近期没有 DDL 或 Event。" />}
            {recentImportantDates.map((item) => (
              <div key={item.id} className="rounded-lg border border-ink-200 p-3 dark:border-white/10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.title}</div>
                    {item.detail && <div className="mt-1 line-clamp-1 text-xs text-ink-700/55 dark:text-ink-100/45">{item.detail}</div>}
                  </div>
                  <span className={deadlineClass(item.date)}>
                    {item.label} · {deadlineText(item.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {showCloseModal && (
        <Modal title="收工模式" onClose={() => setShowCloseModal(false)}>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="学习时长" value={formatFocusDuration(todayStats.focusMinutes)} />
              <StatPill label="完成任务" value={`${todayStats.completedTasks} 个`} />
              <StatPill label="捕获想法" value={`${todayStats.thoughts} 条`} />
            </div>
            <div className="grid gap-4">
              <Field label="今天做成了什么？">
                <Textarea value={review.achieved} onChange={(event) => updateReview({ achieved: event.target.value })} className="min-h-20" />
              </Field>
              <Field label="今天最明显的情绪是什么？">
                <Textarea value={review.emotion} onChange={(event) => updateReview({ emotion: event.target.value })} className="min-h-20" />
              </Field>
              <Field label="明天要微调什么？">
                <Textarea value={review.adjustment} onChange={(event) => updateReview({ adjustment: event.target.value })} className="min-h-20" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setShowCloseModal(false)} className="h-11">
                保存并收工
              </Button>
              <Button variant="secondary" onClick={() => setView("review")} className="h-11">
                打开复盘页
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex h-[100dvh] items-end justify-center overflow-hidden bg-ink-900/35 px-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-panel dark:border-white/10 dark:bg-ink-900 sm:max-h-[92dvh]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-200/80 p-4 dark:border-white/10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" onClick={onClose} className="h-9 w-9 px-0" title="关闭">
            <X size={17} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function StateTrendPlot({ points }: { points: Array<{ date: string; label: string; score: number }> }) {
  const width = 360;
  const height = 88;
  const paddingX = 18;
  const paddingY = 14;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const plotted = points.length > 0 ? points : [{ date: todayKey(), label: "今日", score: 3 }];
  const coords = plotted.map((point, index) => {
    const x = plotted.length === 1 ? width / 2 : paddingX + (index / (plotted.length - 1)) * innerWidth;
    const y = paddingY + ((5 - point.score) / 4) * innerHeight;
    return { ...point, x, y };
  });
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const latest = coords[coords.length - 1];

  return (
    <div className="mt-3 rounded-xl border border-ink-200/80 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-ink-700/65 dark:text-ink-100/60">近日综合状态</div>
        <div className="text-xs text-ink-700/45 dark:text-ink-100/40">越高越适合推进</div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 h-24 w-full overflow-visible" role="img" aria-label="近日状态综合分折线图">
        {[1, 3, 5].map((score) => {
          const y = paddingY + ((5 - score) / 4) * innerHeight;
          return <line key={score} x1={paddingX} x2={width - paddingX} y1={y} y2={y} className="stroke-ink-200/70 dark:stroke-white/10" strokeWidth="1" />;
        })}
        <path d={`${path} L ${coords[coords.length - 1].x.toFixed(1)} ${height - paddingY} L ${coords[0].x.toFixed(1)} ${height - paddingY} Z`} className="fill-moss-100/55 dark:fill-moss-700/10" />
        <path d={path} fill="none" className="stroke-moss-700 dark:stroke-moss-300" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {coords.map((point) => (
          <g key={point.date}>
            <circle cx={point.x} cy={point.y} r="4" className="fill-white stroke-moss-700 dark:fill-ink-900 dark:stroke-moss-300" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[11px] text-ink-700/50 dark:text-ink-100/45">
        <span>{coords[0].label}</span>
        <span className="font-medium text-ink-700/70 dark:text-ink-100/65">当前 {latest.score.toFixed(1)}</span>
        <span>{latest.label}</span>
      </div>
    </div>
  );
}

function CompactScoreField({ label, value, onChange, icon }: { label: string; value: number; onChange: (value: number) => void; icon: React.ReactNode }) {
  const progress = `${((value - 1) / 4) * 100}%`;
  const updateValue = (event: React.ChangeEvent<HTMLInputElement>) => onChange(Number(event.currentTarget.value));

  return (
    <div className="flex items-center gap-2 rounded-lg border border-ink-200/80 bg-white/65 px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="text-ink-700/45 dark:text-ink-100/40">{icon}</span>
      <div className="min-w-8 text-xs font-medium text-ink-700/65 dark:text-ink-100/60">{label}</div>
      <div className="relative h-6 flex-1">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/12">
          <div className="h-full rounded-full bg-moss-700 transition-[width] dark:bg-moss-300" style={{ width: progress }} />
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={value}
          onInput={updateValue}
          onChange={updateValue}
          className="score-range absolute inset-0 h-6 w-full cursor-pointer bg-transparent"
          aria-label={label}
        />
      </div>
      <span className="w-4 text-right text-xs font-semibold">{value}</span>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-200/80 bg-white/65 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] text-ink-700/50 dark:text-ink-100/45">{label}</div>
    </div>
  );
}


function getTodayStats(data: AppData, today: string) {
  const completedTasks = data.tasks.filter((task) => task.completedAt?.slice(0, 10) === today).length;
  const focusMinutes = data.timerReflections.filter((record) => record.createdAt.slice(0, 10) === today).reduce((total, record) => total + record.modeMinutes, 0);
  const thoughts = data.thoughts.filter((thought) => thought.createdAt.slice(0, 10) === today).length;
  return { completedTasks, focusMinutes, thoughts };
}

function getStateTrend(states: Record<string, DailyState>, todayState: DailyState, today: string) {
  const todayDate = new Date(today);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayDate);
    date.setDate(todayDate.getDate() - (6 - index));
    const key = toDateKey(date);
    const state = key === today ? todayState : states[key];
    if (!state) return null;
    return {
      date: key,
      label: new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(date),
      score: compositeStateScore(state),
    };
  }).filter(Boolean) as Array<{ date: string; label: string; score: number }>;
}

function compositeStateScore(state: DailyState) {
  return (state.energy + state.mood + state.focus + (6 - state.fatigue)) / 4;
}

function getRecentImportantDates(data: AppData) {
  return [
    ...data.tasks
      .filter((task) => !task.completed && task.deadline)
      .map((task) => ({ id: `task-${task.id}`, title: task.title, detail: task.nextAction, date: task.deadline ?? "", label: "DDL" })),
    ...(data.calendarEvents ?? []).map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      detail: event.note,
      date: event.date,
      label: eventTypeLabel(event.type),
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
}

function formatFocusDuration(minutes: number) {
  if (minutes <= 0) return "0 分钟";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} 分钟`;
  if (rest === 0) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分钟`;
}

function deadlineText(iso: string) {
  if (!iso) return "";
  const diffDays = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return `已过期 · ${formatShortDateTime(iso)}`;
  if (diffDays === 0) return `今天 · ${formatShortDateTime(iso)}`;
  if (diffDays === 1) return `明天 · ${formatShortDateTime(iso)}`;
  if (diffDays <= 7) return `${diffDays} 天后 · ${formatShortDateTime(iso)}`;
  return formatShortDateTime(iso);
}

function deadlineClass(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const base = "shrink-0 rounded-full px-2 py-1 text-xs";
  if (diff < 0) return `${base} bg-clay-100 text-clay-600 dark:bg-clay-600/15 dark:text-clay-100`;
  if (diff < 24 * 60 * 60 * 1000) return `${base} bg-moss-100 text-moss-700 dark:bg-moss-700/20 dark:text-moss-100`;
  return `${base} bg-ink-100 text-ink-700/65 dark:bg-white/10 dark:text-ink-100/60`;
}

function eventTypeLabel(type: CalendarEventType) {
  const map: Record<CalendarEventType, string> = {
    exam: "考试",
    deadline: "截止",
    meeting: "会议",
    milestone: "里程碑",
    personal: "个人",
  };
  return map[type] ?? "Event";
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 本周统计卡片
function WeeklyStatsPanel({ tasks, timerReflections, thoughts, timer, setTimer, setView }: {
  tasks: AppData["tasks"]; timerReflections: AppData["timerReflections"]; thoughts: AppData["thoughts"];
  timer: TimerState; setTimer: React.Dispatch<React.SetStateAction<TimerState>>; setView: (v: ViewKey) => void;
}) {
  const [nowMs, setNowMs] = useState(Date.now());
  const displaySeconds = useMemo(() => getTimerRemainingSeconds(timer, nowMs), [timer, nowMs]);

  useEffect(() => {
    if (!timer.running || !timer.targetEndAt) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer.running, timer.targetEndAt]);

  const stats = useMemo(() => {
    const monday = new Date(); monday.setDate(monday.getDate() - (monday.getDay() || 7) + 1);
    const ws = monday.toISOString().slice(0, 10);
    return {
      focusMin: timerReflections.filter((r) => r.createdAt.slice(0, 10) >= ws).reduce((a, r) => a + r.modeMinutes, 0),
      done: tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) >= ws).length,
      captured: thoughts.filter((t) => t.createdAt.slice(0, 10) >= ws).length,
    };
  }, [tasks, timerReflections, thoughts]);

  const fmt = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60}m` : `${m}m`;

  return (
    <Panel className="p-5 flex flex-col items-center h-full">
      <h2 className="text-base font-semibold w-full mb-3">计时器</h2>

      <div className="text-6xl font-bold tabular-nums tracking-tight">{formatTime(displaySeconds)}</div>

      <select
        value={timer.selectedTaskId ?? ""}
        onChange={(e) => setTimer((p) => ({ ...p, selectedTaskId: e.target.value || undefined }))}
        className="mt-3 rounded-lg border border-ink-200/50 bg-transparent px-3 py-1.5 text-xs text-ink-500 dark:text-ink-300 outline-none text-center max-w-[180px]"
      >
        <option value="">关联任务...</option>
        {tasks.filter((t) => !t.completed).slice(0, 15).map((t) => (
          <option key={t.id} value={t.id}>{t.title}</option>
        ))}
      </select>

      <Button variant="secondary" onClick={() => setView("timer")} className="mt-3 h-8 text-xs w-full max-w-[180px]">打开计时器</Button>

      <div className="flex-1" />

      <div className="pt-4 border-t border-ink-200/60 dark:border-white/10 w-full text-center">
        <div className="text-xs text-ink-700/40 dark:text-ink-100/30 mb-1">本周统计</div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-base font-semibold">{fmt(stats.focusMin)}</div><div className="text-[10px] text-ink-700/40">专注</div></div>
          <div><div className="text-base font-semibold">{stats.done} 个</div><div className="text-[10px] text-ink-700/40">完成</div></div>
          <div><div className="text-base font-semibold">{stats.captured} 条</div><div className="text-[10px] text-ink-700/40">想法</div></div>
        </div>
      </div>
    </Panel>
  );
}
