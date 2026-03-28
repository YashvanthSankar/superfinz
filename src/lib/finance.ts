export type FinancePlanInput = {
  monthlyIncome: number;
  monthlyBudget: number;
  savingsGoal: number;
};

export type FinancePlanSummary = {
  monthlyIncome: number;
  monthlyBudget: number;
  savingsGoal: number;
  allocated: number;
  remaining: number;
  overspent: boolean;
};

export function summarizeFinancePlan(input: FinancePlanInput): FinancePlanSummary {
  const monthlyIncome = Number.isFinite(input.monthlyIncome) ? Math.max(input.monthlyIncome, 0) : 0;
  const monthlyBudget = Number.isFinite(input.monthlyBudget) ? Math.max(input.monthlyBudget, 0) : 0;
  const savingsGoal = Number.isFinite(input.savingsGoal) ? Math.max(input.savingsGoal, 0) : 0;
  const allocated = monthlyBudget + savingsGoal;
  const remaining = monthlyIncome - allocated;

  return {
    monthlyIncome,
    monthlyBudget,
    savingsGoal,
    allocated,
    remaining,
    overspent: remaining < 0,
  };
}

export function financePlanError(input: FinancePlanInput): string | null {
  const summary = summarizeFinancePlan(input);

  if (summary.monthlyIncome <= 0) {
    return "Monthly income must be greater than 0.";
  }

  if (summary.overspent) {
    return `Invalid plan: spending (${summary.monthlyBudget}) + savings (${summary.savingsGoal}) is greater than income (${summary.monthlyIncome}). Reduce budget or savings goal.`;
  }

  return null;
}
