"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, FetchError } from "@/lib/fetcher";
import type { Goal } from "@/generated/prisma/client";
import { Flame, Target, CheckCircle2, Plus } from "lucide-react";

function retireAge(currentAge: number, monthlySavings: number, corpus: number): number | null {
  if (monthlySavings <= 0) return null;
  const r = 0.12 / 12;
  for (let n = 1; n <= 600; n++) {
    const fv = monthlySavings * (Math.pow(1 + r, n) - 1) / r;
    if (fv >= corpus) return currentAge + Math.ceil(n / 12);
  }
  return null;
}

function fmtCr(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  return `₹${(n / 100000).toFixed(1)}L`;
}

function FIRECard({ onAddFund }: { onAddFund: (title: string, amount: number) => void }) {
  const [monthly, setMonthly] = useState("");
  const [expenses, setExpenses] = useState("");
  const [age, setAge] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ user: { age?: number; profile?: { monthlySalary?: number; monthlyAllowance?: number; savingsGoal?: number } } }>("/api/profile")
      .then(({ user }) => {
        if (cancelled || !user) return;
        if (user.age) setAge(String(user.age));
        const income = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0;
        const savings = user.profile?.savingsGoal ?? 0;
        if (savings > 0) setMonthly(String(savings));
        if (income > 0 && income > savings) setExpenses(String(income - savings));
      })
      .catch(() => { /* fall back to empty inputs */ });
    return () => { cancelled = true; };
  }, []);

  // Derived directly from inputs — no effect needed.
  const result = (() => {
    const m = parseFloat(monthly);
    const e = parseFloat(expenses);
    const a = parseInt(age);
    if (!(m > 0) || !(e > 0) || !(a > 0)) return null;
    const corpus = e * 12 * 25;
    return { corpus, retireAt: retireAge(a, m, corpus) };
  })();

  return (
    <div className="brut-card p-5">
      <div className="flex items-center gap-2 mb-1 pb-3 border-b-2 border-ink">
        <div className="w-8 h-8 bg-accent border-2 border-ink flex items-center justify-center shrink-0">
          <Flame size={14} className="text-paper" strokeWidth={2.5} />
        </div>
        <p className="brut-label">Freedom Number</p>
        <span className="ml-auto brut-stamp bg-ink text-paper border-ink">FIRE</span>
      </div>
      <p className="text-xs text-ink-soft font-semibold mb-4 mt-3">How much corpus do you need to never work again?</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Monthly savings (₹)", placeholder: "3,000", value: monthly, set: setMonthly },
          { label: "Monthly expenses (₹)", placeholder: "15,000", value: expenses, set: setExpenses },
          { label: "Current age", placeholder: "21", value: age, set: setAge },
        ].map(({ label, placeholder, value, set }) => (
          <div key={label}>
            <label className="brut-label block mb-1.5">{label}</label>
            <input
              type="number"
              placeholder={placeholder}
              value={value}
              onChange={(e) => set(e.target.value)}
              className="w-full bg-paper border-2 border-ink px-3 h-10 text-sm text-ink font-bold tabular placeholder:text-mute placeholder:font-normal focus:outline-none focus:bg-accent-soft [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        ))}
      </div>

      {result && (
        <div className="mt-4 border-2 border-ink bg-paper-2 p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="brut-label mb-1">Corpus needed</p>
            <p className="brut-display text-2xl text-ink tabular">{fmtCr(result.corpus)}</p>
            <p className="text-[11px] text-ink-soft font-semibold mt-0.5">at 4% drawdown</p>
          </div>
          <div>
            <p className="brut-label mb-1">Retire at age</p>
            <p className={`brut-display text-2xl tabular ${
              result.retireAt && result.retireAt <= 45 ? "text-good"
              : result.retireAt && result.retireAt <= 55 ? "text-accent"
              : "text-bad"
            }`}>
              {result.retireAt ? `${result.retireAt} yrs` : "50+ yrs"}
            </p>
            {result.retireAt && result.retireAt > 50 && (
              <p className="text-[11px] text-ink-soft font-semibold mt-0.5">save more to retire earlier</p>
            )}
          </div>
          <button
            onClick={() => onAddFund("Freedom Fund", result.corpus)}
            className="col-span-2 brut-btn bg-ink text-paper text-xs h-10"
          >
            + Add as savings goal
          </button>
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", targetAmount: "", deadline: "" });

  const fetchGoals = async () => {
    setLoadError(null);
    try {
      const data = await apiFetch<{ goals: Goal[] }>("/api/goals");
      setGoals(data.goals ?? []);
    } catch (err) {
      setLoadError(err instanceof FetchError ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiFetch("/api/goals", {
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
      fetchGoals();
    } catch (err) {
      setSubmitError(err instanceof FetchError ? err.message : "Could not create goal");
    } finally {
      setSubmitting(false);
    }
  };

  const addSavings = async (id: string, current: number, amount: number) => {
    const snapshot = goals;
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, savedAmount: current + amount } : g)));
    try {
      await apiFetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, savedAmount: current + amount }),
      });
    } catch {
      setGoals(snapshot);
      setLoadError("Failed to update savings");
    }
  };

  const markDone = async (id: string) => {
    const snapshot = goals;
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, achieved: true } : g)));
    try {
      await apiFetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, achieved: true }),
      });
    } catch {
      setGoals(snapshot);
      setLoadError("Failed to mark as done");
    }
  };

  const active   = goals.filter((g) => !g.achieved);
  const achieved = goals.filter((g) => g.achieved);

  const prefillFire = (title: string, amount: number) => {
    setForm({ title, targetAmount: String(Math.round(amount)), deadline: "" });
    setShowForm(true);
    setTimeout(() => document.getElementById("goals-form")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="brut-label mb-1">Savings</p>
          <h1 className="brut-display text-4xl sm:text-5xl text-ink">Goals.</h1>
          <p className="text-ink-soft text-sm font-semibold mt-1">Stack money toward what matters.</p>
        </div>
        <Button variant="accent" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New goal"}
        </Button>
      </div>

      <FIRECard onAddFund={prefillFire} />

      {showForm && (
        <div id="goals-form" className="brut-card p-6">
          <p className="brut-label mb-5">Create a goal</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input label="Goal name" placeholder="New laptop, Trip to Goa..." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            <Input label="Target amount (₹)" type="number" placeholder="20000" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} required />
            <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{submitError}</p>
            )}
            <Button type="submit" loading={submitting} className="w-full">Set goal</Button>
          </form>
        </div>
      )}

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-600">{loadError}</span>
          <button onClick={fetchGoals} className="text-xs font-semibold text-red-700 hover:underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : active.length === 0 && !showForm ? (
        <div className="brut-card overflow-hidden p-0">
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-16 h-16 border-2 border-ink bg-accent-soft flex items-center justify-center mb-4">
              <Target size={24} className="text-ink" strokeWidth={2.5} />
            </div>
            <p className="brut-display text-2xl text-ink">No goals yet.</p>
            <p className="text-ink-soft text-sm font-semibold mt-1 max-w-xs">
              Set a target. Track every rupee toward it.
            </p>
            <Button variant="accent" className="mt-5" onClick={() => setShowForm(true)}>
              <Plus size={14} strokeWidth={2.5} /> Set your first goal
            </Button>
          </div>
          <div className="border-t-2 border-ink px-5 py-4 bg-paper-2">
            <p className="brut-label mb-3">Popular starters</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Emergency Fund", amount: "50000" },
                { label: "New Laptop", amount: "80000" },
                { label: "Trip to Goa", amount: "15000" },
                { label: "Investment Corpus", amount: "100000" },
              ].map(({ label, amount }) => (
                <button
                  key={label}
                  onClick={() => { setForm({ title: label, targetAmount: amount, deadline: "" }); setShowForm(true); }}
                  className="brut-btn bg-paper text-ink text-[11px] h-8 px-3"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {active.map((goal) => {
            const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.savedAmount;
            return (
              <div key={goal.id} className="brut-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="brut-display text-xl text-ink">{goal.title}</p>
                    {goal.deadline && (
                      <p className="text-[11px] text-ink-soft mt-0.5 font-bold tabular">
                        by {new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 border-2 border-ink tabular ${
                    pct >= 100 ? "bg-good text-paper" :
                    pct >= 50 ? "bg-accent text-paper" :
                    "bg-paper-2 text-ink"
                  }`}>{pct.toFixed(0)}%</span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft font-bold tabular">{formatCurrency(goal.savedAmount)} saved</span>
                    <span className="text-ink font-black tabular">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-3 bg-paper-2 border-2 border-ink overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${pct >= 100 ? "bg-good" : "bg-accent"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-ink-soft font-bold tabular">{formatCurrency(remaining)} remaining</p>
                </div>

                <div className="flex gap-2">
                  {[500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addSavings(goal.id, goal.savedAmount, amt)}
                      className="flex-1 brut-btn bg-paper text-ink text-xs h-9"
                    >
                      +{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                  <button
                    onClick={() => markDone(goal.id)}
                    className="brut-btn bg-good text-paper text-xs h-9 px-3"
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
          <p className="brut-label mb-3">Achieved</p>
          <div className="grid md:grid-cols-2 gap-3">
            {achieved.map((goal) => (
              <div key={goal.id} className="border-2 border-ink bg-good-soft p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-good shrink-0" strokeWidth={2.5} />
                  <p className="text-ink font-black text-sm flex-1 truncate">{goal.title}</p>
                  <span className="text-good font-black text-sm tabular">{formatCurrency(goal.targetAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
