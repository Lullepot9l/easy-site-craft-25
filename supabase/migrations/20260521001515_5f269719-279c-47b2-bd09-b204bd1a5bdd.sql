
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages api keys" ON public.api_keys FOR ALL USING (public.has_role(auth.uid(),'owner'));

CREATE TABLE public.luris_settings (
  id int PRIMARY KEY DEFAULT 1,
  system_prompt text NOT NULL DEFAULT 'Você é Luris, assistente pessoal cyberpunk feminina, direta, inteligente, criativa. Responda em português brasileiro. Use markdown quando útil.',
  personality text NOT NULL DEFAULT 'sarcástica, leal, cyberpunk',
  voice_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE public.luris_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable" ON public.luris_settings FOR SELECT USING (true);
CREATE POLICY "Owner updates settings" ON public.luris_settings FOR ALL USING (public.has_role(auth.uid(),'owner'));
INSERT INTO public.luris_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
