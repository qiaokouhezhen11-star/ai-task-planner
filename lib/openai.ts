import OpenAI from "openai";
import { retrieveRelevantKnowledge } from "@/lib/rag";
import {
  FollowUpAnswerItem,
  GeneratePlanResult,
  GeneratedPlan,
  KnowledgeReference,
  OutputStyle,
  OutputTone,
  SupportedPlanModel,
  isGeneratedPlan,
  isOutputStyle,
  isOutputTone,
  isPriorityLevel,
  isSupportedPlanModel,
} from "@/types/plan";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const DEFAULT_PLAN_MODEL: SupportedPlanModel = "gpt-5.4";

const PLAN_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    requestSummary: {
      type: "string",
      description: "依頼内容の要約",
    },
    tasks: {
      type: "array",
      items: {
        type: "string",
      },
    },
    priorities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          task: {
            type: "string",
          },
          priority: {
            type: "string",
            enum: ["HIGH", "MEDIUM", "LOW"],
          },
          reason: {
            type: "string",
          },
        },
        required: ["task", "priority", "reason"],
      },
    },
    steps: {
      type: "array",
      items: {
        type: "string",
      },
    },
    risks: {
      type: "array",
      items: {
        type: "string",
      },
    },
    checks: {
      type: "array",
      items: {
        type: "string",
      },
    },
    followUpQuestions: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "requestSummary",
    "tasks",
    "priorities",
    "steps",
    "risks",
    "checks",
    "followUpQuestions",
  ],
} as const;

export const PLAN_SYSTEM_PROMPT = `
あなたは業務整理に強い優秀なアシスタントです。
ユーザーが入力した業務依頼文をもとに、実務で使いやすい形へ整理してください。

必ず以下のJSON形式のみを返してください。
JSON以外の文章は一切出力しないでください。
コードブロックも不要です。

{
  "requestSummary": "依頼内容の要約",
  "tasks": ["タスク1", "タスク2"],
  "priorities": [
    {
      "task": "タスク名",
      "priority": "HIGH",
      "reason": "理由"
    }
  ],
  "steps": ["手順1", "手順2"],
  "risks": ["リスク1"],
  "checks": ["確認事項1"],
  "followUpQuestions": ["追加で確認したい質問1"]
}

ルール:
- requestSummary は日本語で簡潔にまとめる
- tasks / steps / risks / checks は配列で返す
- followUpQuestions は、入力不足があるときに確認したい質問を配列で返す。十分な場合は空配列でもよい
- priorities は task / priority / reason を持つ配列で返す
- priority は HIGH, MEDIUM, LOW のいずれかにする
- 実務でそのまま使いやすい内容にする
- 抽象的すぎる表現は避ける
- 入力内容に不足がある場合も、一般的な前提で補って整理する
- 参考ナレッジが与えられた場合は、その内容を踏まえて実務に即した形に調整する
`.trim();

export function resolvePlanModel(requestedModel?: string): SupportedPlanModel {
  if (isSupportedPlanModel(requestedModel)) {
    return requestedModel;
  }

  if (isSupportedPlanModel(process.env.OPENAI_PLAN_MODEL)) {
    return process.env.OPENAI_PLAN_MODEL;
  }

  return DEFAULT_PLAN_MODEL;
}

