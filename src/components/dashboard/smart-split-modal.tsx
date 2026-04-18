"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { type Goal } from "@/generated/prisma/client";
import { formatCurrency } from "@/lib/utils";

type Step = "ask-new" | "create-new" | "split" | "done";

export function SmartSplitModal({
  unallocated,
  goals,
}: {
  unallocated: number;
  goals: Goal[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("ask-new");

  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanTarget, setNewPlanTarget] = useState("");
  const [newPlanDeadline, setNewPlanDeadline] = useState("");
  const [newPlanEssential, setNewPlanEssential] = useState(false);

  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (unallocated <= 0 || goals.length === 0) return;

    const lastPrompt = window.localStorage.getItem("smart_split_last_prompt");
    const today = new Date().toDateString();
    if (lastPrompt === today) return;

    setIsOpen(true);
    window.localStorage.setItem("smart_split_last_prompt", today);

    const sorted = [...goals].sort((a, b) => {
      if (a.isEssential && !b.isEssential) return -1;
      if (!a.isEssential && b.isEssential) return 1;
      const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aDeadline - bDeadline;
    });

    let remaining = unallocated;
    const next: Record<string, number> = {};
    sorted.forEach((g, idx) => {
      let portion = 0;
      if (idx === 0) portion = Math.floor(unallocated * 0.5);
      else if (idx === 1) portion = Math.floor(unallocated * 0.3);
      else portion = Math.floor(remaining / Math.max(sorted.length - idx, 1));
      if (portion > remaining) portion = remaining;
      next[g.id] = portion;
      remaining -= portion;
    });
    setAllocations(next);
  }, [unallocated, goals]);

  if (!isOpen) return null;

  async function handleCreateNewPlan() {
    setError(null);
    if (!newPlanTitle.trim() || !newPlanTarget) {
      setError("Title and amount are required.");
      return;
    }
    const target = parseFloat(newPlanTarget);
    if (!(target > 0)) {
      setError("Target amount must be positive.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPlanTitle.trim(),
          targetAmount: target,
          deadline: newPlanDeadline || undefined,
          isEssential: newPlanEssential,
        }),
      });
      if (!res.ok) throw new Error("Failed to create plan");
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApplySplit() {
    setError(null);
    setIsSubmitting(true);

    const updates = Object.entries(allocations)
      .filter(([, amt]) => amt > 0)
      .map(([id, amt]) => {
        const goal = goals.find((g) => g.id === id);
        if (!goal) return null;
        return { id, savedAmount: goal.savedAmount + amt };
      })
      .filter((u): u is { id: string; savedAmount: number } => u !== null);

    try {
      const results = await Promise.allSettled(
        updates.map((u) =>
          fetch("/api/goals", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(u),
          }).then((r) => {
            if (!r.ok) throw new Error("patch failed");
            return r;
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed === updates.length && updates.length > 0) {
        throw new Error("Could not update any goal.");
      }

      setStep("done");
      router.refresh();
      setTimeout(() => setIsOpen(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
      <div className="w-full max-w-md bg-paper border-2 border-ink shadow-[6px_6px_0_var(--ink)] p-6 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 w-8 h-8 border-2 border-ink bg-paper hover:bg-bad hover:text-paper flex items-center justify-center text-ink font-black transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {step === "ask-new" && (
          <div className="text-center space-y-5">
            <div className="w-20 h-20 border-2 border-ink bg-good text-paper flex items-center justify-center mx-auto">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <h2 className="brut-display text-3xl text-ink">Extra savings!</h2>
            <p className="text-ink-soft text-sm font-semibold">
              You have <strong className="text-good font-black tabular">{formatCurrency(unallocated)}</strong> unallocated. Got something to save toward?
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => setStep("create-new")} variant="accent" className="w-full">
                Yes, create a new plan
              </Button>
              <Button onClick={() => setStep("split")} variant="secondary" className="w-full">
                No, just boost my plans
              </Button>
            </div>
          </div>
        )}

        {step === "create-new" && (
          <div className="space-y-5">
            <h2 className="brut-display text-2xl text-ink">New plan</h2>
            <div className="space-y-4">
              <Input
                label="What are you saving for?"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                placeholder="e.g. New iPhone, Goa Trip"
              />
              <Input
                label="How much do you need?"
                type="number"
                value={newPlanTarget}
                onChange={(e) => setNewPlanTarget(e.target.value)}
                placeholder="Amount in ₹"
                min="1"
              />
              <Input
                label="When do you need it by?"
                type="date"
                value={newPlanDeadline}
                onChange={(e) => setNewPlanDeadline(e.target.value)}
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="essential"
                  checked={newPlanEssential}
                  onChange={(e) => setNewPlanEssential(e.target.checked)}
                  className="accent-accent w-4 h-4"
                />
                <label htmlFor="essential" className="text-sm text-ink font-bold">Is this an essential need?</label>
              </div>
            </div>
            {error && <p className="text-xs text-bad font-black uppercase tracking-wide">{error}</p>}
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep("ask-new")} variant="secondary" className="flex-1">Back</Button>
              <Button
                onClick={handleCreateNewPlan}
                disabled={isSubmitting || !newPlanTitle.trim() || !newPlanTarget}
                variant="accent"
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create plan"}
              </Button>
            </div>
          </div>
        )}

        {step === "split" && (
          <div className="space-y-5">
            <div>
              <h2 className="brut-display text-2xl text-ink">Smart split</h2>
              <div className="border-2 border-ink bg-accent-soft p-3 mt-3">
                <p className="text-xs text-ink leading-relaxed font-semibold">
                  Baseline split for your <strong className="font-black tabular">{formatCurrency(unallocated)}</strong>.
                  Essentials and closest deadlines prioritized — drag to move cash.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className={`border-2 border-ink p-3 ${g.isEssential ? "bg-warn-soft" : "bg-paper-2"}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black text-ink flex items-center gap-2">
                      {g.title}
                      {g.isEssential && <span className="brut-stamp bg-warn text-ink">Essential</span>}
                    </span>
                    <span className="text-accent font-black tabular">{formatCurrency(allocations[g.id] ?? 0)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={unallocated}
                    value={allocations[g.id] ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAllocations((prev) => ({ ...prev, [g.id]: val }));
                    }}
                    className="w-full accent-accent"
                  />
                  <div className="text-[10px] text-ink-soft mt-1 text-right font-bold uppercase tracking-wider tabular">
                    Deadline: {g.deadline ? new Date(g.deadline).toLocaleDateString() : "No rush"}
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-bad font-black uppercase tracking-wide">{error}</p>}

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep("ask-new")} variant="secondary" className="flex-1">Back</Button>
              <Button
                onClick={handleApplySplit}
                disabled={isSubmitting}
                variant="accent"
                className="flex-1"
              >
                {isSubmitting ? "Applying..." : "Apply boost"}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4 py-6">
            <div className="w-20 h-20 border-2 border-ink bg-good text-paper brut-display text-4xl flex items-center justify-center mx-auto">✓</div>
            <h2 className="brut-display text-3xl text-ink">Boom.</h2>
            <p className="text-ink-soft text-sm font-semibold">Your goals just got a boost. Keep it up.</p>
          </div>
        )}
      </div>
    </div>
  );
}
