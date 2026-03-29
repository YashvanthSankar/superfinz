import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { SpendTrendChart, CategoryChart } from "@/components/dashboard/charts";
import { HeatmapInline } from "@/components/dashboard/heatmap-inline";
import { DashboardGrids } from "@/components/dashboard/grid-widgets";
import { FinTip } from "@/components/ui/fin-tip";
import { SmartSplitModal } from "@/components/dashboard/smart-split-modal";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.onboarded) redirect("/onboarding");

  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { profile: true } });
  if (!user) redirect("/login");

  const now        = new Date();
  const year       = now.getFullYear();
  const monthDay   = now.getDate();
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

  const newsUrl = new URL("/api/news", process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${holdings.map((h) => h.ticker).join(",")}`;

  const [monthTx, goalsAll, heatTx, weekTx, newsPayload, quotePayload] = await Promise.all([
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
    fetch(newsUrl.toString(), { cache: "no-store" }).then((r) => r.json()).catch(() => ({ articles: [] })),
    fetch(quoteUrl, { next: { revalidate: 900 } }).then((r) => r.json()).catch(() => null),
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
  const rawPattern = (user.profile as any)?.spendingPattern || "BALANCED";
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

  const milestoneMap = new Map<string, string>();
  for (const g of goalsAll) {
    if (g.deadline) {
      const key = g.deadline.toISOString().slice(0, 10);
      milestoneMap.set(key, g.title);
    }
  }
  const calendarData = heatData.map((d) => ({ ...d, milestone: milestoneMap.get(d.date) ?? null }));

  // Add to "saved" only once the week gets over. 
  // Cumulative completed weeks savings for the month:
  const autoSaveMonth   = budget > 0 ? Math.max(0, accruedBudgetThisMonth - completedWeeksSpend) : 0;
  
  // Weekly auto-save strictly shows the savings of the LAST completed week
  // If no week has been completed yet this month, it stays 0.
  const autoSaveWeek    = lastCompletedWeekBudget > 0 ? Math.max(0, lastCompletedWeekBudget - lastCompletedWeekSpend) : 0;
  
  const shortfallMonth  = budget > 0 ? Math.max(0, monthlySpend - budget) : 0;
  const shortfallWeek   = weeklyBudget > 0 ? Math.max(0, weeklySpend - weeklyBudget) : 0;
  const totalSaved      = goalsAll.reduce((s, g) => s + g.savedAmount, 0);

  const newsItems = (newsPayload?.articles ?? []).map((a: any) => ({
    title: a.title,
    url: a.url ?? a.link ?? "#",
    source: a.source?.name ?? "News",
    publishedAt: a.publishedAt ?? new Date().toISOString(),
    category: a.category ?? "Markets",
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

  const unallocated = remaining;

  return (
      <div className="space-y-5">
        <SmartSplitModal unallocated={unallocated > 0 ? unallocated : 0} goals={activeGoals} />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {greeting}, {user.name.split(" ")[0]}
          </h1>
          <p className="text-accent text-sm mt-0.5 font-light">
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {!noSpends && budget > 0 && (
          <div className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
            onPace
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`}>
            {onPace ? "On budget pace" : "Over pace"}
          </div>
        )}
      </div>

      {/* ── Retirement Readiness Banner ──────────────────────────── */}
      <div className="bg-text rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Score ring */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--text2)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
                strokeDasharray={`${retirementScore} 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-background">{retirementScore}</span>
          </div>
          <div>
            <p className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">Retirement Readiness</p>
            <p className="text-lg font-black text-background leading-tight" style={{ color: scoreColor }}>{scoreLabel}</p>
            <p className="text-xs text-amber-300/80 font-light">Target: retire at {targetRetire}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px self-stretch bg-amber-700/40" />

        {/* 3 drivers */}
        <div className="grid grid-cols-3 gap-3 flex-1 text-center">
          <div>
            <p className="text-[10px] text-amber-400 uppercase tracking-wide font-semibold"><FinTip term="SIP">Invest %</FinTip></p>
            <p className="text-base font-black text-background mt-0.5">{investPct.toFixed(0)}%</p>
            <p className="text-[10px] text-amber-400/70">of income</p>
          </div>
          <div>
            <p className="text-[10px] text-amber-400 uppercase tracking-wide font-semibold"><FinTip term="corpus">Corpus gap</FinTip></p>
            <p className="text-base font-black text-background mt-0.5">{fmtCrore(Math.max(fireCorpus - projCorpus, 0))}</p>
            <p className="text-[10px] text-amber-400/70">needed by {targetRetire}</p>
          </div>
          <div>
            <p className="text-[10px] text-amber-400 uppercase tracking-wide font-semibold"><FinTip term="FIRE">FIRE delay</FinTip></p>
            <p className={`text-base font-black mt-0.5 ${fireDelayMonths > 0 ? "text-red-300" : "text-emerald-300"}`}>
              {fireDelayMonths > 0 ? `+${fireDelayMonths}mo` : "None"}
            </p>
            <p className="text-[10px] text-amber-400/70">from unnecessary spends</p>
          </div>
        </div>

        <a href="/dashboard/retirement" className="shrink-0 text-xs px-4 py-2 rounded-xl bg-amber-500 text-text font-bold hover:bg-amber-400 transition-all text-center">
          Full plan →
        </a>
      </div>

      {/* New grid widgets */}
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
        plans={activeGoals}
        calendar={calendarData}
        investments={investments}
        news={newsItems}
      />

      {/* ── Stat cards — uniform amber ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          {
            label: "Spent this month",
            value: formatCurrency(monthlySpend),
            valueColor: "text-text",
            sub: budget > 0 ? `${budgetPct.toFixed(0)}% of ${formatCurrency(budget)}` : "no budget set",
            showBar: budget > 0,
            iconD: "M12 6v12m-4-6h8",
          },
          {
            label: "Remaining",
            value: formatCurrency(Math.abs(remaining)),
            valueColor: remaining < 0 ? "text-red-500" : "text-text",
            sub: remaining < 0 ? "over budget" : budget > 0 ? "left this month" : "no budget set",
            showBar: false,
            iconD: "M5 13l4 4L19 7",
          },
          {
            label: "Savings rate",
            value: `${savingsRate.toFixed(0)}%`,
            valueColor: "text-text",
            sub: goalAmt > 0 ? `target ${formatCurrency(goalAmt)}/mo` : "set a savings goal",
            showBar: false,
            iconD: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
          },
          {
            label: "Transactions",
            value: monthTx.length.toString(),
            valueColor: "text-text",
            sub: dailyAvg > 0 ? `${formatCurrency(dailyAvg)}/day avg` : "this month",
            showBar: false,
            iconD: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
          },
        ] as const).map((s) => (
          <div key={s.label} className="bg-surface rounded-2xl border border-amber-400 p-5 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-background border border-amber-300 flex items-center justify-center mb-3">
              <svg className="w-3.5 h-3.5 text-text2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.iconD} />
              </svg>
            </div>
            <p className="text-[10px] text-text2 font-semibold uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.valueColor}`}>{s.value}</p>
            <p className="text-xs text-accent mt-0.5 font-light">{s.sub}</p>
            {s.showBar && (
              <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetPct > 90 ? "bg-red-400" : budgetPct > 70 ? "bg-amber-600" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(budgetPct, 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Insight strip ────────────────────────────────────────── */}
      {!noSpends && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-background rounded-xl border border-amber-400 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[10px] text-accent font-semibold uppercase tracking-wide">Daily average</p>
              <p className="text-sm font-bold text-text">{formatCurrency(dailyAvg)}</p>
            </div>
          </div>
          <div className="bg-background rounded-xl border border-amber-400 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
              <p className="text-[10px] text-accent font-semibold uppercase tracking-wide">Month projection</p>
              <p className={`text-sm font-bold ${projectedSpend > budget && budget > 0 ? "text-red-500" : "text-text"}`}>
                {formatCurrency(projectedSpend)}
              </p>
            </div>
          </div>
          {topCategory && (
            <div className="bg-background rounded-xl border border-amber-400 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-amber-700 uppercase">{topCategory.name.slice(0, 2)}</span>
              </div>
              <div>
                <p className="text-[10px] text-accent font-semibold uppercase tracking-wide">Top category</p>
                <p className="text-sm font-bold text-text">{topCategory.name} · {formatCurrency(topCategory.value)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Spending trend + Category ─────────────────────────── */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-3 bg-background rounded-2xl border border-amber-400 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-text">Spending trend</h2>
              <p className="text-xs text-accent font-light mt-0.5">Cumulative vs budget pace (dashed)</p>
            </div>
            {budget > 0 && (
              <span className="text-xs text-accent bg-surface px-2 py-1 rounded-lg font-medium">{budgetPct.toFixed(0)}% used</span>
            )}
          </div>
          {noSpends ? (
            <div className="flex flex-col items-center justify-center h-[210px]">
              <p className="text-accent text-sm font-light">Log a spend to see your trend</p>
            </div>
          ) : (
            <SpendTrendChart data={trendData} />
          )}
        </div>
        <div className="md:col-span-2 bg-background rounded-2xl border border-amber-400 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text mb-0.5">By category</h2>
          <p className="text-xs text-accent font-light mb-1">Where your money goes</p>
          <CategoryChart data={categoryData} />
        </div>
      </div>

      {/* ── Spending heatmap ─────────────────────────────────── */}
      <div className="bg-background rounded-2xl border border-amber-400 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text">Spending heatmap</h2>
            <p className="text-xs text-accent font-light mt-0.5">Last 3 months — darker = more spent</p>
          </div>
          <a href="/dashboard/heatmap" className="text-xs text-amber-600 hover:underline font-medium shrink-0">View full →</a>
        </div>
        {heatData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            </div>
            <p className="text-sm font-medium text-text">No spend data yet</p>
            <p className="text-xs text-accent font-light mt-1">Log a few transactions to see your heatmap</p>
            <a href="/dashboard/transactions" className="mt-3 text-xs px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-400 transition-all">+ Log a spend</a>
          </div>
        ) : (
          <HeatmapInline data={heatData} />
        )}
      </div>

      {/* ── Recent spends + Goals ─────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">

        <div className="bg-background rounded-2xl border border-amber-400 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text">Recent spends</h2>
            <a href="/dashboard/transactions" className="text-xs text-amber-600 hover:underline font-medium">View all</a>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted text-sm">No transactions yet</p>
              <a href="/dashboard/transactions" className="text-amber-600 text-xs hover:underline mt-1 inline-block font-medium">Add your first spend</a>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">{tx.category.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-accent font-light">
                      {tx.category} · {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-text">{formatCurrency(tx.amount)}</p>
                    {tx.isNecessary === false && <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-md">skip</span>}
                    {tx.isNecessary === true  && <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">ok</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-background rounded-2xl border border-amber-400 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text">Savings goals</h2>
            <a href="/dashboard/goals" className="text-xs text-amber-600 hover:underline font-medium">Manage</a>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted text-sm">No goals yet</p>
              <a href="/dashboard/goals" className="text-amber-600 text-xs hover:underline mt-1 inline-block font-medium">Set a goal</a>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal.id} className="p-3 rounded-xl bg-surface border border-amber-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-text font-semibold">{goal.title}</span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-accent mt-1.5 font-light">
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
