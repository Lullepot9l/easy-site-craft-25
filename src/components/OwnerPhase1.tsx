import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Target, Trophy, Swords, Palette, Users2, Briefcase, Bot, BarChart3,
  Sparkles, Lock, Check, Flame, Crown, Zap,
} from "lucide-react";

type Tab = "missions" | "achievements" | "battlepass" | "themes" | "clans" | "workspaces" | "companion" | "analytics";

interface Mission { id: string; title: string; description: string | null; icon: string; xp_reward: number; coin_reward: number; target: number; category: string; }
interface MissionProgress { mission_id: string; progress: number; completed: boolean; claimed: boolean; }
interface Achievement { id: string; code: string; title: string; description: string | null; icon: string; rarity: string; xp_reward: number; coin_reward: number; secret: boolean; }
interface UserAch { achievement_id: string; }
interface Season { id: string; name: string; theme: string; ends_at: string; }
interface Tier { id: string; tier: number; xp_required: number; reward_name: string; reward_icon: string; reward_type: string; reward_value: number; premium: boolean; }
interface UserBP { season_id: string; xp: number; premium: boolean; claimed_tiers: number[]; }
interface Theme { id: string; code: string; name: string; description: string | null; preview_color: string; price_coins: number; rarity: string; owner_only: boolean; }
interface UserTheme { theme_id: string; active: boolean; }
interface Clan { id: string; name: string; tag: string; emblem: string; total_xp: number; leader_id: string; }
interface Workspace { id: string; name: string; description: string | null; icon: string; owner_id: string; }
interface Prefs { active_theme: string; hud_mode: string; companion_name: string; companion_mood: string; voice_enabled: boolean; neon_reactive: boolean; galaxy_bg: boolean; }
interface AnalyticsEvent { id: string; event: string; created_at: string; }

const RARITY: Record<string, string> = {
  common: "oklch(0.7_0.05_295)",
  rare: "oklch(0.7_0.25_220)",
  epic: "oklch(0.7_0.28_295)",
  legendary: "oklch(0.78_0.28_45)",
};

const TABS: { id: Tab; label: string; icon: typeof Target }[] = [
  { id: "missions", label: "Missões", icon: Target },
  { id: "achievements", label: "Conquistas", icon: Trophy },
  { id: "battlepass", label: "Battle Pass", icon: Swords },
  { id: "themes", label: "Temas", icon: Palette },
  { id: "clans", label: "Clãs", icon: Users2 },
  { id: "workspaces", label: "Workspaces", icon: Briefcase },
  { id: "companion", label: "Companion AI", icon: Bot },
  { id: "analytics", label: "Analytics 3D", icon: BarChart3 },
];

