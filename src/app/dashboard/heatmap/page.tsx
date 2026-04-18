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
  "bg-paper-2",
  "bg-accent-soft",
  "bg-accent-mid",
  "bg-accent",
  "bg-ink",
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
        <p className="brut-label mb-1">Last 3 months</p>
        <h1 className="brut-display text-4xl sm:text-5xl text-ink">Heatmap.</h1>
        <p className="text-ink-soft text-sm font-semibold mt-1">Your spending at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total (3mo)", value: formatCurrency(totalSpend) },
          { label: "Active days", value: activeDays.toString() },
          { label: "Avg / active day", value: formatCurrency(avgPerActiveDay) },
        ].map((s) => (
          <div key={s.label} className="brut-card p-5">
            <p className="brut-label">{s.label}</p>
            <p className="brut-display text-3xl text-ink mt-2 tabular">{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="border-2 border-ink bg-bad-soft px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-bad font-bold">{error}</span>
          <button onClick={load} className="brut-btn bg-bad text-paper text-[11px] h-8 px-3">Retry</button>
        </div>
      )}

      <div className="brut-card p-6">
        <p className="brut-label mb-5 pb-3 border-b-2 border-ink">Activity</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-ink border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center brut-label text-[10px]">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (cell.empty) return <div key={i} />;
                const intensity = getIntensity(cell.total, max);
                return (
                  <div
                    key={cell.date}
                    className={`aspect-square border-2 border-ink cursor-pointer transition-transform hover:scale-110 ${INTENSITY_CLASSES[intensity]}`}
                    onMouseEnter={() => setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 mt-4 justify-end">
              <span className="brut-label text-[10px]">Less</span>
              {INTENSITY_CLASSES.map((c, i) => (
                <div key={i} className={`w-4 h-4 border-2 border-ink ${c}`} />
              ))}
              <span className="brut-label text-[10px]">More</span>
            </div>

            {tooltip && tooltip.total > 0 && (
              <div className="mt-4 border-2 border-ink bg-accent-soft p-4">
                <p className="brut-display text-lg text-ink">
                  {new Date(tooltip.date).toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </p>
                <p className="text-ink-soft mt-1 text-sm font-semibold tabular">
                  Spent <span className="text-accent font-black">{formatCurrency(tooltip.total)}</span>{" "}
                  across <span className="font-black">{tooltip.count}</span> transaction{tooltip.count !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {data.length === 0 && (
              <div className="text-center py-8">
                <p className="brut-display text-2xl text-ink">No data yet.</p>
                <p className="text-ink-soft text-sm mt-1 font-semibold">Log some spends to see your heatmap.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
