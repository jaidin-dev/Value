CREATE TABLE public.pet_values (
  name text PRIMARY KEY,
  match_key text NOT NULL,
  loose_key text NOT NULL,
  variant text NOT NULL DEFAULT 'Normal',
  category text,
  price_text text NOT NULL DEFAULT '',
  value bigint NOT NULL DEFAULT 0,
  delta text,
  demand text,
  exist_count text,
  rap text,
  last_change text,
  image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pet_values_match_key_idx ON public.pet_values (match_key);
CREATE INDEX pet_values_loose_key_idx ON public.pet_values (loose_key);
CREATE INDEX pet_values_value_idx ON public.pet_values (value DESC);

GRANT SELECT ON public.pet_values TO anon, authenticated;
GRANT ALL ON public.pet_values TO service_role;
ALTER TABLE public.pet_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pet values" ON public.pet_values FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.live_trade (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  player text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_value bigint NOT NULL DEFAULT 0,
  unmatched jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_trade TO anon, authenticated;
GRANT ALL ON public.live_trade TO service_role;
ALTER TABLE public.live_trade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read the live trade" ON public.live_trade FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.live_trade (id) VALUES (1);

CREATE TABLE public.scrape_state (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  next_page integer NOT NULL DEFAULT 1,
  last_full_scrape_at timestamptz,
  last_run_at timestamptz,
  last_error text
);
GRANT ALL ON public.scrape_state TO service_role;
ALTER TABLE public.scrape_state ENABLE ROW LEVEL SECURITY;
INSERT INTO public.scrape_state (id) VALUES (1);