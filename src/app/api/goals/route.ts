import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  targetAmount: z.number().positive(),
  deadline: z.string().optional(),
  isEssential: z.boolean().optional().default(false),
});

const updateSchema = z.object({
  id: z.string(),
  savedAmount: z.number().min(0).optional(),
  achieved: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      userId: session.userId,
      title: parsed.data.title,
      targetAmount: parsed.data.targetAmount,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      isEssential: parsed.data.isEssential,
    },
  });

  revalidateTag(`dashboard-${session.userId}`, "default");
  return NextResponse.json({ goal }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.goal.update({ where: { id }, data: updates });
  revalidateTag(`dashboard-${session.userId}`, "default");
  return NextResponse.json({ goal: updated });
}
