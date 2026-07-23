-- ============ FASE 1: 25 features Owner ============

-- 1. MISSÕES DIÁRIAS
CREATE TABLE public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 10,
  target INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'general',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_missions TO anon, authenticated;
GRANT ALL ON public.daily_missions TO service_role;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions view all" ON public.daily_missions FOR SELECT USING (true);
CREATE POLICY "missions owner manage" ON public.daily_missions FOR ALL USING (has_role(auth.uid(), 'owner'));

CREATE TABLE public.user_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.daily_missions(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_mission_progress TO authenticated;
GRANT ALL ON public.user_mission_progress TO service_role;
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ump own" ON public.user_mission_progress FOR ALL USING (auth.uid() = user_id);

-- 2. ACHIEVEMENTS
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  rarity TEXT NOT NULL DEFAULT 'common',
  xp_reward INTEGER NOT NULL DEFAULT 100,
  coin_reward INTEGER NOT NULL DEFAULT 25,
  secret BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach view" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "ach owner" ON public.achievements FOR ALL USING (has_role(auth.uid(), 'owner'));

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ua view all" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "ua insert own" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. BATTLE PASS
CREATE TABLE public.battle_pass_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  theme TEXT DEFAULT 'cyberpunk',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '60 days',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.battle_pass_seasons TO anon, authenticated;
GRANT ALL ON public.battle_pass_seasons TO service_role;
ALTER TABLE public.battle_pass_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bps view" ON public.battle_pass_seasons FOR SELECT USING (true);
CREATE POLICY "bps owner" ON public.battle_pass_seasons FOR ALL USING (has_role(auth.uid(), 'owner'));

CREATE TABLE public.battle_pass_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  tier INTEGER NOT NULL,
  xp_required INTEGER NOT NULL,
  reward_name TEXT NOT NULL,
  reward_icon TEXT DEFAULT '🎁',
  reward_type TEXT NOT NULL DEFAULT 'coins',
  reward_value INTEGER NOT NULL DEFAULT 100,
  premium BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(season_id, tier)
);
GRANT SELECT ON public.battle_pass_tiers TO anon, authenticated;
GRANT ALL ON public.battle_pass_tiers TO service_role;
ALTER TABLE public.battle_pass_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpt view" ON public.battle_pass_tiers FOR SELECT USING (true);
CREATE POLICY "bpt owner" ON public.battle_pass_tiers FOR ALL USING (has_role(auth.uid(), 'owner'));

CREATE TABLE public.user_battle_pass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  premium BOOLEAN NOT NULL DEFAULT false,
  claimed_tiers INTEGER[] NOT NULL DEFAULT '{}',
  UNIQUE(user_id, season_id)
);
GRANT SELECT, INSERT, UPDATE ON public.user_battle_pass TO authenticated;
GRANT ALL ON public.user_battle_pass TO service_role;
ALTER TABLE public.user_battle_pass ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ubp own" ON public.user_battle_pass FOR ALL USING (auth.uid() = user_id);

-- 4. TEMAS / SKINS
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  preview_color TEXT DEFAULT '#a855f7',
  price_coins INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common',
  owner_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.themes TO anon, authenticated;
GRANT ALL ON public.themes TO service_role;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "themes view" ON public.themes FOR SELECT USING (true);
CREATE POLICY "themes owner" ON public.themes FOR ALL USING (has_role(auth.uid(), 'owner'));

CREATE TABLE public.user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT false,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, theme_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_themes TO authenticated;
GRANT ALL ON public.user_themes TO service_role;
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ut own" ON public.user_themes FOR ALL USING (auth.uid() = user_id);

-- 5. CLÃS
CREATE TABLE public.clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT NOT NULL,
  description TEXT,
  emblem TEXT DEFAULT '⚡',
  leader_id UUID NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clans TO authenticated;
GRANT ALL ON public.clans TO service_role;
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clans view" ON public.clans FOR SELECT USING (true);
CREATE POLICY "clans create" ON public.clans FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "clans leader update" ON public.clans FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "clans leader delete" ON public.clans FOR DELETE USING (auth.uid() = leader_id);

CREATE TABLE public.clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
GRANT SELECT, INSERT, DELETE ON public.clan_members TO authenticated;
GRANT ALL ON public.clan_members TO service_role;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cm view" ON public.clan_members FOR SELECT USING (true);
CREATE POLICY "cm join self" ON public.clan_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cm leave self" ON public.clan_members FOR DELETE USING (auth.uid() = user_id);

-- 6. WORKSPACES COLABORATIVOS
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  icon TEXT DEFAULT '💼',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws view" ON public.workspaces FOR SELECT USING (true);
CREATE POLICY "ws own" ON public.workspaces FOR ALL USING (auth.uid() = owner_id);

