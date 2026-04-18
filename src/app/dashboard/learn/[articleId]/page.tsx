import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";

import { getLearnArticleById } from "@/lib/learn-content";

const LEVEL_STYLE: Record<string, string> = {
  Beginner: "bg-good-soft text-good",
  Intermediate: "bg-accent-soft text-accent",
  Advanced: "bg-bad-soft text-bad",
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
    <div className="space-y-5 max-w-3xl mx-auto">
      <Link
        href="/dashboard/learn"
        className="inline-flex items-center gap-1.5 brut-btn bg-paper text-ink h-9 text-[11px]"
      >
        <ChevronLeft size={13} strokeWidth={2.75} />
        Back to Learn
      </Link>

      <article className="brut-card p-0 overflow-hidden">
        {/* ── Header ── */}
        <div className="px-5 sm:px-6 py-5 border-b-2 border-ink bg-paper-2">
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className={`brut-stamp ${LEVEL_STYLE[article.level]}`}>{article.level}</span>
            <span className="brut-stamp bg-paper">{article.category}</span>
            <span className="inline-flex items-center gap-1 brut-label">
              <Clock size={11} strokeWidth={2.75} />
              {article.readMins} min read
            </span>
          </div>

          <h1 className="brut-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-[0.95]">
            {article.title}
          </h1>
          <p className="text-sm sm:text-base text-ink-soft font-semibold mt-3 leading-relaxed">
            {article.subtitle}
          </p>
        </div>

        {/* ── Content ── */}
        <div className="px-5 sm:px-6 py-6 sm:py-8 space-y-7">
          {article.content.map((section, index) => (
            <section key={`${article.id}-${index}`} className="space-y-3">
              {section.heading && (
                <h2 className="brut-display text-xl sm:text-2xl text-ink pb-1 border-b-2 border-ink">
                  {section.heading}
                </h2>
              )}
              <p className="text-sm sm:text-[15px] text-ink leading-relaxed whitespace-pre-line font-medium">
                {section.body}
              </p>
            </section>
          ))}

          {/* Apply-in-SuperFinz action box */}
          <div className="mt-6 border-2 border-ink overflow-hidden shadow-[4px_4px_0_var(--ink)]">
            <div className="bg-ink px-4 py-2">
              <p className="brut-label text-accent">Apply in SuperFinz</p>
            </div>
            <div className="px-4 py-3 bg-accent-soft">
              <p className="text-sm text-ink font-semibold leading-relaxed">{article.applyText}</p>
            </div>
          </div>
        </div>
      </article>

      <div className="flex justify-between items-center gap-3">
        <Link
          href="/dashboard/learn"
          className="brut-btn bg-paper text-ink h-10 text-xs"
        >
          <ChevronLeft size={14} strokeWidth={2.75} />
          All articles
        </Link>
      </div>
    </div>
  );
}
