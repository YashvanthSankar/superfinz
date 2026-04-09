"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, SPENDING_CATEGORIES } from "@/lib/utils";
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

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍜", Transport: "🚌", Entertainment: "🎮", Shopping: "🛍️",
  Health: "💊", Education: "📚", Utilities: "⚡", Rent: "🏠",
  Subscriptions: "📱", Other: "💸",
};

function pct(spent: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((spent / limit) * 100));
}

function statusColor(p: number) {
  if (p >= 100) return "bg-red-500";
  if (p >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

function statusBg(p: number) {
  if (p >= 100) return "bg-red-50 border-red-200";
  if (p >= 80) return "bg-amber-50 border-amber-200";
  return "bg-background border-surface";
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

  const fetchBudgets = async () => {
    setLoading(true);
    const r = await fetch(`/api/budgets?month=${month}&year=${year}`);
    const d = await r.json();
    setBudgets(d.budgets ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchBudgets(); }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter((b) => b.spent > b.limit);
  const healthyCount = budgets.filter((b) => b.limit > 0 && pct(b.spent, b.limit) < 80).length;

  const handleSave = async (category: string) => {
    const limit = parseFloat(editVal);
    if (isNaN(limit) || limit <= 0) return;
    setSaving(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, limit, month, year }),
    });
    setSaving(false);
    setEditing(null);
    setEditVal("");
    fetchBudgets();
  };

  const monthName = new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  // Build full list: all categories, merge with existing budgets
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

  const nearBudget = budgets.filter((b) => b.limit > 0 && pct(b.spent, b.limit) >= 80 && b.spent <= b.limit);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* ── Overspend alert banner ── */}
      {overBudget.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-2xl px-5 py-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={17} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-700">
              You&apos;ve exceeded your budget in {overBudget.length} {overBudget.length === 1 ? "category" : "categories"}
            </p>
            <p className="text-xs text-red-600 mt-1 leading-relaxed">
              {overBudget.map((b) => (
                <span key={b.category} className="inline-flex items-center gap-1 mr-2">
                  <span className="font-semibold">{b.category}</span>
                  <span className="opacity-70">— {formatCurrency(b.spent - b.limit)} over limit</span>
                </span>
              ))}
            </p>
          </div>
          <a
            href="/dashboard/transactions"
            className="shrink-0 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 border border-red-200 px-3 py-1.5 rounded-lg transition-all"
          >
            Review spends →
          </a>
        </div>
      )}

      {/* ── Near-limit warning ── */}
      {nearBudget.length > 0 && overBudget.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={17} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">Approaching limit in {nearBudget.length} {nearBudget.length === 1 ? "category" : "categories"}</p>
            <p className="text-xs text-amber-700 mt-1">
              {nearBudget.map((b) => `${b.category} (${pct(b.spent, b.limit)}%)`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text">Budgets</h1>
          <p className="text-sm text-muted mt-0.5">Set monthly limits per category and track your pace</p>
        </div>
        {/* Month picker */}
        <div className="flex items-center gap-2 bg-background border border-surface rounded-xl px-3 py-2 text-sm font-medium text-text shadow-sm">
          <button onClick={prevMonth} className="hover:text-amber-600 transition-colors px-1">‹</button>
          <span className="min-w-[130px] text-center">{monthName}</span>
          <button
            onClick={nextMonth}
            disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
            className="hover:text-amber-600 transition-colors px-1 disabled:opacity-30"
          >›</button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Budget", value: formatCurrency(totalLimit), icon: Wallet, color: "text-amber-600" },
          { label: "Total Spent", value: formatCurrency(totalSpent), icon: TrendingDown, color: "text-red-500" },
          { label: "Remaining", value: formatCurrency(Math.max(0, totalLimit - totalSpent)), icon: TrendingUp, color: "text-emerald-600" },
          { label: "Over-budget", value: `${overBudget.length} categor${overBudget.length === 1 ? "y" : "ies"}`, icon: AlertTriangle, color: overBudget.length ? "text-red-500" : "text-emerald-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-background border border-surface rounded-2xl p-4 shadow-sm">
            <Icon size={15} className={`${color} mb-2`} />
            <p className="text-xs text-muted">{label}</p>
            <p className="text-base font-bold text-text mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      {totalLimit > 0 && (
        <div className="bg-background border border-surface rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieChart size={15} className="text-amber-600" />
              <span className="text-sm font-semibold text-text">Overall budget usage</span>
            </div>
            <span className="text-sm font-bold text-text">{pct(totalSpent, totalLimit)}%</span>
          </div>
          <div className="h-2.5 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${statusColor(pct(totalSpent, totalLimit))}`}
              style={{ width: `${pct(totalSpent, totalLimit)}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2">
            {healthyCount} of {allCategories.filter((c) => c.limit > 0).length} categories on track
            {overBudget.length > 0 && ` · ${overBudget.map((b) => b.category).join(", ")} over limit`}
          </p>
        </div>
      )}

      {/* Category cards */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider px-1">Category limits</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          allCategories.map(({ category, limit, spent }) => {
            const p = pct(spent, limit);
            const isEditing = editing === category;
            return (
              <div
                key={category}
                className={`border rounded-2xl p-4 transition-all ${statusBg(limit > 0 ? p : 0)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl shrink-0">{CATEGORY_EMOJI[category]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text">{category}</span>
                        {limit > 0 && p >= 100 && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">OVER</span>
                        )}
                        {limit > 0 && p >= 80 && p < 100 && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">80%</span>
                        )}
                        {limit > 0 && p < 80 && (
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {limit > 0
                          ? `${formatCurrency(spent)} of ${formatCurrency(limit)}`
                          : "No limit set · tap Edit to add"}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted font-medium">₹</span>
                      <input
                        type="number"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(category); if (e.key === "Escape") setEditing(null); }}
                        autoFocus
                        className="w-24 text-sm border border-amber-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background"
                        placeholder="5000"
                      />
                      <button
                        onClick={() => handleSave(category)}
                        disabled={saving}
                        className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                      >
                        <Save size={13} />
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="p-1.5 rounded-lg bg-surface text-accent hover:bg-amber-100 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditing(category); setEditVal(limit > 0 ? String(limit) : ""); }}
                      className="shrink-0 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  )}
                </div>

                {limit > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${statusColor(p)}`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted">{p}% used</span>
                      <span className="text-[10px] text-muted">
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
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">💡 Budget tip</p>
        <p className="text-xs leading-relaxed">
          The 50/30/20 rule: spend 50% on needs (Rent, Food, Utilities), 30% on wants (Entertainment, Shopping), and save 20%.
          Set limits for each category above to get real-time alerts when you&apos;re close to the edge.
        </p>
      </div>
    </div>
  );
}
