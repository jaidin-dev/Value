import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createPublicDb } from "@/lib/public-db";
import { formatValue, looseKey, normalizeName } from "@/lib/pet-names";
import { priceTrade, type IncomingItem, type PriceRow } from "@/lib/trade-match";
import { apiError, apiJson, corsPreflight } from "@/lib/api-helpers";

const itemsSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1).max(120),
      amount: z.coerce.number().int().min(1).max(1_000_000).optional(),
    }),
  )
  .min(1)
  .max(200);

async function price(items: IncomingItem[]) {
  const db = createPublicDb();
  const cols = "name, match_key, loose_key, value, price_text, image_url";
  const [a, b] = await Promise.all([
    db.from("pet_values").select(cols).in("match_key", [...new Set(items.map((i) => normalizeName(i.name)))]),
    db.from("pet_values").select(cols).in("loose_key", [...new Set(items.map((i) => looseKey(i.name)))]),
  ]);
  if (a.error || b.error) return apiError("Could not load values", 500);
  const { lines, total, unmatched } = priceTrade(items, [...(a.data ?? []), ...(b.data ?? [])] as PriceRow[]);
  return apiJson({
    total,
    totalText: formatValue(total),
    unmatched,
    items: lines.map((l) => ({
      name: l.name,
      matchedName: l.matchedName,
      amount: l.amount,
      unitValue: l.unitValue,
      value: l.value,
      valueText: l.valueText,
      image: l.image,
    })),
  });
}

// GET /api/public/v1/price?pets=Huge Cat,Shiny Huge Cat   or   POST { items: [{ name, amount }] }
export const Route = createFileRoute("/api/public/v1/price")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async ({ request }) => {
        const pets = new URL(request.url).searchParams.get("pets") ?? "";
        const parsed = itemsSchema.safeParse(
          pets
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean)
            .map((name) => ({ name })),
        );
        if (!parsed.success) return apiError("Add ?pets= with 1–200 comma-separated pet names", 400);
        return price(parsed.data);
      },
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiError("Body must be JSON", 400);
        }
        const parsed = z.object({ items: itemsSchema }).safeParse(body);
        if (!parsed.success) return apiError('Send { "items": [{ "name": "Huge Cat", "amount": 1 }] }', 400);
        return price(parsed.data.items);
      },
    },
  },
});
