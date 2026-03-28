"use client";
import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type HeatDay = { date: string; total: number; count: number };

function getIntensity(amount: number, max: number): number {
  if (amount === 0 || max === 0) return 0;
  return Math.ceil((amount / max) * 4);
}

const INTENSITY_COLORS = [
  "bg-[#1a1a24]",       // 0 - no spend
  "bg-[#00ff88]/20",    // 1
  "bg-[#00ff88]/40",    // 2
  "bg-[#00ff88]/65",    // 3
  "bg-[#00ff88]",       // 4 - max
];

function buildCalendar(days: HeatDay[]) {
  const map: Record<string, HeatDay> = {};
  for (const d of days) map[d.date] = d;

  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3);
  start.setDate(1);

  const cells: (HeatDay & { empty?: boolean })[] = [];
  // Fill blank days to align to Sunday
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Spending Heatmap 🗓️</h1>
        <p className="text-[#8888aa] text-sm mt-0.5">your last 3 months at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-[#8888aa] mb-1">Total spent (3mo)</p>
          <p className="text-lg font-bold text-white">{formatCurrency(totalSpend)}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8888aa] mb-1">Active days</p>
          <p className="text-lg font-bold text-white">{activeDays}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8888aa] mb-1">Avg per spend day</p>
          <p className="text-lg font-bold text-white">{formatCurrency(avgPerActiveDay)}</p>
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-4">Activity</CardTitle>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs text-[#4a4a6a]">{d}</div>
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
                    className={`aspect-square rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-[#00ff88] ${INTENSITY_COLORS[intensity]}`}
                    onMouseEnter={() => setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                    title={`${cell.date}: ${formatCurrency(cell.total)} (${cell.count} tx)`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-xs text-[#4a4a6a]">Less</span>
              {INTENSITY_COLORS.map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c} border border-[#2a2a3a]`} />
              ))}
              <span className="text-xs text-[#4a4a6a]">More</span>
            </div>

            {/* Tooltip */}
            {tooltip && tooltip.total > 0 && (
              <div className="mt-4 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-3 text-sm">
                <p className="text-white font-medium">
                  {new Date(tooltip.date).toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long"
                  })}
                </p>
                <p className="text-[#8888aa] mt-0.5">
                  Spent <span className="text-[#00ff88] font-semibold">{formatCurrency(tooltip.total)}</span> across{" "}
                  {tooltip.count} transaction{tooltip.count !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
