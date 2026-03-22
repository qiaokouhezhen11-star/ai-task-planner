import { NextRequest, NextResponse } from "next/server";
import { generatePlanWithAI, resolvePlanModel } from "@/lib/openai";
import { FollowUpAnswerItem } from "@/types/plan";
import { isOutputStyle, isOutputTone, isPlanCategory } from "@/types/plan";

export async function POST(req: NextRequest) {
  try {
    const body = await parseRequestBody(req);
    const inputText = body?.inputText?.trim();
    const category = body?.category;
    const requestedModel = body?.model;
    const tone = body?.tone;
    const style = body?.style;
    const followUpAnswers = normalizeFollowUpAnswers(body?.followUpAnswers);

    if (!inputText) {
      return NextResponse.json(
        {
          error:
            "業務依頼文が空です。フォームに対応したい依頼内容を入力してから再実行してください。",
        },
        { status: 400 }
      );
    }

    if (inputText.length < 10) {
      return NextResponse.json(
        {
          error:
            "業務依頼文が短すぎます。目的・期限・確認したいことを少し詳しく書くと精度が上がります。",
        },
        { status: 400 }
      );
    }

    if (inputText.length > 4000) {
      return NextResponse.json(
        {
          error:
            "業務依頼文が長すぎます。4000文字以内を目安に整理してから再実行してください。",
        },
        { status: 400 }
      );
    }

    if (!isPlanCategory(category)) {
      return NextResponse.json(
        {
          error:
            "業務カテゴリが不正です。問い合わせ対応、障害初動、引き継ぎ、営業準備、その他 のいずれかを指定してください。",
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY が設定されていません。.env.local に OpenAI の API キーを設定してください。",
        },
        { status: 500 }
      );
    }

    if (tone && !isOutputTone(tone)) {
      return NextResponse.json(
        { error: "出力トーンが不正です。簡潔、標準、詳細 のいずれかを指定してください。" },
        { status: 400 }
      );
    }

    if (style && !isOutputStyle(style)) {
      return NextResponse.json(
        {
          error:
            "出力スタイルが不正です。現場向け、管理者向け、顧客説明向け のいずれかを指定してください。",
        },
        { status: 400 }
      );
    }

    const result = await generatePlanWithAI(
      inputText,
      category,
      requestedModel,
      tone,
      style,
      followUpAnswers
    );

    return NextResponse.json({
      plan: result.plan,
      warning: result.warning,
      model: result.model,
      references: result.references,
      availableModels: [
        "gpt-5.4",
        "gpt-5.1",
        "gpt-5-mini",
        "gpt-5-nano",
      ],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error:
            "リクエスト形式が不正です。JSON の構造が壊れていないか確認してください。",
        },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "AI生成中に予期しないエラーが発生しました。時間をおいて再度お試しください。";

    return NextResponse.json(
      {
        error: message,
        model: resolvePlanModel(),
      },
      { status: 500 }
    );
  }
}

async function parseRequestBody(req: NextRequest): Promise<{
  inputText?: string;
  category?: string;
  model?: string;
  tone?: string;
  style?: string;
  followUpAnswers?: Array<{ question?: string; answer?: string }>;
}> {
  return req.json();
}

function normalizeFollowUpAnswers(value: unknown): FollowUpAnswerItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is { question?: string; answer?: string } =>
        Boolean(item) && typeof item === "object"
    )
    .map((item) => ({
      question: typeof item.question === "string" ? item.question : "",
      answer: typeof item.answer === "string" ? item.answer : "",
    }))
    .filter((item) => item.question.length > 0);
}
