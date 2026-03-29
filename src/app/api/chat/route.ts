import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(1).max(500),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(20).optional().default([]),
});

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
];

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function buildSystemPrompt(data: {
  name: string;
  userType: string;
  age: number;
  monthlyBudget: number;
  income: number;
  savingsGoal: number;
  monthlySpend: number;
  budgetPct: number;
  remaining: number;
  transactions: Array<{ date: Date; description: string; category: string; amount: number }>;
  goals: Array<{ title: string; savedAmount: number; targetAmount: number }>;
}) {
  const now = new Date();
  const txLines = data.transactions
    .slice(0, 25)
    .map((t) => {
      const d = new Date(t.date);
      const dayLabel = d.toDateString() === now.toDateString()
        ? "today"
        : d.toDateString() === new Date(now.getTime() - 86400000).toDateString()
        ? "yesterday"
        : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      return `  ${dayLabel} — ${t.description} (${t.category}) — ${fmt(t.amount)}`;
    })
    .join("\n");

  const goalLines = data.goals
    .map((g) => `  ${g.title}: ${fmt(g.savedAmount)} saved / ${fmt(g.targetAmount)} target`)
    .join("\n") || "  No active goals";

  const userTypeLabel =
    data.userType === "SCHOOL_STUDENT" ? "school student" :
    data.userType === "COLLEGE_STUDENT" ? "college student" :
    "working professional";

  // FIRE context
  const sipR = 0.12 / 12;
  const yearsLeft = Math.max(45 - data.age, 1);
  const sipN = yearsLeft * 12;
  const fireCorpus = (data.monthlyBudget > 0 ? data.monthlyBudget : data.income) * 12 * 25;
  const projCorpus = data.savingsGoal > 0
    ? data.savingsGoal * ((Math.pow(1 + sipR, sipN) - 1) / sipR)
    : 0;
  const corpusGap = Math.max(fireCorpus - projCorpus, 0);
  return `You are Finz, a sharp personal finance assistant inside SuperFinz — a finance tracker for Indian Gen Z.

USER CONTEXT:
Name: ${data.name.split(" ")[0]}
Type: ${userTypeLabel}, age ${data.age}
Monthly budget: ${fmt(data.monthlyBudget)}
Monthly income: ${fmt(data.income)}
Savings goal (SIP): ${fmt(data.savingsGoal)}/month
This month: spent ${fmt(data.monthlySpend)} (${data.budgetPct.toFixed(0)}% of budget), ${fmt(data.remaining)} remaining
FIRE target: retire at 45, corpus needed ${fireCorpus >= 10000000 ? `₹${(fireCorpus/10000000).toFixed(1)}Cr` : `₹${(fireCorpus/100000).toFixed(0)}L`}
Corpus gap: ${corpusGap >= 10000000 ? `₹${(corpusGap/10000000).toFixed(1)}Cr` : `₹${(corpusGap/100000).toFixed(0)}L`} shortfall at current SIP rate
Today: ${now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}

RECENT TRANSACTIONS (newest first):
${txLines || "  No transactions yet"}

SAVINGS GOALS:
${goalLines}

HOW TO RESPOND:
- Act like a close friend and companion. If they bought or want to buy something unnecessary, kindly make them realize it might not be a "need". Don't force them; just help them understand. 
- When someone asks "should I buy X" or "I want to buy X this week", tell them exactly how it will affect their weekly/monthly budget (e.g. "If you buy this, you'll see a big reduction in your budget for this week"). Give them the full picture so they don't regret their choice.
- If they want to buy something extra (like a game, shoes, trip), suggest they set up a dedicated savings plan for it instead of buying it instantly.
- Search the transactions above for similar items. If they bought it recently, call it out by name and date: "you had biryani at Murugan's just yesterday"
- ALWAYS mention what skipping the spend could become: "₹500 in a NIFTY 50 SIP = ₹16,000 in 20 years" — use real math (12% CAGR)
- Tie savings to their goals: "skip this, put ${fmt(500)} toward your [goal name]"
- Keep it to 2-4 sentences. Direct, not preachy. Like a smart friend who's good with money
- Use Indian rupee amounts. Reference real category names from their data
- If budget is over 80% used, flag it strongly
- Do not use bullet points unless explicitly asked for a list
- No asterisks, no markdown formatting in responses — plain conversational text only
- Gen Z tone: casual, direct, empathic, no corporate speak. You can use "ngl", "fr", "bestie" sparingly`;
}

const FOOD_KEYWORDS = ["biryani", "food", "eat", "restaurant", "zomato", "swiggy", "lunch", "dinner", "breakfast", "snack", "chai", "coffee", "pizza", "burger"];
const SHOP_KEYWORDS = ["buy", "shop", "purchase", "order", "clothes", "shoes", "gadget", "phone", "laptop"];

