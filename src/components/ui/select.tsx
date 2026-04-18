"use client";
import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="brut-label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3 pr-9 h-11 bg-paper border-2 border-ink text-ink text-sm font-semibold",
            "appearance-none cursor-pointer focus:outline-none focus:bg-accent-soft",
            error && "border-bad bg-bad-soft",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink font-black text-xs">
          ▼
        </span>
      </div>
      {error && <p className="text-xs text-bad font-bold uppercase tracking-wide">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
