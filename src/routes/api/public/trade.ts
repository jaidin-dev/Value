import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { looseKey, normalizeName } from "@/lib/pet-names";
import { priceTrade, type PriceRow } from "@/lib/trade-match";

const bodySchema = z.object({
  player: z.string().trim().max(60).optional().default(""),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        amount: z.coerce.number().int().min(1).max(1_000_000).optional(),
        uid: z.string().max(100).optional(),
      }),
    )
    .max(200)
    .optional()
    .default([]),
});

async function secretMatches(provided: string, expected: string) {
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const digest = (v: string) => createHash("sha256").update(v, "utf8").digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

// Called by the Roblox trade logger every time the trade window changes.
export const Route = createFileRoute("/api/public/trade")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["TRADE_SECRET"];
        if (!expected) return Response.json({ error: "Trade secret not set up yet" }, { status: 500 });

        const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        if (!provided || !(await secretMatches(provided, expected))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Body must be JSON" }, { status: 400 });
        }
        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          return Response.json({ error: "Invalid trade data" }, { status: 400 });
        }
        const { player, items } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let rows: PriceRow[] = [];
        if (items.length) {
          const exactKeys = [...new Set(items.map((i) => normalizeName(i.name)))];
          const looseKeys = [...new Set(items.map((i) => looseKey(i.name)))];
          const cols = "name, match_key, loose_key, value, price_text, image_url";
          const [a, b] = await Promise.all([
            supabaseAdmin.from("pet_values").select(cols).in("match_key", exactKeys),
            supabaseAdmin.from("pet_values").select(cols).in("loose_key", looseKeys),
          ]);
          if (a.error || b.error) {
            return Response.json({ error: "Could not load prices" }, { status: 500 });
          }
          rows = [...(a.data ?? []), ...(b.data ?? [])] as PriceRow[];
        }

        const { lines, total, unmatched } = priceTrade(items, rows);

        const { error } = await supabaseAdmin.from("live_trade").upsert({
          id: 1,
          player,
          items: lines.map(({ unitValue: _u, ...rest }) => rest),
          total_value: total,
          unmatched,
          updated_at: new Date().toISOString(),
        });
        if (error) return Response.json({ error: "Could not save trade" }, { status: 500 });

        return Response.json({ success: true, total, unmatched });
      },
    },
  },
});
