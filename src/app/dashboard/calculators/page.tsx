"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

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

const ChartTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-amber-400 rounded-xl p-3 text-xs shadow-sm">
      <p className="text-accent mb-1.5 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function CalculatorsPage() {
  const [tab, setTab] = useState<Tab>("sip");
  const [sip, setSip] = useState({ monthly: "5000", rate: "12", years: "10" });
  const [fd,  setFd]  = useState({ principal: "100000", rate: "7", years: "3" });
  const [emi, setEmi] = useState({ principal: "500000", rate: "10", years: "5" });

  const sipResult = calcSIP(+sip.monthly, +sip.rate, +sip.years);
  const fdResult  = calcFD(+fd.principal,  +fd.rate,  +fd.years);
  const emiResult = calcEMI(+emi.principal, +emi.rate, +emi.years);

  const TABS: { id: Tab; label: string }[] = [
    { id: "sip", label: "SIP" },
    { id: "fd",  label: "Fixed Deposit" },
    { id: "emi", label: "EMI" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Calculators</h1>
        <p className="text-accent text-sm mt-0.5 font-light">Plan your money moves</p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              tab === t.id
                ? "bg-amber-50 border-amber-400 text-amber-700"
                : "border-border text-muted hover:border-amber-300 hover:text-text bg-background"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sip" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-background rounded-2xl border border-surface p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-text mb-5">SIP inputs</h2>
            <div className="space-y-5">
              <Input label="Monthly investment (₹)" type="number" value={sip.monthly} onChange={(e) => setSip((s) => ({ ...s, monthly: e.target.value }))} />
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Expected return — {sip.rate}% p.a.</label>
                <input type="range" min="1" max="30" value={sip.rate} onChange={(e) => setSip((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-amber-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Duration — {sip.years} years</label>
                <input type="range" min="1" max="40" value={sip.years} onChange={(e) => setSip((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-amber-600" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Invested",  value: sipResult.invested,  color: "text-muted" },
                { label: "Gains",     value: sipResult.gains,     color: "text-emerald-600" },
                { label: "Maturity",  value: sipResult.maturity,  color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="bg-background rounded-xl p-3 text-center border border-surface">
                  <p className="text-[10px] text-accent font-medium uppercase tracking-wide mb-1.5">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-background rounded-2xl border border-surface p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-text mb-5">Growth chart</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={sipResult.data}>
                <defs>
                  <linearGradient id="sipGain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#d97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" vertical={false} />
                <XAxis dataKey="month" stroke="#b45309" tick={{ fontSize: 10, fill: "#b45309" }} tickFormatter={(v) => `M${v}`} axisLine={false} tickLine={false} />
                <YAxis stroke="#b45309" tick={{ fontSize: 10, fill: "#b45309" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="invested" stroke="#fcd34d" fill="none" name="Invested" strokeWidth={1.5} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="value"    stroke="#d97706" fill="url(#sipGain)" name="Value" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "fd" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-background rounded-2xl border border-surface p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-text mb-5">FD inputs</h2>
            <div className="space-y-5">
              <Input label="Principal amount (₹)" type="number" value={fd.principal} onChange={(e) => setFd((s) => ({ ...s, principal: e.target.value }))} />
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Interest rate — {fd.rate}% p.a.</label>
                <input type="range" min="1" max="15" step="0.1" value={fd.rate} onChange={(e) => setFd((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-amber-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Tenure — {fd.years} years</label>
                <input type="range" min="1" max="10" value={fd.years} onChange={(e) => setFd((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-amber-500" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Principal", value: +fd.principal,   color: "text-muted" },
                { label: "Interest",  value: fdResult.interest, color: "text-amber-600" },
                { label: "Maturity",  value: fdResult.maturity, color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="bg-background rounded-xl p-3 text-center border border-surface">
                  <p className="text-[10px] text-accent font-medium uppercase tracking-wide mb-1.5">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-background rounded-2xl border border-surface p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-text mb-5">Growth chart</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fdResult.data}>
                <defs>
                  <linearGradient id="fdGain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#d97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" vertical={false} />
                <XAxis dataKey="year" stroke="#b45309" tick={{ fontSize: 10, fill: "#b45309" }} tickFormatter={(v) => `Y${v}`} axisLine={false} tickLine={false} />
                <YAxis stroke="#b45309" tick={{ fontSize: 10, fill: "#b45309" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#d97706" fill="url(#fdGain)" name="Value" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "emi" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-background rounded-2xl border border-surface p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-text mb-5">EMI inputs</h2>
            <div className="space-y-5">
              <Input label="Loan amount (₹)" type="number" value={emi.principal} onChange={(e) => setEmi((s) => ({ ...s, principal: e.target.value }))} />
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Interest rate — {emi.rate}% p.a.</label>
                <input type="range" min="1" max="25" step="0.5" value={emi.rate} onChange={(e) => setEmi((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-amber-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Tenure — {emi.years} years</label>
                <input type="range" min="1" max="30" value={emi.years} onChange={(e) => setEmi((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-amber-600" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Monthly EMI",    value: emiResult.emi,      color: "text-amber-700" },
                { label: "Total interest", value: emiResult.interest, color: "text-red-500" },
                { label: "Total payment",  value: emiResult.total,    color: "text-text" },
              ].map((s) => (
                <div key={s.label} className="bg-background rounded-xl p-3 text-center border border-surface">
                  <p className="text-[10px] text-accent font-medium uppercase tracking-wide mb-1.5">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-background rounded-2xl border border-surface p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-text mb-5">Balance over time</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={emiResult.data}>
                <defs>
                  <linearGradient id="emiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" vertical={false} />
                <XAxis dataKey="month" stroke="#b45309" tick={{ fontSize: 10, fill: "#b45309" }} tickFormatter={(v) => `M${v}`} axisLine={false} tickLine={false} />
                <YAxis stroke="#b45309" tick={{ fontSize: 10, fill: "#b45309" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="balance" stroke="#dc2626" fill="url(#emiGrad)" name="Balance" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
