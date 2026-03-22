import PlanForm from "@/components/PlanForm";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.92)),radial-gradient(circle_at_top_right,rgba(34,211,238,0.24),transparent_32%)] p-8">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.32em] text-cyan-200/80">
            Next.js × OpenAI × Prisma
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            AI業務計画アシスタント
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
            業務依頼文を入力すると、AIが要約・タスク分解・優先順位・実行ステップ・想定リスク・確認事項を整理します。
            単なるチャットではなく、業務フローに組み込める実務向けMVPです。
          </p>

          <div className="mt-6">
            <Link
              href="/plans"
              className="inline-flex rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              保存済み履歴を見る
            </Link>
          </div>
        </div>
      </section>

      <PlanForm />
    </div>
  );
}
