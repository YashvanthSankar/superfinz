import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  transactionId: z.string(),
  amount: z.number().positive(),
  category: z.string(),
  description: z.string(),
});

const ROASTS: Record<string, string[]> = {
  Food: [
    "bro you literally ate out {prev} times this week, your wallet is crying fr 💸",
    "another {category} spend? ngl ur stomach > ur savings rn 😭",
    "this is the {count}th food spend in 7 days, maybe cook once? ur savings goal needs you 🥺",
  ],
  Entertainment: [
    "you've spent ₹{weekSpend} on {category} this week... is it giving or is it going? 💀",
    "bro the subscriptions are multiplying, freeze this one and put it in goals instead 🙏",
    "entertainment budget is cooked rn, maybe touch grass (free) instead? 🌿",
  ],
  Shopping: [
    "you shopped {prev} times this week, is this a hobby now? 😭",
    "this purchase giving impulse buy vibes... sleep on it? ₹{amount} could hit your goal 💪",
    "online shopping at {time}?? that's textbook boredom spend king 🫡",
  ],
  Transport: [
    "cab again? ₹{amount} adds up fast, public transport arc when? 🚌",
    "that's {prev} transport spends this week, bus pass would've been cheaper ngl",
    "bro ur literally funding the cab driver's retirement not yours 😭",
  ],
  default: [
    "is this a need or a want rn? ₹{amount} towards your goal hits different 🎯",
    "you've spent ₹{weekSpend} in {category} this week, just checking in 👀",
    "bestie your savings goal is watching this purchase and shaking its head 💀",
  ],
};

function fillTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

function pickRoast(category: string, vars: Record<string, string | number>): string {
  const pool = ROASTS[category] ?? ROASTS.default;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return fillTemplate(template, vars);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { transactionId, amount, category, description } = parsed.data;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get same-category spends in last 7 days
  const recentSame = await prisma.transaction.findMany({
    where: {
      userId: session.userId,
      category,
      date: { gte: sevenDaysAgo },
      id: { not: transactionId },
    },
    orderBy: { date: "desc" },
  });

  const weekSpend = recentSame.reduce((s, t) => s + t.amount, 0) + amount;
  const prevCount = recentSame.length;

  // Get monthly budget for this category
  const now = new Date();
  const budget = await prisma.budget.findUnique({
    where: {
      userId_category_month_year: {
        userId: session.userId,
        category,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
  });

  // Determine necessity
  const ESSENTIAL = ["Rent", "Utilities", "Health", "Education", "Transport"];
  let isNecessary = ESSENTIAL.includes(category);

  if (!isNecessary) {
    if (budget) {
      const usedPct = (budget.spent + amount) / budget.limit;
      if (usedPct > 0.8) isNecessary = false;
      else if (prevCount <= 1) isNecessary = true;
      else isNecessary = false;
    } else {
      isNecessary = prevCount === 0;
    }
  }

  const hour = now.getHours();
  const timeLabel =
    hour < 6 ? "3am" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "midnight";

  const aiNote = isNecessary
    ? `looks necessary! ₹${amount} for ${description} — noted 🫡`
    : pickRoast(category, {
        amount,
        category,
        weekSpend: weekSpend.toFixed(0),
        prev: prevCount,
        count: prevCount + 1,
        time: timeLabel,
        description,
      });

  // Patch the transaction with AI assessment
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { isNecessary, aiNote },
  });

  return NextResponse.json({ isNecessary, aiNote });
}
