import { createFileRoute } from "@tanstack/react-router";
import { createPublicDb } from "@/lib/public-db";
import { PET_COLUMNS } from "@/lib/values-query";
import { looseKey, normalizeName } from "@/lib/pet-names";
import { apiError, apiJson, corsPreflight, toApiPet } from "@/lib/api-helpers";

// GET /api/public/v1/values/Shiny%20Rainbow%20Huge%20Cat — look up one pet
export const Route = createFileRoute("/api/public/v1/values/$name")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async ({ params }) => {
        const name = decodeURIComponent(params.name ?? "").slice(0, 120);
        if (!name.trim()) return apiError("Pet name is required", 400);

        const db = createPublicDb();
        const exact = await db.from("pet_values").select(PET_COLUMNS).eq("match_key", normalizeName(name)).limit(1);
        if (exact.error) return apiError("Could not load values", 500);
        let row = exact.data?.[0];
        if (!row) {
          const loose = await db.from("pet_values").select(PET_COLUMNS).eq("loose_key", looseKey(name)).limit(1);
          if (loose.error) return apiError("Could not load values", 500);
          row = loose.data?.[0];
        }
        if (!row) return apiError(`No pet found named "${name}"`, 404);
        return apiJson({ pet: toApiPet(row) }, 200, 60);
      },
    },
  },
});
