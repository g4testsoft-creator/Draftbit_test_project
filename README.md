# DraftbitTestApp — Map MVP

A cross-platform (iOS + Android) Expo SDK 54 app that loads the world's
countries from the [REST Countries v5 API][rc-docs], pins each country's
primary capital city on the map, and lets the user drill into a detail
screen with rich country-level metadata.

> Targets **iOS + Android** per the brief. The web target is disabled
> because `react-native-maps` is native-only (it imports React Native
> internals that have no web build). See "Adding web support" below if
> you want to revive it with a separate web map implementation.

[rc-docs]: https://restcountries.com/docs

Built with:

- **Expo SDK 54** (`~54.0.34`) with the New Architecture enabled
- **Expo Router 6** (file-based routing, typed routes, deep linking)
- **`react-native-maps`** (Apple Maps on iOS, Google Maps on Android)
- **TypeScript** in strict mode
- **REST Countries v5** as the data source (Bearer-token auth)

## Getting started

Requirements: Node 20.19+, Xcode 16.1+ (for iOS), Android Studio with API
36 (for Android). See the
[Expo SDK 54 requirements](https://docs.expo.dev/versions/v54.0.0/) for
the full list.

```sh
# 1. Install deps
npm install

# 2. Add your REST Countries API key
cp .env.example .env
# then edit .env and paste your real key into EXPO_PUBLIC_RESTCOUNTRIES_KEY

# 3. Run
npm run start            # opens the Expo dev server
npm run ios              # launch in the iOS simulator
npm run android          # launch on an Android emulator/device

# Quality gates
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint (flat config, eslint-config-expo + prettier)
npm run lint:fix         # auto-fix lint + formatting
npm run format           # prettier --write across the repo
```

Get a free REST Countries v5 key at <https://restcountries.com/sign-up>
(free tier covers 500 requests/mo, which is plenty since this app makes
~3 list requests per cold start plus 1 per detail screen view).

The map and detail screens both work in Expo Go on SDK 54 — Apple Maps
on iOS and Google Maps on Android render without any extra map-provider
API key configuration for development.

## App structure

The app uses the standard Expo Router file-based routing convention.

```
.
├── app/                          ← routes (file = screen)
│   ├── _layout.tsx               Stack navigator wrapped in <ErrorBoundary>
│   ├── index.tsx                 Screen 1: Map view with capital pins
│   └── location/[id].tsx         Screen 2: Detail view for a country
├── src/
│   ├── api/
│   │   ├── restcountries.ts      REST client + `normalizeCountry`
│   │   ├── locations.ts          App-level data service (orchestration)
│   │   └── cache.ts              In-memory cache: instant Map → Detail nav
│   ├── components/
│   │   ├── ErrorBoundary.tsx     Class component that catches render errors
│   │   ├── ErrorState.tsx        Reusable error + retry UI
│   │   ├── LoadingState.tsx      Reusable loading UI
│   │   ├── MapPinCallout.tsx     Memoized Marker + Callout (perf: 250 markers)
│   │   ├── MetaPill.tsx          Detail screen pill
│   │   └── DetailSection.tsx     Detail screen title+body section
│   ├── constants/
│   │   └── map.ts                Map zoom levels, world region, edge padding
│   ├── hooks/
│   │   └── useLocations.ts       Data hooks (list + by-id, AbortController)
│   ├── theme/
│   │   └── index.ts              Colors, spacing, radii, typography tokens
│   ├── types/
│   │   └── location.ts           Domain types (`Location`, `LocationDetails`)
│   └── utils/
│       └── format.ts             Population + currency formatters
├── app.json                      Expo config (scheme, plugins, typed routes)
├── tsconfig.json                 strict TS + `@/*` path alias for `src/`
├── eslint.config.js              Flat ESLint config (eslint-config-expo + Prettier)
├── .prettierrc / .editorconfig   Formatting + cross-editor consistency
├── .env.example                  Documented env var template
└── package.json
```

## How the two screens work

### 1. Map view (`app/index.tsx`)

- On mount, `useLocations()` fans out paginated requests to
  `GET https://api.restcountries.com/countries/v5?response_fields=...&limit=100&offset=N`
  until all countries are loaded (~3 parallel pages of 100). Responses
  are normalized into the app's `Location` type and entries without a
  primary capital with coordinates are dropped.
- While requests are in flight the screen renders `<LoadingState>`. On
  total failure it renders `<ErrorState>` with a working **Try again**
  action.
- When data arrives, the `MapView` calls `fitToCoordinates` once on
  `onMapReady` so all pins fit the viewport regardless of where the user
  is in the world.
- Each pin (`<Marker>`, `tracksViewChanges={false}` for perf) shows the
  capital name + "Capital of {country}" in its callout. Tapping the
  callout (iOS) or the pin (Android) routes to `/location/[id]` via
  Expo Router's typed router, where `[id]` is the country's ISO-3 code.
- A floating **Recenter** button refits the camera to all markers.

### 2. Detail view (`app/location/[id].tsx`)

- Reads `id` (the ISO-3 alpha code) from the URL with
  `useLocalSearchParams`.
- `useLocation(id)` calls
  `GET /countries/v5/codes.alpha_3/{id}?response_fields=...`, so the
  screen can be deep-linked / refreshed independently (no reliance on
  in-memory list state).
- Renders the country's flag as a hero image, then the capital city
  name, region/population/coordinate pills, languages, currencies (with
  symbols), timezones, the flag description, an embedded mini-map
  centered on the capital, and a **Open in Google Maps** button that
  uses a `https://www.google.com/maps/search/?api=1&query=lat,lng` deep
  link.

## Authentication

REST Countries v5 requires a `Authorization: Bearer <key>` header on
every request. The key is read at build time from
`process.env.EXPO_PUBLIC_RESTCOUNTRIES_KEY`. Expo automatically inlines
any env var prefixed with `EXPO_PUBLIC_` into the JS bundle when the
bundler starts, so make sure to **restart the dev server after editing
`.env`** for changes to take effect.

`EXPO_PUBLIC_*` env vars are shipped to clients — they are not secrets.
For a production deployment that uses a paid REST Countries plan, the
right pattern is to proxy the request through your own server so the
key never leaves the backend. See the "Production considerations"
section below.

## API & data layer

The data layer is split into three layers so a real client project can
grow into it:

1. **Source client** — `src/api/restcountries.ts` is the only place
   that knows about the REST Countries v5 contract. It handles bearer
   auth, pagination (`limit`/`offset`), the JSON-API-ish
   `{ data: { objects: [...] } }` envelope, and parses raw JSON into
   the `Location` shape. It throws a typed `RestCountriesApiError` on
   HTTP failures.
2. **Service** — `src/api/locations.ts` orchestrates which source(s) to
   call and aggregates the results. Swapping the data source (REST →
   GraphQL → internal CMS) only requires changes here.
3. **Hooks** — `src/hooks/useLocations.ts` adapts the service to React
   with loading / error / retry state and `AbortController`-based
   cancellation so screen unmounts don't leak in-flight requests.

This MVP intentionally avoids React Query / SWR to keep dependencies
tight, but the hook signatures (`{ data, isLoading, error, reload }`)
are shaped to match those libraries to make a future migration
mechanical.

## Configuration choices

- **TypeScript strict mode + `@/*` alias.** `src/...` is reachable as
  `@/...` from anywhere in the app.
- **Typed routes (`experiments.typedRoutes: true`).** Route paths in
  `router.push(...)` are statically type-checked against the actual
  `app/` directory.
- **Deep-link `scheme: "draftbittestapp"`** — every route (including
  `/location/JPN`) is automatically a universal link.
- **`newArchEnabled: true`** — the project ships with React Native's
  New Architecture (Fabric/TurboModules) enabled, the default for
  SDK 54.
- **`bundleIdentifier` / `package`** set to `com.draftbit.testapp` so
  EAS Build / app-store submission have a consistent identifier from
  day one.

## Production considerations (not done in MVP)

These are intentionally left for follow-up work but flagged here so the
client knows what's needed to ship to the stores:

- **Proxy the REST Countries API key server-side.** `EXPO_PUBLIC_*`
  env vars are embedded in the JS bundle and can be extracted from any
  installed build. For a paid plan, route requests through a thin
  proxy (Cloudflare Worker, Fly machine, etc.) that holds the real key
  server-side.
- **Google Maps API keys on Android** (and optionally iOS via
  `PROVIDER_GOOGLE`). The current setup uses the platform's default
  provider, which is fine for development and for Apple Maps on iOS
  but Google Maps on Android will need an API key + SHA-1 restriction
  once the app is distributed via EAS Build. See
  [the SDK 54 map-view docs](https://docs.expo.dev/versions/v54.0.0/sdk/map-view/#deploy-app-with-google-maps).
- **App icons & splash assets** — the default Expo placeholders are
  still in `assets/`. Replace before submission.
- **EAS configuration** — `eas.json` and project linking with
  `eas init` / `eas build:configure`.
- **Server-side or cached data layer** — REST Countries data is
  effectively static and could be pre-baked or aggressively cached
  (TanStack Query + AsyncStorage, or a small backend) for offline-first
  behavior.
- **Marker clustering** — at world zoom 240+ pins are usable but
  cluttered; consider `react-native-maps-super-cluster` or building
  region-based clusters when zooming out.
- **Testing** — Jest + `@testing-library/react-native` for unit tests,
  and Detox or Maestro for end-to-end on simulators/devices.

## Adding web support (optional)

`react-native-maps` doesn't ship a web build, so the web target is
disabled. To re-enable it:

1. `npx expo install react-native-web react-dom @expo/metro-runtime`
2. Add `"web": { "bundler": "metro", "favicon": "./assets/favicon.png" }`
   back to `app.json`.
3. Replace the map UI with a web-friendly alternative — either Leaflet
   via `react-leaflet`, or the Google Maps JS API. The cleanest pattern
   is per-platform file splits: create `app/index.web.tsx` and
   `app/location/[id].web.tsx` alongside the existing native files so
   each target gets its own map implementation while sharing the rest
   of the app (data layer, theme, navigation).

## Quality gates

All four commands are green on `main`:

```sh
npm run typecheck                    # strict tsc --noEmit
npm run lint                         # eslint-config-expo + Prettier
npx expo-doctor                      # 18/18 checks passing
npx expo export --platform ios       # bundles cleanly
```
