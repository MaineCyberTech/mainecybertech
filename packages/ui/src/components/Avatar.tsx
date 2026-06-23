"use client";

import { ImgHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@mct/ui/lib/cn";

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square";
}

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  (
    { className, fallback, size = "md", shape = "circle", src, alt, ...props },
    ref,
  ) => {
    const sizeStyles = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
      xl: "w-16 h-16 text-lg",
    };

    const shapeStyles = {
      circle: "rounded-full",
      square: "rounded-lg",
    };

    const [imageError, setImageError] = useState(false);

    if (imageError || (!src && fallback)) {
      return (
        <div
          ref={ref}
          className={cn(
            "inline-flex items-center justify-center font-orbitron font-bold uppercase bg-white/5 border border-white/10",
            sizeStyles[size],
            shapeStyles[shape],
            className,
          )}
          {...props}
        >
          {fallback || alt?.charAt(0).toUpperCase() || "?"}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn(
          "object-cover",
          sizeStyles[size],
          shapeStyles[shape],
          className,
        )}
        onError={() => setImageError(true)}
        {...props}
      />
    );
  },
);

Avatar.displayName = "Avatar";
