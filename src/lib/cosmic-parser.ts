import { looseKey, normalizeName, parsePrice, variantFromName } from "./pet-names";

export type ScrapedPet = {
  name: string;
  match_key: string;
  loose_key: string;
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

export const VALUES_PAGE_URL = "https://petsimulatorvalues.com/values.php?category=all&page=";

function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block: string, re: RegExp): string | null {
  const m = re.exec(block);
  return m?.[1] ? decode(m[1]) : null;
}

/** Highest page number linked in the pagination (the site keeps answering past the end). */
export function parseLastPage(html: string): number | null {
  const pages = [...html.matchAll(/values\.php\?[^"']*?page=(\d+)/g)].map((m) => Number(m[1]));
  return pages.length ? Math.max(...pages) : null;
}

/** Reads every pet card from one Cosmic Values list page. */
export function parseValuesPage(html: string): ScrapedPet[] {
  const pets: ScrapedPet[] = [];
  const seen = new Set<string>();
  const blocks = html.split(/<a\s+class="pet[\s"]/).slice(1);

  for (const raw of blocks) {
    const block = raw.slice(0, 4000);
    const name = pick(block, /class="pet-name"[^>]*>([^<]+)</);
    if (!name || seen.has(name)) continue;
    seen.add(name);

    const priceText = pick(block, /class="value(?:\s[^"]*)?"[^>]*>([^<]+)</) ?? "";
    const category = pick(block, /[?&](?:amp;)?category=([A-Za-z]+)/);
    const img = pick(block, /<img[^>]+src="([^"]+)"/);
    const stats = [...block.matchAll(/<span>\s*(Exist|RAP)\s*<b>([^<]*)<\/b>/g)];

    pets.push({
      name,
      match_key: normalizeName(name),
      loose_key: looseKey(name),
      variant: variantFromName(name),
      category,
      price_text: priceText,
      value: parsePrice(priceText),
      delta: pick(block, /class="delta[^"]*"[^>]*>([^<]+)</),
      demand: pick(block, /class="demand[^"]*"[^>]*>([^<]+)</),
      exist_count: stats.find((s) => s[1] === "Exist")?.[2]?.trim() ?? null,
      rap: stats.find((s) => s[1] === "RAP")?.[2]?.trim() ?? null,
      last_change: pick(block, /class="ago"[^>]*>([^<]+)</),
      image_url: img
        ? img.startsWith("http")
          ? encodeURI(decodeURI(img))
          : `https://petsimulatorvalues.com/${img.replace(/^\//, "")}`
        : null,
    });
  }
  return pets;
}
