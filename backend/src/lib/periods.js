/**
 * Resolves a period string to { from, to } ISO date range.
 * Used by dashboard, analytics, and reports routes.
 */
export function resolvePeriod(period = 'this_month', from, to) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  switch (period) {
    case 'this_month':
      return {
        from: new Date(y, m, 1).toISOString(),
        to: now.toISOString(),
      };
    case 'last_month': {
      return {
        from: new Date(y, m - 1, 1).toISOString(),
        to: new Date(y, m, 0, 23, 59, 59, 999).toISOString(),
      };
    }
    case 'last_3m':
      return {
        from: new Date(y, m - 3, 1).toISOString(),
        to: now.toISOString(),
      };
    case 'last_6m':
      return {
        from: new Date(y, m - 6, 1).toISOString(),
        to: now.toISOString(),
      };
    case 'ytd':
      return {
        from: new Date(y, 0, 1).toISOString(),
        to: now.toISOString(),
      };
    case 'last_year':
      return {
        from: new Date(y - 1, 0, 1).toISOString(),
        to: new Date(y - 1, 11, 31, 23, 59, 59, 999).toISOString(),
      };
    case 'custom': {
      if (!from || !to) throw new Error('custom period requires from and to query params');
      return { from, to };
    }
    default:
      return {
        from: new Date(y, m, 1).toISOString(),
        to: now.toISOString(),
      };
  }
}

/** Returns { from, to } for a specific month given "YYYY-MM". */
export function resolveMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) throw new Error('month must be YYYY-MM');
  return {
    from: new Date(y, m - 1, 1).toISOString(),
    to: new Date(y, m, 0, 23, 59, 59, 999).toISOString(),
    label: new Date(y, m - 1, 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' }),
  };
}
