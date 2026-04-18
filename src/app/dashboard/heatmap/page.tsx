"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, FetchError } from "@/lib/fetcher";

type HeatDay = { date: string; total: number; count: number };

function getIntensity(amount: number, max: number): number {
  if (amount === 0 || max === 0) return 0;
  return Math.ceil((amount / max) * 4);
}

const INTENSITY_CLASSES = [
  "bg-surface",
  "bg-amber-100",
  "bg-amber-200",
  "bg-amber-400",
  "bg-amber-600",
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
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<HeatDay | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    apiFetch<{ heatmap: HeatDay[] }>("/api/heatmap")
      .then((d) => setData(d.heatmap ?? []))
      .catch((err) => setError(err instanceof FetchError ? err.message : "Failed to load heatmap"))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const cells = buildCalendar(data);
  const max = data.reduce((m, d) => Math.max(m, d.total), 1);
  const totalSpend = data.reduce((s: number, d: HeatDay) => s + d.total, 0);
  const activeDays = data.filter((d: HeatDay) => d.total > 0).length;
  const avgPerActiveDay = activeDays > 0 ? totalSpend / activeDays : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Spending Heatmap</h1>
        <p className="text-accent text-sm mt-0.5 font-light">Your last 3 months at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total spent (3mo)", value: formatCurrency(totalSpend) },
          { label: "Active spend days", value: activeDays.toString() },
          { label: "Avg per spend day", value: formatCurrency(avgPerActiveDay) },
        ].map((s) => (
          <div key={s.label} className="bg-background rounded-2xl border border-surface p-5 shadow-sm">
            <p className="text-[10px] text-accent font-semibold uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-xl font-bold text-text">{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-600">{error}</span>
          <button onClick={load} className="text-xs font-semibold text-red-700 hover:underline">Retry</button>
        </div>
      )}

      <div className="bg-background rounded-2xl border border-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text mb-5">Activity</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] text-accent font-medium">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (cell.empty) return <div key={i} />;
                const intensity = getIntensity(cell.total, max);
                return (
                  <div
                    key={cell.date}
                    className={`aspect-square rounded-sm cursor-pointer border border-amber-300/80 transition-all hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 ${INTENSITY_CLASSES[intensity]}`}
                    onMouseEnter={() => setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 mt-4 justify-end">
              <span className="text-[10px] text-accent">Less</span>
              {INTENSITY_CLASSES.map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c} border border-amber-300/80`} />
              ))}
              <span className="text-[10px] text-accent">More</span>
            </div>

            {tooltip && tooltip.total > 0 && (
              <div className="mt-4 bg-background border border-amber-400 rounded-xl p-4 text-sm">
                <p className="font-semibold text-text">
                  {new Date(tooltip.date).toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </p>
                <p className="text-muted mt-0.5 font-light">
                  Spent <span className="text-amber-600 font-semibold">{formatCurrency(tooltip.total)}</span>{" "}
                  across {tooltip.count} transaction{tooltip.count !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {data.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted text-sm">No transaction data yet</p>
                <p className="text-accent text-xs mt-1 font-light">Log some spends to see your heatmap</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
