const UPSTREAM_BASE = 'https://api.restcountries.com/countries/v5';
const PAGE_SIZE = 100;

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

const EDGE_CACHE_HEADERS: Record<string, string> = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
};

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

interface Env {
  RESTCOUNTRIES_KEY: string;
}

interface RawCountry {
  names?: { common?: string; official?: string };
  codes?: { alpha_3?: string };
  capitals?: unknown[];
  region?: string;
  subregion?: string;
  population?: number;
  languages?: unknown[];
  currencies?: unknown[];
  flag?: { url_png?: string; description?: string };
  timezones?: string[];
}

interface UpstreamEnvelope<T> {
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
}

class UpstreamError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function errorJson(status: number, message: string): Response {
  return json({ error: { message } }, status);
}

async function callUpstream<T>(path: string, env: Env): Promise<UpstreamEnvelope<T>> {
  const response = await fetch(`${UPSTREAM_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${env.RESTCOUNTRIES_KEY}`,
    },
  });

  let payload: UpstreamEnvelope<T>;
  try {
    payload = (await response.json()) as UpstreamEnvelope<T>;
  } catch {
    throw new UpstreamError(502, `Invalid JSON from upstream (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const upstreamMessage =
      payload.errors?.[0]?.message ?? `Upstream HTTP ${response.status}`;
    // 4xx forwarded as-is; 5xx collapsed to 502 to avoid leaking upstream noise.
    const status = response.status >= 500 ? 502 : response.status;
    throw new UpstreamError(status, upstreamMessage);
  }

  return payload;
}

async function listAllCountries(env: Env): Promise<RawCountry[]> {
  const fields = encodeURIComponent(RESPONSE_FIELDS);
  const firstPath = `?response_fields=${fields}&limit=${PAGE_SIZE}&offset=0`;
  const first = await callUpstream<RawCountry>(firstPath, env);

  const total = first.data?.meta?.total ?? first.data?.objects?.length ?? 0;
  const pages: RawCountry[][] = [first.data?.objects ?? []];

  const offsets: number[] = [];
  for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) {
    offsets.push(offset);
  }

  const remaining = await Promise.all(
    offsets.map(async (offset) => {
      const path = `?response_fields=${fields}&limit=${PAGE_SIZE}&offset=${offset}`;
      const page = await callUpstream<RawCountry>(path, env);
      return page.data?.objects ?? [];
    }),
  );
  pages.push(...remaining);

  return pages.flat();
}

async function getCountryByAlpha3(alpha3: string, env: Env): Promise<RawCountry | null> {
  const fields = encodeURIComponent(RESPONSE_FIELDS);
  const path = `/codes.alpha_3/${encodeURIComponent(alpha3)}?response_fields=${fields}`;
  const result = await callUpstream<RawCountry>(path, env);
  return result.data?.objects?.[0] ?? null;
}

// workers.dev URLs don't auto-cache; explicit cache API usage required.
async function withEdgeCache(
  request: Request,
  ctx: ExecutionContext,
  build: () => Promise<Response>,
): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set('X-Cache', 'HIT');
    for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
    return new Response(cached.body, { status: cached.status, headers });
  }

  const response = await build();
  if (response.ok) {
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }
  return response;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
      return errorJson(405, 'Method not allowed');
    }

    if (!env.RESTCOUNTRIES_KEY) {
      return errorJson(500, 'Server misconfigured: RESTCOUNTRIES_KEY secret is missing');
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (path === '/') {
        return json({
          name: 'draftbittestapp-api',
          description: 'REST Countries v5 proxy for the DraftbitTestApp client.',
          endpoints: ['/countries', '/country/:alpha3'],
        });
      }

      if (path === '/countries') {
        return await withEdgeCache(request, ctx, async () => {
          const objects = await listAllCountries(env);
          return json({ objects }, 200, EDGE_CACHE_HEADERS);
        });
      }

      const match = path.match(/^\/country\/([A-Za-z]{3})$/);
      if (match) {
        const alpha3 = match[1].toUpperCase();
        return await withEdgeCache(request, ctx, async () => {
          const object = await getCountryByAlpha3(alpha3, env);
          if (!object) return errorJson(404, 'Country not found');
          return json({ object }, 200, EDGE_CACHE_HEADERS);
        });
      }

      return errorJson(404, 'Not found');
    } catch (err) {
      if (err instanceof UpstreamError) {
        return errorJson(err.status, err.message);
      }
      const message = err instanceof Error ? err.message : 'Internal error';
      return errorJson(500, message);
    }
  },
} satisfies ExportedHandler<Env>;
