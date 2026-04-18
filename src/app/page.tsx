"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/ui/logo";
import {
  Brain,
  BarChart3,
  Flame,
  Calculator,
  Target,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

// ─── Static mock data ────────────────────────────────────────────
const MOCK_TX = [
  { name: "Biryani at Murugan's", cat: "FOOD", amt: "₹180", ok: false },
  { name: "Rapido to college", cat: "TRN", amt: "₹45", ok: true },
  { name: "Spotify Premium", cat: "SUB", amt: "₹119", ok: true },
  { name: "Amazon impulse buy", cat: "SHOP", amt: "₹899", ok: false },
];

const FEATURES = [
  { n: "01", icon: Brain, title: "Smart onboarding", body: "Built for students and professionals. Tailored budget plan from day one." },
  { n: "02", icon: Sparkles, title: "AI spend analysis", body: "Every rupee gets an instant verdict. Necessary or not, with a Gen Z roast." },
  { n: "03", icon: BarChart3, title: "Spending heatmap", body: "90 days of spending in one grid. Spot impulse streaks before they calcify." },
  { n: "04", icon: Calculator, title: "Calculators", body: "SIP, FD, EMI with live charts. Confusing math into one clear number." },
  { n: "05", icon: Target, title: "Goals & budgets", body: "Per-category limits. Track savings. Smart-split leftover cash." },
  { n: "06", icon: Flame, title: "Retirement planner", body: "See your FIRE score, corpus gap, and how many biryani skips to freedom." },
];

const MARQUEE_ITEMS = [
  "Track every rupee",
  "Beat retirement blindness",
  "AI roasts of bad spends",
  "FIRE calculator built-in",
  "Spending heatmap",
  "SIP · FD · EMI",
  "India-first finance news",
  "Google sign-in · no password",
  "Retirement readiness score",
  "12 finance articles free",
];

// ─── Heatmap seed (deterministic) ─────────────────────────────────
function seed(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const HEATMAP = Array.from({ length: 49 }, (_, i) => {
  const v = seed(i);
  if (v < 0.42) return 0;
  if (v < 0.62) return 1;
  if (v < 0.78) return 2;
  if (v < 0.91) return 3;
  return 4;
});

const HEATMAP_COLORS = [
  "bg-paper-2",
  "bg-accent-soft",
  "bg-accent-mid",
  "bg-accent",
  "bg-ink",
];

// ─── Marquee ───────────────────────────────────────────────────────
function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden border-y-2 border-ink bg-ink text-paper py-4 select-none">
      <div className="flex gap-12 whitespace-nowrap animate-marquee">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-black uppercase tracking-wider shrink-0">
            <span className="w-2 h-2 bg-accent shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Landing ───────────────────────────────────────────────────────
export default function Landing() {
  const [signing, setSigning] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (installPrompt as any).prompt();
    setInstallPrompt(null);
  };

  const go = async () => {
    setSigning(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ─── Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-paper border-b-2 border-ink">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Logo size="xl" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block brut-label">Free for students</span>
            <button
              onClick={go}
              disabled={signing}
              className="brut-btn bg-ink text-paper h-10 text-xs"
            >
              <GoogleIcon size={14} />
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
        <div className="inline-flex items-center gap-2 border-2 border-ink bg-accent-soft px-3 h-8 mb-8">
          <span className="w-2 h-2 bg-accent animate-pulse" />
          <span className="brut-label text-[10px]">Public beta · Free for students</span>
        </div>

        <h1 className="brut-display text-[clamp(2rem,7vw,4.5rem)] leading-[0.95] text-ink max-w-[16ch]">
          Retirement
          <br />
          <span className="text-accent">planning for Gen Z</span>
          <br />
          who are done
          <br />
          being blind.
        </h1>

        <p className="mt-6 sm:mt-8 text-base sm:text-lg max-w-xl text-ink-soft font-semibold leading-relaxed">
          SuperFinz turns daily spending into clear future impact. Track expenses, get AI nudges, build retirement clarity — in one dashboard.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <button
            onClick={go}
            disabled={signing}
            className="brut-btn bg-accent text-paper h-12 sm:h-14 text-xs sm:text-sm px-5 sm:px-6"
          >
            {signing ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <GoogleIcon size={18} />
            )}
            Continue with Google
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2 text-ink-soft">
            <span className="brut-label">No password</span>
            <span>·</span>
            <span className="brut-label">2 min setup</span>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="mt-12 sm:mt-20 relative">
          <div className="brut-card-lg border-2 border-ink overflow-hidden">
            {/* Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-ink bg-paper-2">
              <div className="w-3 h-3 border-2 border-ink bg-bad" />
              <div className="w-3 h-3 border-2 border-ink bg-warn" />
              <div className="w-3 h-3 border-2 border-ink bg-good" />
              <div className="mx-auto flex items-center gap-2 border-2 border-ink bg-paper px-3 py-1">
                <div className="w-1.5 h-1.5 bg-good" />
                <span className="brut-label text-[10px]">superfinz.app/dashboard</span>
              </div>
            </div>

            <div className="flex bg-paper">
              {/* Mock sidebar */}
              <div className="hidden sm:flex flex-col w-36 md:w-44 border-r-2 border-ink p-3 gap-1 shrink-0 bg-paper-2">
                <div className="px-3 py-1.5 mb-2">
                  <Logo size="sm" />
                </div>
                {["Overview", "Transactions", "Heatmap", "Calculators", "News", "Goals"].map((label, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 px-2.5 h-9 border-2 text-[10px] font-black uppercase tracking-wider ${
                      i === 0 ? "bg-ink text-paper border-ink" : "border-transparent text-ink"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="flex-1 p-4 sm:p-5 space-y-3 sm:space-y-4 min-w-0">
                <div>
                  <p className="brut-label mb-1">Saturday, 28 March 2026</p>
                  <p className="brut-display text-2xl sm:text-3xl text-ink">
                    Good morning, <span className="text-accent">Yashvanth.</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { l: "Spent", v: "₹3,240", s: "of ₹5,000", c: "text-ink" },
                    { l: "Remaining", v: "₹1,760", s: "left to spend", c: "text-good" },
                    { l: "Savings rate", v: "28%", s: "vs last month", c: "text-good" },
                    { l: "Budget used", v: "65%", s: "on track", c: "text-accent" },
                  ].map((s) => (
                    <div key={s.l} className="border-2 border-ink p-3">
                      <p className="brut-label text-[9px]">{s.l}</p>
                      <p className={`brut-display text-xl mt-1 tabular ${s.c}`}>{s.v}</p>
                      <p className="text-[9px] text-ink-soft mt-1 font-semibold">{s.s}</p>
                    </div>
                  ))}
                </div>
                <div className="border-2 border-ink p-4">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-ink">
                    <p className="brut-label">Recent spends</p>
                    <p className="brut-label text-accent">View all →</p>
                  </div>
                  <div className="space-y-2">
                    {MOCK_TX.map((tx, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-ink text-paper flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-black tracking-wider">{tx.cat}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] truncate font-black text-ink">{tx.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[12px] font-black text-ink tabular">{tx.amt}</p>
                          <p className={`text-[9px] font-black uppercase ${tx.ok ? "text-good" : "text-bad"}`}>
                            {tx.ok ? "necessary" : "skip"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div className="hidden lg:flex flex-col w-44 border-l-2 border-ink p-4 shrink-0 bg-paper-2">
                <p className="brut-label mb-3">Heatmap</p>
                <div className="grid grid-cols-7 gap-0.5">
                  {HEATMAP.map((v, i) => (
                    <div key={i} className={`aspect-square border border-ink ${HEATMAP_COLORS[v]}`} />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="brut-label text-[9px]">Less</span>
                  <span className="brut-label text-[9px]">More</span>
                </div>
                <div className="mt-5 space-y-2.5">
                  <p className="brut-label">Goals</p>
                  {[
                    { name: "MacBook", pct: 62 },
                    { name: "Goa trip", pct: 34 },
                  ].map((g) => (
                    <div key={g.name}>
                      <div className="flex justify-between text-[10px] mb-1 font-black">
                        <span className="text-ink uppercase">{g.name}</span>
                        <span className="text-accent tabular">{g.pct}%</span>
                      </div>
                      <div className="h-2 border-2 border-ink overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${g.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Marquee ─────────────────────────────────────────────── */}
      <Marquee />

      {/* ─── Stats ───────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-paper border-b-2 border-ink">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-0 border-2 border-ink shadow-[4px_4px_0_var(--ink)] sm:shadow-[6px_6px_0_var(--ink)]">
          {[
            { val: "2,400+", label: "Active users", icon: TrendingUp },
            { val: "₹8L+", label: "Money tracked", icon: BarChart3 },
            { val: "21,000+", label: "Transactions logged", icon: Target },
          ].map(({ val, label, icon: Icon }, i) => (
            <div
              key={label}
              className={`p-6 sm:p-8 text-center bg-paper ${i > 0 ? "border-t-2 sm:border-t-0 sm:border-l-2 border-ink" : ""}`}
            >
              <Icon size={18} strokeWidth={2.5} className="mx-auto mb-2 text-accent" />
              <p className="brut-display text-3xl sm:text-4xl lg:text-5xl text-ink tabular">{val}</p>
              <p className="brut-label mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto py-14 sm:py-20 lg:py-24 px-4 sm:px-6">
        <div className="mb-8 sm:mb-12">
          <p className="brut-label mb-2">What&apos;s inside</p>
          <h2 className="brut-display text-[clamp(1.75rem,5vw,3rem)] text-ink leading-[0.95]">
            Everything you need.
            <br />
            <span className="text-accent">To fix retirement blindness early.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="brut-card p-5 sm:p-6 relative overflow-hidden hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_var(--ink)] transition-[transform,box-shadow] duration-75"
              >
                <span className="absolute -top-2 -right-1 brut-display text-7xl text-ink/5 select-none pointer-events-none">
                  {f.n}
                </span>
                <div className="w-10 h-10 border-2 border-ink bg-accent text-paper flex items-center justify-center mb-4 relative">
                  <Icon size={16} strokeWidth={2.5} />
                </div>
                <h3 className="brut-display text-lg sm:text-xl text-ink mb-2 relative">{f.title}</h3>
                <p className="text-sm text-ink-soft font-semibold leading-relaxed relative">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── AI Demo ─────────────────────────────────────────────── */}
      <section className="border-y-2 border-ink bg-paper-2 py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <p className="brut-label mb-2 text-accent">AI Spend Check</p>
            <h2 className="brut-display text-[clamp(1.5rem,4vw,2.5rem)] text-ink leading-[0.95] mb-5">
              Your AI advisor
              <br />
              <span className="text-accent">shows the true cost.</span>
            </h2>
            <p className="text-ink-soft font-semibold leading-relaxed mb-6">
              Log a spend. Instantly see how that choice affects your savings path. Real context. Real math. Real consequences.
            </p>
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-accent" strokeWidth={2.5} />
              <span className="brut-label">Powered by Groq + Llama 3</span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { user: "Logged: Biryani ₹180 · Food", ai: "bro you ate out 4× this week — ₹180/day = ₹2,160/yr. invest it.", roast: true },
              { user: "Logged: Rapido ₹45 · Transport", ai: "looks necessary — ₹45 for transport, tracked ✓", roast: false },
              { user: "Logged: Amazon ₹899 · Shopping", ai: "impulse at 11pm? sleep on it — 3 days of your food budget gone.", roast: true },
            ].map((m, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-end gap-2 justify-end">
                  <div className="brut-card-sm bg-ink text-paper px-3.5 py-2 text-sm font-semibold max-w-[80%]">
                    {m.user}
                  </div>
                  <div className="w-7 h-7 border-2 border-ink bg-paper-2 flex items-center justify-center text-[10px] font-black">
                    you
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 border-2 border-ink bg-accent flex items-center justify-center text-[10px] font-black text-paper">
                    AI
                  </div>
                  <div
                    className={`brut-card-sm px-3.5 py-2 text-sm font-medium max-w-[80%] ${
                      m.roast ? "bg-accent-soft text-ink" : "bg-good-soft text-good"
                    }`}
                  >
                    {m.ai}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-ink text-paper overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(var(--paper) 2px, transparent 2px), linear-gradient(90deg, var(--paper) 2px, transparent 2px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="brut-label text-accent mb-4 sm:mb-6">Start now</p>
          <h2 className="brut-display text-[clamp(2.25rem,8vw,4.5rem)] leading-[0.95] mb-6 sm:mb-8">
            See your
            <br />
            <span className="text-accent">future.</span>
          </h2>
          <p className="text-paper/70 font-semibold mb-8 sm:mb-10 text-sm sm:text-base">
            Free forever · Google sign-in · Built to beat retirement blindness.
          </p>
          <button
            onClick={go}
            disabled={signing}
            className="inline-flex items-center gap-3 h-12 sm:h-14 px-6 sm:px-8 border-2 border-paper bg-accent text-paper font-black uppercase tracking-wider text-xs sm:text-sm shadow-[4px_4px_0_var(--paper)] sm:shadow-[6px_6px_0_var(--paper)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0_var(--paper)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75 disabled:opacity-60"
          >
            {signing ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <GoogleIcon size={18} />
            )}
            Continue with Google
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* ─── PWA install ─────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-paper border-t-2 border-ink">
        <div className="max-w-3xl mx-auto">
          <div className="brut-card-lg p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="shrink-0 border-2 border-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="SuperFinz" className="w-20 h-20 sm:w-24 sm:h-24" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="brut-label text-accent mb-2">Installable · No app store</p>
              <h3 className="brut-display text-2xl sm:text-3xl text-ink mb-3">Add to home screen.</h3>
              <p className="text-sm text-ink-soft font-semibold mb-6">
                Install SuperFinz for an app-like experience. Instant launch. Native feel. No Play Store.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {installed ? (
                  <div className="brut-stamp bg-good text-paper">Installed ✓</div>
                ) : installPrompt ? (
                  <button onClick={handleInstall} className="brut-btn bg-accent text-paper h-11 text-xs">
                    <ArrowDown size={14} strokeWidth={2.5} />
                    Install app
                  </button>
                ) : (
                  <p className="text-[11px] text-ink-soft font-semibold">
                    Chrome/Edge: install from the address bar · Safari: Share → Add to Home Screen
                  </p>
                )}
                <button onClick={go} disabled={signing} className="brut-btn bg-paper text-ink h-11 text-xs">
                  Or open in browser →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="px-6 py-6 bg-ink text-paper border-t-2 border-ink">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-3 justify-between">
          <Logo size="sm" />
          <p className="text-xs opacity-60 font-semibold">
            Built for Gen Z to finally get money right · SuperFinz © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