function smartFallback(
  message: string,
  data: {
    name: string;
    monthlySpend: number;
    monthlyBudget: number;
    budgetPct: number;
    remaining: number;
    savingsGoal: number;
    transactions: Array<{ date: Date; description: string; category: string; amount: number }>;
    goals: Array<{ title: string; savedAmount: number; targetAmount: number }>;
  }
): string {
  const msg = message.toLowerCase();
  const firstName = data.name.split(" ")[0];
  const now = new Date();

  // Check for food-related queries
  const isFood = FOOD_KEYWORDS.some((k) => msg.includes(k));
  const isShopping = SHOP_KEYWORDS.some((k) => msg.includes(k));

  if (isFood || isShopping) {
    const category = isFood ? "Food" : "Shopping";
    const recentSame = data.transactions.filter((t) => {
      const daysAgo = (now.getTime() - new Date(t.date).getTime()) / 86400000;
      return daysAgo <= 3 && t.category.toLowerCase().includes(category.toLowerCase());
    });

    if (recentSame.length > 0) {
      const last = recentSame[0];
      const daysAgo = Math.round((now.getTime() - new Date(last.date).getTime()) / 86400000);
      const dayStr = daysAgo === 0 ? "today already" : daysAgo === 1 ? "just yesterday" : `${daysAgo} days ago`;
      const goalName = data.goals[0]?.title;
      const goalHint = goalName
        ? ` Put ${fmt(last.amount)} toward ${goalName} instead.`
        : "";

      return `${firstName}, you spent ${fmt(last.amount)} on ${last.description} ${dayStr}. Maybe skip this one.${goalHint} You've used ${data.budgetPct.toFixed(0)}% of your monthly budget with ${fmt(data.remaining)} left.`;
    }
  }

  // Budget status query
  if (msg.includes("budget") || msg.includes("spend") || msg.includes("month") || msg.includes("how much")) {
    if (data.budgetPct > 80) {
      return `You've used ${data.budgetPct.toFixed(0)}% of your ${fmt(data.monthlyBudget)} budget — only ${fmt(data.remaining)} left this month. Tread carefully.`;
    }
    return `You've spent ${fmt(data.monthlySpend)} this month, which is ${data.budgetPct.toFixed(0)}% of your budget. ${fmt(data.remaining)} remaining — you're doing okay.`;
  }

  // Savings query
  if (msg.includes("save") || msg.includes("invest") || msg.includes("goal")) {
    const goal = data.goals[0];
    if (goal) {
      const pct = goal.targetAmount > 0 ? ((goal.savedAmount / goal.targetAmount) * 100).toFixed(0) : "0";
      return `For your ${goal.title} goal, you've saved ${fmt(goal.savedAmount)} out of ${fmt(goal.targetAmount)} (${pct}% done). Keep putting ${fmt(data.savingsGoal)}/month and you'll get there.`;
    }
    return `You haven't set a savings goal yet. Head to Goals and add one — it helps a lot to have a target. Consider a NIFTY 50 index SIP too.`;
  }

  // Generic fallback
  const topCategory = data.transactions.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {});
  const top = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    return `This month you've spent the most on ${top[0]} — ${fmt(top[1])}. You've used ${data.budgetPct.toFixed(0)}% of budget with ${fmt(data.remaining)} left.`;
  }

  return `You've spent ${fmt(data.monthlySpend)} this month (${data.budgetPct.toFixed(0)}% of budget). ${fmt(data.remaining)} remaining. Ask me about specific purchases or your savings goals!`;
}

async function callGroq(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  timeoutMs: number
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 150,
        temperature: 0.75,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Groq ${res.status}: ${text.slice(0, 100)}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Empty response from model");
    return reply;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { message, history } = parsed.data;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [user, monthTx, recentTx, goals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: session.userId, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: fourteenDaysAgo } },
      orderBy: { date: "desc" },
      take: 25,
    }),
    prisma.goal.findMany({
      where: { userId: session.userId, achieved: false },
      take: 5,
    }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const monthlySpend = monthTx._sum.amount ?? 0;
  const budget       = user.profile?.monthlyBudget ?? 0;
  const income       = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0;
  const savingsGoal  = user.profile?.savingsGoal ?? 0;
  const budgetPct    = budget > 0 ? (monthlySpend / budget) * 100 : 0;
  const remaining    = budget - monthlySpend;

  const fallbackData = { name: user.name, monthlySpend, monthlyBudget: budget, budgetPct, remaining, savingsGoal, transactions: recentTx, goals };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: smartFallback(message, fallbackData) });
  }

  const systemPrompt = buildSystemPrompt({
    name: user.name,
    userType: user.userType,
    age: user.age,
    monthlyBudget: budget,
    income,
    savingsGoal,
    monthlySpend,
    budgetPct,
    remaining,
    transactions: recentTx,
    goals,
  });

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  // Try each model in sequence with a 10s timeout
  for (const model of MODELS) {
    try {
      const reply = await callGroq(apiKey, model, aiMessages, 10000);
      return NextResponse.json({ reply });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[chat] ${model} failed: ${msg}`);
      // Continue to next model — abort just means this model was slow
    }
  }

  // All AI calls failed — use smart local fallback
  console.log("[chat] All models failed, using local fallback");
  return NextResponse.json({ reply: smartFallback(message, fallbackData) });
}
