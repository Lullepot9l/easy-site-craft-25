import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Compass, Hash, Volume2, Plus, Send, Users, Copy, LogOut, Trash2,
  Settings2, Shield, X, Paperclip,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { LoadingShield } from "@/components/AccessDenied";
import { AvatarBubble } from "@/components/AvatarBubble";

export const Route = createFileRoute("/_authenticated/servers")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Servidores · Luris" },
      { name: "description", content: "Crie servidores estilo Discord na Luris: canais de texto e voz, membros, convites e chat em tempo real." },
      { property: "og:title", content: "Servidores · Luris" },
      { property: "og:description", content: "Comunidades Luris com canais, membros e chat em tempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Server = {
  id: string; owner_id: string; name: string; tag: string | null;
  description: string | null; icon_url: string | null; banner_url: string | null;
  invite_code: string; is_public: boolean;
};
type Channel = { id: string; server_id: string; name: string; topic: string | null; kind: string; position: number };
type Msg = {
  id: string; channel_id: string; server_id: string; user_id: string;
  content: string; attachment_url: string | null; created_at: string;
};
type Member = { id: string; user_id: string; role: string };
type Prof = { id: string; display_name: string | null; username: string | null; avatar_url: string | null; equipped_effect: string | null };

function Page() {
  const { user, loading } = useAuth();
  if (loading || !user) return <LoadingShield label="Carregando servidores..." />;
  return <ServersView userId={user.id} />;
}

