"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/fetcher";
import { FinTip } from "@/components/ui/fin-tip";

const RetirementChart = dynamic(
  () => import("@/components/charts/retirement-chart").then((m) => m.RetirementChart),
  { ssr: false, loading: () => <div className="h-[280px] w-full bg-surface/40 rounded-xl animate-pulse" /> }
);

function fmtCrore(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  return formatCurrency(n);
}

function buildCorpusData(
  currentAge: number,
  retireAge: number,
  monthlySip: number,
  currentSaved: number,
  inflationRate: number,
  returnRate: number,
) {
  const r = returnRate / 12;
  const data: { age: number; corpus: number; target: number }[] = [];
  let corpus = currentSaved;
  const baseExpenses = monthlySip; // used as proxy for expenses

  const inflatedExpenses = baseExpenses * 12 * Math.pow(1 + inflationRate, retireAge - currentAge);
  const targetCorpus = inflatedExpenses * 25;
  for (let age = currentAge; age <= retireAge; age++) {
    data.push({ age, corpus: Math.round(corpus), target: Math.round(targetCorpus) });
    for (let m = 0; m < 12; m++) {
      corpus = corpus * (1 + r) + monthlySip;
    }
  }
  return data;
}

function sipNeeded(corpus: number, years: number, existing: number, returnRate: number): number {
  const r = returnRate / 12;
  const n = years * 12;
  const fvExisting = existing * Math.pow(1 + r, n);
  const remaining = Math.max(corpus - fvExisting, 0);
  if (r === 0) return remaining / n;
  return remaining * r / (Math.pow(1 + r, n) - 1);
}

