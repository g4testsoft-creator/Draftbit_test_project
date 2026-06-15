import type { Location } from '@/types/location';
import { getLocation, setLocations } from './cache';
import { fetchAllCountriesAsLocations, fetchCountryByAlpha3 } from './restcountries';

export async function fetchLocations(signal?: AbortSignal): Promise<Location[]> {
  const locations = await fetchAllCountriesAsLocations(signal);
  if (locations.length === 0) {
    throw new Error('No locations could be loaded');
  }
  setLocations(locations);
  return locations;
}

export async function fetchLocationById(
  id: string,
  signal?: AbortSignal,
): Promise<Location | null> {
  const cached = getLocation(id);
  if (cached) return cached;

  const fresh = await fetchCountryByAlpha3(id, signal);
  if (fresh) setLocations([fresh]);
  return fresh;
}
