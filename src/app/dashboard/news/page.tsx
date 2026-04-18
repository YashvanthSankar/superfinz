"use client";
import { useEffect, useState } from "react";
import { apiFetch, FetchError } from "@/lib/fetcher";

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
  Banking: "bg-paper text-ink",
  Markets: "bg-good-soft text-good",
  Fintech: "bg-accent-soft text-accent",
  "Personal Finance": "bg-warn-soft text-ink",
  "Gen Z Finance": "bg-ink text-paper",
  Tax: "bg-bad-soft text-bad",
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    apiFetch<{ articles: Article[]; source: "live" | "mock" }>("/api/news")
      .then((d) => {
        setArticles(d.articles ?? []);
        setSource(d.source);
      })
      .catch((err) => setError(err instanceof FetchError ? err.message : "Failed to load news"))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="brut-label mb-1">Market intel</p>
          <h1 className="brut-display text-4xl sm:text-5xl text-ink">News.</h1>
          <p className="text-ink-soft text-sm font-semibold mt-1">What&apos;s moving the market today.</p>
        </div>
        {source === "mock" && (
          <span className="brut-stamp bg-warn text-ink">Demo mode</span>
        )}
      </div>

      {error && !loading && (
        <div className="border-2 border-ink bg-bad-soft px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-bad font-bold">{error}</span>
          <button onClick={load} className="brut-btn bg-bad text-paper text-[11px] h-8 px-3">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="brut-card p-5 animate-pulse">
              <div className="h-3 bg-paper-2 w-1/4 mb-4" />
              <div className="h-5 bg-paper-2 w-3/4 mb-3" />
              <div className="h-3 bg-paper-2 w-full mb-2" />
              <div className="h-3 bg-paper-2 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {articles.map((article, i) => {
            const hasLink = article.url && article.url !== "#";
            const CardInner = (
              <div className="brut-card p-5 h-full hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_var(--ink)] transition-[transform,box-shadow] duration-75">
                {article.category && (
                  <span className={`brut-stamp mb-3 ${CATEGORY_COLORS[article.category] ?? "bg-paper-2"}`}>
                    {article.category}
                  </span>
                )}
                <h3 className="brut-display text-lg text-ink leading-snug my-2 group-hover:text-accent transition-colors">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-ink-soft text-xs leading-relaxed line-clamp-2 font-semibold">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-ink">
                  <span className="brut-label text-[10px]">{article.source.name}</span>
                  <span className="text-[10px] text-ink-soft font-bold tabular">
                    {new Date(article.publishedAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short",
                    })}
                  </span>
                </div>
              </div>
            );

            return hasLink ? (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                {CardInner}
              </a>
            ) : (
              <div key={i} className="block group">{CardInner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
