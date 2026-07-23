
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.owner_discord_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_token text,
  client_id text,
  public_key text,
  guild_id text,
  default_channel_id text,
  bot_name text DEFAULT 'Luris',
  bot_status text DEFAULT 'online',
  activity_type text DEFAULT 'Playing',
  activity_text text DEFAULT 'com dragões cyberpunk',
  auto_respond boolean DEFAULT true,
  ai_persona text DEFAULT 'Luris, IA cyberpunk sarcástica e prestativa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_discord_config TO authenticated;
GRANT ALL ON public.owner_discord_config TO service_role;

ALTER TABLE public.owner_discord_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage discord config"
ON public.owner_discord_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER owner_discord_config_updated_at
BEFORE UPDATE ON public.owner_discord_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
