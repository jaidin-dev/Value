import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicDb } from "./public-db";
import { queryPetValues } from "./values-query";

export const PAGE_SIZE = 48;

export const valuesSearchSchema = z.object({
  q: z.string().max(80).optional().catch(undefined),
  tier: z.enum(["all", "Huges", "Titanics", "Gargantuans", "other"]).optional().catch(undefined),
  variant: z
    .enum(["all", "Normal", "Golden", "Rainbow", "Shiny", "Shiny Golden", "Shiny Rainbow"])
    .optional()
    .catch(undefined),
  sort: z.enum(["high", "low", "name"]).optional().catch(undefined),
});
export type ValuesSearch = z.infer<typeof valuesSearchSchema>;

export type PetRow = {
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
};

export const listPetValues = createServerFn({ method: "GET" })
  .inputValidator(valuesSearchSchema.extend({ offset: z.number().int().min(0).max(20000) }))
  .handler(async ({ data }) => {
    const { offset, ...filter } = data;
    const { data: rows, count, error } = await queryPetValues(createPublicDb(), filter, offset, PAGE_SIZE);
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as PetRow[], total: count ?? 0, offset: data.offset };
  });

export const getSiteStats = createServerFn({ method: "GET" }).handler(async () => {
  const db = createPublicDb();
  const [{ count }, { data: latest }] = await Promise.all([
    db.from("pet_values").select("*", { count: "exact", head: true }),
    db.from("pet_values").select("updated_at").order("updated_at", { ascending: false }).limit(1),
  ]);
  return { totalPets: count ?? 0, updatedAt: latest?.[0]?.updated_at ?? null };
});

export type LiveTradeItem = {
  name: string;
  matchedName: string | null;
  amount: number;
  value: number;
  valueText: string;
  image: string | null;
};

export const getLiveTrade = createServerFn({ method: "GET" }).handler(async () => {
  const db = createPublicDb();
  const { data, error } = await db.from("live_trade").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return {
    player: data?.player ?? "",
    items: ((data?.items as unknown) ?? []) as LiveTradeItem[],
    totalValue: Number(data?.total_value ?? 0),
    unmatched: ((data?.unmatched as unknown) ?? []) as string[],
    updatedAt: data?.updated_at ?? null,
  };
});
