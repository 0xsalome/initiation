// ABOUTME: Tailwind CSSで共有するUIクラスを定義する。
// ABOUTME: ボタン、入力欄、カードの見た目をページ間で揃える。
export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
  secondary:
    "inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
  quiet:
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
} as const;

export const inputStyles =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-foreground shadow-sm outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/30";

export const cardStyles = "rounded-2xl border border-border bg-card p-6 shadow-sm";
