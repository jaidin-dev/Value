import { formatValue, looseKey, normalizeName } from "./pet-names";

export type PriceRow = {
  name: string;
  match_key: string;
  loose_key: string;
  value: number;
  price_text: string;
  image_url: string | null;
};

export type IncomingItem = { name: string; amount?: number | undefined };

export type TradeLine = {
  name: string;
  matchedName: string | null;
  amount: number;
  unitValue: number;
  value: number;
  valueText: string;
  image: string | null;
};

/** Matches the pets from the Roblox trade window to the price list and adds them up. */
export function priceTrade(items: IncomingItem[], rows: PriceRow[]) {
  const exact = new Map<string, PriceRow>();
  const loose = new Map<string, PriceRow>();
  for (const row of rows) {
    if (!exact.has(row.match_key)) exact.set(row.match_key, row);
    if (!loose.has(row.loose_key)) loose.set(row.loose_key, row);
  }

  let total = 0;
  const unmatched: string[] = [];
  const lines: TradeLine[] = items.map((item) => {
    const amount = Math.max(1, Math.floor(item.amount ?? 1));
    const row = exact.get(normalizeName(item.name)) ?? loose.get(looseKey(item.name)) ?? null;
    if (!row) unmatched.push(item.name);
    const unitValue = row?.value ?? 0;
    const value = unitValue * amount;
    total += value;
    return {
      name: item.name,
      matchedName: row?.name ?? null,
      amount,
      unitValue,
      value,
      valueText: !row ? "?" : value > 0 ? formatValue(value) : row.price_text || "?",
      image: row?.image_url ?? null,
    };
  });

  return { lines, total, unmatched };
}
