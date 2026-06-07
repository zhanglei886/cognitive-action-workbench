import { Component, ReactNode } from "react";
import { Button, Panel } from "./ui";

interface ErrorBoundaryState {
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-ink-50 px-4 py-10 text-ink-900 dark:bg-[#10120f] dark:text-ink-50">
        <div className="mx-auto max-w-xl">
          <Panel>
            <h1 className="text-lg font-semibold">页面刚才出错了</h1>
            <p className="mt-2 text-sm leading-6 text-ink-700/65 dark:text-ink-100/55">
              数据还在，本地缓存不会因为这个提示丢失。可以先刷新页面；如果反复出现，通常是旧数据字段缺失或网络同步返回异常。
            </p>
            <div className="mt-4 rounded-lg bg-ink-100 p-3 text-xs text-ink-700/70 dark:bg-white/5 dark:text-ink-100/60">
              {this.state.error.message}
            </div>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          </Panel>
        </div>
      </div>
    );
  }
}
