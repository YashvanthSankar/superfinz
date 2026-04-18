"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";

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
};

function RangeToggle<T extends string>({
  value, options, onChange,
}: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex border-2 border-ink overflow-hidden">
      {options.map((o, i) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "text-[10px] font-black uppercase tracking-wider px-3 h-7 transition-colors",
            i > 0 && "border-l-2 border-ink",
            value === o.key
              ? "bg-ink text-paper"
              : "bg-paper text-ink hover:bg-paper-2"
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

  const [spendRange, setSpendRange] = useState<"week" | "month">("week");
  const [savingsRange, setSavingsRange] = useState<"week" | "month">("month");

  const spendSeries = spendRange === "week" ? spend.weekData : spend.monthData;
  const spendTotal = spendRange === "week" ? spend.weekTotal : spend.monthTotal;
  const spendBudget = spendRange === "week" ? spend.weekBudget : spend.monthBudget;
  const spendUnder = !spendBudget || spendTotal <= spendBudget;

  const savedAmt = savingsRange === "week" ? savings.autoSaveWeek : savings.autoSaveMonth;
  const shortfall = savingsRange === "week" ? savings.shortfallWeek : savings.shortfallMonth;
  const savingsPct = savings.goalTarget > 0
    ? Math.min((savedAmt / savings.goalTarget) * 100, 100) : 0;

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── Money Spent ──────────────────────────────────────────── */}
      <div className="brut-card p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="brut-label">Money spent</p>
            <h3 className="brut-display text-3xl text-ink mt-1 tabular">{formatCurrency(spendTotal)}</h3>
            <p className="text-[11px] text-ink-soft font-bold mt-0.5">
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
          <span
            className={cn(
              "brut-stamp",
              spendUnder ? "bg-good text-paper" : "bg-bad text-paper"
            )}
          >
            {spendUnder ? "Under budget" : "Over budget"}
          </span>
          {spendBudget > 0 && (
            <span className="text-ink-soft font-bold tabular text-[11px]">
              {((spendTotal / spendBudget) * 100).toFixed(0)}% of {formatCurrency(spendBudget)}
            </span>
          )}
        </div>

        <div className="h-36">
          {spendTotal === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-ink-soft">
              <p className="brut-display text-xl text-mute">No spends yet.</p>
              <p className="brut-label text-[10px] mt-1">Log one to see the trend</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spendSeries} margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={spendUnder ? "var(--accent)" : "var(--bad)"} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={spendUnder ? "var(--accent)" : "var(--bad)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--ink-soft)", fontSize: 10, fontWeight: 700 }} axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }} tickLine={false} />
              <YAxis
                tick={{ fill: "var(--ink-soft)", fontSize: 10, fontWeight: 700 }}
                axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }}
                tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                width={32}
              />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="bg-paper border-2 border-ink shadow-[2px_2px_0_var(--ink)] p-2 text-xs">
                      <p className="brut-label">{payload[0].payload.label}</p>
                      <p className="font-black text-ink mt-0.5 tabular">{formatCurrency(payload[0].value as number)}</p>
                    </div>
                  ) : null}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={spendUnder ? "var(--accent)" : "var(--bad)"}
                fill="url(#spFill)"
                strokeWidth={3}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <Link
            href="/dashboard/transactions"
            className="text-[11px] font-black uppercase tracking-wider text-ink hover:text-accent transition-colors"
          >
            Add expense →
          </Link>
        </div>
      </div>

      {/* ── Money Saved ──────────────────────────────────────────── */}
      <div className="brut-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="brut-label">Money saved</p>
            <h3 className="brut-display text-3xl text-ink mt-1 tabular">{formatCurrency(Math.max(savedAmt, 0))}</h3>
            <p className="text-[11px] text-ink-soft font-bold mt-0.5">
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
          {/* Square "dial" — brutalist replaces conic ring */}
          <div className="relative w-24 h-24 shrink-0 border-2 border-ink bg-paper-2 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-accent"
              style={{
                clipPath: `polygon(0 ${100 - savingsPct}%, 100% ${100 - savingsPct}%, 100% 100%, 0 100%)`,
              }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <span className="brut-display text-xl text-ink tabular">{savingsPct.toFixed(0)}%</span>
              <span className="brut-label text-[9px]">of goal</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-ink-soft font-bold">Monthly target</span>
              <span className="font-black text-ink tabular">{formatCurrency(savings.goalTarget)}</span>
            </div>
            <div className="h-2 bg-paper-2 border-2 border-ink overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${savingsPct}%` }} />
            </div>
            <p className="text-[11px] text-ink font-bold">
              Savings rate <span className="tabular font-black">{savings.savingsRate.toFixed(0)}%</span>
            </p>
            <p className="text-[11px] text-ink-soft font-semibold tabular">Lifetime saved {formatCurrency(savings.totalSaved)}</p>
            {shortfall > 0 ? (
              <p className="text-[11px] text-bad font-black tabular">Overspent by {formatCurrency(shortfall)}</p>
            ) : (
              <p className="text-[11px] text-good font-black">Stayed under budget ✓</p>
            )}
            <div className="flex gap-2 pt-1">
              <Link
                href="/dashboard/goals"
                className={cn(
                  "brut-stamp",
                  shortfall > 0 ? "bg-bad text-paper" : "bg-ink text-paper"
                )}
              >
                {shortfall > 0 ? "Adjust plans" : "Add to savings"}
              </Link>
              <Link href="/dashboard/goals" className="brut-stamp bg-paper">
                View goals
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
