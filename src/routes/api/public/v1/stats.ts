import { createFileRoute } from "@tanstack/react-router";
import { createPublicDb } from "@/lib/public-db";
import { apiError, apiJson, corsPreflight } from "@/lib/api-helpers";

// GET /api/public/v1/stats — how many pets are tracked and when values last changed
export const Route = createFileRoute("/api/public/v1/stats")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async () => {
        const db = createPublicDb();
        const [countRes, latestRes] = await Promise.all([
          db.from("pet_values").select("*", { count: "exact", head: true }),
          db.from("pet_values").select("updated_at").order("updated_at", { ascending: false }).limit(1),
        ]);
        if (countRes.error || latestRes.error) return apiError("Could not load stats", 500);
        return apiJson(
          { totalPets: countRes.count ?? 0, lastUpdated: latestRes.data?.[0]?.updated_at ?? null, source: "Cosmic Values" },
          200,
          60,
        );
      },
    },
  },
});
