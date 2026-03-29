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
      {label && <label htmlFor={id} className="text-xs font-medium text-muted">{label}</label>}
      <select
        ref={ref} id={id}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl bg-background border border-amber-400 text-text text-sm transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 appearance-none cursor-pointer",
          error && "border-red-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
