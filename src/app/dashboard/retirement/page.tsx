"use client";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { FinTip } from "@/components/ui/fin-tip";

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

  for (let age = currentAge; age <= retireAge; age++) {
    const yearsLeft = retireAge - age;
    const inflatedExpenses = baseExpenses * 12 * Math.pow(1 + inflationRate, retireAge - currentAge);
    const target = inflatedExpenses * 25 * ((retireAge - age) / (retireAge - currentAge));
    data.push({ age, corpus: Math.round(corpus), target: Math.round(inflatedExpenses * 25) });
    // compound for 12 months
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
    fetch("/api/profile")
      .then(r => r.json())
      .then(({ user }) => {
        if (!user) return;
        if (user.age) setCurrentAge(user.age);
        const income = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0;
        const savings = user.profile?.savingsGoal ?? 0;
        if (savings > 0) setMonthlySip(savings);
        if (income > 0) setMonthlyExpenses(Math.max(income - savings, income * 0.7));
      })
      .catch(() => {});
  }, []);

  const yearsLeft         = Math.max(retireAge - currentAge, 1);
  const inflatedExpenses  = monthlyExpenses * 12 * Math.pow(1 + inflation / 100, yearsLeft);
  const fireCorpus        = inflatedExpenses * 25;
  const requiredSip       = sipNeeded(fireCorpus, yearsLeft, currentSaved, returns / 100);
  const projCorpus        = (() => {
    const r = (returns / 100) / 12;
    const n = yearsLeft * 12;
    const fvExisting = currentSaved * Math.pow(1 + r, n);
    const fvSip = monthlySip * ((Math.pow(1 + r, n) - 1) / r);
    return fvExisting + fvSip;
  })();
  const onTrack  = projCorpus >= fireCorpus;
  const corpusGap = Math.max(fireCorpus - projCorpus, 0);

  const chartData = buildCorpusData(currentAge, retireAge, monthlySip, currentSaved, inflation / 100, returns / 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Retirement Planner</h1>
        <p className="text-accent text-sm mt-0.5 font-light">
          Calculate your <FinTip term="FIRE" /> number — the <FinTip term="corpus" /> you need to retire on your terms
        </p>
      </div>

      {/* ── Summary banner ── */}
      <div className={`rounded-2xl p-5 border-2 ${onTrack ? "bg-emerald-50 border-emerald-200" : "bg-text border-amber-600"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${onTrack ? "text-emerald-600" : "text-amber-300"}`}>
              {onTrack ? "You're on track" : "Gap to close"}
            </p>
            <p className={`text-2xl font-black mt-1 ${onTrack ? "text-emerald-700" : "text-background"}`}>
              {onTrack ? `${fmtCrore(projCorpus)} projected` : `${fmtCrore(corpusGap)} short`}
            </p>
            <p className={`text-xs mt-1 font-light ${onTrack ? "text-emerald-600" : "text-amber-300/80"}`}>
              Freedom corpus needed by age {retireAge}: {fmtCrore(fireCorpus)}
            </p>
          </div>
          {!onTrack && (
            <div className="shrink-0 bg-text2/40 rounded-xl px-4 py-3 text-center">
              <p className="text-[10px] text-amber-300 uppercase tracking-wide font-semibold"><FinTip term="SIP">SIP</FinTip> needed</p>
              <p className="text-xl font-black text-amber-300 mt-0.5">{formatCurrency(Math.round(requiredSip))}</p>
              <p className="text-[10px] text-amber-400/70">per month to hit target</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Inputs ── */}
        <div className="bg-background rounded-2xl border border-surface p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-text">Your numbers</h2>

          {[
            { label: "Current age", value: currentAge, set: setCurrentAge, min: 15, max: 50 },
            { label: "Target retirement age", value: retireAge, set: setRetireAge, min: 30, max: 65 },
          ].map(({ label, value, set, min, max }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-text font-medium">{label}</label>
                <span className="text-xs font-bold text-amber-700">{value} yrs</span>
              </div>
              <input type="range" min={min} max={max} value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          ))}

          <div>
            <label className="text-xs text-text font-medium block mb-1">Monthly SIP (₹)</label>
            <input type="number" value={monthlySip} onChange={e => setMonthlySip(Number(e.target.value))}
              className="w-full bg-surface border border-amber-400 rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-xs text-text font-medium block mb-1">Monthly expenses (₹)</label>
            <input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(Number(e.target.value))}
              className="w-full bg-surface border border-amber-400 rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-xs text-text font-medium block mb-1">Existing savings (₹)</label>
            <input type="number" value={currentSaved} onChange={e => setCurrentSaved(Number(e.target.value))}
              className="w-full bg-surface border border-amber-400 rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-amber-500" />
          </div>

          <div className="border-t border-amber-200 pt-3 space-y-3">
            <p className="text-[10px] text-accent uppercase tracking-wide font-semibold">Assumptions</p>
            {[
              { label: `Expected return: ${returns}% CAGR`, value: returns, set: setReturns, min: 6, max: 18 },
              { label: `Inflation: ${inflation}%`, value: inflation, set: setInflation, min: 3, max: 10 },
            ].map(({ label, value, set, min, max }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-accent font-light">{label}</label>
                </div>
                <input type="range" min={min} max={max} value={value}
                  onChange={e => set(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="lg:col-span-2 bg-background rounded-2xl border border-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text mb-1">Corpus growth trajectory</h2>
          <p className="text-xs text-accent font-light mb-4">Your projected wealth vs freedom corpus target</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" vertical={false} />
              <XAxis dataKey="age" tick={{ fontSize: 10, fill: "#b45309" }} axisLine={false} tickLine={false} label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 10, fill: "#b45309" }} />
              <YAxis tickFormatter={(v) => v >= 10000000 ? `${(v/10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v/100000).toFixed(0)}L` : `${v}`}
                tick={{ fontSize: 9, fill: "#b45309" }} width={50} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value, name) => [fmtCrore(Number(value)), name === "corpus" ? "Your corpus" : "Target corpus"]}
                labelFormatter={(l) => `Age ${l}`}
                contentStyle={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11, color: "#713f12" }}
              />
              <Area type="monotone" dataKey="target" stroke="#fcd34d" strokeDasharray="4 4" fill="none" strokeWidth={1.5} name="target" />
              <Area type="monotone" dataKey="corpus" stroke="#d97706" fill="url(#corpusGrad)" strokeWidth={2} name="corpus" />
              <ReferenceLine x={retireAge} stroke="#713f12" strokeDasharray="3 3" label={{ value: `Retire ${retireAge}`, fontSize: 9, fill: "#713f12" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Key milestones ── */}
      <div className="bg-background rounded-2xl border border-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-text mb-4">What this means for you</h2>
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
            <div key={label} className={`rounded-xl p-4 border ${highlight ? "bg-text border-amber-600 text-background" : "bg-surface border-amber-400 text-text"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${highlight ? "text-amber-300" : "text-accent"}`}>{label}</p>
              <p className={`text-xl font-black mt-1 ${highlight ? "text-amber-300" : "text-text"}`}>{value}</p>
              <p className={`text-[11px] mt-0.5 font-light ${highlight ? "text-amber-400/80" : "text-accent"}`}>{sub}</p>
            </div>
          ))}
        </div>

        {!onTrack && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <span className="font-semibold">Gap plan: </span>
            Increase your SIP by {formatCurrency(Math.round(requiredSip - monthlySip))}/month.
            Skip {Math.ceil((requiredSip - monthlySip) / 400)} unnecessary food orders/month to cover it.
            Start a NIFTY 50 index fund SIP today — even ₹500 extra compounds significantly over {yearsLeft} years.
          </div>
        )}
      </div>
    </div>
  );
}
