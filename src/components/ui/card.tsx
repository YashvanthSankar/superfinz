import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("brut-card p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-black text-ink uppercase tracking-wide", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardLabel({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("brut-label", className)} {...props}>
      {children}
    </p>
  );
}
