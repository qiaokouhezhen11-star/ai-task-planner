"use client";

import { useState } from "react";
import { GeneratedPlan } from "@/types/plan";
import SectionCard from "@/components/SectionCard";
import PriorityTable from "@/components/PriorityTable";
import {
  serializeCustomerSummary,
  serializePlanAsMarkdown,
  serializePlanForCopy,
  serializeStepsOnly,
  serializeTasksOnly,
} from "@/lib/utils";

type Props = {
  plan: GeneratedPlan;
};

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-slate-400">データはありません。</p>;
  }

  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-cyan-300">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function PlanResultCard({ plan }: Props) {
  const [copyMessage, setCopyMessage] = useState("");

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyMessage("コピーしました。");
      setTimeout(() => setCopyMessage(""), 2000);
    } catch {
      setCopyMessage("コピーに失敗しました。");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-4">
        <div>
          <p className="text-sm font-medium text-white">生成結果</p>
          <p className="text-xs text-slate-400">
            内容をコピーしてチャット・ドキュメントへ転記できます。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {copyMessage && <span className="text-xs text-cyan-200">{copyMessage}</span>}
          <button
            type="button"
            onClick={() => handleCopy(serializePlanForCopy(plan))}
            className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            全体コピー
          </button>
          <button
            type="button"
            onClick={() => handleCopy(serializeTasksOnly(plan))}
            className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            タスクだけコピー
          </button>
          <button
            type="button"
            onClick={() => handleCopy(serializeStepsOnly(plan))}
            className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            手順だけコピー
          </button>
          <button
            type="button"
            onClick={() => handleCopy(serializeCustomerSummary(plan))}
            className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            顧客説明向けだけコピー
          </button>
          <button
            type="button"
            onClick={() => handleCopy(serializePlanAsMarkdown(plan))}
            className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Markdown形式でコピー
          </button>
        </div>
      </div>

      <SectionCard title="依頼内容の要約">
        <p className="leading-7">{plan.requestSummary}</p>
      </SectionCard>

      <SectionCard title="タスク分解">
        <BulletList items={plan.tasks} />
      </SectionCard>

      <SectionCard title="優先順位">
        <PriorityTable items={plan.priorities} />
      </SectionCard>

      <SectionCard title="実行ステップ">
        <BulletList items={plan.steps} />
      </SectionCard>

      <SectionCard title="想定リスク">
        <BulletList items={plan.risks} />
      </SectionCard>

      <SectionCard title="確認事項">
        <BulletList items={plan.checks} />
      </SectionCard>

      <SectionCard title="入力不足時の補足質問提案">
        <BulletList items={plan.followUpQuestions} />
      </SectionCard>
    </div>
  );
}
