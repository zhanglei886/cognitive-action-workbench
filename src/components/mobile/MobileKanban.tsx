import { useState } from "react";
import { AppData, Task, TaskPriority } from "../../types";
import { CheckCircle, ChevronLeft, ChevronRight, Play, Clock, CalendarClock } from "lucide-react";
import { cx } from "../ui";

interface Props { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; onStartTimer: (taskId?: string) => void; }

const lanes: Array<{ key: TaskPriority; title: string; borderColor: string }> = [
  { key: "urgent-important", title: "紧急且重要", borderColor: "border-l-red-400" },
  { key: "important-not-urgent", title: "不紧急但重要", borderColor: "border-l-green-400" },
  { key: "not-important-not-urgent", title: "不重要不紧急", borderColor: "border-l-gray-400" },
];

export function MobileKanban({ data, setData, onStartTimer }: Props) {
  const [laneIndex, setLaneIndex] = useState(0);
  const active = data.tasks.filter((t) => !t.completed);
  const lane = lanes[laneIndex];
  const tasks = active.filter((t) => t.priority === lane.key);

  const complete = (id: string) => setData((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t) }));
  const changePrio = (id: string, prio: TaskPriority) => setData((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === id ? { ...t, priority: prio } : t) }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setLaneIndex((i) => Math.max(0, i - 1))} disabled={laneIndex === 0} className="p-1 text-gray-400 dark:text-white/30 disabled:opacity-20"><ChevronLeft size={20} /></button>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{lane.title}</div>
          <div className="text-xs text-gray-400 dark:text-white/40">{tasks.length} 个</div>
        </div>
        <button onClick={() => setLaneIndex((i) => Math.min(2, i + 1))} disabled={laneIndex === 2} className="p-1 text-gray-400 dark:text-white/30 disabled:opacity-20"><ChevronRight size={20} /></button>
      </div>

      <div className="flex justify-center gap-1.5">
        {lanes.map((_, i) => <span key={i} className={cx("h-1.5 w-1.5 rounded-full", i === laneIndex ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-white/20")} />)}
      </div>

      <div className="space-y-1.5">
        {tasks.length === 0 && <div className="py-10 text-center text-sm text-gray-300 dark:text-white/15">这里没有任务</div>}
        {tasks.map((t) => (
          <div key={t.id} className={cx("rounded-xl bg-gray-100 dark:bg-white/5 border-l-2 p-3", lane.borderColor)}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{t.title}</div>
                {t.nextAction && <div className="mt-0.5 text-xs text-gray-500 dark:text-white/40 line-clamp-2">{t.nextAction}</div>}
              </div>
              <button onClick={() => complete(t.id)} className="shrink-0 text-gray-300 dark:text-white/20 hover:text-green-500"><CheckCircle size={16} /></button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 dark:text-white/30">
              <span>{t.type}</span>
              <span className="flex items-center gap-0.5"><Clock size={10} />{t.estimatedMinutes}m</span>
              {t.deadline && <span className="flex items-center gap-0.5 text-red-400"><CalendarClock size={10} />{dText(t.deadline)}</span>}
            </div>
            <div className="mt-2 flex gap-1.5">
              <button onClick={() => onStartTimer(t.id)} className="inline-flex items-center gap-1 rounded-full bg-gray-200 dark:bg-white/10 px-2.5 py-1 text-xs text-gray-700 dark:text-white/60"><Play size={10} />开始</button>
              <select value={t.priority} onChange={(e) => changePrio(t.id, e.target.value as TaskPriority)} className="rounded-full bg-gray-200 dark:bg-white/5 px-2 py-1 text-xs text-gray-500 dark:text-white/40 outline-none">
                {lanes.map((l) => <option key={l.key} value={l.key}>{l.title}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function dText(iso: string) { const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000); if (d < 0) return "过期"; if (d === 0) return "今天"; if (d === 1) return "明天"; return `${d}d`; }
