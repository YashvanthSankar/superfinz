"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, SPENDING_CATEGORIES } from "@/lib/utils";
import type { Transaction } from "@/generated/prisma/client";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiNote, setAiNote] = useState<{ note: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ amount: "", category: "Food", description: "", date: new Date().toISOString().slice(0, 10) });

  const fetchTx = async () => {
    setLoading(true);
    const r = await fetch("/api/transactions");
    const d = await r.json();
    setTransactions(d.transactions ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTx(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAiNote(null);
    const r = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(form.amount), category: form.category, description: form.description, date: form.date }),
    });
    if (!r.ok) { setSubmitting(false); return; }
    const { transaction } = await r.json();

    const ar = await fetch("/api/ai-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: transaction.id, amount: transaction.amount, category: transaction.category, description: transaction.description }),
    });
    if (ar.ok) {
      const { aiNote: note, isNecessary } = await ar.json();
      setAiNote({ note, ok: isNecessary });
    }
    setForm({ amount: "", category: "Food", description: "", date: new Date().toISOString().slice(0, 10) });
    setSubmitting(false);
    fetchTx();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions((p) => p.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Transactions</h1>
          <p className="text-accent text-sm font-light mt-0.5">Track every rupee you spend</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setAiNote(null); }}>
          {showForm ? "Cancel" : "+ Add spend"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-background rounded-2xl border border-amber-400 p-6 shadow-sm">
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
                <div className="flex items-center gap-3 bg-text rounded-xl px-4 py-3">
                  <span className="text-lg">📈</span>
                  <p className="text-xs text-amber-200 leading-relaxed">
                    <span className="text-background font-bold">{fmt(amt)} today</span>
                    {" → "}
                    <span className="text-amber-300 font-bold">{fmt(future)} in 25 years</span>
                    <span className="text-amber-400/80"> if invested in NIFTY 50 (12% CAGR)</span>
                  </p>
                </div>
              );
            })()}

            <Input label="Description" placeholder="Biryani at Murugan's" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
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

      <div className="bg-background rounded-2xl border border-amber-400 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface">
          <h2 className="text-sm font-semibold text-text">All transactions</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
              <span className="text-2xl">💸</span>
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
                <div className="w-9 h-9 rounded-xl bg-background border border-amber-400 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-muted uppercase">{tx.category.slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-accent font-light">{new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    <span className="text-border">·</span>
                    <span className="text-xs text-accent font-light">{tx.category}</span>
                    {tx.isNecessary === false && <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-lg">unnecessary</span>}
                    {tx.isNecessary === true  && <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-lg">necessary</span>}
                  </div>
                  {tx.aiNote && <p className="text-[11px] text-accent mt-0.5 truncate font-light">{tx.aiNote}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-text">{formatCurrency(tx.amount)}</p>
                  <button onClick={() => handleDelete(tx.id)} className="text-xs text-border2 hover:text-red-400 transition-colors mt-0.5">remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
