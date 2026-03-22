import Link from "next/link";

const navigationItems = [
  { href: "/", label: "トップ" },
  { href: "/plans", label: "保存済み履歴" },
  { href: "/dashboard", label: "ダッシュボード" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-sm font-semibold text-cyan-200">
            AI
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Workflow Planner
            </p>
            <p className="text-sm font-semibold text-white">
              AI業務計画アシスタント
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm text-slate-300">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 transition hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
