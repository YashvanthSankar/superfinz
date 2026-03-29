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
    "hey bestie, you ate out {count} times this week, is this really needed? 🥺",
    "just checking in! another {category} spend? your budget will drop this week 🌱",
    "that's ₹{weekSpend} on food this week! maybe cook if you wanna save for your goals? 🍳"
  ],
  Entertainment: [
    "you've spent ₹{weekSpend} on {category} this week... just wanted to give you the full picture 💭",
    "hey friend, maybe freeze a subscription instead? this will lower your week's budget 🫶"
  ],
  Shopping: [
    "you shopped {prev} times this week! is this an essential need? you've got goals to crush 🎯",
    "this purchase might delay your goals... ₹{amount} could totally hit your target instead 💡"
  ],
  Transport: [
    "cab again? ₹{amount} adds up fast to your budget! maybe public transport to save? 🚌",
    "just a heads up! that's {prev} transport spends this week, your budget is taking a hit 📉"
  ],
  default: [
    "is this a need or a want right now? just making sure you don't regret this drop in budget 💙",
    "you've spent ₹{weekSpend} in {category} this week, just a friendly check-in on your goals 🥺"
  ]
};

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

function pickFallbackRoast(category: string, vars: Record<string, string | number>): string {
  const pool = FALLBACK_ROASTS[category] ?? FALLBACK_ROASTS.default;
  const idx = Math.floor((vars.amount as number + (vars.prev as number)) % pool.length);
  return fillTemplate(pool[idx], vars);
}

async function callGroq(prompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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

  const weekSpend = recentSame.reduce<number>(
    (s: number, t: { amount: number }) => s + t.amount,
    0
  ) + amount;
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
    aiNote = `looks necessary! ₹${amount} for ${description} — tracked 🫶`;
  } else {
    const prompt = `You are a supportive Best Friend and finance companion for Indian Gen Z. A user just spent ₹${amount} on "${description}" (category: ${category}). They've already spent on ${category} ${prevCount} times this week (total ₹${weekSpend.toFixed(0)}). Write ONE short (max 15 words) friendly message to gently help them realize this might be an unnecessary purchase. Tell them how this impacts their weekly budget. Don't be mean, just help them see the full picture so they don't regret it later. Use 1 emoji.`;   
    const llmNote = await callGroq(prompt);
    aiNote = llmNote ?? pickFallbackRoast(category, vars);
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { isNecessary, aiNote },
  });

  return NextResponse.json({ isNecessary, aiNote });
}
