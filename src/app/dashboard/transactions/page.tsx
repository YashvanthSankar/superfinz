"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, SPENDING_CATEGORIES } from "@/lib/utils";
import { apiFetch, FetchError } from "@/lib/fetcher";
import type { Transaction } from "@/generated/prisma/client";
import { TrendingUp, ArrowLeftRight, Download } from "lucide-react";

const stripEmoji = (s: string) =>
  s.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]/gu, "").trim();

function exportCSV(transactions: Transaction[]) {
  const header = "Date,Category,Description,Amount,Necessary,AI Note";
  const rows = transactions.map((tx) =>
    [
      new Date(tx.date).toLocaleDateString("en-IN"),
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount,
      tx.isNecessary === null ? "" : tx.isNecessary ? "Yes" : "No",
      tx.aiNote ? `"${tx.aiNote.replace(/"/g, '""')}"` : "",
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `superfinz-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<{ note: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ amount: "", category: "Food", description: "", date: new Date().toISOString().slice(0, 10) });

  const fetchTx = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const d = await apiFetch<{ transactions: Transaction[] }>("/api/transactions");
      setTransactions(d.transactions ?? []);
    } catch (err) {
      setFetchError(err instanceof FetchError ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTx(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setAiNote(null);

    try {
      const isoDate = form.date ? new Date(form.date).toISOString() : new Date().toISOString();
      const { transaction } = await apiFetch<{ transaction: Transaction }>("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          category: form.category,
          description: form.description,
          date: isoDate,
        }),
      });

      try {
        const { aiNote: note, isNecessary } = await apiFetch<{ aiNote: string; isNecessary: boolean }>(
          "/api/ai-check",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionId: transaction.id,
              amount: transaction.amount,
              category: transaction.category,
              description: transaction.description,
            }),
          }
        );
        setAiNote({ note, ok: isNecessary });
      } catch {
        // ai-check is non-critical; transaction already saved
      }

      setForm({ amount: "", category: "Food", description: "", date: new Date().toISOString().slice(0, 10) });
      fetchTx();
    } catch (err) {
      setSubmitError(err instanceof FetchError ? err.message : "Could not add transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const snapshot = transactions;
    setTransactions((p) => p.filter((t) => t.id !== id));
    try {
      await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
    } catch {
      setTransactions(snapshot);
      setFetchError("Failed to delete transaction");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="brut-label mb-1">Expense log</p>
          <h1 className="brut-display text-4xl sm:text-5xl text-ink">Transactions.</h1>
          <p className="text-ink-soft text-sm font-semibold mt-1">Track every rupee.</p>
        </div>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <button
              onClick={() => exportCSV(transactions)}
              className="brut-btn bg-paper text-ink text-xs h-10"
            >
              <Download size={13} strokeWidth={2.5} /> Export CSV
            </button>
          )}
          <Button variant="accent" onClick={() => { setShowForm(!showForm); setAiNote(null); }}>
            {showForm ? "Cancel" : "+ Add spend"}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="brut-card p-6">
          <p className="brut-label mb-4">Log a spend</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Amount (₹)" type="number" placeholder="150" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
              <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {SPENDING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>

            {/* Compound interest callout */}
            {parseFloat(form.amount) > 0 && (() => {
              const amt = parseFloat(form.amount);
              const future = Math.round(amt * Math.pow(1.12, 25));
              const fmt = (n: number) => n >= 100000
                ? `₹${(n / 100000).toFixed(1)}L`
                : `₹${n.toLocaleString("en-IN")}`;
              return (
                <div className="flex items-center gap-3 border-2 border-ink bg-accent-soft px-4 py-3">
                  <TrendingUp size={16} className="text-ink shrink-0" strokeWidth={2.5} />
                  <p className="text-xs text-ink leading-relaxed font-semibold tabular">
                    <span className="font-black">{fmt(amt)} today</span>
                    {" → "}
                    <span className="text-good font-black">{fmt(future)} in 25 yrs</span>
                    <span className="text-ink-soft"> @ 12% CAGR (NIFTY 50)</span>
                  </p>
                </div>
              );
            })()}

            <Input label="Description" placeholder="Biryani at Murugan's" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{submitError}</p>
            )}
            <Button type="submit" loading={submitting} className="w-full">Log spend</Button>
          </form>

          {aiNote && (
            <div className={`mt-4 p-4 border-2 border-ink text-sm ${
              aiNote.ok ? "bg-good-soft" : "bg-accent-soft"
            }`}>
              <p className="brut-label mb-1">{aiNote.ok ? "AI — Looks good" : "AI — Heads up"}</p>
              <p className="font-semibold text-ink">{aiNote.note}</p>
            </div>
          )}
        </div>
      )}

      <div className="brut-card overflow-hidden p-0">
        <div className="px-5 py-4 border-b-2 border-ink flex items-center justify-between bg-paper-2">
          <p className="brut-label">All transactions</p>
          {fetchError && (
            <button onClick={fetchTx} className="text-xs font-black uppercase text-bad hover:underline">
              {fetchError} — retry
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-ink border-t-transparent animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 border-2 border-ink bg-accent-soft flex items-center justify-center mb-4">
              <ArrowLeftRight size={22} className="text-ink" strokeWidth={2.5} />
            </div>
            <p className="brut-display text-2xl text-ink">No spends yet.</p>
            <p className="text-ink-soft text-sm font-semibold mt-1 max-w-xs">
              Log your first spend. Finz will tell you if it was worth it.
            </p>
            <Button variant="accent" className="mt-5" onClick={() => setShowForm(true)}>
              + Log your first spend
            </Button>
          </div>
        ) : (
          <div>
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? "border-t-2 border-ink" : ""} hover:bg-paper-2 transition-colors`}
              >
                <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black tracking-wider uppercase">{tx.category.slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-ink truncate">{tx.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-ink-soft font-semibold tabular">
                      {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-ink-soft">·</span>
                    <span className="text-[11px] text-ink-soft font-semibold">{tx.category}</span>
                    {tx.isNecessary === false && <span className="text-[9px] font-black uppercase tracking-wider bg-bad-soft text-bad border-2 border-ink px-1.5 py-0.5">skip</span>}
                    {tx.isNecessary === true && <span className="text-[9px] font-black uppercase tracking-wider bg-good-soft text-good border-2 border-ink px-1.5 py-0.5">ok</span>}
                  </div>
                  {tx.aiNote && <p className="text-[11px] text-ink-soft mt-1 truncate font-medium italic">{stripEmoji(tx.aiNote)}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-ink tabular">{formatCurrency(tx.amount)}</p>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-[10px] font-black uppercase tracking-wider text-mute hover:text-bad transition-colors mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
