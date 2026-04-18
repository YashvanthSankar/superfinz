import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Variant = "default" | "accent" | "good" | "bad" | "warn" | "ink";

const MAP: Record<Variant, string> = {
  default: "bg-paper text-ink",
  accent: "bg-accent text-paper",
  good: "bg-good-soft text-good",
  bad: "bg-bad-soft text-bad",
  warn: "bg-warn-soft text-ink",
  ink: "bg-ink text-paper",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border-2 border-ink px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
        MAP[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
