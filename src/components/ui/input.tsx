"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="brut-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        className={cn(
          "w-full px-3 h-11 bg-paper border-2 border-ink text-ink text-sm",
          "placeholder:text-mute placeholder:font-normal font-semibold",
          "transition-colors focus:outline-none focus:bg-accent-soft",
          type === "number" && "tabular",
          error && "border-bad bg-bad-soft",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-bad font-bold uppercase tracking-wide">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
