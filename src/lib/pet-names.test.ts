import { describe, expect, it } from "vitest";
import { formatValue, looseKey, normalizeName, parsePrice, variantFromName } from "./pet-names";
import { priceTrade, type PriceRow } from "./trade-match";

const row = (name: string, price: string, value: number): PriceRow => ({
  name,
  match_key: normalizeName(name),
  loose_key: looseKey(name),
  price_text: price,
  value,
  image_url: null,
});

const rows = [
  row("Huge Cat", "12.5B", 12_500_000_000),
  row("Shiny Golden Huge Party Dog", "8B", 8_000_000_000),
  row("Huge Mrs. Claws", "290M", 290_000_000),
  row("Huge Fiddlefern Cat", "23M", 23_000_000),
  row("Shiny Rainbow Huge Leprechaun Kitsune", "SOON", 0),
];

describe("prices", () => {
  it("reads B/M/K suffixes", () => {
    expect(parsePrice("11.5B")).toBe(11_500_000_000);
    expect(parsePrice("590M")).toBe(590_000_000);
    expect(parsePrice("1,250K")).toBe(1_250_000);
  });
  it("ignores stray letters after the price", () => {
    expect(parsePrice("105ME")).toBe(105_000_000);
  });
  it("treats SOON / O/C as no price", () => {
    expect(parsePrice("SOON")).toBe(0);
    expect(parsePrice("O/C")).toBe(0);
  });
  it("formats totals", () => {
    expect(formatValue(30_960_000_000)).toBe("30.96B");
    expect(formatValue(69_000_000)).toBe("69M");
  });
});

describe("name matching", () => {
  it("works out the variant", () => {
    expect(variantFromName("Shiny Rainbow Huge Cat")).toBe("Shiny Rainbow");
    expect(variantFromName("Golden Titanic Owl")).toBe("Golden");
  });

  it("matches regardless of variant word order and punctuation", () => {
    const { lines, unmatched } = priceTrade(
      [{ name: "Golden Shiny Huge Party Dog" }, { name: "huge mrs claws" }],
      rows,
    );
    expect(lines.map((l) => l.value)).toEqual([8_000_000_000, 290_000_000]);
    expect(unmatched).toEqual([]);
  });

  it("multiplies stacked pets by their amount", () => {
    const { lines, total } = priceTrade([{ name: "Huge Fiddlefern Cat", amount: 3 }], rows);
    expect(lines[0]?.value).toBe(69_000_000);
    expect(total).toBe(69_000_000);
  });

  it("does not give a plain pet the price of a different variant", () => {
    const { unmatched } = priceTrade([{ name: "Rainbow Huge Mrs. Claws" }], rows);
    expect(unmatched).toEqual(["Rainbow Huge Mrs. Claws"]);
  });

  it("adds up the whole trade and lists unknown pets", () => {
    const { total, unmatched, lines } = priceTrade(
      [{ name: "Huge Cat" }, { name: "Made Up Pet" }, { name: "Shiny Rainbow Huge Leprechaun Kitsune" }],
      rows,
    );
    expect(total).toBe(12_500_000_000);
    expect(unmatched).toEqual(["Made Up Pet"]);
    expect(lines[2]?.valueText).toBe("SOON");
  });
});
