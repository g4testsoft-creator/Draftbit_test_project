/**
 * Thin client around the REST Countries v5 API.
 *
 * Docs: https://restcountries.com/docs
 *
 * v5 ships exactly one resource (`/countries`) reached via a small set
 * of endpoints; this module exposes just the two the app needs and
 * normalizes every response into the app's `Location` shape, dropping
 * entries that can't be plotted on a map (no primary capital, no
 * coordinates, no ISO-3 code).
 */

import type { Location } from '@/types/location';

const BASE_URL = 'https://api.restcountries.com/countries/v5';

const RESPONSE_FIELDS = [
  'names.common',
  'names.official',
  'codes.alpha_3',
  'capitals',
  'region',
  'subregion',
  'population',
  'languages',
  'currencies',
  'flag.url_png',
  'flag.description',
  'timezones',
].join(',');

const MAX_PAGE_SIZE = 100;

const apiKey = process.env.EXPO_PUBLIC_RESTCOUNTRIES_KEY;

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

type RestCountriesEnvelope<T> = {
  data?: {
    objects?: T[];
    meta?: {
      total?: number;
      count?: number;
      limit?: number;
      offset?: number;
      more?: boolean;
    };
  };
  errors?: { message: string }[];
};

function authHeaders(): HeadersInit {
  if (!apiKey) {
    throw new RestCountriesApiError(
      'EXPO_PUBLIC_RESTCOUNTRIES_KEY is not set. Add it to your .env file. See .env.example.',
    );
  }
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

async function get<T>(
  path: string,
  signal?: AbortSignal,
): Promise<RestCountriesEnvelope<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    signal,
    headers: authHeaders(),
  });

  let payload: RestCountriesEnvelope<T>;
  try {
    payload = (await response.json()) as RestCountriesEnvelope<T>;
  } catch {
    throw new RestCountriesApiError(
      `Invalid JSON response from REST Countries (HTTP ${response.status})`,
      response.status,
    );
  }

  if (!response.ok) {
    const message =
      payload.errors?.[0]?.message ??
      `REST Countries request failed (HTTP ${response.status})`;
    throw new RestCountriesApiError(message, response.status);
  }

  return payload;
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

/**
 * Fetch every country across paginated v5 calls and return only those
 * that can be plotted on the map (has alpha_3 + primary capital + lat/lng).
 */
export async function fetchAllCountriesAsLocations(
  signal?: AbortSignal,
): Promise<Location[]> {
  const firstPath = `?response_fields=${encodeURIComponent(RESPONSE_FIELDS)}&limit=${MAX_PAGE_SIZE}&offset=0`;
  const first = await get<RawCountry>(firstPath, signal);
  const total = first.data?.meta?.total ?? first.data?.objects?.length ?? 0;
  const pages: RawCountry[][] = [first.data?.objects ?? []];

  const remainingOffsets: number[] = [];
  for (let offset = MAX_PAGE_SIZE; offset < total; offset += MAX_PAGE_SIZE) {
    remainingOffsets.push(offset);
  }

  // Fire remaining pages in parallel — the dataset is tiny (~250 records)
  // and the API does not require sequential offsets.
  const remaining = await Promise.all(
    remainingOffsets.map(async (offset) => {
      const path = `?response_fields=${encodeURIComponent(RESPONSE_FIELDS)}&limit=${MAX_PAGE_SIZE}&offset=${offset}`;
      const page = await get<RawCountry>(path, signal);
      return page.data?.objects ?? [];
    }),
  );
  pages.push(...remaining);

  const locations: Location[] = [];
  for (const page of pages) {
    for (const country of page) {
      const normalized = normalizeCountry(country);
      if (normalized) locations.push(normalized);
    }
  }
  return locations;
}

/**
 * Look up a single country by ISO alpha-3 code. Used by the detail screen
 * so it can render correctly when deep-linked without going through the
 * list first.
 */
export async function fetchCountryByAlpha3(
  alpha3: string,
  signal?: AbortSignal,
): Promise<Location | null> {
  const path =
    `/codes.alpha_3/${encodeURIComponent(alpha3)}` +
    `?response_fields=${encodeURIComponent(RESPONSE_FIELDS)}`;
  const result = await get<RawCountry>(path, signal);
  const first = result.data?.objects?.[0];
  if (!first) return null;
  return normalizeCountry(first);
}
