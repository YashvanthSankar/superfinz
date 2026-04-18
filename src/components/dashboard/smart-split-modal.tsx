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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-surface border border-accent/20 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-accent hover:text-text"
          aria-label="Close"
        >
          ✕
        </button>

        {step === "ask-new" && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text">Extra Savings!</h2>
            <p className="text-accent text-sm">
              You have <strong className="text-emerald-400">{formatCurrency(unallocated)}</strong> unallocated this period. Do you have any upcoming plans or purchases you want to start saving for?
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => setStep("create-new")} variant="primary" className="w-full">
                Yes, let&apos;s create a new plan
              </Button>
              <Button onClick={() => setStep("split")} variant="outline" className="w-full border-accent/20">
                No, just boost my existing plans
              </Button>
            </div>
          </div>
        )}

        {step === "create-new" && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-text">New Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-accent">What are you saving for?</label>
                <Input
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="e.g. New iPhone, Goa Trip"
                />
              </div>
              <div>
                <label className="text-xs text-accent">How much do you need?</label>
                <Input
                  type="number"
                  value={newPlanTarget}
                  onChange={(e) => setNewPlanTarget(e.target.value)}
                  placeholder="Amount in ₹"
                  min="1"
                />
              </div>
              <div>
                <label className="text-xs text-accent">When do you need it by?</label>
                <Input
                  type="date"
                  value={newPlanDeadline}
                  onChange={(e) => setNewPlanDeadline(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="essential"
                  checked={newPlanEssential}
                  onChange={(e) => setNewPlanEssential(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
                <label htmlFor="essential" className="text-sm text-text">Is this an essential need?</label>
              </div>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep("ask-new")} variant="ghost" className="flex-1">Back</Button>
              <Button
                onClick={handleCreateNewPlan}
                disabled={isSubmitting || !newPlanTitle.trim() || !newPlanTarget}
                variant="primary"
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Plan"}
              </Button>
            </div>
          </div>
        )}

        {step === "split" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-text">Smart Split</h2>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mt-3">
                <p className="text-xs text-text leading-relaxed">
                  We built a baseline recommendation for your <strong className="text-emerald-400">{formatCurrency(unallocated)}</strong>.
                  Essentials and closest deadlines are prioritized — drag the sliders to move cash around.
                </p>
              </div>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1 mt-4">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className={`bg-background rounded-xl p-3 border ${g.isEssential ? "border-amber-500/30" : "border-border"}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      {g.title}
                      {g.isEssential && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">Essential</span>
                      )}
                    </span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(allocations[g.id] ?? 0)}</span>
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
                    className="w-full accent-emerald-500"
                  />
                  <div className="text-[10px] text-accent mt-1 text-right">
                    Deadline: {g.deadline ? new Date(g.deadline).toLocaleDateString() : "No Rush"}
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep("ask-new")} variant="ghost" className="flex-1">Back</Button>
              <Button
                onClick={handleApplySplit}
                disabled={isSubmitting}
                variant="primary"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black"
              >
                {isSubmitting ? "Applying..." : "Apply Boost"}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl text-black">✓</div>
            <h2 className="text-2xl font-bold text-text">Boom!</h2>
            <p className="text-accent text-sm">Your goals just got a boost. Keep it up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
