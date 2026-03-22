"use client";

import { useState } from "react";
import {
  FollowUpAnswerItem,
  GeneratedPlan,
  KnowledgeReference,
  OutputStyle,
  OutputTone,
  PlanCategory,
  SupportedPlanModel,
} from "@/types/plan";
import PlanResultCard from "@/components/PlanResultCard";

const categoryOptions: PlanCategory[] = [
  "問い合わせ対応",
  "障害初動",
  "引き継ぎ",
  "営業準備",
  "その他",
];

const modelOptions: Array<{
  value: SupportedPlanModel;
  label: string;
  description: string;
}> = [
  {
    value: "gpt-5.4",
    label: "gpt-5.4",
    description: "精度重視。複雑な業務整理やポートフォリオ用途向け。",
  },
  {
    value: "gpt-5-mini",
    label: "gpt-5-mini",
    description: "速度とコストのバランス重視。",
  },
  {
    value: "gpt-5-nano",
    label: "gpt-5-nano",
    description: "最速・軽量。簡易な確認や試作用。",
  },
];

const toneOptions: Array<{
  value: OutputTone;
  description: string;
}> = [
  { value: "簡潔", description: "短く要点中心で出力します。" },
  { value: "標準", description: "実務で使いやすい標準的な分量です。" },
  { value: "詳細", description: "背景や理由まで含めて丁寧に整理します。" },
];

const styleOptions: Array<{
  value: OutputStyle;
  description: string;
}> = [
  { value: "現場向け", description: "担当者がすぐ動ける実務寄りの表現です。" },
  { value: "管理者向け", description: "優先度や判断材料を意識した表現です。" },
  { value: "顧客説明向け", description: "社外説明を意識した穏やかな表現です。" },
];

const templates: Array<{
  label: string;
  category: PlanCategory;
  inputText: string;
}> = [
  {
    label: "問い合わせ対応サンプル",
    category: "問い合わせ対応",
    inputText:
      "顧客から『請求書の金額が想定と違う』という問い合わせを受けています。契約内容、請求明細、返答方針、社内確認先、顧客への確認事項を整理したいです。",
  },
  {
    label: "障害初動サンプル",
    category: "障害初動",
    inputText:
      "朝からログイン障害が発生しています。影響範囲、初動対応、切り分け、社内連携、顧客向け連絡のたたき台、追加確認事項を整理したいです。",
  },
  {
    label: "引き継ぎサンプル",
    category: "引き継ぎ",
    inputText:
      "来週から担当が変わるため、担当中案件の状況、優先度、注意点、未対応タスク、関係者、次回アクションを引き継ぎ資料として整理したいです。",
  },
  {
    label: "営業準備サンプル",
    category: "営業準備",
    inputText:
      "来週の提案商談に向けて、顧客課題、提案論点、確認事項、想定質問、当日の進行、必要資料を整理したいです。",
  },
];

