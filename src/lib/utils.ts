import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const SPENDING_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
  "Utilities",
  "Rent",
  "Subscriptions",
  "Other",
] as const;

export type SpendingCategory = (typeof SPENDING_CATEGORIES)[number];
