export const spacing = {
  card: {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  },
  modal: {
    header: 'px-6 py-4',
    body: 'px-6 py-5',
    footer: 'px-6 py-4',
  },
  table: {
    header: 'px-4 py-3',
    cell: 'px-4 py-3',
  },
  input: 'px-3 py-2',
  button: {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-5 py-2.5',
  },
  gap: {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
  radius: {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  },
} as const;

export type Spacing = typeof spacing;

export default spacing;
