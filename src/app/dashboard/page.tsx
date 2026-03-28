import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

const CAT_EMOJI: Record<string, string> = {
  Food: "🍔", Transport: "🚗", Entertainment: "🎮", Shopping: "🛍️",
  Health: "💊", Education: "📚", Utilities: "💡", Rent: "🏠",
  Subscriptions: "📱", Other: "💸",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);

  const [user, recentTx, budgets, goals] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, include: { profile: true } }),
    prisma.transaction.findMany({ where: { userId: session.userId, date: { gte: monthStart } }, orderBy: { date: "desc" }, take: 6 }),
    prisma.budget.findMany({ where: { userId: session.userId, month, year } }),
    prisma.goal.findMany({ where: { userId: session.userId, achieved: false }, take: 3 }),
  ]);

  if (!user) redirect("/login");

  const monthlySpend = recentTx.reduce((s, t) => s + t.amount, 0);
  const budget   = user.profile?.monthlyBudget ?? 0;
  const income   = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0;
  const goalAmt  = user.profile?.savingsGoal ?? 0;
  const remaining = budget - monthlySpend;
  const savingsRate = income > 0 ? Math.max(0, ((income - monthlySpend) / income) * 100) : 0;
  const budgetPct = budget > 0 ? Math.min((monthlySpend / budget) * 100, 100) : 0;

  const STATS = [
    { label: "Spent this month", value: formatCurrency(monthlySpend), sub: `of ${formatCurrency(budget)} budget`, color: "text-[#0f172a]" },
    { label: "Remaining", value: formatCurrency(Math.abs(remaining)), sub: remaining < 0 ? "over budget 😬" : "left to spend", color: remaining >= 0 ? "text-emerald-600" : "text-red-500" },
    { label: "Savings rate", value: `${savingsRate.toFixed(0)}%`, sub: `goal: ${formatCurrency(goalAmt)}/mo`, color: savingsRate >= 20 ? "text-emerald-600" : savingsRate >= 10 ? "text-amber-600" : "text-red-500" },
    { label: "Budget used", value: `${budgetPct.toFixed(0)}%`, sub: budgetPct > 80 ? "getting close 👀" : "on track", color: "text-[#0f172a]" },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">
          Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"},{" "}
          {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-[#94a3b8] text-sm mt-0.5 font-light">
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <p className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#94a3b8] mt-1 font-light">{s.sub}</p>
            {s.label === "Budget used" && (
              <div className="mt-3 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetPct > 80 ? "bg-red-400" : "bg-indigo-500"}`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-[#0f172a]">Recent spends</h2>
            <a href="/dashboard/transactions" className="text-xs text-indigo-600 hover:underline font-medium">View all →</a>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🫙</p>
              <p className="text-[#64748b] text-sm">No transactions yet</p>
              <a href="/dashboard/transactions" className="text-indigo-600 text-xs hover:underline mt-1 inline-block font-medium">Add your first spend →</a>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-base shrink-0">
                    {CAT_EMOJI[tx.category] ?? "💸"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0f172a] font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-[#94a3b8] font-light">{tx.category} · {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#0f172a]">{formatCurrency(tx.amount)}</p>
                    {tx.isNecessary === false && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">unnecessary</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-[#0f172a]">Savings goals</h2>
            <a href="/dashboard/goals" className="text-xs text-indigo-600 hover:underline font-medium">Manage →</a>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-[#64748b] text-sm">No goals yet</p>
              <a href="/dashboard/goals" className="text-indigo-600 text-xs hover:underline mt-1 inline-block font-medium">Set a goal →</a>
            </div>
          ) : (
            <div className="space-y-5">
              {goals.map((goal) => {
                const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-[#0f172a] font-medium">{goal.title}</span>
                      <span className="text-xs text-[#64748b]">{formatCurrency(goal.savedAmount)} / {formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-1 font-light">{pct.toFixed(0)}% complete</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Budget by category */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-5">Budget by category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {budgets.map((b) => {
              const pct = budget > 0 ? (b.spent / b.limit) * 100 : 0;
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#64748b] font-medium">{CAT_EMOJI[b.category]} {b.category}</span>
                    <span className={pct > 80 ? "text-red-500 font-semibold" : "text-[#94a3b8]"}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : "bg-indigo-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-[#94a3b8] mt-1 font-light">{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
