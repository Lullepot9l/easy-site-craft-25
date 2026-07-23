import { useEffect, useRef, useState } from "react";
import {
  Bot, Copy, ExternalLink, CheckCircle2, Send, RefreshCw,
  BookOpen, Settings2, Server, Hash, Sparkles, Rocket, Shield, Key,
  Image as ImageIcon, Users, Trash2, Plus, Terminal, MessageCircle,
  UserX, Ban, Upload, FileText, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  testDiscordBot, listDiscordGuilds, listDiscordChannels,
  sendDiscordMessage, updateDiscordBotProfile, sendDiscordEmbed,
  sendDiscordDM, deleteDiscordMessage, createDiscordChannel,
  deleteDiscordChannel, listDiscordMembers, listDiscordRoles,
  kickDiscordMember, banDiscordMember,
  listSlashCommands, createSlashCommand, deleteSlashCommand,
  getDiscordApplication, updateDiscordApplication,
  sendDiscordMessageWithFile, bulkSetSlashCommands,
} from "@/lib/discord.functions";

type Tab = "tutorial" | "config" | "profile" | "messages" | "server" | "commands" | "test";

type Config = {
  bot_token: string; client_id: string; public_key: string;
  guild_id: string; default_channel_id: string;
  bot_name: string; bot_status: string; activity_type: string; activity_text: string;
  auto_respond: boolean; ai_persona: string;
  bot_description: string;
  bot_tags: string[];
  saved_commands: any[];
  saved_guilds: any[];
  saved_channels: any[];
};

