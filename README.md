# DraftbitTestApp — Map MVP

A cross-platform Expo SDK 54 app that pins the world's capital cities on
a map and lets you drill into a detail screen with country-level
metadata. Runs on iOS, Android, and the web — the web build is deployed
as a public Cloudflare Worker (Static Assets).

**Live web build:** <https://draftbittestapp-web.nasirajamil78.workers.dev>

Built with:

- **Expo SDK 54** (`~54.0.34`) with the New Architecture enabled
- **Expo Router 6** — file-based routing, typed routes, deep linking
- **`react-native-maps`** on iOS / Android (Apple Maps + Google Maps)
- **Leaflet + OpenStreetMap tiles** on web (via `react-leaflet`)
- **TypeScript** in strict mode
- **REST Countries v5** as the data source
- **Cloudflare Workers (Static Assets)** for the web hosting

The native MapView and the web MapView live behind a single
`@/components/Map` import — Metro's `.web.tsx` / `.tsx` extension
resolution swaps implementations per platform.

## Getting started

Requirements: Node 20.19+. Add Xcode 16.1+ for iOS, Android Studio with
API 36 for Android, or just a browser for web. See the
[Expo SDK 54 requirements](https://docs.expo.dev/versions/v54.0.0/) for
the full list.

```sh
# 1. Install deps
npm install

# 2. Add your REST Countries v5 API key
cp .env.example .env
# edit .env and set EXPO_PUBLIC_RESTCOUNTRIES_KEY

# 3. Run
npm run start            # Expo dev server (native)
npm run ios              # iOS simulator
npm run android          # Android emulator / device
npm run web              # local web dev server

# Quality gates
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint (flat config, eslint-config-expo + prettier)
npm run lint:fix         # auto-fix lint + formatting
npm run format           # prettier --write across the repo

# Deploy the web build to Cloudflare
npm run build:web        # expo export --platform web → dist/
npm run deploy:web       # builds and pushes to Cloudflare via wrangler
```

Get a free REST Countries v5 key at <https://restcountries.com/sign-up>
(free tier covers 500 requests/mo).

### Important: REST Countries CORS allowlist (web only)

REST Countries v5 enforces a per-key allowlist for browser origins. To
make the web build work, add the host(s) you want to serve from to your
key's "CORS allowed origins" list in the
[REST Countries dashboard](https://restcountries.com/dashboard):

- `http://localhost:8081` (Expo web dev server default)
- `https://draftbittestapp-web.nasirajamil78.workers.dev` (deployed URL)

Native (iOS / Android) requests are unaffected — `Origin` headers are
only sent by browsers.

## App structure

```
.
├── app/                          ← routes (file = screen)
│   ├── _layout.tsx               Stack navigator wrapped in <ErrorBoundary>
│   ├── index.tsx                 Screen 1: Map view with capital pins
│   └── location/[id].tsx         Screen 2: Detail view for a country
├── src/
│   ├── api/
│   │   ├── restcountries.ts      REST Countries v5 client + normalize
│   │   ├── locations.ts          App-level data service (orchestration)
│   │   └── cache.ts              In-memory cache: instant Map → Detail nav
│   ├── components/
│   │   ├── Map/                  Cross-platform map abstraction
│   │   │   ├── types.ts          Shared MapView / Marker types
│   │   │   ├── index.tsx         Native impl (wraps react-native-maps)
│   │   │   └── index.web.tsx     Web impl (wraps react-leaflet)
│   │   ├── ErrorBoundary.tsx     Catches render errors anywhere below
│   │   ├── ErrorState.tsx        Reusable error + retry UI
│   │   ├── LoadingState.tsx      Reusable loading UI
│   │   ├── MetaPill.tsx          Detail screen pill
│   │   └── DetailSection.tsx     Detail screen title + body section
│   ├── constants/map.ts          Map zoom levels, world region, edge padding
│   ├── hooks/useLocations.ts     Data hooks (discriminated union, AbortController)
│   ├── theme/index.ts            Colors, spacing, radii, typography tokens
│   ├── types/location.ts         Domain types (Location, LocationDetails)
│   └── utils/format.ts           Population + currency formatters
├── app.json                      Expo config (scheme, plugins, typed routes, web)
├── wrangler.jsonc                Cloudflare deploy config (Workers Static Assets)
├── tsconfig.json                 strict TS + `@/*` path alias for `src/`
├── eslint.config.js              Flat ESLint config (eslint-config-expo + Prettier)
├── .prettierrc / .editorconfig   Formatting + cross-editor consistency
├── .env.example                  Documented env var template
└── package.json
```

## API & data layer

1. **Source client** — `src/api/restcountries.ts` is the only place that
   knows about the REST Countries v5 contract. Handles bearer auth,
   pagination (`limit`/`offset`), the `{ data: { objects } }` envelope,
   and normalizes raw JSON into the `Location` shape. Throws a typed
   `RestCountriesApiError` on HTTP failures.
2. **Service** — `src/api/locations.ts` orchestrates which source(s) to
   call and aggregates the results. Swapping the data source (REST →
   GraphQL → internal CMS) only requires changes here.
3. **Hooks** — `src/hooks/useLocations.ts` adapts the service to React
   with a `status: 'loading' | 'success' | 'error'` discriminated union
   and `AbortController`-based cancellation so screen unmounts don't
   leak in-flight requests.

## Configuration choices

- **Cross-platform map** — `.web.tsx` / `.tsx` extension resolution lets
  Metro pick `react-leaflet` on web and `react-native-maps` on native
  without any runtime branching in the screens. Both expose the same
  `MapView` / `Marker` / `MapHandle` API.
- **TypeScript strict + `@/*` alias.** `src/...` is reachable as `@/...`
  from anywhere in the app.
- **Typed routes (`experiments.typedRoutes: true`).** Route paths in
  `router.push(...)` are statically type-checked against the actual
  `app/` directory.
- **`web.output: "single"`** — produces a single-page-application bundle;
  client-side routing handles `/location/[id]` (works alongside
  Cloudflare's `not_found_handling: "single-page-application"`).
- **Deep-link `scheme: "draftbittestapp"`** — every route (including
  `/location/JPN`) is automatically a universal link on native.

## Quality gates

```sh
npm run typecheck                    # strict tsc --noEmit
npm run lint                         # eslint-config-expo + Prettier
npx expo-doctor                      # SDK health checks
npm run build:web                    # full web bundle, fails on any module error
```
