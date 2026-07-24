import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Send, User as UserIcon, Plus, Trash2, Volume2, VolumeX, Download,
  UserCircle2, Sparkles, FileDown, Image as ImgIcon, X, Crown, Shield, Upload, Settings2,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { chatLuris, generateImage } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { speak, pingSound, detectTaskNoun, setVoiceProvider, setAIVoice, getVoiceProvider } from "@/lib/voice";
import { AvatarBubble } from "@/components/AvatarBubble";
import { VoiceSettings } from "@/components/VoiceSettings";

export const Route = createFileRoute("/_authenticated/chat")({ component: ChatPage });

type Msg = { role: "user" | "assistant"; content: string; imageUrl?: string; images?: string[] };

interface Conv { id: string; title: string; updated_at: string; }

const VOICE_KEY = "luris.voice";
const draftKey = (uid?: string) => `luris.draft.${uid ?? "anon"}`;
const sessionKey = (uid?: string) => `luris.session.${uid ?? "anon"}`;

const ROLE_LABEL: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner:   { label: "OWNER 👑",   icon: Crown,  color: "oklch(0.78_0.28_330)" },
  admin:   { label: "ADMIN",      icon: Shield, color: "oklch(0.7_0.28_180)" },
  premium: { label: "PREMIUM",    icon: Sparkles, color: "oklch(0.78_0.25_60)" },
  user:    { label: "FREE",       icon: UserCircle2, color: "oklch(0.7_0.05_295)" },
};

const WELCOME_USER: Msg = { role: "assistant", content: "Oi! Sou a **Luris** ✨. Bora conversar? Me pergunta o que quiser — posso te ajudar com ideias, textos e mais." };
const WELCOME_OWNER: Msg = { role: "assistant", content: "Eae Lulle 🌑✨ tô aqui. O que a gente vai fazer hoje?" };

