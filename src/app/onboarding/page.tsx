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
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" />
          {session?.user && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-8 h-8 border-2 border-ink" />
              )}
              <p className="text-ink-soft text-sm font-bold">
                Hi {session.user.name?.split(" ")[0]} — quick setup.
              </p>
            </div>
          )}
        </div>

        {/* Step bar */}
        <div className="flex items-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 border-2 border-ink flex items-center justify-center text-xs font-black shrink-0 transition-all tabular ${
                i < step ? "bg-ink text-paper" :
                i === step ? "bg-accent text-paper" :
                "bg-paper text-ink-soft"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-[11px] truncate font-black uppercase tracking-wider ${i === step ? "text-ink" : "text-mute"}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] ${i < step ? "bg-ink" : "bg-paper-2"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="brut-card p-7">

          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="brut-display text-2xl text-ink">Who are you?</h2>
                <p className="text-ink-soft text-sm mt-1 font-semibold">Helps us personalise everything.</p>
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
                    className={`w-full flex items-center gap-3 p-3.5 border-2 border-ink text-left transition-[transform,box-shadow] duration-75 shadow-[2px_2px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_var(--ink)] ${
                      form.userType === opt.value
                        ? "bg-accent text-paper"
                        : "bg-paper text-ink"
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-black ${form.userType === opt.value ? "text-paper" : "text-ink"}`}>{opt.label}</p>
                      <p className={`text-xs font-semibold ${form.userType === opt.value ? "text-paper/80" : "text-ink-soft"}`}>{opt.sub}</p>
                    </div>
                    {form.userType === opt.value && (
                      <div className="w-5 h-5 border-2 border-paper bg-paper text-accent flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                <h2 className="brut-display text-2xl text-ink">{isStudent ? "Student details" : "Work details"}</h2>
                <p className="text-ink-soft text-sm mt-1 font-semibold">Tell us a bit more.</p>
              </div>
              {isStudent ? (
                <>
                  <Input label="Institution" placeholder="e.g. IIT Delhi, St. Xavier's College" value={form.institution} onChange={(e) => set("institution", e.target.value)} />
                  <Input label="Monthly allowance (₹)" type="number" placeholder="5000" value={form.monthlyAllowance} onChange={(e) => set("monthlyAllowance", e.target.value)} />
                  <div className="space-y-2">
                    <p className="brut-label">Income sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {INCOME_SOURCES.map((src) => (
                        <button
                          key={src.value}
                          onClick={() => toggleSrc(src.value)}
                          className={`brut-btn h-9 text-[11px] ${
                            form.incomeSources.includes(src.value)
                              ? "bg-ink text-paper"
                              : "bg-paper text-ink"
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
                <h2 className="brut-display text-2xl text-ink">Your spending habits</h2>
                <p className="text-ink-soft text-sm mt-1 font-semibold">How you spend drives your weekly budget split.</p>
              </div>
              <div className="space-y-2">
                <p className="brut-label">1. When do you spend the most?</p>
                {([
                  { value: "FRONT_HEAVY", label: "Start of the month", sub: "Rent, heavy bills, going out early" },
                  { value: "BALANCED", label: "Spread evenly", sub: "Similar spending every week" },
                  { value: "CONSERVATIVE", label: "Start slow, spend later", sub: "Saving early, mostly end of month spending" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set("spendingPattern", opt.value)}
                    className={`w-full flex items-center gap-3 p-3.5 border-2 border-ink text-left transition-[transform,box-shadow] duration-75 shadow-[2px_2px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_var(--ink)] ${
                      form.spendingPattern === opt.value
                        ? "bg-accent text-paper"
                        : "bg-paper text-ink"
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-black ${form.spendingPattern === opt.value ? "text-paper" : "text-ink"}`}>{opt.label}</p>
                      <p className={`text-xs font-semibold ${form.spendingPattern === opt.value ? "text-paper/80" : "text-ink-soft"}`}>{opt.sub}</p>
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
                <h2 className="brut-display text-2xl text-ink">Set your limits</h2>
                <p className="text-ink-soft text-sm mt-1 font-semibold">We&apos;ll track against these every month.</p>
              </div>
              <Input label="Monthly savings goal (₹)" type="number" placeholder={isStudent ? "500" : "5000"} value={form.savingsGoal} onChange={(e) => {
                const newGoal = parseFloat(e.target.value) || 0;
                const income = form.monthlySalary ? parseFloat(form.monthlySalary) : parseFloat(form.monthlyAllowance) || 0;
                const autoBudget = income > newGoal ? income - newGoal : 0;
                setForm((prev) => ({ ...prev, savingsGoal: e.target.value, monthlyBudget: autoBudget > 0 ? autoBudget.toString() : prev.monthlyBudget }));
              }} />
              <Input label="Monthly budget (₹)" type="number" placeholder={isStudent ? "5000" : "30000"} value={form.monthlyBudget} onChange={(e) => set("monthlyBudget", e.target.value)} />
              {(monthlyIncome > 0 || monthlyBudget > 0 || savingsGoal > 0) && (
                <div className={`border-2 border-ink p-4 ${plan.overspent ? "bg-bad-soft" : "bg-good-soft"}`}>
                  <p className="brut-label">Monthly money plan</p>
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
              {form.monthlyBudget && form.savingsGoal && !plan.overspent && (
                <div className="border-2 border-ink bg-accent-soft p-4">
                  <p className="brut-label">Looking good</p>
                  <p className="text-ink text-sm mt-1 font-bold tabular">
                    ₹{form.savingsGoal}/mo → ₹{(parseFloat(form.savingsGoal) * 12).toLocaleString("en-IN")} in a year
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-bad bg-bad-soft border-2 border-ink px-4 py-2.5 font-bold">{error}</p>
          )}

          {!canNext() && step === 3 && (
            <p className="mt-3 brut-label text-center">Fill in monthly budget to continue</p>
          )}

          <div className="flex gap-2.5 mt-4">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">← Back</Button>
            )}
            {step < 3
              ? <Button variant="accent" onClick={() => setStep(step + 1)} disabled={!canNext()} className="flex-1">Continue →</Button>
              : <Button variant="accent" onClick={submit} loading={loading} disabled={!canNext()} className="flex-1">Start tracking</Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
