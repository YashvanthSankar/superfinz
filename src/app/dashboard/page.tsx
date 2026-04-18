import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { SpendTrendChart, CategoryChart } from "@/components/dashboard/charts";
import { HeatmapInline } from "@/components/dashboard/heatmap-inline";
import { DashboardGrids } from "@/components/dashboard/grid-widgets";
import { FinTip } from "@/components/ui/fin-tip";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.onboarded) redirect("/onboarding");

  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { profile: true } });
  if (!user) redirect("/login");

  const now        = new Date();
  const year       = now.getFullYear();
  const monthIdx   = now.getMonth();

  // Keep strictly to calendar boundaries. Only shift day 1 if user actually joined THIS EXACT month and year.
  // This satisfies "12-18, 19-25, 26-31 for the 1st partial month, then normal form (1-7, etc) for all subsequent months".
  const joinedThisMonth = user.createdAt.getFullYear() === year && user.createdAt.getMonth() === monthIdx;
  const financialMonthStart = new Date(year, monthIdx, joinedThisMonth ? user.createdAt.getDate() : 1);
  financialMonthStart.setHours(0,0,0,0);

  const nextFinancialMonthStart = new Date(year, monthIdx + 1, 1);
  nextFinancialMonthStart.setHours(0,0,0,0);

  const daysInFinancialMonth = Math.round((nextFinancialMonthStart.getTime() - financialMonthStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsedFinancial = Math.floor((now.getTime() - financialMonthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1; // start from day 1

  const weekStart  = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  threeMonthsAgo.setDate(1);
  threeMonthsAgo.setHours(0, 0, 0, 0);

  const holdings = [
    { name: "Reliance Industries", ticker: "RELIANCE.NS", shares: 5, invested: 12500 },
    { name: "Infosys",              ticker: "INFY.NS",     shares: 8, invested: 12800 },
    { name: "HDFC Bank",            ticker: "HDFCBANK.NS", shares: 6, invested: 10800 },
    { name: "Tata Motors",          ticker: "TATAMOTORS.NS", shares: 10, invested: 9200 },
  ];

  const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${holdings.map((h) => h.ticker).join(",")}`;

  const [monthTx, goalsAll, heatTx, weekTx, quotePayload, categoryBudgets] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: financialMonthStart } },
      orderBy: { date: "asc" },
    }),
    prisma.goal.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } }),
    prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: threeMonthsAgo } },
      select: { amount: true, date: true },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: weekStart } },
      orderBy: { date: "asc" },
    }),
    fetch(quoteUrl, { next: { revalidate: 900 } }).then((r) => r.json()).catch(() => null),
    prisma.budget.findMany({
      where: { userId: session.userId, month: now.getMonth() + 1, year: now.getFullYear() },
    }),
  ]);

  // ── Monthly stats ──────────────────────────────────────────────────
  const monthlySpend = monthTx.reduce((s, t) => s + t.amount, 0);
  const budget       = user.profile?.monthlyBudget ?? 0;
  const income       = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0;
  const goalAmt      = user.profile?.savingsGoal ?? 0;
  const remaining    = budget - monthlySpend;
  const savingsRate  = income > 0 ? Math.max(0, ((income - monthlySpend) / income) * 100) : 0;
  const budgetPct    = budget > 0 ? Math.min((monthlySpend / budget) * 100, 100) : 0;
  const recentTx     = [...monthTx].reverse().slice(0, 5);

  const daysElapsed  = daysElapsedFinancial;
  const daysInMonth  = daysInFinancialMonth;
  const dailyBudget  = budget > 0 ? budget / daysInMonth : 0;

  // New AI Allocation based on spending pattern
  // Weeks defined strictly as: W1(1-7), W2(8-14), W3(15-21), W4(22-28), W5(29-end)
  const rawPattern = user.profile?.spendingPattern ?? "BALANCED";
  let wWeights = [1, 1, 1, 1, 1];
  if (rawPattern === "FRONT_HEAVY") wWeights = [1.5, 1.2, 1.0, 0.8, 0.5];
  if (rawPattern === "CONSERVATIVE") wWeights = [0.5, 0.8, 1.0, 1.2, 1.5];

  // Adjust W5 weight based on remaining actual days (e.g., Feb 28 has W5 = 0 weight)
  const w5Days = Math.max(0, daysInMonth - 28);
  wWeights[4] = wWeights[4] * (w5Days / 7);

  const totalWeight = wWeights.reduce((a, b) => a + b, 0);
  const weekBudgets = totalWeight > 0 ? wWeights.map(w => (w / totalWeight) * budget) : [0,0,0,0,0];

  // Current strict week index (0 to 4)
  const currentWeekIndex = Math.min(4, Math.floor((daysElapsed - 1) / 7));
  const weeklyBudget = weekBudgets[currentWeekIndex] || 0;

  // Completed strict weeks so far this month
  const completedWeeks = Math.floor(daysElapsed / 7);
  let accruedBudgetThisMonth = 0;
  let completedWeeksSpend = 0;
  let lastCompletedWeekBudget = 0;
  let lastCompletedWeekSpend = 0;

  for (let i = 0; i < completedWeeks; i++) {
    const wb = weekBudgets[i] || 0;
    accruedBudgetThisMonth += wb;

    const strictWeekSpend = monthTx.filter(tx => {
      const txDaysFromStart = Math.floor((new Date(tx.date).getTime() - financialMonthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return txDaysFromStart > i * 7 && txDaysFromStart <= (i + 1) * 7;
    }).reduce((s, t) => s + t.amount, 0);
    completedWeeksSpend += strictWeekSpend;

    if (i === completedWeeks - 1) { // keep track of the most recently finished week
      lastCompletedWeekBudget = wb;
      lastCompletedWeekSpend = strictWeekSpend;
    }
  }

  const currentWeekStartDay = currentWeekIndex * 7 + 1;
  const weeklySpend = monthTx
    .filter(tx => {
      const txDaysFromStart = Math.floor((new Date(tx.date).getTime() - financialMonthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return txDaysFromStart >= currentWeekStartDay && txDaysFromStart <= daysElapsed;
    })
    .reduce((s, t) => s + t.amount, 0);

  const dailyAvg     = daysElapsed > 0 ? monthlySpend / daysElapsed : 0;
  const projectedSpend = dailyAvg * daysInMonth;

  const buildSeries = (start: Date, days: number, txs: typeof monthTx) => {
    const map: Record<string, number> = {};
    for (const tx of txs) {
      const key = new Date(tx.date).toISOString().slice(0, 10);
      map[key] = (map[key] ?? 0) + tx.amount;
    }
    const series: { label: string; amount: number; date: string }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      series.push({
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: days > 10 ? "short" : undefined, weekday: days === 7 ? "short" : undefined }),
        amount: map[key] ?? 0,
        date: key,
      });
    }
    return series;
  };

  const weekSeries = buildSeries(weekStart, 7, weekTx);
  const monthSeries = buildSeries(financialMonthStart, daysElapsed, monthTx);

  // Trend chart data
  const dailyMap: Record<number, number> = {};
  for (const tx of monthTx) {
    const txDayOfFinancialMonth = Math.floor((new Date(tx.date).getTime() - financialMonthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    dailyMap[txDayOfFinancialMonth] = (dailyMap[txDayOfFinancialMonth] ?? 0) + tx.amount;
  }
  let cumulative = 0;
  const trendData = Array.from({ length: daysElapsed }, (_, i) => {
    const day = i + 1;
    cumulative += dailyMap[day] ?? 0;
    return { day, cumulative: Math.round(cumulative), pace: Math.round(dailyBudget * day) };
  });

  // Category chart data
  const catMap: Record<string, number> = {};
  for (const tx of monthTx) catMap[tx.category] = (catMap[tx.category] ?? 0) + tx.amount;
  const categoryData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value: Math.round(value) }));
  const topCategory = categoryData[0];

  // Heatmap data
  const heatMap: Record<string, { total: number; count: number }> = {};
  for (const tx of heatTx) {
    const key = tx.date.toISOString().slice(0, 10);
    if (!heatMap[key]) heatMap[key] = { total: 0, count: 0 };
    heatMap[key].total += tx.amount;
    heatMap[key].count += 1;
  }
  const heatData = Object.entries(heatMap).map(([date, v]) => ({ date, ...v }));

  const autoSaveMonth   = budget > 0 ? Math.max(0, accruedBudgetThisMonth - completedWeeksSpend) : 0;
  const autoSaveWeek    = lastCompletedWeekBudget > 0 ? Math.max(0, lastCompletedWeekBudget - lastCompletedWeekSpend) : 0;
  const shortfallMonth  = budget > 0 ? Math.max(0, monthlySpend - budget) : 0;
  const shortfallWeek   = weeklyBudget > 0 ? Math.max(0, weeklySpend - weeklyBudget) : 0;
  const totalSaved      = goalsAll.reduce((s, g) => s + g.savedAmount, 0);

  // Budget alerts: categories at or over 90% of their limit
  const budgetAlerts = categoryBudgets
    .filter((b) => b.limit > 0 && b.spent >= b.limit * 0.9)
    .map((b) => ({
      category: b.category,
      spent: b.spent,
      limit: b.limit,
      over: b.spent > b.limit,
      pct: Math.round((b.spent / b.limit) * 100),
    }));

  const quoteResults: Record<string, { price: number; changePct: number }> = {};
  try {
    const parsed = quotePayload?.quoteResponse?.result ?? [];
    for (const q of parsed) {
      quoteResults[q.symbol] = {
        price: q.regularMarketPrice ?? q.ask ?? 0,
        changePct: q.regularMarketChangePercent ?? 0,
      };
    }
  } catch {
    // ignore quote errors
  }

  const investments = holdings.map((h) => {
    const quote = quoteResults[h.ticker];
    const price = quote?.price ?? (h.invested / Math.max(h.shares, 1));
    const current = price * h.shares;
    const gainLossPct = h.invested > 0 ? ((current - h.invested) / h.invested) * 100 : 0;
    return {
      name: h.name,
      ticker: h.ticker,
      shares: h.shares,
      invested: h.invested,
      current,
      changePct: quote?.changePct ?? gainLossPct,
    };
  });

  const activeGoals = goalsAll.filter((g) => !g.achieved);
  const goals = activeGoals.slice(0, 3);

  const onPace  = budget > 0 && monthlySpend <= dailyBudget * daysElapsed;
  const noSpends = monthTx.length === 0;
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  // ── Retirement Readiness Score ─────────────────────────────────────
  const age          = user.age ?? 21;
  const targetRetire = 45;
  const yearsLeft    = Math.max(targetRetire - age, 1);
  const fireCorpus   = (budget > 0 ? budget : income) * 12 * 25; // 4% rule
  const monthlySip   = goalAmt > 0 ? goalAmt : Math.max(income - monthlySpend, 0);
  const sipR         = 0.12 / 12;
  const sipN         = yearsLeft * 12;
  const projCorpus   = monthlySip > 0
    ? monthlySip * ((Math.pow(1 + sipR, sipN) - 1) / sipR)
    : 0;
  const corpusGapPct  = fireCorpus > 0 ? Math.min((projCorpus / fireCorpus) * 100, 100) : 0;
  const investPct     = income > 0 ? Math.min((monthlySip / income) * 100, 100) : 0;
  const retirementScore = Math.round(corpusGapPct * 0.5 + Math.min(investPct * 3, 100) * 0.3 + Math.min(investPct * 5, 100) * 0.2);
  const scoreLabel    = retirementScore >= 70 ? "On Track" : retirementScore >= 40 ? "Needs Work" : "At Risk";
  const scoreColor    = retirementScore >= 70 ? "#16a34a" : retirementScore >= 40 ? "#d97706" : "#dc2626";
  const unnecessarySpend = monthTx.filter(t => t.isNecessary === false).reduce((s, t) => s + t.amount, 0);
  const fireDelayMonths  = monthlySip > 0 ? Math.round(unnecessarySpend / monthlySip) : 0;
  const fmtCrore = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : `₹${(n / 100000).toFixed(0)}L`;

  const scoreTone: "good" | "warn" | "bad" =
    retirementScore >= 70 ? "good" : retirementScore >= 40 ? "warn" : "bad";
  const scoreBgVar =
    scoreTone === "good" ? "var(--good)" : scoreTone === "warn" ? "var(--warn)" : "var(--bad)";
  void scoreColor;

  return (
    <div className="space-y-6">
      {/* ── Greeting ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="brut-label mb-1">{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="brut-display text-4xl sm:text-5xl text-ink">
            {greeting},<br />
            <span className="text-accent">{user.name.split(" ")[0]}.</span>
          </h1>
        </div>
        {!noSpends && budget > 0 && (
          <Badge variant={onPace ? "good" : "bad"} className="text-xs px-3 py-1">
            {onPace ? "On pace" : "Over pace"}
          </Badge>
        )}
      </div>

      {/* ── Budget alert banner ──────────────────────────────────── */}
      {budgetAlerts.length > 0 && (() => {
        const over = budgetAlerts.some((a) => a.over);
        return (
          <div className={`brut-card p-4 flex items-start gap-3 ${over ? "bg-bad-soft" : "bg-warn-soft"}`}>
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-ink" strokeWidth={2.5} />
            <div className="flex-1 min-w-0">
              <p className="brut-label text-ink">{over ? "Budget exceeded" : "Approaching limit"}</p>
              <p className="text-xs text-ink-soft mt-0.5 font-medium">
                {budgetAlerts.map((a) => `${a.category} ${a.pct}%${a.over ? " over" : ""}`).join(" · ")}
              </p>
            </div>
            <Link href="/dashboard/budgets" className="brut-btn bg-ink text-paper text-[11px] h-8 px-3 shrink-0">
              Review →
            </Link>
          </div>
        );
      })()}

      {/* ── Retirement Readiness Banner ──────────────────────────── */}
      <div className="brut-card p-5 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-4 shrink-0">
          <div
            className="relative w-20 h-20 shrink-0 border-2 border-ink flex items-center justify-center"
            style={{ background: scoreBgVar }}
          >
            <span className="brut-display text-3xl text-paper tabular">{retirementScore}</span>
          </div>
          <div>
            <p className="brut-label">Retirement readiness</p>
            <p className="text-2xl brut-display text-ink mt-1">{scoreLabel}</p>
            <p className="text-xs text-ink-soft font-semibold mt-0.5">Target: retire at {targetRetire}</p>
          </div>
        </div>

        <div className="hidden sm:block w-[2px] self-stretch bg-ink" />

        <div className="grid grid-cols-3 gap-2 flex-1">
          {[
            { label: <FinTip term="SIP">Invest %</FinTip>, value: `${investPct.toFixed(0)}%`, sub: "of income" },
            { label: <FinTip term="corpus">Corpus gap</FinTip>, value: fmtCrore(Math.max(fireCorpus - projCorpus, 0)), sub: `by ${targetRetire}` },
            {
              label: <FinTip term="FIRE">FIRE delay</FinTip>,
              value: fireDelayMonths > 0 ? `+${fireDelayMonths}mo` : "None",
              sub: "wasted spends",
              tone: fireDelayMonths > 0 ? "text-bad" : "text-good",
            },
          ].map((d, i) => (
            <div key={i} className="border-2 border-ink bg-paper-2 p-3">
              <p className="brut-label text-[9px]">{d.label}</p>
              <p className={`brut-display text-xl mt-1 tabular ${d.tone ?? "text-ink"}`}>{d.value}</p>
              <p className="text-[10px] text-mute font-semibold mt-0.5">{d.sub}</p>
            </div>
          ))}
        </div>

        <Link href="/dashboard/retirement" className="brut-btn bg-accent text-paper text-xs shrink-0 self-stretch sm:self-center uppercase">
          Full plan →
        </Link>
      </div>

      {/* ── Grid widgets ─────────────────────────────────────── */}
      <DashboardGrids
        spend={{
          weekTotal: weeklySpend,
          monthTotal: monthlySpend,
          weekBudget: weeklyBudget,
          monthBudget: budget,
          weekData: weekSeries,
          monthData: monthSeries,
        }}
        savings={{
          autoSaveWeek,
          autoSaveMonth,
          budgetWeek: weeklyBudget,
          budgetMonth: budget,
          shortfallWeek,
          shortfallMonth,
          savingsRate,
          totalSaved,
          goalTarget: goalAmt,
        }}
      />

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            {
              label: "Spent",
              value: formatCurrency(monthlySpend),
              sub: budget > 0 ? `${budgetPct.toFixed(0)}% of ${formatCurrency(budget)}` : "no budget set",
              showBar: budget > 0,
              tone: "text-ink",
            },
            {
              label: "Remaining",
              value: formatCurrency(Math.abs(remaining)),
              sub: remaining < 0 ? "over budget" : budget > 0 ? "left this month" : "no budget set",
              showBar: false,
              tone: remaining < 0 ? "text-bad" : "text-ink",
            },
            {
              label: "Savings rate",
              value: `${savingsRate.toFixed(0)}%`,
              sub: goalAmt > 0 ? `target ${formatCurrency(goalAmt)}/mo` : "set a savings goal",
              showBar: false,
              tone: "text-ink",
            },
            {
              label: "Transactions",
              value: monthTx.length.toString(),
              sub: dailyAvg > 0 ? `${formatCurrency(dailyAvg)}/day avg` : "this month",
              showBar: false,
              tone: "text-ink",
            },
          ] as Array<{ label: string; value: string; sub: string; showBar: boolean; tone: string }>
        ).map((s) => (
          <div key={s.label} className="brut-card p-4">
            <p className="brut-label">{s.label}</p>
            <p className={`brut-display text-3xl mt-2 tabular ${s.tone}`}>{s.value}</p>
            <p className="text-[11px] text-mute font-semibold mt-1">{s.sub}</p>
            {s.showBar && (
              <div className="mt-3 h-2 bg-paper-2 border-2 border-ink overflow-hidden">
                <div
                  className={`h-full transition-all ${budgetPct > 90 ? "bg-bad" : budgetPct > 70 ? "bg-warn" : "bg-good"}`}
                  style={{ width: `${Math.min(budgetPct, 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Insight strip ────────────────────────────────────────── */}
      {!noSpends && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Daily average", value: formatCurrency(dailyAvg) },
            {
              label: "Month projection",
              value: formatCurrency(projectedSpend),
              tone: projectedSpend > budget && budget > 0 ? "text-bad" : "text-ink",
            },
            topCategory
              ? { label: "Top category", value: `${topCategory.name} · ${formatCurrency(topCategory.value)}` }
              : null,
          ]
            .filter((x): x is { label: string; value: string; tone?: string } => x !== null)
            .map((x) => (
              <div key={x.label} className="brut-card brut-card-sm p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-ink" />
                <div className="min-w-0">
                  <p className="brut-label text-[9px]">{x.label}</p>
                  <p className={`text-sm font-bold tabular truncate ${x.tone ?? "text-ink"}`}>{x.value}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Spending trend + Category ─────────────────────────── */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-3 brut-card p-5">
          <div className="flex items-center justify-between mb-4 border-b-2 border-ink pb-3">
            <div>
              <p className="brut-label">Spending trend</p>
              <p className="text-xs text-ink-soft font-medium mt-0.5">Cumulative vs pace</p>
            </div>
            {budget > 0 && <Badge variant="ink">{budgetPct.toFixed(0)}% used</Badge>}
          </div>
          {noSpends ? (
            <div className="flex flex-col items-center justify-center h-[210px] text-mute text-sm font-semibold">
              Log a spend to see your trend
            </div>
          ) : (
            <SpendTrendChart data={trendData} />
          )}
        </div>
        <div className="md:col-span-2 brut-card p-5">
          <div className="mb-4 border-b-2 border-ink pb-3">
            <p className="brut-label">By category</p>
            <p className="text-xs text-ink-soft font-medium mt-0.5">Where your money goes</p>
          </div>
          <CategoryChart data={categoryData} />
        </div>
      </div>

      {/* ── Spending heatmap ─────────────────────────────────── */}
      <div className="brut-card p-5">
        <div className="flex items-center justify-between mb-4 border-b-2 border-ink pb-3">
          <div>
            <p className="brut-label">Spending heatmap</p>
            <p className="text-xs text-ink-soft font-medium mt-0.5">Last 3 months — darker = more spent</p>
          </div>
          <Link href="/dashboard/heatmap" className="text-xs font-black uppercase tracking-wider text-ink hover:text-accent">
            View full →
          </Link>
        </div>
        {heatData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 border-2 border-ink bg-accent-soft flex items-center justify-center mb-3" />
            <p className="text-sm font-black text-ink uppercase tracking-wide">No spend data</p>
            <p className="text-xs text-ink-soft font-medium mt-1">Log a few transactions to see your heatmap</p>
            <Link href="/dashboard/transactions" className="brut-btn bg-accent text-paper text-xs mt-4">
              + Log a spend
            </Link>
          </div>
        ) : (
          <HeatmapInline data={heatData} />
        )}
      </div>

      {/* ── Portfolio tracker ────────────────────────────────── */}
      <div className="brut-card p-5">
        <div className="flex items-center justify-between mb-4 border-b-2 border-ink pb-3">
          <div>
            <p className="brut-label">Portfolio snapshot</p>
            <p className="text-xs text-ink-soft font-medium mt-0.5">Live quotes · refreshes every 15 min</p>
          </div>
          <Link href="/dashboard/calculators" className="text-xs font-black uppercase tracking-wider text-ink hover:text-accent">
            SIP calculator →
          </Link>
        </div>
        <div className="space-y-2">
          {investments.map((inv) => {
            const gain = inv.current - inv.invested;
            const up = gain >= 0;
            return (
              <div key={inv.ticker} className="flex items-center gap-3 p-2.5 border-2 border-ink bg-paper">
                <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black tracking-wider">{inv.ticker.replace(".NS", "").slice(0, 4)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-ink truncate">{inv.name}</p>
                  <p className="text-xs text-ink-soft font-semibold tabular">
                    {inv.shares} shares · invested {formatCurrency(inv.invested)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-ink tabular">{formatCurrency(inv.current)}</p>
                  <p className={`text-xs font-black tabular ${up ? "text-good" : "text-bad"}`}>
                    {up ? "+" : ""}{inv.changePct.toFixed(2)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t-2 border-ink flex items-center justify-between">
          <span className="brut-label">Total invested</span>
          <div className="text-right">
            <span className="text-base font-black text-ink tabular">
              {formatCurrency(investments.reduce((s, i) => s + i.current, 0))}
            </span>
            {(() => {
              const totalInv = investments.reduce((s, i) => s + i.invested, 0);
              const totalCur = investments.reduce((s, i) => s + i.current, 0);
              const totalGain = totalCur - totalInv;
              const up = totalGain >= 0;
              return (
                <p className={`text-xs font-black tabular ${up ? "text-good" : "text-bad"}`}>
                  {up ? "+" : ""}{formatCurrency(totalGain)} overall
                </p>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Recent spends + Goals ─────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="brut-card p-5">
          <div className="flex items-center justify-between mb-4 border-b-2 border-ink pb-3">
            <p className="brut-label">Recent spends</p>
            <Link href="/dashboard/transactions" className="text-xs font-black uppercase tracking-wider text-ink hover:text-accent">
              View all →
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-mute text-sm font-semibold">No transactions yet</p>
              <Link href="/dashboard/transactions" className="text-accent text-xs font-black uppercase mt-2 inline-block hover:underline">
                Add your first spend →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 border-2 border-ink bg-paper">
                  <div className="w-9 h-9 bg-ink text-paper flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black tracking-wider uppercase">{tx.category.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink font-bold truncate">{tx.description}</p>
                    <p className="text-xs text-ink-soft font-semibold">
                      {tx.category} · {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                    <p className="text-sm font-black text-ink tabular">{formatCurrency(tx.amount)}</p>
                    {tx.isNecessary === false && <Badge variant="bad" className="text-[9px]">skip</Badge>}
                    {tx.isNecessary === true && <Badge variant="good" className="text-[9px]">ok</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="brut-card p-5">
          <div className="flex items-center justify-between mb-4 border-b-2 border-ink pb-3">
            <p className="brut-label">Savings goals</p>
            <Link href="/dashboard/goals" className="text-xs font-black uppercase tracking-wider text-ink hover:text-accent">
              Manage →
            </Link>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-mute text-sm font-semibold">No goals yet</p>
              <Link href="/dashboard/goals" className="text-accent text-xs font-black uppercase mt-2 inline-block hover:underline">
                Set a goal →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => {
                const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal.id} className="p-3 border-2 border-ink bg-paper-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-ink font-black">{goal.title}</span>
                      <Badge variant={pct >= 100 ? "good" : "accent"}>{pct.toFixed(0)}%</Badge>
                    </div>
                    <div className="h-2 bg-paper border-2 border-ink overflow-hidden">
                      <div
                        className={`h-full ${pct >= 100 ? "bg-good" : "bg-accent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-ink-soft mt-1.5 font-bold tabular">
                      <span>{formatCurrency(goal.savedAmount)} saved</span>
                      <span>{formatCurrency(goal.targetAmount)} target</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
