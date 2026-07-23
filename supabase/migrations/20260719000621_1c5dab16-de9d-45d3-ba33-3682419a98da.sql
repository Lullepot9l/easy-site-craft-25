GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

GRANT SELECT ON public.luris_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.luris_settings TO authenticated;
GRANT ALL ON public.luris_settings TO service_role;

INSERT INTO public.luris_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;