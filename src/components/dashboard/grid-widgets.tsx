"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
export type SpendPoint = { label: string; amount: number; date: string };
export type SpendProps = {
  weekTotal: number; monthTotal: number;
  weekBudget: number; monthBudget: number;
  weekData: SpendPoint[]; monthData: SpendPoint[];
};
export type SavingsProps = {
  autoSaveWeek: number; autoSaveMonth: number;
  budgetWeek: number; budgetMonth: number;
  shortfallWeek: number; shortfallMonth: number;
  savingsRate: number; totalSaved: number; goalTarget: number;
};
export type DashboardGridProps = {
  spend: SpendProps;
  savings: SavingsProps;
  plans?: any;
  calendar?: any;
  investments?: any;
  news?: any;
};

// Shared card shell — same light cream as the rest of the page
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-[#fefce8] border border-surface rounded-3xl p-4 shadow-sm", className)}>
    {children}
  </div>
);

function RangeToggle<T extends string>({
  value, options, onChange,
}: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "text-[11px] px-2.5 py-1 rounded-full border transition",
            value === o.key
              ? "bg-amber-500/20 text-amber-800 border-amber-500 font-semibold"
              : "border-amber-300 text-[#b45309] hover:border-amber-500",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function DashboardGrids({ spend, savings }: DashboardGridProps) {
  const router = useRouter();

  const [spendRange,   setSpendRange]   = useState<"week" | "month">("week");
  const [savingsRange, setSavingsRange] = useState<"week" | "month">("month");

  const spendSeries = spendRange === "week" ? spend.weekData : spend.monthData;
  const spendTotal  = spendRange === "week" ? spend.weekTotal : spend.monthTotal;
  const spendBudget = spendRange === "week" ? spend.weekBudget : spend.monthBudget;
  const spendUnder  = !spendBudget || spendTotal <= spendBudget;

  const savedAmt   = savingsRange === "week" ? savings.autoSaveWeek : savings.autoSaveMonth;
  const shortfall  = savingsRange === "week" ? savings.shortfallWeek : savings.shortfallMonth;
  const savingsPct = savings.goalTarget > 0
    ? Math.min((savedAmt / savings.goalTarget) * 100, 100) : 0;

  // Refresh live data every 30 min
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── Money Spent ──────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[10px] text-[#b45309] uppercase font-semibold tracking-wider">Money spent</p>
            <h3 className="text-2xl font-bold text-[#713f12] mt-0.5">{formatCurrency(spendTotal)}</h3>
            <p className="text-[11px] text-[#b45309] mt-0.5">
              {spendRange === "week" ? "This week" : "This month"}
            </p>
          </div>
          <RangeToggle
            value={spendRange}
            options={[{ key: "week", label: "Week" }, { key: "month", label: "Month" }]}
            onChange={setSpendRange}
          />
        </div>

        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className={cn(
            "px-2 py-0.5 rounded-full border font-medium",
            spendUnder
              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
              : "bg-red-50 text-red-600 border-red-300",
          )}>
            {spendUnder ? "Under budget" : "Over budget"}
          </span>
          {spendBudget > 0 && (
            <span className="text-[#b45309]">
              {((spendTotal / spendBudget) * 100).toFixed(0)}% of {formatCurrency(spendBudget)}
            </span>
          )}
        </div>

        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spendSeries} margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={spendUnder ? "#d97706" : "#dc2626"} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={spendUnder ? "#d97706" : "#dc2626"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#b45309", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#b45309", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={32} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="bg-white border border-amber-400 rounded-xl px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold text-[#713f12]">{payload[0].payload.label}</p>
                      <p className="text-[#b45309]">{formatCurrency(payload[0].value as number)}</p>
                    </div>
                  ) : null}
              />
              <Area type="monotone" dataKey="amount"
                stroke={spendUnder ? "#d97706" : "#dc2626"} fill="url(#spFill)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex justify-end">
          <a href="/dashboard/transactions" className="text-xs text-amber-700 font-semibold hover:text-[#713f12]">
            Add expense →
          </a>
        </div>
      </Card>

      {/* ── Money Saved ──────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] text-[#b45309] uppercase font-semibold tracking-wider">Money saved</p>
            <h3 className="text-2xl font-bold text-[#713f12] mt-0.5">{formatCurrency(Math.max(savedAmt, 0))}</h3>
            <p className="text-[11px] text-[#b45309] mt-0.5">
              Auto-saved {savingsRange === "week" ? "this week" : "this month"}
            </p>
          </div>
          <RangeToggle
            value={savingsRange}
            options={[{ key: "week", label: "Week" }, { key: "month", label: "Month" }]}
            onChange={setSavingsRange}
          />
        </div>

        <div className="flex items-center gap-5">
          {/* Conic ring — inner uses amber-100 so it contrasts against the card */}
          <div className="relative w-20 h-20 shrink-0">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#d97706 ${savingsPct}%, #fde68a ${savingsPct}% 100%)`,
              }}
            />
            <div className="absolute inset-2 rounded-full bg-amber-50 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-[#713f12]">{savingsPct.toFixed(0)}%</span>
              <span className="text-[9px] text-[#b45309]">of goal</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#b45309]">Monthly target</span>
              <span className="font-semibold text-[#713f12]">{formatCurrency(savings.goalTarget)}</span>
            </div>
            <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${savingsPct}%` }} />
            </div>
            <p className="text-[11px] text-[#713f12]">
              Savings rate <span className="font-semibold">{savings.savingsRate.toFixed(0)}%</span>
            </p>
            <p className="text-[11px] text-[#b45309]">Lifetime saved {formatCurrency(savings.totalSaved)}</p>
            {shortfall > 0
              ? <p className="text-[11px] text-red-600">Overspent by {formatCurrency(shortfall)}</p>
              : <p className="text-[11px] text-emerald-600">Stayed under budget ✓</p>
            }
            <div className="flex gap-2 pt-0.5">
              <a href="/dashboard/goals" className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border font-semibold",
                shortfall > 0
                  ? "bg-red-50 text-red-600 border-red-300"
                  : "bg-amber-100 text-amber-800 border-amber-400",
              )}>
                {shortfall > 0 ? "Adjust plans" : "Add to savings"}
              </a>
              <a href="/dashboard/goals" className="text-[11px] px-2.5 py-1 rounded-full border border-amber-300 text-[#b45309] hover:border-amber-500">
                View goals
              </a>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}
