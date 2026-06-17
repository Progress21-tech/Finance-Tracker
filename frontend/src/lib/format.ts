/** Format a monetary amount in the user's currency. */
export function fmtCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style:    'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a date for display (e.g. "Jun 17, 2025"). */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Format a date/time (e.g. "Jun 17, 2:30 PM"). */
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

/** "3.5k", "1.2m" etc. for compact display. */
export function fmtCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}m`;
  if (Math.abs(amount) >= 1_000)     return `${(amount / 1_000).toFixed(1)}k`;
  return amount.toString();
}

/** Capitalize first letter of a string. */
export function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
