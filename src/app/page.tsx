"use client";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";

function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const FEATURES = [
  { icon: "⚡", title: "Smart onboarding", desc: "Tell us if you're a student, college kid, or pro — we adapt everything to your life." },
  { icon: "🤖", title: "AI spend checker", desc: "Log a spend and get roasted in Gen Z tone if you're overspending. Your wallet's best frenemy." },
  { icon: "🗓️", title: "Spending heatmap", desc: "See your money habits in a GitHub-style heatmap. Spot bad weeks instantly." },
  { icon: "📈", title: "Live calculators", desc: "SIP, FD, EMI — with real-time charts. Know exactly what your money can become." },
  { icon: "📰", title: "Finance news", desc: "India-first finance news, filtered and kept relevant. No jargon, just what matters." },
];

const MOCK_TRANSACTIONS = [
  { emoji: "🍔", name: "Biryani at Murugan's", cat: "Food", amount: "₹180", flag: "unnecessary" },
  { emoji: "🚗", name: "Rapido to college", cat: "Transport", amount: "₹45", flag: "ok" },
  { emoji: "📱", name: "Spotify Premium", cat: "Subscriptions", amount: "₹119", flag: "ok" },
  { emoji: "🛍️", name: "Amazon impulse buy", cat: "Shopping", amount: "₹899", flag: "unnecessary" },
  { emoji: "💊", name: "Medicine", cat: "Health", amount: "₹230", flag: "ok" },
];

