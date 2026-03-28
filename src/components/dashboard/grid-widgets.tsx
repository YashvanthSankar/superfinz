"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";

// Types for incoming data
export type SpendPoint = { label: string; amount: number; date: string };
export type SpendProps = {
  weekTotal: number;
  monthTotal: number;
  weekBudget: number;
  monthBudget: number;
  weekData: SpendPoint[];
  monthData: SpendPoint[];
};

export type SavingsProps = {
  autoSaveWeek: number;
  autoSaveMonth: number;
  budgetWeek: number;
  budgetMonth: number;
  shortfallWeek: number;
  shortfallMonth: number;
  savingsRate: number;
  totalSaved: number;
  goalTarget: number;
};

export type PlanCard = {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string | null;
};

export type CalendarDay = { date: string; total: number; count: number; milestone?: string | null };

export type InvestmentCard = {
  name: string;
  ticker: string;
  shares: number;
  invested: number;
  current: number;
  changePct: number;
};

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  category?: string;
};

export type DashboardGridProps = {
  spend: SpendProps;
  savings: SavingsProps;
  plans: PlanCard[];
  calendar: CalendarDay[];
  investments: InvestmentCard[];
  news: NewsItem[];
};

const CALENDAR_COLORS = [
  "bg-slate-900 border-slate-800",
  "bg-emerald-950 border-emerald-900",
  "bg-emerald-900 border-emerald-800",
  "bg-amber-900 border-amber-800",
  "bg-red-900 border-red-800",
];

function colorForSpend(amount: number, max: number) {
  if (max === 0 || amount === 0) return CALENDAR_COLORS[0];
  const bucket = Math.min(4, Math.ceil((amount / max) * 4));
  return CALENDAR_COLORS[bucket];
}

