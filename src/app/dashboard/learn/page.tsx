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

const CAT_META: Record<Category, { icon: React.ElementType; label: string }> = {
  Basics:     { icon: Shield,     label: "Start here" },
  Investing:  { icon: TrendingUp, label: "Grow wealth" },
  Retirement: { icon: BookOpen,   label: "Long-term" },
  Advanced:   { icon: Zap,        label: "Deep dive" },
};

const CAT_STRIPE: Record<Category, string> = {
  Basics:     "bg-accent",
  Investing:  "bg-good",
  Retirement: "bg-ink",
  Advanced:   "bg-bad",
};

const LEVEL_STYLE: Record<Level, string> = {
  Beginner:     "bg-good-soft text-good",
  Intermediate: "bg-accent-soft text-accent",
  Advanced:     "bg-bad-soft text-bad",
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
          <p className="brut-label mb-1">{totalArticles} lessons</p>
          <h1 className="brut-display text-4xl sm:text-5xl text-ink">Learn.</h1>
          <p className="text-ink-soft text-sm font-semibold mt-1">Finance explained in plain language.</p>
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
              className={`border-2 border-ink p-4 text-left shadow-[2px_2px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_var(--ink)] transition-[transform,box-shadow] duration-75 ${
                active ? "bg-accent text-paper" : "bg-paper text-ink"
              }`}
            >
              <div className={`w-9 h-9 border-2 border-ink flex items-center justify-center mb-3 ${active ? "bg-paper" : "bg-accent-soft"}`}>
                <Icon size={16} className={active ? "text-ink" : "text-ink"} strokeWidth={2.5} />
              </div>
              <p className={`brut-display text-lg leading-tight ${active ? "text-paper" : "text-ink"}`}>{cat}</p>
              <p className={`text-[11px] mt-0.5 font-bold uppercase tracking-wider ${active ? "text-paper/80" : "text-ink-soft"}`}>{meta.label}</p>
              <p className={`text-[10px] mt-1.5 font-black tabular ${active ? "text-paper/70" : "text-mute"}`}>
                {count} {count === 1 ? "article" : "articles"}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Search + filter row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink" strokeWidth={2.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search — SIP, FIRE, inflation..."
            className="w-full pl-9 pr-4 h-11 bg-paper border-2 border-ink text-sm text-ink font-semibold placeholder:text-mute placeholder:font-normal focus:outline-none focus:bg-accent-soft"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto shrink-0">
          {LEARN_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`brut-btn h-11 text-[11px] whitespace-nowrap ${
                category === c ? "bg-ink text-paper" : "bg-paper text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 brut-card">
          <BookOpen size={32} className="mx-auto text-ink mb-3" strokeWidth={2} />
          <p className="brut-display text-2xl text-ink">No articles match.</p>
          <p className="text-ink-soft text-sm mt-1 font-semibold">Try a different search or ask Finz</p>
        </div>
      ) : (
        <>
          <p className="brut-label px-0.5">
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
            {category !== "All" ? ` in ${category}` : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article) => {
              const stripe = CAT_STRIPE[article.category];
              return (
                <Link
                  key={article.id}
                  href={`/dashboard/learn/${article.id}`}
                  className="group brut-card-sm border-2 border-ink bg-paper shadow-[2px_2px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_var(--ink)] transition-[transform,box-shadow] duration-75 overflow-hidden flex flex-col"
                >
                  <div className={`h-2 w-full ${stripe} shrink-0 border-b-2 border-ink`} />

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`brut-stamp ${LEVEL_STYLE[article.level]}`}>
                          {article.level}
                        </span>
                        <span className="brut-stamp bg-paper-2">
                          {article.category}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-ink shrink-0 group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} />
                    </div>

                    <h3 className="brut-display text-lg text-ink leading-snug mb-2">
                      {article.title}
                    </h3>
                    <p className="text-[12px] text-ink-soft font-semibold leading-relaxed line-clamp-2 flex-1">
                      {article.subtitle}
                    </p>

                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t-2 border-ink">
                      <Clock size={11} className="text-ink" strokeWidth={2.5} />
                      <span className="brut-label text-[10px] tabular">{article.readMins} min read</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* ── Ask Finz nudge ── */}
      <div className="flex items-start gap-3 border-2 border-ink bg-accent-soft px-5 py-4 shadow-[4px_4px_0_var(--ink)]">
        <div className="w-10 h-10 bg-accent border-2 border-ink flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare size={16} className="text-paper" strokeWidth={2.5} />
        </div>
        <div>
          <p className="brut-label">Can&apos;t find it?</p>
          <p className="text-xs text-ink font-semibold mt-0.5 leading-relaxed">
            Ask Finz — the AI in the bottom-right can explain any concept instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
