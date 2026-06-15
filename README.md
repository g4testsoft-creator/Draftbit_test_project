# DraftbitTestApp — Map MVP

A cross-platform (iOS + Android) Expo SDK 54 app that loads the world's
countries from the [REST Countries v5 API][rc-docs], pins each country's
primary capital city on the map, and lets the user drill into a detail
screen with rich country-level metadata.

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


## Quality gates

All four commands are green on `main`:

```sh
npm run typecheck                    # strict tsc --noEmit
npm run lint                         # eslint-config-expo + Prettier
npx expo-doctor                      # 18/18 checks passing
npx expo export --platform ios       # bundles cleanly
```
