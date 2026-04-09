"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
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
  const [result, setResult] = useState<{ corpus: number; retireAt: number | null } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return;
        if (user.age) setAge(String(user.age));
        const income = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0;
        const savings = user.profile?.savingsGoal ?? 0;
        if (savings > 0) setMonthly(String(savings));
        if (income > 0 && income > savings) setExpenses(String(income - savings));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const m = parseFloat(monthly);
    const e = parseFloat(expenses);
    const a = parseInt(age);
    if (m > 0 && e > 0 && a > 0) {
      const corpus = e * 12 * 25;
      setResult({ corpus, retireAt: retireAge(a, m, corpus) });
    }
  }, [loaded, monthly, expenses, age]);

  const recalc = () => {
    const m = parseFloat(monthly);
    const e = parseFloat(expenses);
    const a = parseInt(age);
    if (!m || !e || !a) return;
    const corpus = e * 12 * 25;
    setResult({ corpus, retireAt: retireAge(a, m, corpus) });
  };

  return (
    <div className="bg-background rounded-2xl border border-surface p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <Flame size={14} className="text-amber-600" />
        </div>
        <div>
          <h2 className="font-semibold text-sm text-text">Freedom Number</h2>
        </div>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-accent bg-surface border border-border px-2 py-0.5 rounded-full">FIRE</span>
      </div>
      <p className="text-xs text-accent font-light mb-4 mt-1">How much corpus do you need to never work again?</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Monthly savings (₹)", placeholder: "3,000", value: monthly, set: setMonthly },
          { label: "Monthly expenses (₹)", placeholder: "15,000", value: expenses, set: setExpenses },
          { label: "Current age", placeholder: "21", value: age, set: setAge },
        ].map(({ label, placeholder, value, set }) => (
          <div key={label}>
            <label className="text-[10px] text-muted font-medium uppercase tracking-wide block mb-1.5">{label}</label>
            <input
              type="number"
              placeholder={placeholder}
              value={value}
              onChange={(e) => set(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text placeholder-accent/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={recalc}
        className="w-full py-2.5 rounded-xl border border-surface bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 hover:border-amber-500 transition-all"
      >
        Recalculate
      </button>

      {result && (
        <div className="mt-4 bg-surface rounded-xl p-4 border border-border grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-wide mb-1">Corpus needed</p>
            <p className="text-xl font-black text-text">{fmtCr(result.corpus)}</p>
            <p className="text-[11px] text-accent font-light mt-0.5">at 4% annual drawdown</p>
          </div>
          <div>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-wide mb-1">Retire at age</p>
            <p className={`text-xl font-black ${
              result.retireAt && result.retireAt <= 45 ? "text-emerald-600"
              : result.retireAt && result.retireAt <= 55 ? "text-amber-700"
              : "text-red-600"
            }`}>
              {result.retireAt ? `${result.retireAt} yrs` : "50+ yrs"}
            </p>
            {result.retireAt && result.retireAt > 50 && (
              <p className="text-[10px] text-accent font-light mt-0.5">increase savings to retire earlier</p>
            )}
          </div>
          <button
            onClick={() => onAddFund("Freedom Fund", result.corpus)}
            className="col-span-2 py-2 rounded-lg border border-border text-xs text-accent hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-all font-medium"
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

  const prefillFire = (title: string, amount: number) => {
    setForm({ title, targetAmount: String(Math.round(amount)), deadline: "" });
    setShowForm(true);
    setTimeout(() => document.getElementById("goals-form")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Goals</h1>
          <p className="text-accent text-sm mt-0.5 font-light">Stack your savings towards what matters</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New goal"}
        </Button>
      </div>

      <FIRECard onAddFund={prefillFire} />

      {showForm && (
        <div id="goals-form" className="bg-background rounded-2xl border border-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text mb-5">Create a goal</h2>
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
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : active.length === 0 && !showForm ? (
        <div className="bg-background rounded-2xl border border-surface shadow-sm">
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
              <Target size={22} className="text-accent" />
            </div>
            <p className="font-semibold text-text">No goals yet</p>
            <p className="text-accent text-sm mt-1 font-light max-w-xs">
              Set a target — MacBook, trip, emergency fund — and track every rupee toward it
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-surface bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-all"
            >
              <Plus size={14} /> Set your first goal
            </button>
          </div>
          <div className="border-t border-surface px-5 py-4">
            <p className="text-xs text-accent font-medium mb-3">Popular goals to get started</p>
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
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-accent hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-all font-medium"
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
              <div key={goal.id} className="bg-background rounded-2xl border border-surface p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-text">{goal.title}</h3>
                    {goal.deadline && (
                      <p className="text-xs text-accent mt-0.5 font-light">
                        by {new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    pct >= 100 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                    pct >= 50  ? "bg-amber-50 text-amber-700 border-amber-200" :
                                 "bg-surface text-muted border-border"
                  }`}>{pct.toFixed(0)}%</span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-accent font-light">{formatCurrency(goal.savedAmount)} saved</span>
                    <span className="text-text font-semibold">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-accent font-light">{formatCurrency(remaining)} remaining</p>
                </div>

                <div className="flex gap-2">
                  {[500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => addSavings(goal.id, goal.savedAmount, amt)}
                      className="flex-1 text-xs py-2 rounded-lg border border-border text-muted hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-all font-medium"
                    >
                      +{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                  <button
                    onClick={() => markDone(goal.id)}
                    className="px-3 py-2 rounded-lg border border-border text-xs text-accent hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
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
          <h2 className="text-xs font-semibold text-accent uppercase tracking-wide mb-3">Achieved</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {achieved.map((goal) => (
              <div key={goal.id} className="bg-background rounded-2xl border border-emerald-200 p-4 opacity-70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <p className="text-text font-medium text-sm">{goal.title}</p>
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
