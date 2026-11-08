import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { buildRobloxScript, TRADE_ENDPOINT } from "@/lib/roblox-script";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connect Roblox — Trade Radar" },
      { name: "description", content: "Copy the Pet Simulator 99 trade logger script that sends your trades to Trade Radar." },
      { property: "og:title", content: "Connect Roblox — Trade Radar" },
      { property: "og:description", content: "Set up the PS99 trade logger script in a couple of minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConnectPage,
});

const steps = [
  {
    title: "Publish the site",
    body: "The script talks to the published version of this site, so publish it once from the top-right of the editor.",
  },
  {
    title: "Copy the script",
    body: "Use the button below. The site address is already filled in.",
  },
  {
    title: "Paste your trade secret",
    body: 'Replace PASTE_YOUR_TRADE_SECRET_HERE with the same secret you saved as TRADE_SECRET. Keep it private — anyone with it can post fake trades.',
  },
  {
    title: "Run it and trade",
    body: "Run the script in Pet Simulator 99, start a trade, and open the Live trade page.",
  },
];

function ConnectPage() {
  const script = buildRobloxScript();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success("Script copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
      <section className="pb-8 pt-8 sm:pt-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Roblox setup</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-5xl">Connect your trades</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          The logger reads the other player's pets from the trade window and sends them here, where each one is
          matched to its Cosmic Values price.
        </p>
      </section>

      <ol className="grid gap-3 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-2xl border border-border/70 bg-card p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <h2 className="font-sans text-sm font-bold tracking-normal">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border border-border/70 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Sends trades to</p>
            <p className="truncate font-mono text-xs text-foreground">{TRADE_ENDPOINT}</p>
          </div>
          <Button onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy script"}
          </Button>
        </div>
        <pre className="max-h-[480px] overflow-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
          <code>{script}</code>
        </pre>
      </div>
    </div>
  );
}
