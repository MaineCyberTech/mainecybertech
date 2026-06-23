import type { Config } from "tailwindcss";
import {
  colors,
  spacing,
  typography,
  borders,
  shadows,
  motion,
} from "@mct/ui/tokens";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: colors.cyber,
        slate: colors.slate,
        emerald: colors.emerald,
        amber: colors.amber,
        red: colors.red,
      },
      fontFamily: {
        display: typography.fontFamily.display,
        body: typography.fontFamily.body,
        mono: typography.fontFamily.mono,
      },
      spacing: spacing,
      borderRadius: borders.radii,
      borderWidth: borders.widths,
      boxShadow: shadows,
      transitionDuration: motion.duration,
      transitionTimingFunction: motion.easing,
    },
  },
  plugins: [],
};

export default config;
