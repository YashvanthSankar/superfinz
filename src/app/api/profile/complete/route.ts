import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
            incomeSources: { set: (data.incomeSources ?? []) as import("@prisma/client").IncomeSource[] },
            company: data.company,
            monthlySalary: data.monthlySalary,
            industry: data.industry,
            monthlyBudget: data.monthlyBudget,
            savingsGoal: data.savingsGoal,
          },
          update: {
            institution: data.institution,
            monthlyAllowance: data.monthlyAllowance,
            incomeSources: { set: (data.incomeSources ?? []) as import("@prisma/client").IncomeSource[] },
            company: data.company,
            monthlySalary: data.monthlySalary,
            industry: data.industry,
            monthlyBudget: data.monthlyBudget,
            savingsGoal: data.savingsGoal,
          },
        },
      },
    },
  });

  return NextResponse.json({ success: true });
}
