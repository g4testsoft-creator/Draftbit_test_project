import type { Location } from '@/types/location';

// Session-scoped cache keyed by `Location.id`. Drop-in replaceable with TanStack Query / SWR.
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
