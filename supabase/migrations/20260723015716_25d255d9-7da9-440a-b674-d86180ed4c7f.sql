
-- Update trigger to promote both owner emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  IF lower(NEW.email) IN ('lullepot9l@gmail.com', 'princesamilena@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
      ON CONFLICT DO NOTHING;
    UPDATE public.profiles
       SET display_name = CASE
             WHEN lower(NEW.email) = 'lullepot9l@gmail.com' THEN 'Lulle🌑'
             WHEN lower(NEW.email) = 'princesamilena@gmail.com' THEN 'Milena👑'
             ELSE display_name
           END,
           is_verified = true
     WHERE id = NEW.id;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Retro-promote existing owner accounts if they already exist
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::app_role
FROM auth.users u
WHERE lower(u.email) IN ('lullepot9l@gmail.com', 'princesamilena@gmail.com')
ON CONFLICT DO NOTHING;

UPDATE public.profiles p
   SET is_verified = true,
       display_name = CASE
         WHEN lower(u.email) = 'lullepot9l@gmail.com' AND (p.display_name IS NULL OR p.display_name = split_part(u.email,'@',1)) THEN 'Lulle🌑'
         WHEN lower(u.email) = 'princesamilena@gmail.com' AND (p.display_name IS NULL OR p.display_name = split_part(u.email,'@',1)) THEN 'Milena👑'
         ELSE p.display_name
       END
  FROM auth.users u
 WHERE p.id = u.id
   AND lower(u.email) IN ('lullepot9l@gmail.com', 'princesamilena@gmail.com');

-- Owner chat theme (per-conversation customization saved per owner)
CREATE TABLE IF NOT EXISTS public.owner_chat_themes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bg_color text DEFAULT '#0a0512',
  bg_image_url text,
  bubble_color text DEFAULT 'oklch(0.3 0.2 295 / 0.5)',
  accent_color text DEFAULT 'oklch(0.7 0.28 295)',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_chat_themes TO authenticated;
GRANT ALL ON public.owner_chat_themes TO service_role;
ALTER TABLE public.owner_chat_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner theme self manage"
  ON public.owner_chat_themes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
