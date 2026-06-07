import { Activity, Battery, Brain, Heart, Timer } from "lucide-react";
import { AppData, DailyState, TimerState, TodaySlot } from "../types";
import { formatTime, isSameDay, todayKey } from "../lib/date";
import { Field, Input, Panel } from "./ui";

const slots: Array<[TodaySlot, string]> = [
  ["must", "必须完成"],
  ["move", "推进一点"],
  ["care", "照顾自己"],
];

export function Dashboard({
  data,
  dailyState,
  setDailyState,
  timer,
}: {
  data: AppData;
  dailyState: DailyState;
  setDailyState: (patch: Partial<DailyState>) => void;
  timer: TimerState;
}) {
  const today = todayKey();
  const todayThree = data.todayThree[today] ?? {};
  const stats = {
    captured: data.thoughts.filter((thought) => isSameDay(thought.createdAt, today)).length,
    cooling: data.thoughts.filter((thought) => thought.status === "cooling").length,
    ready: data.thoughts.filter((thought) => thought.status === "ready").length,
  };
  const selectedTask = data.tasks.find((task) => task.id === timer.selectedTaskId);
  const advice = makeAdvice(dailyState);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">今日状态</h2>
            <p className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/55">1 很低，5 很高。只需要粗略感知。</p>
          </div>
          <Activity className="text-moss-700 dark:text-moss-300" size={22} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ScoreField label="精力" value={dailyState.energy} onChange={(energy) => setDailyState({ energy })} icon={<Battery size={16} />} />
          <ScoreField label="情绪" value={dailyState.mood} onChange={(mood) => setDailyState({ mood })} icon={<Heart size={16} />} />
          <ScoreField label="专注" value={dailyState.focus} onChange={(focus) => setDailyState({ focus })} icon={<Brain size={16} />} />
          <ScoreField label="疲劳" value={dailyState.fatigue} onChange={(fatigue) => setDailyState({ fatigue })} icon={<Activity size={16} />} />
        </div>
        <div className="mt-5 rounded-lg bg-moss-100 p-4 text-sm text-moss-700 dark:bg-moss-700/20 dark:text-moss-100">{advice}</div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">当前计时器</h2>
          <Timer className="text-clay-600 dark:text-clay-100" size={22} />
        </div>
        <div className="mt-5 text-5xl font-semibold tabular-nums">{formatTime(timer.remainingSeconds)}</div>
        <p className="mt-3 text-sm text-ink-700/65 dark:text-ink-100/55">
          {timer.running ? "计时进行中" : "计时未运行"}
          {selectedTask ? ` · ${selectedTask.title}` : " · 未选择任务"}
        </p>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold">今日三件事</h2>
        <div className="mt-4 grid gap-3">
          {slots.map(([slot, label]) => {
            const task = data.tasks.find((item) => item.id === todayThree[slot]);
            return (
              <div key={slot} className="rounded-md border border-ink-200 p-4 dark:border-white/10">
                <div className="text-xs font-medium text-ink-700/55 dark:text-ink-100/45">{label}</div>
                <div className="mt-1 text-sm font-medium">{task?.title ?? "还没有设置"}</div>
                {task?.nextAction && <div className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/50">{task.nextAction}</div>}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold">思考池统计</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="今日捕获" value={stats.captured} />
          <Stat label="冷却中" value={stats.cooling} />
          <Stat label="可处理" value={stats.ready} />
        </div>
      </Panel>
    </div>
  );
}

function ScoreField({ label, value, onChange, icon }: { label: string; value: number; onChange: (value: number) => void; icon: React.ReactNode }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3 rounded-md border border-ink-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <span className="text-ink-700/55 dark:text-ink-100/45">{icon}</span>
        <Input
          type="range"
          min={1}
          max={5}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 min-h-0 flex-1 cursor-pointer rounded-full p-0 accent-moss-700"
        />
        <span className="w-5 text-right text-sm font-semibold">{value}</span>
      </div>
    </Field>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-ink-200 p-4 text-center dark:border-white/10">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-ink-700/60 dark:text-ink-100/50">{label}</div>
    </div>
  );
}

function makeAdvice(state: DailyState) {
  if (state.fatigue >= 4 && state.energy <= 2) return "今天适合做短启动和恢复，不适合硬冲。先选一个 15 分钟任务，结束后再决定是否继续。";
  if (state.focus >= 4 && state.energy >= 3) return "专注条件不错。把最重要的一件事放到 50 分钟深度模式，想法只进池子。";
  if (state.mood <= 2) return "情绪偏低，先降低解释欲。做一个明确的下一步，复盘留到晚上。";
  if (state.fatigue >= 4) return "疲劳偏高。安排恢复模式穿插，不要把疲惫误判成意志力问题。";
  return "状态中等，保持朴素推进。一次只处理一个任务，突然想法先丢进思考池。";
}
