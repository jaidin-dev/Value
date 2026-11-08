import { createFileRoute } from "@tanstack/react-router";
import { createPublicDb } from "@/lib/public-db";
import { formatValue } from "@/lib/pet-names";
import { apiError, apiJson, corsPreflight } from "@/lib/api-helpers";

// GET /api/public/v1/live — the trade currently shown on the Live trade page
export const Route = createFileRoute("/api/public/v1/live")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async () => {
        const { data, error } = await createPublicDb().from("live_trade").select("*").eq("id", 1).maybeSingle();
        if (error) return apiError("Could not load the live trade", 500);
        const total = Number(data?.total_value ?? 0);
        return apiJson({
          player: data?.player || null,
          items: data?.items ?? [],
          total,
          totalText: formatValue(total),
          unmatched: data?.unmatched ?? [],
          updatedAt: data?.updated_at ?? null,
        });
      },
    },
  },
});
