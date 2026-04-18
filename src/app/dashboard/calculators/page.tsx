"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const ChartSkeleton = () => (
  <div className="h-[260px] w-full bg-surface/40 rounded-xl animate-pulse" />
);

const SipChart = dynamic(() => import("@/components/charts/calc-charts").then((m) => m.SipChart), {
  ssr: false, loading: ChartSkeleton,
});
const FdChart = dynamic(() => import("@/components/charts/calc-charts").then((m) => m.FdChart), {
  ssr: false, loading: ChartSkeleton,
});
const EmiChart = dynamic(() => import("@/components/charts/calc-charts").then((m) => m.EmiChart), {
  ssr: false, loading: ChartSkeleton,
});

type Tab = "sip" | "fd" | "emi";

function calcSIP(monthly: number, rate: number, years: number) {
  const n = years * 12;
  const r = rate / 100 / 12;
  const maturity = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = monthly * n;
  const gains = maturity - invested;
  const data = [];
  for (let m = 1; m <= n; m += Math.max(1, Math.floor(n / 24))) {
    const val = r === 0 ? monthly * m : monthly * ((Math.pow(1 + r, m) - 1) / r) * (1 + r);
    data.push({ month: m, value: Math.round(val), invested: monthly * m });
  }
  return { maturity, invested, gains, data };
}

function calcFD(principal: number, rate: number, years: number, compounding = 4) {
  const maturity = principal * Math.pow(1 + rate / 100 / compounding, compounding * years);
  const interest = maturity - principal;
  const data = [];
  for (let y = 0; y <= years; y++) {
    const val = principal * Math.pow(1 + rate / 100 / compounding, compounding * y);
    data.push({ year: y, value: Math.round(val) });
  }
  return { maturity, interest, data };
}

function calcEMI(principal: number, rate: number, years: number) {
  const n = years * 12;
  const r = rate / 100 / 12;
  const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - principal;
  const data = [];
  let balance = principal;
  for (let m = 1; m <= Math.min(n, 120); m += Math.max(1, Math.floor(n / 24))) {
    const int = balance * r;
    balance -= emi - int;
    data.push({ month: m, balance: Math.max(0, Math.round(balance)), paid: Math.round(emi * m) });
  }
  return { emi, total, interest, data };
}

