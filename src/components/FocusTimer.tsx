import { Pause, Play, Square, TimerReset } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppData, ThoughtTag, TimerState } from "../types";
import { addHours, formatTime } from "../lib/date";
import { createId } from "../lib/id";
import { Button, Field, Input, Panel, Select, Textarea } from "./ui";

const modes = [
  { label: "15 分钟启动模式", value: 15 },
  { label: "25 分钟普通模式", value: 25 },
  { label: "50 分钟深度模式", value: 50 },
  { label: "5 分钟恢复模式", value: 5 },
];

const thoughtTags: ThoughtTag[] = ["emotion", "relationship", "career", "research", "product", "philosophy", "writing", "idea", "question"];

export function FocusTimer({
  data,
  setData,
  timer,
  setTimer,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  timer: TimerState;
  setTimer: React.Dispatch<React.SetStateAction<TimerState>>;
}) {
  const [quickThought, setQuickThought] = useState("");
  const [quickTag, setQuickTag] = useState<ThoughtTag>("idea");
  const [showThoughtBox, setShowThoughtBox] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState({ completedWhat: "", interruptedBy: "", nextStep: "" });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const reflectedTimerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!timer.running || !timer.targetEndAt) return;
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
      setTimer((current) => {
        if (!current.running || !current.targetEndAt) return current;
        const remaining = getRemainingSeconds(current);
        if (remaining <= 0) {
          const reflectionKey = current.startedAt ?? current.targetEndAt;
          if (reflectedTimerRef.current !== reflectionKey) {
            reflectedTimerRef.current = reflectionKey;
            setShowReflection(true);
          }
          return { ...current, remainingSeconds: 0, running: false, targetEndAt: undefined };
        }
        if (remaining !== current.remainingSeconds) {
          return { ...current, remainingSeconds: remaining };
        }
        return current;
      });
    }, 1000);

    const syncNow = () => setNowMs(Date.now());
    document.addEventListener("visibilitychange", syncNow);
    window.addEventListener("focus", syncNow);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", syncNow);
      window.removeEventListener("focus", syncNow);
    };
  }, [setTimer, timer.running, timer.targetEndAt]);

  useEffect(() => {
    if (!timer.running || !timer.targetEndAt) return;
    const remaining = getRemainingSeconds(timer, nowMs);
    if (remaining <= 0) {
      setTimer((current) => {
        if (!current.running) return current;
        const currentRemaining = getRemainingSeconds(current);
        if (currentRemaining > 0) return current;
        const reflectionKey = current.startedAt ?? current.targetEndAt ?? "timer";
        if (reflectedTimerRef.current !== reflectionKey) {
          reflectedTimerRef.current = reflectionKey;
          setShowReflection(true);
        }
        return { ...current, remainingSeconds: 0, running: false, targetEndAt: undefined };
      });
    }
  }, [nowMs, setTimer, timer]);

  const displaySeconds = useMemo(() => getRemainingSeconds(timer, nowMs), [timer, nowMs]);

  const setMode = (minutes: number) => {
    setTimer((current) => ({
      ...current,
      modeMinutes: minutes,
      remainingSeconds: minutes * 60,
      running: false,
      startedAt: undefined,
      targetEndAt: undefined,
    }));
  };

  const start = () => {
    setTimer((current) => ({
      ...current,
      running: true,
      startedAt: current.startedAt ?? new Date().toISOString(),
      remainingSeconds: current.remainingSeconds || current.modeMinutes * 60,
      targetEndAt: new Date(Date.now() + (current.remainingSeconds || current.modeMinutes * 60) * 1000).toISOString(),
    }));
    setNowMs(Date.now());
  };

  const pause = () =>
    setTimer((current) => ({
      ...current,
      running: false,
      remainingSeconds: getRemainingSeconds(current),
      targetEndAt: undefined,
    }));
  const end = () => {
    setTimer((current) => ({ ...current, running: false, remainingSeconds: getRemainingSeconds(current), targetEndAt: undefined }));
    setShowReflection(true);
  };
  const reset = () => setTimer((current) => ({ ...current, running: false, remainingSeconds: current.modeMinutes * 60, startedAt: undefined, targetEndAt: undefined }));

  const captureThought = () => {
    if (!quickThought.trim()) return;
    const now = new Date().toISOString();
    setData((current) => ({
      ...current,
      thoughts: [
        {
          id: createId(),
          content: quickThought.trim(),
          tag: quickTag,
          status: "cooling",
          createdAt: now,
          availableAt: addHours(now, 24),
        },
        ...current.thoughts,
      ],
    }));
    setQuickThought("");
    setQuickTag("idea");
    setShowThoughtBox(false);
  };

  const saveReflection = () => {
    setData((current) => ({
        ...current,
        timerReflections: [
        {
          id: createId(),
          taskId: timer.selectedTaskId,
          modeMinutes: timer.modeMinutes,
          ...reflection,
          createdAt: new Date().toISOString(),
        },
        ...current.timerReflections,
      ],
    }));
    setReflection({ completedWhat: "", interruptedBy: "", nextStep: "" });
    setShowReflection(false);
    reflectedTimerRef.current = null;
    reset();
  };

  const selectedTask = data.tasks.find((task) => task.id === timer.selectedTaskId);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Panel className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="text-lg font-semibold">Focus Timer</h2>
        <div className="mt-5 text-center">
          <div className="text-7xl font-semibold tabular-nums sm:text-8xl">{formatTime(displaySeconds)}</div>
          <p className="mt-3 text-sm text-ink-700/60 dark:text-ink-100/55">{timer.running ? "正在专注" : "等待开始"}</p>
        </div>
        <div className="mt-6 grid gap-4">
          <Field label="计时模式">
            <Select value={timer.modeMinutes} onChange={(event) => setMode(Number(event.target.value))} disabled={timer.running}>
              {modes.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="关联任务">
            <Select
              value={timer.selectedTaskId ?? ""}
              onChange={(event) => setTimer((current) => ({ ...current, selectedTaskId: event.target.value || undefined }))}
              disabled={timer.running}
            >
              <option value="">不关联任务</option>
              {data.tasks.filter((task) => !task.completed).map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </Select>
          </Field>
          {selectedTask && <div className="rounded-md bg-ink-100 p-3 text-sm text-ink-700 dark:bg-white/5 dark:text-ink-100/65">{selectedTask.nextAction}</div>}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {!timer.running ? (
              <Button onClick={start} className="h-12 sm:h-auto"><Play size={16} className="mr-2" />开始 / 继续</Button>
            ) : (
              <Button variant="secondary" onClick={pause} className="h-12 sm:h-auto"><Pause size={16} className="mr-2" />暂停</Button>
            )}
            <Button variant="secondary" onClick={end} className="h-12 sm:h-auto"><Square size={16} className="mr-2" />结束</Button>
            <Button variant="ghost" onClick={reset} className="col-span-2 h-11 sm:col-span-1 sm:h-auto"><TimerReset size={16} className="mr-2" />重置</Button>
          </div>
          <Button className="h-14 text-base shadow-panel" onClick={() => setShowThoughtBox(true)}>丢进思考池</Button>
        </div>
      </Panel>

      <div className="grid gap-5">
        {showThoughtBox && (
          <Panel>
            <h3 className="text-base font-semibold">快速捕获一个想法</h3>
            <div className="mt-4 grid gap-4">
              <Field label="想法">
                <Textarea value={quickThought} onChange={(event) => setQuickThought(event.target.value)} autoFocus placeholder="先放下，不展开。" />
              </Field>
              <Field label="标签">
                <Select value={quickTag} onChange={(event) => setQuickTag(event.target.value as ThoughtTag)}>
                  {thoughtTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </Select>
              </Field>
              <div className="flex gap-2">
                <Button onClick={captureThought}>保存并回到计时器</Button>
                <Button variant="secondary" onClick={() => setShowThoughtBox(false)}>取消</Button>
              </div>
            </div>
          </Panel>
        )}

        <Panel>
          <h3 className="text-base font-semibold">计时结束复盘记录</h3>
          <div className="mt-4 grid gap-3">
            {data.timerReflections.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-md border border-ink-200 p-3 text-sm dark:border-white/10">
                <div className="font-medium">{item.completedWhat || "没有填写完成内容"}</div>
                <div className="mt-1 text-ink-700/60 dark:text-ink-100/50">下一步：{item.nextStep || "未填写"}</div>
              </div>
            ))}
            {data.timerReflections.length === 0 && <p className="text-sm text-ink-700/55 dark:text-ink-100/45">还没有计时复盘。</p>}
          </div>
        </Panel>
      </div>

      {showReflection && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/35 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-ink-200 bg-white p-5 shadow-panel dark:border-white/10 dark:bg-ink-900">
            <h3 className="text-lg font-semibold">结束前，留三句话</h3>
            <div className="mt-4 grid gap-4">
              <Field label="我完成了什么？">
                <Textarea value={reflection.completedWhat} onChange={(event) => setReflection({ ...reflection, completedWhat: event.target.value })} />
              </Field>
              <Field label="我中途被什么打断？">
                <Textarea value={reflection.interruptedBy} onChange={(event) => setReflection({ ...reflection, interruptedBy: event.target.value })} />
              </Field>
              <Field label="下一步是什么？">
                <Input value={reflection.nextStep} onChange={(event) => setReflection({ ...reflection, nextStep: event.target.value })} />
              </Field>
              <div className="flex gap-2">
                <Button onClick={saveReflection}>保存复盘</Button>
                <Button variant="secondary" onClick={() => setShowReflection(false)}>稍后再写</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getRemainingSeconds(timer: TimerState, now = Date.now()) {
  if (timer.running && timer.targetEndAt) {
    return Math.max(0, Math.ceil((new Date(timer.targetEndAt).getTime() - now) / 1000));
  }
  return Math.max(0, timer.remainingSeconds);
}
