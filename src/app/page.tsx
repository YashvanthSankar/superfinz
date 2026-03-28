"use client";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t: number | null = null;
    const step = (ts: number) => {
      if (!t) t = ts;
      const p = Math.min((ts - t) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

const FEATURES = [
  {
    icon: "01",
    title: "Smart onboarding",
    desc: "Student, college, or professional — SuperFinz adapts entirely to your financial reality.",
  },
  {
    icon: "02",
    title: "AI spend analysis",
    desc: "Every transaction gets a Gen Z reality check. Overspending? You'll hear about it.",
  },
  {
    icon: "03",
    title: "Spending heatmap",
    desc: "GitHub-style calendar showing where your money bleeds. Patterns you've never noticed.",
  },
  {
    icon: "04",
    title: "Investment calculators",
    desc: "SIP, FD, EMI — with live charts. See your money compound in real time.",
  },
  {
    icon: "05",
    title: "Finance news",
    desc: "Indian markets, personal finance, and Gen Z money moves — curated daily.",
  },
  {
    icon: "06",
    title: "Goal tracker",
    desc: "Set targets, track progress, celebrate wins. Your savings goals, visualized.",
  },
];

const MOCK_TX = [
  { icon: "🍔", name: "Biryani at Murugan's", cat: "Food", amt: "₹180", status: "unnecessary" },
  { icon: "🚗", name: "Rapido to college", cat: "Transport", amt: "₹45", status: "ok" },
  { icon: "📱", name: "Spotify Premium", cat: "Subscriptions", amt: "₹119", status: "ok" },
  { icon: "🛍️", name: "Amazon — impulsive", cat: "Shopping", amt: "₹899", status: "unnecessary" },
];

export default function Landing() {
  const [signing, setSigning] = useState(false);
  const { ref: statsRef, inView: statsIn } = useInView(0.3);
  const { ref: featRef, inView: featIn } = useInView(0.1);
  const { ref: demoRef, inView: demoIn } = useInView(0.2);

  const users  = useCountUp(12847, 1800, statsIn);
  const crores = useCountUp(42, 2000, statsIn);
  const txns   = useCountUp(93000, 1600, statsIn);

  const go = async () => {
    setSigning(true);
    await signIn("google", { callbackUrl: "/onboarding" });
  };

  return (
    <div className="bg-[#050508] text-white min-h-screen overflow-x-hidden selection:bg-[#00ff88]/20">

      {/* ── Subtle grid bg ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />
      {/* Center glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#00ff88]/[0.04] rounded-full blur-[180px] z-0" />

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <span className="text-lg font-black tracking-tight">
          Super<span className="text-[#00ff88]">Finz</span>
        </span>
        <button
          onClick={go}
          disabled={signing}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/10 hover:border-[#00ff88]/40 hover:text-[#00ff88] transition-all duration-200 disabled:opacity-50"
        >
          Sign in
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-24 pb-32 px-6 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[#8888aa] text-xs mb-10 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          Built for Vashisht 3.0 · IIITDM Kancheepuram
        </div>

        <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8">
          Finance for
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] via-[#00ddaa] to-[#00ccff]">
            Gen Z.
          </span>
        </h1>

        <p className="text-[#666688] text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed font-light">
          Track spending, get AI-powered roasts, plan investments,
          and finally understand where your money goes.
        </p>

        {/* CTA */}
        <button
          onClick={go}
          disabled={signing}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#00ff88] text-black font-bold text-base hover:bg-[#00e87c] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 shadow-[0_0_50px_-5px_#00ff8860]"
        >
          {signing ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        <p className="text-[#444466] text-sm mt-4">Free forever · No credit card · 2 min setup</p>

        {/* ── Dashboard preview ── */}
        <div className="mt-20 relative">
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050508] to-transparent z-10 rounded-b-3xl pointer-events-none" />
          {/* Side fades */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#050508] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#050508] to-transparent z-10 pointer-events-none" />

          <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c14] overflow-hidden shadow-[0_40px_120px_-20px_#000000cc]">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-[#090910]">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="mx-auto flex items-center gap-2 bg-white/[0.04] rounded-lg px-4 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] opacity-60" />
                <span className="text-[#444466] text-xs">superfinz.app/dashboard</span>
              </div>
            </div>

            <div className="flex text-left">
              {/* Sidebar */}
              <div className="w-40 border-r border-white/[0.06] p-3 space-y-0.5 shrink-0">
                {[
                  { icon: "⚡", label: "Overview", active: true },
                  { icon: "💳", label: "Transactions", active: false },
                  { icon: "🗓️", label: "Heatmap", active: false },
                  { icon: "📈", label: "Calculators", active: false },
                  { icon: "📰", label: "News", active: false },
                  { icon: "🎯", label: "Goals", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs ${item.active ? "bg-[#00ff88]/10 text-[#00ff88]" : "text-[#444466]"}`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className={item.active ? "font-semibold" : ""}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="flex-1 p-5 space-y-4 min-w-0">
                <div>
                  <p className="text-base font-bold text-white">hey Yashvanth 👋</p>
                  <p className="text-[10px] text-[#444466] mt-0.5">Saturday, 28 March 2026</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { l: "Spent", v: "₹3,240", s: "of ₹5,000 budget", c: "text-white" },
                    { l: "Remaining", v: "₹1,760", s: "looking good", c: "text-[#00ff88]" },
                    { l: "Savings rate", v: "28%", s: "↑ 6% from last month", c: "text-[#00ff88]" },
                    { l: "Budget used", v: "65%", s: "on track 🎯", c: "text-white" },
                  ].map((s) => (
                    <div key={s.l} className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-3">
                      <p className="text-[9px] text-[#444466] mb-1 uppercase tracking-wide">{s.l}</p>
                      <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                      <p className="text-[8px] text-[#333355] mt-1">{s.s}</p>
                    </div>
                  ))}
                </div>

                {/* Transactions */}
                <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-white">Recent spends</p>
                    <p className="text-[9px] text-[#444466]">View all →</p>
                  </div>
                  <div className="space-y-2.5">
                    {MOCK_TX.map((tx, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{tx.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white truncate font-medium">{tx.name}</p>
                          <p className="text-[9px] text-[#333355]">{tx.cat}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-semibold text-white">{tx.amt}</p>
                          <p className={`text-[9px] ${tx.status === "unnecessary" ? "text-orange-400/70" : "text-[#00ff88]/70"}`}>
                            {tx.status === "unnecessary" ? "ai: skip this 🤨" : "ai: looks fine ✓"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — mini heatmap */}
              <div className="w-44 border-l border-white/[0.06] p-4 shrink-0 hidden lg:block">
                <p className="text-[10px] font-semibold text-white mb-3">Spend heatmap</p>
                <div className="grid grid-cols-7 gap-[3px]">
                  {Array.from({ length: 70 }).map((_, i) => {
                    const v = Math.random();
                    const cls = v < 0.45 ? "bg-white/[0.04]" : v < 0.65 ? "bg-[#00ff88]/15" : v < 0.8 ? "bg-[#00ff88]/35" : v < 0.92 ? "bg-[#00ff88]/60" : "bg-[#00ff88]";
                    return <div key={i} className={`aspect-square rounded-[2px] ${cls}`} />;
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] text-[#333355]">less</span>
                  <span className="text-[8px] text-[#333355]">more</span>
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-[10px] font-semibold text-white">Active goals</p>
                  {[
                    { name: "New MacBook", pct: 62 },
                    { name: "Goa trip fund", pct: 34 },
                  ].map((g) => (
                    <div key={g.name}>
                      <div className="flex justify-between text-[9px] mb-1">
                        <span className="text-[#555577]">{g.name}</span>
                        <span className="text-[#00ff88]/60">{g.pct}%</span>
                      </div>
                      <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className="h-full bg-[#7c3aed]/60 rounded-full" style={{ width: `${g.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section ref={statsRef} className="relative z-10 py-24 px-6 border-y border-white/[0.05]">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { val: users.toLocaleString("en-IN") + "+", label: "Active users" },
            { val: "₹" + crores + "L+", label: "Money tracked" },
            { val: txns.toLocaleString("en-IN") + "+", label: "Transactions logged" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl md:text-5xl font-black text-white tabular-nums">{s.val}</p>
              <p className="text-[#444466] text-sm mt-2 font-light">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={featRef} className="relative z-10 py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-[#00ff88] text-sm font-semibold tracking-widest uppercase mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight max-w-lg">
              Everything in one place.
              <br />
              <span className="text-[#444466]">Nothing extra.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.05]">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="bg-[#050508] p-7 hover:bg-[#090912] transition-colors duration-200"
                style={{
                  opacity: featIn ? 1 : 0,
                  transform: featIn ? "translateY(0)" : "translateY(16px)",
                  transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms`,
                }}
              >
                <p className="text-[#1a1a2e] text-5xl font-black mb-5 select-none">{f.icon}</p>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-[#444466] text-sm leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI demo ── */}
      <section ref={demoRef} className="relative z-10 py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div
            style={{
              opacity: demoIn ? 1 : 0,
              transform: demoIn ? "translateX(0)" : "translateX(-20px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <p className="text-[#00ff88] text-sm font-semibold tracking-widest uppercase mb-4">AI Spend Check</p>
            <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4">
              Your wallet has
              <br />
              <span className="text-[#444466]">an opinion.</span>
            </h2>
            <p className="text-[#444466] leading-relaxed font-light">
              Every time you log a spend, our AI checks your history and calls you out — or clears you —
              in language that actually lands.
            </p>
          </div>

          <div
            className="space-y-3"
            style={{
              opacity: demoIn ? 1 : 0,
              transform: demoIn ? "translateX(0)" : "translateX(20px)",
              transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
            }}
          >
            {[
              {
                user: "Logged: Biryani ₹180 · Food",
                ai: "bro you literally ate out 4 times this week 😭 ₹180 saved = ₹2,160/yr",
                roast: true,
              },
              {
                user: "Logged: Rapido ₹45 · Transport",
                ai: "looks necessary! ₹45 for transport — noted 🫡",
                roast: false,
              },
              {
                user: "Logged: Amazon ₹899 · Shopping",
                ai: "impulse buy vibes at midnight 💀 sleep on it, put this in your goal instead",
                roast: true,
              },
            ].map((msg, i) => (
              <div key={i} className="space-y-2">
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[9px] text-[#444466] shrink-0 mt-0.5">you</div>
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-[#aaaacc]">{msg.user}</div>
                </div>
                <div className="flex gap-2.5 flex-row-reverse">
                  <div className="w-6 h-6 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[9px] text-[#00ff88] shrink-0 mt-0.5">AI</div>
                  <div className={`rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[280px] ${msg.roast ? "bg-orange-400/[0.06] border border-orange-400/10 text-orange-300/80" : "bg-[#00ff88]/[0.06] border border-[#00ff88]/10 text-[#00ff88]/80"}`}>
                    {msg.ai}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 py-36 px-6 text-center border-t border-white/[0.05]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00ff88]/[0.04] rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <p className="text-[#444466] text-sm uppercase tracking-widest font-semibold mb-6">Get started now</p>
          <h2 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter mb-6">
            Know your money.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] to-[#00ccff]">
              Own your future.
            </span>
          </h2>
          <p className="text-[#444466] mb-10 font-light">Free. No credit card. Sign in with Google and start in 2 minutes.</p>
          <button
            onClick={go}
            disabled={signing}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#00ff88] text-black font-bold text-base hover:bg-[#00e87c] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 shadow-[0_0_50px_-5px_#00ff8855]"
          >
            {signing ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : <GoogleIcon />}
            Continue with Google
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.05] px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-black">Super<span className="text-[#00ff88]">Finz</span></span>
          <p className="text-[#333355] text-xs">Vashisht 3.0 · IIITDM Kancheepuram · 2026</p>
        </div>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