function ChatPage() {
  const { user, role, profile, isOwner } = useAuth();
  const send = useServerFn(chatLuris);
  const genImg = useServerFn(generateImage);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const WELCOME = isOwner ? WELCOME_OWNER : WELCOME_USER;
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [smartMode, setSmartMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(VOICE_KEY);
    if (saved === "1") return true;
    if (saved === "0") return false;
    return false; // default; owner é ativado no efeito abaixo
  });
  const [plusOpen, setPlusOpen] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [imgMode, setImgMode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [sharing, setSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const [chatBg, setChatBg] = useState<{ mode: "color" | "image"; value: string } | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("luris.chat.bg");
      if (raw) { const p = JSON.parse(raw); if (p?.mode && p?.value) setChatBg({ mode: p.mode, value: p.value }); }
    } catch { /* noop */ }
  }, []);

  // Rehydrate messages/draft SCOPED to the current user (prevents cross-account leak on shared browser)
  useEffect(() => {
    if (!user) { setMessages([WELCOME]); setInput(""); return; }
    try {
      const cached = sessionStorage.getItem(sessionKey(user.id));
      setMessages(cached ? (JSON.parse(cached) as Msg[]) : [WELCOME]);
    } catch { setMessages([WELCOME]); }
    setInput(localStorage.getItem(draftKey(user.id)) ?? "");
    // Sweep any legacy unscoped keys from earlier versions
    try { sessionStorage.removeItem("luris.session"); localStorage.removeItem("luris.draft"); } catch { /* ignore */ }
  }, [user?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { localStorage.setItem(VOICE_KEY, voiceOn ? "1" : "0"); }, [voiceOn]);
  useEffect(() => { if (user) localStorage.setItem(draftKey(user.id), input); }, [input, user?.id]);
  useEffect(() => {
    if (!user) return;
    try { sessionStorage.setItem(sessionKey(user.id), JSON.stringify(messages)); } catch { /* ignore */ }
  }, [messages, user?.id]);

  // Owner: já ativa a voz da Luris (Lovable AI, shimmer) e fala o "olá" em PT-BR na primeira visita
  useEffect(() => {
    if (!isOwner || !user) return;
    // força provedor Lovable + voz feminina se ainda não escolheu
    if (getVoiceProvider() !== "lovable") setVoiceProvider("lovable");
    if (!localStorage.getItem("luris.voice.ai_voice")) setAIVoice("shimmer");
    // ativa voz por padrão se o owner nunca configurou
    if (localStorage.getItem(VOICE_KEY) == null) setVoiceOn(true);
    // saudação falada só uma vez por sessão
    const greetedKey = `luris.greeted.${user.id}`;
    if (!sessionStorage.getItem(greetedKey)) {
      sessionStorage.setItem(greetedKey, "1");
      // pequeno delay pra permitir gesto/áudio
      setTimeout(() => { speak("Eae Lulle, tô aqui contigo. O que a gente vai fazer hoje?"); }, 400);
    }
  }, [isOwner, user?.id]);


  const loadConvs = useCallback(async () => {
    const { data } = await supabase.from("conversations").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(30);
    setConvs((data ?? []) as Conv[]);
  }, []);
  useEffect(() => { if (user) loadConvs(); }, [user, loadConvs]);

  async function openConv(id: string) {
    setActiveId(id);
    const { data } = await supabase.from("messages").select("role, content").eq("conversation_id", id).order("created_at");
    setMessages(((data ?? []) as Msg[]).length ? (data as Msg[]) : [{ role: "assistant", content: "Conversa restaurada." }]);
  }

  function newChat() {
    setActiveId(null);
    setMessages([{ role: "assistant", content: "Nova conversa iniciada. Pode mandar." }]);
  }

  async function delConv(id: string) {
    await supabase.from("messages").delete().eq("conversation_id", id);
    await supabase.from("conversations").delete().eq("id", id);
    if (activeId === id) newChat();
    loadConvs();
  }

  function exportChatMd() {
    const md = messages.map(m => `### ${m.role === "user" ? "Você" : "Luris"}\n\n${m.content}\n`).join("\n---\n\n");
    const blob = new Blob([`# Conversa Luris\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `luris-chat-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportChatPdf() {
    // Abre uma janela com HTML estilizado e dispara o print → "Salvar como PDF"
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Conversa Luris</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;color:#1a1a2e;background:#fff;line-height:1.6}
  h1{border-bottom:3px solid #a855f7;padding-bottom:8px;color:#6b21a8}
  .msg{margin:18px 0;padding:14px 18px;border-radius:12px;page-break-inside:avoid}
  .user{background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;margin-left:60px}
  .assistant{background:#f3f0ff;border-left:4px solid #a855f7;margin-right:60px}
  .role{font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:0.7;margin-bottom:6px;font-weight:700}
  .meta{text-align:center;color:#888;font-size:12px;margin-top:30px;border-top:1px solid #eee;padding-top:12px}
  pre,code{background:rgba(0,0,0,0.05);padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:13px}
  @media print { body{margin:0} .msg{page-break-inside:avoid} }
</style></head><body>
<h1>🌑 Conversa Luris</h1>
${messages.map(m => `<div class="msg ${m.role}"><div class="role">${m.role === "user" ? "Você" : "Luris"}</div>${escapeHtml(m.content).replace(/\n/g,"<br>")}</div>`).join("")}
<div class="meta">Exportado em ${new Date().toLocaleString("pt-BR")} · ${messages.length} mensagens</div>
<script>setTimeout(()=>window.print(),300);</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return toast.error("Permita popups pra exportar PDF");
    w.document.write(html); w.document.close();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !user) return;
    if (!input.trim() && attachedImages.length === 0 && !imgMode) return;

    // ---------- MODO GERAR IMAGEM ----------
    if (imgMode) {
      const prompt = input.trim();
      if (!prompt) { toast.error("Escreva o que a Luris deve desenhar"); return; }
      const userMsg: Msg = { role: "user", content: `🎨 gerar imagem: ${prompt}` };
      setMessages((m) => [...m, userMsg]);
      setInput(""); setImgMode(false); setLoading(true);
      try {
        const res = await genImg({ data: { prompt } });
        if (res.error) { toast.error(res.error); return; }
        setMessages((m) => [...m, { role: "assistant", content: "Prontinho 🌑✨", imageUrl: res.image_url }]);
        pingSound();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro gerando imagem");
      } finally { setLoading(false); }
      return;
    }

    // ---------- CHAT NORMAL (com imagens opcionais anexadas) ----------
    const imgs = attachedImages.slice();
    let content = input.trim() || (imgs.length ? `(${imgs.length} imagem${imgs.length>1?"ns":""} anexada${imgs.length>1?"s":""})` : "");
    if (smartMode) {
      content = `[MODO INTELIGENTE] Analise minha pergunta abaixo, identifique os pontos mais importantes e responda de forma ESTRUTURADA, começando pelo essencial e indo até os detalhes. Use títulos, bullets e seções organizadas em markdown.\n\nPergunta: ${content}`;
    }
    const userMsg: Msg = { role: "user", content, imageUrl: imgs[0], images: imgs.length ? imgs : undefined };
    const taskNoun = detectTaskNoun(userMsg.content);
    const next: Msg[] = [...messages, userMsg];
    setMessages(next); setInput(""); setAttachedImages([]); setLoading(true);
    try {
      const res = await send({ data: { messages: next.map((m) => ({ role: m.role, content: m.content, images: m.images })) } });
      if (res.error) { toast.error(res.error); return; }
      const full = res.content;
      setMessages([...next, { role: "assistant", content: full }]);
      const asst: Msg = { role: "assistant", content: full };

      pingSound();
      if (voiceOn) speak(role === "owner" ? `Lulle, finalizei ${taskNoun}.` : `Senhor, finalizei ${taskNoun}.`);

      let convId = activeId;
      if (!convId) {
        const { data } = await supabase.from("conversations").insert({
          user_id: user.id, title: userMsg.content.slice(0, 60),
        }).select("id").single();
        convId = data?.id ?? null;
        if (convId) setActiveId(convId);
      } else {
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      }
      if (convId) {
        await supabase.from("messages").insert([
          { conversation_id: convId, role: userMsg.role, content: userMsg.content },
          { conversation_id: convId, role: asst.role, content: asst.content },
        ]);
        loadConvs();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setLoading(false); }
  }

  function onPickChatFiles(files: FileList | File[] | null | undefined) {
    if (!files) return;
    const arr = Array.from(files);
    if (!arr.length) return;
    let added = 0;
    arr.forEach((f) => {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name}: apenas imagens são aceitas por enquanto`); return; }
      if (f.size > 6 * 1024 * 1024) { toast.error(`${f.name}: máx 6MB`); return; }
      const r = new FileReader();
      r.onload = (ev) => {
        const url = String(ev.target?.result ?? "");
        if (url) setAttachedImages((prev) => (prev.length >= 4 ? prev : [...prev, url]));
      };
      r.readAsDataURL(f);
      added++;
    });
    if (added) setPlusOpen(false);
  }

  // ============ COMPARTILHAMENTO DE TELA (owner only) ============
  async function startShareScreen() {
    if (!isOwner) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 4 }, audio: false });
      screenStreamRef.current = stream;
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      screenVideoRef.current = video;
      setSharing(true);
      stream.getVideoTracks()[0].addEventListener("ended", stopShareScreen);
      toast.success("Tela compartilhada com a Luris 🖥️✨ — use 'Enviar frame' para ela olhar agora.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não consegui capturar a tela");
    }
  }
  function stopShareScreen() {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    screenVideoRef.current = null;
    setSharing(false);
  }
  function captureScreenFrame(): string | null {
    const v = screenVideoRef.current;
    if (!v) return null;
    const c = document.createElement("canvas");
    const w = Math.min(v.videoWidth || 1280, 1280);
    const scale = w / (v.videoWidth || w);
    c.width = w;
    c.height = Math.round((v.videoHeight || 720) * scale);
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7);
  }
  function attachScreenFrame() {
    const url = captureScreenFrame();
    if (!url) { toast.error("Sem frame disponível"); return; }
    setAttachedImages((prev) => (prev.length >= 4 ? prev : [...prev, url]));
    toast.success("Frame da tela anexado — mande sua pergunta agora.");
  }


  async function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    if (next) speak("Voz ativada.");
    else window.speechSynthesis?.cancel();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 h-[calc(100vh-4rem)]">
      <aside className="glass-strong rounded-2xl p-3 overflow-y-auto hidden lg:flex flex-col">
        <button onClick={() => setProfileOpen(true)} className="glass rounded-xl p-3 mb-3 flex items-center gap-3 hover-lift text-left">
          <AvatarBubble url={profile?.avatar_url} name={profile?.display_name} size={40} effect={profile?.equipped_effect ?? (isOwner ? "fx-owner-purple" : null)} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-display truncate">{profile?.display_name ?? "User"}</div>
            <div className="text-[9px] font-mono" style={{ color: ROLE_LABEL[role].color }}>{ROLE_LABEL[role].label}</div>
          </div>
        </button>

        <button onClick={newChat} className="w-full btn-neon rounded-lg py-2 mb-3 text-sm font-display flex items-center justify-center gap-2">
          <Plus className="h-3 w-3" /> Nova
        </button>

        <div className="space-y-1 flex-1 overflow-y-auto">
          {convs.map((c) => (
            <div key={c.id} className={`group flex items-center gap-1 rounded-lg ${activeId === c.id ? "bg-[oklch(0.3_0.2_295/0.4)]" : "hover:bg-[oklch(0.2_0.08_295/0.3)]"}`}>
              <button onClick={() => openConv(c.id)} className="flex-1 text-left px-2 py-2 text-xs truncate font-mono">{c.title}</button>
              <button onClick={() => delConv(c.id)} className="opacity-0 group-hover:opacity-100 px-2 text-muted-foreground hover:text-[oklch(0.7_0.25_25)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          {convs.length === 0 && <p className="text-[10px] text-muted-foreground font-mono px-2">Sem conversas salvas.</p>}
        </div>
      </aside>

      <div className="flex flex-col min-h-0">
        <header className="mb-4 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-display gradient-text">💬 Luris</h1>
            <p className="text-sm text-muted-foreground">
              Histórico salvo · {smartMode ? <span className="neon-text-cyan">Modo inteligente ON</span> : "voz e PDF disponíveis"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSmartMode(!smartMode)} title="Resposta estruturada por prioridade"
              className={`glass px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 ${smartMode ? "neon-text glow-purple" : ""}`}>
              <Sparkles className="h-3 w-3" /> Smart
            </button>
            {isOwner && (
              <>
                <button onClick={toggleVoice} title="A Luris fala comigo com a voz escolhida"
                  className={`glass px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 ${voiceOn ? "neon-text glow-purple" : ""}`}>
                  {voiceOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />} Fala comigo
                </button>
                <button onClick={() => setVoiceSettingsOpen(true)} title="Configurar voz + tutorial" className="glass px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2">
                  <Settings2 className="h-3 w-3" /> Voz✨
                </button>
              </>
            )}
            <button onClick={exportChatPdf} className="glass px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2">
              <FileDown className="h-3 w-3" /> PDF
            </button>
            <button onClick={exportChatMd} className="glass px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2">
              <Download className="h-3 w-3" /> MD
            </button>
          </div>
        </header>

        <div
          className={`flex-1 overflow-y-auto space-y-4 mb-4 p-3 rounded-2xl transition ${dragOver ? "ring-2 ring-[oklch(0.7_0.32_295)] bg-[oklch(0.3_0.2_295/0.08)]" : ""}`}
          style={chatBg ? (chatBg.mode === "color"
            ? { background: chatBg.value }
            : { backgroundImage: `linear-gradient(oklch(0.08 0.04 285 / 0.55), oklch(0.08 0.04 285 / 0.55)), url(${chatBg.value})`, backgroundSize: "cover", backgroundPosition: "center" })
            : undefined}
          onDragOver={(e) => { e.preventDefault(); if (isOwner) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            if (!isOwner) return;
            onPickChatFiles(e.dataTransfer.files);
          }}
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""} animate-fade-in-up`}>
              {m.role === "assistant" && (
                <div className={`w-9 h-9 shrink-0 rounded-full overflow-hidden glow-purple fx-wrap ${isOwner ? "fx-luris" : ""}`}>
                  <img src="/luris-icon.png" alt="Luris" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === "user" ? "btn-neon" : "glass"} whitespace-pre-wrap text-sm leading-relaxed group relative`}>
                {m.images && m.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {m.images.map((u, k) => (
                      <a key={k} href={u} target="_blank" rel="noreferrer">
                        <img src={u} alt="" className="max-w-full rounded-lg border border-[oklch(0.5_0.2_295/0.4)]" />
                      </a>
                    ))}
                  </div>
                ) : m.imageUrl ? (
                  <a href={m.imageUrl} target="_blank" rel="noreferrer">
                    <img src={m.imageUrl} alt="" className="max-w-full rounded-xl mb-2 border border-[oklch(0.5_0.2_295/0.4)]" />
                  </a>
                ) : null}
                {m.content}
                {m.role === "assistant" && isOwner && (
                  <button onClick={() => speak(m.content.replace(/[*_`#>]/g, ""))}
                    className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 glass rounded-full p-1.5 text-xs">
                    <Volume2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              {m.role === "user" && (
                <AvatarBubble url={profile?.avatar_url} name={profile?.display_name} size={36} effect={profile?.equipped_effect ?? (isOwner ? "fx-owner-purple" : null)} />
              )}
            </div>
          ))}
          {loading && <div className="glass inline-block px-4 py-2 rounded-2xl animate-pulse font-mono text-xs">Luris está pensando...</div>}
          {dragOver && (
            <div className="text-center font-mono text-xs text-[oklch(0.85_0.2_295)] py-4">
              🌑 solta a imagem aqui pra Luris ver
            </div>
          )}
          <div ref={endRef} />
        </div>

        {sharing && (
          <div className="mb-2 glass rounded-xl p-2 flex items-center gap-2 border border-[oklch(0.6_0.3_295/0.5)]">
            <Monitor className="h-4 w-4 text-[oklch(0.8_0.3_295)]" />
            <span className="text-xs font-mono flex-1">Tela sendo compartilhada com a Luris — clique em <b>Enviar frame</b> antes de perguntar.</span>
            <button type="button" onClick={attachScreenFrame} className="btn-neon px-2 py-1 rounded-lg text-[10px] font-mono">Enviar frame</button>
            <button type="button" onClick={stopShareScreen} className="glass px-2 py-1 rounded-lg text-[10px] font-mono">Parar</button>
          </div>
        )}

        {attachedImages.length > 0 && (
          <div className="mb-2 glass rounded-xl p-2 flex flex-wrap items-center gap-2">
            {attachedImages.map((src, k) => (
              <div key={k} className="relative">
                <img src={src} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setAttachedImages((prev) => prev.filter((_, i) => i !== k))}
                  className="absolute -top-1 -right-1 glass p-0.5 rounded-full"
                  aria-label="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <span className="text-xs font-mono text-muted-foreground flex-1">
              {attachedImages.length}/4 imagem(ns) · vai junto na próxima mensagem
            </span>
          </div>
        )}

        <form
          onSubmit={submit}
          onPaste={(e) => {
            if (!isOwner) return;
            const items = Array.from(e.clipboardData?.items ?? []);
            const files = items.map((i) => i.getAsFile()).filter((f): f is File => !!f && f.type.startsWith("image/"));
            if (files.length) { e.preventDefault(); onPickChatFiles(files); }
          }}
          className={`glass-strong rounded-2xl p-2 flex gap-2 glow-purple relative ${imgMode ? "ring-2 ring-[oklch(0.7_0.3_330)]" : ""}`}
        >
          <div className="relative">
            <button type="button" onClick={() => setPlusOpen((v) => !v)}
              className="btn-neon h-full px-3 rounded-xl flex items-center justify-center" title="Anexar / gerar / compartilhar tela">
              <Plus className={`h-4 w-4 transition ${plusOpen ? "rotate-45" : ""}`} />
            </button>
            {plusOpen && (
              <div className="absolute bottom-full mb-2 left-0 glass-strong rounded-xl p-2 min-w-[240px] z-20 border border-[oklch(0.5_0.25_295/0.5)] glow-purple animate-fade-in-up">
                <button type="button" onClick={() => chatFileRef.current?.click()}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[oklch(0.3_0.2_295/0.4)] flex items-center gap-2 text-xs font-mono">
                  <Upload className="h-3 w-3" /> Anexar imagem(ns) — até 4
                </button>
                {isOwner && (
                  <>
                    <button type="button" onClick={() => { setImgMode(true); setPlusOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[oklch(0.3_0.2_330/0.4)] flex items-center gap-2 text-xs font-mono">
                      <ImgIcon className="h-3 w-3" /> Gerar imagem com IA
                    </button>
                    {!sharing ? (
                      <button type="button" onClick={() => { setPlusOpen(false); startShareScreen(); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[oklch(0.3_0.2_295/0.4)] flex items-center gap-2 text-xs font-mono">
                        <Monitor className="h-3 w-3" /> Compartilhar tela / app com a Luris
                      </button>
                    ) : (
                      <button type="button" onClick={() => { setPlusOpen(false); attachScreenFrame(); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[oklch(0.3_0.2_295/0.4)] flex items-center gap-2 text-xs font-mono">
                        <Monitor className="h-3 w-3" /> Anexar frame da tela agora
                      </button>
                    )}
                    <div className="px-3 pt-1 pb-0.5 text-[9px] text-muted-foreground font-mono">
                      dica: você também pode <b>arrastar</b> imagens pra área do chat ou <b>colar</b> (Ctrl+V).
                    </div>
                  </>
                )}
                {!isOwner && (
                  <div className="px-3 py-2 text-[10px] text-muted-foreground font-mono">
                    Recursos avançados são exclusivos do Owner 👑
                  </div>
                )}
              </div>
            )}
            <input ref={chatFileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => onPickChatFiles(e.target.files)} />
          </div>
          {imgMode && (
            <div className="flex items-center gap-1 px-3 rounded-xl bg-[oklch(0.4_0.3_330/0.3)] text-xs font-mono">
              🎨 modo imagem
              <button type="button" onClick={() => setImgMode(false)} className="ml-1"><X className="h-3 w-3" /></button>
            </div>
          )}
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={imgMode ? "Descreva a imagem que a Luris deve criar..." : "Pergunte qualquer coisa à Luris..."}
            className="flex-1 bg-transparent px-4 py-3 outline-none font-body disabled:opacity-50" disabled={loading} />
          <button type="submit" disabled={loading || (!input.trim() && attachedImages.length === 0 && !imgMode)} className="btn-neon px-5 rounded-xl disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>


      {voiceSettingsOpen && <VoiceSettings onClose={() => setVoiceSettingsOpen(false)} />}

      {profileOpen && user && (
        <ProfileDrawer
          onClose={() => setProfileOpen(false)}
          role={role}
          profile={profile}
          userId={user.id}
          genImg={genImg}
        />
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c] as string));
}

/* ============ PROFILE DRAWER ============ */
function ProfileDrawer({
  onClose, role, profile, userId, genImg,
}: {
  onClose: () => void;
  role: string;
  profile: { display_name: string | null; avatar_url: string | null } | null;
  userId: string;
  genImg: (args: { data: { prompt: string } }) => Promise<{ image_url: string; error: string | null }>;
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [genPrompt, setGenPrompt] = useState("avatar cyberpunk, neon, retrato estilizado");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const roleInfo = ROLE_LABEL[role];

  async function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024) return toast.error("Imagem muito grande (máx 2MB)");
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(String(ev.target?.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function generateAvatar() {
    setGenerating(true);
    try {
      const res = await genImg({ data: { prompt: genPrompt } });
      if (res.error) toast.error(res.error);
      else if (res.image_url) { setAvatarUrl(res.image_url); toast.success("Avatar gerado!"); }
    } finally { setGenerating(false); }
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl || null,
    }).eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
    onClose();
    window.location.reload(); // recarrega useAuth profile
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 max-w-md w-full glow-purple border border-[oklch(0.5_0.25_295/0.5)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display gradient-text">Meu perfil</h2>
          <button onClick={onClose} className="glass p-1 rounded-lg"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center gap-4 mb-5">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-[oklch(0.6_0.3_295)] glow-purple" />
            : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[oklch(0.5_0.3_295)] to-[oklch(0.6_0.32_330)] flex items-center justify-center glow-purple"><UserCircle2 className="h-10 w-10 text-white" /></div>
          }
          <div>
            <div className="text-lg font-display">{displayName || "Sem nome"}</div>
            <div className="text-xs font-mono flex items-center gap-1" style={{ color: roleInfo.color }}>
              <roleInfo.icon className="h-3 w-3" /> {roleInfo.label}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">Plano: {role === "owner" || role === "premium" ? "PREMIUM ATIVO" : "FREE — upgrade pra Premium"}</div>
          </div>
        </div>

        <label className="block text-xs font-mono text-muted-foreground mb-1">Título / nome</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40}
          className="w-full glass px-3 py-2 rounded-lg text-sm mb-4 outline-none focus:ring-1 focus:ring-[oklch(0.6_0.3_295)]" />

        <div className="space-y-2 mb-4">
          <label className="block text-xs font-mono text-muted-foreground">Avatar — arraste, gere ou cole</label>

          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className="glass rounded-lg p-4 border-2 border-dashed border-[oklch(0.4_0.2_295/0.4)] hover:border-[oklch(0.6_0.3_295)] cursor-pointer text-center text-xs font-mono text-muted-foreground">
            <Upload className="h-5 w-5 mx-auto mb-1 text-[oklch(0.7_0.28_295)]" />
            Arrasta um PNG/JPG aqui (máx 2MB) ou clica
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          <div className="glass rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[oklch(0.78_0.28_330)]"><Sparkles className="h-3 w-3" /> Gerar com Luris</div>
            <textarea value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} rows={2}
              className="w-full bg-black/30 rounded p-2 text-xs font-mono outline-none resize-none" />
            <button type="button" onClick={generateAvatar} disabled={generating}
              className="w-full btn-neon rounded-lg py-2 text-xs font-display disabled:opacity-50 flex items-center justify-center gap-2">
              <ImgIcon className="h-3 w-3" /> {generating ? "Gerando..." : "Gerar avatar"}
            </button>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="w-full btn-neon rounded-lg py-3 font-display disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
