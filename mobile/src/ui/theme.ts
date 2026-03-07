export const palette = {
  bg: "#0A1020",
  bgElevated: "#10192F",
  bgMuted: "#16213D",
  surface: "#F6F1E8",
  surfaceRaised: "#FFF9F2",
  surfaceTint: "#EFE5D7",
  text: "#131A2A",
  textMuted: "#6F7890",
  textInverse: "#FFFFFF",
  textSoft: "rgba(255,255,255,0.72)",
  line: "rgba(17, 24, 39, 0.08)",
  lineInverse: "rgba(255,255,255,0.12)",
  accent: "#FF6E62",
  accentStrong: "#FF8D54",
  accentCool: "#7F8BFF",
  accentLive: "#FF4D6D",
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
    shadowColor: palette.accent,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 8,
  },
};
