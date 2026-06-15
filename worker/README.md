# draftbittestapp-api (Cloudflare Worker)

Edge proxy for the REST Countries v5 API. The mobile app calls this Worker
instead of REST Countries directly so the API key stays server-side.

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/`                  | Service descriptor (sanity check). |
| GET    | `/countries`         | Returns `{ objects: RawCountry[] }`. The Worker fans out and merges pages so the client gets the full dataset in a single response. |
| GET    | `/country/:alpha3`   | Returns `{ object: RawCountry }`. 404 if the ISO-3 code is unknown. |

Responses are cached at Cloudflare's edge with
`Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`.
The `X-Cache: HIT` / `MISS` header on the response tells you whether
the edge served it.

CORS is open (`Access-Control-Allow-Origin: *`) so a browser client can
hit the Worker too — useful for `curl` / smoke tests.

## Local development

```bash
cd worker
npm install

# One-time: stash your REST Countries API key in a local override file.
# `.dev.vars` is gitignored and is loaded automatically by `wrangler dev`.
echo 'RESTCOUNTRIES_KEY="rc_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"' > .dev.vars

npm run dev
# Worker is now at http://localhost:8787
curl http://localhost:8787/countries | jq '.objects | length'
```

## Deploy

```bash
cd worker
npm install

# 1) Auth — opens browser, requires a Cloudflare account.
npx wrangler login

# 2) Push the API key as a server-side secret (one-time).
npx wrangler secret put RESTCOUNTRIES_KEY
# Paste your `rc_live_…` key when prompted, press Enter.

# 3) Deploy.
npm run deploy
```

`wrangler deploy` prints the public URL, e.g.
`https://draftbittestapp-api.<account-subdomain>.workers.dev`.

Add that URL to the app's root `.env` as:

```
EXPO_PUBLIC_API_BASE_URL=https://draftbittestapp-api.<account-subdomain>.workers.dev
```

## Operations

- **Logs (tail)**: `npm run tail` streams structured logs from production.
- **Update key**: re-run `npm run secret:set`; secrets are versioned and the
  next request picks up the new value.
- **Invalidate cache**: cache entries expire automatically after a day. To
  force-purge sooner, either bump `s-maxage` in `src/index.ts` and redeploy
  or use the Cloudflare dashboard's cache purge.
- **Disable workers.dev URL**: set `workers_dev: false` in `wrangler.jsonc`
  if you wire up a custom domain — otherwise leave it on for the MVP.
