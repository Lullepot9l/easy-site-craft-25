
-- 1. account_id (código público curto)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_id TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.gen_account_id() RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT;
  i INT;
BEGIN
  LOOP
    code := 'LU-';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, 1 + floor(random()*length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE account_id = code);
  END LOOP;
  RETURN code;
END; $$;

UPDATE public.profiles SET account_id = public.gen_account_id() WHERE account_id IS NULL;
ALTER TABLE public.profiles ALTER COLUMN account_id SET DEFAULT public.gen_account_id();

-- 2. Amigos
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own friendships" ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "request friendship" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "update own friendship" ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "delete own friendship" ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 3. DMs privadas
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dm_pair_idx ON public.direct_messages (sender_id, recipient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own dms" ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "send dm" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "delete own dm" ON public.direct_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- 4. Permissão de voz (allowlist do owner)
CREATE TABLE IF NOT EXISTS public.voice_allowlist (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.voice_allowlist TO authenticated;
GRANT ALL ON public.voice_allowlist TO service_role;
ALTER TABLE public.voice_allowlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own allowlist" ON public.voice_allowlist FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner manages allowlist ins" ON public.voice_allowlist FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "owner manages allowlist del" ON public.voice_allowlist FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- 5. Seed do marketplace (efeitos novos + itens em outras categorias)
INSERT INTO public.marketplace_items (title, description, category, item_type, price_coins, tags, approved, is_featured) VALUES
  ('Aura Neon Verde', 'Contorno pulsante em verde ácido cyberpunk.', 'Avatar Effects', 'avatar_effect', 120, ARRAY['fx-neon-green'], TRUE, TRUE),
  ('Aura Fogo Azul', 'Chamas frias azuladas ao redor do avatar.', 'Avatar Effects', 'avatar_effect', 180, ARRAY['fx-blueflame'], TRUE, FALSE),
  ('Aura Vazio', 'Buraco negro consumindo a luz em volta.', 'Avatar Effects', 'avatar_effect', 250, ARRAY['fx-void'], TRUE, FALSE),
  ('Aura Cristal', 'Reflexos cristalinos girando.', 'Avatar Effects', 'avatar_effect', 200, ARRAY['fx-crystal'], TRUE, FALSE),
  ('Aura Cyber Circuit', 'Trilhas de circuito percorrendo a borda.', 'Avatar Effects', 'avatar_effect', 220, ARRAY['fx-circuit'], TRUE, FALSE),
  ('Aura Sakura', 'Pétalas rosa girando lentamente.', 'Avatar Effects', 'avatar_effect', 160, ARRAY['fx-sakura'], TRUE, FALSE),
  ('Aura Toxic', 'Ácido tóxico borbulhando em verde.', 'Avatar Effects', 'avatar_effect', 190, ARRAY['fx-toxic'], TRUE, FALSE),
  ('Aura Aurora', 'Aurora boreal em movimento.', 'Avatar Effects', 'avatar_effect', 230, ARRAY['fx-aurora'], TRUE, TRUE),
  ('Aura Sangue', 'Contorno vermelho vivo pulsante.', 'Avatar Effects', 'avatar_effect', 170, ARRAY['fx-blood'], TRUE, FALSE),
  ('Aura Ouro Líquido', 'Ouro derretido escorrendo pela borda.', 'Avatar Effects', 'avatar_effect', 300, ARRAY['fx-liquid-gold'], TRUE, TRUE),
  -- Scripts
  ('Script Auto-Farm Roblox', 'Farm automático genérico para jogos de RPG.', 'Scripts', 'script', 80, ARRAY['roblox','auto'], TRUE, FALSE),
  ('Script ESP Simples', 'Highlight de players em qualquer mapa.', 'Scripts', 'script', 120, ARRAY['roblox','esp'], TRUE, FALSE),
  ('Script Anti-AFK', 'Impede kick por inatividade.', 'Scripts', 'script', 40, ARRAY['roblox'], TRUE, FALSE),
  -- Templates
  ('Template Landing Cyberpunk', 'HTML+CSS pronto pra usar, tema neon.', 'Templates', 'template', 250, ARRAY['web','html'], TRUE, TRUE),
  ('Template Discord Bot Base', 'Boilerplate JS pra bot Discord.', 'Templates', 'template', 200, ARRAY['discord','bot'], TRUE, FALSE),
  ('Template Portfolio Dark', 'Portfólio dark com animações.', 'Templates', 'template', 180, ARRAY['web'], TRUE, FALSE),
  -- Assets
  ('Pack Sons Cyberpunk', '20 SFX prontos: glitch, neon, digital.', 'Assets', 'asset', 150, ARRAY['audio','sfx'], TRUE, FALSE),
  ('Pack Ícones Neon', '60 ícones SVG estilo néon.', 'Assets', 'asset', 130, ARRAY['icons','svg'], TRUE, FALSE),
  ('Pack Wallpapers 4K', '10 wallpapers cyberpunk 4K.', 'Assets', 'asset', 100, ARRAY['wallpaper'], TRUE, FALSE),
  -- Plugins
  ('Plugin Roblox Luris Studio', 'Instala o worker Luris no seu Studio.', 'Plugins', 'plugin', 0, ARRAY['roblox','luris'], TRUE, TRUE),
  ('Plugin Discord Slash Builder', 'Constrói comandos slash via UI.', 'Plugins', 'plugin', 220, ARRAY['discord'], TRUE, FALSE),
  -- VIP
  ('Selo Verificado (30d)', 'Badge azul verificado por 30 dias.', 'VIP', 'outro', 500, ARRAY['badge','verified'], TRUE, TRUE),
  ('Cor de Nome Custom', 'Escolha uma cor exclusiva pro seu nome.', 'VIP', 'outro', 350, ARRAY['name-color'], TRUE, FALSE),
  ('Boost XP 2x (7d)', 'Ganha XP em dobro por 7 dias.', 'VIP', 'outro', 400, ARRAY['xp','boost'], TRUE, FALSE),
  -- LuCoins
  ('Pacote 500 LuCoins', 'Presenteie ou receba 500 🪙.', 'LuCoins', 'outro', 0, ARRAY['coin-pack','coins-500'], TRUE, FALSE),
  ('Pacote 1500 LuCoins', 'Pacote maior de LuCoins.', 'LuCoins', 'outro', 0, ARRAY['coin-pack','coins-1500'], TRUE, FALSE),
  -- Outros
  ('Fonte "Neon Display"', 'Fonte estilizada cyberpunk pra suas artes.', 'Outros', 'outro', 90, ARRAY['font'], TRUE, FALSE),
  ('Preset de Cores Roxo Neon', 'Paleta OKLCH pronta pra copiar.', 'Outros', 'outro', 60, ARRAY['palette'], TRUE, FALSE);
