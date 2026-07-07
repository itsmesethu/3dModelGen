export const colors = {
  background: '#0B0D12',
  surface: '#151A23',
  surfaceAlt: '#1D2430',
  border: '#2A3342',
  primary: '#6C8CFF',
  primaryDark: '#4A66D9',
  accent: '#8B5CF6',
  text: '#F2F4F8',
  subtext: '#8A93A6',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  overlay: 'rgba(11, 13, 18, 0.72)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.subtext },
  button: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
};
