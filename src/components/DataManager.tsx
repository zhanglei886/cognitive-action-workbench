import { Download, KeyRound, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { AppData } from "../types";
import { exportPayload, importPayload, loadAIKey, saveAIKey } from "../lib/storage";
import { Button, Field, Input, Panel, Textarea } from "./ui";

export function DataManager({
  data,
  replaceData,
  clearAll,
}: {
  data: AppData;
  replaceData: (data: AppData) => void;
  clearAll: () => void;
}) {
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState(() => loadAIKey());
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportPayload(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cognitive-action-workbench-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("已导出 JSON。");
  };

  const doImport = (raw = importText) => {
    try {
      replaceData(importPayload(raw));
      setImportText("");
      setMessage("导入成功。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败。");
    }
  };

  const uploadFile = async (file?: File) => {
    if (!file) return;
    doImport(await file.text());
  };

  const clear = () => {
    if (!window.confirm("确定清空所有本地数据吗？")) return;
    clearAll();
    setMessage("已清空数据。");
  };

  const saveKey = () => {
    saveAIKey(apiKey);
    setMessage(apiKey.trim() ? "千问 API Key 已保存在当前浏览器。" : "千问 API Key 已清除。");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <h2 className="text-lg font-semibold">导出</h2>
        <p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/55">导出当前 localStorage 数据，方便备份或迁移。</p>
        <Button className="mt-5" onClick={download}>
          <Download size={16} className="mr-2" />
          导出 JSON
        </Button>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold">导入</h2>
        <div className="mt-4 grid gap-4">
          <Textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="粘贴导出的 JSON。" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => doImport()} disabled={!importText.trim()}>
              <Upload size={16} className="mr-2" />
              导入文本
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>选择文件</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => uploadFile(event.target.files?.[0])} />
          </div>
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <h2 className="text-lg font-semibold">AI 设置</h2>
        <p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/55">
          千问 API Key 只保存在当前浏览器的 localStorage，不会进入云端同步数据。AI 总结时会临时发送给 Netlify Function 调用千问。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="千问 API Key">
            <Input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-..."
              autoComplete="off"
            />
          </Field>
          <Button onClick={saveKey}>
            <KeyRound size={16} className="mr-2" />
            保存 Key
          </Button>
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <h2 className="text-lg font-semibold">清空数据</h2>
        <p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/55">只会清空这个网页保存在浏览器里的本地数据。</p>
        <Button variant="danger" className="mt-5" onClick={clear}>
          <Trash2 size={16} className="mr-2" />
          清空所有数据
        </Button>
        {message && <div className="mt-4 rounded-md bg-ink-100 p-3 text-sm text-ink-700 dark:bg-white/5 dark:text-ink-100/70">{message}</div>}
      </Panel>
    </div>
  );
}
