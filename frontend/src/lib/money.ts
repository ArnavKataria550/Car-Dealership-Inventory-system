const WHOLE_DOLLARS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const WITH_CENTS = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** $30,995 for whole-dollar prices, $29,999.50 when there are cents. */
export function formatPrice(cents: number): string {
  const formatter = cents % 100 === 0 ? WHOLE_DOLLARS : WITH_CENTS;
  return formatter.format(cents / 100);
}

// Digits (optionally grouped with commas), then up to two decimal places.
const DOLLAR_PATTERN = /^(\d{1,3}(,\d{3})+|\d+)(\.(\d{1,2}))?$/;

/**
 * Turns typed dollars ("27,999.50", "$42") into integer cents, or null if the
 * text is not a valid non-negative amount. Works on the digits as text, so no
 * floating-point rounding can creep in.
 */
export function parseDollars(input: string): number | null {
  const text = input.trim().replace(/^\$/, '');
  const match = DOLLAR_PATTERN.exec(text);
  if (!match) return null;

  const dollars = Number(match[1]!.replace(/,/g, ''));
  const cents = Number((match[4] ?? '').padEnd(2, '0'));
  return dollars * 100 + cents;
}

/** A stored price as an editable form value: "27999" or "27999.50". */
export function centsToDollarInput(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  return remainder === 0 ? String(dollars) : `${dollars}.${String(remainder).padStart(2, '0')}`;
}
