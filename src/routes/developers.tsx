import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { PUBLISHED_SITE_URL } from "@/lib/roblox-script";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "Trade Radar API — Free PS99 values API" },
      {
        name: "description",
        content: "Free JSON API for Pet Simulator 99 values: search pets, look up one pet, price a whole trade, and read the live trade.",
      },
      { property: "og:title", content: "Trade Radar API — Free PS99 values API" },
      { property: "og:description", content: "Search PS99 values, price trades and read the live trade as JSON." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DevelopersPage,
});

const BASE = `${PUBLISHED_SITE_URL}/api/public/v1`;

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  params?: [string, string][];
  example: string;
  body?: string;
  response: string;
};

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/values",
    title: "Search values",
    description: "Lists pets, highest value first. Combine any filters.",
    params: [
      ["q", "Words in the pet name, e.g. shiny huge cat"],
      ["tier", "all · Huges · Titanics · Gargantuans · other"],
      ["variant", "Normal · Golden · Rainbow · Shiny · Shiny Golden · Shiny Rainbow"],
      ["sort", "high (default) · low · name"],
      ["limit", "1–500, default 50"],
      ["offset", "Skip this many results (for paging)"],
    ],
    example: "/values?q=huge%20cat&variant=Rainbow&limit=2",
    response: `{
  "total": 182,
  "limit": 2,
  "offset": 0,
  "pets": [
    {
      "name": "Rainbow Huge Cat",
      "variant": "Rainbow",
      "category": "Huges",
      "value": 37500000000,
      "valueText": "37.5B",
      "change": "▲ 2.5B",
      "demand": "6/10",
      "exist": "388",
      "rap": "36.33B",
      "lastChanged": "2d ago",
      "image": "https://…/RB%20Huge%20Cat.png",
      "updatedAt": "2026-11-08T13:15:00Z"
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/values/{name}",
    title: "Look up one pet",
    description: "Finds one pet by name. Capitals, dots and the order of Shiny/Golden/Rainbow don't matter.",
    example: "/values/Golden%20Shiny%20Huge%20Party%20Dog",
    response: `{
  "pet": {
    "name": "Shiny Golden Huge Party Dog",
    "value": 8000000000,
    "valueText": "8B",
    ...
  }
}`,
  },
  {
    method: "GET",
    path: "/price",
    title: "Price a list of pets",
    description: "Adds up a trade. Use ?pets= with comma-separated names, or POST a list with amounts.",
    params: [["pets", "Comma-separated pet names (up to 200)"]],
    example: "/price?pets=Huge%20Cat,Titanic%20Owl",
    response: `{
  "total": 16650000000,
  "totalText": "16.65B",
  "unmatched": [],
  "items": [
    { "name": "Huge Cat", "matchedName": "Huge Cat", "amount": 1,
      "unitValue": 12500000000, "value": 12500000000, "valueText": "12.5B", "image": "…" }
  ]
}`,
  },
  {
    method: "POST",
    path: "/price",
    title: "Price a trade with amounts",
    description: "Same as above, but lets you send how many of each pet.",
    example: "/price",
    body: `{ "items": [ { "name": "Huge Pumpkin Cat", "amount": 3 }, { "name": "Huge Cat" } ] }`,
    response: `{ "total": 14330000000, "totalText": "14.33B", "unmatched": [], "items": [ … ] }`,
  },
  {
    method: "GET",
    path: "/live",
    title: "Live trade",
    description: "The trade currently shown on the Live trade page.",
    example: "/live",
    response: `{
  "player": "SomePlayer",
  "items": [ { "name": "Huge Cat", "amount": 1, "value": 12500000000, "valueText": "12.5B", "image": "…" } ],
  "total": 12500000000,
  "totalText": "12.5B",
  "unmatched": [],
  "updatedAt": "2026-11-08T13:20:00Z"
}`,
  },
  {
    method: "GET",
    path: "/stats",
    title: "Stats",
    description: "How many pets are tracked and when values last changed.",
    example: "/stats",
    response: `{ "totalPets": 7411, "lastUpdated": "2026-11-08T13:15:00Z", "source": "Cosmic Values" }`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {done ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function luaExample() {
  return `local HttpService = game:GetService("HttpService")
local url = "${BASE}/values/" .. HttpService:UrlEncode("Shiny Huge Cat")
local res = request({ Url = url, Method = "GET" })
local data = HttpService:JSONDecode(res.Body)
print(data.pet.name, data.pet.valueText)`;
}

function DevelopersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
      <section className="pb-8 pt-8 sm:pt-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Developers</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">Trade Radar API</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Free JSON API for Pet Simulator 99 values. No key needed, works from browsers, bots and Roblox scripts.
        </p>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Base URL</span>
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{BASE}</code>
          <CopyButton text={BASE} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Values are numbers in gems (e.g. 12500000000 = 12.5B). Pets without a price show value 0 and valueText like
          "SOON" or "O/C".
        </p>
      </section>

      <div className="space-y-4">
        {endpoints.map((e) => (
          <section key={e.method + e.title} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3">
              <span
                className={
                  e.method === "GET"
                    ? "rounded-md bg-primary/15 px-2 py-0.5 font-mono text-xs font-bold text-primary"
                    : "rounded-md bg-gold/15 px-2 py-0.5 font-mono text-xs font-bold text-gold"
                }
              >
                {e.method}
              </span>
              <code className="font-mono text-sm font-semibold">{e.path}</code>
              <span className="ml-auto text-sm font-bold">{e.title}</span>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm text-muted-foreground">{e.description}</p>
              {e.params && (
                <dl className="grid gap-1.5 text-sm sm:grid-cols-[110px_1fr]">
                  {e.params.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="font-mono text-xs font-bold text-accent">{k}</dt>
                      <dd className="text-xs text-muted-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-xs">
                  {e.method} {BASE}
                  {e.example}
                </code>
                <CopyButton text={BASE + e.example} />
              </div>
              {e.body && (
                <pre className="overflow-auto rounded-lg bg-surface p-3 font-mono text-xs text-foreground">{e.body}</pre>
              )}
              <pre className="max-h-72 overflow-auto rounded-lg bg-background p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                {e.response}
              </pre>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 className="font-sans text-sm font-bold tracking-normal">Use it from a Roblox script</h2>
          <CopyButton text={luaExample()} />
        </div>
        <pre className="overflow-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">{luaExample()}</pre>
      </section>
    </div>
  );
}
