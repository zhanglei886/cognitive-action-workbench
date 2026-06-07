import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppData, Task, TaskType, TodaySlot } from "../types";
import { todayKey } from "../lib/date";
import { createId } from "../lib/id";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea } from "./ui";

const taskTypes: TaskType[] = ["study", "research", "engineering", "social", "life", "recovery"];
const slots: Array<[TodaySlot, string]> = [
  ["must", "必须完成"],
  ["move", "推进一点"],
  ["care", "照顾自己"],
];

const blank = { title: "", nextAction: "", type: "study" as TaskType, estimatedMinutes: 25 };

export function Tasks({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const [draft, setDraft] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = data.tasks.find((task) => task.id === editingId);
  const today = todayKey();

  const saveTask = () => {
    if (!draft.title.trim()) return;
    if (editing) {
      setData((current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === editing.id ? { ...task, ...draft } : task)),
      }));
      setEditingId(null);
    } else {
      const task: Task = {
        id: createId(),
        ...draft,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setData((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    }
    setDraft(blank);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setDraft({ title: task.title, nextAction: task.nextAction, type: task.type, estimatedMinutes: task.estimatedMinutes });
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
          {data.tasks.map((task) => (
            <article key={task.id} className="rounded-lg border border-ink-200 p-4 dark:border-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task)} className="h-4 w-4 accent-moss-700" />
                    <span className={task.completed ? "font-medium line-through text-ink-700/45 dark:text-ink-100/40" : "font-medium"}>{task.title}</span>
                  </label>
                  <p className="mt-2 text-sm text-ink-700/65 dark:text-ink-100/55">{task.nextAction}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-700/55 dark:text-ink-100/45">
                    <span>{task.type}</span>
                    <span>{task.estimatedMinutes} 分钟</span>
                  </div>
                </div>
                <div className="flex gap-2">
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
        </div>
      </Panel>
    </div>
  );
}
