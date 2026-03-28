import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  threeMonthsAgo.setHours(0, 0, 0, 0);

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.userId, date: { gte: threeMonthsAgo } },
    select: { amount: true, date: true },
    orderBy: { date: "asc" },
  });

  // Group by date string
  const map: Record<string, { total: number; count: number }> = {};
  for (const tx of transactions) {
    const key = tx.date.toISOString().slice(0, 10);
    if (!map[key]) map[key] = { total: 0, count: 0 };
    map[key].total += tx.amount;
    map[key].count += 1;
  }

  const heatmap = Object.entries(map).map(([date, v]) => ({ date, ...v }));
  return NextResponse.json({ heatmap });
}
