import type { Location } from '@/types/location';

/**
 * Tiny session-scoped cache keyed by `Location.id`.
 *
 * REST Countries data is essentially static (it syncs upstream every
 * 4 hours), so once a country is in memory we hand it straight to the
 * detail screen and skip the round-trip. This is a deliberate
 * lightweight stand-in for TanStack Query / SWR — if the app grows we
 * can swap this module's surface for either without touching callers.
 */

const cache = new Map<string, Location>();

export function setLocations(locations: readonly Location[]): void {
  for (const location of locations) {
    cache.set(location.id, location);
  }
}

export function getLocation(id: string): Location | undefined {
  return cache.get(id);
}

export function clearCache(): void {
  cache.clear();
}
