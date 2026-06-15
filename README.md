# DraftbitTestApp — Map MVP

A cross-platform (iOS + Android) Expo SDK 54 app that pins the world's
capital cities on a map and lets you drill into a detail screen with
country-level metadata.

Data flows through a small Cloudflare Worker (`worker/`) that proxies
the [REST Countries v5 API][rc-docs] — the Worker holds the API key as
a server-side secret, paginates upstream, and caches at Cloudflare's
edge, so the mobile bundle ships nothing sensitive.

[rc-docs]: https://restcountries.com/docs

Built with:

- **Expo SDK 54** (`~54.0.34`) with the New Architecture enabled
- **Expo Router 6** (file-based routing, typed routes, deep linking)
- **`react-native-maps`** (Apple Maps on iOS, Google Maps on Android)
- **TypeScript** in strict mode (app + Worker)
- **Cloudflare Workers** as the API edge proxy in front of REST Countries

## Getting started

Requirements: Node 20.19+, Xcode 16.1+ (for iOS), Android Studio with API
36 (for Android), and a free Cloudflare account for the Worker. See the
[Expo SDK 54 requirements](https://docs.expo.dev/versions/v54.0.0/) for
the full list.

```sh
# 1. Install deps for the app
npm install

# 2. Deploy the Cloudflare Worker (see worker/README.md for details).
#    This prints a https://<name>.<account>.workers.dev URL — copy it.
cd worker && npm install && npx wrangler login \
  && npx wrangler secret put RESTCOUNTRIES_KEY \
  && npm run deploy && cd ..

# 3. Wire the app to the Worker
cp .env.example .env
# then edit .env and set EXPO_PUBLIC_API_BASE_URL to the URL from step 2

# 4. Run
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
(free tier covers 500 requests/mo). The Worker's edge cache means a
single deployment can serve many users without burning through the
quota.

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
│   │   ├── restcountries.ts      Client for the Worker (normalize-only, no auth)
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
├── worker/                       ← Cloudflare Worker (REST Countries proxy)
│   ├── src/index.ts              Auth + pagination + edge cache + CORS
│   ├── wrangler.jsonc            Cloudflare config (workers.dev URL on)
│   ├── tsconfig.json             Worker-only TS config (@cloudflare/workers-types)
│   ├── package.json              wrangler + workers-types deps
│   └── README.md                 Dev / deploy / ops runbook
├── app.json                      Expo config (scheme, plugins, typed routes)
├── tsconfig.json                 strict TS + `@/*` path alias for `src/`
├── eslint.config.js              Flat ESLint config (eslint-config-expo + Prettier)
├── .prettierrc / .editorconfig   Formatting + cross-editor consistency
├── .env.example                  Documented env var template
└── package.json
```

## API & data layer

The data layer is intentionally split so a real client project can grow
into it:

1. **Edge proxy** — `worker/src/index.ts` is a Cloudflare Worker that
   sits in front of REST Countries v5. It handles bearer auth (key
   stored as a Worker secret, never bundled with the app), fans out
   the paginated upstream calls into one response, and caches at the
   edge with `s-maxage=86400 stale-while-revalidate=604800`.
2. **Source client** — `src/api/restcountries.ts` is the only file in
   the app that knows about the Worker's HTTP contract. It just fetches
   `/countries` or `/country/:alpha3` and runs `normalizeCountry()` to
   convert the raw payload into the app's `Location` shape. Throws a
   typed `RestCountriesApiError` on HTTP failures.
3. **Service** — `src/api/locations.ts` orchestrates which source(s) to
   call and aggregates the results. Swapping the data source (Worker →
   GraphQL → internal CMS) only requires changes here.
4. **Hooks** — `src/hooks/useLocations.ts` adapts the service to React
   with a `status: 'loading' | 'success' | 'error'` discriminated union
   and `AbortController`-based cancellation so screen unmounts don't
   leak in-flight requests.

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
