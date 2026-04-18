"use client";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, FetchError } from "@/lib/fetcher";
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
    let cancelled = false;
    apiFetch<{ user: UserData }>("/api/profile")
      .then(({ user: u }) => {
        if (cancelled) return;
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
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof FetchError ? err.message : "Failed to load profile");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const isStudent = user?.userType === "SCHOOL_STUDENT" || user?.userType === "COLLEGE_STUDENT";
  const monthlyIncome = isStudent
    ? (parseFloat(form.monthlyAllowance) || 0)
    : (parseFloat(form.monthlySalary) || 0);
  const monthlyBudget = parseFloat(form.monthlyBudget) || 0;
  const savingsGoal = parseFloat(form.savingsGoal) || 0;
  const plan = summarizeFinancePlan({ monthlyIncome, monthlyBudget, savingsGoal });
  const planError = financePlanError({ monthlyIncome, monthlyBudget, savingsGoal });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

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

    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof FetchError ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-ink border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <p className="brut-label mb-1">Account</p>
        <h1 className="brut-display text-4xl sm:text-5xl text-ink">Profile.</h1>
        <p className="text-ink-soft text-sm font-semibold mt-1">Manage your details and limits.</p>
      </div>

      {/* Identity card */}
      <div className="brut-card p-5">
        <div className="flex items-center gap-4">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-16 h-16 border-2 border-ink shrink-0" />
          ) : (
            <div className="w-16 h-16 border-2 border-ink bg-accent text-paper brut-display text-2xl flex items-center justify-center shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="brut-display text-xl text-ink truncate">{user?.name}</p>
            <p className="text-ink-soft text-sm truncate font-semibold">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="brut-stamp bg-ink text-paper">
                {USER_TYPE_LABELS[user?.userType ?? ""] ?? user?.userType}
              </span>
              {user?.age && (
                <span className="brut-stamp bg-paper-2">
                  {user.age} yrs
                </span>
              )}
              {user?.createdAt && (
                <span className="text-[10px] text-ink-soft font-semibold">
                  Since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {user?.profile && (
          <div className="grid grid-cols-3 gap-0 mt-5 pt-4 border-t-2 border-ink">
            <div className="text-center">
              <p className="brut-display text-xl text-ink tabular">{formatCurrency(user.profile.monthlyBudget)}</p>
              <p className="brut-label mt-1">Budget</p>
            </div>
            <div className="text-center border-x-2 border-ink">
              <p className="brut-display text-xl text-ink tabular">{formatCurrency(user.profile.savingsGoal)}</p>
              <p className="brut-label mt-1">Savings goal</p>
            </div>
            <div className="text-center">
              <p className="brut-display text-xl text-ink tabular">
                {formatCurrency(user.profile.monthlySalary ?? user.profile.monthlyAllowance ?? 0)}
              </p>
              <p className="brut-label mt-1">{isStudent ? "Allowance" : "Salary"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="brut-card p-5 space-y-4">
        <p className="brut-label">Financial limits</p>

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
              placeholder="e.g. IIT Delhi, St. Xavier's College"
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
          <div className={`border-2 border-ink p-4 ${plan.overspent ? "bg-bad-soft" : "bg-good-soft"}`}>
            <p className="brut-label">Monthly Money Plan</p>
            <div className="mt-2 text-xs space-y-1 text-ink font-bold tabular">
              <p>Total income: {formatCurrency(plan.monthlyIncome)}</p>
              <p>Spending budget: {formatCurrency(plan.monthlyBudget)}</p>
              <p>Savings goal: {formatCurrency(plan.savingsGoal)}</p>
              <p>Left: {formatCurrency(plan.remaining)}</p>
            </div>
            {plan.overspent && (
              <p className="text-xs mt-3 text-bad font-black uppercase tracking-wider">
                Spending + savings exceeds income. Reduce one.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-bad bg-bad-soft border-2 border-ink px-4 py-2.5 font-bold">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" variant="accent" loading={saving} disabled={!!planError} className="flex-1">
            Save changes
          </Button>
          {saved && (
            <span className="brut-stamp bg-good text-paper border-ink">Saved</span>
          )}
        </div>
      </form>

      {/* Danger zone */}
      <div className="brut-card p-5 border-bad">
        <p className="brut-label text-bad mb-1">Account</p>
        <p className="text-xs text-ink-soft font-semibold mb-4">Sign out from all devices</p>
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
