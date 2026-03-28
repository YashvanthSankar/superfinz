import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { financePlanError } from "@/lib/finance";
import { z } from "zod";

const schema = z.object({
  age: z.number().int().min(10).max(100),
  userType: z.enum(["SCHOOL_STUDENT", "COLLEGE_STUDENT", "PROFESSIONAL"]),
  institution: z.string().optional(),
  monthlyAllowance: z.number().optional(),
  incomeSources: z.array(z.string()).optional(),
  company: z.string().optional(),
  monthlySalary: z.number().optional(),
  industry: z.string().optional(),
  monthlyBudget: z.number().min(0),
  savingsGoal: z.number().min(0),
  spendingPattern: z.string().optional(),
  cycleStartDate: z.number().int().min(1).max(31).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const monthlyIncome = data.userType === "PROFESSIONAL"
    ? (data.monthlySalary ?? 0)
    : (data.monthlyAllowance ?? 0);

  if (data.userType === "PROFESSIONAL" && !data.monthlySalary) {
    return NextResponse.json({ error: "Monthly salary is required for professionals." }, { status: 400 });
  }

  if ((data.userType === "SCHOOL_STUDENT" || data.userType === "COLLEGE_STUDENT") && !data.monthlyAllowance) {
    return NextResponse.json({ error: "Monthly allowance is required for students." }, { status: 400 });
  }

  const planError = financePlanError({
    monthlyIncome,
    monthlyBudget: data.monthlyBudget,
    savingsGoal: data.savingsGoal,
  });

  if (planError) {
    return NextResponse.json({ error: planError }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      age: data.age,
      userType: data.userType,
      onboarded: true,
      profile: {
        upsert: {
          create: {
            institution: data.institution,
            monthlyAllowance: data.monthlyAllowance,
            incomeSources: { set: (data.incomeSources ?? []) as never[] },
            company: data.company,
            monthlySalary: data.monthlySalary,
            industry: data.industry,
            monthlyBudget: data.monthlyBudget,
            savingsGoal: data.savingsGoal,
            spendingPattern: data.spendingPattern ?? "BALANCED",
            cycleStartDate: data.cycleStartDate ?? 1,
          },
          update: {
            institution: data.institution,
            monthlyAllowance: data.monthlyAllowance,
            incomeSources: { set: (data.incomeSources ?? []) as never[] },
            company: data.company,
            monthlySalary: data.monthlySalary,
            industry: data.industry,
            monthlyBudget: data.monthlyBudget,
            savingsGoal: data.savingsGoal,
            spendingPattern: data.spendingPattern ?? "BALANCED",
            cycleStartDate: data.cycleStartDate ?? 1,
          },
        },
      },
    },
  });

  return NextResponse.json({ success: true });
}
