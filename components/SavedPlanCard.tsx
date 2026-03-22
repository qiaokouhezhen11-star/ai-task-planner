import Link from "next/link";
import { ParsedTaskPlan } from "@/types/plan";
import { formatDate } from "@/lib/utils";
import ConfirmBadge from "@/components/ConfirmBadge";
import StatusBadge from "@/components/StatusBadge";

type Props = {
  plan: ParsedTaskPlan;
};

export default function SavedPlanCard({ plan }: Props) {
  return (
    <Link
      href={`/plans/${plan.id}`}
      className="group block rounded-3xl border border-slate-800 bg-slate-900/85 p-5 transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-slate-900"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-300">
            {plan.category}
          </span>
          <StatusBadge status={plan.status} />
          <ConfirmBadge isConfirmed={plan.isConfirmed} />
        </div>
        <span className="text-xs text-slate-500">更新: {formatDate(plan.updatedAt)}</span>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-white transition group-hover:text-cyan-100">
        {plan.title}
      </h2>
      <p className="line-clamp-3 text-sm leading-6 text-slate-300">
        {plan.requestSummary}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
        <span>トーン: {plan.tone}</span>
        <span>スタイル: {plan.style}</span>
      </div>
    </Link>
  );
}
