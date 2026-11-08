import type { createPublicDb } from "./public-db";

export const PET_COLUMNS =
  "name, variant, category, price_text, value, delta, demand, exist_count, rap, last_change, image_url, updated_at";

export type ValuesFilter = {
  q?: string | undefined;
  tier?: string | undefined;
  variant?: string | undefined;
  sort?: string | undefined;
};

/** Shared search used by the values page and the public API. */
export function queryPetValues(
  db: ReturnType<typeof createPublicDb>,
  filter: ValuesFilter,
  offset: number,
  limit: number,
) {
  let query = db.from("pet_values").select(PET_COLUMNS, { count: "exact" });

  const q = filter.q?.trim();
  if (q) {
    for (const word of q.split(/\s+/).slice(0, 6)) {
      const clean = word.replace(/[%_,()]/g, "");
      if (clean) query = query.ilike("name", `%${clean}%`);
    }
  }
  if (filter.tier && filter.tier !== "all") {
    query =
      filter.tier === "other"
        ? query.not("category", "in", "(Huges,Titanics,Gargantuans)")
        : query.eq("category", filter.tier);
  }
  if (filter.variant && filter.variant !== "all") query = query.eq("variant", filter.variant);

  if (filter.sort === "name") query = query.order("name", { ascending: true });
  else if (filter.sort === "low") query = query.gt("value", 0).order("value", { ascending: true });
  else query = query.order("value", { ascending: false }).order("name");

  return query.range(offset, offset + limit - 1);
}
