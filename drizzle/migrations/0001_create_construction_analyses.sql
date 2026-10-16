CREATE TABLE public.construction_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tool TEXT NOT NULL,
  title TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construction_analyses TO authenticated;
GRANT ALL ON public.construction_analyses TO service_role;
ALTER TABLE public.construction_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own analyses" ON public.construction_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own analyses" ON public.construction_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own analyses" ON public.construction_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);