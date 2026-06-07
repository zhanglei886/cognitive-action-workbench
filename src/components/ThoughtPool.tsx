import { CheckCircle, CircleSlash, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppData, Thought, ThoughtTag, ThoughtStatus } from "../types";
import { addHours, formatShortDateTime } from "../lib/date";
import { createId } from "../lib/id";
import { Button, EmptyState, Field, Panel, Select, Textarea } from "./ui";
import { summarizeThoughts } from "../lib/ai";

const tags: ThoughtTag[] = ["emotion", "relationship", "career", "research", "product", "philosophy", "writing", "idea", "question"];
const statuses: ThoughtStatus[] = ["cooling", "ready", "processed", "discarded"];

export function ThoughtPool({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<ThoughtTag>("idea");
  const [filter, setFilter] = useState<ThoughtStatus | "all">("all");
  const [summaryScope, setSummaryScope] = useState<"unprocessed" | "ready" | "cooling" | "all">("unprocessed");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const addThought = () => {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    const thought: Thought = {
      id: createId(),
      content: content.trim(),
      tag,
      status: "cooling",
      createdAt: now,
      availableAt: addHours(now, 24),
    };
    setData((current) => ({ ...current, thoughts: [thought, ...current.thoughts] }));
    setContent("");
    setTag("idea");
  };

  const mark = (thoughtId: string, status: ThoughtStatus) => {
    setData((current) => ({
      ...current,
      thoughts: current.thoughts.map((thought) =>
        thought.id === thoughtId ? { ...thought, status, processedAt: status === "processed" || status === "discarded" ? new Date().toISOString() : thought.processedAt } : thought,
      ),
    }));
  };

  const deleteThought = (thoughtId: string) => {
    if (!window.confirm("确定删除这条想法吗？删除后不会出现在思考池和 AI 总结里。")) return;
    setData((current) => ({
      ...current,
      thoughts: current.thoughts.filter((thought) => thought.id !== thoughtId),
    }));
  };

  const convertToTask = (thought: Thought) => {
    setData((current) => ({
      ...current,
      thoughts: current.thoughts.map((item) => (item.id === thought.id ? { ...item, status: "processed", processedAt: new Date().toISOString() } : item)),
      tasks: [
        {
          id: createId(),
          title: thought.content.slice(0, 42),
          nextAction: "从这个想法里定义一个可执行的下一步。",
          type: thought.tag === "research" ? "research" : thought.tag === "emotion" ? "recovery" : "life",
          estimatedMinutes: 25,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        ...current.tasks,
      ],
    }));
  };

  const visible = data.thoughts.filter((thought) => filter === "all" || thought.status === filter);
  const summaryTargets = data.thoughts.filter((thought) => {
    if (summaryScope === "all") return true;
    if (summaryScope === "unprocessed") return thought.status === "cooling" || thought.status === "ready";
    return thought.status === summaryScope;
  });

  const runSummary = async () => {
    setSummaryError("");
    setSummarizing(true);
    try {
      const summary = await summarizeThoughts(summaryTargets);
      setData((current) => ({
        ...current,
        thoughtSummaries: [
          {
            id: createId(),
            scope: summaryScope,
            content: summary,
            thoughtCount: summaryTargets.length,
            createdAt: new Date().toISOString(),
          },
          ...(current.thoughtSummaries ?? []),
        ],
      }));
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "AI 总结失败。");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
      <div className="grid gap-5 lg:self-start">
        <Panel>
          <h2 className="text-lg font-semibold">捕获想法</h2>
          <div className="mt-4 grid gap-4">
            <Field label="内容">
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="先记下来，24 小时后再处理。" />
            </Field>
            <Field label="标签">
              <Select value={tag} onChange={(event) => setTag(event.target.value as ThoughtTag)}>
                {tags.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Field>
            <Button onClick={addThought}><Plus size={16} className="mr-2" />丢进思考池</Button>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold">AI 总结</h2>
          <div className="mt-4 grid gap-4">
            <Field label="总结范围">
              <Select value={summaryScope} onChange={(event) => setSummaryScope(event.target.value as "unprocessed" | "ready" | "cooling" | "all")}>
                <option value="unprocessed">未处理：冷却中 + 可处理</option>
                <option value="ready">只看可处理</option>
                <option value="cooling">只看冷却中</option>
                <option value="all">全部想法</option>
              </Select>
            </Field>
            <Button onClick={runSummary} disabled={summarizing || summaryTargets.length === 0}>
              <Sparkles size={16} className="mr-2" />
              {summarizing ? "正在总结" : `总结 ${summaryTargets.length} 条想法`}
            </Button>
            {summaryError && <div className="rounded-md bg-clay-100 p-3 text-sm text-clay-600 dark:bg-clay-600/15 dark:text-clay-100">{summaryError}</div>}
          </div>
          <div className="mt-5 grid gap-3">
            {(data.thoughtSummaries ?? []).slice(0, 3).map((summary) => (
              <article key={summary.id} className="rounded-md border border-ink-200 p-3 dark:border-white/10">
                <div className="mb-2 text-xs text-ink-700/55 dark:text-ink-100/45">
                  {summary.thoughtCount} 条 · {summary.scope} · {formatShortDateTime(summary.createdAt)}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-6 text-ink-700 dark:text-ink-100/75">{summary.content}</div>
              </article>
            ))}
            {(data.thoughtSummaries ?? []).length === 0 && <p className="text-sm text-ink-700/55 dark:text-ink-100/45">还没有 AI 总结。</p>}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">思考池</h2>
          <Select value={filter} onChange={(event) => setFilter(event.target.value as ThoughtStatus | "all")} className="sm:w-40">
            <option value="all">全部</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
        </div>
        <div className="mt-4 grid gap-3">
          {visible.length === 0 && <EmptyState text="这里暂时很安静。" />}
          {visible.map((thought) => (
            <article key={thought.id} className="rounded-lg border border-ink-200 p-4 dark:border-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm leading-6">{thought.content}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-700/55 dark:text-ink-100/45">
                    <span>{thought.tag}</span>
                    <span>{thought.status}</span>
                    <span>可处理：{formatShortDateTime(thought.availableAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => mark(thought.id, "ready")} title="设为可处理"><RefreshCw size={16} /></Button>
                  <Button variant="secondary" onClick={() => mark(thought.id, "processed")} title="已处理"><CheckCircle size={16} /></Button>
                  <Button variant="secondary" onClick={() => mark(thought.id, "discarded")} title="丢弃"><CircleSlash size={16} /></Button>
                  <Button variant="ghost" onClick={() => deleteThought(thought.id)} title="删除"><Trash2 size={16} /></Button>
                </div>
              </div>
              <div className="mt-4">
                <Button disabled={thought.status === "cooling"} onClick={() => convertToTask(thought)}>转化为任务</Button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
