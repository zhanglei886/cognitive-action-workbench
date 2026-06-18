import { useMemo, useState } from "react";
import { CalendarView } from "../../CalendarView";
import { AppData, CalendarEventType } from "../../../types";
import { todayKey } from "../../../lib/date";
import { createId } from "../../../lib/id";
import { CheckCircle, Lightbulb, Timer, Plus } from "lucide-react";
import { BottomSheet } from "../BottomSheet";

interface Props { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; }

const eventTypes: CalendarEventType[] = ["exam", "deadline", "meeting", "milestone", "personal"];

export function CalendarPanel({ data, setData }: Props) {
  const today = todayKey();
  const [popup, setPopup] = useState<"done" | "thoughts" | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState(today);
  const [evType, setEvType] = useState<CalendarEventType>("milestone");
  const [evNote, setEvNote] = useState("");

  const addEvent = () => {
    if (!evTitle.trim()) return;
    setData((prev) => ({
      ...prev,
      calendarEvents: [...(prev.calendarEvents ?? []), {
        id: createId(), title: evTitle.trim(), date: evDate, type: evType,
        note: evNote.trim(), createdAt: new Date().toISOString(),
      }],
    }));
    setEvTitle(""); setEvNote(""); setAddOpen(false);
  };

  const stats = useMemo(() => {
    const done = data.tasks.filter((t) => t.completedAt?.slice(0, 10) === today);
    const thoughts = data.thoughts.filter((t) => t.createdAt.slice(0, 10) === today);
    const focusMin = data.timerReflections.filter((r) => r.createdAt.slice(0, 10) === today).reduce((a, r) => a + r.modeMinutes, 0);
    const d = new Date(); d.setDate(d.getDate() - (d.getDay() || 7) + 1);
    const ws = d.toISOString().slice(0, 10);
    const weekFocusMin = data.timerReflections.filter((r) => r.createdAt.slice(0, 10) >= ws).reduce((a, r) => a + r.modeMinutes, 0);
    const weekDone = data.tasks.filter((t) => (t.completedAt ?? "").slice(0, 10) >= ws).length;
    return { done, thoughts, focusMin, weekFocusMin, weekDone };
  }, [data, today]);

  return (
    <div className="space-y-3 text-gray-900 dark:text-white">
      {/* 添加事项 */}
      <button onClick={() => setAddOpen(true)} className="w-full rounded-xl bg-gray-100 dark:bg-white/5 py-3 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition">
        <Plus size={16} />添加事项 / 截止日期
      </button>

      {/* 今日统计 */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setPopup("done")} className="rounded-xl bg-gray-100 dark:bg-white/5 p-3 text-center active:scale-95 transition">
          <div className="text-xs text-gray-400 dark:text-white/30 mb-1 flex items-center justify-center gap-1"><CheckCircle size={13} />完成任务</div>
          <div className="text-lg font-semibold">{stats.done.length}个</div>
        </button>
        <div className="rounded-xl bg-gray-100 dark:bg-white/5 p-3 text-center">
          <div className="text-xs text-gray-400 dark:text-white/30 mb-1 flex items-center justify-center gap-1"><Timer size={13} />今日专注</div>
          <div className="text-lg font-semibold">{stats.focusMin > 0 ? `${stats.focusMin}分钟` : "--"}</div>
        </div>
        <button onClick={() => setPopup("thoughts")} className="rounded-xl bg-gray-100 dark:bg-white/5 p-3 text-center active:scale-95 transition">
          <div className="text-xs text-gray-400 dark:text-white/30 mb-1 flex items-center justify-center gap-1"><Lightbulb size={13} />捕获想法</div>
          <div className="text-lg font-semibold">{stats.thoughts.length}条</div>
        </button>
      </div>

      {/* 本周统计 */}
      <div className="flex items-center justify-between rounded-xl bg-gray-100 dark:bg-white/5 px-4 py-3 text-sm">
        <span className="text-gray-500 dark:text-white/40">本周</span>
        <span className="flex items-center gap-1"><Timer size={13} className="text-gray-400" />{stats.weekFocusMin} 分钟</span>
        <span className="flex items-center gap-1"><CheckCircle size={13} className="text-gray-400" />{stats.weekDone} 个任务</span>
      </div>

      {/* 日历视图 */}
      <div className="[&_.calendar-hide-on-mobile]:hidden [&_section]:bg-gray-100 [&_section]:dark:bg-white/5 [&_section]:border-gray-200 [&_section]:dark:border-white/10 [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_p]:text-gray-500 [&_p]:dark:text-white/40 [&_button]:!bg-gray-200 [&_button]:dark:!bg-white/10 [&_button]:!text-gray-700 [&_button]:dark:!text-white/70 [&_input]:bg-gray-100 [&_input]:dark:bg-white/10 [&_select]:bg-gray-100 [&_select]:dark:bg-white/10 [&_textarea]:bg-gray-100 [&_textarea]:dark:bg-white/10">
        <CalendarView data={data} />
      </div>

      {/* 完成任务弹窗 */}
      <BottomSheet open={popup === "done"} onClose={() => setPopup(null)} title={`今日完成 (${stats.done.length}个)`}>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {stats.done.length === 0 && <div className="py-8 text-center text-sm text-gray-400 dark:text-white/25">今天还没有完成任务</div>}
          {stats.done.map((t) => (
            <div key={t.id} className="rounded-lg bg-gray-100 dark:bg-white/10 p-3 text-sm text-gray-900 dark:text-white">
              <div className="font-medium">✓ {t.title}</div>
              {t.nextAction && <div className="mt-1 text-xs text-gray-400 dark:text-white/30">{t.nextAction}</div>}
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* 想法弹窗 */}
      <BottomSheet open={popup === "thoughts"} onClose={() => setPopup(null)} title={`今日想法 (${stats.thoughts.length}条)`}>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {stats.thoughts.length === 0 && <div className="py-8 text-center text-sm text-gray-400 dark:text-white/25">今天还没有捕获想法</div>}
          {stats.thoughts.map((t) => (
            <div key={t.id} className="rounded-lg bg-gray-100 dark:bg-white/10 p-3 text-sm text-gray-900 dark:text-white">
              <div>💭 {t.content}</div>
              <div className="mt-1 text-xs text-gray-400 dark:text-white/30">{t.tag} · {t.status}</div>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* 添加事项 */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="添加事项">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 dark:text-white/40">标题</label>
            <input value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="论文截止、组会、考试..." className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400" autoFocus />
          </div>
          <div>
            <label className="text-xs text-gray-400 dark:text-white/40">日期</label>
            <input type="date" value={evDate} onChange={(e) => setEvDate(e.target.value)} className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 dark:text-white/40">类型</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {eventTypes.map((t) => (
                <button key={t} onClick={() => setEvType(t)} className={`rounded-full px-3 py-1.5 text-xs ${evType === t ? "bg-gray-900 dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 dark:text-white/40">备注（可选）</label>
            <input value={evNote} onChange={(e) => setEvNote(e.target.value)} placeholder="补充说明..." className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400" />
          </div>
          <button onClick={addEvent} disabled={!evTitle.trim()} className="w-full rounded-xl bg-gray-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-black disabled:opacity-30">添加</button>
        </div>
      </BottomSheet>
    </div>
  );
}
