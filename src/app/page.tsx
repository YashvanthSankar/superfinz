"use client";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/ui/logo";

function seed(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, ms = 1800, go = false) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go) return;
    let t: number | null = null;
    const step = (ts: number) => {
      if (!t) t = ts;
      const p = Math.min((ts - t) / ms, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [go, target, ms]);
  return v;
}

const HEATMAP = Array.from({ length: 70 }, (_, i) => {
  const v = seed(i);
  if (v < 0.42) return 0;
  if (v < 0.62) return 1;
  if (v < 0.78) return 2;
  if (v < 0.91) return 3;
  return 4;
});

const MOCK_TX = [
  { name: "Biryani at Murugan's",  cat: "Food",          amt: "₹180", ok: false },
  { name: "Rapido to college",      cat: "Transport",     amt: "₹45",  ok: true },
  { name: "Spotify Premium",        cat: "Subscriptions", amt: "₹119", ok: true },
  { name: "Amazon impulse buy",     cat: "Shopping",      amt: "₹899", ok: false },
];

const FEATURES = [
  { n: "01", title: "Smart onboarding",       body: "Student, college, or professional — everything adapts to your financial reality from day one." },
  { n: "02", title: "AI spend analysis",      body: "Every transaction gets a real assessment. Overspending? You'll hear about it in language that lands." },
  { n: "03", title: "Spending heatmap",       body: "GitHub-style calendar showing where your money bleeds. Patterns you've never spotted before." },
  { n: "04", title: "Investment calculators", body: "SIP, FD, EMI with live charts. See exactly what your money can grow into." },
  { n: "05", title: "Finance news",           body: "India-first curated finance news — markets, personal finance, and smart money moves daily." },
  { n: "06", title: "Goal tracker",           body: "Set targets, log progress, celebrate milestones. Your savings journey, beautifully visualized." },
];

const HEATMAP_COLORS = ["bg-slate-100","bg-amber-100","bg-amber-200","bg-amber-400","bg-amber-600"];

