"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getStrategies() {
  try {
    const userId = await getUserId();
    return await prisma.strategy.findMany({
      where: { userId },
      include: { rules: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch strategies:", error);
    return [];
  }
}

export async function createStrategy(name: string) {
  const userId = await getUserId();
  const strategy = await prisma.strategy.create({
    data: {
      name,
      userId,
      rules: {
        create: [
          { text: "Define Objectives", checked: false },
          { text: "Identify Risks", checked: false },
          { text: "Allocate Resources", checked: false },
        ],
      },
    },
    include: { rules: true },
  });
  revalidatePath("/");
  return strategy;
}

export async function updateStrategyName(id: string, name: string) {
  const userId = await getUserId();
  await prisma.strategy.update({
    where: { id, userId },
    data: { name },
  });
  revalidatePath("/");
}

export async function deleteStrategy(id: string) {
  const userId = await getUserId();
  await prisma.strategy.delete({
    where: { id, userId },
  });
  revalidatePath("/");
}

export async function addRule(strategyId: string, text: string) {
  const userId = await getUserId();
  // Verify ownership
  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId, userId },
  });
  if (!strategy) throw new Error("Strategy not found");

  const rule = await prisma.rule.create({
    data: {
      text,
      strategyId,
    },
  });
  revalidatePath("/");
  return rule;
}

export async function toggleRule(ruleId: string, checked: boolean) {
  const userId = await getUserId();
  // Verify ownership via strategy
  const rule = await prisma.rule.findUnique({
    where: { id: ruleId },
    include: { strategy: true },
  });
  if (!rule || rule.strategy.userId !== userId) throw new Error("Unauthorized");

  await prisma.rule.update({
    where: { id: ruleId },
    data: { checked },
  });
  revalidatePath("/");
}

export async function deleteRule(ruleId: string) {
  const userId = await getUserId();
  const rule = await prisma.rule.findUnique({
    where: { id: ruleId },
    include: { strategy: true },
  });
  if (!rule || rule.strategy.userId !== userId) throw new Error("Unauthorized");

  await prisma.rule.delete({
    where: { id: ruleId },
  });
  revalidatePath("/");
}

export async function duplicateStrategy(strategyId: string) {
  const userId = await getUserId();
  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId, userId },
    include: { rules: true },
  });
  if (!strategy) throw new Error("Strategy not found");

  const newStrategy = await prisma.strategy.create({
    data: {
      name: `${strategy.name} (Copy)`,
      userId,
      rules: {
        create: strategy.rules.map(r => ({
          text: r.text,
          checked: r.checked,
        })),
      },
    },
    include: { rules: true },
  });
  revalidatePath("/");
  return newStrategy;
}
