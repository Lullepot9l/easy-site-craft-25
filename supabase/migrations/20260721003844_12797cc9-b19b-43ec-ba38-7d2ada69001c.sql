
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_effect text;

CREATE TABLE IF NOT EXISTS public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_inventory TO authenticated;
GRANT ALL ON public.user_inventory TO service_role;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own inventory"
  ON public.user_inventory FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.marketplace_items (title, description, category, item_type, price_coins, tags, approved, is_featured)
VALUES
  ('Aura Arco-Íris',       'Borda animada que troca de cor em loop. Vibe pride/hype.',        'Avatar Effects', 'avatar_effect',  50, ARRAY['fx-rainbow','animated','common'],   true, true),
  ('Halo Dourado',         'Anel dourado girando ao redor do seu avatar. Look de anjo.',       'Avatar Effects', 'avatar_effect', 120, ARRAY['fx-halo','rare'],                    true, true),
  ('Chamas Néon',          'Aura de fogo pulsando em laranja neon. Pra quem tá on fire.',      'Avatar Effects', 'avatar_effect',  90, ARRAY['fx-flame','rare'],                   true, false),
  ('Pulso Magenta',        'Ondas magenta expandindo do avatar. Estilo cyberpunk.',            'Avatar Effects', 'avatar_effect',  60, ARRAY['fx-pulse','common'],                 true, false),
  ('Elétrico',              'Contorno ciano piscando estilo raio.',                             'Avatar Effects', 'avatar_effect',  70, ARRAY['fx-electric','common'],              true, false),
  ('Sombra Dark',          'Aura roxa escura tipo vilão. Discreto e pesado.',                   'Avatar Effects', 'avatar_effect',  80, ARRAY['fx-shadow','common'],                true, false),
  ('Coração Batendo',      'Borda em coração vermelho pulsando. Modo romântico.',              'Avatar Effects', 'avatar_effect', 100, ARRAY['fx-heart','rare'],                   true, false),
  ('Galáxia',              'Universo girando ao fundo do avatar. Épico.',                       'Avatar Effects', 'avatar_effect', 200, ARRAY['fx-galaxy','epic'],                  true, true),
  ('Holograma',            'Efeito glitch/holo estilo Blade Runner.',                            'Avatar Effects', 'avatar_effect', 180, ARRAY['fx-hologram','epic'],                true, false),
  ('Brilho Suave',         'Brilho branco leve deslizando pela borda. Elegante.',              'Avatar Effects', 'avatar_effect',  40, ARRAY['fx-shine','common'],                 true, false),
  ('Gelo',                 'Aura ciano gelada com faíscas cristalinas.',                        'Avatar Effects', 'avatar_effect', 110, ARRAY['fx-ice','rare'],                     true, false),
  ('Coroa Owner 👑',       'Exclusivo estilo owner: aura dourada + roxa girando. Lendário.',    'Avatar Effects', 'avatar_effect', 999, ARRAY['fx-owner','legendary','owner-only'], true, true)
ON CONFLICT DO NOTHING;
