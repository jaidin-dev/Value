// Shared name matching + price helpers. Used by the trade endpoint, the scraper and the UI.

const VARIANT_WORDS = new Set(["shiny", "golden", "rainbow"]);

/** Lowercase, drop symbols, squash spaces: "Huge Mrs. Claws" -> "huge mrs claws" */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/** Order-proof key: "Golden Shiny Huge Cat" and "Shiny Golden Huge Cat" give the same key. */
export function looseKey(name: string): string {
  const words = normalizeName(name).split(" ").filter(Boolean);
  const variants = words.filter((w) => VARIANT_WORDS.has(w)).sort();
  const rest = words.filter((w) => !VARIANT_WORDS.has(w));
  return [...variants, ...rest].join(" ");
}

const MULTIPLIERS: Record<string, number> = {
  "": 1,
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000,
  t: 1_000_000_000_000,
};

/** "11.5B" -> 11_500_000_000, "105ME" -> 105_000_000, "SOON" -> 0 */
export function parsePrice(text: string | null | undefined): number {
  if (!text) return 0;
  const match = /^\s*([\d.]+)\s*([kmbt]?)/i.exec(text.replace(/,/g, ""));
  if (!match?.[1]) return 0;
  const num = Number.parseFloat(match[1]);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * (MULTIPLIERS[(match[2] ?? "").toLowerCase()] ?? 1));
}

/** 11_500_000_000 -> "11.5B" */
export function formatValue(num: number): string {
  const units: [number, string][] = [
    [1_000_000_000_000, "T"],
    [1_000_000_000, "B"],
    [1_000_000, "M"],
    [1_000, "K"],
  ];
  for (const [size, suffix] of units) {
    if (num >= size) {
      return (num / size).toFixed(2).replace(/\.?0+$/, "") + suffix;
    }
  }
  return String(Math.round(num));
}

export type Variant = "Normal" | "Golden" | "Rainbow" | "Shiny" | "Shiny Golden" | "Shiny Rainbow";

/** Works out the variant from a full name like "Shiny Rainbow Huge Cat". */
export function variantFromName(name: string): Variant {
  const words = normalizeName(name).split(" ");
  const shiny = words.includes("shiny");
  const golden = words.includes("golden");
  const rainbow = words.includes("rainbow");
  if (shiny && golden) return "Shiny Golden";
  if (shiny && rainbow) return "Shiny Rainbow";
  if (shiny) return "Shiny";
  if (golden) return "Golden";
  if (rainbow) return "Rainbow";
  return "Normal";
}
