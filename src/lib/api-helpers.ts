// Helpers for the public read-only API (/api/public/v1/*).

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function apiJson(data: unknown, status = 200, cacheSeconds = 0) {
  return Response.json(data, {
    status,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : "no-store",
    },
  });
}

export function apiError(message: string, status: number) {
  return apiJson({ error: message }, status);
}

export const corsPreflight = () => new Response(null, { status: 204, headers: CORS_HEADERS });

type PetDbRow = {
  name: string;
  variant: string;
  category: string | null;
  price_text: string;
  value: number;
  delta: string | null;
  demand: string | null;
  exist_count: string | null;
  rap: string | null;
  last_change: string | null;
  image_url: string | null;
  updated_at: string;
};

/** Public shape of a pet in API responses. */
export function toApiPet(row: PetDbRow) {
  return {
    name: row.name,
    variant: row.variant,
    category: row.category,
    value: row.value,
    valueText: row.price_text,
    change: row.delta,
    demand: row.demand,
    exist: row.exist_count,
    rap: row.rap,
    lastChanged: row.last_change,
    image: row.image_url,
    updatedAt: row.updated_at,
  };
}
