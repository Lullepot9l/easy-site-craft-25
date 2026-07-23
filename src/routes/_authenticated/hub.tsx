import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Volume2, VolumeX, Zap, MessageSquare, Image as ImgIcon, Code2, Gamepad2, ShoppingBag, Users, Crown, Terminal, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { chatLuris } from "@/lib/chat.functions";
import { speak, pingSound } from "@/lib/voice";
import { AccessDenied, LoadingShield } from "@/components/AccessDenied";

export const Route = createFileRoute("/_authenticated/hub")({ component: Hub });

type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: unknown) => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void;
};

const QUICK = [
  { to: "/chat", icon: MessageSquare, label: "Chat", color: "oklch(0.7_0.28_295)" },
  { to: "/images", icon: ImgIcon, label: "Imagens", color: "oklch(0.7_0.3_330)" },
  { to: "/scriptforge", icon: Code2, label: "Forge", color: "oklch(0.7_0.25_180)" },
  { to: "/roblox", icon: Gamepad2, label: "Roblox", color: "oklch(0.7_0.28_25)" },
  { to: "/marketplace", icon: ShoppingBag, label: "Market", color: "oklch(0.7_0.25_60)" },
  { to: "/social", icon: Users, label: "Social", color: "oklch(0.7_0.25_140)" },
  { to: "/owner", icon: Crown, label: "Owner", color: "oklch(0.75_0.3_20)" },
  { to: "/nexus", icon: Terminal, label: "Nexus", color: "oklch(0.7_0.28_295)" },
] as const;

