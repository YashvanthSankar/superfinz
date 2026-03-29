"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Logo } from "@/components/ui/logo";
import { formatCurrency } from "@/lib/utils";
import { financePlanError, summarizeFinancePlan } from "@/lib/finance";

type UserType = "SCHOOL_STUDENT" | "COLLEGE_STUDENT" | "PROFESSIONAL";
const STEPS = ["Who are you?", "Your details", "Habits", "Set limits"] as const;

const INCOME_SOURCES = [
  { value: "PARENTS", label: "Parents / Family" },
  { value: "SCHOLARSHIP", label: "Scholarship" },
  { value: "PART_TIME", label: "Part-time job" },
  { value: "SALARY", label: "Salary" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "OTHER", label: "Other" },
];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    age: "",
    userType: "" as UserType | "",
    institution: "",
    monthlyAllowance: "",
    incomeSources: [] as string[],
    company: "",
    monthlySalary: "",
    industry: "",
    spendingPattern: "BALANCED",
    cycleStartDate: "1",
    monthlyBudget: "",
    savingsGoal: "",
  });

  const set = (k: string, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleSrc = (val: string) => set("incomeSources",
    form.incomeSources.includes(val)
      ? form.incomeSources.filter((s: string) => s !== val)
      : [...form.incomeSources, val]
  );

  const isStudent = form.userType === "SCHOOL_STUDENT" || form.userType === "COLLEGE_STUDENT";
  const monthlyIncome = isStudent
    ? (parseFloat(form.monthlyAllowance) || 0)
    : (parseFloat(form.monthlySalary) || 0);
  const monthlyBudget = parseFloat(form.monthlyBudget) || 0;
  const savingsGoal = parseFloat(form.savingsGoal) || 0;
  const plan = summarizeFinancePlan({ monthlyIncome, monthlyBudget, savingsGoal });
  const planError = financePlanError({ monthlyIncome, monthlyBudget, savingsGoal });

  const canNext = () => {
    if (step === 0) return !!form.userType && !!form.age;
    if (step === 1) return isStudent ? !!form.monthlyAllowance : !!form.monthlySalary;
    if (step === 2) return !!form.spendingPattern;
    return !!form.monthlyBudget && !planError;
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      if (planError) {
        throw new Error(planError);
      }

      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: parseInt(form.age),
          userType: form.userType,
          institution: form.institution || undefined,
          monthlyAllowance: form.monthlyAllowance ? parseFloat(form.monthlyAllowance) : undefined,
          incomeSources: form.incomeSources.length ? form.incomeSources : undefined,
          company: form.company || undefined,
          monthlySalary: form.monthlySalary ? parseFloat(form.monthlySalary) : undefined,
          industry: form.industry || undefined,
          monthlyBudget: parseFloat(form.monthlyBudget) || 0,
          savingsGoal: parseFloat(form.savingsGoal) || 0,
          spendingPattern: form.spendingPattern,
          cycleStartDate: parseInt(form.cycleStartDate) || 1,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to save profile");
      }

      // Refresh JWT/session so middleware sees onboarded=true immediately.
      await update();

      // Redirect after token refresh to avoid onboarding redirect loops in production.
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" />
          {session?.user && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-2 ring-white shadow-sm" />
              )}
              <p className="text-muted text-sm">
                Hi {session.user.name?.split(" ")[0]} — quick setup, then you&apos;re in.
              </p>
            </div>
          )}
        </div>

        {/* Step bar */}
        <div className="flex items-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                i < step ? "bg-amber-600 text-text" :
                i === step ? "bg-background border-2 border-amber-600 text-amber-600" :
                "bg-background border border-amber-400 text-accent"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs truncate ${i === step ? "text-text font-medium" : "text-accent"}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? "bg-amber-600" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-background rounded-2xl border border-amber-400 shadow-sm p-7">

          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-text">Who are you?</h2>
                <p className="text-muted text-sm mt-0.5 font-light">Helps us personalise everything</p>
              </div>
              <Input label="Your age" type="number" placeholder="20" value={form.age} onChange={(e) => set("age", e.target.value)} />
              <div className="space-y-2">
                {([
                  { value: "SCHOOL_STUDENT", label: "School Student",       sub: "Pocket money, school expenses" },
                  { value: "COLLEGE_STUDENT", label: "College Student",      sub: "Hostel, food, subscriptions" },
                  { value: "PROFESSIONAL",    label: "Working Professional", sub: "Salary, investments, EMIs" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set("userType", opt.value)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      form.userType === opt.value
                        ? "border-amber-300 bg-amber-50"
                        : "border-border hover:border-[#c7d2e2] bg-background"
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${form.userType === opt.value ? "text-amber-700" : "text-text"}`}>{opt.label}</p>
                      <p className="text-xs text-accent font-light">{opt.sub}</p>
                    </div>
                    {form.userType === opt.value && (
                      <div className="w-4 h-4 rounded-full bg-amber-600 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-text">{isStudent ? "Student details" : "Work details"}</h2>
                <p className="text-muted text-sm mt-0.5 font-light">Tell us a bit more</p>
              </div>
              {isStudent ? (
                <>
                  <Input label="Institution" placeholder="IIITDM Kancheepuram" value={form.institution} onChange={(e) => set("institution", e.target.value)} />
                  <Input label="Monthly allowance (₹)" type="number" placeholder="5000" value={form.monthlyAllowance} onChange={(e) => set("monthlyAllowance", e.target.value)} />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted">Income sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {INCOME_SOURCES.map((src) => (
                        <button
                          key={src.value}
                          onClick={() => toggleSrc(src.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            form.incomeSources.includes(src.value)
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-background border-border text-muted hover:border-[#c7d2e2]"
                          }`}
                        >
                          {src.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Input label="Company" placeholder="Google, Infosys..." value={form.company} onChange={(e) => set("company", e.target.value)} />
                  <Input label="Monthly salary (₹)" type="number" placeholder="50000" value={form.monthlySalary} onChange={(e) => set("monthlySalary", e.target.value)} />
                  <Select label="Industry" value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                    <option value="">Select industry</option>
                    {["Tech", "Finance", "Healthcare", "Education", "Manufacturing", "Retail", "Other"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </Select>
                </>
              )}
            </div>
          )}

          {/* Step 2: Spending Habits */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-text">Your Spending Habits</h2>
                <p className="text-muted text-sm mt-0.5 font-light">Tell us how you spend to generate the best AI budgets for your weeks.</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted">1. When do you spend the most during the month?</p>
                {([
                  { value: "FRONT_HEAVY", label: "Start of the month", sub: "Rent, heavy bills, going out early" },
                  { value: "BALANCED", label: "Spread evenly", sub: "Similar spending every week" },
                  { value: "CONSERVATIVE", label: "Start slow, spend later", sub: "Saving early, mostly end of month spending" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set("spendingPattern", opt.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      form.spendingPattern === opt.value
                        ? "border-amber-400 bg-amber-50"
                        : "border-border hover:border-[#c7d2e2] bg-background"
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${form.spendingPattern === opt.value ? "text-amber-700" : "text-text"}`}>{opt.label}</p>
                      <p className="text-xs text-accent font-light">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-text">Set your limits</h2>
                <p className="text-muted text-sm mt-0.5 font-light">We&apos;ll track against these every month</p>
              </div>
              <Input label="Monthly savings goal (₹)" type="number" placeholder={isStudent ? "500" : "5000"} value={form.savingsGoal} onChange={(e) => {
                const newGoal = parseFloat(e.target.value) || 0;
                const income = form.monthlySalary ? parseFloat(form.monthlySalary) : parseFloat(form.monthlyAllowance) || 0;
                const autoBudget = income > newGoal ? income - newGoal : 0;
                setForm((prev) => ({ ...prev, savingsGoal: e.target.value, monthlyBudget: autoBudget > 0 ? autoBudget.toString() : prev.monthlyBudget }));
              }} />
              <Input label="Monthly budget (₹)" type="number" placeholder={isStudent ? "5000" : "30000"} value={form.monthlyBudget} onChange={(e) => set("monthlyBudget", e.target.value)} />
              {(monthlyIncome > 0 || monthlyBudget > 0 || savingsGoal > 0) && (
                <div className={`rounded-xl p-4 border ${plan.overspent ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-100"}`}>
                  <p className={`text-sm font-semibold ${plan.overspent ? "text-red-700" : "text-emerald-700"}`}>
                    Monthly Money Plan
                  </p>
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
              {form.monthlyBudget && form.savingsGoal && !plan.overspent && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-emerald-700 font-semibold text-sm">Looking good</p>
                  <p className="text-emerald-600 text-xs mt-1 font-light">
                    ₹{form.savingsGoal}/mo → ₹{(parseFloat(form.savingsGoal) * 12).toLocaleString("en-IN")} in a year
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
          )}

          {!canNext() && step === 3 && (
            <p className="mt-3 text-xs text-accent text-center">Fill in monthly budget to continue</p>
          )}

          <div className="flex gap-2.5 mt-4">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">← Back</Button>
            )}
            {step < 3
              ? <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="flex-1">Continue →</Button>
              : <Button onClick={submit} loading={loading} disabled={!canNext()} className="flex-1">Start tracking</Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
