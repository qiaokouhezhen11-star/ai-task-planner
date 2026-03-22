import PlansList from "@/components/PlansList";
import { getTaskPlans } from "@/lib/task-plans";

export default async function PlansPage() {
  const plans = await getTaskPlans();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Saved Plans
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">保存済み履歴</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          保存した業務計画を一覧で見返せます。
        </p>
      </section>

      {plans.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-sm text-slate-400">
          まだ保存済みデータはありません。トップページから生成して保存してください。
        </div>
      ) : (
        <PlansList plans={plans} />
      )}
    </div>
  );
}
