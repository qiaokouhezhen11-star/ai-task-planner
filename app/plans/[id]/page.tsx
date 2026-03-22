import { notFound } from "next/navigation";
import PlanDetailClient from "@/components/PlanDetailClient";
import { getTaskPlanById } from "@/lib/task-plans";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PlanDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId)) {
    notFound();
  }

  const plan = await getTaskPlanById(numericId);

  if (!plan) {
    notFound();
  }

  return (
    <PlanDetailClient initialPlan={plan} />
  );
}
