import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AvatarBubble } from "@/components/AvatarBubble";
import { Activity, Badge, Gamepad2, Image as ImgIcon, Palette, Save, RotateCcw, Upload, RefreshCw } from "lucide-react";
import {
  ACTIVITY_STATUS, GAME_CATALOG, NAME_COLORS, NAME_FONTS, PROFILE_THEMES,
  detectCurrentGame, hasDesktopBridge, optionClass, statusMeta,
} from "@/lib/profile-style";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

const BG_KEY = "luris.chat.bg";        // JSON: { mode: "color"|"image", value: string, scope: "all"|convId }
const BG_MAP_KEY = "luris.chat.bg.map"; // JSON: Record<convId, {mode,value}>

type BgCfg = { mode: "color" | "image"; value: string };

function csvToArray(value: string) {
  return value.split(",").map((v) => v.trim()).filter(Boolean).slice(0, 8);
}

const PRESETS: BgCfg[] = [
  { mode: "color", value: "oklch(0.15 0.05 285)" },
  { mode: "color", value: "oklch(0.18 0.08 320)" },
  { mode: "color", value: "oklch(0.14 0.03 250)" },
  { mode: "color", value: "oklch(0.12 0.02 200)" },
  { mode: "image", value: "https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?w=1600" },
  { mode: "image", value: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600" },
  { mode: "image", value: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1600" },
  { mode: "image", value: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600" },
];

function SettingsPage() {
  const { user, profile, isOwner } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [codename, setCodename] = useState(profile?.codename ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [activityStatus, setActivityStatus] = useState(profile?.activity_status ?? "online");
  const [currentGame, setCurrentGame] = useState(profile?.current_game ?? "");
  const [favoriteGames, setFavoriteGames] = useState((profile?.favorite_games ?? []).join(", "));
  const [mutualServers, setMutualServers] = useState((profile?.mutual_servers ?? []).join(", "));
  const [discordUsername, setDiscordUsername] = useState(profile?.discord_username ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsapp_number ?? "");
  const [nameColor, setNameColor] = useState(profile?.name_color ?? "gradient");
  const [nameFont, setNameFont] = useState(profile?.name_font ?? "display");
  const [profileTheme, setProfileTheme] = useState(profile?.profile_theme ?? "neon");
  const [scope, setScope] = useState<"all" | "single">("all");
  const [bg, setBg] = useState<BgCfg>({ mode: "color", value: "oklch(0.15 0.05 285)" });
  const [saving, setSaving] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  function readFileAsDataURL(file: File, maxMB: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) return reject(new Error("Só imagens"));
      if (file.size > maxMB * 1024 * 1024) return reject(new Error(`Máx ${maxMB}MB`));
      const r = new FileReader();
      r.onload = (e) => resolve(String(e.target?.result ?? ""));
      r.onerror = () => reject(new Error("Falha ao ler arquivo"));
      r.readAsDataURL(file);
    });
  }

  async function onPickAvatar(file: File | null | undefined) {
    if (!file) return;
    try {
      const url = await readFileAsDataURL(file, 2);
      setAvatarUrl(url);
      toast.success("Foto carregada — clica em Salvar perfil");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  async function onPickBgFile(file: File | null | undefined) {
    if (!file) return;
    try {
      const url = await readFileAsDataURL(file, 4);
      applyBg({ mode: "image", value: url });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url ?? "");
    setDisplayName(profile?.display_name ?? "");
    setUsername(profile?.username ?? "");
    setCodename(profile?.codename ?? "");
    setBio(profile?.bio ?? "");
    setActivityStatus(profile?.activity_status ?? "online");
    setCurrentGame(profile?.current_game ?? "");
    setFavoriteGames((profile?.favorite_games ?? []).join(", "));
    setMutualServers((profile?.mutual_servers ?? []).join(", "));
    setDiscordUsername(profile?.discord_username ?? "");
    setWhatsappNumber(profile?.whatsapp_number ?? "");
    setNameColor(profile?.name_color ?? "gradient");
    setNameFont(profile?.name_font ?? "display");
    setProfileTheme(profile?.profile_theme ?? "neon");
  }, [profile?.id]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BG_KEY);
      if (raw) { const parsed = JSON.parse(raw); if (parsed?.mode) setBg({ mode: parsed.mode, value: parsed.value }); }
    } catch { /* noop */ }
  }, []);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        avatar_url: avatarUrl || null,
        display_name: displayName || null,
        username: username.trim() || null,
        codename: codename.trim() || null,
        bio: bio.trim() || null,
        activity_status: activityStatus.trim() || "online",
        current_game: currentGame.trim(),
        favorite_games: csvToArray(favoriteGames),
        mutual_servers: csvToArray(mutualServers),
        discord_username: discordUsername.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
        name_color: nameColor,
        name_font: nameFont,
        profile_theme: profileTheme,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Perfil atualizado 🌑");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setSaving(false); }
  }

  function applyBg(next: BgCfg) {
    setBg(next);
    localStorage.setItem(BG_KEY, JSON.stringify({ ...next, scope }));
    if (scope === "all") {
      localStorage.removeItem(BG_MAP_KEY);
    }
    toast.success("Fundo aplicado — abre o chat pra ver ✨");
  }

  function resetBg() {
    localStorage.removeItem(BG_KEY);
    localStorage.removeItem(BG_MAP_KEY);
    setBg({ mode: "color", value: "oklch(0.15 0.05 285)" });
    toast("Fundo padrão restaurado");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-display gradient-text">⚙️ Configurações</h1>
        <p className="text-sm text-muted-foreground">Perfil, status, contatos, estilo e fundo das conversas.</p>
      </div>

      <section className={`glass-strong rounded-2xl p-5 overflow-hidden profile-theme-${profileTheme}`}>
        <div className="flex flex-col md:flex-row gap-5 md:items-center">
          <AvatarBubble url={avatarUrl} name={displayName} size={96} effect={profile?.equipped_effect ?? (isOwner ? "fx-owner-purple" : null)} />
          <div className="flex-1 min-w-0">
            <div className={`text-3xl ${optionClass(NAME_FONTS, nameFont)} ${optionClass(NAME_COLORS, nameColor)} truncate`}>{displayName || "Seu nome"}</div>
            <div className="font-mono text-xs neon-text-cyan">@{username || "usuario"} · {codename || "codinome"}</div>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl whitespace-pre-wrap">{bio || "Sua descrição aparece aqui para outras pessoas verem."}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="glass px-2 py-1 rounded-full">{activityStatus || "online"}</span>
              {currentGame && <span className="glass px-2 py-1 rounded-full">Jogando {currentGame}</span>}
              {(profile?.created_at || user?.created_at) && <span className="glass px-2 py-1 rounded-full">Entrou em {new Date(profile?.created_at ?? user?.created_at ?? "").toLocaleDateString("pt-BR")}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-strong rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg flex items-center gap-2"><ImgIcon className="h-4 w-4" /> Foto & Nome</h2>
        <div className="flex items-start gap-4">
          <AvatarBubble url={avatarUrl} name={displayName} size={72} effect={profile?.equipped_effect ?? (isOwner ? "fx-owner-purple" : null)} />
          <div className="flex-1 space-y-2">
            <div className="grid md:grid-cols-2 gap-2">
              <input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="Nome de exibição" className="w-full glass px-3 py-2 rounded-lg text-sm font-mono" />
              <input value={username} onChange={(e)=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="nome de usuário" className="w-full glass px-3 py-2 rounded-lg text-sm font-mono" />
              <input value={codename} onChange={(e)=>setCodename(e.target.value)} placeholder="Codinome" className="w-full glass px-3 py-2 rounded-lg text-sm font-mono" />
              <input value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} placeholder="URL da foto (opcional)" className="w-full glass px-3 py-2 rounded-lg text-sm font-mono" />
            </div>
            <textarea value={bio} onChange={(e)=>setBio(e.target.value)} maxLength={240} rows={3} placeholder="Descrição do perfil" className="w-full glass px-3 py-2 rounded-lg text-sm font-mono resize-none" />
            <div
              onDragOver={(e)=>e.preventDefault()}
              onDrop={(e)=>{ e.preventDefault(); onPickAvatar(e.dataTransfer.files?.[0]); }}
              onClick={()=>avatarFileRef.current?.click()}
              className="glass rounded-lg p-3 border-2 border-dashed border-[oklch(0.4_0.2_295/0.4)] hover:border-[oklch(0.6_0.3_295)] cursor-pointer text-center text-xs font-mono text-muted-foreground">
              <Upload className="h-4 w-4 mx-auto mb-1 text-[oklch(0.7_0.28_295)]" />
              Arrasta ou clica pra enviar uma foto (PNG/JPG, máx 2MB)
            </div>
            <input ref={avatarFileRef} type="file" accept="image/*" className="hidden"
              onChange={(e)=>onPickAvatar(e.target.files?.[0])} />
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-neon px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2">
          <Save className="h-3 w-3" /> {saving ? "..." : "Salvar perfil"}
        </button>
      </section>

      <section className="glass-strong rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg flex items-center gap-2"><Activity className="h-4 w-4" /> Status, jogos e contatos</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-xs font-mono text-muted-foreground space-y-1">Status de atividade
            <select value={statusMeta(activityStatus).value} onChange={(e)=>setActivityStatus(e.target.value)}
              className="w-full glass px-3 py-2 rounded-lg text-sm text-foreground">
              {ACTIVITY_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-mono text-muted-foreground space-y-1">
            <span className="flex items-center justify-between gap-2">
              Jogo atual
              <button type="button" onClick={autoDetectGame}
                className="glass px-2 py-0.5 rounded text-[10px] flex items-center gap-1 hover-lift">
                <RefreshCw className={`h-3 w-3 ${detecting ? "animate-spin" : ""}`} /> detectar do PC
              </button>
            </span>
            <select value={currentGame} onChange={(e)=>setCurrentGame(e.target.value)}
              className="w-full glass px-3 py-2 rounded-lg text-sm text-foreground">
              <option value="">— nenhum —</option>
              {[...new Set([...GAME_CATALOG, ...(currentGame ? [currentGame] : [])])].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2 space-y-1">
            <span className="text-xs font-mono text-muted-foreground">Jogos favoritos (clica pra ligar/desligar)</span>
            <div className="flex flex-wrap gap-1.5">
              {GAME_CATALOG.map((g) => {
                const on = csvToArray(favoriteGames).includes(g);
                return (
                  <button type="button" key={g} onClick={()=>toggleFavGame(g)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1 ${on ? "btn-neon" : "glass hover:bg-white/5"}`}>
                    <Gamepad2 className="h-3 w-3" /> {g}
                  </button>
                );
              })}
            </div>
          </div>
          <input value={mutualServers} onChange={(e)=>setMutualServers(e.target.value)} placeholder="Servidores mútuos separados por vírgula" className="glass px-3 py-2 rounded-lg text-sm font-mono" />
          <input value={discordUsername} onChange={(e)=>setDiscordUsername(e.target.value)} placeholder="Discord" className="glass px-3 py-2 rounded-lg text-sm font-mono" />
          <input value={whatsappNumber} onChange={(e)=>setWhatsappNumber(e.target.value)} placeholder="WhatsApp" className="glass px-3 py-2 rounded-lg text-sm font-mono" />
        </div>
        <p className="text-[11px] font-mono text-muted-foreground">
          🎮 A detecção automática do jogo aberto no PC funciona no <b>Luris Desktop (Windows)</b> — o navegador não tem permissão pra ler processos. Aqui na web dá pra escolher na lista.
        </p>
        <button onClick={saveProfile} disabled={saving} className="btn-neon px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2">
          <Save className="h-3 w-3" /> {saving ? "..." : "Salvar perfil"}
        </button>
      </section>

      <section className="glass-strong rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg flex items-center gap-2"><Badge className="h-4 w-4" /> Estilo do perfil</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="text-xs font-mono text-muted-foreground space-y-1">Cor do nome
            <select value={nameColor} onChange={(e)=>setNameColor(e.target.value)} className="w-full glass px-3 py-2 rounded-lg text-sm text-foreground">
              {NAME_COLORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-mono text-muted-foreground space-y-1">Fonte do nome
            <select value={nameFont} onChange={(e)=>setNameFont(e.target.value)} className="w-full glass px-3 py-2 rounded-lg text-sm text-foreground">
              {NAME_FONTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-mono text-muted-foreground space-y-1">Tema do card
            <select value={profileTheme} onChange={(e)=>setProfileTheme(e.target.value)} className="w-full glass px-3 py-2 rounded-lg text-sm text-foreground">
              {PROFILE_THEMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <div className={`glass rounded-xl p-4 profile-theme-${profileTheme}`}>
            <div className={`text-2xl ${optionClass(NAME_FONTS, nameFont)} ${optionClass(NAME_COLORS, nameColor)}`}>{displayName || "Seu nome"}</div>
            <div className="text-[11px] font-mono text-muted-foreground">prévia do estilo</div>
          </div>
          <div className="glass rounded-xl p-4 flex items-center gap-3">
            <AvatarBubble url={avatarUrl} name={displayName} size={56} effect={profile?.equipped_effect ?? null} />
            <div className="text-[11px] font-mono text-muted-foreground">
              Aura equipada: <b>{profile?.equipped_effect ?? "nenhuma"}</b><br />
              Troca no Marketplace → inventário.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(favoriteGames ? csvToArray(favoriteGames) : ["Roblox", "Valorant"]).map((game) => (
            <span key={game} className="glass px-3 py-1.5 rounded-full flex items-center gap-1"><Gamepad2 className="h-3 w-3" /> {game}</span>
          ))}
        </div>
      </section>

      <section className="glass-strong rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg flex items-center gap-2"><Palette className="h-4 w-4" /> Fundo das conversas</h2>

        <div className="flex gap-2 text-xs font-mono">
          <button onClick={()=>setScope("all")} className={`px-3 py-1.5 rounded-lg ${scope==="all"?"btn-neon":"glass"}`}>Todas as conversas</button>
          <button onClick={()=>setScope("single")} className={`px-3 py-1.5 rounded-lg ${scope==="single"?"btn-neon":"glass"}`}>Só a conversa ativa</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={()=>applyBg(p)}
              className={`h-20 rounded-xl border-2 transition hover:scale-105 ${bg.value===p.value?"border-[oklch(0.7_0.3_295)] glow-purple":"border-transparent"}`}
              style={p.mode==="color" ? { background: p.value } : { backgroundImage:`url(${p.value})`, backgroundSize:"cover", backgroundPosition:"center" }} />
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground">URL de imagem própria (cola aqui e aplica):</label>
          <div className="flex gap-2">
            <input placeholder="https://sua-imagem.jpg" value={bg.mode==="image"?bg.value:""}
              onChange={(e)=>setBg({ mode:"image", value:e.target.value })}
              className="flex-1 glass px-3 py-2 rounded-lg text-sm font-mono" />
            <button onClick={()=>bg.mode==="image" && bg.value && applyBg(bg)} className="btn-neon px-4 rounded-lg text-xs font-display">Aplicar</button>
          </div>
          <div
            onDragOver={(e)=>e.preventDefault()}
            onDrop={(e)=>{ e.preventDefault(); onPickBgFile(e.dataTransfer.files?.[0]); }}
            onClick={()=>bgFileRef.current?.click()}
            className="glass rounded-lg p-4 border-2 border-dashed border-[oklch(0.4_0.2_295/0.4)] hover:border-[oklch(0.6_0.3_295)] cursor-pointer text-center text-xs font-mono text-muted-foreground">
            <Upload className="h-5 w-5 mx-auto mb-1 text-[oklch(0.7_0.28_295)]" />
            Ou envia um arquivo do seu PC (arrasta ou clica — PNG/JPG, máx 4MB)
          </div>
          <input ref={bgFileRef} type="file" accept="image/*" className="hidden"
            onChange={(e)=>onPickBgFile(e.target.files?.[0])} />
        </div>

        <button onClick={resetBg} className="glass px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
          <RotateCcw className="h-3 w-3" /> Restaurar padrão
        </button>

        <p className="text-[11px] text-muted-foreground font-mono">
          💡 Em breve: fundos animados também vão aparecer no <b>Marketplace</b> junto com os efeitos de perfil.
        </p>
      </section>
    </div>
  );
}