export default function PlanForm() {
  const [inputText, setInputText] = useState("");
  const [category, setCategory] = useState<PlanCategory>("問い合わせ対応");
  const [model, setModel] = useState<SupportedPlanModel>("gpt-5.4");
  const [tone, setTone] = useState<OutputTone>("標準");
  const [style, setStyle] = useState<OutputStyle>("現場向け");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<GeneratedPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [usedModel, setUsedModel] = useState<SupportedPlanModel | null>(null);
  const [references, setReferences] = useState<KnowledgeReference[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswerItem[]>([]);

  const applyTemplate = (templateLabel: string) => {
    const template = templates.find((item) => item.label === templateLabel);

    if (!template) {
      return;
    }

    setCategory(template.category);
    setInputText(template.inputText);
    setErrorMessage("");
  };

  const handleGenerate = async () => {
    setErrorMessage("");
    setSaveMessage("");
    setWarningMessage("");
    setReferences([]);

    if (!inputText.trim()) {
      setErrorMessage("業務依頼文を入力してください。");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText,
          category,
          model,
          tone,
          style,
          followUpAnswers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成に失敗しました。");
      }

      setResult(data.plan);
      setUsedModel(data.model ?? model);
      setReferences(Array.isArray(data.references) ? data.references : []);
      setWarningMessage(
        typeof data.warning === "string" ? data.warning : ""
      );
      setFollowUpAnswers(
        Array.isArray(data.plan?.followUpQuestions)
          ? data.plan.followUpQuestions.map((question: string) => ({
              question,
              answer:
                followUpAnswers.find((item) => item.question === question)?.answer ??
                "",
            }))
          : []
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "AI生成中にエラーが発生しました。";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setSaveMessage("");
    setErrorMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/task-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText,
          category,
          plan: result,
          tone,
          style,
          notes,
          status: "未着手",
          isConfirmed: false,
          followUpAnswers,
          ragSources: references,
          taskChecks: result.tasks.map((task) => ({ task, completed: false })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "保存に失敗しました。");
      }

      setSaveMessage("保存しました。履歴一覧から確認できます。");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "保存中にエラーが発生しました。";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/30">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            業務依頼を整理する
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            依頼文を入力すると、AIが要約・タスク分解・優先順位・手順・リスク・確認事項を整理します。
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              テンプレート入力
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => applyTemplate(template.label)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm text-white transition hover:border-cyan-500/40 hover:bg-slate-900"
                >
                  <p className="font-medium">{template.label}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {template.category}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              対話型改善
            </label>
            <p className="mb-3 text-xs text-slate-500">
              補足質問に答えてから再生成すると、内容を深掘りできます。
            </p>
            {followUpAnswers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
                初回生成後に、ここへ補足質問が表示されます。
              </div>
            ) : (
              <div className="space-y-3">
                {followUpAnswers.map((item, index) => (
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
                      placeholder="ここに補足回答を入力して再生成できます。"
                      className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              業務カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PlanCategory)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              使用モデル
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as SupportedPlanModel)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {
                modelOptions.find((option) => option.value === model)
                  ?.description
              }
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                出力トーン
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as OutputTone)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {toneOptions.find((option) => option.value === tone)?.description}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                出力スタイル
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as OutputStyle)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {styleOptions.find((option) => option.value === style)?.description}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              業務依頼文
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="例：明日までに顧客向け障害報告のたたき台を作り、社内確認に回したい。影響範囲、一次切り分け、暫定対応、顧客への確認事項も整理したい。"
              rows={12}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
            />
            <p className="mt-2 text-xs text-slate-500">
              業務依頼文: 実際にAIへ整理させたい依頼内容のテキストです。
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              メモ欄
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="保存時に一緒に残したい背景、補足、引き継ぎメモを入力できます。"
              rows={4}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "生成中..." : "生成する"}
            </button>

            {result && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-2xl border border-cyan-500/30 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                再生成する
              </button>
            )}

            {result && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "保存中..." : "結果を保存する"}
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {saveMessage && (
            <div className="rounded-2xl border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
              {saveMessage}
            </div>
          )}

          {warningMessage && (
            <div className="rounded-2xl border border-amber-900 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
              {warningMessage}
            </div>
          )}

          {references.length > 0 && (
            <div className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 px-4 py-4">
              <p className="text-sm font-medium text-cyan-100">
                RAGで参照したナレッジ
              </p>
              <div className="mt-3 space-y-3">
                {references.map((reference) => (
                  <div
                    key={reference.id}
                    className="rounded-2xl border border-cyan-900/30 bg-slate-950/50 p-3"
                  >
                    <p className="text-sm font-medium text-white">
                      {reference.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {reference.category} / {reference.source}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {reference.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">AI整理結果</h2>
          <p className="mt-2 text-sm text-slate-400">
            生成結果はここに表示されます。
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-slate-700 px-3 py-1">
              トーン: {tone}
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              スタイル: {style}
            </span>
          </div>
          {usedModel && (
            <p className="mt-2 text-xs text-cyan-200">
              使用モデル: {usedModel}
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
            <div className="h-4 w-40 animate-pulse rounded-full bg-slate-800" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-800/80" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-800/60" />
          </div>
        ) : result ? (
          <PlanResultCard plan={result} />
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-500">
            まだ結果はありません。左のフォームから業務依頼文を入力して「生成する」を押してください。
          </div>
        )}
      </section>
    </div>
  );
}
