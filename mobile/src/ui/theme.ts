export const palette = {
  // Deep-space canvas — matches the Events Hub design system (#050712 base).
  bg: "#050712",
  bgElevated: "#0C1226",
  bgMuted: "#141E3E",
  surface: "#F7F8FF",
  surfaceRaised: "#FFFFFF",
  surfaceTint: "#EEF2FF",
  text: "#0E172F",
  textMuted: "#65708C",
  textInverse: "#FFFFFF",
  textSoft: "rgba(255,255,255,0.72)",
  line: "rgba(14,23,47,0.09)",
  lineInverse: "rgba(255,255,255,0.14)",
  accent: "#7C3AED",
  accentStrong: "#2563EB",
  accentCool: "#6D5BFF",
  accentLive: "#DB2777",
  accentSoft: "#EEF2FF",
  accentPink: "#DB2777",
  // Cyan accent range from the design (mobile home eyebrows, prices, live dots).
  accentCyan: "#38BDF8",
  accentCyanSoft: "#A5F3FC",
  success: "#27C07D",
  warning: "#F5A524",
  danger: "#F35E73",
  ink: "#131A2A",
  black: "#000000",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radii = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  pill: 999,
};

export const type = {
  eyebrow: 11,
  label: 12,
  body: 14,
  bodyLg: 15,
  titleSm: 18,
  title: 24,
  hero: 32,
};

export const shadows = {
  soft: {
    shadowColor: palette.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 5,
  },
  strong: {
    shadowColor: palette.black,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 26,
    elevation: 10,
  },
  glow: {
    shadowColor: palette.accentCool,
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8,
  },
};
