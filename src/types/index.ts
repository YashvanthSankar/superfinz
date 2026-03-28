import type { User, Profile, Transaction, Budget, Goal } from "@prisma/client";

export type { User, Profile, Transaction, Budget, Goal };

export type UserWithProfile = User & { profile: Profile | null };

export type TransactionWithAI = Transaction & {
  isNecessary: boolean | null;
  aiNote: string | null;
};

export type DashboardData = {
  user: UserWithProfile;
  recentTransactions: TransactionWithAI[];
  budgets: Budget[];
  goals: Goal[];
  monthlySpend: number;
  monthlyIncome: number;
  savingsRate: number;
};

export type HeatmapDay = {
  date: string;
  total: number;
  count: number;
};

export type OnboardingData = {
  email: string;
  password: string;
  name: string;
  age: number;
  userType: "SCHOOL_STUDENT" | "COLLEGE_STUDENT" | "PROFESSIONAL";
  institution?: string;
  monthlyAllowance?: number;
  incomeSources?: string[];
  company?: string;
  monthlySalary?: number;
  industry?: string;
  monthlyBudget: number;
  savingsGoal: number;
};
