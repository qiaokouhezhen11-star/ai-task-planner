import { PlanStatus } from "@/types/plan";

const statusClassName: Record<PlanStatus, string> = {
  未着手: "border-slate-700 bg-slate-900 text-slate-200",
  対応中: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  完了: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
};

type Props = {
  status: PlanStatus;
};

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClassName[status]}`}
    >
      {status}
    </span>
  );
}
