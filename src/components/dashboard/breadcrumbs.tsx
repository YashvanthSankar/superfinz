"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { LEARN_ARTICLES } from "@/lib/learn-content";

const SEGMENT_LABELS: Record<string, string> = {
  overview: "Overview",
  transactions: "Transactions",
  calculators: "Calculators",
  news: "News",
  goals: "Goals",
  profile: "Profile",
  heatmap: "Heatmap",
  retirement: "Retirement",
  learn: "Learn",
};

function toTitleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const rawSegments = pathname.split("/").filter(Boolean).slice(1);
  const segments = rawSegments.length > 0 ? rawSegments : ["overview"];

  const getLabel = (segment: string, index: number) => {
    if (index === 1 && segments[0] === "learn") {
      const article = LEARN_ARTICLES.find((item) => item.id === segment);
      if (article) return article.title;
    }

    return SEGMENT_LABELS[segment] ?? toTitleCase(segment);
  };

  return (
    <nav className="mb-2 flex items-center gap-1.5 text-xs text-[var(--accent)]" aria-label="Breadcrumb">
      <Link href="/dashboard" className="font-medium hover:text-[var(--text)] transition-colors">
        Dashboard
      </Link>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/dashboard/${segments.slice(0, index + 1).join("/")}`;
        const label = getLabel(segment, index);

        return (
          <div key={`${segment}-${index}`} className="contents">
            <ChevronRight size={12} className="text-amber-500" />
            {isLast || segment === "overview" ? (
              <span className="font-semibold text-[var(--text)] truncate">{label}</span>
            ) : (
              <Link href={href} className="font-medium hover:text-[var(--text)] transition-colors truncate">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}