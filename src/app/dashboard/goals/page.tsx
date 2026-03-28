"use client";
import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { Goal } from "@prisma/client";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", targetAmount: "", deadline: "" });

  const fetchGoals = async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data.goals ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        targetAmount: parseFloat(form.targetAmount),
        deadline: form.deadline || undefined,
      }),
    });
    setForm({ title: "", targetAmount: "", deadline: "" });
    setShowForm(false);
    setSubmitting(false);
    fetchGoals();
  };

  const addSavings = async (id: string, current: number, amount: number) => {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, savedAmount: current + amount }),
    });
    fetchGoals();
  };

  const markDone = async (id: string) => {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, achieved: true }),
    });
    fetchGoals();
  };

  const active = goals.filter((g) => !g.achieved);
  const achieved = goals.filter((g) => g.achieved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals 🎯</h1>
          <p className="text-[#8888aa] text-sm mt-0.5">stack your Ls into Ws</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New goal"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardTitle className="mb-4">Create a goal</CardTitle>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input label="Goal name" placeholder="New laptop, Trip to Goa..." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            <Input label="Target amount (₹)" type="number" placeholder="20000" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} required />
            <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            <Button type="submit" loading={submitting} className="w-full">Set goal 🎯</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : active.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🎯</p>
          <p className="text-white font-semibold">No goals yet</p>
          <p className="text-[#8888aa] text-sm mt-1">Set a goal and start saving towards it</p>
          <Button onClick={() => setShowForm(true)} className="mt-4">Create first goal</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {active.map((goal) => {
            const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.savedAmount;
            return (
              <Card key={goal.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{goal.title}</h3>
                    {goal.deadline && (
                      <p className="text-xs text-[#4a4a6a] mt-0.5">
                        by {new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl">{pct >= 100 ? "🎉" : pct >= 50 ? "🔥" : "🌱"}</span>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8888aa]">{formatCurrency(goal.savedAmount)} saved</span>
                    <span className="text-white font-medium">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7c3aed] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#4a4a6a]">{pct.toFixed(1)}% — {formatCurrency(remaining)} to go</p>
                </div>

                <div className="flex gap-2">
                  {[500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addSavings(goal.id, goal.savedAmount, amt)}
                      className="flex-1 text-xs py-2 rounded-lg border border-[#2a2a3a] text-[#8888aa] hover:border-[#00ff88] hover:text-[#00ff88] transition-all"
                    >
                      +₹{(amt / 100).toFixed(0)}00
                    </button>
                  ))}
                  <button
                    onClick={() => markDone(goal.id)}
                    className="px-3 py-2 rounded-lg border border-[#2a2a3a] text-xs text-[#4a4a6a] hover:border-green-500/30 hover:text-[#00ff88] transition-all"
                  >
                    ✓
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {achieved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#8888aa] mb-3">Achieved 🏆</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {achieved.map((goal) => (
              <div key={goal.id} className="bg-[#111118] border border-[#00ff88]/20 rounded-2xl p-5 opacity-60">
                <div className="flex items-center gap-2">
                  <span>🏆</span>
                  <p className="text-white font-medium">{goal.title}</p>
                  <span className="ml-auto text-[#00ff88] text-sm">{formatCurrency(goal.targetAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
