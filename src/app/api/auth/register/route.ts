import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  age: z.number().int().min(10).max(100),
  userType: z.enum(["SCHOOL_STUDENT", "COLLEGE_STUDENT", "PROFESSIONAL"]),
  // student fields
  institution: z.string().optional(),
  monthlyAllowance: z.number().optional(),
  incomeSources: z.array(z.string()).optional(),
  // professional fields
  company: z.string().optional(),
  monthlySalary: z.number().optional(),
  industry: z.string().optional(),
  // common
  monthlyBudget: z.number().min(0),
  savingsGoal: z.number().min(0),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      age: data.age,
      userType: data.userType,
      profile: {
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
      },
    },
    include: { profile: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, userType: user.userType },
  });
}
