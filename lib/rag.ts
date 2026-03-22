import "server-only";
import { prisma } from "@/lib/prisma";
import { KnowledgeReference, PlanCategory } from "@/types/plan";

const defaultKnowledgeItems: Array<{
  title: string;
  category: PlanCategory;
  content: string;
  tags: string[];
  source: string;
}> = [
  {
    title: "問い合わせ対応の一次切り分け手順",
    category: "問い合わせ対応",
    content:
      "問い合わせ対応では、現象、発生日時、対象ユーザー、影響範囲、再現性、緊急度を最初に確認する。回答前に契約条件や既知不具合の有無を確認する。",
    tags: ["問い合わせ", "一次切り分け", "確認事項"],
    source: "社内運用ガイド",
  },
  {
    title: "障害初動のエスカレーション基準",
    category: "障害初動",
    content:
      "障害初動では、影響ユーザー数、主要機能への影響、代替手段の有無を確認し、重大障害判定時は 15 分以内に関係者へ共有する。顧客向け文面は事実ベースで暫定対応と次回報告時刻を含める。",
    tags: ["障害", "エスカレーション", "顧客連絡"],
    source: "障害対応 Runbook",
  },
  {
    title: "引き継ぎで残すべき項目",
    category: "引き継ぎ",
    content:
      "引き継ぎでは、案件状況、未完了タスク、次回アクション、関係者、懸念点、参照資料を必ず残す。口頭説明だけに依存せず、更新日時付きでメモを残す。",
    tags: ["引き継ぎ", "ドキュメント", "メモ"],
    source: "引き継ぎ標準",
  },
  {
    title: "営業準備で確認する観点",
    category: "営業準備",
    content:
      "営業準備では、顧客課題、提案仮説、競合状況、参加者、意思決定者、想定質問、次回アクションを整理する。顧客説明向け資料は専門用語を避ける。",
    tags: ["営業", "提案", "顧客説明"],
    source: "営業準備チェックリスト",
  },
];

export async function ensureSeedKnowledge() {
  const count = await prisma.knowledgeItem.count();

  if (count > 0) {
    return;
  }

  await prisma.knowledgeItem.createMany({
    data: defaultKnowledgeItems.map((item) => ({
      title: item.title,
      category: item.category,
      content: item.content,
      tagsJson: JSON.stringify(item.tags),
      source: item.source,
      isActive: true,
    })),
  });
}

export async function retrieveRelevantKnowledge(
  inputText: string,
  category: string,
  limit = 3
): Promise<KnowledgeReference[]> {
  await ensureSeedKnowledge();

  const items = await prisma.knowledgeItem.findMany({
    where: {
      isActive: true,
    },
  });

  const normalizedInput = inputText.toLowerCase();

  return items
    .map((item) => {
      const tags = safeJsonParseArray<string>(item.tagsJson);
      let score = 0;

      if (item.category === category) {
        score += 5;
      }

      for (const tag of tags) {
        if (normalizedInput.includes(tag.toLowerCase())) {
          score += 2;
        }
      }

      for (const token of item.content.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
        if (token && normalizedInput.includes(token)) {
          score += 1;
        }
      }

      return {
        id: item.id,
        title: item.title,
        category: item.category,
        source: item.source,
        excerpt: item.content.slice(0, 160),
        tags,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score: _score, ...item }) => item);
}

export async function getKnowledgeDashboard() {
  await ensureSeedKnowledge();

  const items = await prisma.knowledgeItem.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    content: item.content,
    tags: safeJsonParseArray<string>(item.tagsJson),
    source: item.source,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

function safeJsonParseArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
