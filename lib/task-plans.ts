import "server-only";
import { prisma } from "@/lib/prisma";
import { getKnowledgeDashboard } from "@/lib/rag";
import { parseTaskPlan } from "@/lib/utils";
import { ParsedTaskPlan } from "@/types/plan";

export async function getTaskPlans(): Promise<ParsedTaskPlan[]> {
  const records = await prisma.taskPlan.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return records.map((record) =>
    parseTaskPlan({
      ...record,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    })
  );
}

export async function getTaskPlanById(id: number): Promise<ParsedTaskPlan | null> {
  const record = await prisma.taskPlan.findUnique({
    where: {
      id,
    },
  });

  if (!record) {
    return null;
  }

  return parseTaskPlan({
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

export async function getDashboardSummary() {
  const [plans, knowledgeItems] = await Promise.all([
    getTaskPlans(),
    getKnowledgeDashboard(),
  ]);

  const totalPlans = plans.length;
  const completedTasks = plans.reduce(
    (sum, plan) => sum + plan.taskChecks.filter((item) => item.completed).length,
    0
  );
  const totalTasks = plans.reduce((sum, plan) => sum + plan.taskChecks.length, 0);

  return {
    plans,
    knowledgeItems,
    stats: {
      totalPlans,
      todoPlans: plans.filter((plan) => plan.status === "未着手").length,
      inProgressPlans: plans.filter((plan) => plan.status === "対応中").length,
      completedPlans: plans.filter((plan) => plan.status === "完了").length,
      confirmedPlans: plans.filter((plan) => plan.isConfirmed).length,
      totalTasks,
      completedTasks,
      totalKnowledgeItems: knowledgeItems.length,
    },
  };
}
