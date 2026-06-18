import { CalendarClock, CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Edit2, Play, Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ViewKey } from "./AppShell";
import { AppData, CalendarEvent, CalendarEventType, Task, TaskPriority, TaskType, TimerState, TodaySlot } from "../types";
import { todayKey } from "../lib/date";
import { createId } from "../lib/id";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea, cx } from "./ui";

const taskTypes: TaskType[] = ["study", "research", "engineering", "social", "life", "recovery"];
const priorities: Array<[TaskPriority, string]> = [
  ["urgent-important", "紧急且重要"],
  ["important-not-urgent", "不紧急但重要"],
  ["not-important-not-urgent", "不重要且不紧急"],
];
const slots: Array<[TodaySlot, string]> = [
  ["must", "必须完成"],
  ["move", "推进一点"],
  ["care", "保底收尾"],
];
const pageSize = 4;
const allFilter = "all";
const completedFilter = "completed";
const eventTypes: Array<[CalendarEventType, string]> = [
  ["exam", "考试"],
  ["deadline", "截止"],
  ["meeting", "会议"],
  ["milestone", "里程碑"],
  ["personal", "个人"],
];

const blank = { title: "", nextAction: "", type: "study" as TaskType, priority: "important-not-urgent" as TaskPriority, estimatedMinutes: 25, tags: "", deadline: "" };
const eventBlank = { title: "", date: "", type: "exam" as CalendarEventType, note: "" };