export default function RetirementPage() {
  const [currentAge, setCurrentAge]     = useState(21);
  const [retireAge, setRetireAge]       = useState(45);
  const [monthlySip, setMonthlySip]     = useState(3000);
  const [currentSaved, setCurrentSaved] = useState(0);
  const [inflation, setInflation]       = useState(6);
  const [returns, setReturns]           = useState(12);
  const [monthlyExpenses, setMonthlyExpenses] = useState(15000);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ user: { age?: number; profile?: { monthlySalary?: number; monthlyAllowance?: number; savingsGoal?: number } } }>("/api/profile")
      .then(({ user }) => {
        if (cancelled || !user) return;
        if (user.age) setCurrentAge(user.age);
        const income = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0;
        const savings = user.profile?.savingsGoal ?? 0;
        if (savings > 0) setMonthlySip(savings);
        if (income > 0) setMonthlyExpenses(Math.max(income - savings, income * 0.7));
      })
      .catch(() => { /* non-critical */ });
    return () => { cancelled = true; };
  }, []);

  const yearsLeft         = Math.max(retireAge - currentAge, 1);
  const safeInflation     = Math.max(inflation, 0) / 100;
  const safeReturns       = Math.max(returns, 0) / 100;
  const safeExpenses      = Math.max(monthlyExpenses, 0);
  const safeSip           = Math.max(monthlySip, 0);
  const safeSaved         = Math.max(currentSaved, 0);

  const inflatedExpenses  = safeExpenses * 12 * Math.pow(1 + safeInflation, yearsLeft);
  const fireCorpus        = inflatedExpenses * 25;
  const requiredSip       = sipNeeded(fireCorpus, yearsLeft, safeSaved, safeReturns);
  const projCorpus        = (() => {
    const r = safeReturns / 12;
    const n = yearsLeft * 12;
    const fvExisting = safeSaved * Math.pow(1 + r, n);
    const fvSip = r === 0 ? safeSip * n : safeSip * ((Math.pow(1 + r, n) - 1) / r);
    return fvExisting + fvSip;
  })();
  const onTrack  = projCorpus >= fireCorpus;
  const corpusGap = Math.max(fireCorpus - projCorpus, 0);

  const chartData = buildCorpusData(currentAge, retireAge, monthlySip, currentSaved, inflation / 100, returns / 100);

  return (
    <div className="space-y-6">
      <div>
        <p className="brut-label mb-1">FIRE Planner</p>
        <h1 className="brut-display text-4xl sm:text-5xl text-ink">Retirement.</h1>
        <p className="text-ink-soft text-sm font-semibold mt-1">
          Your <FinTip term="FIRE" /> number — the <FinTip term="corpus" /> you need to quit working on your terms.
        </p>
      </div>

      {/* ── Summary banner ── */}
      <div className={`border-2 border-ink p-5 shadow-[4px_4px_0_var(--ink)] ${onTrack ? "bg-good-soft" : "bg-ink"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className={`brut-label ${onTrack ? "text-good" : "text-accent"}`}>
              {onTrack ? "On track" : "Gap to close"}
            </p>
            <p className={`brut-display text-3xl sm:text-4xl mt-2 tabular ${onTrack ? "text-ink" : "text-paper"}`}>
              {onTrack ? `${fmtCrore(projCorpus)} projected` : `${fmtCrore(corpusGap)} short`}
            </p>
            <p className={`text-xs mt-2 font-semibold tabular ${onTrack ? "text-ink-soft" : "text-paper/70"}`}>
              Freedom corpus by {retireAge}: {fmtCrore(fireCorpus)}
            </p>
          </div>
          {!onTrack && (
            <div className="shrink-0 border-2 border-accent bg-accent-soft px-4 py-3 text-center">
              <p className="brut-label text-accent"><FinTip term="SIP">SIP</FinTip> needed</p>
              <p className="brut-display text-2xl text-ink mt-1 tabular">{formatCurrency(Math.round(requiredSip))}</p>
              <p className="text-[10px] text-ink-soft font-semibold">per month</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Inputs ── */}
        <div className="brut-card p-5 space-y-4">
          <p className="brut-label">Your numbers</p>

          {[
            { label: "Current age", value: currentAge, set: setCurrentAge, min: 15, max: 50 },
            { label: "Target retirement age", value: retireAge, set: setRetireAge, min: 30, max: 65 },
          ].map(({ label, value, set, min, max }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-ink font-black uppercase tracking-wider">{label}</label>
                <span className="text-xs font-black text-accent tabular">{value} yrs</span>
              </div>
              <input type="range" min={min} max={max} value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>
          ))}

          {[
            { label: "Monthly SIP (₹)", value: monthlySip, set: setMonthlySip },
            { label: "Monthly expenses (₹)", value: monthlyExpenses, set: setMonthlyExpenses },
            { label: "Existing savings (₹)", value: currentSaved, set: setCurrentSaved },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="brut-label block mb-1.5">{label}</label>
              <input type="number" value={value} onChange={e => set(Number(e.target.value))}
                className="w-full bg-paper border-2 border-ink px-3 h-10 text-sm text-ink font-bold tabular focus:outline-none focus:bg-accent-soft" />
            </div>
          ))}

          <div className="border-t-2 border-ink pt-3 space-y-3">
            <p className="brut-label">Assumptions</p>
            {[
              { label: `Expected return: ${returns}% CAGR`, value: returns, set: setReturns, min: 6, max: 18 },
              { label: `Inflation: ${inflation}%`, value: inflation, set: setInflation, min: 3, max: 10 },
            ].map(({ label, value, set, min, max }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <label className="text-[11px] text-ink-soft font-bold tabular">{label}</label>
                </div>
                <input type="range" min={min} max={max} value={value}
                  onChange={e => set(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="lg:col-span-2 brut-card p-5">
          <p className="brut-label">Corpus growth trajectory</p>
          <p className="text-xs text-ink-soft font-semibold mb-4 mt-1">Your projected wealth vs target corpus</p>
          <RetirementChart data={chartData} retireAge={retireAge} />
        </div>
      </div>

      {/* ── Key milestones ── */}
      <div className="brut-card p-5">
        <p className="brut-label mb-4">What this means for you</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              label: "Monthly SIP needed",
              value: formatCurrency(Math.round(requiredSip)),
              sub: "to hit freedom corpus",
              highlight: !onTrack && requiredSip > monthlySip,
            },
            {
              label: "Corpus at retirement",
              value: fmtCrore(projCorpus),
              sub: `at age ${retireAge} with current SIP`,
              highlight: false,
            },
            {
              label: "Monthly income at 4% drawdown",
              value: formatCurrency(Math.round((projCorpus * 0.04) / 12)),
              sub: "inflation-adjusted passive income",
              highlight: false,
            },
          ].map(({ label, value, sub, highlight }) => (
            <div key={label} className={`border-2 border-ink p-4 ${highlight ? "bg-accent text-paper" : "bg-paper-2"}`}>
              <p className={`brut-label ${highlight ? "text-paper" : ""}`}>{label}</p>
              <p className={`brut-display text-2xl mt-1 tabular ${highlight ? "text-paper" : "text-ink"}`}>{value}</p>
              <p className={`text-[11px] mt-1 font-semibold ${highlight ? "text-paper/80" : "text-ink-soft"}`}>{sub}</p>
            </div>
          ))}
        </div>

        {!onTrack && requiredSip > safeSip && (
          <div className="mt-4 border-2 border-ink bg-accent-soft px-4 py-3 text-sm text-ink font-semibold">
            <span className="brut-label mr-1">Gap plan:</span>
            Increase your SIP by <span className="tabular font-black">{formatCurrency(Math.round(requiredSip - safeSip))}</span>/month.
            Skip <span className="font-black">{Math.max(1, Math.ceil((requiredSip - safeSip) / 400))}</span> unnecessary food orders/month to cover it.
            Start a NIFTY 50 index fund SIP today — even ₹500 extra compounds significantly over {yearsLeft} years.
          </div>
        )}
      </div>
    </div>
  );
}
