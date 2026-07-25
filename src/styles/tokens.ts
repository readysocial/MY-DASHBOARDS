/**
 * ReadySocial design tokens — single source of truth for theme values.
 * Prefer CSS variables / Tailwind theme keys in components; use these
 * for JS-only consumers (charts, inline styles).
 */

export const colors = {
  // Surfaces
  sidebar: "#FFFFFF",
  sidebarMuted: "#FAFAFA",
  page: "#F8F8F8",
  header: "#F2F2F2",
  surface: "#FFFFFF",

  // Text
  text: "#231F20",
  textSecondary: "#5A5758",
  textMuted: "#918F8F",

  // Borders
  border: "#EDEDED",

  // Brand accents (use sparingly)
  primary: "#E63947",
  primaryTint: "#FEF5F6",
  blue: "#1AABE4",
  blueTint: "#E8F7FC",

  // Status (muted, not neon)
  success: "#3D9B6E",
  warning: "#C4922E",
  danger: "#E63947",

  // Charts — desaturated series (never mix full-sat red + blue in one series set)
  chart: {
    primary: "#E88A92", // muted primary
    secondary: "#7BC4E0", // muted blue
    tertiary: "#B8B6B6", // neutral gray
    grid: "#F0F0F0",
    axis: "#918F8F",
  },
} as const;

export const fontSize = {
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "20px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
} as const;

export const space = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
} as const;

export const radius = {
  sm: "8px",
  md: "10px",
  lg: "12px",
  xl: "16px",
} as const;

export const motion = {
  fast: "150ms",
  base: "200ms",
  ease: "ease",
} as const;

export const layout = {
  sidebarWidth: "240px",
  sidebarCollapsed: "64px",
  contentMaxWidth: "1280px",
} as const;
