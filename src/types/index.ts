// Local type definitions — mirrors Prisma schema without importing from @prisma/client

export type User = {
  id: string;
  email: string;
  googleId: string | null;
  avatar: string | null;
  name: string;
  age: number;
  userType: "SCHOOL_STUDENT" | "COLLEGE_STUDENT" | "PROFESSIONAL";
  onboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Profile = {
  id: string;
  userId: string;
  institution: string | null;
  monthlyAllowance: number | null;
  incomeSources: string[];
  company: string | null;
  monthlySalary: number | null;
  industry: string | null;
  monthlyBudget: number;
  savingsGoal: number;
  currency: string;
  spendingPattern: string;
  cycleStartDate: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Transaction = {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  isNecessary: boolean | null;
  aiNote: string | null;
  date: Date;
  createdAt: Date;
};

export type Budget = {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: number;
  year: number;
  spent: number;
};

export type Goal = {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: Date | null;
  achieved: boolean;
  createdAt: Date;
};

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
