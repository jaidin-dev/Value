import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";

const links = [
  { to: "/", label: "Values", short: "Values" },
  { to: "/live", label: "Live trade", short: "Live" },
  { to: "/connect", label: "Connect Roblox", short: "Roblox" },
  { to: "/developers", label: "API", short: "API" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
            <Radar className="size-4" />
          </span>
          <span className="hidden font-display text-sm font-bold tracking-tight sm:inline">
            Trade Radar
          </span>
        </Link>
        <nav className="scrollbar-none ml-auto flex items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-secondary !text-foreground" }}
            >
              {l.to === "/live" && (
                <span className="mr-1.5 inline-block size-1.5 animate-pulse-dot rounded-full bg-primary align-middle" />
              )}
              <span className="sm:hidden">{l.short}</span>
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