-- 7. ANALYTICS EVENTS (pra painel 3D)
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.analytics_events TO authenticated, anon;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ae insert" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "ae owner read" ON public.analytics_events FOR SELECT USING (has_role(auth.uid(), 'owner'));

-- 8. USER PREFERENCES (tema ativo, hud mode, companion)
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY,
  active_theme TEXT DEFAULT 'cyberpunk',
  hud_mode TEXT DEFAULT 'standard',
  companion_name TEXT DEFAULT 'Luris',
  companion_mood TEXT DEFAULT 'friendly',
  voice_enabled BOOLEAN NOT NULL DEFAULT true,
  neon_reactive BOOLEAN NOT NULL DEFAULT true,
  galaxy_bg BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "up own" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- ============ SEEDS ============
INSERT INTO public.daily_missions (title, description, icon, xp_reward, coin_reward, target, category) VALUES
('Conversa com Luris', 'Envie 5 mensagens no chat', '💬', 50, 10, 5, 'chat'),
('Gerador de Imagens', 'Crie 3 imagens com IA', '🎨', 75, 15, 3, 'images'),
('Forge Master', 'Compile 1 script no ScriptForge', '⚒️', 100, 20, 1, 'forge'),
('Social Butterfly', 'Curta 10 posts no feed', '❤️', 40, 8, 10, 'social'),
('Login Diário', 'Faça login hoje', '🌅', 30, 5, 1, 'login');

INSERT INTO public.achievements (code, title, description, icon, rarity, xp_reward, coin_reward, secret) VALUES
('first_login', 'Boas-vindas, Comandante', 'Primeiro acesso à Luris', '🌑', 'common', 100, 50, false),
('first_chat', 'Primeira Conversa', 'Falou com a Luris pela primeira vez', '💬', 'common', 100, 25, false),
('image_master', 'Mestre das Imagens', 'Gerou 50 imagens', '🎨', 'rare', 500, 200, false),
('clan_founder', 'Fundador de Clã', 'Criou seu primeiro clã', '⚔️', 'epic', 750, 300, false),
('battle_pass_max', 'Pass Lendário', 'Completou todo o Battle Pass', '👑', 'legendary', 2000, 1000, false),
('dragon_awoken', '???', 'Conquista secreta do Dragon Mode', '🐉', 'legendary', 5000, 2500, true),
('night_owl', 'Coruja Noturna', 'Login depois das 3h da manhã', '🦉', 'rare', 300, 100, true),
('hundred_days', 'Centenário', 'Login por 100 dias consecutivos', '💯', 'legendary', 3000, 1500, false);

INSERT INTO public.battle_pass_seasons (name, theme) VALUES ('Temporada 1 — Neon Genesis', 'cyberpunk');

INSERT INTO public.battle_pass_tiers (season_id, tier, xp_required, reward_name, reward_icon, reward_type, reward_value, premium)
SELECT s.id, t.tier, t.tier * 500, t.name, t.icon, t.type, t.val, t.prem
FROM public.battle_pass_seasons s,
(VALUES
  (1, '100 Coins', '💰', 'coins', 100, false),
  (2, 'Tema Neon Blue', '💙', 'theme', 1, false),
  (3, '250 Coins', '💰', 'coins', 250, false),
  (4, 'Badge Iniciante', '🎖️', 'badge', 1, true),
  (5, '500 Coins', '💰', 'coins', 500, false),
  (6, 'Tema Matrix', '🟢', 'theme', 1, true),
  (7, 'Avatar Holográfico', '👤', 'avatar', 1, false),
  (8, '1000 Coins', '💰', 'coins', 1000, true),
  (9, 'Tema Dragon', '🐉', 'theme', 1, true),
  (10, 'Badge Lendária', '👑', 'badge', 1, true)
) AS t(tier, name, icon, type, val, prem)
WHERE s.name = 'Temporada 1 — Neon Genesis';

INSERT INTO public.themes (code, name, description, preview_color, price_coins, rarity, owner_only) VALUES
('cyberpunk', 'Cyberpunk Padrão', 'Tema clássico Luris', '#a855f7', 0, 'common', false),
('neon_blue', 'Neon Blue', 'Azul elétrico vibrante', '#3b82f6', 500, 'common', false),
('matrix', 'Matrix Code', 'Verde hacker estilo Matrix', '#10b981', 1500, 'rare', false),
('iron_hud', 'Iron HUD', 'Vermelho dourado estilo Iron Man', '#dc2626', 3000, 'epic', false),
('galaxy', 'Galaxy', 'Tons espaciais profundos', '#6366f1', 2500, 'epic', false),
('dragon', 'Dragon Mode', 'Exclusivo do Owner — fogo neon', '#f59e0b', 99999, 'legendary', true),
('hacker', 'Hacker Neon', 'Modo hacker total', '#22c55e', 2000, 'rare', false),
('cinema', 'Cinema HUD', 'HUD cinematográfico', '#ec4899', 4000, 'legendary', false);