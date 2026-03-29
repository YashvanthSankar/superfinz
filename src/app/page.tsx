"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/ui/logo";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "motion/react";
import {
  Brain,
  BarChart3,
  Flame,
  Calculator,
  Newspaper,
  Target,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";

// ─── Seeded noise for heatmap ────────────────────────────────────────────────
function seed(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const HEATMAP = Array.from({ length: 70 }, (_, i) => {
  const v = seed(i);
  if (v < 0.42) return 0;
  if (v < 0.62) return 1;
  if (v < 0.78) return 2;
  if (v < 0.91) return 3;
  return 4;
});

// ─── Hooks ───────────────────────────────────────────────────────────────────
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

function useScrolled(px = 60) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > px);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [px]);
  return scrolled;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const MOCK_TX = [
  { name: "Biryani at Murugan's", cat: "Food",          amt: "₹180", ok: false },
  { name: "Rapido to college",    cat: "Transport",     amt: "₹45",  ok: true  },
  { name: "Spotify Premium",      cat: "Subscriptions", amt: "₹119", ok: true  },
  { name: "Amazon impulse buy",   cat: "Shopping",      amt: "₹899", ok: false },
];

const FEATURES = [
  { n: "01", icon: Brain,       title: "Smart onboarding",       body: "Student, college, or professional — everything adapts to your financial reality from day one." },
  { n: "02", icon: Sparkles,    title: "AI spend analysis",      body: "Every transaction gets a real assessment. Overspending? You'll hear about it in language that lands." },
  { n: "03", icon: BarChart3,   title: "Spending heatmap",       body: "GitHub-style calendar showing where your money bleeds. Patterns you've never spotted before." },
  { n: "04", icon: Calculator,  title: "Investment calculators", body: "SIP, FD, EMI with live Recharts. See exactly what your money can grow into." },
  { n: "05", icon: Newspaper,   title: "Finance news",           body: "India-first curated finance news — markets, personal finance, and smart money moves daily." },
  { n: "06", icon: Target,      title: "Goal tracker",           body: "Set targets, log progress, celebrate milestones. Your savings journey, beautifully visualized." },
];

const AI_CHAT = [
  { user: "Logged: Biryani ₹180 · Food",    ai: "bro you ate out 4× this week — ₹180 saved = ₹2,160/yr. invest it.",       roast: true  },
  { user: "Logged: Rapido ₹45 · Transport", ai: "looks necessary — ₹45 for transport, tracked ✓",                          roast: false },
  { user: "Logged: Amazon ₹899 · Shopping", ai: "impulse at 11pm? sleep on it — that's 3 days of your food budget gone.",   roast: true  },
];

// Fix #4: level-0 = true neutral grey so "no spend" reads differently from "low spend"
const HEATMAP_COLORS = [
  "bg-[#D9D4CC]",      // 0 — no spend
  "bg-orange-100",     // 1 — low
  "bg-orange-300",     // 2
  "bg-orange-500",     // 3
  "bg-[#C2410C]",      // 4 — high
];

// ─── Tilt Card ────────────────────────────────────────────────────────────────
function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 400, damping: 30 });
  const rotY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 400, damping: 30 });

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [x, y]);

  const onMouseLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d", transformPerspective: 1000, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Magnetic Button ──────────────────────────────────────────────────────────
function MagButton({ children, onClick, disabled, className, style }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 350, damping: 25 });
  const sy = useSpring(y, { stiffness: 350, damping: 25 });

  const onMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.35);
    y.set((e.clientY - cy) * 0.35);
  }, [x, y]);

  const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy, ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// ─── Heatmap Bloom ────────────────────────────────────────────────────────────
