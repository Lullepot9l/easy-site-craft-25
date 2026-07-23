
ALTER TABLE public.owner_discord_config
  ADD COLUMN IF NOT EXISTS public_key text,
  ADD COLUMN IF NOT EXISTS interactions_endpoint text;

CREATE TABLE IF NOT EXISTS public.discord_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'geral',
  enabled boolean NOT NULL DEFAULT true,
  scope text NOT NULL DEFAULT 'guild', -- 'guild' | 'global'
  guild_id text,
  cooldown_seconds integer NOT NULL DEFAULT 0,
  aliases text[] NOT NULL DEFAULT '{}',
  allowed_roles text[] NOT NULL DEFAULT '{}',
  allowed_channels text[] NOT NULL DEFAULT '{}',
  allowed_users text[] NOT NULL DEFAULT '{}',
  denied_roles text[] NOT NULL DEFAULT '{}',
  denied_channels text[] NOT NULL DEFAULT '{}',
  permissions text[] NOT NULL DEFAULT '{}',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  subcommands jsonb NOT NULL DEFAULT '[]'::jsonb,
  response_type text NOT NULL DEFAULT 'text', -- text | embed | ai
  response_content text NOT NULL DEFAULT '',
  response_embed jsonb,
  ai_prompt text,
  ephemeral boolean NOT NULL DEFAULT false,
  favorite boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  discord_command_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, name, scope, guild_id)
);

CREATE INDEX IF NOT EXISTS discord_commands_owner_idx ON public.discord_commands(owner_id);
CREATE INDEX IF NOT EXISTS discord_commands_cat_idx ON public.discord_commands(category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discord_commands TO authenticated;
GRANT ALL ON public.discord_commands TO service_role;
ALTER TABLE public.discord_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner reads own commands" ON public.discord_commands
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner writes own commands" ON public.discord_commands
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'))
  WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'));

CREATE TABLE IF NOT EXISTS public.discord_command_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command_name text NOT NULL,
  user_id text,
  username text,
  guild_id text,
  channel_id text,
  success boolean NOT NULL DEFAULT true,
  latency_ms integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discord_command_logs_owner_idx ON public.discord_command_logs(owner_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.discord_command_logs TO authenticated;
GRANT ALL ON public.discord_command_logs TO service_role;
ALTER TABLE public.discord_command_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner reads own logs" ON public.discord_command_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "service inserts logs" ON public.discord_command_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner deletes own logs" ON public.discord_command_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_discord_commands_updated_at ON public.discord_commands;
CREATE TRIGGER update_discord_commands_updated_at
  BEFORE UPDATE ON public.discord_commands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