export function OwnerPhase1() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("missions");

  if (!user) return null;

  return (
    <section className="glass-strong rounded-2xl p-6 border border-[oklch(0.5_0.25_330/0.4)] glow-magenta">
      <header className="mb-5">
        <h2 className="text-2xl font-display neon-text-magenta flex items-center gap-2">
          <Flame className="h-6 w-6 text-[oklch(0.78_0.28_45)]" />
          OWNER PHASE 1 · 25 Features
        </h2>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Gamificação · Battle Pass · Temas · Clãs · Workspaces · Companion · Analytics
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 mb-6 border-b border-[oklch(0.4_0.15_295/0.3)] pb-3">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-display transition ${
              tab === t.id ? "bg-[oklch(0.3_0.25_295/0.5)] neon-text glow-purple" : "glass text-[oklch(0.85_0.05_295)] hover:bg-[oklch(0.25_0.15_295/0.3)]"
            }`}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "missions" && <MissionsTab userId={user.id} coins={profile?.coins ?? 0} />}
      {tab === "achievements" && <AchievementsTab userId={user.id} />}
      {tab === "battlepass" && <BattlePassTab userId={user.id} />}
      {tab === "themes" && <ThemesTab userId={user.id} coins={profile?.coins ?? 0} />}
      {tab === "clans" && <ClansTab userId={user.id} />}
      {tab === "workspaces" && <WorkspacesTab userId={user.id} />}
      {tab === "companion" && <CompanionTab userId={user.id} />}
      {tab === "analytics" && <AnalyticsTab />}
    </section>
  );
}

/* ============ MISSIONS ============ */
function MissionsTab({ userId }: { userId: string; coins: number }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<Record<string, MissionProgress>>({});

  useEffect(() => { load(); }, []);
  async function load() {
    const today = new Date().toISOString().slice(0, 10);
    const [m, p] = await Promise.all([
      supabase.from("daily_missions").select("*").eq("active", true),
      supabase.from("user_mission_progress").select("*").eq("user_id", userId).eq("date", today),
    ]);
    setMissions((m.data ?? []) as Mission[]);
    const map: Record<string, MissionProgress> = {};
    for (const r of (p.data ?? []) as MissionProgress[]) map[r.mission_id] = r;
    setProgress(map);
  }

  async function increment(mid: string) {
    const today = new Date().toISOString().slice(0, 10);
    const m = missions.find(x => x.id === mid)!;
    const cur = progress[mid]?.progress ?? 0;
    const next = Math.min(cur + 1, m.target);
    const completed = next >= m.target;
    await supabase.from("user_mission_progress").upsert(
      { user_id: userId, mission_id: mid, date: today, progress: next, completed },
      { onConflict: "user_id,mission_id,date" }
    );
    load();
  }

  async function claim(mid: string) {
    const m = missions.find(x => x.id === mid)!;
    const p = progress[mid];
    if (!p?.completed || p.claimed) return;
    const { data: pf } = await supabase.from("profiles").select("xp,coins").eq("id", userId).single();
    await supabase.from("profiles").update({
      xp: (pf?.xp ?? 0) + m.xp_reward,
      coins: (pf?.coins ?? 0) + m.coin_reward,
    }).eq("id", userId);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("user_mission_progress").update({ claimed: true }).eq("user_id", userId).eq("mission_id", mid).eq("date", today);
    toast.success(`+${m.xp_reward} XP, +${m.coin_reward} coins 🎯`);
    load();
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-muted-foreground">🎯 Missões diárias · Sistema de recompensas</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {missions.map((m) => {
          const p = progress[m.id];
          const cur = p?.progress ?? 0;
          const pct = Math.min(100, (cur / m.target) * 100);
          return (
            <div key={m.id} className="glass rounded-xl p-4 border border-[oklch(0.4_0.15_295/0.3)]">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm">{m.title}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{m.description}</div>
                  <div className="mt-2 h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[oklch(0.6_0.3_295)] to-[oklch(0.6_0.3_330)]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
                    <span>{cur}/{m.target}</span>
                    <span className="text-[oklch(0.78_0.25_60)]">+{m.coin_reward}🪙 +{m.xp_reward}XP</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {!p?.completed ? (
                      <button onClick={() => increment(m.id)} className="flex-1 glass px-2 py-1 rounded text-[10px] hover-lift">+1 progresso</button>
                    ) : p.claimed ? (
                      <div className="flex-1 text-center text-[10px] font-mono neon-text-cyan">✓ resgatado</div>
                    ) : (
                      <button onClick={() => claim(m.id)} className="flex-1 bg-gradient-to-r from-[oklch(0.5_0.3_295)] to-[oklch(0.5_0.3_330)] px-2 py-1 rounded text-[10px] font-display animate-pulse">RESGATAR</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ ACHIEVEMENTS ============ */
function AchievementsTab({ userId }: { userId: string }) {
  const [achs, setAchs] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => { load(); }, []);
  async function load() {
    const [a, u] = await Promise.all([
      supabase.from("achievements").select("*"),
      supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
    ]);
    setAchs((a.data ?? []) as Achievement[]);
    setUnlocked(new Set(((u.data ?? []) as UserAch[]).map(x => x.achievement_id)));
  }

  async function unlock(a: Achievement) {
    if (unlocked.has(a.id)) return;
    await supabase.from("user_achievements").insert({ user_id: userId, achievement_id: a.id });
    const { data: pf } = await supabase.from("profiles").select("xp,coins").eq("id", userId).single();
    await supabase.from("profiles").update({
      xp: (pf?.xp ?? 0) + a.xp_reward,
      coins: (pf?.coins ?? 0) + a.coin_reward,
    }).eq("id", userId);
    toast.success(`🏆 ${a.title} desbloqueada!`);
    load();
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-muted-foreground">🏆 Conquistas · Inclui badges secretas raras</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {achs.map((a) => {
          const has = unlocked.has(a.id);
          const showSecret = a.secret && !has;
          return (
            <button key={a.id} onClick={() => unlock(a)} disabled={has}
              className={`glass rounded-xl p-4 text-left border transition ${has ? "border-[oklch(0.7_0.28_140/0.5)] opacity-100" : "border-[oklch(0.4_0.15_295/0.3)] hover:border-[oklch(0.7_0.28_295)] opacity-90"}`}>
              <div className="flex items-start gap-3">
                <div className="text-3xl" style={{ filter: has ? "none" : "grayscale(0.7)" }}>{showSecret ? "❓" : a.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm flex items-center gap-1">
                    {showSecret ? "Secreta" : a.title}
                    {has && <Check className="h-3 w-3 text-[oklch(0.7_0.28_140)]" />}
                  </div>
                  <div className="text-[10px] font-mono uppercase" style={{ color: RARITY[a.rarity] }}>{a.rarity}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-1">
                    {showSecret ? "???" : a.description}
                  </div>
                  <div className="text-[10px] font-mono text-[oklch(0.78_0.25_60)] mt-1">+{a.coin_reward}🪙 +{a.xp_reward}XP</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ BATTLE PASS ============ */
function BattlePassTab({ userId }: { userId: string }) {
  const [season, setSeason] = useState<Season | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [ubp, setUbp] = useState<UserBP | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    const { data: s } = await supabase.from("battle_pass_seasons").select("*").eq("active", true).maybeSingle();
    if (!s) return;
    setSeason(s as Season);
    const [t, u] = await Promise.all([
      supabase.from("battle_pass_tiers").select("*").eq("season_id", s.id).order("tier"),
      supabase.from("user_battle_pass").select("*").eq("user_id", userId).eq("season_id", s.id).maybeSingle(),
    ]);
    setTiers((t.data ?? []) as Tier[]);
    setUbp(u.data as UserBP | null);
  }

  async function addXp(amount: number) {
    if (!season) return;
    const cur = ubp?.xp ?? 0;
    await supabase.from("user_battle_pass").upsert(
      { user_id: userId, season_id: season.id, xp: cur + amount, premium: ubp?.premium ?? false, claimed_tiers: ubp?.claimed_tiers ?? [] },
      { onConflict: "user_id,season_id" }
    );
    toast.success(`+${amount} BP XP`);
    load();
  }

  async function upgradePremium() {
    if (!season) return;
    await supabase.from("user_battle_pass").upsert(
      { user_id: userId, season_id: season.id, xp: ubp?.xp ?? 0, premium: true, claimed_tiers: ubp?.claimed_tiers ?? [] },
      { onConflict: "user_id,season_id" }
    );
    toast.success("👑 Premium ativado!");
    load();
  }

  async function claimTier(t: Tier) {
    if (!season || !ubp) return;
    if ((ubp.xp ?? 0) < t.xp_required) return toast.error("XP insuficiente");
    if (t.premium && !ubp.premium) return toast.error("Tier premium");
    if (ubp.claimed_tiers.includes(t.tier)) return;
    const newClaimed = [...ubp.claimed_tiers, t.tier];
    await supabase.from("user_battle_pass").update({ claimed_tiers: newClaimed }).eq("user_id", userId).eq("season_id", season.id);
    if (t.reward_type === "coins") {
      const { data: pf } = await supabase.from("profiles").select("coins").eq("id", userId).single();
      await supabase.from("profiles").update({ coins: (pf?.coins ?? 0) + t.reward_value }).eq("id", userId);
    }
    toast.success(`${t.reward_icon} ${t.reward_name} resgatado!`);
    load();
  }

  if (!season) return <div className="text-xs font-mono text-muted-foreground">Sem temporada ativa.</div>;

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-display text-lg gradient-text">{season.name}</div>
          <div className="text-[11px] font-mono text-muted-foreground">Termina em {new Date(season.ends_at).toLocaleDateString("pt-BR")}</div>
          <div className="text-xs font-mono mt-1">XP: <span className="neon-text-cyan">{ubp?.xp ?? 0}</span></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => addXp(100)} className="glass px-3 py-1.5 rounded text-xs hover-lift">+100 XP</button>
          <button onClick={() => addXp(500)} className="glass px-3 py-1.5 rounded text-xs hover-lift">+500 XP</button>
          {!ubp?.premium && (
            <button onClick={upgradePremium} className="bg-gradient-to-r from-[oklch(0.5_0.3_45)] to-[oklch(0.6_0.3_330)] px-3 py-1.5 rounded text-xs font-display flex items-center gap-1">
              <Crown className="h-3 w-3" /> PREMIUM
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3">
        {tiers.map((t) => {
          const xp = ubp?.xp ?? 0;
          const locked = xp < t.xp_required;
          const claimed = ubp?.claimed_tiers.includes(t.tier);
          const premLocked = t.premium && !ubp?.premium;
          return (
            <div key={t.id} className={`flex-shrink-0 w-32 glass rounded-xl p-3 border ${t.premium ? "border-[oklch(0.6_0.3_45/0.6)]" : "border-[oklch(0.4_0.15_295/0.3)]"}`}>
              <div className="text-[10px] font-mono uppercase text-center text-muted-foreground">Tier {t.tier}</div>
              <div className="text-3xl text-center my-2">{t.reward_icon}</div>
              <div className="text-[10px] text-center font-display truncate">{t.reward_name}</div>
              <div className="text-[9px] text-center font-mono text-muted-foreground mt-1">{t.xp_required} XP</div>
              {t.premium && <div className="text-[9px] text-center font-mono text-[oklch(0.78_0.28_45)] flex items-center justify-center gap-1"><Crown className="h-2 w-2" />PRO</div>}
              <button onClick={() => claimTier(t)} disabled={locked || claimed || premLocked}
                className={`w-full mt-2 px-2 py-1 rounded text-[10px] font-display ${
                  claimed ? "bg-[oklch(0.3_0.2_140/0.4)] text-[oklch(0.7_0.28_140)]" :
                  locked || premLocked ? "glass opacity-50" :
                  "bg-gradient-to-r from-[oklch(0.5_0.3_295)] to-[oklch(0.5_0.3_330)] animate-pulse"
                }`}>
                {claimed ? "✓" : locked ? <Lock className="h-3 w-3 mx-auto" /> : premLocked ? "PRO" : "Resgatar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ THEMES ============ */
function ThemesTab({ userId, coins }: { userId: string; coins: number }) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [owned, setOwned] = useState<Record<string, UserTheme>>({});

  useEffect(() => { load(); }, []);
  async function load() {
    const [t, u] = await Promise.all([
      supabase.from("themes").select("*").order("price_coins"),
      supabase.from("user_themes").select("*").eq("user_id", userId),
    ]);
    setThemes((t.data ?? []) as Theme[]);
    const map: Record<string, UserTheme> = {};
    for (const r of (u.data ?? []) as UserTheme[]) map[r.theme_id] = r;
    setOwned(map);
  }

  async function buy(t: Theme) {
    if (coins < t.price_coins) return toast.error("Coins insuficientes");
    const { data: pf } = await supabase.from("profiles").select("coins").eq("id", userId).single();
    await supabase.from("profiles").update({ coins: (pf?.coins ?? 0) - t.price_coins }).eq("id", userId);
    await supabase.from("user_themes").insert({ user_id: userId, theme_id: t.id, active: false });
    toast.success(`${t.name} adquirido!`);
    load();
  }

  async function activate(t: Theme) {
    await supabase.from("user_themes").update({ active: false }).eq("user_id", userId);
    await supabase.from("user_themes").update({ active: true }).eq("user_id", userId).eq("theme_id", t.id);
    await supabase.from("user_preferences").upsert({ user_id: userId, active_theme: t.code });
    toast.success(`🎨 Tema ${t.name} ativado`);
    load();
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-muted-foreground">🎨 Loja de temas · Dragon Mode é Owner-exclusive</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {themes.map((t) => {
          const has = !!owned[t.id];
          const active = owned[t.id]?.active;
          return (
            <div key={t.id} className="glass rounded-xl p-4 border border-[oklch(0.4_0.15_295/0.3)] relative overflow-hidden">
              {t.owner_only && <div className="absolute -top-3 -right-3 text-5xl opacity-20">🐉</div>}
              <div className="h-16 rounded-lg mb-3 relative" style={{ background: `linear-gradient(135deg, ${t.preview_color}, oklch(0.3 0.2 295))` }}>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-display gradient-text">{t.name[0]}</div>
              </div>
              <div className="font-display text-sm">{t.name}</div>
              <div className="text-[10px] font-mono uppercase" style={{ color: RARITY[t.rarity] }}>{t.rarity}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{t.description}</div>
              <div className="mt-2">
                {active ? (
                  <div className="text-center text-[10px] font-display neon-text-cyan">⚡ ATIVO</div>
                ) : has ? (
                  <button onClick={() => activate(t)} className="w-full bg-gradient-to-r from-[oklch(0.5_0.3_295)] to-[oklch(0.5_0.3_330)] py-1 rounded text-[10px] font-display">Ativar</button>
                ) : (
                  <button onClick={() => buy(t)} className="w-full glass py-1 rounded text-[10px] hover-lift">
                    {t.price_coins === 0 ? "Grátis" : `${t.price_coins} 🪙`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ CLANS ============ */
function ClansTab({ userId }: { userId: string }) {
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClan, setMyClan] = useState<string | null>(null);
  const [name, setName] = useState(""); const [tag, setTag] = useState(""); const [emblem, setEmblem] = useState("⚡");

  useEffect(() => { load(); }, []);
  async function load() {
    const [c, m] = await Promise.all([
      supabase.from("clans").select("*").order("total_xp", { ascending: false }).limit(20),
      supabase.from("clan_members").select("clan_id").eq("user_id", userId).maybeSingle(),
    ]);
    setClans((c.data ?? []) as Clan[]);
    setMyClan((m.data as { clan_id: string } | null)?.clan_id ?? null);
  }

  async function create() {
    if (!name.trim() || !tag.trim()) return toast.error("Nome e tag");
    const { data, error } = await supabase.from("clans").insert({ name, tag, emblem, leader_id: userId }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("clan_members").insert({ clan_id: data.id, user_id: userId, role: "leader" });
    toast.success("Clã criado ⚔️");
    setName(""); setTag(""); load();
  }

  async function join(cid: string) {
    if (myClan) return toast.error("Saia do clã atual primeiro");
    await supabase.from("clan_members").insert({ clan_id: cid, user_id: userId, role: "member" });
    toast.success("Entrou no clã");
    load();
  }

  async function leave() {
    await supabase.from("clan_members").delete().eq("user_id", userId);
    toast.success("Saiu do clã");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-mono text-muted-foreground">⚔️ Clãs · Ranking global por XP</div>
      <div className="glass rounded-xl p-4 flex gap-2 flex-wrap items-end">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do clã" className="glass px-3 py-1.5 rounded text-xs flex-1 min-w-[120px]" />
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="TAG" maxLength={5} className="glass px-3 py-1.5 rounded text-xs w-20" />
        <input value={emblem} onChange={(e) => setEmblem(e.target.value)} placeholder="🐉" maxLength={2} className="glass px-3 py-1.5 rounded text-xs w-14 text-center" />
        <button onClick={create} className="btn-neon px-4 py-1.5 rounded text-xs">Criar Clã</button>
        {myClan && <button onClick={leave} className="glass px-3 py-1.5 rounded text-xs text-[oklch(0.7_0.25_25)]">Sair</button>}
      </div>
      <div className="space-y-2">
        {clans.map((c, i) => (
          <div key={c.id} className="glass rounded-lg p-3 flex items-center gap-3">
            <div className="text-[10px] font-mono w-6 text-center text-[oklch(0.78_0.25_60)]">#{i + 1}</div>
            <div className="text-2xl">{c.emblem}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm">[{c.tag}] {c.name}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{c.total_xp} XP total</div>
            </div>
            {myClan !== c.id ? (
              <button onClick={() => join(c.id)} disabled={!!myClan} className="glass px-3 py-1 rounded text-[10px] hover-lift disabled:opacity-30">Entrar</button>
            ) : (
              <div className="text-[10px] font-mono neon-text-cyan">⚡ MEU CLÃ</div>
            )}
          </div>
        ))}
        {!clans.length && <div className="text-center text-xs text-muted-foreground font-mono py-4">Nenhum clã ainda.</div>}
      </div>
    </div>
  );
}

/* ============ WORKSPACES ============ */
function WorkspacesTab({ userId }: { userId: string }) {
  const [ws, setWs] = useState<Workspace[]>([]);
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from("workspaces").select("*").order("created_at", { ascending: false }).limit(30);
    setWs((data ?? []) as Workspace[]);
  }

  async function create() {
    if (!name.trim()) return;
    const { error } = await supabase.from("workspaces").insert({ name, description: desc, owner_id: userId });
    if (error) return toast.error(error.message);
    toast.success("Workspace criado 💼");
    setName(""); setDesc(""); load();
  }

  async function del(id: string) {
    await supabase.from("workspaces").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-muted-foreground">💼 Workspaces colaborativos · Salas de trabalho</div>
      <div className="glass rounded-xl p-4 space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do workspace" className="glass px-3 py-1.5 rounded text-xs w-full" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição..." rows={2} className="glass px-3 py-1.5 rounded text-xs w-full" />
        <button onClick={create} className="btn-neon px-4 py-1.5 rounded text-xs">Criar Workspace</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {ws.map((w) => (
          <div key={w.id} className="glass rounded-xl p-4 border border-[oklch(0.4_0.15_295/0.3)]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className="text-2xl">{w.icon}</div>
                <div className="min-w-0">
                  <div className="font-display text-sm truncate">{w.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{w.description}</div>
                </div>
              </div>
              {w.owner_id === userId && (
                <button onClick={() => del(w.id)} className="text-[10px] text-[oklch(0.7_0.25_25)] hover-lift">×</button>
              )}
            </div>
          </div>
        ))}
        {!ws.length && <div className="col-span-full text-center text-xs text-muted-foreground font-mono py-4">Nenhum workspace.</div>}
      </div>
    </div>
  );
}

/* ============ COMPANION AI ============ */
function CompanionTab({ userId }: { userId: string }) {
  const [p, setP] = useState<Prefs>({
    active_theme: "cyberpunk", hud_mode: "standard", companion_name: "Luris",
    companion_mood: "friendly", voice_enabled: true, neon_reactive: true, galaxy_bg: false,
  });

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
    if (data) setP(data as unknown as Prefs);
  }

  async function save(updates: Partial<Prefs>) {
    const next = { ...p, ...updates };
    setP(next);
    await supabase.from("user_preferences").upsert({ user_id: userId, ...next });
    toast.success("⚙️ Salvo");
  }

  const MOODS = ["friendly", "sarcastic", "serious", "playful", "mysterious"];
  const HUDS = ["standard", "iron_man", "matrix", "cinema", "galaxy"];

  return (
    <div className="space-y-4">
      <div className="text-xs font-mono text-muted-foreground">🤖 Assistente IA flutuante · Voice commands · HUD · Mood</div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5 space-y-3">
          <div className="text-sm font-display flex items-center gap-2"><Bot className="h-4 w-4" /> Companion</div>
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Nome</label>
            <input value={p.companion_name} onChange={(e) => save({ companion_name: e.target.value })} className="glass px-3 py-1.5 rounded text-xs w-full mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Mood</label>
            <select value={p.companion_mood} onChange={(e) => save({ companion_mood: e.target.value })} className="glass px-3 py-1.5 rounded text-xs w-full mt-1">
              {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="glass rounded-xl p-5 space-y-3">
          <div className="text-sm font-display flex items-center gap-2"><Sparkles className="h-4 w-4" /> Visual / HUD</div>
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">HUD Mode</label>
            <select value={p.hud_mode} onChange={(e) => save({ hud_mode: e.target.value })} className="glass px-3 py-1.5 rounded text-xs w-full mt-1">
              {HUDS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          {([
            ["voice_enabled", "🎙️ Voice commands 'Ei Luris'"],
            ["neon_reactive", "⚡ Energia neon reativa ao mouse"],
            ["galaxy_bg", "🌌 Galaxy background"],
          ] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-xs font-mono cursor-pointer">
              <input type="checkbox" checked={p[k] as boolean} onChange={(e) => save({ [k]: e.target.checked } as Partial<Prefs>)} />
              {l}
            </label>
          ))}
        </div>
      </div>
      <div className="glass rounded-xl p-4 text-center">
        <div className="text-4xl mb-2 animate-pulse">🤖</div>
        <div className="text-sm font-display">{p.companion_name}</div>
        <div className="text-[10px] font-mono text-muted-foreground">Modo: {p.companion_mood} · HUD: {p.hud_mode}</div>
      </div>
    </div>
  );
}

/* ============ ANALYTICS 3D ============ */
function AnalyticsTab() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(50);
    const evts = (data ?? []) as AnalyticsEvent[];
    setEvents(evts);
    const c: Record<string, number> = {};
    for (const e of evts) c[e.event] = (c[e.event] ?? 0) + 1;
    setCounts(c);
  }

  async function track(name: string) {
    await supabase.from("analytics_events").insert({ event: name });
    load();
  }

  const max = Math.max(...Object.values(counts), 1);

  return (
    <div className="space-y-4">
      <div className="text-xs font-mono text-muted-foreground">📊 Painel Analytics 3D · Eventos em tempo real</div>
      <div className="flex gap-2 flex-wrap">
        {["page_view", "chat_message", "image_generate", "mission_claim", "theme_buy"].map((e) => (
          <button key={e} onClick={() => track(e)} className="glass px-3 py-1.5 rounded text-[10px] hover-lift font-mono">+ track {e}</button>
        ))}
      </div>
      <div className="glass rounded-xl p-5">
        <div className="text-sm font-display mb-4 flex items-center gap-2"><Zap className="h-4 w-4" /> Eventos (3D bars)</div>
        <div className="space-y-2">
          {Object.entries(counts).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <div className="text-[10px] font-mono w-28 truncate">{k}</div>
              <div className="flex-1 h-6 bg-black/40 rounded relative overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[oklch(0.5_0.3_295)] via-[oklch(0.6_0.3_330)] to-[oklch(0.65_0.28_45)] transition-all"
                  style={{ width: `${(v / max) * 100}%`, boxShadow: "0 0 20px oklch(0.6 0.3 295 / 0.6)" }} />
                <div className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-mono">{v}</div>
              </div>
            </div>
          ))}
          {!Object.keys(counts).length && <div className="text-center text-xs text-muted-foreground font-mono py-4">Sem eventos. Clique nos botões acima.</div>}
        </div>
      </div>
      <div className="glass rounded-xl p-4 max-h-48 overflow-y-auto">
        <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Stream ao vivo</div>
        {events.slice(0, 20).map((e) => (
          <div key={e.id} className="text-[10px] font-mono flex gap-2 border-b border-border/20 py-1">
            <span className="text-[oklch(0.7_0.15_295)]">{new Date(e.created_at).toLocaleTimeString("pt-BR")}</span>
            <span className="text-[oklch(0.85_0.18_140)]">{e.event}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
