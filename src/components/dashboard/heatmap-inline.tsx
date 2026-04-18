"use client";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

type HeatDay = { date: string; total: number; count: number };

const INTENSITY = [
  "bg-surface",
  "bg-amber-100",
  "bg-amber-200",
  "bg-amber-400",
  "bg-amber-600",
];

function intensity(amount: number, max: number) {
  if (amount === 0 || max === 0) return 0;
  return Math.min(Math.ceil((amount / max) * 4), 4);
}

function buildGrid(days: HeatDay[]) {
  const map: Record<string, HeatDay> = {};
  for (const d of days) map[d.date] = d;

  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3);
  start.setDate(1);

  // Pad to start on Sunday
  const padStart = start.getDay();
  const cols: (HeatDay & { empty?: boolean })[][] = [];
  let week: (HeatDay & { empty?: boolean })[] = [];

  for (let i = 0; i < padStart; i++) {
    week.push({ date: "", total: 0, count: 0, empty: true });
  }

  const cursor = new Date(start);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    week.push(map[key] ?? { date: key, total: 0, count: 0 });
    if (week.length === 7) {
      cols.push(week);
      week = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length) {
    while (week.length < 7) week.push({ date: "", total: 0, count: 0, empty: true });
    cols.push(week);
  }
  return cols;
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function HeatmapInline({ data }: { data: HeatDay[] }) {
  const [tip, setTip] = useState<(HeatDay & { x: number; y: number }) | null>(null);
  const cols = buildGrid(data);
  const max = Math.max(...data.map((d) => d.total), 1);
  const totalSpend = data.reduce((s: number, d: HeatDay) => s + d.total, 0);
  const activeDays = data.filter((d: HeatDay) => d.total > 0).length;

  return (
    <div>
      {/* Stats row */}
      <div className="flex items-center gap-6 mb-4 text-xs text-accent">
        <span><span className="font-semibold text-text">{formatCurrency(totalSpend)}</span> in 3 months</span>
        <span><span className="font-semibold text-text">{activeDays}</span> active days</span>
        {activeDays > 0 && (
          <span><span className="font-semibold text-text">{formatCurrency(totalSpend / activeDays)}</span> avg/active day</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-fit">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1 shrink-0">
            <div className="h-4" /> {/* spacer for month row */}
            {DAY_LABELS.map((d, i) => (
              <div key={d} className={`h-3 text-[9px] text-accent flex items-center ${i % 2 === 0 ? "opacity-0" : ""}`}>{d}</div>
            ))}
          </div>

          {/* Week columns */}
          {cols.map((week, wi) => {
            // Show month label at week start if day 1 falls here
            const monthStart = week.find((c) => !c.empty && c.date?.slice(8) === "01");
            const monthLabel = monthStart ? MONTH_LABELS[parseInt(monthStart.date.slice(5, 7)) - 1] : null;

            return (
              <div key={wi} className="flex flex-col gap-1">
                <div className="h-4 text-[9px] text-accent flex items-center whitespace-nowrap">
                  {monthLabel ?? ""}
                </div>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-[2px] cursor-default border border-amber-300/80 transition-transform hover:scale-125 ${
                      cell.empty ? "opacity-0" : INTENSITY[intensity(cell.total, max)]
                    }`}
                    onMouseEnter={(e) => {
                      if (!cell.empty && cell.date) {
                        setTip({ ...cell, x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (!cell.empty && cell.date) {
                        setTip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));
                      }
                    }}
                    onMouseLeave={() => setTip(null)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tip && tip.date && (
        <div
          className="fixed z-50 pointer-events-none bg-background border border-amber-400 rounded-xl px-3 py-2 text-xs shadow-lg"
          style={{ left: tip.x + 14, top: tip.y + 14 }}
        >
          <p className="font-semibold text-text">
            {new Date(tip.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          {tip.total > 0 ? (
            <>
              <p className="text-accent mt-0.5">{formatCurrency(tip.total)}</p>
              <p className="text-accent">{tip.count} transaction{tip.count !== 1 ? "s" : ""}</p>
            </>
          ) : (
            <p className="text-accent mt-0.5">No spend</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-accent">Less</span>
        {INTENSITY.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-[2px] border border-amber-300/80 ${cls}`} />
        ))}
        <span className="text-[10px] text-accent">More</span>
      </div>
    </div>
  );
}
