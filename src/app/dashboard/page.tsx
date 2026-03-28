import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);

  const [user, recentTx, budgets, goals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true },
    }),
    prisma.transaction.findMany({
      where: { userId: session.userId, date: { gte: monthStart } },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.budget.findMany({ where: { userId: session.userId, month, year } }),
    prisma.goal.findMany({ where: { userId: session.userId, achieved: false }, take: 3 }),
  ]);

  if (!user) redirect("/login");

  const monthlySpend = recentTx.reduce((s, t) => s + t.amount, 0);
  const income = user.profile?.monthlySalary ?? user.profile?.monthlyAllowance ?? 0;
  const budget = user.profile?.monthlyBudget ?? 0;
  const savingsGoal = user.profile?.savingsGoal ?? 0;
  const remaining = budget - monthlySpend;
  const savingsRate = income > 0 ? ((income - monthlySpend) / income) * 100 : 0;

  const CATEGORY_EMOJI: Record<string, string> = {
    Food: "🍔", Transport: "🚗", Entertainment: "🎮", Shopping: "🛍️",
    Health: "💊", Education: "📚", Utilities: "💡", Rent: "🏠",
    Subscriptions: "📱", Other: "💸",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          hey {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-[#8888aa] text-sm mt-0.5">
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-[#8888aa] mb-1">Spent this month</p>
          <p className="text-xl font-bold text-white">{formatCurrency(monthlySpend)}</p>
          <p className="text-xs mt-1 text-[#4a4a6a]">of {formatCurrency(budget)} budget</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8888aa] mb-1">Remaining</p>
          <p className={`text-xl font-bold ${remaining >= 0 ? "text-[#00ff88]" : "text-red-400"}`}>
            {formatCurrency(Math.abs(remaining))}
          </p>
          <p className="text-xs mt-1 text-[#4a4a6a]">{remaining < 0 ? "over budget 😬" : "left to spend"}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8888aa] mb-1">Savings rate</p>
          <p className={`text-xl font-bold ${savingsRate >= 20 ? "text-[#00ff88]" : savingsRate >= 10 ? "text-yellow-400" : "text-red-400"}`}>
            {savingsRate.toFixed(1)}%
          </p>
          <p className="text-xs mt-1 text-[#4a4a6a]">goal: {formatCurrency(savingsGoal)}/mo</p>
        </Card>
        <Card>
          <p className="text-xs text-[#8888aa] mb-1">Budget used</p>
          <p className="text-xl font-bold text-white">
            {budget > 0 ? ((monthlySpend / budget) * 100).toFixed(0) : 0}%
          </p>
          <div className="mt-2 h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                monthlySpend / budget > 0.8 ? "bg-red-400" : "bg-[#00ff88]"
              }`}
              style={{ width: `${Math.min((monthlySpend / budget) * 100, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Recent spends</CardTitle>
            <a href="/dashboard/transactions" className="text-xs text-[#00ff88] hover:underline">
              View all →
            </a>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🫙</p>
              <p className="text-[#8888aa] text-sm">No transactions yet this month</p>
              <a href="/dashboard/transactions" className="text-[#00ff88] text-sm hover:underline mt-1 inline-block">
                Add your first spend →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3">
                  <span className="text-xl">{CATEGORY_EMOJI[tx.category] ?? "💸"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{tx.description}</p>
                    <p className="text-xs text-[#4a4a6a]">{tx.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(tx.amount)}
                    </p>
                    {tx.isNecessary === false && (
                      <span className="text-xs text-orange-400">unnecessary</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Goals */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Savings goals</CardTitle>
            <a href="/dashboard/goals" className="text-xs text-[#00ff88] hover:underline">
              Manage →
            </a>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-[#8888aa] text-sm">No goals yet</p>
              <a href="/dashboard/goals" className="text-[#00ff88] text-sm hover:underline mt-1 inline-block">
                Set a goal →
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white font-medium">{goal.title}</span>
                      <span className="text-[#8888aa]">
                        {formatCurrency(goal.savedAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#7c3aed] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#4a4a6a] mt-1">{pct.toFixed(0)}% complete</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Budget by category */}
        {budgets.length > 0 && (
          <Card className="md:col-span-2">
            <CardTitle className="mb-4">Budget by category</CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {budgets.map((b) => {
                const pct = (b.spent / b.limit) * 100;
                return (
                  <div key={b.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#8888aa]">{CATEGORY_EMOJI[b.category]} {b.category}</span>
                      <span className={pct > 80 ? "text-red-400" : "text-[#8888aa]"}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : "bg-[#00ff88]"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#4a4a6a]">
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
