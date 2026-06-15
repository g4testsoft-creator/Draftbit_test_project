import type { Location } from '@/types/location';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export class RestCountriesApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'RestCountriesApiError';
  }
}

export type RawCapital = {
  name?: string;
  coordinates?: { lat?: number; lng?: number };
  attributes?: { primary?: boolean };
};

export type RawLanguage = { name?: string; native_name?: string };
export type RawCurrency = { code?: string; name?: string; symbol?: string };

export type RawCountry = {
  names?: { common?: string; official?: string };
  codes?: { alpha_3?: string };
  capitals?: RawCapital[];
  region?: string;
  subregion?: string;
  population?: number;
  languages?: RawLanguage[];
  currencies?: RawCurrency[];
  flag?: { url_png?: string; description?: string };
  timezones?: string[];
};

type WorkerError = { error?: { message?: string } };

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!BASE_URL) {
    throw new RestCountriesApiError(
      'EXPO_PUBLIC_API_BASE_URL is not set. Add the Cloudflare Worker URL to your .env file. See .env.example.',
    );
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  let payload: T | WorkerError;
  try {
    payload = (await response.json()) as T | WorkerError;
  } catch {
    throw new RestCountriesApiError(
      `Invalid JSON response from the API (HTTP ${response.status})`,
      response.status,
    );
  }

  if (!response.ok) {
    const message =
      (payload as WorkerError).error?.message ??
      `API request failed (HTTP ${response.status})`;
    throw new RestCountriesApiError(message, response.status);
  }

  return payload as T;
}

function pickPrimaryCapital(country: RawCountry): RawCapital | null {
  const capitals = country.capitals ?? [];
  if (capitals.length === 0) return null;
  return capitals.find((c) => c.attributes?.primary) ?? capitals[0] ?? null;
}

export function normalizeCountry(country: RawCountry): Location | null {
  const alpha3 = country.codes?.alpha_3?.trim();
  if (!alpha3) return null;

  const capital = pickPrimaryCapital(country);
  if (!capital?.coordinates?.lat || capital.coordinates.lng == null) return null;

  const countryName = country.names?.common ?? alpha3;
  const capitalName = capital.name ?? countryName;

  return {
    id: alpha3,
    title: capitalName,
    description: `Capital of ${countryName}`,
    summary: country.flag?.description ?? '',
    coordinates: {
      latitude: capital.coordinates.lat,
      longitude: capital.coordinates.lng,
    },
    imageUrl: country.flag?.url_png || undefined,
    sourceUrl: `https://www.google.com/maps/search/?api=1&query=${capital.coordinates.lat},${capital.coordinates.lng}`,
    details: {
      countryName,
      officialName: country.names?.official,
      region: country.region,
      subregion: country.subregion,
      population: country.population,
      languages: (country.languages ?? [])
        .map((l) => l.name)
        .filter((n): n is string => !!n),
      currencies: (country.currencies ?? [])
        .filter((c) => !!c.code)
        .map((c) => ({
          code: c.code as string,
          name: c.name ?? (c.code as string),
          symbol: c.symbol,
        })),
      timezones: country.timezones ?? [],
      flagDescription: country.flag?.description,
    },
  };
}

export async function fetchAllCountriesAsLocations(
  signal?: AbortSignal,
): Promise<Location[]> {
  const result = await getJson<{ objects: RawCountry[] }>('/countries', signal);
  const locations: Location[] = [];
  for (const country of result.objects ?? []) {
    const normalized = normalizeCountry(country);
    if (normalized) locations.push(normalized);
  }
  return locations;
}

export async function fetchCountryByAlpha3(
  alpha3: string,
  signal?: AbortSignal,
): Promise<Location | null> {
  try {
    const result = await getJson<{ object: RawCountry }>(
      `/country/${encodeURIComponent(alpha3)}`,
      signal,
    );
    return normalizeCountry(result.object);
  } catch (err) {
    if (err instanceof RestCountriesApiError && err.status === 404) return null;
    throw err;
  }
}
