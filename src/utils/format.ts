import type { Currency } from '@/types/location';

/**
 * Humanize a population count (e.g. `1234567` → `"1.2M"`).
 * Falls back to a raw string when the value is too small to abbreviate.
 */
export function formatPopulation(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

/**
 * Render a comma-separated list of currencies, including the symbol when
 * it adds information beyond the ISO code.
 */
export function formatCurrencies(currencies: Currency[]): string {
  return currencies
    .map((c) =>
      c.symbol && c.symbol !== c.code
        ? `${c.name} (${c.code} · ${c.symbol})`
        : `${c.name} (${c.code})`,
    )
    .join(', ');
}