export function Tasks({
  data,
  setData,
  setTimer,
  setView,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  setTimer: React.Dispatch<React.SetStateAction<TimerState>>;
  setView: (view: ViewKey) => void;
}) {
  const [draft, setDraft] = useState(blank);
  const [eventDraft, setEventDraft] = useState(eventBlank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskPage, setTaskPage] = useState(0);
  const [taskFilter, setTaskFilter] = useState(allFilter);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTaskNextAction, setShowTaskNextAction] = useState(false);
  const [showEventNote, setShowEventNote] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const editing = data.tasks.find((task) => task.id === editingId);
  const today = todayKey();
  const tags = useMemo(
    () => Array.from(new Set(data.tasks.flatMap((task) => task.tags ?? []))).sort((a, b) => a.localeCompare(b, "zh-CN")),
    [data.tasks],
  );
  const sortedTasks = useMemo(
    () =>
      [...data.tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [data.tasks],
  );
  const filteredTasks = useMemo(() => {
    if (taskFilter === completedFilter) return sortedTasks.filter((task) => task.completed);
    if (taskFilter.startsWith("tag:")) {
      const tag = taskFilter.slice(4);
      return sortedTasks.filter((task) => (task.tags ?? []).includes(tag));
    }
    return sortedTasks;
  }, [sortedTasks, taskFilter]);
  const displayTasks = useMemo(
    () => filteredTasks.filter((task) => taskFilter === completedFilter || showCompleted || !task.completed),
    [filteredTasks, showCompleted, taskFilter],
  );
  const taskPageCount = Math.max(1, Math.ceil(displayTasks.length / pageSize));
  const pageTasks = displayTasks.slice(taskPage * pageSize, (taskPage + 1) * pageSize);
  const upcomingEvents = useMemo(
    () => [...(data.calendarEvents ?? [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3),
    [data.calendarEvents],
  );

  useEffect(() => {
    setTaskPage((page) => Math.min(page, taskPageCount - 1));
  }, [taskPageCount]);

  useEffect(() => {
    setTaskPage(0);
  }, [taskFilter, showCompleted]);

  const saveTask = () => {
    if (!draft.title.trim()) return;
    const payload = {
      title: draft.title,
      nextAction: draft.nextAction,
      type: draft.type,
      priority: draft.priority,
      estimatedMinutes: draft.estimatedMinutes,
      tags: parseTags(draft.tags),
      deadline: draft.deadline ? new Date(draft.deadline).toISOString() : undefined,
    };
    if (editing) {
      setData((current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === editing.id ? { ...task, ...payload } : task)),
      }));
      setEditingId(null);
      setShowAdvanced(false);
      setShowTaskNextAction(false);
    } else {
      const task: Task = {
        id: createId(),
        ...payload,
        pinned: false,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setData((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    }
    setDraft(blank);
    setShowTaskNextAction(false);
  };

  const saveEvent = () => {
    if (!eventDraft.title.trim() || !eventDraft.date) return;
    const event: CalendarEvent = {
      id: createId(),
      title: eventDraft.title.trim(),
      date: new Date(eventDraft.date).toISOString(),
      type: eventDraft.type,
      note: eventDraft.note.trim(),
      createdAt: new Date().toISOString(),
    };
    setData((current) => ({ ...current, calendarEvents: [event, ...(current.calendarEvents ?? [])] }));
    setEventDraft(eventBlank);
    setShowEventNote(false);
  };

  const deleteEvent = (eventId: string) => {
    setData((current) => ({
      ...current,
      calendarEvents: (current.calendarEvents ?? []).filter((event) => event.id !== eventId),
    }));
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setDraft({
      title: task.title,
      nextAction: task.nextAction,
      type: task.type,
      priority: task.priority ?? "important-not-urgent",
      estimatedMinutes: task.estimatedMinutes,
      tags: (task.tags ?? []).join(", "),
      deadline: task.deadline ? toDateTimeLocal(task.deadline) : "",
    });
    setShowAdvanced(true);
    setShowTaskNextAction(true);
  };

  const startTask = (task: Task) => {
    const minutes = task.estimatedMinutes <= 15 ? 15 : task.estimatedMinutes >= 45 ? 50 : 25;
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

  const toggleComplete = (task: Task) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === task.id
          ? { ...item, completed: !item.completed, completedAt: item.completed ? undefined : new Date().toISOString() }
          : item,
      ),
    }));
  };

  const togglePinned = (task: Task) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((item) => (item.id === task.id ? { ...item, pinned: !item.pinned } : item)),
    }));
  };

  const deleteTask = (taskId: string) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
      todayThree: {
        ...current.todayThree,
        [today]: Object.fromEntries(Object.entries(current.todayThree[today] ?? {}).filter(([, id]) => id !== taskId)),
      },
    }));
  };

  const setSlot = (slot: TodaySlot, taskId: string) => {
    setData((current) => ({
      ...current,
      todayThree: {
        ...current.todayThree,
        [today]: { ...(current.todayThree[today] ?? {}), [slot]: taskId },
      },
    }));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{editing ? "编辑任务" : "添加任务"}</h2>
            <p className="mt-1 text-sm text-ink-700/55 dark:text-ink-100/45">先写清楚下一步，其他信息可以晚点补。</p>
          </div>
          <Button variant="ghost" onClick={() => setShowAdvanced((value) => !value)} className="h-9 px-2 text-xs">
            {showAdvanced ? <ChevronUp size={15} className="mr-1" /> : <ChevronDown size={15} className="mr-1" />}
            更多
          </Button>
        </div>
        <div className="mt-4 grid gap-4">
          <Field label="任务标题">
            <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="例如：读完 BIC 论文第二节" />
          </Field>
          <div className="rounded-lg border border-ink-200/80 bg-white/55 p-3 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">下一步动作</div>
              <Button variant="ghost" onClick={() => setShowTaskNextAction((value) => !value)} className="h-8 px-2 text-xs">
                {showTaskNextAction ? <ChevronUp size={14} className="mr-1" /> : <ChevronDown size={14} className="mr-1" />}
                {showTaskNextAction ? "收起" : draft.nextAction ? "查看" : "填写"}
              </Button>
            </div>
            {!showTaskNextAction && draft.nextAction && <p className="mt-2 line-clamp-1 text-xs text-ink-700/55 dark:text-ink-100/45">{draft.nextAction}</p>}
            {showTaskNextAction && (
              <Textarea value={draft.nextAction} onChange={(event) => setDraft({ ...draft, nextAction: event.target.value })} placeholder="下一步要看见、能执行。" className="mt-3 min-h-20" />
            )}
          </div>
          <Field label="预计分钟">
            <Input type="number" min={1} value={draft.estimatedMinutes} onChange={(event) => setDraft({ ...draft, estimatedMinutes: Number(event.target.value) })} />
          </Field>
          {showAdvanced && (
            <div className="grid gap-4 rounded-xl border border-ink-200/80 bg-white/55 p-3 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="类型">
                  <Select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as TaskType })}>
                    {taskTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="看板分类">
                  <Select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as TaskPriority })}>
                    {priorities.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="标签">
                  <Input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="例如：论文, 仿真, 写作" />
                </Field>
                <Field label="DDL">
                  <Input type="datetime-local" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} />
                </Field>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveTask}>
              <Plus size={16} className="mr-2" />
              {editing ? "保存修改" : "添加任务"}
            </Button>
            {editing && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setDraft(blank);
                  setShowAdvanced(false);
                }}
              >
                取消
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-ink-200/80 pt-5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <CalendarPlus size={18} className="text-clay-600 dark:text-clay-100" />
            <h3 className="text-base font-semibold">添加 Event</h3>
          </div>
          <p className="mt-1 text-sm text-ink-700/55 dark:text-ink-100/45">适合期末考、答辩、会议这类“要记住的时间点”，不会进入任务列表。</p>
          <div className="mt-4 grid gap-4">
            <Field label="Event 标题">
              <Input value={eventDraft.title} onChange={(event) => setEventDraft({ ...eventDraft, title: event.target.value })} placeholder="例如：量子力学期末考" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="日期时间">
                <Input type="datetime-local" value={eventDraft.date} onChange={(event) => setEventDraft({ ...eventDraft, date: event.target.value })} />
              </Field>
              <Field label="类型">
                <Select value={eventDraft.type} onChange={(event) => setEventDraft({ ...eventDraft, type: event.target.value as CalendarEventType })}>
                  {eventTypes.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="rounded-lg border border-ink-200/80 bg-white/55 p-3 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">备注</div>
                <Button variant="ghost" onClick={() => setShowEventNote((value) => !value)} className="h-8 px-2 text-xs">
                  {showEventNote ? <ChevronUp size={14} className="mr-1" /> : <ChevronDown size={14} className="mr-1" />}
                  {showEventNote ? "收起" : eventDraft.note ? "查看" : "填写"}
                </Button>
              </div>
              {!showEventNote && eventDraft.note && <p className="mt-2 line-clamp-1 text-xs text-ink-700/55 dark:text-ink-100/45">{eventDraft.note}</p>}
              {showEventNote && (
                <Textarea value={eventDraft.note} onChange={(event) => setEventDraft({ ...eventDraft, note: event.target.value })} placeholder="可选：地点、范围、提醒自己的话。" className="mt-3 min-h-20" />
              )}
            </div>
            <Button onClick={saveEvent} variant="secondary">
              <CalendarPlus size={16} className="mr-2" />
              添加 Event
            </Button>
          </div>

          <div className="mt-5 grid gap-2">
            <div className="text-sm font-semibold">近期 Event</div>
            {upcomingEvents.length === 0 && <EmptyState text="还没有 Event。期末考、答辩、会议可以放在这里。" />}
            {upcomingEvents.map((event) => (
              <article key={event.id} className="rounded-lg border border-ink-200/85 bg-white/55 p-3 dark:border-white/10 dark:bg-white/[0.035]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{event.title}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-700/55 dark:text-ink-100/45">
                      <span>{eventTypeLabel(event.type)}</span>
                      <span>{deadlineText(event.date)}</span>
                    </div>
                    {event.note && (
                      <div className="mt-2">
                        <Button variant="ghost" onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)} className="h-7 px-2 text-xs">
                          {expandedEventId === event.id ? <ChevronUp size={13} className="mr-1" /> : <ChevronDown size={13} className="mr-1" />}
                          备注
                        </Button>
                        {expandedEventId === event.id && <p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/50">{event.note}</p>}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" onClick={() => deleteEvent(event.id)} title="删除 Event" className="h-9 w-9 shrink-0 px-0">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold">任务列表</h2>
        <div className="mt-4 rounded-lg border border-ink-200/80 bg-white/55 p-3 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold">筛选</div>
            {taskFilter !== completedFilter && (
              <Button variant="secondary" onClick={() => setShowCompleted((value) => !value)} className="h-9 text-xs">
                {showCompleted ? <ChevronUp size={15} className="mr-1" /> : <ChevronDown size={15} className="mr-1" />}
                {showCompleted ? "折叠已完成" : "展开已完成"}
              </Button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <FilterButton label={`全部 ${data.tasks.length}`} value={allFilter} active={taskFilter === allFilter} onClick={setTaskFilter} />
            <FilterButton label={`已完成 ${data.tasks.filter((task) => task.completed).length}`} value={completedFilter} active={taskFilter === completedFilter} onClick={setTaskFilter} />
            {tags.map((tag) => (
              <FilterButton
                key={tag}
                label={`#${tag} ${data.tasks.filter((task) => (task.tags ?? []).includes(tag)).length}`}
                value={`tag:${tag}`}
                active={taskFilter === `tag:${tag}`}
                onClick={setTaskFilter}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {data.tasks.length === 0 && <EmptyState text="还没有任务。先写一个能开始的下一步。" />}
          {data.tasks.length > 0 && filteredTasks.length === 0 && <EmptyState text="这个筛选下暂时没有任务。" />}
          {filteredTasks.length > 0 && displayTasks.length === 0 && <EmptyState text="已完成任务已折叠。" />}
          {pageTasks.map((task) => (
            <article key={task.id} className="rounded-lg border border-ink-200 p-4 dark:border-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task)} className="h-4 w-4 accent-moss-700" />
                    <span className={task.completed ? "font-medium line-through text-ink-700/45 dark:text-ink-100/40" : "font-medium"}>{task.title}</span>
                  </label>
                  {task.nextAction && (
                    <div className="mt-2">
                      <Button variant="ghost" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className="h-7 px-2 text-xs">
                        {expandedTaskId === task.id ? <ChevronUp size={13} className="mr-1" /> : <ChevronDown size={13} className="mr-1" />}
                        下一步
                      </Button>
                      {expandedTaskId === task.id && <p className="mt-2 text-sm text-ink-700/65 dark:text-ink-100/55">{task.nextAction}</p>}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-700/55 dark:text-ink-100/45">
                    {task.pinned && <span className="rounded-full bg-moss-100 px-2 py-1 text-moss-700 dark:bg-moss-700/20 dark:text-moss-100">置顶</span>}
                    <span>{task.type}</span>
                    <span>{priorityLabel(task.priority)}</span>
                    <span>{task.estimatedMinutes} 分钟</span>
                    {task.deadline && (
                      <span className={deadlineClass(task.deadline)}>
                        <CalendarClock size={12} />
                        {deadlineText(task.deadline)}
                      </span>
                    )}
                  </div>
                  {(task.tags ?? []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {task.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-moss-100 px-2 py-1 text-xs text-moss-700 dark:bg-moss-700/20 dark:text-moss-100">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!task.completed && (
                    <Button variant="secondary" onClick={() => startTask(task)} title="开始计时">
                      <Play size={16} />
                    </Button>
                  )}
                  <Button variant={task.pinned ? "secondary" : "ghost"} onClick={() => togglePinned(task)} title={task.pinned ? "取消置顶" : "置顶"}>
                    <Star size={16} className={task.pinned ? "fill-current" : ""} />
                  </Button>
                  <Button variant="ghost" onClick={() => startEdit(task)} title="编辑"><Edit2 size={16} /></Button>
                  <Button variant="ghost" onClick={() => deleteTask(task.id)} title="删除"><Trash2 size={16} /></Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {slots.map(([slot, label]) => (
                  <Button key={slot} variant="secondary" onClick={() => setSlot(slot, task.id)} className="text-xs">
                    设为{label}
                  </Button>
                ))}
              </div>
            </article>
          ))}
          {displayTasks.length > pageSize && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200/80 bg-white/60 p-2 dark:border-white/10 dark:bg-white/[0.035]">
              <Button variant="secondary" onClick={() => setTaskPage((page) => Math.max(page - 1, 0))} disabled={taskPage === 0}>
                <ChevronLeft size={16} className="mr-1" />
                上一页
              </Button>
              <span className="text-sm text-ink-700/60 dark:text-ink-100/55">
                {taskPage + 1} / {taskPageCount}
              </span>
              <Button variant="secondary" onClick={() => setTaskPage((page) => Math.min(page + 1, taskPageCount - 1))} disabled={taskPage >= taskPageCount - 1}>
                下一页
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function priorityLabel(priority: TaskPriority) {
  return priorities.find(([value]) => value === priority)?.[1] ?? "不紧急但重要";
}

function eventTypeLabel(type: CalendarEventType) {
  return eventTypes.find(([value]) => value === type)?.[1] ?? "Event";
}

function FilterButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cx(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-ink-900 bg-ink-900 text-white dark:border-ink-50 dark:bg-ink-50 dark:text-ink-900"
          : "border-ink-200 bg-white/70 text-ink-700/70 hover:border-moss-300 hover:bg-moss-100/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-100/65 dark:hover:bg-white/10",
      )}
    >
      {label}
    </button>
  );
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8),
    ),
  );
}

function toDateTimeLocal(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function deadlineText(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
  const time = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
  if (diffDays < 0) return `已过期 · ${time}`;
  if (diffDays === 0) return `今天 · ${time}`;
  if (diffDays === 1) return `明天 · ${time}`;
  return `DDL · ${time}`;
}

function deadlineClass(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-1";
  if (diff < 0) return `${base} bg-clay-100 text-clay-600 dark:bg-clay-600/15 dark:text-clay-100`;
  if (diff < 24 * 60 * 60 * 1000) return `${base} bg-moss-100 text-moss-700 dark:bg-moss-700/20 dark:text-moss-100`;
  return `${base} bg-ink-100 text-ink-700/65 dark:bg-white/10 dark:text-ink-100/60`;
}
