"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-xs font-medium text-muted">{label}</label>}
      <input
        ref={ref} id={id}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl bg-background border border-amber-400 text-text placeholder-accent text-sm transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400/10",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
