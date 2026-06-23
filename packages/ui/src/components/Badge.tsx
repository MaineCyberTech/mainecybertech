"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@mct/ui/lib/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variantStyles = {
      default: "cyber-pill",
      success: "cyber-pill-success",
      warning: "cyber-pill-warning",
      danger: "cyber-pill-danger",
      info: "bg-white/5 border-white/10 text-slate-300",
    };

    const sizeStyles = {
      sm: "px-2 py-0.5 text-[0.625rem]",
      md: "px-3 py-1 text-xs",
      lg: "px-4 py-1.5 text-sm",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-semibold rounded-full border",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
