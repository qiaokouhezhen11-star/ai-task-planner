export type PlanCategory =
  | "問い合わせ対応"
  | "障害初動"
  | "引き継ぎ"
  | "営業準備"
  | "その他";

export const PLAN_CATEGORIES: PlanCategory[] = [
  "問い合わせ対応",
  "障害初動",
  "引き継ぎ",
  "営業準備",
  "その他",
];

export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";

export type PlanStatus = "未着手" | "対応中" | "完了";
export type OutputTone = "簡潔" | "標準" | "詳細";
export type OutputStyle = "現場向け" | "管理者向け" | "顧客説明向け";

export const PLAN_STATUSES: PlanStatus[] = ["未着手", "対応中", "完了"];
export const OUTPUT_TONES: OutputTone[] = ["簡潔", "標準", "詳細"];
export const OUTPUT_STYLES: OutputStyle[] = [
  "現場向け",
  "管理者向け",
  "顧客説明向け",
];

export type SupportedPlanModel =
  | "gpt-5.4"
  | "gpt-5.1"
  | "gpt-5-mini"
  | "gpt-5-nano";

export const SUPPORTED_PLAN_MODELS: SupportedPlanModel[] = [
  "gpt-5.4",
  "gpt-5.1",
  "gpt-5-mini",
  "gpt-5-nano",
];

export type PriorityItem = {
  task: string;
  priority: PriorityLevel;
  reason: string;
};

export type TaskCheckItem = {
  task: string;
  completed: boolean;
};

export type KnowledgeReference = {
  id: number;
  title: string;
  category: string;
  source: string;
  excerpt: string;
  tags: string[];
};

export type FollowUpAnswerItem = {
  question: string;
  answer: string;
};

export type GeneratedPlan = {
  requestSummary: string;
  tasks: string[];
  priorities: PriorityItem[];
  steps: string[];
  risks: string[];
  checks: string[];
  followUpQuestions: string[];
};

export type GeneratePlanResult = {
  plan: GeneratedPlan;
  warning: string | null;
  model: SupportedPlanModel;
  references: KnowledgeReference[];
};

export function isPriorityLevel(value: unknown): value is PriorityLevel {
  return value === "HIGH" || value === "MEDIUM" || value === "LOW";
}

export function isPlanStatus(value: unknown): value is PlanStatus {
  return typeof value === "string" && PLAN_STATUSES.includes(value as PlanStatus);
}

export function isOutputTone(value: unknown): value is OutputTone {
  return typeof value === "string" && OUTPUT_TONES.includes(value as OutputTone);
}

export function isOutputStyle(value: unknown): value is OutputStyle {
  return typeof value === "string" && OUTPUT_STYLES.includes(value as OutputStyle);
}

export function isSupportedPlanModel(value: unknown): value is SupportedPlanModel {
  return (
    typeof value === "string" &&
    SUPPORTED_PLAN_MODELS.includes(value as SupportedPlanModel)
  );
}

export function isPlanCategory(value: unknown): value is PlanCategory {
  return (
    typeof value === "string" &&
    PLAN_CATEGORIES.includes(value as PlanCategory)
  );
}

export function isPriorityItem(value: unknown): value is PriorityItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.task === "string" &&
    isPriorityLevel(candidate.priority) &&
    typeof candidate.reason === "string"
  );
}

export function isGeneratedPlan(value: unknown): value is GeneratedPlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.requestSummary === "string" &&
    Array.isArray(candidate.tasks) &&
    candidate.tasks.every((item) => typeof item === "string") &&
    Array.isArray(candidate.priorities) &&
    candidate.priorities.every((item) => isPriorityItem(item)) &&
    Array.isArray(candidate.steps) &&
    candidate.steps.every((item) => typeof item === "string") &&
    Array.isArray(candidate.risks) &&
    candidate.risks.every((item) => typeof item === "string") &&
    Array.isArray(candidate.checks) &&
    candidate.checks.every((item) => typeof item === "string") &&
    Array.isArray(candidate.followUpQuestions) &&
    candidate.followUpQuestions.every((item) => typeof item === "string")
  );
}

export type TaskPlanRecord = {
  id: number;
  title: string;
  category: string;
  inputText: string;
  requestSummary: string;
  tasksJson: string;
  prioritiesJson: string;
  stepsJson: string;
  risksJson: string;
  checksJson: string;
  followUpQuestionsJson: string;
  followUpAnswersJson: string;
  taskChecksJson: string;
  ragSourcesJson: string;
  status: string;
  isConfirmed: boolean;
  tone: string;
  style: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ParsedTaskPlan = {
  id: number;
  title: string;
  category: string;
  inputText: string;
  requestSummary: string;
  tasks: string[];
  priorities: PriorityItem[];
  steps: string[];
  risks: string[];
  checks: string[];
  followUpQuestions: string[];
  followUpAnswers: FollowUpAnswerItem[];
  taskChecks: TaskCheckItem[];
  ragSources: KnowledgeReference[];
  status: PlanStatus;
  isConfirmed: boolean;
  tone: OutputTone;
  style: OutputStyle;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeItemRecord = {
  id: number;
  title: string;
  category: string;
  content: string;
  tagsJson: string;
  source: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
