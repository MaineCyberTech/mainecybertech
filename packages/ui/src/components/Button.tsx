"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@mct/ui/lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      iconOnly = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-orbitron font-bold uppercase tracking-[0.18em] rounded-lg border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary:
        "border-emerald-600 bg-emerald-600 text-[#0A1118] hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.35)] focus:ring-emerald-600",
      secondary:
        "border-emerald-600/40 bg-transparent text-emerald-400 hover:bg-emerald-600/10 hover:shadow-[0_0_15px_rgba(5,150,105,0.2)] focus:ring-emerald-600",
      danger:
        "border-red-500 bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
      ghost:
        "border-transparent bg-transparent text-slate-300 hover:bg-white/5 hover:text-slate-50 focus:ring-slate-500",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-[0.625rem]",
      md: "px-4 py-2.5 text-xs",
      lg: "px-6 py-3 text-sm",
    };

    const iconOnlyStyles = {
      sm: "p-1.5",
      md: "p-2.5",
      lg: "p-3",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          iconOnly ? iconOnlyStyles[size] : sizeStyles[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
