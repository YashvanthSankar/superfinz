"use client";
import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

type Tab = "sip" | "fd" | "emi";

// SIP
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

// FD
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

// EMI
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

const CUSTOM_TOOLTIP = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-3 text-xs">
      <p className="text-[#8888aa] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
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
    { id: "sip", label: "SIP Calculator", emoji: "📈" },
    { id: "fd", label: "FD Calculator", emoji: "🏦" },
    { id: "emi", label: "EMI Calculator", emoji: "🏠" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Calculators 📈</h1>
        <p className="text-[#8888aa] text-sm mt-0.5">plan your money moves</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              tab === t.id
                ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                : "border-[#2a2a3a] text-[#8888aa] hover:border-[#3a3a4a] hover:text-white"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* SIP */}
      {tab === "sip" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardTitle className="mb-4">SIP inputs</CardTitle>
            <div className="space-y-4">
              <Input label="Monthly investment (₹)" type="number" value={sip.monthly} onChange={(e) => setSip((s) => ({ ...s, monthly: e.target.value }))} />
              <div>
                <label className="text-sm font-medium text-[#8888aa]">Expected return rate: {sip.rate}% p.a.</label>
                <input type="range" min="1" max="30" value={sip.rate} onChange={(e) => setSip((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-[#00ff88]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#8888aa]">Duration: {sip.years} years</label>
                <input type="range" min="1" max="40" value={sip.years} onChange={(e) => setSip((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-[#00ff88]" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Invested", value: sipResult.invested, color: "text-[#8888aa]" },
                { label: "Gains", value: sipResult.gains, color: "text-[#00ff88]" },
                { label: "Maturity", value: sipResult.maturity, color: "text-white" },
              ].map((s) => (
                <div key={s.label} className="bg-[#1a1a24] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#4a4a6a] mb-1">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle className="mb-4">Growth chart</CardTitle>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={sipResult.data}>
                <defs>
                  <linearGradient id="sipGain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="month" stroke="#4a4a6a" tick={{ fontSize: 11 }} tickFormatter={(v) => `M${v}`} />
                <YAxis stroke="#4a4a6a" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Area type="monotone" dataKey="invested" stroke="#4a4a6a" fill="none" name="Invested" />
                <Area type="monotone" dataKey="value" stroke="#00ff88" fill="url(#sipGain)" name="Value" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* FD */}
      {tab === "fd" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardTitle className="mb-4">FD inputs</CardTitle>
            <div className="space-y-4">
              <Input label="Principal amount (₹)" type="number" value={fd.principal} onChange={(e) => setFd((s) => ({ ...s, principal: e.target.value }))} />
              <div>
                <label className="text-sm font-medium text-[#8888aa]">Interest rate: {fd.rate}% p.a.</label>
                <input type="range" min="1" max="15" step="0.1" value={fd.rate} onChange={(e) => setFd((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-[#00ff88]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#8888aa]">Tenure: {fd.years} years</label>
                <input type="range" min="1" max="10" value={fd.years} onChange={(e) => setFd((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-[#00ff88]" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Principal", value: +fd.principal, color: "text-[#8888aa]" },
                { label: "Interest", value: fdResult.interest, color: "text-[#00ff88]" },
                { label: "Maturity", value: fdResult.maturity, color: "text-white" },
              ].map((s) => (
                <div key={s.label} className="bg-[#1a1a24] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#4a4a6a] mb-1">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle className="mb-4">Growth chart</CardTitle>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fdResult.data}>
                <defs>
                  <linearGradient id="fdGain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="year" stroke="#4a4a6a" tick={{ fontSize: 11 }} tickFormatter={(v) => `Y${v}`} />
                <YAxis stroke="#4a4a6a" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#fdGain)" name="Value" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* EMI */}
      {tab === "emi" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardTitle className="mb-4">EMI inputs</CardTitle>
            <div className="space-y-4">
              <Input label="Loan amount (₹)" type="number" value={emi.principal} onChange={(e) => setEmi((s) => ({ ...s, principal: e.target.value }))} />
              <div>
                <label className="text-sm font-medium text-[#8888aa]">Interest rate: {emi.rate}% p.a.</label>
                <input type="range" min="1" max="25" step="0.5" value={emi.rate} onChange={(e) => setEmi((s) => ({ ...s, rate: e.target.value }))} className="w-full mt-2 accent-[#7c3aed]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#8888aa]">Tenure: {emi.years} years</label>
                <input type="range" min="1" max="30" value={emi.years} onChange={(e) => setEmi((s) => ({ ...s, years: e.target.value }))} className="w-full mt-2 accent-[#7c3aed]" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Monthly EMI", value: emiResult.emi, color: "text-[#7c3aed]" },
                { label: "Total interest", value: emiResult.interest, color: "text-red-400" },
                { label: "Total payment", value: emiResult.total, color: "text-white" },
              ].map((s) => (
                <div key={s.label} className="bg-[#1a1a24] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#4a4a6a] mb-1">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle className="mb-4">Balance over time</CardTitle>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={emiResult.data}>
                <defs>
                  <linearGradient id="emiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="month" stroke="#4a4a6a" tick={{ fontSize: 11 }} tickFormatter={(v) => `M${v}`} />
                <YAxis stroke="#4a4a6a" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Area type="monotone" dataKey="balance" stroke="#7c3aed" fill="url(#emiGrad)" name="Balance" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
