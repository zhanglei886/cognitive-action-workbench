import { useMemo, useState } from "react";
import { AppData, DailyState, Task, TodaySlot } from "../../../types";
import { todayKey } from "../../../lib/date";
import { Play, Battery, Heart, Brain, Activity } from "lucide-react";
import { BottomSheet } from "../BottomSheet";
import { cx } from "../../ui";

interface Props { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; dailyState: DailyState; setDailyState: (p: Partial<DailyState>) => void; onStartTimer: (taskId?: string) => void; }

const slots: Array<[TodaySlot, string]> = [["must", "必须完成"], ["move", "推进一点"], ["care", "保底收尾"]];

export function TodayPanel({ data, setData, dailyState, setDailyState, onStartTimer }: Props) {
  const today = todayKey();
  const todayThree = data.todayThree[today] ?? {};
  const [sheetOpen, setSheetOpen] = useState(false);

  const candidate = data.tasks.find((t) => t.id === todayThree.must && !t.completed)
    ?? data.tasks.find((t) => t.id === todayThree.move && !t.completed)
    ?? data.tasks.find((t) => t.id === todayThree.care && !t.completed)
    ?? data.tasks.find((t) => !t.completed && t.pinned)
    ?? data.tasks.find((t) => !t.completed);

  const lowEnergy = dailyState.energy <= 2 || dailyState.fatigue >= 4;
  const ddls = useMemo(() => getDDLs(data), [data]);

  const complete = (t: Task) => setData((p) => ({ ...p, tasks: p.tasks.map((x) => x.id === t.id ? { ...x, completed: true, completedAt: new Date().toISOString() } : x) }));

  return (
    <div className="space-y-3">
      {/* 日期+状态 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-bold">{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date(today))}</div>
          <div className="text-xs text-gray-500 dark:text-white/40">{new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(new Date(today))}</div>
        </div>
        <button onClick={() => setSheetOpen(true)} className="rounded-full bg-gray-100 dark:bg-white/10 px-3 py-1.5 text-xs">
          {stateEmoji(dailyState)} {stateLabel(dailyState)}
        </button>
      </div>

      {/* 今日三件事 */}
      <div className="space-y-1.5">
        {slots.map(([slot, label]) => {
          const task = data.tasks.find((t) => t.id === todayThree[slot]);
          return (
            <div key={slot} className="rounded-xl bg-gray-100 dark:bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs text-gray-400 dark:text-white/30">{label}</div>
                  <div className="text-sm font-medium truncate">{task?.title ?? "还没设置"}</div>
                </div>
                {task && !task.completed && (
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => onStartTimer(task.id)} className="rounded-full bg-gray-900 dark:bg-white p-1.5 text-white dark:text-black"><Play size={13} /></button>
                    <button onClick={() => complete(task)} className="rounded-full bg-gray-200 dark:bg-white/10 p-1.5 text-gray-500 dark:text-white/50 text-xs">✓</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 计时按钮 */}
      <button onClick={() => onStartTimer(candidate?.id)} className="w-full rounded-xl bg-gray-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-black">
        <Play size={16} className="inline mr-2" fill="currentColor" />
        {lowEnergy ? "开始 15 分钟启动" : "开始 25 分钟专注"}
      </button>

      {/* DDL */}
      {ddls.length > 0 && (
        <div className="rounded-xl bg-gray-100 dark:bg-white/5 p-3">
          <div className="text-xs text-gray-400 dark:text-white/30 mb-1">近期重要日期</div>
          {ddls.map((d) => (
            <div key={d.id} className="flex justify-between text-xs py-0.5">
              <span className="truncate">{d.title}</span>
              <span className={d.urgent ? "text-red-500" : "text-gray-400 dark:text-white/40"}>{d.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 状态 BottomSheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="今日状态">
        <div className="grid gap-3">
          {[
            { icon: <Battery size={16} />, label: "精力", v: dailyState.energy, set: (v: number) => setDailyState({ energy: v }) },
            { icon: <Heart size={16} />, label: "情绪", v: dailyState.mood, set: (v: number) => setDailyState({ mood: v }) },
            { icon: <Brain size={16} />, label: "专注", v: dailyState.focus, set: (v: number) => setDailyState({ focus: v }) },
            { icon: <Activity size={16} />, label: "疲劳", v: dailyState.fatigue, set: (v: number) => setDailyState({ fatigue: v }) },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3" onPointerDown={(e) => e.stopPropagation()}>
              <span className="w-4 text-gray-400 dark:text-white/50">{s.icon}</span>
              <span className="w-8 text-xs text-gray-500 dark:text-white/60">{s.label}</span>
              <div className="flex-1 relative h-8 flex items-center">
                {/* 轨道背景 */}
                <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200 dark:bg-white/20 pointer-events-none" />
                {/* 已填充部分 */}
                <div
                  className="absolute h-1.5 rounded-full bg-gray-900 dark:bg-white pointer-events-none transition-all"
                  style={{ width: `${((s.v - 1) / 4) * 100}%` }}
                />
                <input
                  type="range" min="1" max="5" value={s.v}
                  onChange={(e) => s.set(Number(e.target.value))}
                  className="relative w-full h-8 opacity-0 cursor-pointer"
                  style={{ zIndex: 1 }}
                />
              </div>
              <span className="w-4 text-xs font-semibold text-gray-900 dark:text-white">{s.v}</span>
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}

function getDDLs(data: AppData) {
  const now = Date.now();
  const items = [
    ...data.tasks.filter((t) => !t.completed && t.deadline).map((t) => ({ id: t.id, title: t.title, date: new Date(t.deadline!), text: "", urgent: false })),
    ...(data.calendarEvents ?? []).map((e) => ({ id: e.id, title: e.title, date: new Date(e.date), text: "", urgent: false })),
  ];
  return items
    .map((i) => {
      const diff = Math.ceil((i.date.getTime() - now) / 86400000);
      i.text = diff < 0 ? "已过期" : diff === 0 ? "今天" : diff === 1 ? "明天" : `${diff}天后`;
      i.urgent = diff <= 1;
      return i;
    })
    .filter((i) => Math.abs(Math.ceil((i.date.getTime() - now) / 86400000)) < 7)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);
}

function stateLabel(s: DailyState) { const a = (s.energy + s.mood + s.focus + (6 - s.fatigue)) / 4; return a >= 4 ? "状态很好" : a >= 3 ? "状态中等" : "需要恢复"; }
function stateEmoji(s: DailyState) { const a = (s.energy + s.mood + s.focus + (6 - s.fatigue)) / 4; return a >= 4 ? "⚡" : a >= 3 ? "😊" : "😴"; }
