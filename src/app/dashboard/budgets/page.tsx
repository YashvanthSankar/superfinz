"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, FetchError } from "@/lib/fetcher";
import { SPENDING_CATEGORIES, categoryEmoji } from "@/lib/categories";
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Edit3, Save, X, PieChart,
} from "lucide-react";

type Budget = {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: number;
  year: number;
};

function pct(spent: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((spent / limit) * 100));
}

function statusColor(p: number) {
  if (p >= 100) return "bg-bad";
  if (p >= 80) return "bg-warn";
  return "bg-good";
}

function statusBg(p: number) {
  if (p >= 100) return "bg-bad-soft";
  if (p >= 80) return "bg-warn-soft";
  return "bg-paper";
}

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const d = await apiFetch<{ budgets: Budget[] }>(`/api/budgets?month=${month}&year=${year}`);
      setBudgets(d.budgets ?? []);
    } catch (err) {
      setLoadError(err instanceof FetchError ? err.message : "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter((b) => b.spent > b.limit);
  const healthyCount = budgets.filter((b) => b.limit > 0 && pct(b.spent, b.limit) < 80).length;
  const nearBudget = budgets.filter((b) => b.limit > 0 && pct(b.spent, b.limit) >= 80 && b.spent <= b.limit);

  const handleSave = async (category: string) => {
    const limit = parseFloat(editVal);
    if (!Number.isFinite(limit) || limit <= 0) return;
    setSaving(true);
    setLoadError(null);
    try {
      await apiFetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, limit, month, year }),
      });
      setEditing(null);
      setEditVal("");
      fetchBudgets();
    } catch (err) {
      setLoadError(err instanceof FetchError ? err.message : "Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  const allCategories = SPENDING_CATEGORIES.map((cat) => {
    const existing = budgets.find((b) => b.category === cat);
    return existing ?? { id: "", category: cat, limit: 0, spent: 0, month, year };
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="max-w-3xl mx-auto px-0 space-y-6">

      {/* ── Overspend alert ── */}
      {overBudget.length > 0 && (
        <div className="flex items-start gap-3 border-2 border-ink bg-bad-soft px-5 py-4 shadow-[4px_4px_0_var(--ink)]">
          <div className="w-10 h-10 border-2 border-ink bg-bad flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={18} className="text-paper" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="brut-label text-bad">
              Exceeded {overBudget.length} {overBudget.length === 1 ? "category" : "categories"}
            </p>
            <p className="text-xs text-ink mt-1 font-semibold">
              {overBudget.map((b) => (
                <span key={b.category} className="inline-flex items-center gap-1 mr-2">
                  <span className="font-black">{b.category}</span>
                  <span className="text-ink-soft tabular">— {formatCurrency(b.spent - b.limit)} over</span>
                </span>
              ))}
            </p>
          </div>
          <Link href="/dashboard/transactions" className="brut-btn bg-bad text-paper text-[11px] h-9 px-3 shrink-0">
            Review →
          </Link>
        </div>
      )}

      {/* ── Near-limit ── */}
      {nearBudget.length > 0 && overBudget.length === 0 && (
        <div className="flex items-start gap-3 border-2 border-ink bg-warn-soft px-5 py-4 shadow-[4px_4px_0_var(--ink)]">
          <div className="w-10 h-10 border-2 border-ink bg-warn flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={18} className="text-ink" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="brut-label">
              Approaching limit · {nearBudget.length} {nearBudget.length === 1 ? "category" : "categories"}
            </p>
            <p className="text-xs text-ink mt-1 font-bold tabular">
              {nearBudget.map((b) => `${b.category} (${pct(b.spent, b.limit)}%)`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="border-2 border-ink bg-bad-soft px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-bad font-bold">{loadError}</span>
          <button onClick={fetchBudgets} className="brut-btn bg-bad text-paper text-[11px] h-8 px-3">Retry</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="brut-label mb-1">Monthly limits</p>
          <h1 className="brut-display text-4xl sm:text-5xl text-ink">Budgets.</h1>
          <p className="text-ink-soft text-sm font-semibold mt-1">Cap each category. Track your pace.</p>
        </div>
        <div className="flex items-center gap-1 border-2 border-ink bg-paper px-1 py-1 shadow-[2px_2px_0_var(--ink)]">
          <button onClick={prevMonth} className="px-2 h-8 hover:bg-paper-2 font-black">‹</button>
          <span className="min-w-[130px] text-center tabular uppercase text-xs font-black tracking-wider">{monthName}</span>
          <button
            onClick={nextMonth}
            disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
            className="px-2 h-8 hover:bg-paper-2 disabled:opacity-30 font-black"
          >›</button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Budget", value: formatCurrency(totalLimit), icon: Wallet, tone: "text-ink" },
          { label: "Total Spent", value: formatCurrency(totalSpent), icon: TrendingDown, tone: "text-bad" },
          { label: "Remaining", value: formatCurrency(Math.max(0, totalLimit - totalSpent)), icon: TrendingUp, tone: "text-good" },
          { label: "Over", value: `${overBudget.length}`, icon: AlertTriangle, tone: overBudget.length ? "text-bad" : "text-good" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="brut-card p-4">
            <Icon size={16} className={`${tone} mb-2`} strokeWidth={2.5} />
            <p className="brut-label">{label}</p>
            <p className="brut-display text-2xl text-ink mt-1 tabular">{value}</p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      {totalLimit > 0 && (
        <div className="brut-card p-5">
          <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-ink">
            <div className="flex items-center gap-2">
              <PieChart size={16} className="text-ink" strokeWidth={2.5} />
              <p className="brut-label">Overall usage</p>
            </div>
            <span className="brut-display text-xl text-ink tabular">{pct(totalSpent, totalLimit)}%</span>
          </div>
          <div className="h-4 bg-paper-2 border-2 border-ink overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${statusColor(pct(totalSpent, totalLimit))}`}
              style={{ width: `${pct(totalSpent, totalLimit)}%` }}
            />
          </div>
          <p className="text-xs text-ink-soft mt-3 font-semibold">
            {healthyCount} of {allCategories.filter((c) => c.limit > 0).length} categories on track
            {overBudget.length > 0 && ` · ${overBudget.map((b) => b.category).join(", ")} over`}
          </p>
        </div>
      )}

      {/* Category cards */}
      <div className="space-y-3">
        <p className="brut-label px-1">Category limits</p>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 border-2 border-ink bg-paper-2 animate-pulse" />
            ))}
          </div>
        ) : (
          allCategories.map(({ category, limit, spent }) => {
            const p = pct(spent, limit);
            const isEditing = editing === category;
            return (
              <div
                key={category}
                className={`border-2 border-ink p-4 transition-all shadow-[2px_2px_0_var(--ink)] ${statusBg(limit > 0 ? p : 0)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl shrink-0">{categoryEmoji(category)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-ink">{category}</span>
                        {limit > 0 && p >= 100 && (
                          <span className="brut-stamp bg-bad text-paper">OVER</span>
                        )}
                        {limit > 0 && p >= 80 && p < 100 && (
                          <span className="brut-stamp bg-warn text-ink">80%</span>
                        )}
                        {limit > 0 && p < 80 && (
                          <CheckCircle2 size={14} className="text-good" strokeWidth={2.5} />
                        )}
                      </div>
                      <p className="text-xs text-ink-soft mt-0.5 font-semibold tabular">
                        {limit > 0
                          ? `${formatCurrency(spent)} of ${formatCurrency(limit)}`
                          : "No limit set"}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-ink font-black">₹</span>
                      <input
                        type="number"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(category); if (e.key === "Escape") setEditing(null); }}
                        autoFocus
                        className="w-24 text-sm font-bold tabular border-2 border-ink bg-paper px-2 h-9 focus:outline-none focus:bg-accent-soft"
                        placeholder="5000"
                      />
                      <button
                        onClick={() => handleSave(category)}
                        disabled={saving}
                        className="brut-btn bg-ink text-paper h-9 w-9 !p-0"
                        title="Save"
                      >
                        <Save size={14} strokeWidth={2.75} className="text-paper" />
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="brut-btn bg-paper text-ink h-9 w-9 !p-0"
                        title="Cancel"
                      >
                        <X size={14} strokeWidth={2.75} className="text-ink" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditing(category); setEditVal(limit > 0 ? String(limit) : ""); }}
                      className="brut-btn bg-paper text-ink text-[11px] h-9 px-3 shrink-0"
                    >
                      <Edit3 size={12} strokeWidth={2.5} /> Edit
                    </button>
                  )}
                </div>

                {limit > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-paper border-2 border-ink overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${statusColor(p)}`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-ink-soft font-black uppercase tracking-wider tabular">{p}% used</span>
                      <span className="text-[10px] text-ink-soft font-black uppercase tracking-wider tabular">
                        {p >= 100
                          ? `${formatCurrency(spent - limit)} over`
                          : `${formatCurrency(limit - spent)} left`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tip */}
      <div className="border-2 border-ink bg-accent-soft p-4 shadow-[4px_4px_0_var(--ink)]">
        <p className="brut-label mb-2">50/30/20 rule</p>
        <p className="text-xs leading-relaxed text-ink font-semibold">
          Spend 50% on needs (Rent, Food, Utilities), 30% on wants (Entertainment, Shopping), save 20%.
          Set limits above to get real-time alerts.
        </p>
      </div>
    </div>
  );
}