function ServersView({ userId }: { userId: string }) {
  const [mine, setMine] = useState<Server[]>([]);
  const [discover, setDiscover] = useState<Server[]>([]);
  const [active, setActive] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [profs, setProfs] = useState<Record<string, Prof>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [invite, setInvite] = useState("");
  const [draft, setDraft] = useState({ name: "", tag: "", description: "", is_public: true, icon_url: "" });
  const [newCh, setNewCh] = useState({ name: "", kind: "text" as "text" | "voice" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isOwnerOf = active?.owner_id === userId;

  useEffect(() => { void loadServers(); }, []);
  useEffect(() => { if (active) { void loadChannels(active.id); void loadMembers(active.id); } }, [active]);
  useEffect(() => { if (channel) void loadMsgs(channel.id); }, [channel]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9 }); }, [msgs]);

  useEffect(() => {
    if (!channel) return;
    const ch = supabase
      .channel(`srv-${channel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "server_messages" }, (p) => {
        const row = p.new as Msg;
        if (row.channel_id === channel.id) setMsgs((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, row]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [channel]);

  async function loadServers() {
    const { data: mem } = await supabase.from("server_members").select("server_id").eq("user_id", userId);
    const ids = (mem ?? []).map((m) => m.server_id);
    const { data: all } = await supabase.from("servers").select("*").order("created_at", { ascending: false }).limit(120);
    const list = (all ?? []) as Server[];
    const mineList = list.filter((s) => s.owner_id === userId || ids.includes(s.id));
    setMine(mineList);
    setDiscover(list.filter((s) => s.is_public && !mineList.some((m) => m.id === s.id)));
    if (!active && mineList[0]) setActive(mineList[0]);
  }

  async function loadChannels(serverId: string) {
    const { data } = await supabase.from("server_channels").select("*").eq("server_id", serverId).order("position");
    const list = (data ?? []) as Channel[];
    setChannels(list);
    setChannel(list.find((c) => c.kind === "text") ?? list[0] ?? null);
  }

  async function loadMembers(serverId: string) {
    const { data } = await supabase.from("server_members").select("*").eq("server_id", serverId).limit(500);
    const list = (data ?? []) as Member[];
    setMembers(list);
    await hydrate(list.map((m) => m.user_id));
  }

  async function hydrate(ids: string[]) {
    const missing = [...new Set(ids)].filter((id) => id && !profs[id]);
    if (!missing.length) return;
    const { data } = await supabase.from("profiles")
      .select("id,display_name,username,avatar_url,equipped_effect").in("id", missing);
    if (data) setProfs((p) => ({ ...p, ...Object.fromEntries((data as Prof[]).map((d) => [d.id, d])) }));
  }

  async function loadMsgs(channelId: string) {
    const { data } = await supabase.from("server_messages").select("*")
      .eq("channel_id", channelId).order("created_at", { ascending: true }).limit(300);
    const list = (data ?? []) as Msg[];
    setMsgs(list);
    await hydrate(list.map((m) => m.user_id));
  }

  async function createServer() {
    if (draft.name.trim().length < 2) return toast.error("Dá um nome ao servidor");
    const { data, error } = await supabase.from("servers").insert({
      owner_id: userId, name: draft.name.trim(), tag: draft.tag.trim() || null,
      description: draft.description.trim() || null, is_public: draft.is_public,
      icon_url: draft.icon_url.trim() || null,
    }).select("*").maybeSingle();
    if (error || !data) return toast.error(error?.message ?? "Falhou");
    const srv = data as Server;
    await supabase.from("server_members").insert({ server_id: srv.id, user_id: userId, role: "owner" });
    await supabase.from("server_channels").insert([
      { server_id: srv.id, name: "geral", kind: "text", position: 0 },
      { server_id: srv.id, name: "off-topic", kind: "text", position: 1 },
      { server_id: srv.id, name: "Voz Geral", kind: "voice", position: 2 },
    ]);
    toast.success(`Servidor ${srv.name} criado 🎉`);
    setShowCreate(false);
    setDraft({ name: "", tag: "", description: "", is_public: true, icon_url: "" });
    setActive(srv);
    void loadServers();
  }

  async function join(srv: Server) {
    const { error } = await supabase.from("server_members").insert({ server_id: srv.id, user_id: userId, role: "member" });
    if (error) return toast.error(error.message);
    toast.success(`Entrou em ${srv.name}`);
    setActive(srv);
    void loadServers();
  }

  async function joinByInvite() {
    const code = invite.trim().toUpperCase();
    if (!code) return;
    const { data } = await supabase.from("servers").select("*").eq("invite_code", code).maybeSingle();
    if (!data) return toast.error("Convite inválido");
    setInvite("");
    await join(data as Server);
  }

  async function leave(srv: Server) {
    if (srv.owner_id === userId) return toast.error("Você é o dono — apague o servidor em vez de sair");
    await supabase.from("server_members").delete().eq("server_id", srv.id).eq("user_id", userId);
    setActive(null);
    void loadServers();
    toast.success("Saiu do servidor");
  }

  async function removeServer(srv: Server) {
    if (!confirm(`Apagar "${srv.name}" e todos os canais?`)) return;
    const { error } = await supabase.from("servers").delete().eq("id", srv.id);
    if (error) return toast.error(error.message);
    setActive(null); setShowSettings(false);
    void loadServers();
    toast.success("Servidor apagado");
  }

  async function saveServer() {
    if (!active) return;
    const { error } = await supabase.from("servers").update({
      name: active.name, tag: active.tag, description: active.description,
      icon_url: active.icon_url, banner_url: active.banner_url, is_public: active.is_public,
    }).eq("id", active.id);
    if (error) return toast.error(error.message);
    toast.success("Servidor atualizado");
    void loadServers();
  }

  async function addChannel() {
    if (!active || !newCh.name.trim()) return;
    const { error } = await supabase.from("server_channels").insert({
      server_id: active.id,
      name: newCh.name.trim().toLowerCase().replace(/\s+/g, "-"),
      kind: newCh.kind, position: channels.length,
    });
    if (error) return toast.error(error.message);
    setNewCh({ name: "", kind: "text" });
    void loadChannels(active.id);
  }

  async function delChannel(c: Channel) {
    await supabase.from("server_channels").delete().eq("id", c.id);
    if (active) void loadChannels(active.id);
  }

  async function kick(m: Member) {
    await supabase.from("server_members").delete().eq("id", m.id);
    if (active) void loadMembers(active.id);
    toast.success("Membro removido");
  }

  function pickFile(f?: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Só imagem por enquanto");
    if (f.size > 5 * 1024 * 1024) return toast.error("Máx 5MB");
    const r = new FileReader();
    r.onload = (e) => setAttachment(String(e.target?.result ?? ""));
    r.readAsDataURL(f);
  }

  async function send() {
    if (!channel || !active || (!text.trim() && !attachment)) return;
    const body = text.trim(); const att = attachment;
    setText(""); setAttachment(null);
    const { error } = await supabase.from("server_messages").insert({
      channel_id: channel.id, server_id: active.id, user_id: userId,
      content: body || "📎 imagem", attachment_url: att, attachment_type: att ? "image" : null,
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 glass-strong rounded-2xl p-6 glow-purple sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Compass className="h-8 w-8 shrink-0 text-[oklch(0.78_0.28_295)]" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl sm:text-3xl font-display neon-text">Servidores</h1>
            <p className="text-xs font-mono text-muted-foreground">Comunidades estilo Discord: canais de texto e voz, membros e convites.</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-neon shrink-0 px-4 py-2 rounded-lg font-display text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Criar
        </button>
      </header>

      <div className="glass-strong rounded-xl p-3 flex flex-wrap items-center gap-2">
        <input value={invite} onChange={(e) => setInvite(e.target.value)} onKeyDown={(e) => e.key === "Enter" && joinByInvite()}
          placeholder="Código de convite (ex: A1B2C3D4)" className="glass px-3 py-2 rounded-lg text-xs font-mono flex-1 min-w-[180px]" />
        <button onClick={joinByInvite} className="glass px-3 py-2 rounded-lg text-xs font-display hover-lift">Entrar por convite</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[72px_200px_1fr] gap-3">
        {/* server rail */}
        <aside className="glass-strong rounded-xl p-2 flex lg:flex-col gap-2 overflow-x-auto lg:h-[72vh] lg:overflow-y-auto">
          {mine.map((s) => (
            <button key={s.id} onClick={() => setActive(s)} title={s.name}
              className={`shrink-0 h-12 w-12 rounded-2xl grid place-items-center font-display text-sm transition overflow-hidden ${
                active?.id === s.id ? "btn-neon glow-purple" : "glass hover-lift"}`}>
              {s.icon_url
                ? <img src={s.icon_url} alt={s.name} className="h-full w-full object-cover" />
                : (s.tag || s.name).slice(0, 2).toUpperCase()}
            </button>
          ))}
          <button onClick={() => setShowCreate(true)} className="shrink-0 h-12 w-12 rounded-2xl glass grid place-items-center hover-lift">
            <Plus className="h-4 w-4" />
          </button>
        </aside>

        {/* channels */}
        <aside className="glass-strong rounded-xl p-3 space-y-3 lg:h-[72vh] overflow-y-auto">
          {!active ? (
            <div className="text-xs font-mono text-muted-foreground">Nenhum servidor selecionado.</div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm truncate">{active.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">{members.length} membro(s)</div>
                </div>
                {isOwnerOf && (
                  <button onClick={() => setShowSettings((v) => !v)} className="glass p-1.5 rounded-lg" title="Configurações">
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button onClick={() => { void navigator.clipboard.writeText(active.invite_code); toast.success("Convite copiado"); }}
                className="w-full glass px-2 py-1.5 rounded-lg text-[10px] font-mono flex items-center gap-2">
                <Copy className="h-3 w-3" /> {active.invite_code}
              </button>

              {(["text", "voice"] as const).map((kind) => (
                <div key={kind}>
                  <div className="text-[10px] uppercase font-mono text-[oklch(0.6_0.12_295)] px-1 mb-1">
                    {kind === "text" ? "Canais de texto" : "Canais de voz"}
                  </div>
                  {channels.filter((c) => c.kind === kind).map((c) => (
                    <div key={c.id} className="flex items-center gap-1">
                      <button onClick={() => kind === "text" ? setChannel(c) : toast.info(`Prévia de voz: ${c.name} (chamada em breve)`)}
                        className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono truncate transition ${
                          channel?.id === c.id ? "bg-[oklch(0.3_0.2_295/0.45)] neon-text" : "hover:bg-[oklch(0.2_0.1_295/0.35)]"}`}>
                        {kind === "text" ? <Hash className="h-3 w-3 shrink-0" /> : <Volume2 className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{c.name}</span>
                      </button>
                      {isOwnerOf && (
                        <button onClick={() => delChannel(c)} className="p-1 rounded text-[oklch(0.7_0.2_25)]"><Trash2 className="h-3 w-3" /></button>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {isOwnerOf && (
                <div className="space-y-1 pt-2 border-t border-[oklch(0.4_0.15_295/0.3)]">
                  <input value={newCh.name} onChange={(e) => setNewCh({ ...newCh, name: e.target.value })}
                    placeholder="novo-canal" className="glass w-full px-2 py-1.5 rounded text-xs font-mono" />
                  <div className="flex gap-1">
                    {(["text", "voice"] as const).map((k) => (
                      <button key={k} onClick={() => setNewCh({ ...newCh, kind: k })}
                        className={`flex-1 py-1 rounded text-[10px] font-mono ${newCh.kind === k ? "btn-neon" : "glass"}`}>
                        {k === "text" ? "Texto" : "Voz"}
                      </button>
                    ))}
                  </div>
                  <button onClick={addChannel} className="w-full glass py-1.5 rounded text-[10px] font-display">+ Criar canal</button>
                </div>
              )}

              <button onClick={() => isOwnerOf ? removeServer(active) : leave(active)}
                className="w-full glass py-1.5 rounded-lg text-[10px] font-display text-[oklch(0.75_0.2_25)] flex items-center justify-center gap-2">
                {isOwnerOf ? <><Trash2 className="h-3 w-3" /> Apagar servidor</> : <><LogOut className="h-3 w-3" /> Sair</>}
              </button>
            </>
          )}
        </aside>

        {/* chat */}
        <section className="glass-strong rounded-xl lg:h-[72vh] flex flex-col overflow-hidden">
          {showSettings && active && isOwnerOf ? (
            <div className="p-4 space-y-3 overflow-y-auto">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <h2 className="font-display text-sm flex-1">Configurações do servidor</h2>
                <button onClick={() => setShowSettings(false)} className="glass p-1.5 rounded-lg"><X className="h-3 w-3" /></button>
              </div>
              {[
                { k: "name", label: "Nome" }, { k: "tag", label: "Tag" },
                { k: "description", label: "Descrição" }, { k: "icon_url", label: "URL do ícone" },
                { k: "banner_url", label: "URL do banner" },
              ].map((f) => (
                <label key={f.k} className="block text-xs font-mono space-y-1">
                  {f.label}
                  <input value={(active as any)[f.k] ?? ""} onChange={(e) => setActive({ ...active, [f.k]: e.target.value } as Server)}
                    className="glass w-full px-2 py-2 rounded text-xs" />
                </label>
              ))}
              <label className="flex items-center gap-2 text-xs font-mono">
                <input type="checkbox" checked={active.is_public} onChange={(e) => setActive({ ...active, is_public: e.target.checked })} />
                Servidor público (aparece em Descobrir)
              </label>
              <button onClick={saveServer} className="btn-neon px-4 py-2 rounded-lg text-xs font-display">Salvar</button>
            </div>
          ) : !channel ? (
            <div className="flex-1 grid place-items-center p-6 text-center space-y-3">
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-3">Sem canal aberto. Descubra servidores públicos:</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {discover.slice(0, 8).map((s) => (
                    <div key={s.id} className="glass rounded-xl p-3 text-left">
                      <div className="font-display text-sm truncate">{s.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground line-clamp-2">{s.description ?? "Sem descrição"}</div>
                      <button onClick={() => join(s)} className="mt-2 btn-neon px-3 py-1 rounded text-[10px] font-display">Entrar</button>
                    </div>
                  ))}
                  {discover.length === 0 && <div className="text-xs font-mono text-muted-foreground">Nenhum servidor público ainda.</div>}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-[oklch(0.4_0.15_295/0.3)] flex items-center gap-2">
                <Hash className="h-4 w-4 shrink-0" />
                <div className="font-display text-sm truncate flex-1">{channel.name}</div>
                <button onClick={() => setShowMembers((v) => !v)} className="glass p-1.5 rounded-lg"><Users className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex-1 flex min-h-0">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgs.map((m) => {
                    const p = profs[m.user_id];
                    return (
                      <div key={m.id} className="flex gap-2 animate-fade-in-up">
                        <AvatarBubble url={p?.avatar_url} name={p?.display_name} size={32} effect={p?.equipped_effect} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {p?.display_name ?? p?.username ?? "usuário"} · {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          {m.attachment_url && (
                            <img src={m.attachment_url} alt="Anexo da mensagem" className="max-h-56 rounded-xl mt-1 object-cover" />
                          )}
                          <div className="text-sm break-words">{m.content}</div>
                        </div>
                        {(m.user_id === userId || isOwnerOf) && (
                          <button onClick={async () => { await supabase.from("server_messages").delete().eq("id", m.id); setMsgs((v) => v.filter((x) => x.id !== m.id)); }}
                            className="p-1 text-[oklch(0.7_0.2_25)] opacity-60 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                        )}
                      </div>
                    );
                  })}
                  {msgs.length === 0 && <div className="text-center text-xs font-mono text-muted-foreground">Canal vazio. Manda a primeira 👋</div>}
                </div>
                {showMembers && (
                  <aside className="hidden md:block w-48 border-l border-[oklch(0.4_0.15_295/0.3)] p-3 overflow-y-auto space-y-1">
                    <div className="text-[10px] uppercase font-mono text-[oklch(0.6_0.12_295)]">Membros — {members.length}</div>
                    {members.map((m) => {
                      const p = profs[m.user_id];
                      return (
                        <div key={m.id} className="flex items-center gap-2">
                          <AvatarBubble url={p?.avatar_url} name={p?.display_name} size={24} effect={p?.equipped_effect} />
                          <span className="text-xs truncate flex-1">{p?.display_name ?? "usuário"}</span>
                          {isOwnerOf && m.user_id !== userId && (
                            <button onClick={() => kick(m)} className="text-[oklch(0.7_0.2_25)]"><X className="h-3 w-3" /></button>
                          )}
                        </div>
                      );
                    })}
                  </aside>
                )}
              </div>
              {attachment && (
                <div className="p-2 border-t border-[oklch(0.4_0.15_295/0.2)] flex items-center gap-2">
                  <img src={attachment} alt="Prévia do anexo" className="h-12 w-12 rounded-lg object-cover" />
                  <button onClick={() => setAttachment(null)} className="glass p-1 rounded-lg"><X className="h-3 w-3" /></button>
                </div>
              )}
              <div className="p-3 border-t border-[oklch(0.4_0.15_295/0.3)] flex gap-2">
                <button onClick={() => fileRef.current?.click()} className="glass px-3 rounded-lg" title="Anexar imagem"><Paperclip className="h-4 w-4" /></button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={`Mensagem em #${channel.name}`} className="glass flex-1 px-3 py-2 rounded-lg text-sm font-mono" />
                <button onClick={send} className="btn-neon px-4 rounded-lg flex items-center gap-2 text-sm font-display">
                  <Send className="h-4 w-4" /> Enviar
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {showCreate && (
        <div onClick={() => setShowCreate(false)} className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4">
          <div onClick={(e) => e.stopPropagation()} className="glass-strong rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-display text-lg gradient-text">Novo servidor</h3>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nome do servidor"
              className="glass w-full px-3 py-2 rounded-lg text-sm" />
            <input value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} placeholder="Tag (ex: LRS)"
              className="glass w-full px-3 py-2 rounded-lg text-sm" />
            <input value={draft.icon_url} onChange={(e) => setDraft({ ...draft, icon_url: e.target.value })} placeholder="URL do ícone (opcional)"
              className="glass w-full px-3 py-2 rounded-lg text-sm" />
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Descrição"
              className="glass w-full px-3 py-2 rounded-lg text-sm h-20" />
            <label className="flex items-center gap-2 text-xs font-mono">
              <input type="checkbox" checked={draft.is_public} onChange={(e) => setDraft({ ...draft, is_public: e.target.checked })} />
              Público (qualquer um pode entrar)
            </label>
            <button onClick={createServer} className="w-full btn-neon py-2.5 rounded-lg font-display glow-purple">Criar servidor</button>
          </div>
        </div>
      )}
    </div>
  );
}
