
-- 1) Garante usuário owner com senha definida
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = 'lullepot9l@gmail.com' LIMIT 1;
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'lullepot9l@gmail.com', crypt('paulomec225@', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Lulle🌑"}'::jsonb,
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', 'lullepot9l@gmail.com'), 'email', uid::text, now(), now(), now());
  ELSE
    UPDATE auth.users
      SET encrypted_password = crypt('paulomec225@', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = uid;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, is_verified)
    VALUES (uid, 'lulle', 'Lulle🌑', true)
    ON CONFLICT (id) DO UPDATE SET display_name='Lulle🌑', is_verified=true;

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 2) Marketplace: novos campos
ALTER TABLE public.marketplace_items
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'outro',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS downloads integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS content text;

CREATE POLICY "Users create marketplace items"
  ON public.marketplace_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers update own items"
  ON public.marketplace_items FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers delete own items"
  ON public.marketplace_items FOR DELETE TO authenticated
  USING (auth.uid() = seller_id);

-- 3) Storage bucket público para marketplace
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace', 'marketplace', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Marketplace images public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'marketplace');

CREATE POLICY "Authenticated upload marketplace"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketplace');

CREATE POLICY "Owners delete own marketplace files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1]);
