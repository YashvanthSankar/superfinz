"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Search,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";

import {
  LEARN_ARTICLES,
  LEARN_CATEGORIES,
  type Category,
  type Level,
} from "@/lib/learn-content";

const CAT_META: Record<Category, { icon: React.ElementType; bar: string; label: string }> = {
  Basics: { icon: Shield, bar: "bg-amber-500", label: "Foundation" },
  Investing: { icon: TrendingUp, bar: "bg-blue-500", label: "Grow wealth" },
  Retirement: { icon: BookOpen, bar: "bg-violet-500", label: "Long-term" },
  Advanced: { icon: Zap, bar: "bg-rose-500", label: "Deep dive" },
};

const LEVEL_STYLE: Record<Level, string> = {
  Beginner: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Intermediate: "text-amber-700 bg-amber-50 border-amber-200",
  Advanced: "text-red-700 bg-red-50 border-red-200",
};

export default function LearnPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof LEARN_CATEGORIES)[number]>("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return LEARN_ARTICLES.filter((article) => {
      const matchCat = category === "All" || article.category === category;
      const matchSearch =
        q.length === 0 ||
        article.title.toLowerCase().includes(q) ||
        article.subtitle.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [search, category]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#713f12]">Learn</h1>
        <p className="text-[#b45309] text-sm mt-0.5 font-light">
          Financial concepts explained clearly in dedicated lessons
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["Basics", "Investing", "Retirement", "Advanced"] as const).map((cat) => {
          const count = LEARN_ARTICLES.filter((a) => a.category === cat).length;
          const meta = CAT_META[cat];
          const Icon = meta.icon;
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(active ? "All" : cat)}
              className={`rounded-xl border p-4 text-left transition-all ${
                active
                  ? "bg-[#713f12] border-[#713f12] text-[#fefce8]"
                  : "bg-[#fefce8] border-amber-400 hover:border-amber-500"
              }`}
            >
              <Icon size={16} className={active ? "text-amber-300" : "text-[#b45309]"} />
              <p className={`text-sm font-bold mt-2 ${active ? "text-[#fefce8]" : "text-[#713f12]"}`}>{cat}</p>
              <p className={`text-[11px] font-light ${active ? "text-amber-200" : "text-[#92400e]"}`}>{meta.label}</p>
              <p className={`text-[11px] mt-0.5 font-light ${active ? "text-amber-300" : "text-[#b45309]"}`}>
                {count} {count === 1 ? "article" : "articles"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b45309]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics — SIP, FIRE, inflation..."
            className="w-full pl-8 pr-4 py-2.5 bg-[#fefce8] border border-amber-400 rounded-xl text-sm text-[#713f12] placeholder-[#b45309]/50 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto shrink-0">
          {LEARN_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                category === c
                  ? "bg-[#713f12] text-[#fefce8] border-[#713f12]"
                  : "bg-[#fefce8] text-[#b45309] border-amber-400 hover:border-amber-500"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#fefce8] rounded-2xl border border-amber-400">
          <p className="text-[#78350f] font-medium">No articles found</p>
          <p className="text-[#b45309] text-sm mt-1 font-light">Try a different search term or ask Finz directly</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((article) => {
            const meta = CAT_META[article.category];
            return (
              <Link
                key={article.id}
                href={`/dashboard/learn/${article.id}`}
                className="bg-[#fefce8] border border-amber-400 rounded-xl text-left hover:border-amber-500 hover:shadow-md transition-all group overflow-hidden"
              >
                <div className={`h-0.5 w-full ${meta.bar}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${LEVEL_STYLE[article.level]}`}>
                        {article.level}
                      </span>
                      <span className="text-[9px] text-[#b45309] font-light">{article.category}</span>
                    </div>
                    <ChevronRight size={13} className="text-amber-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="text-sm font-bold text-[#713f12] leading-snug mb-1">{article.title}</h3>
                  <p className="text-[11px] text-[#b45309] font-light leading-relaxed line-clamp-2">{article.subtitle}</p>
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-amber-100">
                    <Clock size={9} className="text-[#b45309]/50" />
                    <span className="text-[10px] text-[#b45309]/50">{article.readMins} min read</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="bg-[#fef9c3] border border-amber-300 rounded-xl px-5 py-4 flex items-start gap-3">
        <div className="w-1 self-stretch rounded-full bg-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#713f12]">Cannot find the topic you are looking for?</p>
          <p className="text-xs text-[#b45309] font-light mt-0.5">
            Ask Finz — the AI assistant can explain any financial term or concept in plain language.
          </p>
        </div>
      </div>
    </div>
  );
}
