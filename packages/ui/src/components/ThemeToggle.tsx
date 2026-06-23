"use client";

import { useTheme } from "@mct/ui/hooks/use-theme";
import { useState, useEffect, useRef } from "react";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" aria-hidden="true" />;
  }

  const themes: Array<{
    value: "light" | "dark" | "system";
    label: string;
    icon: string;
  }> = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "system", label: "System", icon: "💻" },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-600/50 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        aria-label="Theme selector"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true">{currentTheme.icon}</span>
          <span>{currentTheme.label}</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul
          className="absolute right-0 mt-2 w-36 rounded-lg border border-white/10 bg-[#0A1118]/95 backdrop-blur-md shadow-lg overflow-hidden z-50"
          role="listbox"
          aria-label="Select theme"
        >
          {themes.map((t) => (
            <li key={t.value}>
              <button
                type="button"
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition ${
                  theme === t.value
                    ? "bg-emerald-600/10 text-emerald-400"
                    : "text-slate-300 hover:bg-white/5 hover:text-slate-50"
                }`}
                role="option"
                aria-selected={theme === t.value}
              >
                <span aria-hidden="true">{t.icon}</span>
                <span>{t.label}</span>
                {theme === t.value && (
                  <svg
                    className="ml-auto w-4 h-4 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
