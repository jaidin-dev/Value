import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createPublicDb } from "@/lib/public-db";
import { queryPetValues } from "@/lib/values-query";
import { apiError, apiJson, corsPreflight, toApiPet } from "@/lib/api-helpers";

const paramsSchema = z.object({
  q: z.string().max(80).optional(),
  tier: z.enum(["all", "Huges", "Titanics", "Gargantuans", "other"]).optional(),
  variant: z.enum(["all", "Normal", "Golden", "Rainbow", "Shiny", "Shiny Golden", "Shiny Rainbow"]).optional(),
  sort: z.enum(["high", "low", "name"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).max(20000).default(0),
});

// GET /api/public/v1/values — search the value list
export const Route = createFileRoute("/api/public/v1/values/")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = paramsSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) {
          return apiError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), 400);
        }
        const { limit, offset, ...filter } = parsed.data;
        const { data, count, error } = await queryPetValues(createPublicDb(), filter, offset, limit);
        if (error) return apiError("Could not load values", 500);
        return apiJson({ total: count ?? 0, limit, offset, pets: (data ?? []).map(toApiPet) }, 200, 60);
      },
    },
  },
});
