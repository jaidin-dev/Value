<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Pet name matching and price parsing live only in `src/lib/pet-names.ts` + `src/lib/trade-match.ts` (covered by `pet-names.test.ts`); the trade endpoint, scraper and UI all reuse them so matching never drifts.
- Values are scraped from the Cosmic Values list pages by `src/lib/cosmic-parser.ts`; a scheduled job (`/api/public/jobs/refresh-values`) refreshes a few pages per run and cycles through all pages, because one request must finish within a few seconds.
- The Roblox logger posts to `/api/public/trade` with the `TRADE_SECRET` in the Authorization header; only that route writes `live_trade`, so the secret check there is the only write gate.
- The Lua script shown to users is generated from `src/lib/roblox-script.ts`, pointing at the stable published URL, so preview hosts never end up in the script.
- Public pages read data through `createServerFn` with the publishable client (`src/lib/public-db.ts`); tables are read-only to visitors and written only by server routes with the admin client.