export function DashboardGrids({ spend, savings, plans, calendar, investments, news }: DashboardGridProps) {
  const router = useRouter();
  const [spendRange, setSpendRange] = useState<"week" | "month">("week");
  const [savingsRange, setSavingsRange] = useState<"week" | "month">("month");
  const [planIndex, setPlanIndex] = useState(0);
  const [investIndex, setInvestIndex] = useState(0);
  const [newsFilter, setNewsFilter] = useState<string>("All");
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const spendSeries = spendRange === "week" ? spend.weekData : spend.monthData;
  const spendTotal = spendRange === "week" ? spend.weekTotal : spend.monthTotal;
  const spendBudget = spendRange === "week" ? spend.weekBudget : spend.monthBudget;
  const spendUnder = spendBudget === 0 ? true : spendTotal <= spendBudget;

  const savingsAuto   = savingsRange === "week" ? savings.autoSaveWeek : savings.autoSaveMonth;
  const shortfall     = savingsRange === "week" ? savings.shortfallWeek : savings.shortfallMonth;
  const savingsTarget = savings.goalTarget;
  const savingsPct    = savingsTarget > 0 ? Math.min((savingsAuto / savingsTarget) * 100, 150) : 0;

  const monthGrid = useMemo(() => {
    if (!calendar.length) return [] as CalendarDay[][];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const start = new Date(year, month, 1);
    const startPad = start.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const map: Record<string, CalendarDay> = {};
    for (const d of calendar) map[d.date] = d;
    const grid: CalendarDay[][] = [];
    let week: CalendarDay[] = [];
    for (let i = 0; i < startPad; i++) week.push({ date: "", total: 0, count: 0 });
    for (let day = 1; day <= daysInMonth; day++) {
      const key = new Date(year, month, day).toISOString().slice(0, 10);
      week.push(map[key] ?? { date: key, total: 0, count: 0 });
      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push({ date: "", total: 0, count: 0 });
      grid.push(week);
    }
    return grid;
  }, [calendar]);

  const maxCalendarSpend = useMemo(() => (calendar.length ? Math.max(...calendar.map((d) => d.total), 0) : 0), [calendar]);

  useEffect(() => {
    const id = setInterval(() => setPlanIndex((i) => (plans.length ? (i + 1) % Math.ceil(plans.length) : 0)), 7000);
    return () => clearInterval(id);
  }, [plans.length]);

  useEffect(() => {
    const id = setInterval(() => setInvestIndex((i) => (investments.length ? (i + 1) % investments.length : 0)), 7000);
    return () => clearInterval(id);
  }, [investments.length]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [router]);

  const filteredNews = useMemo(() => {
    if (newsFilter === "All") return news.slice(0, 6);
    return news.filter((n) => (n.category ?? "").toLowerCase().includes(newsFilter.toLowerCase())).slice(0, 6);
  }, [news, newsFilter]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Grid 1 — Money Spent Tracker */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Money spent</p>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(spendTotal)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">{spendRange === "week" ? "This week" : "This month"}</p>
          </div>
          <div className="flex items-center gap-2">
            {(["week", "month"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSpendRange(opt)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full border transition",
                  spendRange === opt ? "bg-emerald-500/20 text-emerald-200 border-emerald-500" : "border-slate-700 text-slate-400 hover:text-white"
                )}
              >
                {opt === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={cn("px-2 py-1 rounded-full border", spendUnder ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/60" : "bg-red-500/10 text-red-200 border-red-500/60")}>{spendUnder ? "Under budget" : "Over budget"}</span>
          {spendBudget > 0 && (
            <span className="text-slate-400">{((spendTotal / spendBudget) * 100).toFixed(0)}% of {formatCurrency(spendBudget)}</span>
          )}
        </div>
        <div className="mt-4 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spendSeries} margin={{ top: 8, left: 0, right: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={spendUnder ? "#10b981" : "#ef4444"} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={spendUnder ? "#10b981" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={36} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl p-2">
                      <p className="font-semibold">{payload[0].payload.label}</p>
                      <p className="text-emerald-200">{formatCurrency(payload[0].value as number)}</p>
                    </div>
                  ) : null
                }
              />
              <Area type="monotone" dataKey="amount" stroke={spendUnder ? "#22c55e" : "#ef4444"} fill="url(#spendFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="text-[11px] text-slate-400">Daily breakdown</div>
          <a href="/dashboard/transactions" className="text-xs text-emerald-300 hover:text-emerald-200 font-semibold">Add Expense</a>
        </div>
      </div>

      {/* Grid 2 — Money Saved Tracker */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Money saved</p>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(Math.max(savingsAuto, 0))}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Auto-saved {savingsRange === "week" ? "this week" : "this month"}</p>
          </div>
          <div className="flex items-center gap-2">
            {(["week", "month"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSavingsRange(opt)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full border transition",
                  savingsRange === opt ? "bg-indigo-500/20 text-indigo-100 border-indigo-500" : "border-slate-700 text-slate-400 hover:text-white"
                )}
              >
                {opt === "week" ? "Auto-save Weekly" : "Auto-save Monthly"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative w-24 h-24">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#6366f1 ${savingsPct}% , rgba(255,255,255,0.06) ${savingsPct}% 100%)`,
              }}
            />
            <div className="absolute inset-2 rounded-full bg-slate-950 flex items-center justify-center flex-col text-white">
              <span className="text-sm font-bold">{savingsPct.toFixed(0)}%</span>
              <span className="text-[10px] text-slate-400">to goal</span>
            </div>
          </div>
          <div className="flex-1 text-sm text-slate-200 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Monthly target</span>
              <span>{formatCurrency(savingsTarget)}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${Math.min(savingsPct, 100)}%` }} />
            </div>
            <p className="text-[12px] text-slate-300">Savings rate {savings.savingsRate.toFixed(0)}%</p>
            <p className="text-[12px] text-slate-400">Lifetime saved {formatCurrency(savings.totalSaved)}</p>
            {shortfall > 0 ? (
              <p className="text-[12px] text-amber-300">Overspent by {formatCurrency(shortfall)} — move from a plan.</p>
            ) : (
              <p className="text-[12px] text-emerald-300">Auto-saved from staying under budget.</p>
            )}
            <div className="flex gap-2 text-xs pt-2">
              {shortfall > 0 ? (
                <a href="/dashboard/goals" className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-100 border border-amber-500/60 font-semibold">Adjust Plans</a>
              ) : (
                <a href="/dashboard/goals" className="px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-100 border border-indigo-500/60 font-semibold">Add to Savings</a>
              )}
              <a href="/dashboard/goals" className="px-3 py-1.5 rounded-full border border-slate-700 text-slate-200 hover:text-white">View Goals</a>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3 — Saving Plans Carousel */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Saving plans</p>
            <h3 className="text-xl font-bold text-white">Active goals</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPlanIndex((i) => (i - 1 + Math.max(plans.length, 1)) % Math.max(plans.length, 1))} className="w-8 h-8 rounded-full border border-slate-700 text-slate-300 hover:text-white">‹</button>
            <button onClick={() => setPlanIndex((i) => (i + 1) % Math.max(plans.length, 1))} className="w-8 h-8 rounded-full border border-slate-700 text-slate-300 hover:text-white">›</button>
          </div>
        </div>
        {plans.length === 0 ? (
          <div className="text-slate-400 text-sm">No plans yet. Create your first goal.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, idx) => {
              const plan = plans[(planIndex + idx) % plans.length];
              const pct = Math.min((plan.savedAmount / plan.targetAmount) * 100, 100);
              return (
                <div key={`${plan.id}-${idx}`} className="rounded-2xl bg-slate-900 border border-slate-800 p-3 shadow-inner">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-semibold text-white truncate">{plan.title}</div>
                    <span className="text-[11px] text-slate-400">{plan.deadline ? new Date(plan.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "No date"}</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn("h-full", pct >= 100 ? "bg-emerald-400" : "bg-amber-400")} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>{pct.toFixed(0)}% complete</span>
                    <span>{formatCurrency(plan.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="flex gap-2">
            {plans.slice(0, 5).map((_, i) => (
              <span key={i} className={cn("w-2 h-2 rounded-full", i === (planIndex % Math.max(plans.length, 1)) ? "bg-emerald-400" : "bg-slate-700")}></span>
            ))}
          </div>
          <div className="flex gap-2">
            <a href="/dashboard/goals" className="text-emerald-300 hover:text-emerald-200 font-semibold">View All Plans</a>
            <a href="/dashboard/goals" className="text-slate-300 hover:text-white">Create New Plan</a>
          </div>
        </div>
      </div>

      {/* Grid 4 — Financial Calendar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Financial calendar</p>
            <h3 className="text-xl font-bold text-white">Spend heat + milestones</h3>
          </div>
        </div>
        <div className="grid grid-cols-7 text-[11px] text-slate-500 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d} className="text-center">{d}</span>
          ))}
        </div>
        <div className="space-y-1">
          {monthGrid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day.date) return <div key={di} className="h-10" />;
                const tone = colorForSpend(day.total, maxCalendarSpend);
                const milestone = day.milestone;
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "h-10 rounded-xl text-[11px] flex flex-col items-center justify-center border transition",
                      tone,
                      "hover:brightness-110"
                    )}
                  >
                    <span className="text-slate-200">{day.date.slice(8)}</span>
                    {milestone && <span className="text-[9px] text-amber-300">★</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {selectedDay && (
          <div className="mt-3 text-xs text-slate-200 p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between">
              <span>{new Date(selectedDay.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
              <button className="text-slate-400" onClick={() => setSelectedDay(null)}>Close</button>
            </div>
            <p className="text-sm font-semibold text-white mt-1">{formatCurrency(selectedDay.total)}</p>
            <p className="text-[11px] text-slate-400">{selectedDay.count} transaction{selectedDay.count === 1 ? "" : "s"}</p>
            {selectedDay.milestone && <p className="text-[11px] text-amber-300 mt-1">Milestone: {selectedDay.milestone}</p>}
            <a href="/dashboard/transactions" className="text-[11px] text-emerald-300 hover:text-emerald-200 font-semibold mt-2 inline-block">Add/View notes</a>
          </div>
        )}
      </div>

      {/* Grid 5 — Current Investments Carousel */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Current investments</p>
            <h3 className="text-xl font-bold text-white">Live-ish prices</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setInvestIndex((i) => (i - 1 + Math.max(investments.length, 1)) % Math.max(investments.length, 1))} className="w-8 h-8 rounded-full border border-slate-700 text-slate-300 hover:text-white">‹</button>
            <button onClick={() => setInvestIndex((i) => (i + 1) % Math.max(investments.length, 1))} className="w-8 h-8 rounded-full border border-slate-700 text-slate-300 hover:text-white">›</button>
          </div>
        </div>
        {investments.length === 0 ? (
          <div className="text-slate-400 text-sm">No holdings tracked. Add one to start.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, idx) => {
              const item = investments[(investIndex + idx) % investments.length];
              const gainPct = ((item.current - item.invested) / item.invested) * 100;
              return (
                <div key={`${item.ticker}-${idx}`} className="rounded-2xl bg-slate-900 border border-slate-800 p-3 shadow-inner">
                  <div className="flex justify-between text-sm text-white font-semibold">
                    <span className="truncate">{item.name}</span>
                    <span className="text-[11px] text-slate-400">{item.ticker}</span>
                  </div>
                  <div className="mt-2 text-slate-300 text-[12px]">Shares {item.shares}</div>
                  <div className="mt-1 text-slate-300 text-[12px]">Invested {formatCurrency(item.invested)}</div>
                  <div className="mt-1 text-slate-100 font-semibold">Current {formatCurrency(item.current)}</div>
                  <div className={cn("text-[12px]", gainPct >= 0 ? "text-emerald-300" : "text-red-300")}>P/L {gainPct.toFixed(2)}%</div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="flex gap-2">
            {investments.slice(0, 5).map((_, i) => (
              <span key={i} className={cn("w-2 h-2 rounded-full", i === (investIndex % Math.max(investments.length, 1)) ? "bg-emerald-400" : "bg-slate-700")}></span>
            ))}
          </div>
          <div className="flex gap-2">
            <a href="/dashboard/transactions" className="text-emerald-300 hover:text-emerald-200 font-semibold">Add Investment</a>
            <a href="/dashboard/calculators" className="text-slate-300 hover:text-white">View Portfolio</a>
          </div>
        </div>
      </div>

      {/* Grid 6 — Finance News Feed */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase text-slate-400 font-semibold">Finance news</p>
            <h3 className="text-xl font-bold text-white">Fresh headlines</h3>
          </div>
          <div className="flex gap-2 text-[11px]">
            {["All", "Markets", "Personal Finance", "Crypto", "Economy"].map((cat) => (
              <button
                key={cat}
                onClick={() => setNewsFilter(cat)}
                className={cn(
                  "px-2 py-1 rounded-full border transition",
                  newsFilter === cat ? "bg-emerald-500/20 text-emerald-100 border-emerald-500" : "border-slate-700 text-slate-400 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
          {filteredNews.map((item, i) => (
            <a
              key={`${item.title}-${i}`}
              href={item.url}
              target="_blank"
              className="rounded-2xl bg-slate-900 border border-slate-800 p-3 hover:border-emerald-500/60 transition block"
            >
              <p className="text-[10px] text-emerald-300 uppercase tracking-wide">{item.category ?? "Markets"}</p>
              <p className="text-sm text-white font-semibold mt-1 leading-snug">{item.title}</p>
              <p className="text-[11px] text-slate-400 mt-1">{item.source} · {new Date(item.publishedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
              <p className="text-[11px] text-slate-400 mt-1">See More News →</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
