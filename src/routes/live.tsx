import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Radio } from "lucide-react";

import { getLiveTrade } from "@/lib/values.functions";
import { formatValue } from "@/lib/pet-names";
import { PetImage } from "@/components/pet-image";
import { VariantBadge } from "@/components/variant-badge";
import { variantFromName } from "@/lib/pet-names";
import { cn } from "@/lib/utils";

const liveQuery = queryOptions({
  queryKey: ["live-trade"],
  queryFn: () => getLiveTrade(),
  refetchInterval: 1500,
});

export const Route = createFileRoute("/live")({
  loader: ({ context }) => context.queryClient.ensureQueryData(liveQuery),
  head: () => ({
    meta: [
      { title: "Live Trade Feed — Trade Radar" },
      { name: "description", content: "Watch the pets in your current Pet Simulator 99 trade and their total value, live." },
      { property: "og:title", content: "Live Trade Feed — Trade Radar" },
      { property: "og:description", content: "Real-time value of the pets in the current PS99 trade window." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LivePage,
});

function useSecondsAgo(iso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!iso) return null;
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
}

function agoText(s: number | null) {
  if (s === null) return "never";
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function LivePage() {
  const { data } = useSuspenseQuery(liveQuery);
  const secondsAgo = useSecondsAgo(data.updatedAt);
  const active = data.items.length > 0;
  const fresh = secondsAgo !== null && secondsAgo < 60;
  const pieces = data.items.reduce((n, i) => n + i.amount, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-40 sm:px-6">
      <section className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-8 sm:pt-12">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <span className={cn("size-2 rounded-full", fresh ? "animate-pulse-dot bg-primary" : "bg-muted-foreground")} />
            Live trade
          </p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">
            {data.player ? (
              <>
                Trading with <span className="text-primary">{data.player}</span>
              </>
            ) : (
              "Waiting for a trade…"
            )}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last update {agoText(secondsAgo)}</p>
        </div>
      </section>

      {data.unmatched.length > 0 && (
        <div className="mb-5 flex gap-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold" />
          <p>
            <span className="font-bold text-gold">No price found for:</span>{" "}
            <span className="text-foreground/90">{data.unmatched.join(", ")}</span>
          </p>
        </div>
      )}

      {!active ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-surface/60 px-6 py-20 text-center">
          <Radio className="size-10 text-primary" />
          <p className="mt-4 font-display text-xl font-bold">Trade window is empty</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Start a trade in Pet Simulator 99 with the logger running and the pets show up here instantly.
          </p>
          <Link
            to="/connect"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            Set up the Roblox script <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          {data.items.map((item, i) => (
            <article
              key={`${item.name}-${i}`}
              className="animate-rise-in overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="relative aspect-square bg-card-art p-4">
                <PetImage src={item.image} alt={item.name} className="size-full" />
                <VariantBadge variant={variantFromName(item.name)} className="absolute left-2 top-2" />
                {item.amount > 1 && (
                  <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 font-display text-xs font-bold">
                    x{item.amount}
                  </span>
                )}
              </div>
              <div className="border-t border-border/60 p-3">
                <h3 className="line-clamp-2 min-h-[2.5em] font-sans text-sm font-bold leading-tight tracking-normal">
                  {item.name}
                </h3>
                <p
                  className={cn(
                    "mt-1 font-display text-lg font-bold",
                    item.value > 0 ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.valueText}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Total window value</p>
            <p className="text-xs text-muted-foreground">
              {pieces} {pieces === 1 ? "pet" : "pets"}
            </p>
          </div>
          <p className="font-display text-3xl font-extrabold text-primary sm:text-5xl">
            {formatValue(data.totalValue)}
          </p>
        </div>
      </div>
    </div>
  );
}
