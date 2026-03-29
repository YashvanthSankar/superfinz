"use client";
import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Should I buy biryani today?",
  "How is my spending this month?",
  "Where am I overspending?",
  "How much can I realistically save?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

export function Chat() {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! I'm Finz, your personal finance buddy. I know your spending history — ask me if you should buy something, where your money is going, or how to save more.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const history = next.slice(1).slice(-10).map(({ role, content }) => ({ role, content }));
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating button ─────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed z-50 flex items-center justify-center rounded-2xl shadow-xl transition-all duration-200 active:scale-95",
          "right-4 bottom-[5.5rem] lg:bottom-7 lg:right-7",
          "w-14 h-14",
          "bg-[var(--text)] text-[var(--bg)] hover:bg-[var(--text2)]"
        )}
        aria-label="Open Finz AI"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-[var(--bg)] animate-pulse" />
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────── */}
      {open && (
        <div className={cn(
          "fixed z-50 flex flex-col overflow-hidden",
          "bg-[var(--bg)] border-2 border-amber-400 rounded-2xl shadow-2xl shadow-amber-200/50",
          // Mobile: near full screen above bottom nav
          "right-3 left-3 bottom-[5rem] max-h-[78vh]",
          // Desktop: fixed width panel
          "lg:left-auto lg:right-7 lg:bottom-28 lg:w-[30rem] lg:max-h-[44rem]"
        )}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-[var(--text)] shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400/25 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Sparkles size={17} className="text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--bg)] font-bold text-base leading-tight">Finz</p>
              <p className="text-amber-300/80 text-xs font-light">Knows your spending · Powered by AI</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-300 hover:text-[var(--bg)] hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-400 flex items-center justify-center shrink-0 mb-0.5">
                    <Sparkles size={12} className="text-amber-600" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-[var(--text)] text-[var(--bg)] rounded-br-sm"
                    : "bg-white border border-amber-200 text-[var(--text)] rounded-bl-sm shadow-sm"
                )}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-400 flex items-center justify-center shrink-0 mb-0.5">
                  <Sparkles size={12} className="text-amber-600" />
                </div>
                <div className="bg-white border border-amber-200 rounded-2xl rounded-bl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick starters */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-2 rounded-xl bg-[var(--surface)] border border-amber-400 text-[var(--text)] hover:bg-amber-100 hover:border-amber-400 transition-all font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-t-2 border-amber-200 bg-[var(--bg)] shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Should I buy something today?"
              className="flex-1 bg-[var(--surface)] border border-amber-400 rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--accent)] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-[var(--text)] text-[var(--bg)] flex items-center justify-center hover:bg-[var(--text2)] active:scale-95 transition-all disabled:opacity-40 shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
