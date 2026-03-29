"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Goal } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";

export function SmartSplitModal({
  unallocated,
  goals
}: {
  unallocated: number;
  goals: Goal[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"ask-new" | "create-new" | "split" | "done">("ask-new");
  
  // New plan form
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanTarget, setNewPlanTarget] = useState("");
  const [newPlanDeadline, setNewPlanDeadline] = useState("");

  // Splitting state
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only show if unallocated > 0 and user not prompted recently
    const lastPrompt = localStorage.getItem("smart_split_last_prompt");
    const today = new Date().toDateString();
    
    if (unallocated > 0 && lastPrompt !== today && goals.length > 0) {
      setIsOpen(true);
      localStorage.setItem("smart_split_last_prompt", today);
      
      // Auto-calculate split based on deadlines
      if (goals.length > 0) {
        const sorted = [...goals].sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.getTime() - b.deadline.getTime();
        });
        
        let remainingToSplit = unallocated;
        const newAllocs: Record<string, number> = {};
        
        // Strategy: 50% to nearest, 30% to next, 20% to rest
        sorted.forEach((g, idx) => {
          let portion = 0;
          if (idx === 0) portion = Math.floor(unallocated * 0.5);
          else if (idx === 1) portion = Math.floor(unallocated * 0.3);
          else portion = Math.floor(remainingToSplit / (sorted.length - idx));
          
          if (portion > remainingToSplit) portion = remainingToSplit;
          newAllocs[g.id] = portion;
          remainingToSplit -= portion;
        });
        
        setAllocations(newAllocs);
      }
    }
  }, [unallocated, goals]);

  if (!isOpen) return null;

  async function handleCreateNewPlan() {
    setIsSubmitting(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPlanTitle,
          targetAmount: parseFloat(newPlanTarget),
          deadline: newPlanDeadline,
        }),
      });
      // Redirect to refresh the wrapper
      setIsOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  }

  async function handleApplySplit() {
    setIsSubmitting(true);
    // Real implementation would submit `allocations` to an endpoint that updates Goal.savedAmount
    // But since it's just frontend simulation for now, we wait and close
    await new Promise(r => setTimeout(r, 1000));
    setStep("done");
    setIsSubmitting(false);
    setTimeout(() => setIsOpen(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-surface border border-accent/20 rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-accent hover:text-text"
        >
          ✕
        </button>

        {step === "ask-new" && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
              🎯
            </div>
            <h2 className="text-2xl font-bold text-text">Extra Savings!</h2>
            <p className="text-accent text-sm">
              You have <strong className="text-emerald-400">{formatCurrency(unallocated)}</strong> unallocated this period. Do you have any upcoming plans or purchases you want to start saving for?
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => setStep("create-new")} variant="primary" className="w-full">
                Yes, let's create a new plan
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
                  placeholder="₹ Amount" 
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
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep("ask-new")} variant="ghost" className="flex-1">Back</Button>
              <Button onClick={handleCreateNewPlan} disabled={isSubmitting || !newPlanTitle || !newPlanTarget} variant="primary" className="flex-1">
                {isSubmitting ? "Creating..." : "Create Plan"}
              </Button>
            </div>
          </div>
        )}

        {step === "split" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-text">Smart Split</h2>
              <p className="text-xs text-accent mt-1">
                AI suggested this split for your <strong className="text-emerald-400">{formatCurrency(unallocated)}</strong> extra savings based on deadlines:
              </p>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {goals.map(g => (
                <div key={g.id} className="bg-background rounded-xl p-3 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">{g.title}</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(allocations[g.id] || 0)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={unallocated}
                    value={allocations[g.id] || 0}
                    onChange={(e) => {
                       const val = Number(e.target.value);
                       setAllocations(prev => ({...prev, [g.id]: val}));
                    }}
                    className="w-full accent-emerald-500"
                  />
                  <div className="text-[10px] text-accent mt-1 text-right">
                    Deadline: {g.deadline ? new Date(g.deadline).toLocaleDateString() : "No Rush"}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep("ask-new")} variant="ghost" className="flex-1">Back</Button>
              <Button onClick={handleApplySplit} disabled={isSubmitting} variant="primary" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black">
                {isSubmitting ? "Applying..." : "Apply Boost 🚀"}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl text-black">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-text">Boom!</h2>
            <p className="text-accent text-sm">
              Your goals just got a massive boost. Keep it up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
