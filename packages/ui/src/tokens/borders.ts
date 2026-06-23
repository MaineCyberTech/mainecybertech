export const borders = {
  radii: {
    none: "0",
    sm: "0.125rem",
    md: "0.25rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px",
  },
  widths: {
    none: "0",
    thin: "1px",
    base: "2px",
    thick: "3px",
  },
};

export type BorderRadii = keyof typeof borders.radii;
export type BorderWidths = keyof typeof borders.widths;
