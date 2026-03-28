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
  const toggleSource = (val: string) =>
    set("incomeSources", form.incomeSources.includes(val)
      ? form.incomeSources.filter((s) => s !== val)
      : [...form.incomeSources, val]);

  const isStudent = form.userType === "SCHOOL_STUDENT" || form.userType === "COLLEGE_STUDENT";

  const canNext = () => {
    if (step === 0) return !!form.userType && !!form.age;
    if (step === 1) return isStudent ? !!form.monthlyAllowance : !!form.monthlySalary;
    return !!form.monthlyBudget;
  };

  const handleSubmit = async () => {
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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-white">
            Super<span className="text-[#00ff88]">Finz</span>
          </span>
          {session?.user && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {session.user.image && (
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
              )}
              <p className="text-[#8888aa] text-sm">hey {session.user.name?.split(" ")[0]} 👋 let&apos;s set you up</p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                i < step ? "bg-[#00ff88] text-black" : i === step ? "bg-[#00ff88]/20 border border-[#00ff88] text-[#00ff88]" : "bg-[#1a1a24] border border-[#2a2a3a] text-[#4a4a6a]"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs truncate ${i === step ? "text-white font-medium" : "text-[#4a4a6a]"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? "bg-[#00ff88]" : "bg-[#2a2a3a]"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6">
          {/* Step 0: Who are you */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Who are you?</h2>
              <p className="text-[#8888aa] text-sm">Helps us personalize everything for you</p>
              <Input label="Your age" type="number" placeholder="20" value={form.age} onChange={(e) => set("age", e.target.value)} />
              {(["SCHOOL_STUDENT", "COLLEGE_STUDENT", "PROFESSIONAL"] as const).map((type) => {
                const opts = {
                  SCHOOL_STUDENT: { emoji: "🎒", label: "School Student", sub: "Pocket money, school stuff" },
                  COLLEGE_STUDENT: { emoji: "🎓", label: "College Student", sub: "Hostel, food, subscriptions" },
                  PROFESSIONAL: { emoji: "💼", label: "Working Professional", sub: "Salary, investments, EMIs" },
                }[type];
                return (
                  <button key={type} onClick={() => set("userType", type)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${form.userType === type ? "border-[#00ff88] bg-[#00ff88]/5" : "border-[#2a2a3a] hover:border-[#3a3a4a]"}`}>
                    <span className="text-2xl">{opts.emoji}</span>
                    <div>
                      <p className="font-semibold text-white">{opts.label}</p>
                      <p className="text-xs text-[#8888aa]">{opts.sub}</p>
                    </div>
                    {form.userType === type && <span className="ml-auto text-[#00ff88]">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">{isStudent ? "Student details" : "Work details"}</h2>
              {isStudent ? (
                <>
                  <Input label="Institution" placeholder="IIITDM Kancheepuram" value={form.institution} onChange={(e) => set("institution", e.target.value)} />
                  <Input label="Monthly allowance (₹)" type="number" placeholder="5000" value={form.monthlyAllowance} onChange={(e) => set("monthlyAllowance", e.target.value)} />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[#8888aa]">Income sources</p>
                    <div className="flex flex-wrap gap-2">
                      {INCOME_SOURCES.map((src) => (
                        <button key={src.value} type="button" onClick={() => toggleSource(src.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.incomeSources.includes(src.value) ? "border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]" : "border-[#2a2a3a] text-[#8888aa] hover:border-[#3a3a4a]"}`}>
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
                    {["Tech", "Finance", "Healthcare", "Education", "Manufacturing", "Retail", "Other"].map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </Select>
                </>
              )}
            </div>
          )}

          {/* Step 2: Budget */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Set your limits 🎯</h2>
              <p className="text-[#8888aa] text-sm">We&apos;ll roast you when you overshoot 😅</p>
              <Input label="Monthly budget (₹)" type="number" placeholder={isStudent ? "5000" : "30000"} value={form.monthlyBudget} onChange={(e) => set("monthlyBudget", e.target.value)} />
              <Input label="Monthly savings goal (₹)" type="number" placeholder={isStudent ? "500" : "5000"} value={form.savingsGoal} onChange={(e) => set("savingsGoal", e.target.value)} />
              {form.monthlyBudget && form.savingsGoal && (
                <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl p-4 text-sm">
                  <p className="text-[#00ff88] font-medium">Looking good 🎯</p>
                  <p className="text-[#8888aa] mt-1">
                    Save ₹{form.savingsGoal}/mo → ₹{(parseFloat(form.savingsGoal) * 12).toLocaleString("en-IN")} in a year
                  </p>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 mt-6">
            {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">Back</Button>}
            {step < 2
              ? <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="flex-1">Continue →</Button>
              : <Button onClick={handleSubmit} loading={loading} disabled={!canNext()} className="flex-1">Start tracking 🚀</Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
