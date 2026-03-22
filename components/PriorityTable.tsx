import { PriorityItem } from "@/types/plan";

type Props = {
  items: PriorityItem[];
};

export default function PriorityTable({ items }: Props) {
  if (!items.length) {
    return <p className="text-slate-400">優先順位データはありません。</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-800/70 text-slate-200">
          <tr>
            <th className="px-4 py-3 font-medium">タスク</th>
            <th className="px-4 py-3 font-medium">優先度</th>
            <th className="px-4 py-3 font-medium">理由</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={`${item.task}-${index}`}
              className="border-t border-slate-800 text-slate-300"
            >
              <td className="px-4 py-3">{item.task}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${getPriorityClassName(
                    item.priority
                  )}`}
                >
                  {item.priority}
                </span>
              </td>
              <td className="px-4 py-3">{item.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getPriorityClassName(priority: PriorityItem["priority"]) {
  if (priority === "HIGH") {
    return "border-red-500/20 bg-red-500/10 text-red-100";
  }

  if (priority === "MEDIUM") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-100";
  }

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100";
}
