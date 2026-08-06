// ABOUTME: 全ページ共通のサイトヘッダーと参加フローのメニューを表示する。
// ABOUTME: メンバー導線と運営導線を分け、初見でも次の操作を選べるようにする。
import Link from "next/link";
import { adminNavigation, mainNavigation } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          className="whitespace-nowrap text-base font-extrabold tracking-tight text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          href="/"
          aria-label="HENKAKU Initiation ホーム"
        >
          HENKAKU <span className="font-medium text-muted">Initiation</span>
        </Link>
        <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1" aria-label="メインメニュー">
          <ul className="flex flex-wrap items-center gap-1">
            {mainNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-muted transition hover:bg-surface-hover hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  href={item.href}
                >
                  <span
                    className="grid size-5 place-items-center rounded-full border border-border text-[0.7rem] leading-none"
                    aria-hidden="true"
                  >
                    {item.step}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="ml-auto flex flex-wrap items-center gap-1">
            {adminNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  className="inline-flex min-h-9 items-center rounded-lg border border-border px-2.5 py-2 text-sm font-semibold text-muted transition hover:bg-surface-hover hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
