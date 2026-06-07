import { ReactNode } from "react";

export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cx(
        "rounded-xl border border-white/75 bg-white/86 p-5 shadow-soft backdrop-blur-sm transition dark:border-white/10 dark:bg-white/[0.055] dark:shadow-none",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-ink-900 text-white shadow-soft hover:-translate-y-0.5 hover:bg-ink-700 dark:bg-ink-50 dark:text-ink-900 dark:hover:bg-ink-200",
    secondary:
      "border border-ink-200/80 bg-white/80 text-ink-900 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-ink-50 dark:hover:bg-white/10",
    ghost: "text-ink-700 hover:bg-ink-100 dark:text-ink-100 dark:hover:bg-white/10",
    danger: "bg-clay-600 text-white shadow-soft hover:-translate-y-0.5 hover:bg-clay-400",
  };
  return (
    <button
      className={cx(
        "inline-flex min-h-9 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm text-ink-700 dark:text-ink-100">
      <span className="text-xs font-semibold text-ink-700/62 dark:text-ink-100/62">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-10 rounded-lg border border-ink-200/85 bg-white/88 px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-700/40 focus:border-moss-500 focus:bg-white focus:ring-2 focus:ring-moss-300/35 dark:border-white/10 dark:bg-white/[0.055] dark:text-ink-50 dark:placeholder:text-ink-100/35 dark:focus:bg-white/10";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputClass, "min-h-24 resize-y")} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputClass} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />;
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200/90 bg-ink-50/55 p-6 text-center text-sm text-ink-700/60 dark:border-white/10 dark:bg-white/[0.035] dark:text-ink-100/55">
      {text}
    </div>
  );
}
