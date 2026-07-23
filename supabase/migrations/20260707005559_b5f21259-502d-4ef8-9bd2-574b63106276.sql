ALTER TABLE public.owner_discord_config
  ADD COLUMN IF NOT EXISTS bot_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bot_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS saved_commands jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS saved_guilds jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS saved_channels jsonb DEFAULT '[]'::jsonb;