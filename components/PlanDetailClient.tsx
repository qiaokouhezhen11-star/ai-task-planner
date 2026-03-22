"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PlanResultCard from "@/components/PlanResultCard";
import ConfirmBadge from "@/components/ConfirmBadge";
import StatusBadge from "@/components/StatusBadge";
import {
  formatDate,
  serializePlanAsJson,
  serializePlanAsMarkdown,
  serializePlanForCopy,
} from "@/lib/utils";
import {
  FollowUpAnswerItem,
  OUTPUT_STYLES,
  OUTPUT_TONES,
  PLAN_CATEGORIES,
  PLAN_STATUSES,
  GeneratedPlan,
  KnowledgeReference,
  OutputStyle,
  OutputTone,
  ParsedTaskPlan,
  PlanCategory,
  PriorityItem,
  TaskCheckItem,
} from "@/types/plan";

type Props = {
  initialPlan: ParsedTaskPlan;
};

export default function PlanDetailClient({ initialPlan }: Props) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [inputText, setInputText] = useState(initialPlan.inputText);
  const [category, setCategory] = useState<PlanCategory>(
    initialPlan.category as PlanCategory
  );
  const [tone, setTone] = useState<OutputTone>(initialPlan.tone);
  const [style, setStyle] = useState<OutputStyle>(initialPlan.style);
  const [status, setStatus] = useState(initialPlan.status);
  const [isConfirmed, setIsConfirmed] = useState(initialPlan.isConfirmed);
  const [notes, setNotes] = useState(initialPlan.notes);
  const [requestSummary, setRequestSummary] = useState(initialPlan.requestSummary);
  const [tasksText, setTasksText] = useState(initialPlan.tasks.join("\n"));
  const [prioritiesText, setPrioritiesText] = useState(
    initialPlan.priorities
      .map((item) => `${item.priority} | ${item.task} | ${item.reason}`)
      .join("\n")
  );
  const [stepsText, setStepsText] = useState(initialPlan.steps.join("\n"));
  const [risksText, setRisksText] = useState(initialPlan.risks.join("\n"));
  const [checksText, setChecksText] = useState(initialPlan.checks.join("\n"));
  const [followUpQuestionsText, setFollowUpQuestionsText] = useState(
    initialPlan.followUpQuestions.join("\n")
  );
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswerItem[]>(
    initialPlan.followUpAnswers
  );
  const [taskChecks, setTaskChecks] = useState<TaskCheckItem[]>(initialPlan.taskChecks);
  const [ragSources, setRagSources] = useState<KnowledgeReference[]>(
    initialPlan.ragSources
  );
  const [comparisonPlan, setComparisonPlan] = useState<GeneratedPlan | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const editablePlan = useMemo(() => {
    return buildGeneratedPlanFromText({
      requestSummary,
      tasksText,
      prioritiesText,
      stepsText,
      risksText,
      checksText,
      followUpQuestionsText,
    });
  }, [
    requestSummary,
    tasksText,
    prioritiesText,
    stepsText,
    risksText,
    checksText,
    followUpQuestionsText,
  ]);

  const handleSaveMeta = async () => {
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/task-plans/${plan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          isConfirmed,
          notes,
          inputText,
          category,
          tone,
          style,
          plan: editablePlan,
          followUpAnswers,
          taskChecks,
          ragSources,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "更新に失敗しました。");
      }

      setPlan({
        ...plan,
        inputText,
        category,
        status,
        isConfirmed,
        notes,
        tone,
        style,
        title: data.title ?? plan.title,
        requestSummary: editablePlan.requestSummary,
        tasks: editablePlan.tasks,
        priorities: editablePlan.priorities,
        steps: editablePlan.steps,
        risks: editablePlan.risks,
        checks: editablePlan.checks,
        followUpQuestions: editablePlan.followUpQuestions,
        followUpAnswers,
        taskChecks,
        ragSources,
        updatedAt: data.updatedAt,
      });
      setMessage("編集内容を更新しました。");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "更新中にエラーが発生しました。"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText,
          category,
          tone,
          style,
          model: "gpt-5.4",
          followUpAnswers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "再生成に失敗しました。");
      }

      setComparisonPlan(data.plan);
      setRagSources(Array.isArray(data.references) ? data.references : []);
      setMessage("比較用の再生成結果を取得しました。");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "再生成中にエラーが発生しました。"
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleApplyRegeneratedPlan = async () => {
    if (!comparisonPlan) {
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/task-plans/${plan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText,
          category,
          tone,
          style,
          notes,
          status,
          isConfirmed,
          plan: comparisonPlan,
          followUpAnswers,
          ragSources,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "再生成結果の反映に失敗しました。");
      }

      setPlan({
        ...plan,
        inputText,
        category,
        tone,
        style,
        notes,
        status,
        isConfirmed,
        title: data.title ?? plan.title,
        requestSummary: comparisonPlan.requestSummary,
        tasks: comparisonPlan.tasks,
        priorities: comparisonPlan.priorities,
        steps: comparisonPlan.steps,
        risks: comparisonPlan.risks,
        checks: comparisonPlan.checks,
        followUpQuestions: comparisonPlan.followUpQuestions,
        followUpAnswers,
        taskChecks: comparisonPlan.tasks.map((task) => ({
          task,
          completed: false,
        })),
        ragSources,
        updatedAt: data.updatedAt,
      });

      setRequestSummary(comparisonPlan.requestSummary);
      setTasksText(comparisonPlan.tasks.join("\n"));
      setPrioritiesText(
        comparisonPlan.priorities
          .map((item) => `${item.priority} | ${item.task} | ${item.reason}`)
          .join("\n")
      );
      setStepsText(comparisonPlan.steps.join("\n"));
      setRisksText(comparisonPlan.risks.join("\n"));
      setChecksText(comparisonPlan.checks.join("\n"));
      setFollowUpQuestionsText(comparisonPlan.followUpQuestions.join("\n"));
      setTaskChecks(
        comparisonPlan.tasks.map((task) => ({ task, completed: false }))
      );
      setComparisonPlan(null);
      setMessage("再生成結果を保存データに反映しました。");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "反映中にエラーが発生しました。"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const shouldDelete = window.confirm("この履歴を削除しますか？");

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/task-plans/${plan.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "削除に失敗しました。");
      }

      router.push("/plans");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "削除中にエラーが発生しました。"
      );
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handleExport = (format: "md" | "txt" | "json") => {
    const content =
      format === "md"
        ? serializePlanAsMarkdown(editablePlan)
        : format === "json"
          ? serializePlanAsJson(editablePlan)
          : serializePlanForCopy(editablePlan);

    const mimeType =
      format === "json"
        ? "application/json"
        : format === "md"
          ? "text/markdown"
          : "text/plain";

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `task-plan-${plan.id}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleTask = async (index: number) => {
    const nextTaskChecks = taskChecks.map((item, currentIndex) =>
      currentIndex === index ? { ...item, completed: !item.completed } : item
    );

    setTaskChecks(nextTaskChecks);

    try {
      const response = await fetch(`/api/task-plans/${plan.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskChecks: nextTaskChecks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "タスクチェックの更新に失敗しました。");
      }

      setPlan({
        ...plan,
        taskChecks: nextTaskChecks,
        updatedAt: data.updatedAt,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "タスク更新中にエラーが発生しました。"
      );
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            {plan.category}
          </span>
          <StatusBadge status={plan.status} />
          <ConfirmBadge isConfirmed={plan.isConfirmed} />
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            トーン: {plan.tone}
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            スタイル: {plan.style}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {plan.title}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              保存日時: {formatDate(plan.createdAt)} / 更新日時: {formatDate(plan.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleExport("md")}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={() => handleExport("txt")}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              テキスト
            </button>
            <button
              type="button"
              onClick={() => handleExport("json")}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              JSON
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">
            元の業務依頼文
          </h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-7 text-slate-300">
            {plan.inputText}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="text-lg font-semibold text-white">管理情報と編集</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <FieldSelect
            label="カテゴリ"
            value={category}
            onChange={(value) => setCategory(value as PlanCategory)}
            options={PLAN_CATEGORIES}
          />
          <FieldSelect
            label="ステータス"
            value={status}
            onChange={(value) => setStatus(value as ParsedTaskPlan["status"])}
            options={PLAN_STATUSES}
          />
          <FieldSelect
            label="出力トーン"
            value={tone}
            onChange={(value) => setTone(value as OutputTone)}
            options={OUTPUT_TONES}
          />
          <FieldSelect
            label="出力スタイル"
            value={style}
            onChange={(value) => setStyle(value as OutputStyle)}
            options={OUTPUT_STYLES}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              確認フラグ
            </label>
            <button
              type="button"
              onClick={() => setIsConfirmed((current) => !current)}
              className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                isConfirmed
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-900"
              }`}
            >
              {isConfirmed ? "確認済み" : "未確認"}
            </button>
          </div>
        </div>

        <FieldTextArea
          label="業務依頼文の編集"
          value={inputText}
          onChange={setInputText}
          rows={6}
        />
        <FieldTextArea
          label="依頼内容の要約"
          value={requestSummary}
          onChange={setRequestSummary}
          rows={5}
        />
        <FieldTextArea
          label="タスク分解"
          value={tasksText}
          onChange={setTasksText}
          rows={6}
          description="1行につき1タスクで入力します。"
        />
        <FieldTextArea
          label="優先順位"
          value={prioritiesText}
          onChange={setPrioritiesText}
          rows={6}
          description="1行ごとに `HIGH | タスク名 | 理由` 形式で入力します。"
        />
        <FieldTextArea
          label="実行ステップ"
          value={stepsText}
          onChange={setStepsText}
          rows={6}
          description="1行につき1ステップで入力します。"
        />
        <FieldTextArea
          label="想定リスク"
          value={risksText}
          onChange={setRisksText}
          rows={5}
          description="1行につき1リスクで入力します。"
        />
        <FieldTextArea
          label="確認事項"
          value={checksText}
          onChange={setChecksText}
          rows={5}
          description="1行につき1確認事項で入力します。"
        />
        <FieldTextArea
          label="入力不足時の補足質問提案"
          value={followUpQuestionsText}
          onChange={setFollowUpQuestionsText}
          rows={5}
          description="1行につき1質問で入力します。"
        />
        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-200">
            補足回答
          </label>
          <div className="space-y-3">
            {followUpAnswers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
                現在、補足回答はありません。
              </div>
            ) : (
              followUpAnswers.map((item, index) => (
                <div
                  key={`${item.question}-${index}`}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <p className="text-sm font-medium text-slate-200">
                    {item.question}
                  </p>
                  <textarea
                    value={item.answer}
                    onChange={(event) =>
                      setFollowUpAnswers((current) =>
                        current.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? { ...currentItem, answer: event.target.value }
                            : currentItem
                        )
                      )
                    }
                    rows={3}
                    className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-cyan-500"
                  />
                </div>
              ))
            )}
          </div>
        </div>
        <FieldTextArea
          label="メモ欄"
          value={notes}
          onChange={setNotes}
          rows={6}
          placeholder="引き継ぎメモ、注意点、社内向け補足などを自由に記録できます。"
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveMeta}
            disabled={saving}
            className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "更新中..." : "編集内容を保存する"}
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="rounded-2xl border border-cyan-500/30 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRegenerating ? "再生成中..." : "再生成する"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-2xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "削除中..." : "削除する"}
          </button>
          {copyMessage && <p className="text-sm text-cyan-200">{copyMessage}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="text-lg font-semibold text-white">タスクチェック機能</h2>
        <div className="mt-5 space-y-3">
          {taskChecks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
              チェック対象タスクはありません。
            </div>
          ) : (
            taskChecks.map((item, index) => (
              <button
                key={`${item.task}-${index}`}
                type="button"
                onClick={() => handleToggleTask(index)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  item.completed
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                    : "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900"
                }`}
              >
                <span className="text-sm">{item.task}</span>
                <span className="text-xs font-medium">
                  {item.completed ? "完了" : "未完了"}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="text-lg font-semibold text-white">RAG参照ナレッジ</h2>
        <div className="mt-5 space-y-3">
          {ragSources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
              このプランでは参照ナレッジは記録されていません。
            </div>
          ) : (
            ragSources.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.category} / {item.source}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {item.excerpt}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {comparisonPlan && (
        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">比較表示</h2>
              <p className="mt-1 text-sm text-slate-400">
                左が現在の編集内容、右が再生成結果です。
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplyRegeneratedPlan}
              disabled={saving}
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              比較結果を反映する
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-slate-300">現在の編集内容</p>
              <PlanResultCard plan={editablePlan} />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-slate-300">再生成結果</p>
              <PlanResultCard plan={comparisonPlan} />
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">コピーとプレビュー</h2>
            <p className="mt-1 text-sm text-slate-400">
              保存前の現在内容をそのままコピーやエクスポートに使えます。
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(serializePlanForCopy(editablePlan))}
            className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            全体コピー
          </button>
        </div>

        <PlanResultCard plan={editablePlan} />
      </section>
    </div>
  );
}

function buildGeneratedPlanFromText(params: {
  requestSummary: string;
  tasksText: string;
  prioritiesText: string;
  stepsText: string;
  risksText: string;
  checksText: string;
  followUpQuestionsText: string;
}): GeneratedPlan {
  return {
    requestSummary: params.requestSummary.trim(),
    tasks: splitLines(params.tasksText),
    priorities: parsePriorities(params.prioritiesText),
    steps: splitLines(params.stepsText),
    risks: splitLines(params.risksText),
    checks: splitLines(params.checksText),
    followUpQuestions: splitLines(params.followUpQuestionsText),
  };
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePriorities(value: string): PriorityItem[] {
  return splitLines(value).map((line) => {
    const [priority = "MEDIUM", task = line, reason = "理由未入力"] = line
      .split("|")
      .map((item) => item.trim());

    return {
      priority:
        priority === "HIGH" || priority === "LOW" ? priority : "MEDIUM",
      task,
      reason,
    };
  });
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function FieldTextArea({
  label,
  value,
  onChange,
  rows,
  description,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  description?: string;
  placeholder?: string;
}) {
  return (
    <div className="mt-5">
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
      />
      {description && <p className="mt-2 text-xs text-slate-500">{description}</p>}
    </div>
  );
}
