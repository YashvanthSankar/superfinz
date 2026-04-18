"use client";
import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, FetchError } from "@/lib/fetcher";

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
          className="w-1.5 h-1.5 bg-ink animate-bounce"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

export function Chat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey. I'm Finz. I know your spending — ask me anything.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed z-50 w-14 h-14 lg:w-14 lg:h-14 flex items-center justify-center border-2 border-ink transition-[transform,box-shadow] duration-75",
          "right-4 bottom-[4.8rem] lg:bottom-6 lg:right-6",
          "shadow-[4px_4px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0_var(--ink)]",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--ink)]",
          open ? "bg-paper text-ink" : "bg-accent text-paper"
        )}
        aria-label="Open Finz AI"
      >
        {open ? <ChevronDown size={20} strokeWidth={2.5} /> : <Sparkles size={20} strokeWidth={2.5} />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-ink border-2 border-paper animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border-2 border-ink bg-paper shadow-[6px_6px_0_var(--ink)]",
            "right-3 left-3 bottom-[4.5rem] max-h-[72vh]",
            "lg:left-auto lg:right-6 lg:bottom-24 lg:w-[28rem] lg:max-h-[42rem]"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-ink bg-ink text-paper shrink-0">
            <div className="w-8 h-8 border-2 border-paper bg-accent flex items-center justify-center shrink-0">
              <Sparkles size={15} className="text-paper" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm uppercase tracking-wider leading-tight">Finz AI</p>
              <p className="text-[11px] font-semibold opacity-80">Your finance buddy</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 border-2 border-paper bg-transparent hover:bg-bad flex items-center justify-center transition-colors"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 bg-paper">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 border-2 border-ink bg-accent flex items-center justify-center shrink-0 mb-0.5">
                    <Sparkles size={12} className="text-paper" strokeWidth={2.5} />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed border-2 border-ink",
                    m.role === "user"
                      ? "bg-ink text-paper font-semibold"
                      : "bg-paper text-ink font-medium"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 border-2 border-ink bg-accent flex items-center justify-center shrink-0 mb-0.5">
                  <Sparkles size={12} className="text-paper" strokeWidth={2.5} />
                </div>
                <div className="border-2 border-ink bg-paper">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick starters */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 pt-1 flex flex-wrap gap-1.5 shrink-0 bg-paper">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2.5 h-8 border-2 border-ink bg-paper-2 text-ink font-bold hover:bg-accent hover:text-paper transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex items-center gap-2 px-3.5 py-3 border-t-2 border-ink bg-paper-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about your money..."
              className="flex-1 border-2 border-ink bg-paper px-3 h-10 text-sm text-ink font-semibold placeholder:text-mute placeholder:font-normal focus:outline-none focus:bg-accent-soft"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 border-2 border-ink bg-accent text-paper flex items-center justify-center shrink-0 hover:bg-ink disabled:opacity-30 transition-colors"
            >
              <Send size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
