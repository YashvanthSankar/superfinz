"use client";
import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, SPENDING_CATEGORIES } from "@/lib/utils";
import type { Transaction } from "@prisma/client";

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍔", Transport: "🚗", Entertainment: "🎮", Shopping: "🛍️",
  Health: "💊", Education: "📚", Utilities: "💡", Rent: "🏠",
  Subscriptions: "📱", Other: "💸",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [aiNote, setAiNote] = useState<{ note: string; necessary: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const fetchTx = async () => {
    setLoading(true);
    const res = await fetch("/api/transactions");
    const data = await res.json();
    setTransactions(data.transactions ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTx(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAiNote(null);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        date: form.date,
      }),
    });

    if (!res.ok) { setSubmitting(false); return; }
    const { transaction } = await res.json();

    // AI check
    const aiRes = await fetch("/api/ai-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: transaction.id,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
      }),
    });

    if (aiRes.ok) {
      const { aiNote: note, isNecessary } = await aiRes.json();
      setAiNote({ note, necessary: isNecessary });
    }

    setForm({ amount: "", category: "Food", description: "", date: new Date().toISOString().slice(0, 10) });
    setSubmitting(false);
    fetchTx();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions 💳</h1>
          <p className="text-[#8888aa] text-sm mt-0.5">track every rupee</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setAiNote(null); }}>
          {showForm ? "Cancel" : "+ Add spend"}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card>
          <CardTitle className="mb-4">Log a spend</CardTitle>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount (₹)"
                type="number"
                placeholder="150"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {SPENDING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
                ))}
              </Select>
            </div>
            <Input
              label="Description"
              placeholder="Biryani at Murugan's"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <Button type="submit" loading={submitting} className="w-full">
              Log it 🚀
            </Button>
          </form>

          {/* AI note */}
          {aiNote && (
            <div
              className={`mt-4 p-4 rounded-xl border text-sm ${
                aiNote.necessary
                  ? "bg-[#00ff88]/5 border-[#00ff88]/20 text-[#00ff88]"
                  : "bg-orange-500/5 border-orange-500/20 text-orange-400"
              }`}
            >
              <p className="font-semibold mb-0.5">{aiNote.necessary ? "AI says: looks necessary ✅" : "AI says: 🤨"}</p>
              <p>{aiNote.note}</p>
            </div>
          )}
        </Card>
      )}

      {/* List */}
      <Card>
        <CardTitle className="mb-4">All transactions</CardTitle>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🫙</p>
            <p className="text-[#8888aa]">No transactions yet</p>
            <p className="text-[#4a4a6a] text-sm mt-1">Add your first spend above</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a3a]">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <span className="text-xl shrink-0">{CATEGORY_EMOJI[tx.category] ?? "💸"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#4a4a6a]">
                      {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-xs text-[#2a2a3a]">•</span>
                    <span className="text-xs text-[#4a4a6a]">{tx.category}</span>
                    {tx.isNecessary === false && (
                      <span className="text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded-md">
                        unnecessary
                      </span>
                    )}
                    {tx.isNecessary === true && (
                      <span className="text-xs bg-[#00ff88]/10 text-[#00ff88] px-1.5 py-0.5 rounded-md">
                        necessary
                      </span>
                    )}
                  </div>
                  {tx.aiNote && (
                    <p className="text-xs text-[#4a4a6a] mt-0.5 truncate">{tx.aiNote}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white">{formatCurrency(tx.amount)}</p>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-xs text-[#4a4a6a] hover:text-red-400 transition-colors mt-0.5"
                  >
                    remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
