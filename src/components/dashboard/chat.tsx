"use client";
import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, FetchError } from "@/lib/fetcher";

// Theme values read from CSS custom properties (see src/app/globals.css)
const T = {
  bg:      "var(--color-background)",
  surface: "var(--color-surface)",
  border:  "var(--color-border)",
  text:    "var(--color-text)",
  accent:  "var(--color-accent)",
  muted:   "var(--color-muted)",
};

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "How's my spending this month?",
  "Where am I overspending?",
  "Should I buy something today?",
  "How to save more?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: T.accent, opacity: 0.5, animationDelay: `${i * 0.18}s` }}
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
      content: "Hey! I'm Finz. I know your spending history — ask me anything about your money.",
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
      const data = await apiFetch<{ reply: string }>("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
        timeoutMs: 35_000,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "Something went wrong. Try again?" }]);
    } catch (err) {
      const message =
        err instanceof FetchError && err.status === 429
          ? "Whoa — slow down a sec. Try again in a minute."
          : "Something went wrong. Try again?";
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating button ─────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed z-50 flex items-center justify-center rounded-2xl shadow-lg transition-all duration-200 active:scale-95 right-4 bottom-[4.8rem] lg:bottom-6 lg:right-6 w-13 h-13 lg:w-14 lg:h-14"
        style={{
          background: open ? T.bg : T.text,
          border: `1px solid ${open ? T.border : T.text}`,
          color: open ? T.text : T.bg,
        }}
        aria-label="Open Finz AI"
      >
        {open ? <ChevronDown size={20} /> : <Sparkles size={20} />}
        {!open && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 animate-pulse"
            style={{ background: T.accent, borderColor: T.bg }}
          />
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────── */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-2xl shadow-xl",
            "right-3 left-3 bottom-[4.5rem] max-h-[72vh]",
            "lg:left-auto lg:right-6 lg:bottom-24 lg:w-[28rem] lg:max-h-[42rem]"
          )}
          style={{ background: T.bg, border: `1px solid ${T.border}` }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 border-b shrink-0"
            style={{ background: T.surface, borderColor: T.border }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.text }}>
              <Sparkles size={15} style={{ color: T.bg }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight" style={{ color: T.text }}>Finz AI</p>
              <p className="text-[11px] font-light" style={{ color: T.accent }}>Your personal finance buddy</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ color: T.accent }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.border; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0" style={{ background: T.bg }}>
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mb-0.5" style={{ background: T.text }}>
                    <Sparkles size={11} style={{ color: T.bg }} />
                  </div>
                )}
                <div
                  className="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    m.role === "user"
                      ? { background: T.text, color: T.bg, borderBottomRightRadius: "4px", fontWeight: 500 }
                      : { background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderBottomLeftRadius: "4px" }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mb-0.5" style={{ background: T.text }}>
                  <Sparkles size={11} style={{ color: T.bg }} />
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "16px", borderBottomLeftRadius: "4px" }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick starters */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 pt-1 flex flex-wrap gap-1.5 shrink-0" style={{ background: T.bg }}>
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg transition-all font-medium"
                  style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = T.accent;
                    e.currentTarget.style.color = T.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.color = T.muted;
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div
            className="flex items-center gap-2 px-3.5 py-3 border-t shrink-0"
            style={{ background: T.surface, borderColor: T.border }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about your money..."
              className="flex-1 rounded-xl px-3.5 py-2 text-sm focus:outline-none transition-all"
              style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
              onFocus={(e) => { e.currentTarget.style.borderColor = T.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0"
              style={{ background: T.text, color: T.bg, opacity: !input.trim() || loading ? 0.3 : 1 }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
