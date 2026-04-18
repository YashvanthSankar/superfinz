"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

function fmtCrore(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export type RetirementChartDatum = { age: number; corpus: number; target: number };

export function RetirementChart({
  data,
  retireAge,
}: {
  data: RetirementChartDatum[];
  retireAge: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
  );
}
