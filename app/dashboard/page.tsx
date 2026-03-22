import { getDashboardSummary } from "@/lib/task-plans";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const dashboard = await getDashboardSummary();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">
          運用ダッシュボード
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          生成AIを業務整理に活用し、RAGでナレッジ参照しながら、保存・比較・運用まで確認できます。
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="総プラン数" value={`${dashboard.stats.totalPlans}`} />
        <MetricCard label="未着手" value={`${dashboard.stats.todoPlans}`} />
        <MetricCard label="対応中" value={`${dashboard.stats.inProgressPlans}`} />
        <MetricCard label="完了" value={`${dashboard.stats.completedPlans}`} />
        <MetricCard label="確認済み" value={`${dashboard.stats.confirmedPlans}`} />
        <MetricCard label="総タスク数" value={`${dashboard.stats.totalTasks}`} />
        <MetricCard label="完了タスク" value={`${dashboard.stats.completedTasks}`} />
        <MetricCard
          label="ナレッジ件数"
          value={`${dashboard.stats.totalKnowledgeItems}`}
        />
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">最近更新したプラン</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {dashboard.plans.slice(0, 4).map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-sm font-medium text-white">{plan.title}</p>
              <p className="mt-1 text-xs text-slate-400">
                {plan.category} / {plan.status} / 更新: {formatDate(plan.updatedAt)}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {plan.requestSummary}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">参照ナレッジ一覧</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {dashboard.knowledgeItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400">
                {item.category} / {item.source} / 更新: {formatDate(item.updatedAt)}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
