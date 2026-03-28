"use client";
import { useEffect, useState } from "react";
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

  const active   = goals.filter((g) => !g.achieved);
  const achieved = goals.filter((g) => g.achieved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#713f12]">Goals</h1>
          <p className="text-[#b45309] text-sm mt-0.5 font-light">Stack your savings towards what matters</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New goal"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-[#fefce8] rounded-2xl border border-[#fde68a] p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#713f12] mb-5">Create a goal</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input label="Goal name" placeholder="New laptop, Trip to Goa..." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            <Input label="Target amount (₹)" type="number" placeholder="20000" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} required />
            <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            <Button type="submit" loading={submitting} className="w-full">Set goal</Button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : active.length === 0 && !showForm ? (
        <div className="bg-[#fefce8] rounded-2xl border border-[#fde68a] p-6 shadow-sm text-center py-16">
          <p className="text-[#78350f] font-medium">No goals yet</p>
          <p className="text-[#b45309] text-sm mt-1 font-light">Set a target and track your progress</p>
          <Button onClick={() => setShowForm(true)} className="mt-5">Create first goal</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {active.map((goal) => {
            const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.savedAmount;
            return (
              <div key={goal.id} className="bg-[#fefce8] rounded-2xl border border-[#fde68a] p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-[#713f12]">{goal.title}</h3>
                    {goal.deadline && (
                      <p className="text-xs text-[#b45309] mt-0.5 font-light">
                        by {new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    pct >= 100 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    pct >= 50  ? "bg-amber-50 text-amber-600 border-amber-100" :
                                 "bg-[#fefce8] text-[#78350f] border-[#fde68a]"
                  }`}>{pct.toFixed(0)}%</span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#78350f] font-light">{formatCurrency(goal.savedAmount)} saved</span>
                    <span className="text-[#713f12] font-semibold">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2 bg-[#fef9c3] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#b45309] font-light">{formatCurrency(remaining)} remaining</p>
                </div>

                <div className="flex gap-2">
                  {[500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addSavings(goal.id, goal.savedAmount, amt)}
                      className="flex-1 text-xs py-2 rounded-lg border border-[#fde68a] text-[#78350f] hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all font-medium"
                    >
                      +{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                  <button
                    onClick={() => markDone(goal.id)}
                    className="px-3 py-2 rounded-lg border border-[#fde68a] text-xs text-[#b45309] hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    title="Mark as achieved"
                  >
                    Done
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {achieved.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[#b45309] uppercase tracking-wide mb-3">Achieved</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {achieved.map((goal) => (
              <div key={goal.id} className="bg-[#fefce8] rounded-2xl border border-emerald-100 p-4 opacity-70">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <p className="text-[#713f12] font-medium text-sm">{goal.title}</p>
                  <span className="ml-auto text-emerald-600 text-sm font-semibold">{formatCurrency(goal.targetAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
