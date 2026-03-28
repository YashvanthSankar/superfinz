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

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 text-xs shadow-sm">
      <p className="text-[#94a3b8] mb-1.5 font-medium">{label}</p>
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
  const [fd, setFd] = useState({ principal: "100000", rate: "7", years: "3" });
  const [emi, setEmi] = useState({ principal: "500000", rate: "10", years: "5" });

  const sipResult = calcSIP(+sip.monthly, +sip.rate, +sip.years);
  const fdResult = calcFD(+fd.principal, +fd.rate, +fd.years);
  const emiResult = calcEMI(+emi.principal, +emi.rate, +emi.years);

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "sip", label: "SIP", emoji: "📈" },
    { id: "fd", label: "FD", emoji: "🏦" },
    { id: "emi", label: "EMI", emoji: "🏠" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Calculators</h1>
        <p className="text-[#94a3b8] text-sm mt-0.5 font-light">Plan your money moves</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              tab === t.id
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "border-[#e2e8f0] text-[#64748b] hover:border-[#c7d2e2] hover:text-[#0f172a] bg-white"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* SIP */}
      {tab === "sip" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-5">SIP inputs</h2>
            <div className="space-y-5">
              <Input label="Monthly investment (₹)" type="number" value={sip.monthly} onChange={(e) => setSip((s) => ({ ...s, monthly: e.target.value }))} />
              <div>
                <label className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Expected return: {sip.rate}% p.a.</label>
                <input type="range" min="1" max="30" value={sip.rate} onChange={(e) => setSip((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-indigo-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Duration: {sip.years} years</label>
                <input type="range" min="1" max="40" value={sip.years} onChange={(e) => setSip((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-indigo-600" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Invested", value: sipResult.invested, color: "text-[#64748b]" },
                { label: "Gains", value: sipResult.gains, color: "text-emerald-600" },
                { label: "Maturity", value: sipResult.maturity, color: "text-indigo-600" },
              ].map((s) => (
                <div key={s.label} className="bg-[#f8fafc] rounded-xl p-3 text-center border border-[#f1f5f9]">
                  <p className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wide mb-1.5">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-5">Growth chart</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={sipResult.data}>
                <defs>
                  <linearGradient id="sipGain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sipInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fontSize: 10 }} tickFormatter={(v) => `M${v}`} />
                <YAxis stroke="#cbd5e1" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="invested" stroke="#94a3b8" fill="url(#sipInv)" name="Invested" strokeWidth={1.5} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#sipGain)" name="Value" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* FD */}
      {tab === "fd" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-5">FD inputs</h2>
            <div className="space-y-5">
              <Input label="Principal amount (₹)" type="number" value={fd.principal} onChange={(e) => setFd((s) => ({ ...s, principal: e.target.value }))} />
              <div>
                <label className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Interest rate: {fd.rate}% p.a.</label>
                <input type="range" min="1" max="15" step="0.1" value={fd.rate} onChange={(e) => setFd((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-amber-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Tenure: {fd.years} years</label>
                <input type="range" min="1" max="10" value={fd.years} onChange={(e) => setFd((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-amber-500" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Principal", value: +fd.principal, color: "text-[#64748b]" },
                { label: "Interest", value: fdResult.interest, color: "text-amber-600" },
                { label: "Maturity", value: fdResult.maturity, color: "text-indigo-600" },
              ].map((s) => (
                <div key={s.label} className="bg-[#f8fafc] rounded-xl p-3 text-center border border-[#f1f5f9]">
                  <p className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wide mb-1.5">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-5">Growth chart</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fdResult.data}>
                <defs>
                  <linearGradient id="fdGain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#cbd5e1" tick={{ fontSize: 10 }} tickFormatter={(v) => `Y${v}`} />
                <YAxis stroke="#cbd5e1" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#fdGain)" name="Value" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* EMI */}
      {tab === "emi" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-5">EMI inputs</h2>
            <div className="space-y-5">
              <Input label="Loan amount (₹)" type="number" value={emi.principal} onChange={(e) => setEmi((s) => ({ ...s, principal: e.target.value }))} />
              <div>
                <label className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Interest rate: {emi.rate}% p.a.</label>
                <input type="range" min="1" max="25" step="0.5" value={emi.rate} onChange={(e) => setEmi((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-violet-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Tenure: {emi.years} years</label>
                <input type="range" min="1" max="30" value={emi.years} onChange={(e) => setEmi((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-violet-600" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Monthly EMI", value: emiResult.emi, color: "text-violet-600" },
                { label: "Total interest", value: emiResult.interest, color: "text-red-500" },
                { label: "Total payment", value: emiResult.total, color: "text-[#0f172a]" },
              ].map((s) => (
                <div key={s.label} className="bg-[#f8fafc] rounded-xl p-3 text-center border border-[#f1f5f9]">
                  <p className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wide mb-1.5">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-5">Balance over time</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={emiResult.data}>
                <defs>
                  <linearGradient id="emiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fontSize: 10 }} tickFormatter={(v) => `M${v}`} />
                <YAxis stroke="#cbd5e1" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="balance" stroke="#7c3aed" fill="url(#emiGrad)" name="Balance" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
