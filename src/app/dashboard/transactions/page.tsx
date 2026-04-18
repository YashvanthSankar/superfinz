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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Transactions</h1>
          <p className="text-accent text-sm font-light mt-0.5">Track every rupee you spend</p>
        </div>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <button
              onClick={() => exportCSV(transactions)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface text-xs font-medium text-accent hover:text-amber-700 hover:bg-amber-50 transition-all"
            >
              <Download size={13} /> Export CSV
            </button>
          )}
          <Button onClick={() => { setShowForm(!showForm); setAiNote(null); }}>
            {showForm ? "Cancel" : "+ Add spend"}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-background rounded-2xl border border-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text mb-5">Log a spend</h2>
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
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <TrendingUp size={16} className="text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">{fmt(amt)} today</span>
                    {" → "}
                    <span className="text-emerald-700 font-bold">{fmt(future)} in 25 yrs</span>
                    <span className="text-amber-600"> if invested in NIFTY 50 (12% CAGR)</span>
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
            <div className={`mt-4 p-4 rounded-xl border text-sm ${
              aiNote.ok
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-amber-50 border-amber-100 text-amber-800"
            }`}>
              <p className="font-semibold text-xs uppercase tracking-wide mb-1">{aiNote.ok ? "AI — Looks good" : "AI — Heads up"}</p>
              <p className="font-light">{aiNote.note}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-background rounded-2xl border border-surface shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">All transactions</h2>
          {fetchError && (
            <button onClick={fetchTx} className="text-xs text-red-600 hover:underline">
              {fetchError} — retry
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
              <ArrowLeftRight size={22} className="text-amber-600" />
            </div>
            <p className="font-semibold text-text">No transactions yet</p>
            <p className="text-accent text-sm mt-1 font-light max-w-xs">
              Log your first spend and Finz will tell you if it was really worth it
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-all"
            >
              + Log your first spend
            </button>
          </div>
        ) : (
          <div className="divide-y divide-background">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-4 hover:bg-background transition-colors">
                <div className="w-9 h-9 rounded-xl bg-background border border-surface flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-muted uppercase">{tx.category.slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-accent font-light">{new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    <span className="text-accent/40">·</span>
                    <span className="text-xs text-accent font-light">{tx.category}</span>
                    {tx.isNecessary === false && <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5 rounded-md">skip</span>}
                    {tx.isNecessary === true  && <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md">ok</span>}
                  </div>
                  {tx.aiNote && <p className="text-[11px] text-accent mt-0.5 truncate font-light">{stripEmoji(tx.aiNote)}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-text">{formatCurrency(tx.amount)}</p>
                  <button onClick={() => handleDelete(tx.id)} className="text-xs text-accent/40 hover:text-red-500 transition-colors mt-0.5">remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