function HeatmapBloom({ inView }: { inView: boolean }) {
  return (
    <div className="grid grid-cols-7 gap-[3px]">
      {HEATMAP.map((v, i) => (
        <motion.div
          key={i}
          className={`aspect-square rounded-[2px] ${HEATMAP_COLORS[v]}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: i * 0.012, duration: 0.25, type: "spring", stiffness: 300 }}
        />
      ))}
    </div>
  );
}

// ─── AI Chat Bubbles ──────────────────────────────────────────────────────────
type ChatBubble =
  | { key: string; kind: "user"; text: string }
  | { key: string; kind: "ai";   text: string; roast: boolean }
  | { key: string; kind: "typing"; roast: boolean };

function AIChatBubbles({ inView }: { inView: boolean }) {
  const [step, setStep] = useState(0);
  const total = AI_CHAT.length * 2; // one step per user bubble, one per AI bubble

  useEffect(() => {
    if (!inView || step >= total) return;
    const tid = setTimeout(() => setStep((s) => s + 1), step === 0 ? 350 : 580);
    return () => clearTimeout(tid);
  }, [inView, step, total]);

  // Build flat ordered list of visible bubbles from current step
  const bubbles: ChatBubble[] = [];
  for (let i = 0; i < AI_CHAT.length; i++) {
    const userStep = i * 2 + 1;
    const aiStep   = i * 2 + 2;
    if (step >= userStep) {
      bubbles.push({ key: `u${i}`, kind: "user", text: AI_CHAT[i].user });
      if (step >= aiStep) {
        bubbles.push({ key: `a${i}`, kind: "ai",     text: AI_CHAT[i].ai, roast: AI_CHAT[i].roast });
      } else {
        bubbles.push({ key: `t${i}`, kind: "typing", roast: AI_CHAT[i].roast });
      }
    }
  }

  return (
    <motion.div layout className="flex flex-col gap-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {bubbles.map((b) => {
          const isAI = b.kind === "ai" || b.kind === "typing";
          return (
            <motion.div
              layout
              key={b.key}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -6,  scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={`flex items-start gap-2.5 ${isAI ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] shrink-0 mt-0.5 font-bold ${
                  isAI
                    ? "bg-[#C2410C] text-white"
                    : "bg-[#e8ddd4] border border-[#c9b89e] text-[#4A2C19]"
                }`}
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {isAI ? "AI" : "you"}
              </div>

              {/* Bubble */}
              {b.kind === "typing" ? (
                <div className="bg-[#FDF1EB] border border-[#E4B99E] rounded-2xl rounded-tr-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-[#C2410C] block"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: d * 0.14 }}
                    />
                  ))}
                </div>
              ) : b.kind === "ai" ? (
                <div
                  className={`rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[280px] shadow-sm ${
                    b.roast
                      ? "bg-[#FDF1EB] border border-[#E4B99E] text-[#5A2A12]"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  }`}
                  style={{
                    fontFamily: "var(--font-inter)",
                    boxShadow: b.roast
                      ? "0 0 16px 0 rgba(194,65,12,0.12)"
                      : "0 0 16px 0 rgba(16,185,129,0.10)",
                  }}
                >
                  {b.text}
                </div>
              ) : (
                <div
                  className="bg-white border border-[#e0d4c3] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-[#4A2C19] shadow-sm max-w-[260px]"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {b.text}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "Track every rupee",
  "AI-powered roast of your bad spends",
  "FIRE calculator built-in",
  "Spending heatmap",
  "SIP · FD · EMI calculators",
  "India-first finance news",
  "Google Sign-in · No password",
  "Retirement readiness score",
  "12 finance articles for free",
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden border-y border-[#ddd0be] bg-[#F5EFE4] py-4 select-none">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 28, repeat: Infinity }}
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-medium text-[#78350f] shrink-0" style={{ fontFamily: "var(--font-inter)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C] shrink-0" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Landing() {
  const [signing, setSigning] = useState(false);
  const scrolled = useScrolled(60);
  const { ref: statsRef, inView: statsIn } = useInView(0.3);
  const { ref: featRef,  inView: featIn  } = useInView(0.1);
  const { ref: demoRef,  inView: demoIn  } = useInView(0.2);
  const { ref: heatRef,  inView: heatIn  } = useInView(0.3);

  const users  = useCountUp(12847, 1800, statsIn);
  const crores = useCountUp(42,    2000, statsIn);
  const txns   = useCountUp(93000, 1600, statsIn);

  const go = async () => {
    setSigning(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden selection:bg-orange-100"
      style={{
        background: "#FDFCF6",
        color: "#4A2C19",
        fontFamily: "var(--font-inter)",
      }}
    >
      {/* Grain texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
        }}
      />

      {/* Radial glow top-right */}
      <div
        className="pointer-events-none fixed top-0 right-0 w-[700px] h-[700px] z-0 opacity-30"
        style={{
          background: "radial-gradient(circle at 70% 20%, #C2410C22 0%, transparent 60%)",
        }}
      />

      {/* ── Sticky Glass Nav ────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(253,252,246,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(74,44,25,0.08)" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <Logo size="xl" />
          <div className="flex items-center gap-6">
            <span className="hidden sm:block text-sm text-[#b45309] pr-2 border-r border-[#DDD0BE]" style={{ fontFamily: "var(--font-inter)" }}>
              Free · No credit card
            </span>
            <MagButton
              onClick={go}
              disabled={signing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-sm"
              style={{
                background: "#4A2C19",
                color: "#FDFCF6",
                boxShadow: "0 4px 16px rgba(74,44,25,0.25)",
                fontFamily: "var(--font-inter)",
              } as React.CSSProperties}
            >
              <GoogleIcon size={15} />
              Sign in
            </MagButton>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12 sm:pb-16 text-center z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium mb-10"
          style={{
            background: "rgba(194,65,12,0.07)",
            borderColor: "rgba(194,65,12,0.2)",
            color: "#C2410C",
            fontFamily: "var(--font-inter)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C] animate-pulse" />
          Vashisht 3.0 · IIITDM Kancheepuram · 2026
        </motion.div>

        {/* Headline */}
        <div className="overflow-hidden mb-2 pb-2">
          <motion.h1
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2rem,7.5vw,6.5rem)] font-black leading-[1.05] tracking-tight"
            style={{ fontFamily: "var(--font-playfair)", color: "#4A2C19" }}
          >
            Finance for people
          </motion.h1>
        </div>

        <div className="overflow-hidden mb-2 pb-2">
          <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-[clamp(2rem,7.5vw,6.5rem)] font-black leading-[1.05] tracking-tight"
            style={{ fontFamily: "var(--font-playfair)", color: "#C2410C" }}
          >
            who actually want
          </motion.div>
        </div>

        <div className="overflow-hidden mb-10 pb-2">
          <motion.h1
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="text-[clamp(2rem,7.5vw,6.5rem)] font-black leading-[1.05] tracking-tight"
            style={{ fontFamily: "var(--font-playfair)", color: "#4A2C19" }}
          >
            to be rich.
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="text-lg max-w-lg mx-auto mb-10 leading-relaxed font-light"
          style={{ color: "#78350f", fontFamily: "var(--font-inter)" }}
        >
          Track spending, get AI-powered feedback, plan investments —
          all in one clean dashboard built for Gen Z.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4"
        >
          <MagButton
            onClick={go}
            disabled={signing}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 shadow-xl"
            style={{
              background: "#4A2C19",
              color: "#FDFCF6",
              boxShadow: "0 8px 32px rgba(74,44,25,0.28)",
              fontFamily: "var(--font-inter)",
            } as React.CSSProperties}
          >
            {signing
              ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              : <GoogleIcon size={18} />
            }
            Continue with Google — it&apos;s free
          </MagButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs"
          style={{ color: "#b45309", fontFamily: "var(--font-inter)" }}
        >
          No password. No forms. 2 minutes to set up.
        </motion.p>

        {/* Dashboard preview with tilt */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 relative"
        >
          {/* Fade-out gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none rounded-b-3xl z-10"
            style={{ background: "linear-gradient(to top, #FDFCF6 0%, transparent 100%)" }} />

          <TiltCard className="rounded-3xl overflow-hidden border shadow-2xl"
            style={{ borderColor: "#e8ddd0", boxShadow: "0 30px 80px rgba(74,44,25,0.10)" } as React.CSSProperties}
          >
            {/* Chrome bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ background: "#fefce8", borderColor: "#e8ddd0" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-[#f87171]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
              <div className="mx-auto flex items-center gap-2 rounded-lg px-4 py-1.5" style={{ background: "#FDFCF6" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[#78350f] text-xs" style={{ fontFamily: "var(--font-inter)" }}>superfinz.app/dashboard</span>
              </div>
            </div>

            <div className="flex" style={{ background: "#FDFCF6" }}>
              {/* Sidebar — hidden on small screens */}
              <div className="hidden sm:block w-36 md:w-44 border-r p-3 space-y-0.5 shrink-0" style={{ background: "#fefce8", borderColor: "#e8ddd0" }}>
                <div className="px-3 py-1.5 mb-2"><Logo size="sm" /></div>
                {["Overview","Transactions","Heatmap","Calculators","News","Goals"].map((label, i) => (
                  <div key={label}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs"
                    style={{
                      background: i === 0 ? "rgba(194,65,12,0.08)" : "transparent",
                      color: i === 0 ? "#C2410C" : "#78350f",
                      fontWeight: i === 0 ? 600 : 400,
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {i === 0 && <span className="w-1 h-1 rounded-full bg-[#C2410C] shrink-0" />}
                    {label}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="flex-1 p-5 space-y-4 min-w-0">
                <div>
                  <p className="text-sm font-bold" style={{ color: "#4A2C19", fontFamily: "var(--font-inter)" }}>Good morning, Yashvanth</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#b45309", fontFamily: "var(--font-inter)" }}>Saturday, 28 March 2026</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { l: "Spent",        v: "₹3,240", s: "of ₹5,000",    c: "#4A2C19"   },
                    { l: "Remaining",    v: "₹1,760", s: "left to spend", c: "#059669"   },
                    { l: "Savings rate", v: "28%",    s: "vs last month", c: "#059669"   },
                    { l: "Budget used",  v: "65%",    s: "on track",      c: "#C2410C"   },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl p-3 shadow-sm border" style={{ background: "#fefce8", borderColor: "#fde68a" }}>
                      <p className="text-[9px] uppercase tracking-wide mb-1" style={{ color: "#b45309", fontFamily: "var(--font-inter)" }}>{s.l}</p>
                      <p className="text-sm font-bold" style={{ color: s.c, fontFamily: "var(--font-geist-mono)" }}>{s.v}</p>
                      <p className="text-[8px] mt-1" style={{ color: "#b45309", fontFamily: "var(--font-inter)" }}>{s.s}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4 shadow-sm border" style={{ background: "#fefce8", borderColor: "#fde68a" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold" style={{ color: "#4A2C19", fontFamily: "var(--font-inter)" }}>Recent spends</p>
                    <p className="text-[9px]" style={{ color: "#C2410C", fontFamily: "var(--font-inter)" }}>View all</p>
                  </div>
                  <div className="space-y-2.5">
                    {MOCK_TX.map((tx, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md border flex items-center justify-center shrink-0" style={{ background: "#fef9c3", borderColor: "#fde68a" }}>
                          <span className="text-[8px] font-bold uppercase" style={{ color: "#78350f", fontFamily: "var(--font-inter)" }}>{tx.cat.slice(0,2)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] truncate font-medium" style={{ color: "#4A2C19", fontFamily: "var(--font-inter)" }}>{tx.name}</p>
                          <p className="text-[9px]" style={{ color: "#b45309", fontFamily: "var(--font-inter)" }}>{tx.cat}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-semibold" style={{ color: "#4A2C19", fontFamily: "var(--font-geist-mono)" }}>{tx.amt}</p>
                          <p className="text-[9px]" style={{ color: tx.ok ? "#059669" : "#C2410C", fontFamily: "var(--font-inter)" }}>
                            {tx.ok ? "necessary" : "unnecessary"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right panel with blooming heatmap */}
              <div ref={heatRef} className="w-44 border-l p-4 shrink-0 hidden lg:block" style={{ background: "#fefce8", borderColor: "#e8ddd0" }}>
                <p className="text-[10px] font-semibold mb-2.5" style={{ color: "#4A2C19", fontFamily: "var(--font-inter)" }}>Spend heatmap</p>
                <HeatmapBloom inView={heatIn} />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[8px]" style={{ color: "#b45309", fontFamily: "var(--font-inter)" }}>less</span>
                  <span className="text-[8px]" style={{ color: "#b45309", fontFamily: "var(--font-inter)" }}>more</span>
                </div>
                <div className="mt-4 space-y-2.5">
                  <p className="text-[10px] font-semibold" style={{ color: "#4A2C19", fontFamily: "var(--font-inter)" }}>Goals</p>
                  {[{ name: "New MacBook", pct: 62 }, { name: "Goa trip", pct: 34 }].map((g) => (
                    <div key={g.name}>
                      <div className="flex justify-between text-[9px] mb-1">
                        <span style={{ color: "#78350f", fontFamily: "var(--font-inter)" }}>{g.name}</span>
                        <span className="font-medium" style={{ color: "#C2410C", fontFamily: "var(--font-geist-mono)" }}>{g.pct}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#E8DDD0" }}>
                        <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: "#C2410C" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────────── */}
      <Marquee />

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-20 sm:py-24 px-4 sm:px-6 relative z-10" style={{ background: "#FDFCF6" }}>
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { val: users.toLocaleString("en-IN") + "+", label: "Active users",        icon: TrendingUp },
            { val: "₹" + crores + "L+",                  label: "Money tracked",       icon: BarChart3  },
            { val: txns.toLocaleString("en-IN") + "+",   label: "Transactions logged", icon: Target     },
          ].map(({ val, label, icon: Icon }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={statsIn ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Icon size={18} className="mx-auto mb-3 opacity-40" style={{ color: "#C2410C" }} />
              <p
                className="text-4xl md:text-5xl font-black tabular-nums"
                style={{ color: "#4A2C19", fontFamily: "var(--font-playfair)" }}
              >
                {val}
              </p>
              <p className="text-sm mt-2 font-light" style={{ color: "#78350f", fontFamily: "var(--font-inter)" }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features Bento Grid ─────────────────────────────────────────── */}
      <section ref={featRef} className="max-w-5xl mx-auto py-20 sm:py-28 px-4 sm:px-6 relative z-10">
        <div className="mb-16">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#C2410C", fontFamily: "var(--font-inter)" }}
          >
            What&apos;s inside
          </p>
          <h2
            className="text-4xl md:text-5xl font-black tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-playfair)", color: "#4A2C19" }}
          >
            Everything you need.
            <br />
            <span style={{ color: "#b45309" }}>Nothing you don&apos;t.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                animate={featIn ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, boxShadow: "0 20px 48px rgba(74,44,25,0.10)" }}
                className="relative rounded-2xl p-7 border overflow-hidden group cursor-default transition-shadow"
                style={{ background: "#FDFCF6", borderColor: "#DDD0BE" }}
              >
                {/* Big number background */}
                <span
                  className="absolute -top-4 -right-2 text-[5.5rem] font-black leading-none pointer-events-none select-none"
                  style={{ color: "rgba(74,44,25,0.055)", fontFamily: "var(--font-playfair)" }}
                >
                  {f.n}
                </span>

                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-5 transition-colors"
                  style={{ background: "rgba(194,65,12,0.1)" }}
                >
                  <Icon size={17} style={{ color: "#C2410C" }} />
                </div>

                <h3
                  className="font-semibold mb-2 text-sm"
                  style={{ color: "#4A2C19", fontFamily: "var(--font-inter)" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed font-light"
                  style={{ color: "#78350f", fontFamily: "var(--font-inter)" }}
                >
                  {f.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── AI Demo ─────────────────────────────────────────────────────── */}
      <section
        ref={demoRef}
        className="border-y py-20 sm:py-28 px-4 sm:px-6 relative z-10"
        style={{ background: "#F9F5EE", borderColor: "#DDD0BE" }}
      >
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(ellipse 60% 50% at 80% 50%, rgba(194,65,12,0.08) 0%, transparent 70%)" }}
        />

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={demoIn ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "#C2410C", fontFamily: "var(--font-inter)" }}
            >
              AI Spend Check
            </p>
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-5"
              style={{ fontFamily: "var(--font-playfair)", color: "#4A2C19" }}
            >
              Your AI advisor<br />
              <span style={{ color: "#b45309" }}>keeps it real.</span>
            </h2>
            <p
              className="leading-relaxed font-light mb-6"
              style={{ color: "#78350f", fontFamily: "var(--font-inter)" }}
            >
              Log a spend and get instant AI feedback based on your history.
              Honest, contextual, and actually useful — not generic advice.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#C2410C", fontFamily: "var(--font-inter)" }}>
              <Flame size={15} />
              <span>Powered by Google AI</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={demoIn ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            <AIChatBubbles inView={demoIn} />
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section
        className="relative py-24 sm:py-40 px-4 sm:px-6 text-center overflow-hidden"
        style={{ background: "#2C1810" }}
      >
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(194,65,12,0.15) 0%, transparent 70%)" }}
        />

        <div className="relative max-w-2xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs uppercase tracking-widest font-semibold mb-6"
            style={{ color: "rgba(194,65,12,0.7)", fontFamily: "var(--font-inter)" }}
          >
            Start now
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-8"
            style={{ fontFamily: "var(--font-playfair)", color: "#FDFCF6" }}
          >
            Know your
            <br />
            <span style={{ color: "#C2410C" }}>money.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-10 font-light"
            style={{ color: "rgba(253,252,246,0.55)", fontFamily: "var(--font-inter)" }}
          >
            Free forever · Google sign-in · 2 minutes to start
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <MagButton
              onClick={go}
              disabled={signing}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-base text-white transition-all disabled:opacity-60"
              style={{
                background: "#4A2C19",
                boxShadow: "0 0 60px rgba(74,44,25,0.40)",
                fontFamily: "var(--font-inter)",
              } as React.CSSProperties}
            >
              {signing
                ? <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                : <GoogleIcon size={20} />
              }
              Continue with Google
              <ArrowRight size={16} />
            </MagButton>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-8 py-6 border-t" style={{ background: "#1A0E08", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-2 justify-between">
          <Logo size="sm" />
          <p className="text-xs" style={{ color: "rgba(253,252,246,0.35)", fontFamily: "var(--font-inter)" }}>
            Vashisht 3.0 · IIITDM Kancheepuram · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Google Icon ──────────────────────────────────────────────────────────────
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