export default function LandingPage() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { ref: statsRef, inView: statsInView } = useInView();
  const { ref: featuresRef, inView: featuresInView } = useInView(0.1);

  const users = useCountUp(12847, 2200, statsInView);
  const saved = useCountUp(4200000, 2500, statsInView);
  const txLogged = useCountUp(93000, 2000, statsInView);

  const handleSignIn = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/onboarding" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[#ffffff08] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <span className="text-xl font-black">Super<span className="text-[#00ff88]">Finz</span></span>
        <button
          onClick={handleSignIn}
          disabled={googleLoading}
          className="px-5 py-2 rounded-xl bg-[#00ff88] text-black text-sm font-bold hover:bg-[#00e07a] transition-all disabled:opacity-60"
        >
          Get started →
        </button>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#00ff88]/6 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-[#7c3aed]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[300px] h-[300px] bg-[#f59e0b]/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            Built for Vashisht 3.0 · IIITDM Kancheepuram
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6">
            Your money,{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] via-[#00ccff] to-[#7c3aed]">
                your rules
              </span>
            </span>
          </h1>

          <p className="text-[#8888aa] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one finance dashboard built for Gen Z — students, college kids, and young professionals.
            Track, plan, and grow your money without the boring stuff.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleSignIn}
              disabled={googleLoading}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#00ff88] text-black font-bold text-base hover:bg-[#00e07a] hover:scale-[1.02] transition-all disabled:opacity-60 shadow-[0_0_40px_#00ff8840]"
            >
              {googleLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fillOpacity=".5"/>
                  <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fillOpacity=".5"/>
                  <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fillOpacity=".5"/>
                  <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fillOpacity=".5"/>
                </svg>
              )}
              Start with Google — it&apos;s free
            </button>
            <p className="text-[#4a4a6a] text-sm">No credit card. No email/password. Just Google.</p>
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="relative z-10 mt-20 max-w-5xl mx-auto">
          <div className="relative">
            {/* Fade overlay bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0f] to-transparent z-10 rounded-b-3xl" />

            <div className="bg-[#111118] border border-[#2a2a3a] rounded-3xl overflow-hidden shadow-[0_0_80px_#00000080]">
              {/* Fake top bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#2a2a3a] bg-[#0d0d14]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="ml-4 flex-1 h-5 bg-[#1a1a24] rounded-md" />
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="w-44 border-r border-[#2a2a3a] p-3 space-y-1 shrink-0">
                  <div className="px-3 py-2 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚡</span>
                      <div className="h-2.5 w-16 bg-[#00ff88]/50 rounded" />
                    </div>
                  </div>
                  {["💳", "🗓️", "📈", "📰", "🎯"].map((icon, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{icon}</span>
                        <div className="h-2 rounded bg-[#2a2a3a]" style={{ width: `${40 + i * 8}px` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 p-5 space-y-4 min-w-0">
                  {/* Stat cards */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Spent", val: "₹3,240", sub: "this month", color: "text-white" },
                      { label: "Remaining", val: "₹1,760", sub: "of ₹5,000", color: "text-[#00ff88]" },
                      { label: "Savings rate", val: "28%", sub: "↑ from last mo", color: "text-[#00ff88]" },
                      { label: "Budget used", val: "65%", sub: "on track 🎯", color: "text-white" },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#0d0d14] border border-[#2a2a3a] rounded-xl p-3">
                        <p className="text-[9px] text-[#4a4a6a] mb-1">{s.label}</p>
                        <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[9px] text-[#4a4a6a] mt-0.5">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Transactions */}
                  <div className="bg-[#0d0d14] border border-[#2a2a3a] rounded-xl p-4">
                    <p className="text-xs font-semibold text-white mb-3">Recent spends</p>
                    <div className="space-y-2">
                      {MOCK_TRANSACTIONS.map((tx, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-base">{tx.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-white truncate">{tx.name}</p>
                            <p className="text-[9px] text-[#4a4a6a]">{tx.cat}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px] font-semibold text-white">{tx.amount}</p>
                            <span className={`text-[9px] ${tx.flag === "unnecessary" ? "text-orange-400" : "text-[#00ff88]"}`}>
                              {tx.flag === "unnecessary" ? "ai: unnecessary 🤨" : "✓ ok"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right panel — heatmap */}
                <div className="w-48 border-l border-[#2a2a3a] p-4 shrink-0 hidden md:block">
                  <p className="text-[10px] font-semibold text-white mb-3">Spending heatmap</p>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: 63 }).map((_, i) => {
                      const intensity = Math.random();
                      const colors = ["bg-[#1a1a24]", "bg-[#00ff88]/20", "bg-[#00ff88]/40", "bg-[#00ff88]/70", "bg-[#00ff88]"];
                      const colorIndex = intensity < 0.4 ? 0 : intensity < 0.6 ? 1 : intensity < 0.75 ? 2 : intensity < 0.9 ? 3 : 4;
                      return <div key={i} className={`aspect-square rounded-sm ${colors[colorIndex]}`} />;
                    })}
                  </div>
                  <p className="text-[9px] text-[#4a4a6a] mt-2">Last 9 weeks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-20 px-6 border-y border-[#ffffff08]">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: users.toLocaleString("en-IN"), label: "Active users", suffix: "+" },
            { value: `₹${(saved / 100000).toFixed(1)}L`, label: "Money tracked", suffix: "+" },
            { value: txLogged.toLocaleString("en-IN"), label: "Transactions logged", suffix: "+" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl md:text-5xl font-black text-white">
                {s.value}<span className="text-[#00ff88]">{s.suffix}</span>
              </p>
              <p className="text-[#8888aa] text-sm mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Everything you need,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] to-[#00ccff]">
                nothing you don&apos;t
              </span>
            </h2>
            <p className="text-[#8888aa] text-lg max-w-xl mx-auto">
              Built for how Gen Z actually thinks about money — fast, visual, no BS.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 hover:border-[#3a3a5a] hover:bg-[#131320] transition-all duration-300"
                style={{
                  opacity: featuresInView ? 1 : 0,
                  transform: featuresInView ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms, background 0.2s, border 0.2s`,
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#1a1a24] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-[#8888aa] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}

            {/* CTA card */}
            <div className="bg-gradient-to-br from-[#00ff88]/10 to-[#7c3aed]/10 border border-[#00ff88]/20 rounded-2xl p-6 flex flex-col items-start justify-between"
              style={{
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.5s ease ${FEATURES.length * 80}ms, transform 0.5s ease ${FEATURES.length * 80}ms`,
              }}
            >
              <div>
                <p className="text-2xl mb-2">✨</p>
                <h3 className="font-bold text-white mb-2">Ready to glow up your finances?</h3>
                <p className="text-[#8888aa] text-sm">Takes 2 minutes. No credit card.</p>
              </div>
              <button
                onClick={handleSignIn}
                className="mt-6 px-5 py-2.5 rounded-xl bg-[#00ff88] text-black text-sm font-bold hover:bg-[#00e07a] transition-all"
              >
                Get started free →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI roast demo */}
      <section className="py-20 px-6 bg-[#080810] border-y border-[#ffffff08]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Your AI finance bestie{" "}
            <span className="text-[#f59e0b]">roasts you</span> when you overspend
          </h2>
          <p className="text-[#8888aa] mb-10">Log a spend → get instant AI feedback in Gen Z language</p>

          <div className="space-y-3 text-left max-w-xl mx-auto">
            {[
              { user: "Logged: Biryani ₹180 · Food", ai: "bro you literally ate out 4 times this week, your wallet is crying fr 💸", type: "roast" },
              { user: "Logged: Rapido ₹45 · Transport", ai: "looks necessary! ₹45 for Rapido — noted 🫡", type: "ok" },
              { user: "Logged: Amazon ₹899 · Shopping", ai: "this purchase giving impulse buy vibes... sleep on it? ₹899 could hit your goal 💪", type: "roast" },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#2a2a3a] flex items-center justify-center text-xs shrink-0">you</div>
                  <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-white">{item.user}</div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/30 flex items-center justify-center text-xs text-[#00ff88] shrink-0">AI</div>
                  <div className={`rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-sm ${item.type === "roast" ? "bg-orange-500/10 border border-orange-500/20 text-orange-300" : "bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88]"}`}>
                    {item.ai}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#00ff88]/6 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Stop being broke.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] to-[#7c3aed]">
              Start being built.
            </span>
          </h2>
          <p className="text-[#8888aa] text-lg mb-10">
            Join thousands of Gen Z who finally know where their money goes.
          </p>
          <button
            onClick={handleSignIn}
            disabled={googleLoading}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-[#00ff88] text-black font-black text-lg hover:bg-[#00e07a] hover:scale-[1.02] transition-all disabled:opacity-60 shadow-[0_0_60px_#00ff8850]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fillOpacity=".5"/>
              <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fillOpacity=".5"/>
              <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fillOpacity=".5"/>
              <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fillOpacity=".5"/>
            </svg>
            Start with Google — free forever
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ffffff08] px-6 py-8 text-center">
        <p className="text-[#4a4a6a] text-sm">
          <span className="font-black text-white">Super<span className="text-[#00ff88]">Finz</span></span>
          {" · "}Built for Vashisht 3.0 @ IIITDM Kancheepuram · 2026
        </p>
      </footer>
    </div>
  );
}
