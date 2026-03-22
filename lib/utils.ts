import {
  FollowUpAnswerItem,
  GeneratedPlan,
  KnowledgeReference,
  OutputStyle,
  OutputTone,
  ParsedTaskPlan,
  PlanStatus,
  PriorityItem,
  TaskCheckItem,
  TaskPlanRecord,
  isOutputStyle,
  isOutputTone,
  isPlanStatus,
} from "@/types/plan";

export function safeJsonParseArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseTaskPlan(record: TaskPlanRecord): ParsedTaskPlan {
  return {
    id: record.id,
    title: record.title,
    category: record.category,
    inputText: record.inputText,
    requestSummary: record.requestSummary,
    tasks: safeJsonParseArray<string>(record.tasksJson),
    priorities: safeJsonParseArray<PriorityItem>(record.prioritiesJson),
    steps: safeJsonParseArray<string>(record.stepsJson),
    risks: safeJsonParseArray<string>(record.risksJson),
    checks: safeJsonParseArray<string>(record.checksJson),
    followUpQuestions: safeJsonParseArray<string>(record.followUpQuestionsJson),
    followUpAnswers: safeJsonParseArray<FollowUpAnswerItem>(
      record.followUpAnswersJson
    ),
    taskChecks: normalizeTaskChecks(
      safeJsonParseArray<TaskCheckItem>(record.taskChecksJson),
      safeJsonParseArray<string>(record.tasksJson)
    ),
    ragSources: safeJsonParseArray<KnowledgeReference>(record.ragSourcesJson),
    status: normalizeStatus(record.status),
    isConfirmed: Boolean(record.isConfirmed),
    tone: normalizeTone(record.tone),
    style: normalizeStyle(record.style),
    notes: record.notes ?? "",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function createTitleFromInput(inputText: string) {
  const trimmed = inputText.trim().replace(/\s+/g, " ");
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed;
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeStatus(value: string): PlanStatus {
  return isPlanStatus(value) ? value : "未着手";
}

export function normalizeTone(value: string): OutputTone {
  return isOutputTone(value) ? value : "標準";
}

export function normalizeStyle(value: string): OutputStyle {
  return isOutputStyle(value) ? value : "現場向け";
}

export function serializePlanForCopy(
  plan: Pick<
    GeneratedPlan,
    | "requestSummary"
    | "tasks"
    | "priorities"
    | "steps"
    | "risks"
    | "checks"
    | "followUpQuestions"
  > | ParsedTaskPlan
) {
  const lines = [
    `依頼内容の要約\n${plan.requestSummary}`,
    `タスク分解\n${plan.tasks.map((item) => `- ${item}`).join("\n")}`,
    `優先順位\n${plan.priorities
      .map((item) => `- ${item.task} | ${item.priority} | ${item.reason}`)
      .join("\n")}`,
    `実行ステップ\n${plan.steps.map((item) => `- ${item}`).join("\n")}`,
    `想定リスク\n${plan.risks.map((item) => `- ${item}`).join("\n")}`,
    `確認事項\n${plan.checks.map((item) => `- ${item}`).join("\n")}`,
  ];

  if (plan.followUpQuestions?.length) {
    lines.push(
      `補足質問提案\n${plan.followUpQuestions
        .map((item) => `- ${item}`)
        .join("\n")}`
    );
  }

  return lines.join("\n\n");
}

export function serializeTasksOnly(plan: Pick<GeneratedPlan, "tasks">) {
  return plan.tasks.map((item) => `- ${item}`).join("\n");
}

export function serializeStepsOnly(plan: Pick<GeneratedPlan, "steps">) {
  return plan.steps.map((item) => `- ${item}`).join("\n");
}

export function serializeCustomerSummary(
  plan: Pick<GeneratedPlan, "requestSummary" | "risks" | "checks">
) {
  return [
    `ご説明用要約\n${plan.requestSummary}`,
    `想定リスク\n${plan.risks.map((item) => `- ${item}`).join("\n")}`,
    `確認事項\n${plan.checks.map((item) => `- ${item}`).join("\n")}`,
  ].join("\n\n");
}

export function serializePlanAsMarkdown(
  plan: Pick<
    GeneratedPlan,
    | "requestSummary"
    | "tasks"
    | "priorities"
    | "steps"
    | "risks"
    | "checks"
    | "followUpQuestions"
  >
) {
  const parts = [
    `## 依頼内容の要約\n\n${plan.requestSummary}`,
    `## タスク分解\n\n${plan.tasks.map((item) => `- ${item}`).join("\n")}`,
    `## 優先順位\n\n${plan.priorities
      .map((item) => `- **${item.priority}** ${item.task}: ${item.reason}`)
      .join("\n")}`,
    `## 実行ステップ\n\n${plan.steps.map((item) => `- ${item}`).join("\n")}`,
    `## 想定リスク\n\n${plan.risks.map((item) => `- ${item}`).join("\n")}`,
    `## 確認事項\n\n${plan.checks.map((item) => `- ${item}`).join("\n")}`,
  ];

  if (plan.followUpQuestions.length) {
    parts.push(
      `## 入力不足時の補足質問提案\n\n${plan.followUpQuestions
        .map((item) => `- ${item}`)
        .join("\n")}`
    );
  }

  return parts.join("\n\n");
}

export function serializePlanAsJson(
  plan: Pick<
    GeneratedPlan,
    | "requestSummary"
    | "tasks"
    | "priorities"
    | "steps"
    | "risks"
    | "checks"
    | "followUpQuestions"
  >
) {
  return JSON.stringify(plan, null, 2);
}

export function normalizeTaskChecks(
  checks: TaskCheckItem[],
  tasks: string[]
): TaskCheckItem[] {
  if (!checks.length) {
    return tasks.map((task) => ({
      task,
      completed: false,
    }));
  }

  return tasks.map((task) => {
    const matched = checks.find((item) => item.task === task);

    return {
      task,
      completed: matched?.completed ?? false,
    };
  });
}
