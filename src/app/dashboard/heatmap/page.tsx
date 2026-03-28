"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type HeatDay = { date: string; total: number; count: number };

function getIntensity(amount: number, max: number): number {
  if (amount === 0 || max === 0) return 0;
  return Math.ceil((amount / max) * 4);
}

const INTENSITY_CLASSES = [
  "bg-[#f1f5f9]",        // 0 - no spend
  "bg-indigo-100",       // 1
  "bg-indigo-200",       // 2
  "bg-indigo-400",       // 3
  "bg-indigo-600",       // 4 - max
];

function buildCalendar(days: HeatDay[]) {
  const map: Record<string, HeatDay> = {};
  for (const d of days) map[d.date] = d;

  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3);
  start.setDate(1);

  const cells: (HeatDay & { empty?: boolean })[] = [];
  const startDay = start.getDay();
  for (let i = 0; i < startDay; i++) cells.push({ date: "", total: 0, count: 0, empty: true });

  const cursor = new Date(start);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    cells.push(map[key] ?? { date: key, total: 0, count: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HeatmapPage() {
  const [data, setData] = useState<HeatDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<HeatDay | null>(null);

  useEffect(() => {
    fetch("/api/heatmap")
      .then((r) => r.json())
      .then((d) => { setData(d.heatmap ?? []); setLoading(false); });
  }, []);

  const cells = buildCalendar(data);
  const max = Math.max(...data.map((d) => d.total), 1);
  const totalSpend = data.reduce((s, d) => s + d.total, 0);
  const activeDays = data.filter((d) => d.total > 0).length;
  const avgPerActiveDay = activeDays > 0 ? totalSpend / activeDays : 0;

  const STATS = [
    { label: "Total spent (3mo)", value: formatCurrency(totalSpend) },
    { label: "Active spend days", value: activeDays.toString() },
    { label: "Avg per spend day", value: formatCurrency(avgPerActiveDay) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Spending Heatmap</h1>
        <p className="text-[#94a3b8] text-sm mt-0.5 font-light">Your last 3 months at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <p className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide mb-2">{s.label}</p>
            <p className="text-xl font-bold text-[#0f172a]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#0f172a] mb-5">Activity</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] text-[#94a3b8] font-medium">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (cell.empty) return <div key={i} />;
                const intensity = getIntensity(cell.total, max);
                return (
                  <div
                    key={cell.date}
                    className={`aspect-square rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 ${INTENSITY_CLASSES[intensity]}`}
                    onMouseEnter={() => setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                    title={`${cell.date}: ${formatCurrency(cell.total)} (${cell.count} tx)`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-4 justify-end">
              <span className="text-[10px] text-[#94a3b8]">Less</span>
              {INTENSITY_CLASSES.map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c} border border-[#e2e8f0]`} />
              ))}
              <span className="text-[10px] text-[#94a3b8]">More</span>
            </div>

            {/* Tooltip info */}
            {tooltip && tooltip.total > 0 && (
              <div className="mt-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-sm">
                <p className="font-semibold text-[#0f172a]">
                  {new Date(tooltip.date).toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </p>
                <p className="text-[#64748b] mt-0.5 font-light">
                  Spent{" "}
                  <span className="text-indigo-600 font-semibold">{formatCurrency(tooltip.total)}</span>{" "}
                  across {tooltip.count} transaction{tooltip.count !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {data.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-[#64748b] text-sm">No transaction data yet</p>
                <p className="text-[#94a3b8] text-xs mt-1 font-light">Log some spends to see your heatmap</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
