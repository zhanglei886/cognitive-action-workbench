import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import { AppData } from "../types";
import { formatShortDateTime, isSameDay, todayKey } from "../lib/date";
import { Button, EmptyState, Panel, cx } from "./ui";

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

export function CalendarView({ data }: { data: AppData }) {
  const today = todayKey();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const days = useMemo(() => buildMonthDays(cursor), [cursor]);
  const completedTasks = data.tasks.filter((task) => task.completedAt && isSameDay(task.completedAt, selectedDate));
  const capturedThoughts = data.thoughts.filter((thought) => isSameDay(thought.createdAt, selectedDate));
  const selectedReview = data.dailyReviews[selectedDate];

  const monthLabel = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(cursor);

  const moveMonth = (offset: number) => {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-moss-700 dark:text-moss-300" size={22} />
            <h2 className="text-lg font-semibold">{monthLabel}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => moveMonth(-1)} title="上个月" className="h-9 w-9 px-0">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="secondary" onClick={() => moveMonth(1)} title="下个月" className="h-9 w-9 px-0">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-ink-700/50 dark:text-ink-100/45">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const key = toDateKey(day.date);
            const taskCount = data.tasks.filter((task) => task.completedAt && isSameDay(task.completedAt, key)).length;
            const thoughtCount = data.thoughts.filter((thought) => isSameDay(thought.createdAt, key)).length;
            const isSelected = key === selectedDate;
            const isToday = key === today;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={cx(
                  "aspect-square rounded-xl border p-2 text-left transition",
                  day.inMonth
                    ? "border-white/80 bg-white/70 shadow-[0_8px_24px_rgba(24,26,23,0.035)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-none"
                    : "border-transparent bg-transparent opacity-35",
                  isSelected && "border-ink-900 bg-ink-900 text-white dark:border-ink-50 dark:bg-ink-50 dark:text-ink-900",
                  !isSelected && "hover:border-moss-300 hover:bg-moss-100/50 dark:hover:border-moss-700 dark:hover:bg-moss-700/15",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{day.date.getDate()}</span>
                  {isToday && <span className={cx("h-1.5 w-1.5 rounded-full", isSelected ? "bg-white dark:bg-ink-900" : "bg-moss-700 dark:bg-moss-300")} />}
                </div>
                <div className={cx("mt-2 grid gap-1 text-[11px]", isSelected ? "text-white/75 dark:text-ink-900/70" : "text-ink-700/50 dark:text-ink-100/45")}>
                  {taskCount > 0 && <span>{taskCount} 任务</span>}
                  {thoughtCount > 0 && <span>{thoughtCount} 想法</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{selectedDate}</h2>
          <p className="text-sm text-ink-700/60 dark:text-ink-100/50">当天完成的任务和捕获的思考。</p>
        </div>

        <section className="mt-5">
          <h3 className="text-sm font-semibold">完成的任务</h3>
          <div className="mt-3 grid gap-3">
            {completedTasks.length === 0 && <EmptyState text="这一天没有已完成任务记录。" />}
            {completedTasks.map((task) => (
              <article key={task.id} className="rounded-md border border-ink-200 p-3 dark:border-white/10">
                <div className="font-medium">{task.title}</div>
                <div className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/50">{task.nextAction}</div>
                <div className="mt-2 text-xs text-ink-700/45 dark:text-ink-100/40">
                  {task.type} · {task.estimatedMinutes} 分钟 · {task.completedAt ? formatShortDateTime(task.completedAt) : ""}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">捕获的思考</h3>
          <div className="mt-3 grid gap-3">
            {capturedThoughts.length === 0 && <EmptyState text="这一天没有思考池记录。" />}
            {capturedThoughts.map((thought) => (
              <article key={thought.id} className="rounded-md border border-ink-200 p-3 dark:border-white/10">
                <p className="text-sm leading-6">{thought.content}</p>
                <div className="mt-2 text-xs text-ink-700/45 dark:text-ink-100/40">
                  {thought.tag} · {thought.status} · {formatShortDateTime(thought.createdAt)}
                </div>
              </article>
            ))}
          </div>
        </section>

        {selectedReview && (
          <section className="mt-6 rounded-md bg-moss-100 p-4 dark:bg-moss-700/20">
            <h3 className="text-sm font-semibold text-moss-700 dark:text-moss-100">当天复盘</h3>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-moss-700/85 dark:text-moss-100/80">
              {selectedReview.achieved && <p>做成了：{selectedReview.achieved}</p>}
              {selectedReview.emotion && <p>情绪：{selectedReview.emotion}</p>}
              {selectedReview.adjustment && <p>微调：{selectedReview.adjustment}</p>}
            </div>
          </section>
        )}
      </Panel>
    </div>
  );
}

function buildMonthDays(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      inMonth: date.getMonth() === month,
    };
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