export default function Landing() {
  const [signing, setSigning] = useState(false);
  const { ref: statsRef, inView: statsIn } = useInView(0.3);
  const { ref: featRef,  inView: featIn  } = useInView(0.1);
  const { ref: demoRef,  inView: demoIn  } = useInView(0.2);

  const users  = useCountUp(12847, 1800, statsIn);
  const crores = useCountUp(42,    2000, statsIn);
  const txns   = useCountUp(93000, 1600, statsIn);

  const go = async () => { setSigning(true); await signIn("google", { callbackUrl: "/dashboard" }); };

  return (
    <div className="bg-[#fefce8] text-[#713f12] min-h-screen overflow-x-hidden selection:bg-amber-100">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fefce8]/80 backdrop-blur-lg border-b border-[#fef9c3]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-[#78350f]">Free · No credit card</span>
            <button
              onClick={go} disabled={signing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#713f12] text-[#fefce8] text-sm font-semibold hover:bg-[#92400e] transition-all disabled:opacity-60 shadow-sm"
            >
              <GoogleIcon size={16} />
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Vashisht 3.0 · IIITDM Kancheepuram
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-[1.0] tracking-tighter text-[#713f12] mb-6 max-w-3xl mx-auto">
          Finance for people
          <br />
          <span className="text-amber-600">who actually want</span>
          <br />
          to be rich.
        </h1>

        <p className="text-[#78350f] text-lg max-w-lg mx-auto mb-10 leading-relaxed font-light">
          Track spending, get AI-powered feedback, plan investments —
          all in one clean dashboard built for Gen Z.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            onClick={go} disabled={signing}
            className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-[#713f12] text-[#fefce8] font-bold text-sm hover:bg-[#92400e] active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-slate-200"
          >
            {signing
              ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              : <GoogleIcon size={18} />
            }
            Continue with Google — it&apos;s free
          </button>
        </div>
        <p className="text-[#b45309] text-xs">No password. No forms. 2 minutes to set up.</p>

        {/* Dashboard preview */}
        <div className="mt-16 relative">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#fefce8] to-transparent z-10 pointer-events-none rounded-b-3xl" />
          <div className="rounded-2xl border border-amber-400 bg-[#fefce8] overflow-hidden shadow-2xl shadow-slate-200/80 text-left">
            {/* Chrome bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#fefce8] border-b border-[#fde68a]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f87171]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
              <div className="mx-auto flex items-center gap-2 bg-[#fef9c3] rounded-lg px-4 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[#78350f] text-xs">superfinz.app/dashboard</span>
              </div>
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div className="w-44 bg-[#fefce8] border-r border-[#fef9c3] p-3 space-y-0.5 shrink-0">
                <div className="px-3 py-1.5 mb-2">
                  <Logo size="sm" />
                </div>
                {["Overview","Transactions","Heatmap","Calculators","News","Goals"].map((label, i) => (
                  <div key={label} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs ${i === 0 ? "bg-amber-50 text-amber-700 font-semibold" : "text-[#78350f]"}`}>
                    {i === 0 && <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />}
                    {label}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="flex-1 p-5 space-y-4 min-w-0">
                <div>
                  <p className="text-sm font-bold text-[#713f12]">Good morning, Yashvanth</p>
                  <p className="text-[10px] text-[#b45309] mt-0.5">Saturday, 28 March 2026</p>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { l: "Spent",        v: "₹3,240", s: "of ₹5,000",       c: "text-[#713f12]" },
                    { l: "Remaining",    v: "₹1,760", s: "left to spend",    c: "text-emerald-600" },
                    { l: "Savings rate", v: "28%",    s: "vs last month",    c: "text-emerald-600" },
                    { l: "Budget used",  v: "65%",    s: "on track",         c: "text-[#713f12]" },
                  ].map((s) => (
                    <div key={s.l} className="bg-[#fefce8] border border-amber-400 rounded-xl p-3 shadow-sm">
                      <p className="text-[9px] text-[#b45309] uppercase tracking-wide mb-1">{s.l}</p>
                      <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      <p className="text-[8px] text-[#fcd34d] mt-1">{s.s}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#fefce8] border border-amber-400 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#713f12]">Recent spends</p>
                    <p className="text-[9px] text-amber-500">View all</p>
                  </div>
                  <div className="space-y-2.5">
                    {MOCK_TX.map((tx, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#fefce8] border border-amber-400 flex items-center justify-center shrink-0">
                          <span className="text-[8px] font-bold text-[#78350f] uppercase">{tx.cat.slice(0,2)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-[#713f12] truncate font-medium">{tx.name}</p>
                          <p className="text-[9px] text-[#b45309]">{tx.cat}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-semibold text-[#713f12]">{tx.amt}</p>
                          <p className={`text-[9px] ${tx.ok ? "text-emerald-500" : "text-amber-500"}`}>
                            {tx.ok ? "necessary" : "unnecessary"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div className="w-44 bg-[#fefce8] border-l border-[#fef9c3] p-4 shrink-0 hidden lg:block">
                <p className="text-[10px] font-semibold text-[#713f12] mb-2.5">Spend heatmap</p>
                <div className="grid grid-cols-7 gap-[3px]">
                  {HEATMAP.map((v, i) => (
                    <div key={i} className={`aspect-square rounded-[2px] ${HEATMAP_COLORS[v]}`} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[8px] text-[#fcd34d]">less</span>
                  <span className="text-[8px] text-[#fcd34d]">more</span>
                </div>
                <div className="mt-4 space-y-2.5">
                  <p className="text-[10px] font-semibold text-[#713f12]">Goals</p>
                  {[{ name: "New MacBook", pct: 62 }, { name: "Goa trip", pct: 34 }].map((g) => (
                    <div key={g.name}>
                      <div className="flex justify-between text-[9px] mb-1">
                        <span className="text-[#78350f]">{g.name}</span>
                        <span className="text-amber-500 font-medium">{g.pct}%</span>
                      </div>
                      <div className="h-1 bg-[#fef9c3] rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${g.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="bg-[#fefce8] border-y border-[#fde68a] py-20 px-6 mt-12">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { val: users.toLocaleString("en-IN") + "+",  label: "Active users" },
            { val: "₹" + crores + "L+",                  label: "Money tracked" },
            { val: txns.toLocaleString("en-IN") + "+",   label: "Transactions logged" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl md:text-5xl font-black text-[#713f12] tabular-nums">{s.val}</p>
              <p className="text-[#78350f] text-sm mt-2 font-light">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={featRef} className="max-w-5xl mx-auto py-28 px-6">
        <div className="mb-16">
          <p className="text-amber-600 text-xs font-semibold tracking-widest uppercase mb-3">What&apos;s inside</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
            Everything you need.
            <br /><span className="text-[#b45309]">Nothing you don&apos;t.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#fde68a] rounded-2xl overflow-hidden border border-amber-400">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="bg-[#fefce8] p-7 hover:bg-[#fefce8] transition-colors duration-200"
              style={{
                opacity: featIn ? 1 : 0,
                transform: featIn ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms`,
              }}
            >
              <p className="text-[#fde68a] text-5xl font-black mb-5 select-none">{f.n}</p>
              <h3 className="text-[#713f12] font-semibold mb-2 text-sm">{f.title}</h3>
              <p className="text-[#78350f] text-sm leading-relaxed font-light">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Demo */}
      <section ref={demoRef} className="bg-[#fefce8] border-y border-[#fde68a] py-24 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div style={{ opacity: demoIn ? 1 : 0, transform: demoIn ? "none" : "translateX(-16px)", transition: "all 0.6s ease" }}>
            <p className="text-amber-600 text-xs font-semibold tracking-widest uppercase mb-3">AI Spend Check</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4">
              Your AI advisor<br /><span className="text-[#b45309]">keeps it real.</span>
            </h2>
            <p className="text-[#78350f] leading-relaxed font-light">
              Log a spend and get instant AI feedback based on your history.
              Powered by OpenRouter — honest and actually useful.
            </p>
          </div>
          <div className="space-y-3" style={{ opacity: demoIn ? 1 : 0, transform: demoIn ? "none" : "translateX(16px)", transition: "all 0.6s ease 0.15s" }}>
            {[
              { user: "Logged: Biryani ₹180 · Food",       ai: "you ate out 4 times this week — ₹180 saved adds up to ₹2,160/yr",         roast: true },
              { user: "Logged: Rapido ₹45 · Transport",    ai: "looks necessary — ₹45 for transport, tracked",                             roast: false },
              { user: "Logged: Amazon ₹899 · Shopping",    ai: "impulse purchase late at night — sleep on it, add to your goal instead",   roast: true },
            ].map((msg, i) => (
              <div key={i} className="space-y-2">
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#fef9c3] border border-amber-400 flex items-center justify-center text-[9px] text-[#78350f] shrink-0 mt-0.5 font-medium">you</div>
                  <div className="bg-[#fefce8] border border-amber-400 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-[#92400e] shadow-sm">{msg.user}</div>
                </div>
                <div className="flex gap-2.5 flex-row-reverse">
                  <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-[9px] text-amber-600 shrink-0 mt-0.5 font-semibold">AI</div>
                  <div className={`rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[280px] ${msg.roast ? "bg-amber-50 border border-amber-100 text-amber-800" : "bg-emerald-50 border border-emerald-100 text-emerald-800"}`}>
                    {msg.ai}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-[#b45309] text-xs uppercase tracking-widest font-semibold mb-5">Start now</p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight mb-5">
            Know your money.<br />
            <span className="text-amber-600">Own your future.</span>
          </h2>
          <p className="text-[#78350f] mb-10 font-light">Free forever · Google sign-in · 2 minutes to start</p>
          <button
            onClick={go} disabled={signing}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#713f12] text-[#fefce8] font-bold text-sm hover:bg-[#92400e] active:scale-[0.98] transition-all disabled:opacity-60 shadow-xl shadow-slate-200"
          >
            {signing
              ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              : <GoogleIcon size={18} />
            }
            Continue with Google
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#fde68a] px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <p className="text-[#b45309] text-xs">Vashisht 3.0 · IIITDM Kancheepuram · 2026</p>
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
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
