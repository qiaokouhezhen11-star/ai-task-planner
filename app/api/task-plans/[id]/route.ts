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

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json(
        { error: "不正なIDです。" },
        { status: 400 }
      );
    }

    const plan = await prisma.taskPlan.findUnique({
      where: {
        id: numericId,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "データが見つかりません。" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "詳細取得中に予期しないエラーが発生しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ error: "不正なIDです。" }, { status: 400 });
    }

    const body = await req.json();
    const data: {
      status?: string;
      isConfirmed?: boolean;
      notes?: string;
      category?: string;
      inputText?: string;
      title?: string;
      tone?: string;
      style?: string;
      requestSummary?: string;
      tasksJson?: string;
      prioritiesJson?: string;
      stepsJson?: string;
      risksJson?: string;
      checksJson?: string;
      followUpQuestionsJson?: string;
      followUpAnswersJson?: string;
      taskChecksJson?: string;
      ragSourcesJson?: string;
    } = {};

    if (body?.status !== undefined) {
      if (!isPlanStatus(body.status)) {
        return NextResponse.json(
          { error: "ステータスが不正です。" },
          { status: 400 }
        );
      }

      data.status = body.status;
    }

    if (body?.isConfirmed !== undefined) {
      if (typeof body.isConfirmed !== "boolean") {
        return NextResponse.json(
          { error: "確認フラグが不正です。" },
          { status: 400 }
        );
      }

      data.isConfirmed = body.isConfirmed;
    }

    if (body?.notes !== undefined) {
      if (typeof body.notes !== "string") {
        return NextResponse.json(
          { error: "メモの形式が不正です。" },
          { status: 400 }
        );
      }

      data.notes = body.notes.trim();
    }

    if (body?.category !== undefined) {
      if (!isPlanCategory(body.category)) {
        return NextResponse.json(
          { error: "カテゴリが不正です。" },
          { status: 400 }
        );
      }

      data.category = body.category;
    }

    if (body?.inputText !== undefined) {
      if (typeof body.inputText !== "string" || !body.inputText.trim()) {
        return NextResponse.json(
          { error: "業務依頼文が不正です。" },
          { status: 400 }
        );
      }

      const normalizedInputText = body.inputText.trim();
      data.inputText = normalizedInputText;
      data.title = createTitleFromInput(normalizedInputText);
    }

    if (body?.tone !== undefined) {
      if (!isOutputTone(body.tone)) {
        return NextResponse.json(
          { error: "出力トーンが不正です。" },
          { status: 400 }
        );
      }

      data.tone = body.tone;
    }

    if (body?.style !== undefined) {
      if (!isOutputStyle(body.style)) {
        return NextResponse.json(
          { error: "出力スタイルが不正です。" },
          { status: 400 }
        );
      }

      data.style = body.style;
    }

    if (body?.plan !== undefined) {
      if (!isGeneratedPlan(body.plan)) {
        return NextResponse.json(
          { error: "再生成結果の形式が不正です。" },
          { status: 400 }
        );
      }

      const plan = body.plan;
      data.requestSummary = plan.requestSummary;
      data.tasksJson = JSON.stringify(plan.tasks);
      data.prioritiesJson = JSON.stringify(plan.priorities);
      data.stepsJson = JSON.stringify(plan.steps);
      data.risksJson = JSON.stringify(plan.risks);
      data.checksJson = JSON.stringify(plan.checks);
      data.followUpQuestionsJson = JSON.stringify(plan.followUpQuestions);
      data.taskChecksJson = JSON.stringify(
        (plan.tasks ?? []).map((task: string) => ({ task, completed: false }))
      );
    }

    if (body?.followUpAnswers !== undefined) {
      if (!Array.isArray(body.followUpAnswers)) {
        return NextResponse.json(
          { error: "補足回答の形式が不正です。" },
          { status: 400 }
        );
      }

      data.followUpAnswersJson = JSON.stringify(
        body.followUpAnswers as FollowUpAnswerItem[]
      );
    }

    if (body?.taskChecks !== undefined) {
      if (!Array.isArray(body.taskChecks)) {
        return NextResponse.json(
          { error: "タスクチェックの形式が不正です。" },
          { status: 400 }
        );
      }

      data.taskChecksJson = JSON.stringify(body.taskChecks as TaskCheckItem[]);
    }

    if (body?.ragSources !== undefined) {
      if (!Array.isArray(body.ragSources)) {
        return NextResponse.json(
          { error: "RAG参照情報の形式が不正です。" },
          { status: 400 }
        );
      }

      data.ragSourcesJson = JSON.stringify(body.ragSources as KnowledgeReference[]);
    }

    const updated = await prisma.taskPlan.update({
      where: { id: numericId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "更新中に予期しないエラーが発生しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ error: "不正なIDです。" }, { status: 400 });
    }

    await prisma.taskPlan.delete({
      where: { id: numericId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "削除中に予期しないエラーが発生しました。";

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
