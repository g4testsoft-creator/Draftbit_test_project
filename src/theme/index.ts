/**
 * Centralized design tokens.
 *
 * Keeping these in one place lets us swap themes (e.g. dark mode) and
 * stay consistent across components as the app grows.
 */

export const colors = {
  background: '#FFFFFF',
  surface: '#F7F8FA',
  surfaceMuted: '#EEF1F5',
  border: '#E2E5EA',
  text: '#0F172A',
  textMuted: '#475569',
  textInverse: '#FFFFFF',
  primary: '#2563EB',
  primaryMuted: '#DBEAFE',
  danger: '#DC2626',
  pin: '#2563EB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.text,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
} as const;
