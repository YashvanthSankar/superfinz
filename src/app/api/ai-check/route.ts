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

const ESSENTIAL = ["Rent", "Utilities", "Health", "Education", "Transport"];

const FALLBACK_ROASTS: Record<string, string[]> = {
  Food: [
    "bro you literally ate out {prev} times this week, your wallet is crying fr 💸",
    "another {category} spend? ngl ur stomach > ur savings rn 😭",
    "this is the {count}th food spend in 7 days, maybe cook once? ur savings goal needs you 🥺",
  ],
  Entertainment: [
    "you've spent ₹{weekSpend} on {category} this week... is it giving or is it going? 💀",
    "bro the subscriptions are multiplying, freeze this one instead 🙏",
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

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

function pickFallbackRoast(category: string, vars: Record<string, string | number>): string {
  const pool = FALLBACK_ROASTS[category] ?? FALLBACK_ROASTS.default;
  const idx = Math.floor((vars.amount as number + (vars.prev as number)) % pool.length);
  return fillTemplate(pool[idx], vars);
}

async function callOpenRouter(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        "X-Title": "SuperFinz",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 80,
        temperature: 0.8,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
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

  let isNecessary = ESSENTIAL.includes(category);

  if (!isNecessary) {
    if (budget) {
      const usedPct = (budget.spent + amount) / budget.limit;
      isNecessary = usedPct <= 0.8 && prevCount <= 1;
    } else {
      isNecessary = prevCount === 0;
    }
  }

  const hour = now.getHours();
  const timeLabel = hour < 6 ? "3am" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "midnight";

  const vars = {
    amount,
    category,
    weekSpend: weekSpend.toFixed(0),
    prev: prevCount,
    count: prevCount + 1,
    time: timeLabel,
    description,
  };

  let aiNote: string;

  if (isNecessary) {
    aiNote = `looks necessary! ₹${amount} for ${description} — tracked 🫡`;
  } else {
    const prompt = `You are a Gen Z finance buddy for Indian students/professionals. A user just spent ₹${amount} on "${description}" (category: ${category}). They've spent on ${category} ${prevCount} times this week (total ₹${weekSpend.toFixed(0)} this week). Write ONE short (max 15 words), funny, Gen Z roast/warning about this spend. Use Indian context. Use 1 emoji. Be helpful not mean.`;
    const llmNote = await callOpenRouter(prompt);
    aiNote = llmNote ?? pickFallbackRoast(category, vars);
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { isNecessary, aiNote },
  });

  return NextResponse.json({ isNecessary, aiNote });
}
