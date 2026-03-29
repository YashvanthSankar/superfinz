"use client";
import { useEffect, useState } from "react";

type Article = {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string };
  category?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Banking: "bg-blue-50 text-blue-600 border-blue-100",
  Markets: "bg-emerald-50 text-emerald-600 border-emerald-100",
  Fintech: "bg-violet-50 text-violet-600 border-violet-100",
  "Personal Finance": "bg-amber-50 text-amber-600 border-amber-100",
  "Gen Z Finance": "bg-pink-50 text-pink-600 border-pink-100",
  Tax: "bg-orange-50 text-orange-600 border-orange-100",
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "mock">("mock");

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((d) => {
        setArticles(d.articles ?? []);
        setSource(d.source);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Finance News</h1>
          <p className="text-[var(--accent)] text-sm mt-0.5 font-light">What&apos;s moving the market today</p>
        </div>
        {source === "mock" && (
          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1.5 rounded-lg font-medium">
            demo mode
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[var(--bg)] border border-amber-400 rounded-2xl p-5 animate-pulse shadow-sm">
              <div className="h-3 bg-[var(--surface)] rounded w-1/4 mb-4" />
              <div className="h-4 bg-[var(--surface)] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[var(--surface)] rounded w-full mb-2" />
              <div className="h-3 bg-[var(--surface)] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.url !== "#" ? article.url : undefined}
              target={article.url !== "#" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="bg-[var(--bg)] rounded-2xl border border-amber-400 p-5 shadow-sm h-full hover:border-amber-200 hover:shadow-md transition-all">
                {article.category && (
                  <span
                    className={`inline-block text-[10px] px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wide border mb-3 ${
                      CATEGORY_COLORS[article.category] ?? "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]"
                    }`}
                  >
                    {article.category}
                  </span>
                )}
                <h3 className="text-[var(--text)] font-semibold text-sm leading-snug mb-2 group-hover:text-amber-600 transition-colors">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-[var(--muted)] text-xs leading-relaxed line-clamp-2 font-light">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--surface)]">
                  <span className="text-[10px] text-[var(--accent)] font-medium">{article.source.name}</span>
                  <span className="text-[10px] text-[var(--accent)]">
                    {new Date(article.publishedAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short",
                    })}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
