import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
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

        error: 'var(--color-error)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',

        inventory: 'var(--color-inventory)',
        sales: 'var(--color-sales)',
        purchases: 'var(--color-purchases)',
        reports: 'var(--color-reports)',
        warehouses: 'var(--color-warehouses)',
        settings: 'var(--color-settings)',
        dashboard: 'var(--color-dashboard)',
      },
    },
  },
  plugins: [],
};

export default config;
