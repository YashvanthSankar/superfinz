"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold transition-[transform,box-shadow,background] duration-75 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 uppercase tracking-wide",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-paper border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_var(--ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        accent:
          "bg-accent text-paper border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_var(--ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        secondary:
          "bg-paper text-ink border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_var(--ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        outline:
          "bg-transparent text-ink border-2 border-ink hover:bg-accent-soft",
        ghost:
          "bg-transparent text-ink hover:bg-paper-2 border-2 border-transparent",
        danger:
          "bg-bad text-paper border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_var(--ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      },
      size: {
        sm: "h-8 px-3 text-[11px]",
        md: "h-10 px-4 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
