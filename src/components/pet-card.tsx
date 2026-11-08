import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { PetRow } from "@/lib/values.functions";
import { cn } from "@/lib/utils";
import { PetImage } from "./pet-image";
import { VariantBadge } from "./variant-badge";

function Delta({ delta }: { delta: string | null }) {
  if (!delta || delta === "=") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="size-3" />
      </span>
    );
  }
  const up = delta.includes("▲");
  const amount = delta.replace(/[▲▼]/g, "").trim();
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold", up ? "text-up" : "text-down")}>
      <Icon className="size-3.5" />
      {amount}
    </span>
  );
}

export function PetCard({ pet }: { pet: PetRow }) {
  const hasValue = pet.value > 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50">
      <div className="relative aspect-square bg-card-art p-4">
        <PetImage src={pet.image_url} alt={pet.name} className="size-full transition-transform group-hover:scale-105" />
        <VariantBadge variant={pet.variant} className="absolute left-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-2 border-t border-border/60 p-3">
        <h3 className="line-clamp-2 min-h-[2.5em] font-sans text-sm font-bold leading-tight tracking-normal">
          {pet.name}
        </h3>
        <div className="flex items-end justify-between gap-2">
          <span
            className={cn(
              "font-display text-lg font-bold leading-none",
              hasValue ? "text-primary" : "text-muted-foreground",
            )}
          >
            {pet.price_text || "—"}
          </span>
          <Delta delta={pet.delta} />
        </div>
        <dl className="mt-auto grid grid-cols-3 gap-1 text-[11px]">
          <div className="rounded-md bg-surface px-1.5 py-1">
            <dt className="text-muted-foreground">Demand</dt>
            <dd className="font-semibold">{pet.demand ?? "—"}</dd>
          </div>
          <div className="rounded-md bg-surface px-1.5 py-1">
            <dt className="text-muted-foreground">Exist</dt>
            <dd className="truncate font-semibold">{pet.exist_count ?? "—"}</dd>
          </div>
          <div className="rounded-md bg-surface px-1.5 py-1">
            <dt className="text-muted-foreground">RAP</dt>
            <dd className="truncate font-semibold">{pet.rap ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
