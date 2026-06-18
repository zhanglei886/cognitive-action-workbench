import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, Clock, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { AppData, CalendarEventType } from "../types";
import { formatShortDateTime, isSameDay, todayKey } from "../lib/date";
import { Button, EmptyState, Panel, cx } from "./ui";

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

export function CalendarView({ data }: { data: AppData }) {
  const today = todayKey();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const days = useMemo(() => buildMonthDays(cursor), [cursor]);
  const completedTasks = data.tasks.filter((task) => task.completedAt && isSameDay(task.completedAt, selectedDate));
  const deadlineTasks = data.tasks.filter((task) => task.deadline && isSameDay(task.deadline, selectedDate));
  const selectedEvents = (data.calendarEvents ?? []).filter((event) => isSameDay(event.date, selectedDate));
  const dateItems = [
    ...deadlineTasks.map((task) => ({
      id: `task-${task.id}`,
      kind: "DDL",
      title: task.title,
      detail: task.nextAction,
      meta: `${task.type} · ${task.deadline ? formatShortDateTime(task.deadline) : ""}`,
      icon: "clock" as const,
      date: task.deadline ?? "",
    })),
    ...selectedEvents.map((event) => ({
      id: `event-${event.id}`,
      kind: "Event",
      title: event.title,
      detail: event.note,
      meta: `${eventTypeLabel(event.type)} · ${formatShortDateTime(event.date)}`,
      icon: "star" as const,
      date: event.date,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const capturedThoughts = data.thoughts.filter((thought) => isSameDay(thought.createdAt, selectedDate));
  const focusRecords = data.timerReflections.filter((record) => isSameDay(record.createdAt, selectedDate));
  const focusMinutes = focusRecords.reduce((total, record) => total + record.modeMinutes, 0);
  const taskActivity = buildTaskActivity(data, completedTasks, focusRecords, selectedDate);
  const weekRange = getWeekRange(selectedDate);
  const weeklyFocusMinutes = data.timerReflections
    .filter((record) => isInDayRange(record.createdAt, weekRange.startKey, weekRange.endKey))
    .reduce((total, record) => total + record.modeMinutes, 0);
  const weeklyCompletedTasks = data.tasks.filter((task) => task.completedAt && isInDayRange(task.completedAt, weekRange.startKey, weekRange.endKey)).length;
  const weeklyThoughts = data.thoughts.filter((thought) => isInDayRange(thought.createdAt, weekRange.startKey, weekRange.endKey)).length;
  const weeklyDeadlines =
    data.tasks.filter((task) => task.deadline && isInDayRange(task.deadline, weekRange.startKey, weekRange.endKey)).length +
    (data.calendarEvents ?? []).filter((event) => isInDayRange(event.date, weekRange.startKey, weekRange.endKey)).length;
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

        <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-ink-700/50 dark:text-ink-100/45">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const key = toDateKey(day.date);
            const hasActivity =
              data.tasks.some((task) => task.completedAt && isSameDay(task.completedAt, key)) ||
              data.thoughts.some((thought) => isSameDay(thought.createdAt, key));
            const hasDeadline =
              data.tasks.some((task) => task.deadline && isSameDay(task.deadline, key)) ||
              (data.calendarEvents ?? []).some((event) => isSameDay(event.date, key));
            const hasFocus = data.timerReflections.some((record) => isSameDay(record.createdAt, key));
            const isSelected = key === selectedDate;
            const isToday = key === today;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={cx(
                  "relative aspect-square overflow-hidden rounded-xl border p-1.5 text-left transition sm:p-2",
                  day.inMonth
                    ? "border-white/80 bg-white/70 shadow-[0_8px_24px_rgba(24,26,23,0.035)] dark:border-white/10 dark:bg-white/[0.045] dark:shadow-none"
                    : "border-transparent bg-transparent opacity-35",
                  (hasActivity || hasDeadline || hasFocus) && day.inMonth && !isSelected && "border-2 border-moss-500/75 ring-1 ring-moss-300/60 dark:border-moss-300/60 dark:ring-moss-700/50",
                  isSelected && "border-clay-600 bg-clay-100 text-clay-600 shadow-soft ring-2 ring-clay-400/35 dark:border-clay-100/70 dark:bg-clay-600 dark:text-white dark:ring-clay-100/15",
                  !isSelected && "hover:border-moss-300 hover:bg-moss-100/50 dark:hover:border-moss-700 dark:hover:bg-moss-700/15",
                )}
              >
                <div className="relative h-full">
                  <span className="block pr-5 text-xs font-semibold leading-none sm:text-sm">{day.date.getDate()}</span>
                  <div className="absolute right-0 top-0 flex max-w-[calc(100%-1.35rem)] items-center justify-end gap-0.5 overflow-hidden sm:gap-1">
                      {hasDeadline && day.inMonth && (
                        <Star
                          className={cx(
                            "h-2.5 w-2.5 shrink-0 fill-current sm:h-3 sm:w-3",
                            isSelected ? "text-clay-600 dark:text-white" : "text-clay-400 dark:text-clay-100",
                          )}
                        />
                      )}
                      {hasActivity && (
                        <span className={cx("h-[5px] w-[5px] shrink-0 rounded-full sm:h-1.5 sm:w-1.5", isSelected ? "bg-clay-600 dark:bg-white" : "bg-clay-400 dark:bg-clay-100")} />
                      )}
                      {isToday && <span className={cx("h-[5px] w-[5px] shrink-0 rounded-full sm:h-1.5 sm:w-1.5", isSelected ? "bg-clay-600/70 dark:bg-white/70" : "bg-moss-700 dark:bg-moss-300")} />}
                  </div>
                  {hasFocus && day.inMonth && (
                    <span className={cx("absolute inset-x-0 bottom-0 h-1 rounded-full", isSelected ? "bg-clay-600/80 dark:bg-white/80" : "bg-moss-500/70 dark:bg-moss-300/75")} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-1 calendar-hide-on-mobile">
          <h2 className="text-lg font-semibold">{selectedDate}</h2>
          <p className="text-sm text-ink-700/60 dark:text-ink-100/50">当天完成的任务和捕获的思考。</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 calendar-hide-on-mobile">
          <div className="rounded-xl border border-moss-300/70 bg-moss-100/70 p-4 dark:border-moss-700/35 dark:bg-[#172015]/75">
            <div className="flex items-center gap-2 text-sm font-semibold text-moss-700 dark:text-moss-100">
              <Clock size={16} />
              <span>{selectedDate === today ? "今日学习时长" : "当天学习时长"}</span>
            </div>
            <div className="mt-3 text-3xl font-semibold tabular-nums">{formatFocusDuration(focusMinutes)}</div>
            <p className="mt-2 text-xs text-ink-700/55 dark:text-ink-100/50">{focusRecords.length > 0 ? "有记录的一天，挺扎实。" : "还没有计时复盘记录。"}</p>
          </div>
          <div className="rounded-xl border border-ink-200/85 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-sm font-semibold text-ink-700/70 dark:text-ink-100/65">完成计时</div>
            <div className="mt-3 text-3xl font-semibold tabular-nums">{focusRecords.length}</div>
            <p className="mt-2 text-xs text-ink-700/55 dark:text-ink-100/50">次专注结束复盘</p>
          </div>
        </div>

        <section className="mt-5 rounded-xl border border-ink-200/85 bg-white/62 p-4 dark:border-white/10 dark:bg-white/[0.04] calendar-hide-on-mobile">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold">本周统计</h3>
            <span className="text-xs text-ink-700/50 dark:text-ink-100/45">{formatWeekRange(weekRange.startKey, weekRange.endKey)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <WeekStat label="学习" value={formatFocusDuration(weeklyFocusMinutes)} />
            <WeekStat label="完成" value={`${weeklyCompletedTasks} 个`} />
            <WeekStat label="想法" value={`${weeklyThoughts} 条`} />
            <WeekStat label="日期" value={`${weeklyDeadlines} 个`} />
          </div>
        </section>

        <section className="mt-3">
          <h3 className="text-sm font-semibold">任务推进</h3>
          <div className="mt-3 grid gap-3">
            {taskActivity.length === 0 && <EmptyState text="这一天还没有任务推进或完成记录。" />}
            {taskActivity.map((item) => (
              <article key={item.id} className="rounded-md border border-ink-200 p-3 dark:border-white/10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    {item.nextAction && <div className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/50">{item.nextAction}</div>}
                    <div className="mt-2 text-xs text-ink-700/45 dark:text-ink-100/40">
                      {item.type}
                      {item.completedAt ? ` · 已完成 ${formatShortDateTime(item.completedAt)}` : " · 推进中"}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-moss-100 px-2 py-1 text-xs font-medium text-moss-700 dark:bg-moss-700/20 dark:text-moss-100">
                    {item.minutes > 0 ? formatFocusDuration(item.minutes) : "无计时记录"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">当天日期事项</h3>
          <div className="mt-3 grid gap-3">
            {dateItems.length === 0 && <EmptyState text="这一天没有 DDL 或 Event。" />}
            {dateItems.map((item) => (
              <article key={item.id} className="rounded-md border border-ink-200 p-3 dark:border-white/10">
                <div className="flex items-start gap-2">
                  {item.icon === "clock" ? (
                    <CalendarClock size={15} className="mt-0.5 shrink-0 text-clay-600 dark:text-clay-100" />
                  ) : (
                    <Star size={15} className="mt-0.5 shrink-0 fill-current text-clay-600 dark:text-clay-100" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <span className="rounded-full bg-clay-100 px-2 py-0.5 text-xs text-clay-600 dark:bg-clay-600/15 dark:text-clay-100">{item.kind}</span>
                    </div>
                    {item.detail && <div className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/50">{item.detail}</div>}
                    <div className="mt-2 text-xs text-ink-700/45 dark:text-ink-100/40">{item.meta}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 calendar-hide-on-mobile">
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

function buildTaskActivity(data: AppData, completedTasks: AppData["tasks"], focusRecords: AppData["timerReflections"], selectedDate: string) {
  const rows = new Map<
    string,
    {
      id: string;
      title: string;
      nextAction: string;
      type: string;
      minutes: number;
      completedAt?: string;
    }
  >();

  completedTasks.forEach((task) => {
    rows.set(task.id, {
      id: task.id,
      title: task.title,
      nextAction: task.nextAction,
      type: task.type,
      minutes: 0,
      completedAt: task.completedAt,
    });
  });

  focusRecords.forEach((record) => {
    const task = record.taskId ? data.tasks.find((item) => item.id === record.taskId) : undefined;
    const id = task?.id ?? `timer-${record.id}`;
    const existing = rows.get(id);
    rows.set(id, {
      id,
      title: existing?.title ?? task?.title ?? "未关联任务",
      nextAction: existing?.nextAction ?? task?.nextAction ?? record.nextStep ?? "",
      type: existing?.type ?? task?.type ?? "focus",
      minutes: (existing?.minutes ?? 0) + record.modeMinutes,
      completedAt: existing?.completedAt ?? (task?.completedAt && isSameDay(task.completedAt, selectedDate) ? task.completedAt : undefined),
    });
  });

  return Array.from(rows.values()).sort((a, b) => {
    if (a.completedAt && !b.completedAt) return -1;
    if (!a.completedAt && b.completedAt) return 1;
    return b.minutes - a.minutes;
  });
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

function formatFocusDuration(minutes: number) {
  if (minutes <= 0) return "0 分钟";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} 分钟`;
  if (rest === 0) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分钟`;
}

function WeekStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-50/70 p-3 text-center dark:bg-white/[0.045]">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-ink-700/50 dark:text-ink-100/45">{label}</div>
    </div>
  );
}

function getWeekRange(dayKey: string) {
  const date = new Date(dayKey);
  const dayIndex = (date.getDay() + 6) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - dayIndex);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    startKey: toDateKey(start),
    endKey: toDateKey(end),
  };
}

function isInDayRange(iso: string, startKey: string, endKey: string) {
  const key = iso.slice(0, 10);
  return key >= startKey && key <= endKey;
}

function formatWeekRange(startKey: string, endKey: string) {
  const formatter = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" });
  return `${formatter.format(new Date(startKey))} - ${formatter.format(new Date(endKey))}`;
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
