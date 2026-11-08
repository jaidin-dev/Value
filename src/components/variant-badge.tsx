import { cva } from "class-variance-authority";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
  {
    variants: {
      tone: {
        normal: "bg-secondary text-muted-foreground",
        golden: "bg-gold text-gold-foreground",
        rainbow: "bg-rainbow text-primary-foreground",
        shiny: "bg-shiny/15 text-shiny ring-1 ring-shiny/40",
      },
    },
    defaultVariants: { tone: "normal" },
  },
);

export function VariantBadge({ variant, className }: { variant: string; className?: string }) {
  const shiny = variant.startsWith("Shiny");
  const base = variant.replace("Shiny", "").trim();
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {shiny && (
        <span className={badge({ tone: "shiny" })}>
          <Sparkles className="size-3" />
          Shiny
        </span>
      )}
      {base === "Golden" && <span className={badge({ tone: "golden" })}>Golden</span>}
      {base === "Rainbow" && <span className={badge({ tone: "rainbow" })}>Rainbow</span>}
      {!shiny && !base && <span className={badge({ tone: "normal" })}>Normal</span>}
      {!shiny && base === "Normal" && <span className={badge({ tone: "normal" })}>Normal</span>}
    </span>
  );
}
