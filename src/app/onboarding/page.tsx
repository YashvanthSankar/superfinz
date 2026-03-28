"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type UserType = "SCHOOL_STUDENT" | "COLLEGE_STUDENT" | "PROFESSIONAL";
const STEPS = ["Who are you?", "Your details", "Set limits"] as const;

const INCOME_SOURCES = [
  { value: "PARENTS", label: "Parents / Family" },
  { value: "SCHOLARSHIP", label: "Scholarship" },
  { value: "PART_TIME", label: "Part-time job" },
  { value: "SALARY", label: "Salary" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "OTHER", label: "Other" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
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
    monthlyBudget: "",
    savingsGoal: "",
  });

  const set = (k: string, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleSrc = (val: string) => set("incomeSources",
    form.incomeSources.includes(val)
      ? form.incomeSources.filter((s) => s !== val)
      : [...form.incomeSources, val]
  );

  const isStudent = form.userType === "SCHOOL_STUDENT" || form.userType === "COLLEGE_STUDENT";

  const canNext = () => {
    if (step === 0) return !!form.userType && !!form.age;
    if (step === 1) return isStudent ? !!form.monthlyAllowance : !!form.monthlySalary;
    return !!form.monthlyBudget;
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
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
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black text-[#0f172a]">
            Super<span className="text-indigo-600">Finz</span>
          </span>
          {session?.user && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-2 ring-white shadow-sm" />
              )}
              <p className="text-[#64748b] text-sm">
                Hey {session.user.name?.split(" ")[0]} 👋 quick setup, then you&apos;re in!
              </p>
            </div>
          )}
        </div>

        {/* Step bar */}
        <div className="flex items-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                i < step ? "bg-indigo-600 text-white" :
                i === step ? "bg-white border-2 border-indigo-600 text-indigo-600" :
                "bg-white border border-[#e2e8f0] text-[#94a3b8]"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs truncate ${i === step ? "text-[#0f172a] font-medium" : "text-[#94a3b8]"}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? "bg-indigo-600" : "bg-[#e2e8f0]"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-7">

          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">Who are you?</h2>
                <p className="text-[#64748b] text-sm mt-0.5 font-light">Helps us personalise everything</p>
              </div>
              <Input label="Your age" type="number" placeholder="20" value={form.age} onChange={(e) => set("age", e.target.value)} />
              <div className="space-y-2">
                {([
                  { value: "SCHOOL_STUDENT", emoji: "🎒", label: "School Student", sub: "Pocket money, school expenses" },
                  { value: "COLLEGE_STUDENT", emoji: "🎓", label: "College Student", sub: "Hostel, food, subscriptions" },
                  { value: "PROFESSIONAL",    emoji: "💼", label: "Working Professional", sub: "Salary, investments, EMIs" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set("userType", opt.value)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      form.userType === opt.value
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-[#e2e8f0] hover:border-[#c7d2e2] bg-white"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${form.userType === opt.value ? "text-indigo-700" : "text-[#0f172a]"}`}>{opt.label}</p>
                      <p className="text-xs text-[#94a3b8] font-light">{opt.sub}</p>
                    </div>
                    {form.userType === opt.value && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                <h2 className="text-lg font-bold text-[#0f172a]">{isStudent ? "Student details" : "Work details"}</h2>
                <p className="text-[#64748b] text-sm mt-0.5 font-light">Tell us a bit more</p>
              </div>
              {isStudent ? (
                <>
                  <Input label="Institution" placeholder="IIITDM Kancheepuram" value={form.institution} onChange={(e) => set("institution", e.target.value)} />
                  <Input label="Monthly allowance (₹)" type="number" placeholder="5000" value={form.monthlyAllowance} onChange={(e) => set("monthlyAllowance", e.target.value)} />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#374151]">Income sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {INCOME_SOURCES.map((src) => (
                        <button
                          key={src.value}
                          onClick={() => toggleSrc(src.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            form.incomeSources.includes(src.value)
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : "bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#c7d2e2]"
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

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">Set your limits 🎯</h2>
                <p className="text-[#64748b] text-sm mt-0.5 font-light">We&apos;ll track against these every month</p>
              </div>
              <Input label="Monthly budget (₹)" type="number" placeholder={isStudent ? "5000" : "30000"} value={form.monthlyBudget} onChange={(e) => set("monthlyBudget", e.target.value)} />
              <Input label="Monthly savings goal (₹)" type="number" placeholder={isStudent ? "500" : "5000"} value={form.savingsGoal} onChange={(e) => set("savingsGoal", e.target.value)} />
              {form.monthlyBudget && form.savingsGoal && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-emerald-700 font-semibold text-sm">Looks good 🎯</p>
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

          <div className="flex gap-2.5 mt-6">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">← Back</Button>
            )}
            {step < 2
              ? <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="flex-1">Continue →</Button>
              : <Button onClick={submit} loading={loading} disabled={!canNext()} className="flex-1">Start tracking 🚀</Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
