import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx || tx.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });

  // Reverse budget spent
  await prisma.budget.updateMany({
    where: {
      userId: session.userId,
      category: tx.category,
      month: tx.date.getMonth() + 1,
      year: tx.date.getFullYear(),
    },
    data: { spent: { decrement: tx.amount } },
  });

  return NextResponse.json({ success: true });
}
