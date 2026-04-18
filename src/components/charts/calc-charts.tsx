"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

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

export function SipChart({ data }: { data: Array<{ month: number; value: number; invested: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
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
  );
}

export function FdChart({ data }: { data: Array<{ year: number; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
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
  );
}

export function EmiChart({ data }: { data: Array<{ month: number; balance: number; paid: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
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
  );
}
