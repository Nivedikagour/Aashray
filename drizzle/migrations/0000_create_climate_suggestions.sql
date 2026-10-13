CREATE TABLE public.climate_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  city text NOT NULL,
  room_type text NOT NULL,
  area_sqm numeric NOT NULL,
  style text NOT NULL,
  weather jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.climate_suggestions TO authenticated;
GRANT ALL ON public.climate_suggestions TO service_role;
ALTER TABLE public.climate_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.climate_suggestions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.climate_suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.climate_suggestions FOR DELETE TO authenticated USING (auth.uid() = user_id);