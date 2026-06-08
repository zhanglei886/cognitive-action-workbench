import { CalendarClock, ChevronLeft, ChevronRight, Edit2, Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppData, Task, TaskPriority, TaskType, TodaySlot } from "../types";
import { todayKey } from "../lib/date";
import { createId } from "../lib/id";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea } from "./ui";

const taskTypes: TaskType[] = ["study", "research", "engineering", "social", "life", "recovery"];
const priorities: Array<[TaskPriority, string]> = [
  ["urgent-important", "紧急且重要"],
  ["important-not-urgent", "不紧急但重要"],
  ["not-important-not-urgent", "不重要且不紧急"],
];
const slots: Array<[TodaySlot, string]> = [
  ["must", "必须完成"],
  ["move", "推进一点"],
  ["care", "照顾自己"],
];
const pageSize = 5;

const blank = { title: "", nextAction: "", type: "study" as TaskType, priority: "important-not-urgent" as TaskPriority, estimatedMinutes: 25, tags: "", deadline: "" };

export function Tasks({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const [draft, setDraft] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskPage, setTaskPage] = useState(0);
  const editing = data.tasks.find((task) => task.id === editingId);
  const today = todayKey();
  const sortedTasks = useMemo(
    () =>
      [...data.tasks].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [data.tasks],
  );
  const taskPageCount = Math.max(1, Math.ceil(sortedTasks.length / pageSize));
  const pageTasks = sortedTasks.slice(taskPage * pageSize, (taskPage + 1) * pageSize);

  useEffect(() => {
    setTaskPage((page) => Math.min(page, taskPageCount - 1));
  }, [taskPageCount]);

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
        <h2 className="text-lg font-semibold">{editing ? "编辑任务" : "添加任务"}</h2>
        <div className="mt-4 grid gap-4">
          <Field label="任务标题">
            <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="例如：读完 BIC 论文第二节" />
          </Field>
          <Field label="下一步动作">
            <Textarea value={draft.nextAction} onChange={(event) => setDraft({ ...draft, nextAction: event.target.value })} placeholder="下一步要看见、能执行。" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="类型">
              <Select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as TaskType })}>
                {taskTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </Field>
            <Field label="估计分钟">
              <Input type="number" min={1} value={draft.estimatedMinutes} onChange={(event) => setDraft({ ...draft, estimatedMinutes: Number(event.target.value) })} />
            </Field>
          </div>
          <Field label="看板分类">
            <Select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as TaskPriority })}>
              {priorities.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="标签">
              <Input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="例如：论文, 仿真, 写作" />
            </Field>
            <Field label="DDL">
              <Input type="datetime-local" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveTask}>
              <Plus size={16} className="mr-2" />
              {editing ? "保存修改" : "添加任务"}
            </Button>
            {editing && (
              <Button variant="secondary" onClick={() => { setEditingId(null); setDraft(blank); }}>
                取消
              </Button>
            )}
          </div>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold">任务列表</h2>
        <div className="mt-4 grid gap-3">
          {data.tasks.length === 0 && <EmptyState text="还没有任务。先写一个能开始的下一步。" />}
          {pageTasks.map((task) => (
            <article key={task.id} className="rounded-lg border border-ink-200 p-4 dark:border-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task)} className="h-4 w-4 accent-moss-700" />
                    <span className={task.completed ? "font-medium line-through text-ink-700/45 dark:text-ink-100/40" : "font-medium"}>{task.title}</span>
                  </label>
                  <p className="mt-2 text-sm text-ink-700/65 dark:text-ink-100/55">{task.nextAction}</p>
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
          {sortedTasks.length > pageSize && (
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
