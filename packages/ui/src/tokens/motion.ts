export const motion = {
  duration: {
    instant: "0ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms",
    slowest: "700ms",
  },
  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
  transition: {
    all: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    colors:
      "background-color 200ms, border-color 200ms, color 200ms, fill 200ms, stroke 200ms",
    opacity: "opacity 200ms",
    shadow: "box-shadow 200ms",
    transform: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    filter: "filter 200ms",
    backdropFilter: "backdrop-filter 200ms",
  },
};

export type Duration = keyof typeof motion.duration;
export type Easing = keyof typeof motion.easing;
