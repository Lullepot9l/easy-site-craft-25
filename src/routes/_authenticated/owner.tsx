import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Crown, Shield, Users as UsersIcon, Activity, Terminal, Database, ArrowUp, ArrowDown, Sparkles, Coins, Search, ChevronDown, ChevronRight, Globe, Puzzle, BrainCircuit, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AccessDenied, LoadingShield } from "@/components/AccessDenied";
import { WebsiteBuilder } from "@/components/WebsiteBuilder";
import { OwnerConsole } from "@/components/OwnerConsole";
import { RobloxPlugin } from "@/components/RobloxPlugin";
import { LurisMind } from "@/components/LurisMind";



export const Route = createFileRoute("/_authenticated/owner")({ component: OwnerPanel });

interface UserRow { id: string; display_name: string | null; username: string | null; xp: number; level: number; coins: number; }
interface LogRow { id: string; event: string; created_at: string; user_id: string | null; }

const ROLE_RANK: Record<AppRole, number> = { user: 0, premium: 1, admin: 2, owner: 3 };
const ROLE_COLORS: Record<AppRole, string> = {
  user: "oklch(0.7_0.05_295)",
  premium: "oklch(0.78_0.25_60)",
  admin: "oklch(0.7_0.28_180)",
  owner: "oklch(0.78_0.28_330)",
};

