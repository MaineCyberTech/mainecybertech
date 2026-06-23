import { colors } from "./colors";

export const semanticColors = {
  background: {
    primary: colors.cyber.base,
    secondary: colors.cyber.card,
    tertiary: colors.cyber.cardHover,
    overlay: "rgba(0, 0, 0, 0.45)",
  },
  border: {
    default: "rgba(255, 255, 255, 0.05)",
    hover: "rgba(5, 150, 105, 0.25)",
    focus: colors.cyber.accent,
    error: colors.red[500],
    success: colors.emerald[500],
    warning: colors.amber[500],
  },
  text: {
    primary: colors.slate[50],
    secondary: colors.slate[300],
    muted: colors.slate[400],
    accent: colors.cyber.accentLight,
    error: colors.red[400],
    success: colors.emerald[400],
    warning: colors.amber[400],
    onAccent: colors.cyber.base,
  },
  button: {
    primary: {
      bg: colors.cyber.accent,
      border: colors.cyber.accent,
      text: colors.cyber.base,
      hover: {
        bg: "transparent",
        text: colors.cyber.accentLight,
        shadow: colors.cyber.accentGlow,
      },
    },
    secondary: {
      bg: "transparent",
      border: "rgba(5, 150, 105, 0.4)",
      text: colors.emerald[400],
      hover: {
        bg: "rgba(5, 150, 105, 0.1)",
        shadow: "rgba(5, 150, 105, 0.2)",
      },
    },
    danger: {
      bg: colors.red[500],
      border: colors.red[500],
      text: colors.white,
      hover: {
        bg: colors.red[600],
      },
    },
  },
  input: {
    bg: "rgba(10, 17, 24, 0.6)",
    border: "rgba(255, 255, 255, 0.1)",
    text: colors.slate[50],
    placeholder: colors.slate[500],
    focus: {
      border: colors.cyber.accent,
      bg: "rgba(10, 17, 24, 0.9)",
      shadow: "rgba(5, 150, 105, 0.2)",
    },
  },
  status: {
    success: {
      bg: "rgba(5, 150, 105, 0.1)",
      border: "rgba(5, 150, 105, 0.2)",
      text: colors.emerald[300],
    },
    warning: {
      bg: "rgba(245, 158, 11, 0.1)",
      border: "rgba(245, 158, 11, 0.2)",
      text: colors.amber[300],
    },
    danger: {
      bg: "rgba(239, 68, 68, 0.1)",
      border: "rgba(239, 68, 68, 0.2)",
      text: colors.red[300],
    },
    info: {
      bg: "rgba(255, 255, 255, 0.05)",
      border: "rgba(255, 255, 255, 0.1)",
      text: colors.slate[300],
    },
  },
  glass: {
    bg: colors.cyber.card,
    border: "rgba(255, 255, 255, 0.05)",
    blur: "blur-md",
    shadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
    hover: {
      border: "rgba(5, 150, 105, 0.25)",
      bg: colors.cyber.cardHover,
      shadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
    },
  },
};

export type SemanticColors = typeof semanticColors;