export default function CalculatorsPage() {
  const [tab, setTab] = useState<Tab>("sip");
  const [sip, setSip] = useState({ monthly: "5000", rate: "12", years: "10" });
  const [fd,  setFd]  = useState({ principal: "100000", rate: "7", years: "3" });
  const [emi, setEmi] = useState({ principal: "500000", rate: "10", years: "5" });

  const num = (s: string, fallback = 0) => {
    const n = parseFloat(s);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const sipResult = calcSIP(num(sip.monthly), num(sip.rate, 1), num(sip.years, 1));
  const fdResult  = calcFD(num(fd.principal), num(fd.rate, 1), num(fd.years, 1));
  const emiResult = calcEMI(num(emi.principal), num(emi.rate, 1), num(emi.years, 1));

  const TABS: { id: Tab; label: string }[] = [
    { id: "sip", label: "SIP" },
    { id: "fd",  label: "Fixed Deposit" },
    { id: "emi", label: "EMI" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="brut-label mb-1">Plan your money moves</p>
        <h1 className="brut-display text-4xl sm:text-5xl text-ink">Calculators.</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`brut-btn h-10 text-xs ${
              tab === t.id
                ? "bg-ink text-paper"
                : "bg-paper text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sip" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="brut-card p-6">
            <p className="brut-label mb-5">SIP inputs</p>
            <div className="space-y-5">
              <Input label="Monthly investment (₹)" type="number" value={sip.monthly} onChange={(e) => setSip((s) => ({ ...s, monthly: e.target.value }))} />
              <div>
                <label className="brut-label">Expected return — <span className="tabular">{sip.rate}%</span> p.a.</label>
                <input type="range" min="1" max="30" value={sip.rate} onChange={(e) => setSip((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-accent" />
              </div>
              <div>
                <label className="brut-label">Duration — <span className="tabular">{sip.years}</span> years</label>
                <input type="range" min="1" max="40" value={sip.years} onChange={(e) => setSip((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-accent" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Invested",  value: sipResult.invested,  color: "text-muted" },
                { label: "Gains",     value: sipResult.gains,     color: "text-emerald-600" },
                { label: "Maturity",  value: sipResult.maturity,  color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="border-2 border-ink bg-paper-2 p-3 text-center">
                  <p className="brut-label mb-1">{s.label}</p>
                  <p className={`brut-display text-lg tabular ${s.color.replace("text-muted", "text-ink").replace("text-emerald-600", "text-good").replace("text-amber-600", "text-accent").replace("text-amber-700", "text-accent").replace("text-red-500", "text-bad").replace("text-text", "text-ink")}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="brut-card p-6">
            <p className="brut-label mb-5">Growth chart</p>
            <SipChart data={sipResult.data} />
          </div>
        </div>
      )}

      {tab === "fd" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="brut-card p-6">
            <p className="brut-label mb-5">FD inputs</p>
            <div className="space-y-5">
              <Input label="Principal amount (₹)" type="number" value={fd.principal} onChange={(e) => setFd((s) => ({ ...s, principal: e.target.value }))} />
              <div>
                <label className="brut-label">Interest rate — <span className="tabular">{fd.rate}%</span> p.a.</label>
                <input type="range" min="1" max="15" step="0.1" value={fd.rate} onChange={(e) => setFd((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-accent" />
              </div>
              <div>
                <label className="brut-label">Tenure — <span className="tabular">{fd.years}</span> years</label>
                <input type="range" min="1" max="10" value={fd.years} onChange={(e) => setFd((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-accent" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Principal", value: num(fd.principal), color: "text-muted" },
                { label: "Interest",  value: fdResult.interest, color: "text-amber-600" },
                { label: "Maturity",  value: fdResult.maturity, color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="border-2 border-ink bg-paper-2 p-3 text-center">
                  <p className="brut-label mb-1">{s.label}</p>
                  <p className={`brut-display text-lg tabular ${s.color.replace("text-muted", "text-ink").replace("text-emerald-600", "text-good").replace("text-amber-600", "text-accent").replace("text-amber-700", "text-accent").replace("text-red-500", "text-bad").replace("text-text", "text-ink")}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="brut-card p-6">
            <p className="brut-label mb-5">Growth chart</p>
            <FdChart data={fdResult.data} />
          </div>
        </div>
      )}

      {tab === "emi" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="brut-card p-6">
            <p className="brut-label mb-5">EMI inputs</p>
            <div className="space-y-5">
              <Input label="Loan amount (₹)" type="number" value={emi.principal} onChange={(e) => setEmi((s) => ({ ...s, principal: e.target.value }))} />
              <div>
                <label className="brut-label">Interest rate — <span className="tabular">{emi.rate}%</span> p.a.</label>
                <input type="range" min="1" max="25" step="0.5" value={emi.rate} onChange={(e) => setEmi((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-accent" />
              </div>
              <div>
                <label className="brut-label">Tenure — <span className="tabular">{emi.years}</span> years</label>
                <input type="range" min="1" max="30" value={emi.years} onChange={(e) => setEmi((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-accent" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Monthly EMI",    value: emiResult.emi,      color: "text-amber-700" },
                { label: "Total interest", value: emiResult.interest, color: "text-red-500" },
                { label: "Total payment",  value: emiResult.total,    color: "text-text" },
              ].map((s) => (
                <div key={s.label} className="border-2 border-ink bg-paper-2 p-3 text-center">
                  <p className="brut-label mb-1">{s.label}</p>
                  <p className={`brut-display text-lg tabular ${s.color.replace("text-muted", "text-ink").replace("text-emerald-600", "text-good").replace("text-amber-600", "text-accent").replace("text-amber-700", "text-accent").replace("text-red-500", "text-bad").replace("text-text", "text-ink")}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="brut-card p-6">
            <p className="brut-label mb-5">Balance over time</p>
            <EmiChart data={emiResult.data} />
          </div>
        </div>
      )}
    </div>
  );
}
