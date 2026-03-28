import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { financePlanError } from "@/lib/finance";
import { z } from "zod";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

const patchSchema = z.object({
  monthlyBudget:    z.number().min(0).optional(),
  savingsGoal:      z.number().min(0).optional(),
  monthlyAllowance: z.number().min(0).optional(),
  monthlySalary:    z.number().min(0).optional(),
  institution:      z.string().optional(),
  company:          z.string().optional(),
  industry:         z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existingUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  });

  if (!existingUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mergedMonthlyBudget = parsed.data.monthlyBudget ?? existingUser.profile?.monthlyBudget ?? 0;
  const mergedSavingsGoal = parsed.data.savingsGoal ?? existingUser.profile?.savingsGoal ?? 0;
  const mergedMonthlySalary = parsed.data.monthlySalary ?? existingUser.profile?.monthlySalary ?? 0;
  const mergedMonthlyAllowance = parsed.data.monthlyAllowance ?? existingUser.profile?.monthlyAllowance ?? 0;
  const mergedIncome = existingUser.userType === "PROFESSIONAL" ? mergedMonthlySalary : mergedMonthlyAllowance;

  const planError = financePlanError({
    monthlyIncome: mergedIncome,
    monthlyBudget: mergedMonthlyBudget,
    savingsGoal: mergedSavingsGoal,
  });

  if (planError) {
    return NextResponse.json({ error: planError }, { status: 400 });
  }

  await prisma.profile.upsert({
    where: { userId: session.userId },
    update: parsed.data,
    create: { userId: session.userId, ...parsed.data },
  });

  return NextResponse.json({ success: true });
}
