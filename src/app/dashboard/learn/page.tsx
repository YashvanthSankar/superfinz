"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Shield,
  TrendingUp,
  Zap,
  Search,
  MessageSquare,
} from "lucide-react";

import {
  LEARN_ARTICLES,
  LEARN_CATEGORIES,
  type Category,
  type Level,
} from "@/lib/learn-content";

const CAT_META: Record<Category, { icon: React.ElementType; accent: string; bg: string; border: string; label: string }> = {
  Basics:     { icon: Shield,    accent: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-300",  label: "Start here" },
  Investing:  { icon: TrendingUp,accent: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300",label: "Grow wealth" },
  Retirement: { icon: BookOpen,  accent: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-300",  label: "Long-term" },
  Advanced:   { icon: Zap,       accent: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",    label: "Deep dive" },
};

// Top-bar for each card — single consistent amber stripe
const CAT_STRIPE: Record<Category, string> = {
  Basics:     "bg-amber-400",
  Investing:  "bg-emerald-400",
  Retirement: "bg-amber-500",
  Advanced:   "bg-red-400",
};

const LEVEL_STYLE: Record<Level, string> = {
  Beginner:     "text-emerald-700 bg-emerald-50 border-emerald-200",
  Intermediate: "text-amber-700  bg-amber-50  border-amber-200",
  Advanced:     "text-red-700    bg-red-50    border-red-200",
};

export default function LearnPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof LEARN_CATEGORIES)[number]>("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LEARN_ARTICLES.filter((a) => {
      const matchCat = category === "All" || a.category === category;
      const matchQ   = !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [search, category]);

  const totalArticles = LEARN_ARTICLES.length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text">Learn</h1>
          <p className="text-accent text-sm mt-0.5 font-light">
            {totalArticles} lessons — financial concepts explained in plain language
          </p>
        </div>
      </div>

      {/* ── Category cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["Basics", "Investing", "Retirement", "Advanced"] as const).map((cat) => {
          const count  = LEARN_ARTICLES.filter((a) => a.category === cat).length;
          const meta   = CAT_META[cat];
          const Icon   = meta.icon;
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(active ? "All" : cat)}
              className={`rounded-2xl border p-4 text-left transition-all hover:shadow-sm ${
                active
                  ? "bg-amber-500 border-amber-500 shadow-sm"
                  : "bg-background border-border hover:border-amber-300"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${active ? "bg-white/20" : `${meta.bg} ${meta.border} border`}`}>
                <Icon size={15} className={active ? "text-white" : meta.accent} />
              </div>
              <p className={`text-sm font-bold leading-tight ${active ? "text-white" : "text-text"}`}>{cat}</p>
              <p className={`text-[11px] mt-0.5 font-light ${active ? "text-white/80" : "text-accent"}`}>{meta.label}</p>
              <p className={`text-[10px] mt-1.5 font-semibold ${active ? "text-white/70" : "text-muted"}`}>
                {count} {count === 1 ? "article" : "articles"}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Search + filter row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search — SIP, FIRE, inflation, compounding..."
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text placeholder-accent/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition-all"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto shrink-0">
          {LEARN_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                category === c
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-background text-accent border-border hover:border-amber-300 hover:text-amber-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-background rounded-2xl border border-border">
          <BookOpen size={28} className="mx-auto text-accent/40 mb-3" />
          <p className="text-text font-medium">No articles match</p>
          <p className="text-accent text-sm mt-1 font-light">Try a different search or ask Finz directly</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-accent font-medium px-0.5">
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
            {category !== "All" ? ` in ${category}` : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((article) => {
              const stripe = CAT_STRIPE[article.category];
              return (
                <Link
                  key={article.id}
                  href={`/dashboard/learn/${article.id}`}
                  className="group bg-background border border-border rounded-2xl overflow-hidden hover:border-amber-400 hover:shadow-md transition-all flex flex-col"
                >
                  {/* Top colour stripe */}
                  <div className={`h-1 w-full ${stripe} shrink-0`} />

                  <div className="p-4 flex flex-col flex-1">
                    {/* Badges row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${LEVEL_STYLE[article.level]}`}>
                          {article.level}
                        </span>
                        <span className="text-[9px] text-accent font-medium bg-surface border border-border px-1.5 py-0.5 rounded">
                          {article.category}
                        </span>
                      </div>
                      <ChevronRight size={13} className="text-accent/40 shrink-0 group-hover:translate-x-0.5 group-hover:text-amber-500 transition-all" />
                    </div>

                    {/* Title + subtitle */}
                    <h3 className="text-sm font-bold text-text leading-snug mb-1.5 group-hover:text-amber-700 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-[11px] text-accent font-light leading-relaxed line-clamp-2 flex-1">
                      {article.subtitle}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-surface">
                      <Clock size={10} className="text-accent/50" />
                      <span className="text-[10px] text-accent/60 font-light">{article.readMins} min read</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* ── Ask Finz nudge ── */}
      <div className="flex items-start gap-3 bg-surface border border-border rounded-2xl px-5 py-4">
        <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare size={14} className="text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text">Can&apos;t find what you&apos;re looking for?</p>
          <p className="text-xs text-accent font-light mt-0.5 leading-relaxed">
            Ask Finz — the AI in the bottom-right corner can explain any financial concept in plain language, instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
