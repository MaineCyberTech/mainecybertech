"use client";

import { createContext, useContext, ReactNode } from "react";

/**
 * The portal ships a single dark theme; there is no user-facing toggle and no
 * light/system code path. The provider is kept as the documented dark-mode pin
 * so consumers can read `useTheme()` without branching on a theme that cannot
 * change.
 */
type Theme = "dark";

export interface ThemeProviderProps {
  children: ReactNode;
}

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "dark";
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={{ theme: "dark", resolvedTheme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === null) {
    // Return default values for graceful degradation (e.g., in tests or SSR)
    return {
      theme: "dark",
      resolvedTheme: "dark",
    };
  }
  return context;
}
