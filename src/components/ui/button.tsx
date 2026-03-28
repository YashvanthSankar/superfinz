"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-[#78350f] text-[#fefce8] hover:bg-[#92400e] shadow-sm": variant === "primary",
            "bg-[#fefce8] text-[#713f12] border border-amber-400 hover:bg-[#fef9c3] shadow-sm": variant === "secondary",
            "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100": variant === "outline",
            "bg-transparent text-[#78350f] hover:text-[#713f12] hover:bg-[#fef9c3]": variant === "ghost",
            "bg-[#fef2f2] text-red-600 border border-red-100 hover:bg-red-50": variant === "danger",
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2.5 text-sm": size === "md",
            "px-6 py-3 text-sm": size === "lg",
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {children}
          </span>
        ) : children}
      </button>
    );
  }
);
Button.displayName = "Button";
