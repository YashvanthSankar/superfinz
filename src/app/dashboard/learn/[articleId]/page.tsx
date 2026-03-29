import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";

import { getLearnArticleById } from "@/lib/learn-content";

const LEVEL_STYLE: Record<string, string> = {
  Beginner: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Intermediate: "text-amber-700 bg-amber-50 border-amber-200",
  Advanced: "text-red-700 bg-red-50 border-red-200",
};

type LearnArticlePageProps = {
  params: Promise<{ articleId: string }>;
};

export default async function LearnArticlePage({ params }: LearnArticlePageProps) {
  const { articleId } = await params;
  const article = getLearnArticleById(articleId);

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-amber-300 bg-[var(--bg)] overflow-hidden">
        <div className="px-6 py-5 border-b border-amber-200 bg-[var(--surface)]">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${LEVEL_STYLE[article.level]}`}>
              {article.level}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-[var(--text2)]">
              {article.category}
            </span>
            <span className="text-[10px] text-[var(--accent)] flex items-center gap-1 font-medium">
              <Clock size={10} />
              {article.readMins} min read
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] leading-tight">{article.title}</h1>
          <p className="text-sm sm:text-base text-[var(--text2)] mt-1.5 leading-relaxed">{article.subtitle}</p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {article.content.map((section, index) => (
            <article key={`${article.id}-${index}`} className="space-y-2">
              {section.heading && (
                <h2 className="text-base font-bold text-[var(--text)] pb-1 border-b border-amber-200">
                  {section.heading}
                </h2>
              )}
              <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">{section.body}</p>
            </article>
          ))}

          <div className="rounded-xl border border-amber-300 overflow-hidden mt-4">
            <div className="bg-[var(--text)] px-4 py-2">
              <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider">Apply in SuperFinz</p>
            </div>
            <div className="px-4 py-3 bg-[var(--surface)]">
              <p className="text-sm text-[var(--text)] leading-relaxed">{article.applyText}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center gap-3">
        <Link
          href="/dashboard/learn"
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-amber-500 transition-colors"
        >
          <ChevronRight size={13} className="rotate-180" />
          Back to Learn
        </Link>
      </div>
    </div>
  );
}
