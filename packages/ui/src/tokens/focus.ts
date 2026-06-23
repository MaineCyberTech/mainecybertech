import { colors } from "./colors";

export const focus = {
  ring: {
    default: `0 0 0 2px ${colors.cyber.accent}`,
    inset: `inset 0 0 0 2px ${colors.cyber.accent}`,
    error: `0 0 0 2px ${colors.red[500]}`,
    success: `0 0 0 2px ${colors.emerald[500]}`,
    warning: `0 0 0 2px ${colors.amber[500]}`,
  },
  outline: {
    default: `2px solid ${colors.cyber.accent}`,
    error: `2px solid ${colors.red[500]}`,
    success: `2px solid ${colors.emerald[500]}`,
    warning: `2px solid ${colors.amber[500]}`,
  },
  offset: {
    0: "0",
    1: "2px",
    2: "4px",
    4: "8px",
  },
};

export type FocusRing = keyof typeof focus.ring;
export type FocusOutline = keyof typeof focus.outline;
