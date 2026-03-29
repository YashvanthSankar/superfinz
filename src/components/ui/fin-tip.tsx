"use client";
import { useState } from "react";
import Link from "next/link";

const TIPS: Record<string, { short: string; learnId?: string }> = {
  SIP:          { short: "Systematic Investment Plan — invest a fixed amount monthly, automatically.", learnId: "what-is-sip" },
  CAGR:         { short: "Compound Annual Growth Rate — how fast your investment grows per year.", learnId: "what-is-cagr" },
  FIRE:         { short: "Financial Independence, Retire Early — build wealth to never need a job again.", learnId: "what-is-fire" },
  "NIFTY 50":   { short: "India's 50 largest companies in one investment. ~12% average annual return.", learnId: "nifty-50" },
  corpus:       { short: "The total invested amount needed to fund your retirement lifestyle.", learnId: "four-percent-rule" },
  "4% rule":    { short: "Withdraw 4% of your corpus yearly — it lasts forever. Your FIRE withdrawal rate.", learnId: "four-percent-rule" },
  inflation:    { short: "Prices rise ~6%/year in India. Your money must grow faster than this.", learnId: "inflation" },
  compounding:  { short: "Your money earns returns, then those returns earn returns. Snowball effect.", learnId: "compound-interest" },
  "index fund": { short: "A fund that tracks an index like NIFTY 50. Low cost, beats most active funds.", learnId: "nifty-50" },
  "25x rule":   { short: "Save 25× your annual expenses to retire. Derived from the 4% withdrawal rule.", learnId: "four-percent-rule" },
};

interface FinTipProps {
  term: keyof typeof TIPS;
  children?: React.ReactNode;
}

export function FinTip({ term, children }: FinTipProps) {
  const [show, setShow] = useState(false);
  const tip = TIPS[term];
  if (!tip) return <>{children ?? term}</>;

  return (
    <span className="relative inline-flex items-center gap-0.5">
      <span>{children ?? term}</span>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-200 text-amber-800 text-[8px] font-black leading-none hover:bg-amber-400 transition-colors cursor-help ml-0.5 shrink-0"
        aria-label={`What is ${term}?`}
      >
        ?
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 bg-[var(--text)] text-[var(--bg)] rounded-xl px-3 py-2.5 shadow-xl text-left pointer-events-auto">
          <span className="block text-[10px] font-bold text-amber-300 mb-0.5">{term}</span>
          <span className="block text-[11px] font-light leading-relaxed">{tip.short}</span>
          {tip.learnId && (
            <Link
              href={`/dashboard/learn#${tip.learnId}`}
              onClick={() => setShow(false)}
              className="block text-[10px] text-amber-400 hover:text-amber-300 mt-1.5 font-medium"
            >
              Read full article →
            </Link>
          )}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text)]" />
        </span>
      )}
    </span>
  );
}
