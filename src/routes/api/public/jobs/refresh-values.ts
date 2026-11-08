import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { parseLastPage, parseValuesPage, VALUES_PAGE_URL, type ScrapedPet } from "@/lib/cosmic-parser";

const DEFAULT_PAGES_PER_RUN = 8;

async function fetchPage(page: number): Promise<string> {
  const res = await fetch(VALUES_PAGE_URL + page, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
      accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`Page ${page} answered ${res.status}`);
  return res.text();
}

// Scheduled: refreshes a few pages of Cosmic Values per run, cycling through the whole list.
export const Route = createFileRoute("/api/public/jobs/refresh-values")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        let pagesPerRun = DEFAULT_PAGES_PER_RUN;
        try {
          const body = (await request.json()) as { pages?: number };
          if (body?.pages && body.pages > 0 && body.pages <= 15) pagesPerRun = Math.floor(body.pages);
        } catch {
          // no body: use default
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: state } = await supabaseAdmin
          .from("scrape_state")
          .select("next_page")
          .eq("id", 1)
          .maybeSingle();
        const start = Math.max(1, state?.next_page ?? 1);
        const pages = Array.from({ length: pagesPerRun }, (_, i) => start + i);

        const results = await Promise.allSettled(pages.map(fetchPage));
        const pets = new Map<string, ScrapedPet>();
        let lastPage: number | null = null;
        const errors: string[] = [];

        results.forEach((r, i) => {
          if (r.status === "rejected") {
            errors.push(String(r.reason));
            return;
          }
          lastPage = Math.max(lastPage ?? 0, parseLastPage(r.value) ?? 0) || lastPage;
          // Pages past the end repeat the last page, so skip them.
          if (lastPage && (pages[i] ?? 0) > lastPage) return;
          for (const pet of parseValuesPage(r.value)) pets.set(pet.name, pet);
        });

        if (pets.size) {
          const now = new Date().toISOString();
          const { error } = await supabaseAdmin
            .from("pet_values")
            .upsert([...pets.values()].map((p) => ({ ...p, updated_at: now })), { onConflict: "name" });
          if (error) errors.push(error.message);
        }

        const end = start + pagesPerRun;
        const finished = lastPage !== null && end > lastPage;
        await supabaseAdmin
          .from("scrape_state")
          .update({
            next_page: finished ? 1 : end,
            last_run_at: new Date().toISOString(),
            last_error: errors.length ? errors.join("; ").slice(0, 500) : null,
            ...(finished ? { last_full_scrape_at: new Date().toISOString() } : {}),
          })
          .eq("id", 1);

        return Response.json({ pagesFrom: start, updated: pets.size, lastPage, finished, errors });
      },
    },
  },
});
