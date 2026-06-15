import type { Currency } from '@/types/location';

/** Humanize a population count (e.g. `1234567` → `"1.2M"`). */
export function formatPopulation(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatCurrencies(currencies: Currency[]): string {
  return currencies
    .map((c) =>
      c.symbol && c.symbol !== c.code
        ? `${c.name} (${c.code} · ${c.symbol})`
        : `${c.name} (${c.code})`,
    )
    .join(', ');
}