export async function generatePlanWithAI(
  inputText: string,
  category: string,
  requestedModel?: string,
  tone?: string,
  style?: string,
  followUpAnswers: FollowUpAnswerItem[] = []
): Promise<GeneratePlanResult> {
  const model = resolvePlanModel(requestedModel);
  const resolvedTone: OutputTone = isOutputTone(tone) ? tone : "標準";
  const resolvedStyle: OutputStyle = isOutputStyle(style) ? style : "現場向け";
  const references = await retrieveRelevantKnowledge(inputText, category);
  const response = await client.responses.create({
    model,
    text: {
      format: {
        type: "json_schema",
        name: "task_plan",
        strict: true,
        schema: PLAN_RESPONSE_SCHEMA,
      },
    },
    input: [
      {
        role: "system",
        content: PLAN_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          `業務カテゴリ: ${category}`,
          `出力トーン: ${resolvedTone}`,
          `出力スタイル: ${resolvedStyle}`,
          `業務依頼文: ${inputText}`,
          formatFollowUpAnswers(followUpAnswers),
          formatKnowledgeReferences(references),
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  const text = response.output_text?.trim();

  if (!text) {
    return {
      plan: buildFallbackPlan(inputText, category),
      warning:
        "AIレスポンスが空だったため、アプリ側のフォールバック結果を返しました。",
      model,
      references,
    };
  }

  const parsed = parseGeneratedPlanSafely(text);

  if (parsed) {
    return {
      plan: parsed,
      warning: null,
      model,
      references,
    };
  }

  return {
    plan: buildFallbackPlan(inputText, category),
    warning:
      "AIレスポンスを安全にJSONとして解釈できなかったため、アプリ側のフォールバック結果を返しました。",
    model,
    references,
  };
}

function parseGeneratedPlanSafely(rawText: string): GeneratedPlan | null {
  const candidates = createJsonCandidates(rawText);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;

      if (isGeneratedPlan(parsed)) {
        return normalizeGeneratedPlan(parsed);
      }
    } catch {
      continue;
    }
  }

  return null;
}

function createJsonCandidates(rawText: string): string[] {
  const trimmed = rawText.trim();
  const withoutFence = stripCodeFences(trimmed);
  const extractedJson = extractFirstJsonObject(withoutFence);

  return Array.from(
    new Set(
      [trimmed, withoutFence, extractedJson]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function stripCodeFences(value: string): string {
  return value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractFirstJsonObject(value: string): string | null {
  const startIndex = value.indexOf("{");
  const endIndex = value.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return null;
  }

  return value.slice(startIndex, endIndex + 1);
}

function normalizeGeneratedPlan(plan: GeneratedPlan): GeneratedPlan {
  return {
    requestSummary: plan.requestSummary.trim(),
    tasks: normalizeStringArray(plan.tasks),
    priorities: plan.priorities
      .map((item) => ({
        task: item.task.trim(),
        priority: isPriorityLevel(item.priority) ? item.priority : "MEDIUM",
        reason: item.reason.trim(),
      }))
      .filter((item) => item.task && item.reason),
    steps: normalizeStringArray(plan.steps),
    risks: normalizeStringArray(plan.risks),
    checks: normalizeStringArray(plan.checks),
    followUpQuestions: normalizeStringArray(plan.followUpQuestions),
  };
}

function normalizeStringArray(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function buildFallbackPlan(inputText: string, category: string): GeneratedPlan {
  const shortInput = inputText.trim().replace(/\s+/g, " ");

  return {
    requestSummary:
      shortInput.length > 120 ? `${shortInput.slice(0, 120)}...` : shortInput,
    tasks: [
      `${category}の依頼内容を整理する`,
      "必要な関係者と期限を確認する",
      "対応に必要な情報を不足なく集める",
    ],
    priorities: [
      {
        task: "依頼内容を整理する",
        priority: "HIGH",
        reason: "最初に前提を揃えないと後続の作業方針がぶれやすいためです。",
      },
      {
        task: "関係者と期限を確認する",
        priority: "HIGH",
        reason: "優先度と対応順を決めるうえで重要なためです。",
      },
      {
        task: "不足情報を収集する",
        priority: "MEDIUM",
        reason: "手戻りを減らし、実行可能な計画にするためです。",
      },
    ],
    steps: [
      "依頼文から目的・期限・成果物を読み取る",
      "不足している前提条件と確認事項を洗い出す",
      "実行順にタスクを並べて担当者や依存関係を整理する",
    ],
    risks: [
      "依頼文に不足情報があり、対応方針がずれる可能性があります。",
      "期限や優先度の認識違いで手戻りが発生する可能性があります。",
    ],
    checks: [
      "最終成果物の形式は何か",
      "対応期限と優先度はどうなっているか",
      "事前に確認すべき関係者は誰か",
    ],
    followUpQuestions: [
      "この依頼の最終成果物は何ですか？",
      "期限と優先度はどの程度厳しいですか？",
      "先に確認すべき関係者や承認者はいますか？",
    ],
  };
}

function formatKnowledgeReferences(references: KnowledgeReference[]) {
  if (!references.length) {
    return "";
  }

  return [
    "参考ナレッジ:",
    ...references.map(
      (reference) =>
        `- [${reference.category}] ${reference.title} (${reference.source})\n  ${reference.excerpt}`
    ),
  ].join("\n");
}

function formatFollowUpAnswers(items: FollowUpAnswerItem[]) {
  if (!items.length) {
    return "";
  }

  return [
    "補足回答:",
    ...items.map((item) => `- 質問: ${item.question}\n  回答: ${item.answer}`),
  ].join("\n");
}
