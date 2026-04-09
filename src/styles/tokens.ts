export const tokens = {
  colors: {
    primary: 'var(--color-primary)',
    'primary-dark': 'var(--color-primary-dark)',
    'primary-container': 'var(--color-primary-container)',

    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    'surface-container-low': 'var(--color-surface-container-low)',
    'surface-container-high': 'var(--color-surface-container-high)',

    'on-surface': 'var(--color-on-surface)',
    'on-surface-variant': 'var(--color-on-surface-variant)',

    tertiary: 'var(--color-tertiary-fixed)',

    error: 'var(--color-error)',
    'error-container': 'var(--color-error-container)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',

    // Section accents (fall back to sensible hex if missing)
    inventory: 'var(--color-inventory, #3b82f6)',
    sales: 'var(--color-sales, #10b981)',
    purchases: 'var(--color-purchases, #8b5cf6)',
    reports: 'var(--color-reports, #f59e0b)',
    warehouses: 'var(--color-warehouses, #06b6d4)',
    settings: 'var(--color-settings, #64748b)',
    dashboard: 'var(--color-dashboard, #1a56db)',

    // status
    status: {
      inStockBg: 'var(--color-status-inStock-bg, #ecfdf5)',
      inStockText: 'var(--color-status-inStock-text, #065f46)',
      lowStockBg: 'var(--color-status-lowStock-bg, #fff7ed)',
      lowStockText: 'var(--color-status-lowStock-text, #92400e)',
      outStockBg: 'var(--color-status-outStock-bg, #fef2f2)',
      outStockText: 'var(--color-status-outStock-text, #7f1d1d)',
    },
  },

  gradients: {
    sidebar: 'var(--gradient-sidebar, linear-gradient(180deg,#172554 0%,#1e3a8a 100%))',
    cardBlue: 'var(--gradient-card-blue, linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%))',
    cardEmerald: 'var(--gradient-card-emerald, linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%))',
    cardAmber: 'var(--gradient-card-amber, linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%))',
  },
} as const;

export type Tokens = typeof tokens;

export default tokens;
