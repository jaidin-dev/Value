import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { infiniteQueryOptions, queryOptions, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { getSiteStats, listPetValues, PAGE_SIZE, valuesSearchSchema, type ValuesSearch } from "@/lib/values.functions";
import { PetCard } from "@/components/pet-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const valuesQuery = (s: ValuesSearch) =>
  infiniteQueryOptions({
    queryKey: ["values", s.q ?? "", s.tier ?? "all", s.variant ?? "all", s.sort ?? "high"],
    queryFn: ({ pageParam }) => listPetValues({ data: { ...s, offset: pageParam } }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.offset + PAGE_SIZE < last.total ? last.offset + PAGE_SIZE : undefined),
  });

const statsQuery = queryOptions({ queryKey: ["stats"], queryFn: () => getSiteStats() });

export const Route = createFileRoute("/")({
  validateSearch: valuesSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureInfiniteQueryData(valuesQuery(deps)),
      context.queryClient.ensureQueryData(statsQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "PS99 Values — Every Huge, Titanic & Gargantuan | Trade Radar" },
      {
        name: "description",
        content: "Search 7,000+ Pet Simulator 99 values from Cosmic Values with demand, RAP and how many exist.",
      },
      { property: "og:title", content: "PS99 Values — Trade Radar" },
      {
        property: "og:description",
        content: "Search every Pet Simulator 99 Huge, Titanic and Gargantuan value, updated automatically.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ValuesPage,
});

const TIERS = [
  { id: "all", label: "All" },
  { id: "Huges", label: "Huge" },
  { id: "Titanics", label: "Titanic" },
  { id: "Gargantuans", label: "Gargantuan" },
  { id: "other", label: "Other" },
] as const;

const VARIANTS = ["all", "Normal", "Golden", "Rainbow", "Shiny", "Shiny Golden", "Shiny Rainbow"] as const;

const SORTS = [
  { id: "high", label: "Highest value" },
  { id: "low", label: "Lowest value" },
  { id: "name", label: "A → Z" },
] as const;

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ValuesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const { data: stats } = useSuspenseQuery(statsQuery);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(valuesQuery(search));

  const [text, setText] = useState(search.q ?? "");
  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== text.trim()) {
        navigate({ search: (prev) => ({ ...prev, q: text.trim() || undefined }), replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [text, search.q, navigate]);

  const setFilter = (patch: Partial<ValuesSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false });

  const pets = data.pages.flatMap((p) => p.rows);
  const total = data.pages[0]?.total ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <section className="pb-6 pt-8 sm:pt-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Pet Simulator 99</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">
          Every value, <span className="text-rainbow">always fresh.</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          {stats.totalPets.toLocaleString()} pets tracked from Cosmic Values
          {stats.updatedAt && <> · updated {formatDistanceToNow(new Date(stats.updatedAt), { addSuffix: true })}</>}
        </p>
      </section>

      <div className="sticky top-[57px] z-20 -mx-4 space-y-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search a pet… e.g. shiny huge cat"
            className="h-12 w-full rounded-xl border border-input bg-surface pl-10 pr-10 text-base font-medium outline-none transition-shadow placeholder:text-muted-foreground focus:shadow-glow"
          />
          {text && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setText("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {TIERS.map((t) => (
            <Chip
              key={t.id}
              active={(search.tier ?? "all") === t.id}
              onClick={() => setFilter({ tier: t.id === "all" ? undefined : t.id })}
            >
              {t.label}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-border" />
          {VARIANTS.map((v) => (
            <Chip
              key={v}
              active={(search.variant ?? "all") === v}
              onClick={() => setFilter({ variant: v === "all" ? undefined : v })}
            >
              {v === "all" ? "Any variant" : v}
            </Chip>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{total.toLocaleString()} results</span>
          <select
            value={search.sort ?? "high"}
            onChange={(e) => setFilter({ sort: e.target.value === "high" ? undefined : (e.target.value as ValuesSearch["sort"]) })}
            className="rounded-lg border border-input bg-surface px-2 py-1.5 text-xs font-semibold text-foreground outline-none"
            aria-label="Sort"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pets.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-lg font-bold">No pets found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a shorter name or clear the filters.</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {pets.map((pet) => (
            <PetCard key={pet.name} pet={pet} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button size="lg" variant="secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage && <Loader2 className="animate-spin" />}
            Load more pets
          </Button>
        </div>
      )}
    </div>
  );
}
