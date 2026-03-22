"use client";

import { useMemo, useState } from "react";
import SavedPlanCard from "@/components/SavedPlanCard";
import {
  PLAN_CATEGORIES,
  PLAN_STATUSES,
  ParsedTaskPlan,
  PlanStatus,
} from "@/types/plan";

type SortOption =
  | "newest"
  | "oldest"
  | "updated"
  | "high-priority"
  | "todo-first";

type Props = {
  plans: ParsedTaskPlan[];
};

export default function PlansList({ plans }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlanStatus | "すべて">("すべて");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const stats = useMemo(() => {
    const total = plans.length;
    const confirmed = plans.filter((plan) => plan.isConfirmed).length;
    const completed = plans.filter((plan) => plan.status === "完了").length;
    const todo = plans.filter((plan) => plan.status === "未着手").length;
    const inProgress = plans.filter((plan) => plan.status === "対応中").length;
    const byCategory = PLAN_CATEGORIES.map((category) => ({
      category,
      count: plans.filter((plan) => plan.category === category).length,
    }));

    return {
      total,
      confirmed,
      completed,
      todo,
      inProgress,
      byCategory,
    };
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedPlans = plans.filter((plan) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          plan.title,
          plan.category,
          plan.requestSummary,
          plan.status,
          plan.notes,
          plan.tone,
          plan.style,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "すべて" || plan.status === statusFilter;

      return matchesQuery && matchesStatus;
    });

    return [...matchedPlans].sort((left, right) => {
      if (sortOption === "oldest") {
        return (
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        );
      }

      if (sortOption === "updated") {
        return (
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        );
      }

      if (sortOption === "high-priority") {
        const leftHasHigh = left.priorities.some((item) => item.priority === "HIGH");
        const rightHasHigh = right.priorities.some((item) => item.priority === "HIGH");

        if (leftHasHigh !== rightHasHigh) {
          return leftHasHigh ? -1 : 1;
        }
      }

      if (sortOption === "todo-first") {
        const statusOrder: Record<PlanStatus, number> = {
          未着手: 0,
          対応中: 1,
          完了: 2,
        };

        if (statusOrder[left.status] !== statusOrder[right.status]) {
          return statusOrder[left.status] - statusOrder[right.status];
        }
      }

      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
  }, [plans, query, statusFilter, sortOption]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                履歴検索
              </label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="タイトル、カテゴリ、ステータス、メモで検索"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                ステータス絞り込み
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as PlanStatus | "すべて")
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
              >
                <option value="すべて">すべて</option>
                {PLAN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-200">
                並び替え
              </label>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
              >
                <option value="newest">新しい順</option>
                <option value="oldest">古い順</option>
                <option value="updated">更新日順</option>
                <option value="high-priority">HIGH優先度を含む順</option>
                <option value="todo-first">未着手を上に出す</option>
              </select>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {filteredPlans.length} 件表示 / 全 {plans.length} 件
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
          <StatCard label="総件数" value={`${stats.total}`} />
          <StatCard label="未着手" value={`${stats.todo}`} />
          <StatCard label="対応中" value={`${stats.inProgress}`} />
          <StatCard label="完了" value={`${stats.completed}`} />
          <StatCard label="確認済み" value={`${stats.confirmed}`} />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-sm font-medium text-white">カテゴリ別件数</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {stats.byCategory.map((item) => (
            <div
              key={item.category}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-xs text-slate-400">{item.category}</p>
              <p className="mt-2 text-xl font-semibold text-white">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-sm text-slate-400">
          検索条件に一致する履歴はありません。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPlans.map((plan) => (
            <SavedPlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
