import { ReactNode } from "react";

export function MarkdownText({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-3 list-disc space-y-1 pl-5">
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const className = level === 1 ? "mt-4 text-base font-semibold" : "mt-3 text-sm font-semibold";
      blocks.push(
        <h4 key={`heading-${index}`} className={className}>
          {renderInline(heading[2])}
        </h4>,
      );
      return;
    }

    const list = /^[-*]\s+(.+)$/.exec(trimmed) || /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (list) {
      listItems.push(list[1]);
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${index}`} className="my-2">
        {renderInline(trimmed)}
      </p>,
    );
  });

  flushList();

  return <div className="text-sm leading-6 text-ink-700 dark:text-ink-100/75">{blocks}</div>;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}
