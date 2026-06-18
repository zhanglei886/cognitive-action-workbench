import { useEffect, useMemo, useRef, useState } from "react";
import { AppData, ThoughtTag, TimerState } from "../../../types";
import { formatTime, getTimerRemainingSeconds, addHours } from "../../../lib/date";
import { createId } from "../../../lib/id";
import { scheduleTimerEndNotification } from "../../../lib/notifications";
import { Pause, Play, Square, Lightbulb, Send } from "lucide-react";
import { BottomSheet } from "../BottomSheet";
import { cx } from "../../ui";

interface Props { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; timer: TimerState; setTimer: React.Dispatch<React.SetStateAction<TimerState>>; }

const modes = [15, 25, 50, 5];

export function TimerPanel({ data, setData, timer, setTimer }: Props) {
  const [nowMs, setNowMs] = useState(Date.now());
  const [showReflection, setShowReflection] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [quickThought, setQuickThought] = useState("");
  const [quickTag, setQuickTag] = useState<ThoughtTag>("idea");
  const [reflection, setReflection] = useState({ completedWhat: "", interruptedBy: "", nextStep: "" });
  const reflectedRef = useRef<string | null>(null);

  const displaySeconds = useMemo(() => getTimerRemainingSeconds(timer, nowMs), [timer, nowMs]);
  const progress = timer.running ? 1 - displaySeconds / (timer.modeMinutes * 60) : 0;
  const selectedTask = data.tasks.find((t) => t.id === timer.selectedTaskId);

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => {
      setNowMs(Date.now());
      setTimer((prev) => {
        if (!prev.running) return prev;
        const r = getTimerRemainingSeconds(prev);
        if (r <= 0) {
          const key = prev.startedAt ?? prev.targetEndAt ?? "end";
          if (reflectedRef.current !== key) { reflectedRef.current = key; setShowReflection(true); scheduleTimerEndNotification(prev.modeMinutes); }
          return { ...prev, remainingSeconds: 0, running: false, targetEndAt: undefined };
        }
        return r !== prev.remainingSeconds ? { ...prev, remainingSeconds: r } : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [setTimer, timer.running]);

  const start = () => setTimer((p) => ({ ...p, running: true, startedAt: p.startedAt ?? new Date().toISOString(), remainingSeconds: p.remainingSeconds || p.modeMinutes * 60, targetEndAt: new Date(Date.now() + (p.remainingSeconds || p.modeMinutes * 60) * 1000).toISOString() }));
  const pause = () => setTimer((p) => ({ ...p, running: false, remainingSeconds: getTimerRemainingSeconds(p), targetEndAt: undefined }));
  const end = () => { setTimer((p) => ({ ...p, running: false, remainingSeconds: getTimerRemainingSeconds(p), targetEndAt: undefined })); setShowReflection(true); };
  const setMode = (m: number) => setTimer((p) => ({ ...p, modeMinutes: m, remainingSeconds: m * 60, running: false, startedAt: undefined, targetEndAt: undefined }));

  const capture = () => {
    if (!quickThought.trim()) { setShowCapture(false); return; }
    setData((prev) => ({ ...prev, thoughts: [{ id: createId(), content: quickThought.trim(), tag: quickTag, status: "cooling", createdAt: new Date().toISOString(), availableAt: addHours(new Date().toISOString(), 24) }, ...prev.thoughts] }));
    setQuickThought(""); setQuickTag("idea"); setShowCapture(false);
  };

  const saveReflection = () => {
    setData((prev) => ({ ...prev, timerReflections: [{ id: createId(), taskId: timer.selectedTaskId, modeMinutes: timer.modeMinutes, ...reflection, createdAt: new Date().toISOString() }, ...prev.timerReflections] }));
    setReflection({ completedWhat: "", interruptedBy: "", nextStep: "" }); setShowReflection(false);
    setTimer((p) => ({ ...p, running: false, remainingSeconds: p.modeMinutes * 60, startedAt: undefined, targetEndAt: undefined }));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mt-4 text-[4.5rem] font-bold leading-none tabular-nums tracking-tight">{formatTime(displaySeconds)}</div>
      <div className="w-full max-w-xs h-1 rounded-full bg-gray-200 dark:bg-white/10 mt-2 mb-4"><div className="h-full rounded-full bg-gray-900 dark:bg-white transition-all duration-1000" style={{ width: `${progress * 100}%` }} /></div>
      <div className="text-center mb-4 text-sm text-gray-500 dark:text-white/40">{selectedTask ? `📋 ${selectedTask.title}` : "未关联任务"}</div>

      <div className="grid grid-cols-4 gap-2 w-full max-w-xs mb-4">
        {modes.map((m) => (
          <button key={m} onClick={() => !timer.running && setMode(m)} disabled={timer.running} className={cx("rounded-xl py-2 text-sm font-medium", timer.modeMinutes === m ? "bg-gray-900 dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60", timer.running && "opacity-50")}>{m}m</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {timer.running ? (
          <button onClick={pause} className="rounded-xl bg-amber-100 dark:bg-amber-400/20 py-3 text-amber-700 dark:text-amber-400 font-semibold flex items-center justify-center gap-2"><Pause size={18} />暂停</button>
        ) : (
          <button onClick={start} className="rounded-xl bg-gray-900 dark:bg-white py-3 text-white dark:text-black font-semibold flex items-center justify-center gap-2"><Play size={18} />{timer.remainingSeconds < timer.modeMinutes * 60 ? "继续" : "开始"}</button>
        )}
        <button onClick={end} className="rounded-xl bg-gray-100 dark:bg-white/10 py-3 text-gray-600 dark:text-white/60 font-semibold flex items-center justify-center gap-2"><Square size={16} />结束</button>
      </div>

      <button onClick={() => setShowCapture(true)} className="mt-4 flex items-center gap-2 text-xs text-gray-400 dark:text-white/25"><Lightbulb size={14} />快速丢想法</button>

      {/* 可选任务列表 */}
      <div className="w-full max-w-xs mt-4">
        <div className="text-xs text-gray-400 dark:text-white/30 mb-2">关联任务</div>
        <div className="max-h-[28vh] overflow-y-auto space-y-1 rounded-xl bg-gray-50 dark:bg-white/[0.03] p-1">
          {data.tasks.filter((t) => !t.completed).slice(0, 10).map((t) => (
            <button
              key={t.id}
              onClick={() => setTimer((p) => ({ ...p, selectedTaskId: t.id === timer.selectedTaskId ? undefined : t.id }))}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm flex items-center justify-between transition active:scale-[0.98] ${
                t.id === timer.selectedTaskId
                  ? "bg-gray-900 dark:bg-white text-white dark:text-black font-medium"
                  : "text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              <span className="truncate">{t.title}</span>
              {t.id === timer.selectedTaskId && <span className="shrink-0 text-[10px] ml-2">已选</span>}
            </button>
          ))}
          {data.tasks.filter((t) => !t.completed).length === 0 && (
            <div className="py-4 text-center text-xs text-gray-300 dark:text-white/15">没有待办任务</div>
          )}
        </div>
      </div>

      <BottomSheet open={showCapture} onClose={() => setShowCapture(false)} title="快速捕获">
        <textarea autoFocus value={quickThought} onChange={(e) => setQuickThought(e.target.value)} placeholder="计时中突然想到什么？" className="w-full rounded-xl bg-white/10 p-4 text-white text-base min-h-[80px] resize-none outline-none placeholder:text-white/25" />
        <div className="mt-3 flex gap-2 flex-wrap">{( ["idea","research","product","emotion"] as ThoughtTag[]).map((t) => <button key={t} onClick={() => setQuickTag(t)} className={cx("rounded-full px-3 py-1 text-xs", quickTag === t ? "bg-white text-black" : "bg-white/10 text-white/50")}>{t}</button>)}</div>
        <button onClick={capture} className="mt-4 w-full rounded-xl bg-white py-3 text-black font-semibold flex items-center justify-center gap-2"><Send size={16} />丢进思考池</button>
      </BottomSheet>

      <BottomSheet open={showReflection} onClose={() => {}} title="计时结束">
        <div className="space-y-3">
          {[{ label: "完成了什么？", key: "completedWhat" as const }, { label: "被什么打断？", key: "interruptedBy" as const }, { label: "下一步？", key: "nextStep" as const }].map((f) => (
            <div key={f.key}><label className="text-xs text-white/40">{f.label}</label>
              {f.key === "nextStep" ? <input value={reflection[f.key]} onChange={(e) => setReflection({ ...reflection, [f.key]: e.target.value })} className="mt-1 w-full rounded-lg bg-white/10 p-3 text-white text-sm outline-none" />
                : <textarea value={reflection[f.key]} onChange={(e) => setReflection({ ...reflection, [f.key]: e.target.value })} className="mt-1 w-full rounded-lg bg-white/10 p-3 text-white text-sm min-h-[50px] resize-none outline-none" />}
            </div>
          ))}
          <button onClick={saveReflection} className="w-full rounded-xl bg-white py-3 text-black font-semibold">保存复盘</button>
        </div>
      </BottomSheet>
    </div>
  );
}
