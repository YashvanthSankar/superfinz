"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { categoryColor } from "@/lib/categories";

type TrendPoint = { day: number; cumulative: number; pace: number };
type CatPoint = { name: string; value: number };

// ─── Spending Trend ───────────────────────────────────────────────────────────
export function SpendTrendChart({ data }: { data: TrendPoint[] }) {
  const over = data.at(-1) ? data[data.length - 1].cumulative > data[data.length - 1].pace : false;
  const lineColor = over ? "var(--bad)" : "var(--ink)";

  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={over ? "var(--bad)" : "var(--accent)"} stopOpacity={0.4} />
            <stop offset="95%" stopColor={over ? "var(--bad)" : "var(--accent)"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--border-soft)" vertical={false} />
        <XAxis
          dataKey="day"
          stroke="var(--ink-soft)"
          tick={{ fontSize: 10, fill: "var(--ink-soft)", fontWeight: 700 }}
          tickLine={false}
          axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }}
          tickFormatter={(v) => `${v}`}
          interval={4}
        />
        <YAxis
          stroke="var(--ink-soft)"
          tick={{ fontSize: 10, fill: "var(--ink-soft)", fontWeight: 700 }}
          tickLine={false}
          axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          width={42}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-paper border-2 border-ink shadow-[2px_2px_0_var(--ink)] p-3 text-xs">
                <p className="brut-label mb-1.5">Day {label}</p>
                {payload.map((p) => (
                  <p key={p.name as string} className="font-black tabular" style={{ color: p.color as string }}>
                    {p.name}: {formatCurrency(p.value as number)}
                  </p>
                ))}
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="pace"
          stroke="var(--ink-soft)"
          fill="none"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          name="Budget pace"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke={lineColor}
          fill="url(#spendGrad)"
          strokeWidth={3}
          name="Spent"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Category Donut ───────────────────────────────────────────────────────────
export function CategoryChart({ data }: { data: CatPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[210px] text-center">
        <p className="text-mute text-sm font-semibold">No spends yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={210}>
      <PieChart>
        <Pie
          data={data}
          cx="42%"
          cy="50%"
          innerRadius={50}
          outerRadius={82}
          paddingAngle={0}
          dataKey="value"
          stroke="var(--ink)"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={categoryColor(entry.name, i)} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-paper border-2 border-ink shadow-[2px_2px_0_var(--ink)] p-3 text-xs">
                <p className="brut-label">{payload[0].name as string}</p>
                <p className="font-black text-ink mt-0.5 tabular">{formatCurrency(payload[0].value as number)}</p>
              </div>
            );
          }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="square"
          iconSize={10}
          formatter={(value) => (
            <span className="text-[11px] text-ink font-bold uppercase tracking-wide">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
