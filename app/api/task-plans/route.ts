import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTitleFromInput } from "@/lib/utils";
import {
  FollowUpAnswerItem,
  GeneratedPlan,
  KnowledgeReference,
  TaskCheckItem,
  isOutputStyle,
  isOutputTone,
  isPlanCategory,
  isPlanStatus,
} from "@/types/plan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputText = body?.inputText?.trim();
    const category = body?.category?.trim();
    const plan = body?.plan;
    const status = body?.status;
    const isConfirmed = body?.isConfirmed;
    const tone = body?.tone;
    const style = body?.style;
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
    const followUpAnswers = Array.isArray(body?.followUpAnswers)
      ? (body.followUpAnswers as FollowUpAnswerItem[])
      : [];
    const ragSources = Array.isArray(body?.ragSources)
      ? (body.ragSources as KnowledgeReference[])
      : [];
    const taskChecks = Array.isArray(body?.taskChecks)
      ? (body.taskChecks as TaskCheckItem[])
      : [];

    if (!inputText) {
      return NextResponse.json(
        { error: "保存対象の業務依頼文がありません。" },
        { status: 400 }
      );
    }

    if (!isPlanCategory(category)) {
      return NextResponse.json(
        { error: "保存対象のカテゴリがありません。" },
        { status: 400 }
      );
    }

    if (!isGeneratedPlan(plan)) {
      return NextResponse.json(
        { error: "保存対象のAI結果が不正です。" },
        { status: 400 }
      );
    }

    const created = await prisma.taskPlan.create({
      data: {
        title: createTitleFromInput(inputText),
        category,
        inputText,
        requestSummary: plan.requestSummary,
        tasksJson: JSON.stringify(plan.tasks ?? []),
        prioritiesJson: JSON.stringify(plan.priorities ?? []),
        stepsJson: JSON.stringify(plan.steps ?? []),
        risksJson: JSON.stringify(plan.risks ?? []),
        checksJson: JSON.stringify(plan.checks ?? []),
        followUpQuestionsJson: JSON.stringify(plan.followUpQuestions ?? []),
        followUpAnswersJson: JSON.stringify(followUpAnswers),
        taskChecksJson: JSON.stringify(
          taskChecks.length
            ? taskChecks
            : (plan.tasks ?? []).map((task) => ({ task, completed: false }))
        ),
        ragSourcesJson: JSON.stringify(ragSources),
        status: isPlanStatus(status) ? status : "未着手",
        isConfirmed: typeof isConfirmed === "boolean" ? isConfirmed : false,
        tone: isOutputTone(tone) ? tone : "標準",
        style: isOutputStyle(style) ? style : "現場向け",
        notes,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "保存中に予期しないエラーが発生しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const plans = await prisma.taskPlan.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "一覧取得中に予期しないエラーが発生しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isGeneratedPlan(value: unknown): value is GeneratedPlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as GeneratedPlan;

  return (
    typeof candidate.requestSummary === "string" &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.priorities) &&
    Array.isArray(candidate.steps) &&
    Array.isArray(candidate.risks) &&
    Array.isArray(candidate.checks) &&
    Array.isArray(candidate.followUpQuestions)
  );
}
