"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@mct/ui/lib/cn";
import { ReactNode, useState } from "react";

export interface SidebarGroupProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  icon?: ReactNode;
}

export function SidebarGroup({
  title,
  children,
  defaultOpen = true,
  className,
  titleClassName,
  contentClassName,
  icon,
}: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "border border-white/5 rounded-lg bg-white/5 overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-3 text-left font-orbitron text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-slate-100 transition-colors",
          titleClassName,
        )}
        aria-expanded={isOpen}
        aria-controls={`sidebar-group-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
        <span className="flex-1">{title}</span>
        <span
          className={cn(
            "flex-shrink-0 transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>
      <div
        id={`sidebar-group-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
        role="region"
        aria-labelledby={`sidebar-group-${title.toLowerCase().replace(/\s+/g, "-")}-title`}
      >
        <div
          className={cn(
            "px-4 pb-4 space-y-1 border-t border-white/5",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export interface SidebarItemProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

export function SidebarItem({
  href,
  onClick,
  children,
  isActive = false,
  disabled = false,
  className,
  icon,
  badge,
}: SidebarItemProps) {
  const Component = href ? "a" : "button";

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <Component
      href={href}
      onClick={handleClick}
      disabled={disabled && !href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        isActive
          ? "bg-emerald-600/10 text-emerald-400 border-l-2 border-emerald-600"
          : "text-slate-300 hover:bg-white/5 hover:text-slate-50",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {badge && <span className="flex-shrink-0">{badge}</span>}
    </Component>
  );
}