function OwnerPanel() {
  const { isOwner, loading, user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole>>({});
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [stats, setStats] = useState({ users: 0, posts: 0, images: 0, messages: 0, conversations: 0 });
  const [query, setQuery] = useState("");
  const [coinAmount, setCoinAmount] = useState(1000);
  const [xpAmount, setXpAmount] = useState(500);

  useEffect(() => { if (isOwner) refresh(); }, [isOwner]);

  async function refresh() {
    const [u, p, i, m, c, r, l] = await Promise.all([
      supabase.from("profiles").select("id, display_name, username, xp, level, coins").limit(1000),
      supabase.from("social_posts").select("id", { count: "exact", head: true }),
      supabase.from("generated_images").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("system_logs").select("id, event, created_at, user_id").order("created_at", { ascending: false }).limit(20),
    ]);
    setUsers((u.data ?? []) as UserRow[]);
    const map: Record<string, AppRole> = {};
    for (const row of (r.data ?? []) as { user_id: string; role: AppRole }[]) {
      if (!map[row.user_id] || ROLE_RANK[row.role] > ROLE_RANK[map[row.user_id]]) map[row.user_id] = row.role;
    }
    setRoles(map);
    setLogs((l.data ?? []) as LogRow[]);
    setStats({ users: u.data?.length ?? 0, posts: p.count ?? 0, images: i.count ?? 0, messages: m.count ?? 0, conversations: c.count ?? 0 });
  }

  async function changeRole(userId: string, newRole: AppRole) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) return toast.error(error.message);
    await supabase.from("system_logs").insert({ event: `role_change:${newRole}`, user_id: userId });
    toast.success(`Role → ${newRole}`);
    refresh();
  }

  async function addCoins(userId: string, amount: number) {
    const cur = users.find(u => u.id === userId)?.coins ?? 0;
    const { error } = await supabase.from("profiles").update({ coins: cur + amount }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success(`${amount > 0 ? "+" : ""}${amount} coins`);
    refresh();
  }

  async function setCoins(userId: string, value: number) {
    const { error } = await supabase.from("profiles").update({ coins: Math.max(0, Math.floor(value)) }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success(`Saldo definido em ${Math.max(0, Math.floor(value))} 🪙`);
    refresh();
  }

  async function giveEveryone(amount: number) {
    const targets = users.map(u => u.id);
    for (const id of targets) {
      const cur = users.find(u => u.id === id)?.coins ?? 0;
      await supabase.from("profiles").update({ coins: Math.max(0, cur + amount) }).eq("id", id);
    }
    toast.success(`${amount > 0 ? "+" : ""}${amount} 🪙 para ${targets.length} contas`);
    refresh();
  }

  /** Nível derivado do XP: 1000 XP por nível. */
  function levelFromXp(xp: number) { return Math.max(1, Math.floor(Math.max(0, xp) / 1000) + 1); }

  async function addXp(userId: string, amount: number) {
    const cur = users.find(u => u.id === userId)?.xp ?? 0;
    const xp = Math.max(0, cur + amount);
    const { error } = await supabase.from("profiles").update({ xp, level: levelFromXp(xp) }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success(`${amount > 0 ? "+" : ""}${amount} XP · nível ${levelFromXp(xp)}`);
    refresh();
  }

  async function setXp(userId: string, value: number) {
    const xp = Math.max(0, Math.floor(value));
    const { error } = await supabase.from("profiles").update({ xp, level: levelFromXp(xp) }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success(`XP definido em ${xp} · nível ${levelFromXp(xp)}`);
    refresh();
  }

  async function giveXpEveryone(amount: number) {
    for (const u of users) {
      const xp = Math.max(0, (u.xp ?? 0) + amount);
      await supabase.from("profiles").update({ xp, level: levelFromXp(xp) }).eq("id", u.id);
    }
    toast.success(`${amount > 0 ? "+" : ""}${amount} XP para ${users.length} contas`);
    refresh();
  }

  // Categorias colapsáveis + busca global
  const CATEGORIES = useMemo(() => ([
    { id: "users",     label: "Usuários & Acesso",      icon: UsersIcon,     group: "Core",     keywords: ["user","role","cargo","permissao","plano","usuario","coin"] },
    { id: "console",   label: "Console · Comandos",     icon: Terminal,      group: "Core",     keywords: ["console","comando","cmd","terminal","script","custom"] },
    { id: "mind",      label: "Mente da Luris",         icon: BrainCircuit,  group: "Core",     keywords: ["mente","memoria","memória","sentimento","pensamento","personalidade","prompt","humor","ciume"] },
    
    { id: "sites",     label: "Sites & Builder",        icon: Globe,         group: "Builder",  keywords: ["site","website","builder","html","dominio","slug","chat","edit","seo","visual","voz","github","imagem"] },
    { id: "roblox",    label: "Roblox · Plugin Studio", icon: Puzzle,        group: "Builder",  keywords: ["roblox","plugin","studio","lua","rbxm","tutorial"] },
    { id: "logs",      label: "Logs & Sistema",         icon: Terminal,      group: "System",   keywords: ["log","sistema","status","gateway","monitor"] },
  ]), []);
  const [open, setOpen] = useState<Record<string, boolean>>({ users: true, console: true, mind: true, sites: true, roblox: true, logs: false });
  const [globalSearch, setGlobalSearch] = useState("");

  function toggle(id: string) { setOpen(o => ({ ...o, [id]: !o[id] })); }
  function matchesSearch(cat: typeof CATEGORIES[number]) {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return true;
    return cat.label.toLowerCase().includes(q) || cat.keywords.some(k => k.includes(q));
  }
  // se busca ativa, expande automaticamente as que batem
  useEffect(() => {
    if (!globalSearch.trim()) return;
    const next: Record<string, boolean> = {};
    CATEGORIES.forEach(c => { if (matchesSearch(c)) next[c.id] = true; });
    setOpen(prev => ({ ...prev, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch]);

  if (loading) return <LoadingShield />;
  if (!isOwner) return <AccessDenied required="owner" />;

  const filtered = users.filter(u =>
    !query || (u.display_name ?? "").toLowerCase().includes(query.toLowerCase()) ||
    (u.username ?? "").toLowerCase().includes(query.toLowerCase())
  );

  const visible = CATEGORIES.filter(matchesSearch);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="glass-strong rounded-2xl p-6 glow-magenta relative overflow-hidden">
        <div className="absolute -right-8 -top-8 text-9xl opacity-10">🐉</div>
        <div className="flex items-center justify-between gap-4 flex-wrap relative z-10">
          <div className="flex items-center gap-3">
            <Crown className="h-10 w-10 text-[oklch(0.78_0.28_330)]" />
            <div>
              <h1 className="text-4xl font-display neon-text-magenta">OWNER PANEL</h1>
              <p className="text-sm font-mono text-muted-foreground">Acesso supremo · Controle global · Dragon Mode</p>
            </div>
          </div>
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[oklch(0.6_0.2_295)]" />
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="🔍 buscar feature (missão, tema, site, log, role...)"
              className="w-full glass pl-10 pr-3 py-2 rounded-lg text-sm font-mono outline-none focus:ring-1 focus:ring-[oklch(0.6_0.3_295)]"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { l: "Usuários", v: stats.users, i: UsersIcon },
          { l: "Posts", v: stats.posts, i: Activity },
          { l: "Imagens", v: stats.images, i: Database },
          { l: "Mensagens", v: stats.messages, i: Terminal },
          { l: "Conversas", v: stats.conversations, i: Sparkles },
        ].map((s) => (
          <div key={s.l} className="glass p-5 rounded-xl glow-purple">
            <s.i className="h-6 w-6 mb-2 text-[oklch(0.78_0.28_330)]" />
            <div className="text-xs font-mono uppercase text-muted-foreground">{s.l}</div>
            <div className="text-3xl font-display gradient-text">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Quick-nav agrupado */}
      <nav className="glass rounded-xl p-3 flex flex-wrap gap-2 text-[11px] font-mono">
        {["Core","Phases","Builder","System"].map(g => (
          <div key={g} className="flex items-center gap-1.5">
            <span className="text-muted-foreground uppercase tracking-wider mr-1">{g}:</span>
            {CATEGORIES.filter(c => c.group === g).map(c => (
              <a key={c.id} href={`#cat-${c.id}`}
                onClick={() => setOpen(o => ({ ...o, [c.id]: true }))}
                className="glass px-2 py-1 rounded hover-lift flex items-center gap-1">
                <c.icon className="h-3 w-3" /> {c.label.split("·")[0].trim()}
              </a>
            ))}
          </div>
        ))}
      </nav>

      {visible.length === 0 && (
        <div className="glass-strong rounded-2xl p-8 text-center text-sm font-mono text-muted-foreground">
          Nenhuma categoria bate com "<span className="neon-text-magenta">{globalSearch}</span>"
        </div>
      )}

      {/* CATEGORIA: Usuários */}
      {visible.some(c => c.id === "users") && (
        <CategorySection id="users" label="Usuários & Acesso" icon={UsersIcon} open={open.users} onToggle={() => toggle("users")}>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h3 className="text-sm font-display neon-text flex items-center gap-2"><Shield className="h-4 w-4" /> Gerenciar usuários</h3>
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="🔍 filtrar usuários..." className="glass px-3 py-1.5 rounded-lg text-xs font-mono" />
          </div>
          <div className="glass rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="neon-text-magenta flex items-center gap-1"><Coins className="h-3 w-3" /> Banco de LuCoins</span>
            <input type="number" value={coinAmount} onChange={(e)=>setCoinAmount(Number(e.target.value))}
              className="glass px-2 py-1 rounded w-28" placeholder="valor" />
            <button onClick={()=>giveEveryone(coinAmount)} className="glass px-2.5 py-1 rounded hover-lift">dar a todos</button>
            <button onClick={()=>giveEveryone(-coinAmount)} className="glass px-2.5 py-1 rounded hover-lift">tirar de todos</button>
            <span className="text-muted-foreground">
              use os botões da linha do usuário pra ajustar individual, ou <b>=</b> pra definir exatamente {coinAmount}
            </span>
          </div>
          <div className="glass rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="neon-text flex items-center gap-1"><Zap className="h-3 w-3" /> Banco de XP</span>
            <input type="number" value={xpAmount} onChange={(e)=>setXpAmount(Number(e.target.value))}
              className="glass px-2 py-1 rounded w-28" placeholder="xp" />
            <button onClick={()=>giveXpEveryone(xpAmount)} className="glass px-2.5 py-1 rounded hover-lift">dar a todos</button>
            <button onClick={()=>giveXpEveryone(-xpAmount)} className="glass px-2.5 py-1 rounded hover-lift">tirar de todos</button>
            <span className="text-muted-foreground">
              o nível é recalculado automático (1000 XP = 1 nível)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase font-mono text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2">Usuário</th>
                  <th className="text-left">Username</th>
                  <th>Role</th>
                  <th>XP / Nível</th>
                  <th>Coins</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const r = roles[u.id] ?? "user";
                  return (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-[oklch(0.2_0.1_295/0.2)]">
                      <td className="py-2 font-display">{u.display_name ?? "—"}</td>
                      <td className="font-mono text-xs text-muted-foreground">{u.username ?? "—"}</td>
                      <td className="text-center">
                        <select value={r} onChange={(e)=>changeRole(u.id, e.target.value as AppRole)}
                          disabled={r === "owner"}
                          style={{ color: ROLE_COLORS[r] }}
                          className="glass px-2 py-1 rounded text-xs font-mono uppercase">
                          <option value="user">user</option>
                          <option value="premium">premium</option>
                          <option value="admin">admin</option>
                          {r === "owner" && <option value="owner">owner</option>}
                        </select>
                      </td>
                      <td className="text-center font-mono">{u.xp} <span className="text-[10px] text-muted-foreground">· nv {u.level}</span></td>
                      <td className="text-center font-mono text-[oklch(0.78_0.25_60)]">{u.coins}</td>
                      <td className="text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={()=>addCoins(u.id, 100)} title="+100 coins" className="glass p-1.5 rounded hover-lift"><ArrowUp className="h-3 w-3 text-[oklch(0.7_0.25_140)]" /></button>
                          <button onClick={()=>addCoins(u.id, -100)} title="-100 coins" className="glass p-1.5 rounded hover-lift"><ArrowDown className="h-3 w-3 text-[oklch(0.7_0.25_25)]" /></button>
                          <button onClick={()=>addCoins(u.id, 1000)} title="+1000" className="glass p-1.5 rounded hover-lift"><Coins className="h-3 w-3 text-[oklch(0.78_0.25_60)]" /></button>
                          <button onClick={()=>setCoins(u.id, coinAmount)} title={`definir saldo = ${coinAmount}`} className="glass px-2 py-1 rounded hover-lift text-[10px] font-mono">=</button>
                          <span className="w-px self-stretch bg-[oklch(0.4_0.1_295/0.5)] mx-1" />
                          <button onClick={()=>addXp(u.id, xpAmount)} title={`+${xpAmount} XP`} className="glass px-2 py-1 rounded hover-lift text-[10px] font-mono flex items-center gap-1"><Zap className="h-3 w-3 text-[oklch(0.8_0.2_295)]" />+</button>
                          <button onClick={()=>addXp(u.id, -xpAmount)} title={`-${xpAmount} XP`} className="glass px-2 py-1 rounded hover-lift text-[10px] font-mono">xp−</button>
                          <button onClick={()=>setXp(u.id, xpAmount)} title={`definir XP = ${xpAmount}`} className="glass px-2 py-1 rounded hover-lift text-[10px] font-mono">xp=</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr><td colSpan={6} className="text-center py-6 text-xs text-muted-foreground font-mono">Nenhum usuário encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CategorySection>
      )}

      {/* CATEGORIA: Console */}
      {visible.some(c => c.id === "console") && (
        <CategorySection id="console" label="Console · Comandos Owner" icon={Terminal} open={open.console} onToggle={() => toggle("console")}>
          <OwnerConsole />
        </CategorySection>
      )}

      {/* Phases viraram páginas próprias no menu lateral (owner-only). */}
      {visible.some(c => c.id === "mind") && (
        <CategorySection id="mind" label="Mente da Luris · sentimentos & memória" icon={BrainCircuit} open={open.mind} onToggle={() => toggle("mind")}>
          <LurisMind />
        </CategorySection>
      )}





      {/* Discord agora vive em /discord (rota dedicada) */}

      {/* CATEGORIA: Sites */}
      {visible.some(c => c.id === "sites") && user && (
        <CategorySection id="sites" label="Sites & Builder" icon={Globe} open={open.sites} onToggle={() => toggle("sites")}>
          <WebsiteBuilder ownerId={user.id} />
        </CategorySection>
      )}

      {/* CATEGORIA: Roblox Plugin */}
      {visible.some(c => c.id === "roblox") && (
        <CategorySection id="roblox" label="Roblox · Plugin Studio" icon={Puzzle} open={open.roblox} onToggle={() => toggle("roblox")}>
          <RobloxPlugin />
        </CategorySection>
      )}

      {/* CATEGORIA: Logs */}
      {visible.some(c => c.id === "logs") && (
        <CategorySection id="logs" label="Logs & Sistema" icon={Terminal} open={open.logs} onToggle={() => toggle("logs")}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-display neon-text-magenta mb-2">Logs em tempo real</h3>
              <div className="bg-black/60 rounded-lg p-4 font-mono text-[11px] border border-[oklch(0.4_0.2_140/0.4)] space-y-1 max-h-72 overflow-y-auto">
                {logs.length === 0 && <div className="text-muted-foreground">Sem logs ainda.</div>}
                {logs.map(l => (
                  <div key={l.id} className="flex gap-2">
                    <span className="text-[oklch(0.7_0.15_295)]">{new Date(l.created_at).toLocaleTimeString("pt-BR")}</span>
                    <span className="text-[oklch(0.85_0.18_140)]">{l.event}</span>
                    {l.user_id && <span className="text-muted-foreground truncate">{l.user_id.slice(0, 8)}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-display neon-text mb-2">Status do sistema</h3>
              <div className="bg-black/60 rounded-lg p-4 font-mono text-xs text-[oklch(0.85_0.18_140)] border border-[oklch(0.4_0.2_140/0.4)] space-y-1">
                <div>$ luris.system.status</div>
                <div className="text-[oklch(0.85_0.2_295)]">→ ONLINE · DRAGON_MODE active · {new Date().toISOString()}</div>
                <div>$ neural.gateway.ping</div>
                <div className="text-[oklch(0.85_0.2_295)]">→ Gemini Flash · OK</div>
                <div>$ owner.privileges</div>
                <div className="text-[oklch(0.85_0.18_140)]">→ ALL_GRANTED · GOD_MODE</div>
              </div>
            </div>
          </div>
        </CategorySection>
      )}
    </div>
  );
}

function CategorySection({
  id, label, icon: Icon, open, onToggle, children,
}: {
  id: string; label: string; icon: typeof Crown; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <section id={`cat-${id}`} className="glass-strong rounded-2xl overflow-hidden border border-[oklch(0.4_0.2_295/0.3)] scroll-mt-20">

      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-5 hover:bg-[oklch(0.25_0.15_295/0.2)] transition">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-[oklch(0.78_0.28_330)]" />
          <h2 className="text-lg font-display gradient-text">{label}</h2>
        </div>
        {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
      {open && <div className="p-5 pt-0 border-t border-[oklch(0.4_0.2_295/0.2)]">{children}</div>}
    </section>
  );
}
