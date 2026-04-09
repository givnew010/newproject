export const typography = {
  fonts: {
    arabic: '"Cairo", "Segoe UI", system-ui, sans-serif',
    numbers: '"JetBrains Mono", monospace',
  },

  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const textStyles = {
  pageTitle: 'text-2xl font-bold text-on-surface',
  sectionTitle: 'text-lg font-semibold text-on-surface-variant',
  cardTitle: 'text-base font-semibold text-on-surface-variant',
  bodyText: 'text-sm text-on-surface-variant',
  mutedText: 'text-xs text-on-surface-variant/70',
  kpiNumber: 'text-3xl font-extrabold font-mono',
  tableHeader: 'text-xs font-semibold text-on-surface-variant uppercase tracking-wider',
  tableCell: 'text-sm text-on-surface-variant',
  badgeText: 'text-xs font-medium',
  labelText: 'text-sm font-medium text-on-surface-variant',
  errorText: 'text-xs text-red-500',
  linkText: 'text-sm font-medium text-primary hover:text-primary-dark',
} as const;

export type Typography = typeof typography;

export default typography;
