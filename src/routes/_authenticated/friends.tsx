import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Heart, Send, Check, X, Search, Palette, Image as ImgIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AccessDenied, LoadingShield } from "@/components/AccessDenied";
import { AvatarBubble } from "@/components/AvatarBubble";

export const Route = createFileRoute("/_authenticated/friends")({ component: Page });

interface MiniProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}
interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
}
interface DM {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}
interface Theme {
  bg_color: string;
  bg_image_url: string | null;
  bubble_color: string;
  accent_color: string;
}

const DEFAULT_THEME: Theme = {
  bg_color: "#0a0512",
  bg_image_url: null,
  bubble_color: "oklch(0.3 0.2 295 / 0.5)",
  accent_color: "oklch(0.7 0.28 295)",
};

function Page() {
  const { user, isOwner, loading } = useAuth();
  if (loading) return <LoadingShield />;
  if (!isOwner || !user) return <AccessDenied required="owner" />;
  return <FriendsView userId={user.id} />;
}

function FriendsView({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<(Friendship & { other: MiniProfile })[]>([]);
  const [requests, setRequests] = useState<(Friendship & { other: MiniProfile })[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<MiniProfile[]>([]);
  const [active, setActive] = useState<MiniProfile | null>(null);
  const [dms, setDms] = useState<DM[]>([]);
  const [text, setText] = useState("");
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [showTheme, setShowTheme] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void loadFriends(); void loadTheme(); }, []);
  useEffect(() => { if (active) void loadDMs(active.id); }, [active]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9 }); }, [dms]);

  // Realtime DMs for active conversation
  useEffect(() => {
    if (!active) return;
    const ch = supabase
      .channel(`dm-${userId}-${active.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const row = payload.new as DM;
        const isThisChat =
          (row.sender_id === userId && row.recipient_id === active.id) ||
          (row.sender_id === active.id && row.recipient_id === userId);
        if (isThisChat) setDms((prev) => [...prev, row]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [active, userId]);

  async function loadFriends() {
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (!data) return;
    const otherIds = data.map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id));
    const { data: profs } = await supabase
      .from("profiles").select("id,username,display_name,avatar_url").in("id", otherIds.length ? otherIds : ["00000000-0000-0000-0000-000000000000"]);
    const byId = new Map<string, MiniProfile>((profs ?? []).map((p) => [p.id, p as MiniProfile]));
    const enriched = data.map((f) => ({
      ...(f as Friendship),
      other: byId.get(f.requester_id === userId ? f.addressee_id : f.requester_id) ??
        { id: f.requester_id === userId ? f.addressee_id : f.requester_id, username: null, display_name: "?", avatar_url: null },
    }));
    setFriends(enriched.filter((f) => f.status === "accepted"));
    setRequests(enriched.filter((f) => f.status === "pending" && f.addressee_id === userId));
  }

  async function loadTheme() {
    const { data } = await supabase.from("owner_chat_themes").select("*").eq("user_id", userId).maybeSingle();
    if (data) setTheme({
      bg_color: data.bg_color ?? DEFAULT_THEME.bg_color,
      bg_image_url: data.bg_image_url ?? null,
      bubble_color: data.bubble_color ?? DEFAULT_THEME.bubble_color,
      accent_color: data.accent_color ?? DEFAULT_THEME.accent_color,
    });
  }

  async function saveTheme(next: Theme) {
    setTheme(next);
    await supabase.from("owner_chat_themes").upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() });
  }

  async function loadDMs(otherId: string) {
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
      .order("created_at", { ascending: true })
      .limit(200);
    setDms((data ?? []) as DM[]);
  }

  async function searchUsers() {
    if (!search.trim()) { setResults([]); return; }
    const q = search.trim();
    const { data } = await supabase
      .from("profiles").select("id,username,display_name,avatar_url")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq("id", userId).limit(10);
    setResults((data ?? []) as MiniProfile[]);
  }

  async function sendRequest(other: MiniProfile) {
    const { error } = await supabase.from("friendships").insert({
      requester_id: userId, addressee_id: other.id, status: "pending",
    });
    if (error) return toast.error(error.message);
    toast.success(`Pedido enviado para ${other.display_name}`);
    void loadFriends();
  }

  async function respond(f: Friendship, accept: boolean) {
    if (accept) {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", f.id);
      toast.success("Amigos ⚡");
    } else {
      await supabase.from("friendships").delete().eq("id", f.id);
      toast.success("Recusado");
    }
    void loadFriends();
  }

  async function sendDM() {
    if (!active || !text.trim()) return;
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: userId, recipient_id: active.id, content: body,
    });
    if (error) toast.error(error.message);
  }

  const chatStyle = useMemo(() => ({
    background: theme.bg_image_url
      ? `linear-gradient(${theme.bg_color}cc, ${theme.bg_color}cc), url(${theme.bg_image_url}) center/cover`
      : theme.bg_color,
  }), [theme]);

  return (
    <div className="animate-fade-in-up space-y-4">
      <header className="glass-strong rounded-2xl p-6 glow-magenta flex items-center gap-3">
        <Heart className="h-8 w-8 text-[oklch(0.78_0.28_330)]" />
        <div className="flex-1">
          <h1 className="text-3xl font-display neon-text-magenta">Amigos & DMs</h1>
          <p className="text-xs font-mono text-muted-foreground">Pedidos, conversas privadas em tempo real, tema custom.</p>
        </div>
        <button onClick={() => setShowTheme((v) => !v)} className="glass px-3 py-2 rounded-lg text-xs font-mono hover-lift flex items-center gap-2">
          <Palette className="h-4 w-4" /> Tema
        </button>
      </header>

      {showTheme && (
        <div className="glass-strong rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 animate-fade-in-up">
          <label className="text-xs font-mono flex flex-col gap-1">Fundo (cor)
            <input type="color" value={theme.bg_color} onChange={(e) => saveTheme({ ...theme, bg_color: e.target.value })} className="h-10 rounded bg-transparent" />
          </label>
          <label className="text-xs font-mono flex flex-col gap-1">Bolha (oklch/rgba)
            <input value={theme.bubble_color} onChange={(e) => saveTheme({ ...theme, bubble_color: e.target.value })} className="glass px-2 py-2 rounded text-xs" />
          </label>
          <label className="text-xs font-mono flex flex-col gap-1">Destaque
            <input value={theme.accent_color} onChange={(e) => saveTheme({ ...theme, accent_color: e.target.value })} className="glass px-2 py-2 rounded text-xs" />
          </label>
          <label className="text-xs font-mono flex flex-col gap-1">URL de imagem de fundo
            <div className="flex gap-1">
              <input placeholder="https://..." value={theme.bg_image_url ?? ""} onChange={(e) => saveTheme({ ...theme, bg_image_url: e.target.value || null })} className="glass px-2 py-2 rounded text-xs flex-1" />
              <button onClick={() => saveTheme({ ...theme, bg_image_url: null })} className="glass px-2 rounded" title="limpar"><X className="h-3 w-3" /></button>
            </div>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Sidebar */}
        <aside className="glass-strong rounded-xl p-3 space-y-4 h-[70vh] overflow-y-auto">
          <div>
            <div className="flex gap-1">
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                placeholder="Buscar usuário..." className="glass flex-1 px-2 py-1.5 rounded text-xs font-mono" />
              <button onClick={searchUsers} className="glass px-2 rounded"><Search className="h-3 w-3" /></button>
            </div>
            {results.length > 0 && (
              <div className="mt-2 space-y-1">
                {results.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[oklch(0.2_0.1_295/0.3)]">
                    <AvatarBubble url={u.avatar_url} name={u.display_name} size={28} />
                    <div className="flex-1 min-w-0 text-xs truncate">{u.display_name ?? u.username}</div>
                    <button onClick={() => sendRequest(u)} className="text-[10px] font-mono glass px-2 py-0.5 rounded">+ add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {requests.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-mono text-[oklch(0.7_0.2_330)] mb-1 px-1">Pedidos ({requests.length})</div>
              {requests.map((r) => (
                <div key={r.id} className="flex items-center gap-2 p-1.5 rounded glass mb-1">
                  <AvatarBubble url={r.other.avatar_url} name={r.other.display_name} size={28} />
                  <div className="flex-1 min-w-0 text-xs truncate">{r.other.display_name}</div>
                  <button onClick={() => respond(r, true)} className="p-1 rounded bg-[oklch(0.3_0.2_140/0.4)]"><Check className="h-3 w-3" /></button>
                  <button onClick={() => respond(r, false)} className="p-1 rounded bg-[oklch(0.3_0.2_25/0.4)]"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase font-mono text-[oklch(0.7_0.2_295)] mb-1 px-1">Amigos ({friends.length})</div>
            {friends.length === 0 && <div className="text-xs text-muted-foreground px-1">Nenhum ainda.</div>}
            {friends.map((f) => (
              <button key={f.id} onClick={() => setActive(f.other)}
                className={`w-full flex items-center gap-2 p-1.5 rounded mb-1 transition ${active?.id === f.other.id ? "bg-[oklch(0.3_0.25_330/0.4)]" : "hover:bg-[oklch(0.2_0.1_295/0.3)]"}`}>
                <AvatarBubble url={f.other.avatar_url} name={f.other.display_name} size={28} />
                <div className="flex-1 min-w-0 text-xs truncate text-left">{f.other.display_name}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <section className="rounded-xl overflow-hidden h-[70vh] flex flex-col border border-[oklch(0.4_0.15_295/0.3)]" style={chatStyle}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-xs font-mono text-muted-foreground">
              Selecione um amigo para conversar
            </div>
          ) : (
            <>
              <div className="px-4 py-3 glass-strong flex items-center gap-2 border-b border-[oklch(0.4_0.15_295/0.3)]">
                <AvatarBubble url={active.avatar_url} name={active.display_name} size={32} />
                <div className="font-display text-sm">{active.display_name}</div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {dms.map((m) => {
                  const mine = m.sender_id === userId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[75%] px-3 py-2 rounded-2xl text-sm animate-fade-in-up"
                        style={{ background: mine ? theme.accent_color : theme.bubble_color, color: mine ? "#0a0512" : "#f5eaff" }}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                {dms.length === 0 && <div className="text-center text-xs text-muted-foreground font-mono">Sem mensagens ainda. Diga oi 👋</div>}
              </div>
              <div className="p-3 glass-strong border-t border-[oklch(0.4_0.15_295/0.3)] flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendDM()}
                  placeholder="Mensagem..." className="glass flex-1 px-3 py-2 rounded-lg text-sm font-mono" />
                <button onClick={sendDM} className="btn-neon px-4 rounded-lg flex items-center gap-2 text-sm font-display">
                  <Send className="h-4 w-4" /> Enviar
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}