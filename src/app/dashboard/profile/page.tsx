"use client";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { financePlanError, summarizeFinancePlan } from "@/lib/finance";

type Profile = {
  monthlyBudget: number;
  savingsGoal: number;
  monthlyAllowance: number | null;
  monthlySalary: number | null;
  institution: string | null;
  company: string | null;
  industry: string | null;
};
type UserData = {
  name: string;
  email: string;
  avatar: string | null;
  userType: string;
  age: number;
  createdAt: string;
  profile: Profile | null;
};

const USER_TYPE_LABELS: Record<string, string> = {
  SCHOOL_STUDENT: "School Student",
  COLLEGE_STUDENT: "College Student",
  PROFESSIONAL: "Working Professional",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    monthlyBudget: "",
    savingsGoal: "",
    monthlyAllowance: "",
    monthlySalary: "",
    institution: "",
    company: "",
    industry: "",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ user: u }) => {
        setUser(u);
        if (u?.profile) {
          setForm({
            monthlyBudget:    u.profile.monthlyBudget?.toString() ?? "",
            savingsGoal:      u.profile.savingsGoal?.toString() ?? "",
            monthlyAllowance: u.profile.monthlyAllowance?.toString() ?? "",
            monthlySalary:    u.profile.monthlySalary?.toString() ?? "",
            institution:      u.profile.institution ?? "",
            company:          u.profile.company ?? "",
            industry:         u.profile.industry ?? "",
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const monthlyIncome = isStudent
      ? (parseFloat(form.monthlyAllowance) || 0)
      : (parseFloat(form.monthlySalary) || 0);
    const monthlyBudget = parseFloat(form.monthlyBudget) || 0;
    const savingsGoal = parseFloat(form.savingsGoal) || 0;
    const planError = financePlanError({ monthlyIncome, monthlyBudget, savingsGoal });

    if (planError) {
      setError(planError);
      setSaving(false);
      return;
    }

    const body: Record<string, number | string> = {};
    if (form.monthlyBudget)    body.monthlyBudget    = parseFloat(form.monthlyBudget);
    if (form.savingsGoal)      body.savingsGoal      = parseFloat(form.savingsGoal);
    if (form.monthlyAllowance) body.monthlyAllowance = parseFloat(form.monthlyAllowance);
    if (form.monthlySalary)    body.monthlySalary    = parseFloat(form.monthlySalary);
    if (form.institution)      body.institution      = form.institution;
    if (form.company)          body.company          = form.company;
    if (form.industry)         body.industry         = form.industry;

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(typeof err?.error === "string" ? err.error : "Failed to save profile");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const isStudent = user?.userType === "SCHOOL_STUDENT" || user?.userType === "COLLEGE_STUDENT";
  const monthlyIncome = isStudent
    ? (parseFloat(form.monthlyAllowance) || 0)
    : (parseFloat(form.monthlySalary) || 0);
  const monthlyBudget = parseFloat(form.monthlyBudget) || 0;
  const savingsGoal = parseFloat(form.savingsGoal) || 0;
  const plan = summarizeFinancePlan({ monthlyIncome, monthlyBudget, savingsGoal });
  const planError = financePlanError({ monthlyIncome, monthlyBudget, savingsGoal });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Profile</h1>
        <p className="text-accent text-sm mt-0.5 font-light">Manage your details and financial limits</p>
      </div>

      {/* Identity card */}
      <div className="bg-background rounded-2xl border border-amber-400 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-14 h-14 rounded-2xl ring-2 ring-border shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 text-xl font-black flex items-center justify-center shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text text-lg truncate">{user?.name}</p>
            <p className="text-accent text-sm truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                {USER_TYPE_LABELS[user?.userType ?? ""] ?? user?.userType}
              </span>
              {user?.age && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-muted font-medium border border-amber-400">
                  {user.age} yrs
                </span>
              )}
              {user?.createdAt && (
                <span className="text-[10px] text-accent font-light">
                  Since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {user?.profile && (
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-surface">
            <div className="text-center">
              <p className="text-xs font-bold text-text">{formatCurrency(user.profile.monthlyBudget)}</p>
              <p className="text-[10px] text-accent font-light">Monthly budget</p>
            </div>
            <div className="text-center border-x border-surface">
              <p className="text-xs font-bold text-text">{formatCurrency(user.profile.savingsGoal)}</p>
              <p className="text-[10px] text-accent font-light">Savings goal</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-text">
                {formatCurrency(user.profile.monthlySalary ?? user.profile.monthlyAllowance ?? 0)}
              </p>
              <p className="text-[10px] text-accent font-light">{isStudent ? "Allowance" : "Salary"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-background rounded-2xl border border-amber-400 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-text">Financial limits</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Monthly budget (₹)"
            type="number"
            placeholder="15000"
            value={form.monthlyBudget}
            onChange={(e) => setForm((f) => ({ ...f, monthlyBudget: e.target.value }))}
          />
          <Input
            label="Savings goal (₹/mo)"
            type="number"
            placeholder="3000"
            value={form.savingsGoal}
            onChange={(e) => setForm((f) => ({ ...f, savingsGoal: e.target.value }))}
          />
        </div>

        {isStudent ? (
          <>
            <Input
              label="Monthly allowance (₹)"
              type="number"
              placeholder="5000"
              value={form.monthlyAllowance}
              onChange={(e) => setForm((f) => ({ ...f, monthlyAllowance: e.target.value }))}
            />
            <Input
              label="Institution"
              placeholder="IIITDM Kancheepuram"
              value={form.institution}
              onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
            />
          </>
        ) : (
          <>
            <Input
              label="Monthly salary (₹)"
              type="number"
              placeholder="50000"
              value={form.monthlySalary}
              onChange={(e) => setForm((f) => ({ ...f, monthlySalary: e.target.value }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company"
                placeholder="Google, Infosys..."
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
              <Input
                label="Industry"
                placeholder="Tech, Finance..."
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
              />
            </div>
          </>
        )}

        {(monthlyIncome > 0 || monthlyBudget > 0 || savingsGoal > 0) && (
          <div className={`rounded-xl p-4 border ${plan.overspent ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-100"}`}>
            <p className={`text-sm font-semibold ${plan.overspent ? "text-red-700" : "text-emerald-700"}`}>Monthly Money Plan</p>
            <div className={`mt-2 text-xs space-y-1 ${plan.overspent ? "text-red-600" : "text-emerald-700"}`}>
              <p>Total income: {formatCurrency(plan.monthlyIncome)}</p>
              <p>Spending budget: {formatCurrency(plan.monthlyBudget)}</p>
              <p>Savings goal: {formatCurrency(plan.savingsGoal)}</p>
              <p>Left after plan: {formatCurrency(plan.remaining)}</p>
            </div>
            {plan.overspent && (
              <p className="text-xs mt-2 text-red-700 font-medium">
                You are planning to spend/save more than your income. Reduce budget or savings goal.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={saving} disabled={!!planError} className="flex-1">
            Save changes
          </Button>
          {saved && (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
              Saved
            </span>
          )}
        </div>
      </form>

      {/* Danger zone */}
      <div className="bg-background rounded-2xl border border-red-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-text mb-1">Account</h2>
        <p className="text-xs text-accent font-light mb-4">Sign out from all devices</p>
        <Button
          variant="danger"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full sm:w-auto"
        >
          Sign out
        </Button>
      </div>

    </div>
  );
}