const DEFAULT_CFG: Config = {
  bot_token: "", client_id: "", public_key: "",
  guild_id: "", default_channel_id: "",
  bot_name: "Luris", bot_status: "online",
  activity_type: "Playing", activity_text: "com dragões cyberpunk",
  auto_respond: true, ai_persona: "Luris, IA cyberpunk sarcástica e prestativa",
  bot_description: "", bot_tags: [],
  saved_commands: [], saved_guilds: [], saved_channels: [],
};

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function DiscordIntegration({ ownerId }: { ownerId: string }) {
  const [tab, setTab] = useState<Tab>("tutorial");
  const [cfg, setCfg] = useState<Config>(DEFAULT_CFG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const [botInfo, setBotInfo] = useState<any>(null);
  const [appInfo, setAppInfo] = useState<any>(null);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [commands, setCommands] = useState<any[]>([]);

  const [testMsg, setTestMsg] = useState("🐉 Luris online — cyberpunk mode active.");
  const [msgFile, setMsgFile] = useState<File | null>(null);
  const [embed, setEmbed] = useState({
    title: "🌌 Luris AI", description: "Mensagem enviada via painel Luris.",
    color: 0xB026FF, imageUrl: "", thumbnailUrl: "", footer: "Powered by Luris",
  });
  const [embedFile, setEmbedFile] = useState<File | null>(null);
  const [dm, setDm] = useState({ userId: "", content: "Olá! Mensagem direta do Luris 🐉" });
  const [deleteMsgId, setDeleteMsgId] = useState("");
  const [newChannel, setNewChannel] = useState({ name: "luris-canal", type: 0, topic: "" });
  const [newCmd, setNewCmd] = useState({ name: "luris", description: "Fale com a Luris AI", scope: "guild" as "guild" | "global" });
  const [tagsInput, setTagsInput] = useState("");

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const iconInput = useRef<HTMLInputElement>(null);
  const msgFileInput = useRef<HTMLInputElement>(null);
  const embedFileInput = useRef<HTMLInputElement>(null);

  const fnTest = useServerFn(testDiscordBot);
  const fnGuilds = useServerFn(listDiscordGuilds);
  const fnChannels = useServerFn(listDiscordChannels);
  const fnSend = useServerFn(sendDiscordMessage);
  const fnProfile = useServerFn(updateDiscordBotProfile);
  const fnEmbed = useServerFn(sendDiscordEmbed);
  const fnDM = useServerFn(sendDiscordDM);
  const fnDelMsg = useServerFn(deleteDiscordMessage);
  const fnCreateCh = useServerFn(createDiscordChannel);
  const fnDelCh = useServerFn(deleteDiscordChannel);
  const fnMembers = useServerFn(listDiscordMembers);
  const fnRoles = useServerFn(listDiscordRoles);
  const fnKick = useServerFn(kickDiscordMember);
  const fnBan = useServerFn(banDiscordMember);
  const fnListCmd = useServerFn(listSlashCommands);
  const fnCreateCmd = useServerFn(createSlashCommand);
  const fnDelCmd = useServerFn(deleteSlashCommand);
  const fnGetApp = useServerFn(getDiscordApplication);
  const fnUpdApp = useServerFn(updateDiscordApplication);
  const fnSendFile = useServerFn(sendDiscordMessageWithFile);
  const fnBulkCmd = useServerFn(bulkSetSlashCommands);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("owner_discord_config" as any)
        .select("*").eq("owner_id", ownerId).maybeSingle();
      if (data) {
        const d = data as any;
        setCfg({ ...DEFAULT_CFG, ...d, bot_tags: d.bot_tags ?? [] });
        setGuilds(d.saved_guilds ?? []);
        setChannels(d.saved_channels ?? []);
        setCommands(d.saved_commands ?? []);
        setTagsInput((d.bot_tags ?? []).join(", "));
      }
      setLoading(false);
    })();
  }, [ownerId]);

  async function save(partial?: Partial<Config>) {
    setSaving(true);
    const merged = { ...cfg, ...(partial || {}) };
    const { error } = await supabase
      .from("owner_discord_config" as any)
      .upsert({ ...merged, owner_id: ownerId }, { onConflict: "owner_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    if (partial) setCfg(merged);
    toast.success("Salvo 🐉");
  }

  function needToken() {
    if (!cfg.bot_token) { toast.error("Cole o Bot Token primeiro"); return true; }
    return false;
  }
  function needGuild() {
    if (!cfg.guild_id) { toast.error("Selecione um servidor"); return true; }
    return false;
  }
  function needApp() {
    if (!cfg.client_id) { toast.error("Configure o Client ID"); return true; }
    return false;
  }

  async function run<T>(fn: () => Promise<T>, ok?: string): Promise<T | undefined> {
    setBusy(true);
    try { const r = await fn(); if (ok) toast.success(ok); return r; }
    catch (e: any) { toast.error(e.message || String(e)); }
    finally { setBusy(false); }
  }

  // Auto-load once when token + app are configured
  useEffect(() => {
    if (loading || !cfg.bot_token || cfg.bot_token.length < 20) return;
    (async () => {
      try {
        const info = await fnTest({ data: { token: cfg.bot_token } });
        setBotInfo(info);
        const app = await fnGetApp({ data: { token: cfg.bot_token } });
        setAppInfo(app);
        if (!cfg.bot_description && app.description) {
          setCfg((c) => ({ ...c, bot_description: app.description, bot_tags: app.tags ?? [] }));
          setTagsInput((app.tags ?? []).join(", "));
        }
      } catch { /* silent */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, cfg.bot_token]);

  /* ---------- profile ---------- */
  async function loadBot() {
    if (needToken()) return;
    const info = await run(() => fnTest({ data: { token: cfg.bot_token } }), "Bot conectado");
    if (info) setBotInfo(info);
    const app = await run(() => fnGetApp({ data: { token: cfg.bot_token } }));
    if (app) setAppInfo(app);
  }
  async function uploadAvatar(file: File) {
    if (needToken()) return;
    const dataUri = await fileToDataUri(file);
    const r = await run(() => fnProfile({ data: { token: cfg.bot_token, avatar: dataUri } }), "Avatar atualizado");
    if (r) setBotInfo((b: any) => ({ ...(b ?? {}), avatar: r.avatar }));
  }
  async function uploadBanner(file: File) {
    if (needToken()) return;
    const dataUri = await fileToDataUri(file);
    const r = await run(() => fnProfile({ data: { token: cfg.bot_token, banner: dataUri } }), "Banner atualizado");
    if (r) setBotInfo((b: any) => ({ ...(b ?? {}), banner: r.banner }));
  }
  async function uploadAppIcon(file: File) {
    if (needToken()) return;
    const dataUri = await fileToDataUri(file);
    const r = await run(() => fnUpdApp({ data: { token: cfg.bot_token, icon: dataUri } }), "Ícone da aplicação atualizado");
    if (r) {
      const app = await fnGetApp({ data: { token: cfg.bot_token } });
      setAppInfo(app);
    }
  }
  async function removeAvatar() {
    if (needToken()) return;
    const r = await run(() => fnProfile({ data: { token: cfg.bot_token, avatar: null } }), "Avatar removido");
    if (r) setBotInfo((b: any) => ({ ...(b ?? {}), avatar: null }));
  }
  async function renameBot() {
    if (needToken() || !cfg.bot_name) return;
    const r = await run(() => fnProfile({ data: { token: cfg.bot_token, username: cfg.bot_name } }), "Nome atualizado");
    if (r) setBotInfo((b: any) => ({ ...(b ?? {}), username: r.username }));
  }
  async function saveBio() {
    if (needToken()) return;
    const tags = tagsInput.split(",").map(s => s.trim()).filter(Boolean).slice(0, 5);
    await run(() => fnUpdApp({ data: {
      token: cfg.bot_token, description: cfg.bot_description, tags,
    }}), "Bio & tags aplicadas");
    await save({ bot_description: cfg.bot_description, bot_tags: tags });
    const app = await fnGetApp({ data: { token: cfg.bot_token } });
    setAppInfo(app);
  }

  /* ---------- server ---------- */
  async function loadGuilds() {
    if (needToken()) return;
    const gs = await run(() => fnGuilds({ data: { token: cfg.bot_token } }));
    if (gs) {
      setGuilds(gs); toast.success(`${gs.length} servidor(es)`);
      await save({ saved_guilds: gs });
    }
  }
  async function loadChannels() {
    if (needToken() || needGuild()) return;
    const cs = await run(() => fnChannels({ data: { token: cfg.bot_token, guildId: cfg.guild_id } }));
    if (cs) {
      setChannels(cs); toast.success(`${cs.length} canal(is)`);
      await save({ saved_channels: cs });
    }
  }
  async function loadMembers() {
    if (needToken() || needGuild()) return;
    const ms = await run(() => fnMembers({ data: { token: cfg.bot_token, guildId: cfg.guild_id, limit: 100 } }));
    if (ms) { setMembers(ms); toast.success(`${ms.length} membro(s)`); }
  }
  async function loadRoles() {
    if (needToken() || needGuild()) return;
    const rs = await run(() => fnRoles({ data: { token: cfg.bot_token, guildId: cfg.guild_id } }));
    if (rs) { setRoles(rs); toast.success(`${rs.length} cargo(s)`); }
  }
  async function makeChannel() {
    if (needToken() || needGuild() || !newChannel.name) return;
    await run(() => fnCreateCh({ data: { token: cfg.bot_token, guildId: cfg.guild_id, ...newChannel } }), "Canal criado");
    loadChannels();
  }
  async function delChannel(id: string) {
    if (!confirm("Deletar canal?")) return;
    await run(() => fnDelCh({ data: { token: cfg.bot_token, channelId: id } }), "Canal deletado");
    loadChannels();
  }
  async function kick(userId: string) {
    if (!confirm("Kickar membro?")) return;
    await run(() => fnKick({ data: { token: cfg.bot_token, guildId: cfg.guild_id, userId } }), "Membro kickado");
    loadMembers();
  }
  async function ban(userId: string) {
    if (!confirm("BANIR membro permanentemente?")) return;
    await run(() => fnBan({ data: { token: cfg.bot_token, guildId: cfg.guild_id, userId, deleteMessageSeconds: 0 } }), "Membro banido");
    loadMembers();
  }

  /* ---------- messages ---------- */
  async function sendText() {
    if (needToken() || !cfg.default_channel_id) return toast.error("Escolha o canal padrão");
    if (msgFile) {
      const dataUri = await fileToDataUri(msgFile);
      await run(() => fnSendFile({ data: {
        token: cfg.bot_token, channelId: cfg.default_channel_id,
        content: testMsg, filename: msgFile.name, fileDataUri: dataUri,
      }}), "Enviado com arquivo ✅");
      setMsgFile(null);
    } else {
      await run(() => fnSend({ data: { token: cfg.bot_token, channelId: cfg.default_channel_id, content: testMsg } }), "Enviado ✅");
    }
  }
  async function sendEmbedMsg() {
    if (needToken() || !cfg.default_channel_id) return toast.error("Escolha o canal padrão");
    // If a file is attached, upload it first via multipart (embed pode referenciar via attachment://)
    if (embedFile) {
      const dataUri = await fileToDataUri(embedFile);
      // Send file as normal message and then embed separately for simplicity:
      await run(() => fnSendFile({ data: {
        token: cfg.bot_token, channelId: cfg.default_channel_id,
        content: "", filename: embedFile.name, fileDataUri: dataUri,
      }}), "Arquivo do embed enviado");
      setEmbedFile(null);
    }
    await run(() => fnEmbed({
      data: {
        token: cfg.bot_token, channelId: cfg.default_channel_id,
        title: embed.title || undefined,
        description: embed.description || undefined,
        color: embed.color,
        imageUrl: embed.imageUrl || undefined,
        thumbnailUrl: embed.thumbnailUrl || undefined,
        footer: embed.footer || undefined,
      },
    }), "Embed enviado ✨");
  }
  async function sendDMMsg() {
    if (needToken() || !dm.userId || !dm.content) return toast.error("Preencha usuário e conteúdo");
    await run(() => fnDM({ data: { token: cfg.bot_token, userId: dm.userId, content: dm.content } }), "DM enviada 💬");
  }
  async function deleteMsg() {
    if (needToken() || !cfg.default_channel_id || !deleteMsgId) return toast.error("ID da mensagem e canal padrão");
    await run(() => fnDelMsg({ data: { token: cfg.bot_token, channelId: cfg.default_channel_id, messageId: deleteMsgId } }), "Mensagem deletada");
    setDeleteMsgId("");
  }

  /* ---------- slash commands ---------- */
  async function loadCommands() {
    if (needToken() || needApp()) return;
    const cs = await run(() => fnListCmd({
      data: { token: cfg.bot_token, applicationId: cfg.client_id, guildId: newCmd.scope === "guild" ? cfg.guild_id : undefined },
    }));
    if (cs) {
      setCommands(cs); toast.success(`${cs.length} comando(s)`);
      await save({ saved_commands: cs });
    }
  }
  async function createCommand() {
    if (needToken() || needApp() || !newCmd.name) return;
    if (newCmd.scope === "guild" && needGuild()) return;
    await run(() => fnCreateCmd({
      data: {
        token: cfg.bot_token, applicationId: cfg.client_id,
        guildId: newCmd.scope === "guild" ? cfg.guild_id : undefined,
        name: newCmd.name, description: newCmd.description,
      },
    }), "Comando criado");
    loadCommands();
  }
  async function deleteCmd(id: string) {
    if (!confirm("Deletar comando?")) return;
    await run(() => fnDelCmd({
      data: {
        token: cfg.bot_token, applicationId: cfg.client_id, commandId: id,
        guildId: newCmd.scope === "guild" ? cfg.guild_id : undefined,
      },
    }), "Comando deletado");
    loadCommands();
  }
  async function resyncCommands() {
    if (needToken() || needApp()) return;
    if (newCmd.scope === "guild" && needGuild()) return;
    if (commands.length === 0) return toast.error("Nenhum comando salvo para sincronizar");
    await run(() => fnBulkCmd({
      data: {
        token: cfg.bot_token, applicationId: cfg.client_id,
        guildId: newCmd.scope === "guild" ? cfg.guild_id : undefined,
        commands: commands.map((c) => ({ name: c.name, description: c.description || c.name, type: 1 })),
      },
    }), "Resync completo — recarregue o Discord (Ctrl+R)");
    loadCommands();
  }

  const inviteUrl = cfg.client_id
    ? `https://discord.com/oauth2/authorize?client_id=${cfg.client_id}&scope=bot%20applications.commands&permissions=8`
    : "";

  function copy(t: string, label = "Copiado") { navigator.clipboard.writeText(t); toast.success(label); }

  if (loading) return <div className="text-xs font-mono text-muted-foreground p-4">Carregando…</div>;

  const TABS: [Tab, string, any][] = [
    ["tutorial", "Tutorial", BookOpen],
    ["config", "Configuração", Settings2],
    ["profile", "Perfil & Bio", Bot],
    ["messages", "Mensagens", MessageCircle],
    ["server", "Servidor", Server],
    ["commands", "Slash Commands", Terminal],
    ["test", "Testar", Rocket],
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`glass px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 hover-lift ${
              tab === id ? "ring-1 ring-[oklch(0.6_0.3_295)] neon-text" : "text-muted-foreground"
            }`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "tutorial" && (
        <div className="space-y-4 text-sm">
          <Step n={1} icon={Bot} title="Criar aplicação">
            <p><A href="https://discord.com/developers/applications">discord.com/developers/applications</A> → <b>New Application</b>.</p>
          </Step>
          <Step n={2} icon={Bot} title="Ativar Bot & Token">
            <p>Menu → <b>Bot</b> → <b>Reset Token</b>. Ative os 3 <b>Privileged Intents</b> (Presence, Members, Message Content).</p>
          </Step>
          <Step n={3} icon={Key} title="Client ID">
            <p><b>General Information</b> → copie <b>Application ID</b> para Configuração.</p>
          </Step>
          <Step n={4} icon={Shield} title="Convidar com Admin">
            <p>Salve o Client ID e use o invite gerado (permissões = 8). O escopo <code className="glass px-1 rounded">applications.commands</code> é obrigatório para slash commands aparecerem.</p>
          </Step>
          <Step n={5} icon={Server} title="Guild ID">
            <p>Discord → <b>Modo desenvolvedor</b> ON → clique direito no servidor → <b>Copiar ID</b>. Ou use a aba <b>Servidor</b>.</p>
          </Step>
          <Step n={6} icon={ImageIcon} title="Personalizar (avatar/banner/bio)">
            <p>Aba <b>Perfil & Bio</b>: avatar, banner, nome, <b>bio (About Me da aplicação)</b>, tags e ícone da app.</p>
          </Step>
          <Step n={7} icon={Terminal} title="Slash Commands aparecendo">
            <p>Se <code className="glass px-1 rounded">/</code> não mostra seus comandos: (1) bot precisa ter escopo <code className="glass px-1 rounded">applications.commands</code> — reconvide pelo invite; (2) use escopo <b>guild</b> (instantâneo); (3) clique em <b>Resync</b> na aba Slash Commands; (4) Ctrl+R no Discord.</p>
          </Step>
          <Step n={8} icon={Rocket} title="24/7 (opcional)">
            <p>REST funciona sob demanda. Para tempo real: <A href="https://railway.app">Railway</A>, <A href="https://fly.io">Fly.io</A>, <A href="https://replit.com">Replit</A> + <code className="glass px-1 rounded">discord.js</code>.</p>
          </Step>
        </div>
      )}

      {tab === "config" && (
        <div className="space-y-4">
          <Row label="Bot Token (secreto)" hint="Bot → Reset Token">
            <input type="password" value={cfg.bot_token}
              onChange={(e) => setCfg({ ...cfg, bot_token: e.target.value })}
              placeholder="MTIz...XYZ" className="w-full glass px-3 py-2 rounded font-mono text-xs" />
          </Row>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              ["Client ID (Application ID)", "client_id"],
              ["Public Key", "public_key"],
              ["Guild ID (servidor)", "guild_id"],
              ["Channel ID (canal padrão)", "default_channel_id"],
              ["Nome do bot", "bot_name"],
              ["Texto da atividade", "activity_text"],
            ].map(([label, key]) => (
              <Row key={key} label={label}>
                <input value={(cfg as any)[key]}
                  onChange={(e) => setCfg({ ...cfg, [key]: e.target.value })}
                  className="w-full glass px-3 py-2 rounded font-mono text-xs" />
              </Row>
            ))}
            <Row label="Status">
              <select value={cfg.bot_status} onChange={(e) => setCfg({ ...cfg, bot_status: e.target.value })}
                className="w-full glass px-3 py-2 rounded font-mono text-xs">
                <option value="online">online</option><option value="idle">idle</option>
                <option value="dnd">dnd</option><option value="invisible">invisible</option>
              </select>
            </Row>
            <Row label="Tipo de atividade">
              <select value={cfg.activity_type} onChange={(e) => setCfg({ ...cfg, activity_type: e.target.value })}
                className="w-full glass px-3 py-2 rounded font-mono text-xs">
                <option>Playing</option><option>Streaming</option><option>Listening</option>
                <option>Watching</option><option>Competing</option>
              </select>
            </Row>
          </div>
          <Row label="Persona da IA (auto-respond)">
            <textarea value={cfg.ai_persona} onChange={(e) => setCfg({ ...cfg, ai_persona: e.target.value })}
              rows={3} className="w-full glass px-3 py-2 rounded font-mono text-xs" />
          </Row>
          <label className="flex items-center gap-2 text-xs font-mono">
            <input type="checkbox" checked={cfg.auto_respond}
              onChange={(e) => setCfg({ ...cfg, auto_respond: e.target.checked })} />
            Auto-respond mentions com Luris AI
          </label>
          {inviteUrl && (
            <div className="glass rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs font-mono truncate flex-1 min-w-[200px]">
                🔗 Invite: <span className="text-muted-foreground">{inviteUrl.slice(0, 60)}…</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copy(inviteUrl, "Copiado")} className="glass px-3 py-1.5 rounded text-xs font-mono hover-lift flex items-center gap-1"><Copy className="h-3 w-3" /> Copiar</button>
                <a href={inviteUrl} target="_blank" rel="noopener noreferrer" className="glass px-3 py-1.5 rounded text-xs font-mono hover-lift flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Abrir</a>
              </div>
            </div>
          )}
          <button onClick={() => save()} disabled={saving} className="glass px-4 py-2 rounded-lg text-xs font-mono neon-text-magenta hover-lift">
            {saving ? "Salvando…" : "💾 Salvar tudo"}
          </button>
        </div>
      )}

      {tab === "profile" && (
        <div className="space-y-4">
          <div className="glass rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {botInfo?.avatar
                  ? <img src={botInfo.avatar} alt="" className="h-24 w-24 rounded-full ring-2 ring-[oklch(0.6_0.3_295)]" />
                  : <div className="h-24 w-24 rounded-full glass flex items-center justify-center"><Bot className="h-10 w-10" /></div>}
              </div>
              <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/gif" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }} />
              <div className="flex gap-1">
                <button onClick={() => avatarInput.current?.click()} disabled={busy}
                  className="glass px-2 py-1 rounded text-[11px] font-mono hover-lift flex items-center gap-1">
                  <Upload className="h-3 w-3" /> Avatar
                </button>
                <button onClick={removeAvatar} disabled={busy}
                  className="glass px-2 py-1 rounded text-[11px] font-mono hover-lift">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-3 w-full">
              <div>
                <div className="text-lg font-display neon-text">{botInfo?.username ?? cfg.bot_name}</div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  Bot ID: {botInfo?.id ?? "—"} · App ID: {appInfo?.id ?? cfg.client_id ?? "—"}
                </div>
              </div>
              <Row label="Nome no Discord">
                <div className="flex gap-2">
                  <input value={cfg.bot_name} onChange={(e) => setCfg({ ...cfg, bot_name: e.target.value })}
                    className="flex-1 glass px-3 py-2 rounded font-mono text-xs" />
                  <button onClick={renameBot} disabled={busy}
                    className="glass px-3 py-2 rounded text-xs font-mono neon-text-magenta hover-lift">Aplicar</button>
                </div>
              </Row>
              <Row label="Banner (600x240)">
                <input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/gif" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBanner(f); e.target.value = ""; }} />
                <div className="flex gap-2 items-center">
                  {botInfo?.banner && <img src={botInfo.banner} alt="" className="h-14 rounded ring-1 ring-[oklch(0.6_0.3_295)]" />}
                  <button onClick={() => bannerInput.current?.click()} disabled={busy}
                    className="glass px-3 py-2 rounded text-xs font-mono hover-lift flex items-center gap-1">
                    <Upload className="h-3 w-3" /> Upload banner
                  </button>
                </div>
              </Row>
            </div>
          </div>

          {/* BIO + TAGS + APP ICON */}
          <div className="glass rounded-lg p-4 space-y-3">
            <div className="text-xs font-mono neon-text-magenta flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Bio / About Me da aplicação
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex flex-col items-center gap-2">
                {appInfo?.icon
                  ? <img src={appInfo.icon} className="h-16 w-16 rounded-2xl ring-1 ring-[oklch(0.6_0.3_295)]" />
                  : <div className="h-16 w-16 rounded-2xl glass flex items-center justify-center"><ImageIcon className="h-6 w-6" /></div>}
                <input ref={iconInput} type="file" accept="image/png,image/jpeg" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAppIcon(f); e.target.value = ""; }} />
                <button onClick={() => iconInput.current?.click()} disabled={busy}
                  className="glass px-2 py-1 rounded text-[10px] font-mono hover-lift">Ícone App</button>
              </div>
              <div className="flex-1 space-y-2">
                <textarea value={cfg.bot_description}
                  onChange={(e) => setCfg({ ...cfg, bot_description: e.target.value.slice(0, 400) })}
                  rows={4} placeholder="Bio pública do bot (até 400 caracteres)…"
                  className="w-full glass px-3 py-2 rounded font-mono text-xs" />
                <div className="text-[10px] font-mono text-muted-foreground text-right">
                  {cfg.bot_description.length}/400
                </div>
                <input value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Tags separadas por vírgula (máx 5, ex: ai, cyberpunk, roleplay)"
                  className="w-full glass px-3 py-2 rounded font-mono text-xs" />
              </div>
            </div>
            <button onClick={saveBio} disabled={busy}
              className="glass px-4 py-2 rounded text-xs font-mono neon-text-magenta hover-lift flex items-center gap-2">
              <Zap className="h-3 w-3" /> Aplicar bio & tags no Discord
            </button>
          </div>

          <button onClick={loadBot} disabled={busy}
            className="glass px-3 py-2 rounded text-xs font-mono hover-lift flex items-center gap-2">
            <RefreshCw className="h-3 w-3" /> Recarregar dados do bot
          </button>
          <p className="text-[11px] font-mono text-muted-foreground">
            ⚠️ Discord limita alteração de nome/avatar a 2 por hora. Bio não tem esse limite.
          </p>
        </div>
      )}

      {tab === "messages" && (
        <div className="space-y-4">
          {/* Texto + arquivo */}
          <div className="glass rounded-lg p-3 space-y-2">
            <div className="text-xs font-mono neon-text flex items-center gap-2"><Send className="h-3 w-3" /> Mensagem (texto + arquivo)</div>
            <textarea value={testMsg} onChange={(e) => setTestMsg(e.target.value)}
              rows={2} className="w-full glass px-3 py-2 rounded font-mono text-xs" />
            <input ref={msgFileInput} type="file" className="hidden"
              onChange={(e) => setMsgFile(e.target.files?.[0] ?? null)} />
            <div className="flex gap-2 items-center flex-wrap">
              <button onClick={() => msgFileInput.current?.click()}
                className="glass px-3 py-1.5 rounded text-xs font-mono hover-lift flex items-center gap-1">
                <Upload className="h-3 w-3" /> Anexar arquivo
              </button>
              {msgFile && (
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                  📎 {msgFile.name} ({(msgFile.size / 1024).toFixed(0)}KB)
                  <button onClick={() => setMsgFile(null)} className="text-[oklch(0.7_0.2_25)]"><Trash2 className="h-3 w-3" /></button>
                </span>
              )}
              <button onClick={sendText} disabled={busy}
                className="ml-auto glass px-4 py-2 rounded text-xs font-mono neon-text-magenta hover-lift">Enviar</button>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">Suporta imagens, vídeos, PDFs, GIFs — qualquer arquivo até 8MB (25MB Nitro).</p>
          </div>

          {/* Embed */}
          <div className="glass rounded-lg p-3 space-y-2">
            <div className="text-xs font-mono neon-text flex items-center gap-2"><Sparkles className="h-3 w-3" /> Embed rico</div>
            <div className="grid md:grid-cols-2 gap-2">
              <input value={embed.title} onChange={(e) => setEmbed({ ...embed, title: e.target.value })}
                placeholder="Título" className="glass px-2 py-1.5 rounded font-mono text-xs" />
              <input type="color" value={"#" + embed.color.toString(16).padStart(6, "0")}
                onChange={(e) => setEmbed({ ...embed, color: parseInt(e.target.value.slice(1), 16) })}
                className="glass px-2 py-1 rounded h-9" />
              <input value={embed.imageUrl} onChange={(e) => setEmbed({ ...embed, imageUrl: e.target.value })}
                placeholder="Image URL (opcional)" className="glass px-2 py-1.5 rounded font-mono text-xs" />
              <input value={embed.thumbnailUrl} onChange={(e) => setEmbed({ ...embed, thumbnailUrl: e.target.value })}
                placeholder="Thumbnail URL (opcional)" className="glass px-2 py-1.5 rounded font-mono text-xs" />
              <input value={embed.footer} onChange={(e) => setEmbed({ ...embed, footer: e.target.value })}
                placeholder="Footer" className="glass px-2 py-1.5 rounded font-mono text-xs md:col-span-2" />
            </div>
            <textarea value={embed.description} onChange={(e) => setEmbed({ ...embed, description: e.target.value })}
              rows={3} placeholder="Descrição" className="w-full glass px-3 py-2 rounded font-mono text-xs" />
            <input ref={embedFileInput} type="file" accept="image/*" className="hidden"
              onChange={(e) => setEmbedFile(e.target.files?.[0] ?? null)} />
            <div className="flex gap-2 items-center flex-wrap">
              <button onClick={() => embedFileInput.current?.click()}
                className="glass px-3 py-1.5 rounded text-xs font-mono hover-lift flex items-center gap-1">
                <Upload className="h-3 w-3" /> Anexar imagem
              </button>
              {embedFile && <span className="text-[10px] font-mono text-muted-foreground">📎 {embedFile.name}</span>}
              <button onClick={sendEmbedMsg} disabled={busy}
                className="ml-auto glass px-4 py-2 rounded text-xs font-mono neon-text-magenta hover-lift">Enviar embed</button>
            </div>
          </div>

          {/* DM com picker de membro */}
          <div className="glass rounded-lg p-3 space-y-2">
            <div className="text-xs font-mono neon-text flex items-center gap-2"><MessageCircle className="h-3 w-3" /> DM (mensagem direta)</div>
            <div className="flex gap-2 flex-wrap">
              <input value={dm.userId} onChange={(e) => setDm({ ...dm, userId: e.target.value })}
                placeholder="User ID do destinatário" className="flex-1 glass px-3 py-2 rounded font-mono text-xs min-w-[200px]" />
              <button onClick={loadMembers} disabled={busy}
                className="glass px-3 py-2 rounded text-xs font-mono hover-lift flex items-center gap-1">
                <Users className="h-3 w-3" /> Carregar membros
              </button>
            </div>
            {members.length > 0 && (
              <select onChange={(e) => e.target.value && setDm({ ...dm, userId: e.target.value })}
                className="w-full glass px-3 py-2 rounded font-mono text-xs">
                <option value="">— escolher membro do servidor —</option>
                {members.filter(m => !m.bot).map((m) => (
                  <option key={m.id} value={m.id}>{m.nick || m.username} ({m.id})</option>
                ))}
              </select>
            )}
            <textarea value={dm.content} onChange={(e) => setDm({ ...dm, content: e.target.value })}
              rows={2} className="w-full glass px-3 py-2 rounded font-mono text-xs" />
            <button onClick={sendDMMsg} disabled={busy}
              className="glass px-4 py-2 rounded text-xs font-mono neon-text-magenta hover-lift">Enviar DM</button>
            <p className="text-[10px] font-mono text-muted-foreground">Usuário precisa compartilhar servidor com o bot e ter DMs abertas.</p>
          </div>

          {/* Delete */}
          <div className="glass rounded-lg p-3 space-y-2">
            <div className="text-xs font-mono neon-text flex items-center gap-2"><Trash2 className="h-3 w-3" /> Deletar mensagem</div>
            <input value={deleteMsgId} onChange={(e) => setDeleteMsgId(e.target.value)}
              placeholder="Message ID (no canal padrão)" className="w-full glass px-3 py-2 rounded font-mono text-xs" />
            <button onClick={deleteMsg} disabled={busy}
              className="glass px-4 py-2 rounded text-xs font-mono text-[oklch(0.7_0.2_25)] hover-lift">Deletar</button>
          </div>
        </div>
      )}

      {tab === "server" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <ActionBtn onClick={loadGuilds} busy={busy} icon={Server} label="Servidores" />
            <ActionBtn onClick={loadChannels} busy={busy} icon={Hash} label="Canais" />
            <ActionBtn onClick={loadMembers} busy={busy} icon={Users} label="Membros" />
            <ActionBtn onClick={loadRoles} busy={busy} icon={Shield} label="Cargos" />
          </div>

          {guilds.length > 0 && (
            <Section title={`Servidores (${guilds.length}) — salvos automaticamente`}>
              <div className="grid md:grid-cols-2 gap-2">
                {guilds.map((g) => (
                  <button key={g.id} onClick={() => { setCfg({ ...cfg, guild_id: g.id }); save({ guild_id: g.id }); }}
                    className={`glass p-2 rounded flex items-center gap-2 text-xs font-mono hover-lift text-left ${
                      cfg.guild_id === g.id ? "ring-1 ring-[oklch(0.6_0.3_295)]" : ""
                    }`}>
                    {g.icon ? <img src={g.icon} className="h-6 w-6 rounded" /> : <Server className="h-6 w-6" />}
                    <div className="flex-1 truncate">
                      <div>{g.name}</div>
                      <div className="text-[10px] text-muted-foreground">{g.id}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <Section title="Criar canal">
            <div className="grid md:grid-cols-4 gap-2">
              <input value={newChannel.name} onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                placeholder="nome-canal" className="glass px-2 py-1.5 rounded font-mono text-xs md:col-span-2" />
              <select value={newChannel.type} onChange={(e) => setNewChannel({ ...newChannel, type: Number(e.target.value) })}
                className="glass px-2 py-1.5 rounded font-mono text-xs">
                <option value={0}>Texto</option>
                <option value={2}>Voz</option>
                <option value={4}>Categoria</option>
                <option value={5}>Anúncios</option>
              </select>
              <button onClick={makeChannel} disabled={busy}
                className="glass px-3 py-1.5 rounded text-xs font-mono neon-text-magenta hover-lift flex items-center gap-1"><Plus className="h-3 w-3" /> Criar</button>
            </div>
          </Section>

          {channels.length > 0 && (
            <Section title={`Canais (${channels.length}) — clique para definir como padrão`}>
              <div className="flex flex-wrap gap-2">
                {channels.map((c) => (
                  <div key={c.id} className={`glass px-2 py-1 rounded text-xs font-mono flex items-center gap-1 ${
                    cfg.default_channel_id === c.id ? "ring-1 ring-[oklch(0.6_0.3_295)] neon-text" : ""
                  }`}>
                    <button onClick={() => { setCfg({ ...cfg, default_channel_id: c.id }); save({ default_channel_id: c.id }); }}>
                      {c.type === 2 ? "🔊" : c.type === 4 ? "📁" : "#"} {c.name}
                    </button>
                    <button onClick={() => delChannel(c.id)} className="text-[oklch(0.7_0.2_25)] hover:opacity-80">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {roles.length > 0 && (
            <Section title={`Cargos (${roles.length})`}>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <div key={r.id} className="glass px-2 py-1 rounded text-xs font-mono flex items-center gap-2"
                    style={{ color: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : undefined }}>
                    <span>@{r.name}</span>
                    <span className="text-[10px] text-muted-foreground">{r.id}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {members.length > 0 && (
            <Section title={`Membros (${members.length})`}>
              <div className="grid md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {members.map((m) => (
                  <div key={m.id} className="glass p-2 rounded flex items-center gap-2 text-xs font-mono">
                    {m.avatar ? <img src={m.avatar} className="h-6 w-6 rounded-full" /> : <div className="h-6 w-6 rounded-full glass" />}
                    <div className="flex-1 truncate">
                      <div>{m.nick || m.username} {m.bot && <span className="text-[9px] text-[oklch(0.78_0.28_330)]">BOT</span>}</div>
                      <div className="text-[9px] text-muted-foreground">{m.id}</div>
                    </div>
                    {!m.bot && (
                      <>
                        <button onClick={() => setDm({ ...dm, userId: m.id })} title="DM" className="text-[oklch(0.78_0.28_330)]"><MessageCircle className="h-3 w-3" /></button>
                        <button onClick={() => kick(m.id)} title="Kick" className="text-[oklch(0.75_0.2_60)]"><UserX className="h-3 w-3" /></button>
                        <button onClick={() => ban(m.id)} title="Ban" className="text-[oklch(0.7_0.2_25)]"><Ban className="h-3 w-3" /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {tab === "commands" && (
        <div className="space-y-4">
          <div className="glass rounded-lg p-3 space-y-3">
            <div className="text-[11px] font-mono text-muted-foreground">
              ⚡ Se seus comandos <b>não aparecem</b> ao digitar <code className="glass px-1 rounded">/</code> no Discord:
              (1) O bot precisa do escopo <code className="glass px-1 rounded">applications.commands</code> — <b>reconvide</b> pelo link da Configuração.
              (2) Use escopo <b>guild</b> para aparecer instantâneo. (3) Aperte <b>Resync</b> abaixo. (4) Ctrl+R no Discord.
            </div>
            <div className="text-xs font-mono neon-text">Novo comando /</div>
            <div className="grid md:grid-cols-4 gap-2">
              <input value={newCmd.name} onChange={(e) => setNewCmd({ ...newCmd, name: e.target.value })}
                placeholder="nome" className="glass px-2 py-1.5 rounded font-mono text-xs" />
              <input value={newCmd.description} onChange={(e) => setNewCmd({ ...newCmd, description: e.target.value })}
                placeholder="descrição" className="glass px-2 py-1.5 rounded font-mono text-xs md:col-span-2" />
              <select value={newCmd.scope} onChange={(e) => setNewCmd({ ...newCmd, scope: e.target.value as any })}
                className="glass px-2 py-1.5 rounded font-mono text-xs">
                <option value="guild">Guild (instantâneo)</option>
                <option value="global">Global (~1h)</option>
              </select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={createCommand} disabled={busy}
                className="glass px-3 py-1.5 rounded text-xs font-mono neon-text-magenta hover-lift flex items-center gap-1"><Plus className="h-3 w-3" /> Criar</button>
              <button onClick={loadCommands} disabled={busy}
                className="glass px-3 py-1.5 rounded text-xs font-mono hover-lift flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Listar</button>
              <button onClick={resyncCommands} disabled={busy}
                className="glass px-3 py-1.5 rounded text-xs font-mono neon-text hover-lift flex items-center gap-1"><Zap className="h-3 w-3" /> Resync (força refresh)</button>
              {inviteUrl && (
                <a href={inviteUrl} target="_blank" rel="noopener noreferrer"
                  className="glass px-3 py-1.5 rounded text-xs font-mono hover-lift flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Reconvidar bot
                </a>
              )}
            </div>
          </div>

          {commands.length > 0 && (
            <Section title={`Comandos registrados (${commands.length}) — persistidos no banco`}>
              <div className="grid md:grid-cols-2 gap-2">
                {commands.map((c) => (
                  <div key={c.id} className="glass p-2 rounded flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="neon-text">/{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.description}</div>
                    </div>
                    <button onClick={() => deleteCmd(c.id)} className="text-[oklch(0.7_0.2_25)]">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}
          <p className="text-[11px] font-mono text-muted-foreground">
            💡 Para o bot <b>responder</b> aos comandos, é preciso um handler (webhook Interactions ou gateway) — este painel registra e sincroniza.
          </p>
        </div>
      )}

      {tab === "test" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <ActionBtn onClick={loadBot} busy={busy} icon={RefreshCw} label="Validar & carregar tudo" />
          </div>
          {botInfo && (
            <div className="glass rounded-lg p-3 flex items-center gap-3">
              {botInfo.avatar && <img src={botInfo.avatar} className="h-10 w-10 rounded-full" />}
              <div className="text-xs font-mono">
                <div className="neon-text">{botInfo.username}</div>
                <div className="text-muted-foreground">ID: {botInfo.id} · {botInfo.bot ? "🤖 bot" : "user"}</div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[oklch(0.7_0.25_140)] ml-auto" />
            </div>
          )}
          {appInfo && (
            <div className="glass rounded-lg p-3 text-xs font-mono space-y-1">
              <div className="neon-text-magenta">Aplicação</div>
              <div>Nome: {appInfo.name}</div>
              <div className="text-muted-foreground">Bio: {appInfo.description || "—"}</div>
              <div className="text-muted-foreground">Tags: {(appInfo.tags ?? []).join(", ") || "—"}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function Row({ label, hint, children }: { label: string; hint?: string; children: any }) {
  return (
    <label className="block space-y-1">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label} {hint && <span className="text-[9px] opacity-60">· {hint}</span>}
      </div>
      {children}
    </label>
  );
}
function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-mono uppercase tracking-wider neon-text-magenta">{title}</div>
      {children}
    </div>
  );
}
function Step({ n, icon: Icon, title, children }: { n: number; icon: any; title: string; children: any }) {
  return (
    <div className="glass rounded-lg p-3 flex gap-3">
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[oklch(0.6_0.3_295)] to-[oklch(0.6_0.32_330)] flex items-center justify-center font-display shrink-0">{n}</div>
      <div className="flex-1 space-y-1">
        <div className="text-sm font-display flex items-center gap-2"><Icon className="h-4 w-4 neon-text" /> {title}</div>
        <div className="text-xs font-mono text-muted-foreground space-y-1">{children}</div>
      </div>
    </div>
  );
}
function A({ href, children }: { href: string; children: any }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="neon-text underline">{children}</a>;
}
function ActionBtn({ onClick, busy, icon: Icon, label }: { onClick: () => void; busy: boolean; icon: any; label: string }) {
  return (
    <button onClick={onClick} disabled={busy}
      className="glass px-3 py-2 rounded text-xs font-mono hover-lift flex items-center gap-1">
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}
