/**
 * Domain types for the map app.
 *
 * `Location` is the normalized shape the rest of the app consumes,
 * decoupled from any specific data source (REST Countries, etc.).
 *
 * In this MVP a "location" is a country's primary capital city — pinned
 * at the capital's coordinates, with country-level metadata attached for
 * the detail screen.
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Currency = {
  code: string;
  name: string;
  symbol?: string;
};

export type LocationDetails = {
  countryName: string;
  officialName?: string;
  region?: string;
  subregion?: string;
  population?: number;
  languages: string[];
  currencies: Currency[];
  timezones: string[];
  flagDescription?: string;
};

export type Location = {
  id: string;
  title: string;
  description: string;
  summary: string;
  coordinates: Coordinates;
  imageUrl?: string;
  sourceUrl?: string;
  details: LocationDetails;
};
