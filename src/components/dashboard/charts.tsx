"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const CAT_COLORS: Record<string, string> = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Entertainment: "#8b5cf6",
  Shopping: "#ec4899",
  Health: "#10b981",
  Education: "#6366f1",
  Utilities: "#f59e0b",
  Rent: "#64748b",
  Subscriptions: "#06b6d4",
  Other: "#94a3b8",
};
const FALLBACK = ["#6366f1","#f97316","#10b981","#ec4899","#3b82f6","#8b5cf6","#f59e0b","#06b6d4"];

type TrendPoint = { day: number; cumulative: number; pace: number };
type CatPoint   = { name: string; value: number };

// ─── Spending Trend ───────────────────────────────────────────────────────────
export function SpendTrendChart({ data }: { data: TrendPoint[] }) {
  const over = data.at(-1) ? data[data.length - 1].cumulative > data[data.length - 1].pace : false;

  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={over ? "#f43f5e" : "#6366f1"} stopOpacity={0.18} />
            <stop offset="95%" stopColor={over ? "#f43f5e" : "#6366f1"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="day"
          stroke="#e2e8f0"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}`}
          interval={4}
        />
        <YAxis
          stroke="#e2e8f0"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          width={42}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-[var(--bg)] border border-amber-400 rounded-xl p-3 text-xs shadow-md">
                <p className="text-[var(--accent)] mb-1.5 font-medium">Day {label}</p>
                {payload.map((p) => (
                  <p key={p.name as string} style={{ color: p.color as string }} className="font-semibold">
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
          stroke="#e2e8f0"
          fill="none"
          strokeDasharray="5 4"
          strokeWidth={1.5}
          name="Budget pace"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke={over ? "#f43f5e" : "#6366f1"}
          fill="url(#spendGrad)"
          strokeWidth={2}
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
        <p className="text-3xl mb-2">🫙</p>
        <p className="text-[var(--accent)] text-sm font-light">No spends yet</p>
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
          innerRadius={52}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={CAT_COLORS[entry.name] ?? FALLBACK[i % FALLBACK.length]}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-[var(--bg)] border border-amber-400 rounded-xl p-3 text-xs shadow-md">
                <p className="font-semibold text-[var(--text)]">{payload[0].name as string}</p>
                <p className="text-[var(--muted)] mt-0.5">{formatCurrency(payload[0].value as number)}</p>
              </div>
            );
          }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={7}
          formatter={(value) => (
            <span className="text-[11px] text-[var(--muted)]">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