function Hub() {
  const { isOwner, role, loading, profile } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(chatLuris);

  const [booting, setBooting] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const isAdmin = role === "owner" || role === "admin";

  // sem auto-redirect — mostra AccessDenied para feedback claro
  void navigate;

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // Saudação ao entrar
  useEffect(() => {
    if (!booting && voiceOn && isAdmin) {
      const name = isOwner ? "Lulle" : "comandante";
      setTimeout(() => speak(`Hub Luris online. Bem-vindo de volta, ${name}.`), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting]);

  const [continuous, setContinuous] = useState(false);
  const continuousRef = useRef(false);

  function buildRec(): SpeechRecognitionLike | null {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SR) { toast.error("Reconhecimento de voz não suportado neste navegador"); return null; }
    const rec = new SR();
    rec.lang = "pt-BR"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      handleVoiceCommand(text);
    };
    rec.onerror = () => { /* swallow; onend reinicia se contínuo */ };
    rec.onend = () => {
      setListening(false);
      if (continuousRef.current) {
        setTimeout(() => { try { rec.start(); setListening(true); } catch { /* já rodando */ } }, 500);
      }
    };
    return rec;
  }

  function startListening() {
    const rec = buildRec();
    if (!rec) return;
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { /* ignore */ }
  }

  function stopListening() {
    continuousRef.current = false;
    setContinuous(false);
    recRef.current?.stop();
    setListening(false);
  }

  function toggleContinuous() {
    const next = !continuous;
    setContinuous(next);
    continuousRef.current = next;
    if (next) startListening();
    else stopListening();
  }

  async function handleVoiceCommand(text: string) {
    const t = text.toLowerCase();
    // Comandos de navegação
    const routes: Record<string, string> = {
      "chat": "/chat", "conversa": "/chat",
      "imagem": "/images", "imagens": "/images",
      "forge": "/scriptforge", "script": "/scriptforge",
      "roblox": "/roblox", "marketplace": "/marketplace", "mercado": "/marketplace",
      "social": "/social", "owner": "/owner", "nexus": "/nexus",
      "dashboard": "/dashboard", "início": "/dashboard",
    };
    for (const [key, path] of Object.entries(routes)) {
      if (t.includes("abrir " + key) || t.includes("ir para " + key) || t.includes("abre " + key)) {
        if (voiceOn) speak(`Abrindo ${key}.`);
        navigate({ to: path });
        return;
      }
    }
    // Caso contrário, manda pra Luris responder
    setBusy(true);
    try {
      const res = await send({ data: { messages: [{ role: "user", content: text }] } });
      if (res.error) { toast.error(res.error); return; }
      setReply(res.content);
      pingSound();
      if (voiceOn) speak(res.content.slice(0, 400));
    } finally { setBusy(false); }
  }

  if (loading) return <LoadingShield />;
  if (!isAdmin) return <AccessDenied required="admin/owner" />;


  if (booting) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[oklch(0.6_0.32_295/0.4)] blur-3xl animate-pulse" />
          <div className="relative w-32 h-32 rounded-full border-2 border-[oklch(0.7_0.28_295)] flex items-center justify-center animate-spin-slow">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[oklch(0.7_0.3_330)] animate-spin" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
            <Sparkles className="absolute h-10 w-10 text-[oklch(0.85_0.25_295)] animate-pulse" />
          </div>
        </div>
        <div className="font-display text-2xl gradient-text tracking-[0.4em] animate-pulse">INICIANDO HUB</div>
        <div className="font-mono text-xs text-[oklch(0.7_0.15_295)] flex gap-2">
          <span className="animate-pulse">▰</span>
          <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>▰</span>
          <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>▰</span>
          <span className="animate-pulse" style={{ animationDelay: "0.6s" }}>▰</span>
          <span className="animate-pulse" style={{ animationDelay: "0.8s" }}>▰</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header com logo animada */}
      <header className="glass-strong rounded-2xl p-6 border border-[oklch(0.5_0.2_295/0.3)] glow-purple relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[oklch(0.6_0.32_295/0.2)] blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[oklch(0.6_0.3_330/0.2)] blur-3xl animate-pulse" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="relative">
                <Zap className="h-8 w-8 text-[oklch(0.85_0.25_295)] animate-pulse" />
                <div className="absolute inset-0 blur-md bg-[oklch(0.7_0.3_295)] -z-10" />
              </div>
              <h1 className="text-4xl font-display gradient-text tracking-wide">LURIS HUB</h1>
            </div>
            <p className="text-sm text-[oklch(0.7_0.1_295)] font-mono">
              Painel central · {role.toUpperCase()} · {profile?.display_name ?? "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setVoiceOn(v => !v)}
              className={`glass px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 ${voiceOn ? "neon-text-cyan" : "opacity-50"}`}>
              {voiceOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              Voz {voiceOn ? "ON" : "OFF"}
            </button>
            <button onClick={toggleContinuous}
              className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 ${continuous ? "bg-[oklch(0.6_0.3_140)] text-white animate-pulse" : "glass"}`}>
              ∞ {continuous ? "Auto ON" : "Auto OFF"}
            </button>
            <button onClick={listening ? stopListening : startListening}
              className={`px-4 py-2 rounded-lg text-xs font-display flex items-center gap-2 transition ${
                listening ? "bg-[oklch(0.6_0.3_25)] text-white animate-pulse" : "btn-neon"
              }`}>
              {listening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              {listening ? "Escutando..." : "Falar com Luris"}
            </button>
          </div>
        </div>
      </header>

      {/* Grid de acessos rápidos */}
      <section>
        <h2 className="text-sm font-mono uppercase text-[oklch(0.7_0.15_295)] mb-3 tracking-wider">⚡ Acesso rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK.map((q, i) => (
            <Link key={q.to} to={q.to}
              className="glass-strong rounded-xl p-4 hover-lift border border-[oklch(0.4_0.15_295/0.3)] hover:border-[oklch(0.7_0.28_295)] transition group animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}>
              <q.icon className="h-6 w-6 mb-2 group-hover:scale-110 transition" style={{ color: q.color }} />
              <div className="font-display text-sm">{q.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Console da Luris */}
      <section className="glass-strong rounded-2xl p-5 border border-[oklch(0.5_0.2_330/0.3)] glow-magenta">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display neon-text-magenta flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Console Luris
          </h2>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-[oklch(0.7_0.28_295)]" />}
        </div>
        {transcript && (
          <div className="text-xs font-mono mb-2 text-[oklch(0.8_0.1_295)]">
            🎙️ <span className="text-[oklch(0.7_0.15_295)]">você:</span> {transcript}
          </div>
        )}
        {reply ? (
          <div className="glass rounded-lg p-3 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">{reply}</div>
        ) : (
          <div className="text-xs text-muted-foreground font-mono">
            Clique no microfone e diga: <span className="neon-text-cyan">"abrir chat"</span>,{" "}
            <span className="neon-text-cyan">"abrir forge"</span>, ou faça uma pergunta direta.
          </div>
        )}
      </section>

      <p className="text-[10px] text-center text-muted-foreground font-mono">
        🌑 Luris Hub v1.0 · acesso restrito · {new Date().toLocaleTimeString("pt-BR")}
      </p>
    </div>
  );
}
