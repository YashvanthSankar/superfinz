"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

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
  Banking: "bg-blue-500/10 text-blue-400",
  Markets: "bg-green-500/10 text-green-400",
  Fintech: "bg-purple-500/10 text-purple-400",
  "Personal Finance": "bg-yellow-500/10 text-yellow-400",
  "Gen Z Finance": "bg-pink-500/10 text-pink-400",
  Tax: "bg-orange-500/10 text-orange-400",
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
          <h1 className="text-2xl font-bold text-white">Finance News 📰</h1>
          <p className="text-[#8888aa] text-sm mt-0.5">what&apos;s moving the market today</p>
        </div>
        {source === "mock" && (
          <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-lg">
            demo mode — add NEWS_API_KEY for live
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-[#2a2a3a] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[#2a2a3a] rounded w-full mb-2" />
              <div className="h-3 bg-[#2a2a3a] rounded w-2/3" />
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
              <Card className="h-full hover:border-[#3a3a5a] transition-all group-hover:bg-[#141420]">
                {article.category && (
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-lg font-medium mb-3 ${
                      CATEGORY_COLORS[article.category] ?? "bg-[#2a2a3a] text-[#8888aa]"
                    }`}
                  >
                    {article.category}
                  </span>
                )}
                <h3 className="text-white font-semibold text-sm leading-snug mb-2 group-hover:text-[#00ff88] transition-colors">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-[#8888aa] text-xs leading-relaxed line-clamp-2">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a3a]">
                  <span className="text-xs text-[#4a4a6a]">{article.source.name}</span>
                  <span className="text-xs text-[#4a4a6a]">
                    {new Date(article.publishedAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short",
                    })}
                  </span>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
