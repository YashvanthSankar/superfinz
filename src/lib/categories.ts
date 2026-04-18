import { SPENDING_CATEGORIES, type SpendingCategory } from "@/lib/utils";

export type CategoryMeta = {
  emoji: string;
  color: string;
};

export const CATEGORY_META: Record<SpendingCategory, CategoryMeta> = {
  Food:          { emoji: "🍜", color: "#f97316" },
  Transport:     { emoji: "🚌", color: "#3b82f6" },
  Entertainment: { emoji: "🎮", color: "#8b5cf6" },
  Shopping:      { emoji: "🛍️", color: "#ec4899" },
  Health:        { emoji: "💊", color: "#10b981" },
  Education:     { emoji: "📚", color: "#6366f1" },
  Utilities:     { emoji: "⚡", color: "#f59e0b" },
  Rent:          { emoji: "🏠", color: "#64748b" },
  Subscriptions: { emoji: "📱", color: "#06b6d4" },
  Other:         { emoji: "💸", color: "#94a3b8" },
};

export const FALLBACK_COLORS = [
  "#6366f1",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#06b6d4",
];

export function categoryEmoji(category: string): string {
  return CATEGORY_META[category as SpendingCategory]?.emoji ?? "💸";
}

export function categoryColor(category: string, index = 0): string {
  return (
    CATEGORY_META[category as SpendingCategory]?.color ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}

export { SPENDING_CATEGORIES };
