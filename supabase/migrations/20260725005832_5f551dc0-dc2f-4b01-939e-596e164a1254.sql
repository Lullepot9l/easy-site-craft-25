-- Ensure profile/user role creation runs for every new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  normalized_email text := lower(coalesce(NEW.email, ''));
  base_name text := coalesce(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(coalesce(NEW.email, 'user'), '@', 1)
  );
  owner_emails text[] := ARRAY['lullepot9l@gmail.com','princesamilena@gmail.com','pincesamilena@gmail.com'];
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    bio,
    codename,
    activity_status,
    current_game,
    favorite_games,
    name_color,
    name_font,
    profile_theme
  ) VALUES (
    NEW.id,
    lower(regexp_replace(base_name, '[^a-zA-Z0-9_]+', '_', 'g')),
    CASE
      WHEN normalized_email = 'lullepot9l@gmail.com' THEN 'Lulle🌑'
      WHEN normalized_email IN ('princesamilena@gmail.com','pincesamilena@gmail.com') THEN 'Milena👑'
      ELSE base_name
    END,
    NEW.raw_user_meta_data->>'avatar_url',
    '',
    split_part(coalesce(NEW.email, 'user'), '@', 1),
    'online',
    '',
    ARRAY[]::text[],
    'gradient',
    'display',
    'neon'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = coalesce(public.profiles.username, excluded.username),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    bio = coalesce(public.profiles.bio, excluded.bio),
    codename = coalesce(public.profiles.codename, excluded.codename),
    activity_status = coalesce(public.profiles.activity_status, excluded.activity_status),
    current_game = coalesce(public.profiles.current_game, excluded.current_game),
    favorite_games = coalesce(public.profiles.favorite_games, excluded.favorite_games),
    name_color = coalesce(public.profiles.name_color, excluded.name_color),
    name_font = coalesce(public.profiles.name_font, excluded.name_font),
    profile_theme = coalesce(public.profiles.profile_theme, excluded.profile_theme),
    updated_at = now();

  IF normalized_email = ANY(owner_emails) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
      ON CONFLICT (user_id, role) DO NOTHING;
    UPDATE public.profiles
       SET display_name = CASE
             WHEN normalized_email = 'lullepot9l@gmail.com' THEN 'Lulle🌑'
             WHEN normalized_email IN ('princesamilena@gmail.com','pincesamilena@gmail.com') THEN 'Milena👑'
             ELSE display_name
           END,
           is_verified = true,
           updated_at = now()
     WHERE id = NEW.id;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile cosmetics/editable fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS codename text,
  ADD COLUMN IF NOT EXISTS activity_status text NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS current_game text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS favorite_games text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS name_color text NOT NULL DEFAULT 'gradient',
  ADD COLUMN IF NOT EXISTS name_font text NOT NULL DEFAULT 'display',
  ADD COLUMN IF NOT EXISTS profile_theme text NOT NULL DEFAULT 'neon',
  ADD COLUMN IF NOT EXISTS discord_username text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS mutual_servers text[] NOT NULL DEFAULT '{}';

-- DM enhancements for Discord/WhatsApp-style friend chat
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'luris';

-- Persistent chat personalization per user/conversation
CREATE TABLE IF NOT EXISTS public.chat_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid,
  mode text NOT NULL DEFAULT 'color',
  value text NOT NULL,
  name text NOT NULL DEFAULT 'Meu fundo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, conversation_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_backgrounds TO authenticated;
GRANT ALL ON public.chat_backgrounds TO service_role;
ALTER TABLE public.chat_backgrounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own chat backgrounds" ON public.chat_backgrounds;
CREATE POLICY "Users manage own chat backgrounds"
ON public.chat_backgrounds FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS update_chat_backgrounds_updated_at ON public.chat_backgrounds;
CREATE TRIGGER update_chat_backgrounds_updated_at
BEFORE UPDATE ON public.chat_backgrounds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Make sure existing users that missed the trigger get fixed now
INSERT INTO public.profiles (
  id, username, display_name, avatar_url, bio, codename, activity_status, current_game, favorite_games, name_color, name_font, profile_theme, is_verified, created_at, updated_at
)
SELECT
  u.id,
  lower(regexp_replace(coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)), '[^a-zA-Z0-9_]+', '_', 'g')),
  CASE
    WHEN lower(u.email) = 'lullepot9l@gmail.com' THEN 'Lulle🌑'
    WHEN lower(u.email) IN ('princesamilena@gmail.com','pincesamilena@gmail.com') THEN 'Milena👑'
    ELSE coalesce(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
  END,
  u.raw_user_meta_data->>'avatar_url',
  '',
  split_part(u.email, '@', 1),
  'online',
  '',
  ARRAY[]::text[],
  'gradient',
  'display',
  'neon',
  lower(u.email) IN ('lullepot9l@gmail.com','princesamilena@gmail.com','pincesamilena@gmail.com'),
  u.created_at,
  now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

UPDATE public.profiles p
SET
  codename = coalesce(p.codename, split_part(u.email, '@', 1)),
  activity_status = coalesce(nullif(p.activity_status, ''), 'online'),
  current_game = coalesce(p.current_game, ''),
  favorite_games = coalesce(p.favorite_games, ARRAY[]::text[]),
  name_color = coalesce(nullif(p.name_color, ''), 'gradient'),
  name_font = coalesce(nullif(p.name_font, ''), 'display'),
  profile_theme = coalesce(nullif(p.profile_theme, ''), 'neon'),
  is_verified = CASE WHEN lower(u.email) IN ('lullepot9l@gmail.com','princesamilena@gmail.com','pincesamilena@gmail.com') THEN true ELSE p.is_verified END,
  display_name = CASE
    WHEN lower(u.email) = 'lullepot9l@gmail.com' THEN 'Lulle🌑'
    WHEN lower(u.email) IN ('princesamilena@gmail.com','pincesamilena@gmail.com') THEN 'Milena👑'
    ELSE coalesce(p.display_name, split_part(u.email, '@', 1))
  END,
  updated_at = now()
FROM auth.users u
WHERE p.id = u.id;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, CASE WHEN lower(u.email) IN ('lullepot9l@gmail.com','princesamilena@gmail.com','pincesamilena@gmail.com') THEN 'owner'::public.app_role ELSE 'user'::public.app_role END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::public.app_role
FROM auth.users u
WHERE lower(u.email) IN ('lullepot9l@gmail.com','princesamilena@gmail.com','pincesamilena@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Starter shop items: profile effects + chat backgrounds + cute cosmetics
INSERT INTO public.marketplace_items (seller_id, title, description, category, item_type, price_coins, image_url, is_featured, tags, approved, content)
VALUES
  (NULL, 'Aura Nightberry', 'Aura roxa fofinha estilo Discord para destacar o perfil.', 'Avatar Effects', 'avatar_effect', 0, NULL, true, ARRAY['fx-nightberry','fx-cute','profile'], true, NULL),
  (NULL, 'Sakura Soft', 'Pétalas delicadas ao redor da foto de perfil.', 'Avatar Effects', 'avatar_effect', 25, NULL, true, ARRAY['fx-sakura','fx-cute','profile'], true, NULL),
  (NULL, 'Coração Rosa', 'Efeito fofo com brilho de coração para avatar.', 'Avatar Effects', 'avatar_effect', 20, NULL, false, ARRAY['fx-heart','fx-cute','profile'], true, NULL),
  (NULL, 'Nome Gradiente Neon', 'Cor gradiente para o nome no perfil.', 'Perfil', 'name_style', 15, NULL, true, ARRAY['name-gradient','profile'], true, 'gradient'),
  (NULL, 'Fonte Nightberry', 'Fonte cursiva fofinha para codinome/nome.', 'Perfil', 'name_font', 15, NULL, true, ARRAY['font-nightberry','profile'], true, 'nightberry'),
  (NULL, 'Fundo Discord Roxo', 'Fundo roxo premium para conversas.', 'Fundos de Chat', 'chat_background', 0, NULL, true, ARRAY['bg-purple','chat-bg'], true, 'oklch(0.18 0.12 295)'),
  (NULL, 'Fundo Galaxy Blue', 'Fundo azul espacial para conversas.', 'Fundos de Chat', 'chat_background', 20, NULL, false, ARRAY['bg-galaxy','chat-bg'], true, 'oklch(0.16 0.12 240)')
ON CONFLICT DO NOTHING;