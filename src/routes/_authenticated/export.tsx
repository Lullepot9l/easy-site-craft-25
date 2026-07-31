import { createFileRoute } from "@tanstack/react-router";
import { Download, Copy, Check, RefreshCw, Upload, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { liveExportSnapshot, importAccountSnapshot } from "@/lib/export.functions";

export const Route = createFileRoute("/_authenticated/export")({
  component: ExportPage,
  head: () => ({
    meta: [
      { title: "Exportar & Importar — Luris AI" },
      { name: "description", content: "Exporte seu perfil, memórias e conversas da Luris ao vivo ou importe tudo em outra conta ou outro app de IA." },
      { property: "og:title", content: "Exportar & Importar — Luris AI" },
      { property: "og:description", content: "Snapshot ao vivo da sua conta Luris: markdown, JSON e prompt portátil para ChatGPT, Claude, Gemini e mais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Snapshot = Awaited<ReturnType<typeof liveExportSnapshot>>;

const ARCH = `# LURIS AI — Master Prompt (Brief Completo)

Plataforma IA cyberpunk Tóquio com:
- Tema dark futurista (#03080F bg, roxo #8B5CF6, magenta #D946EF, cyan #00D4FF)
- Fontes: Orbitron (títulos), Rajdhani (UI), JetBrains Mono (código)
- Glassmorphism, glow neon, partículas, grid cyberpunk, scanlines
- i18n PT-BR / EN com preços R$ ↔ USD

## Auth
- Email/senha + Google OAuth via Lovable Cloud
- Roles: user / premium / admin / owner
- Owner: lullepot9l@gmail.com (auto-atribuído via trigger no signup)
- Tabela user_roles separada (nunca em profiles) com has_role() SECURITY DEFINER

## Schema Postgres
- profiles (id, username, display_name, avatar_url, xp, level, coins, is_verified)
- user_roles (user_id, role app_role)
- conversations + messages (chat IA)
- generated_images
- social_posts
- marketplace_items
- system_logs (owner-only)

## Módulos (UI completa)
🧠 IA: Chat IA, Assistente Neural, IA voz/memória/multimodal
💻 Dev: Script Forge, Gerador APIs/bots, IA programadora, Debug
🎮 Roblox: Nexus, Studio AI, NPC Generator, Lua/LuaU scripts
🎨 Creative: Imagens, Logos, Wallpapers, Thumbnails, Upscaler
🌐 Social: Feed, Comunidades, Fóruns, Ranking, Reputação
🛒 Marketplace: Scripts/Assets/Plugins premium, Coins, VIP
⚡ Premium: Tradutor, OCR, Resumidor, PDF, Apresentações
🔐 Segurança: Anti-spam/bot, 2FA, Logs criptografados, Permissões
🚀 Labs: Quantum AI, Neural Cloud, Dragon Network, Tokyo Grid

## Painel Owner Exclusivo
- Tema Dragão Tóquio com dragões neon, chuva cyberpunk, HUD holográfica
- Gerenciar usuários, banir, mudar roles
- Analytics em tempo real
- Terminal cyberpunk
- Logs criptografados
- Controle de marketplace
- Modo God Mode (Shift+L)

## Stack Real Usado
- Frontend: TanStack Start + React 19 + TailwindCSS v4 + Framer-style animations
- Backend: TanStack Server Functions (não Edge Functions)
- DB: Lovable Cloud (Supabase Postgres)
- IA: Lovable AI Gateway → google/gemini-3-flash-preview (chat), google/gemini-2.5-flash-image (imagens)
- Auth: Supabase Auth + Google OAuth via Lovable broker

## Variáveis de Ambiente Necessárias
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_URL (server)
- SUPABASE_PUBLISHABLE_KEY (server)
- SUPABASE_SERVICE_ROLE_KEY (server, admin)
- LOVABLE_API_KEY (server, IA)

## Recursos NÃO funcionais (UI mockada — precisam de APIs pagas)
- Gerador de vídeo IA → Runway/Pika
- Gerador de música → Suno/ElevenLabs  
- Voz Jarvis TTS premium → ElevenLabs
- Login Roblox OAuth → não oferecido publicamente pela Roblox
- App mobile / desktop launcher → Lovable é web-only
`;

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function buildMarkdown(s: Snapshot) {
  const p = s.profile ?? {};
  const mem = s.memory ?? [];
  const cats = Object.entries(s.marketplace.by_category)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  return `${ARCH}
## SNAPSHOT AO VIVO — gerado em ${fmtDate(s.generated_at)}

### Conta
- Papel: ${s.role}
- Nome: ${p.display_name ?? "—"} (@${p.username ?? "—"}) | codinome: ${p.codename ?? "—"}
- Nível ${p.level ?? 0} · ${p.xp ?? 0} XP · ${p.coins ?? 0} LuCoins
- Status: ${p.activity_status ?? "—"} · Jogando: ${p.current_game || "—"}
- Jogos favoritos: ${(p.favorite_games ?? []).join(", ") || "—"}
- Estilo: cor ${p.name_color ?? "—"}, fonte ${p.name_font ?? "—"}, tema ${p.profile_theme ?? "—"}, efeito ${p.equipped_effect ?? "—"}
- Bio: ${p.bio ?? "—"}

### Prompt atual da Luris (banco, ao vivo)
${(s.luris_settings?.system_prompt as string) ?? "—"}

Personalidade: ${(s.luris_settings?.personality as string) ?? "—"}

### Memórias da Luris sobre você (${mem.length})
${mem.map((m) => `- ${m.memory_key}: ${m.memory_value}`).join("\n") || "- (nenhuma)"}

### Conversas (${s.conversations.length}) · mensagens (${s.messages.length})
${s.conversations.slice(0, 30).map((c) => `- ${c.title} — ${fmtDate(c.updated_at as string)}`).join("\n") || "- (nenhuma)"}

### Marketplace ao vivo (${s.marketplace.total} itens)
${cats || "- (vazio)"}

### Imagens geradas (${s.generated_images.length})
${s.generated_images.slice(0, 10).map((i) => `- ${i.prompt}`).join("\n") || "- (nenhuma)"}
`;
}

function buildPortablePrompt(s: Snapshot) {
  const p = s.profile ?? {};
  const mem = s.memory ?? [];
  const lastMsgs = s.messages.slice(-40);
  return `Você agora é a LURIS — assistente pessoal cyberpunk feminina, direta, criativa, com humor. Responde em português brasileiro, usa markdown quando útil. Data atual: ${fmtDate(s.generated_at)}.

${(s.luris_settings?.system_prompt as string) ?? ""}

=== QUEM É O USUÁRIO ===
Nome: ${p.display_name ?? "—"} (@${p.username ?? "—"}) | codinome: ${p.codename ?? "—"}
Bio: ${p.bio ?? "—"}
Status: ${p.activity_status ?? "—"} | Jogos favoritos: ${(p.favorite_games ?? []).join(", ") || "—"}
Papel na plataforma: ${s.role}

=== O QUE VOCÊ JÁ SABE SOBRE ELE ===
${mem.map((m) => `• ${m.memory_key}: ${m.memory_value}`).join("\n") || "• (nada ainda)"}

=== CONTEXTO RECENTE DAS CONVERSAS ===
${lastMsgs.map((m) => `${m.role === "user" ? "Usuário" : "Luris"}: ${String(m.content).slice(0, 400)}`).join("\n") || "(sem histórico)"}

Continue a conversa mantendo essa personalidade e essas memórias. Cole este texto como instrução de sistema no ChatGPT, Claude, Gemini, Grok ou qualquer outro app de IA.`;
}

const FORMATS = [
  { id: "md", label: "Brief .md", ext: "md", mime: "text/markdown" },
  { id: "json", label: "Backup .json", ext: "json", mime: "application/json" },
  { id: "prompt", label: "Prompt p/ outras IAs", ext: "txt", mime: "text/plain" },
] as const;
type FormatId = (typeof FORMATS)[number]["id"];

function ExportPage() {
  const load = useServerFn(liveExportSnapshot);
  const runImport = useServerFn(importAccountSnapshot);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<FormatId>("md");
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parts, setParts] = useState({ profile: true, memory: true, conversations: true, backgrounds: true });
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await load({});
      setSnap(s);
    } catch {
      toast.error("Não consegui carregar o snapshot ao vivo");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => { void refresh(); }, [refresh]);

  const text = useMemo(() => {
    if (!snap) return "Carregando dados ao vivo…";
    if (format === "json") return JSON.stringify(snap, null, 2);
    if (format === "prompt") return buildPortablePrompt(snap);
    return buildMarkdown(snap);
  }, [snap, format]);

  const meta = FORMATS.find((f) => f.id === format)!;

  function download() {
    const blob = new Blob([text], { type: meta.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `luris-${format}-${new Date().toISOString().slice(0, 10)}.${meta.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo baixado");
  }

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  async function onFile(file: File) {
    setImporting(true);
    try {
      const payload = JSON.parse(await file.text());
      const res = await runImport({ data: { payload, parts } });
      if (!res.ok) throw new Error(res.error ?? "falhou");
      toast.success(res.report.join(" · ") || "Nada para importar");
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "JSON inválido");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in-up">
      <header>
        <h1 className="text-3xl font-display gradient-text">📦 Exportar & Importar</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot <span className="text-primary">ao vivo</span> da sua conta — perfil, memórias, conversas e Marketplace. Leve para outra conta ou para outro app de IA.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`px-4 py-2 rounded-lg font-display text-sm transition hover-lift ${format === f.id ? "btn-neon" : "glass"}`}
          >
            {f.label}
          </button>
        ))}
        <button onClick={() => void refresh()} className="glass px-4 py-2 rounded-lg font-display text-sm flex items-center gap-2 hover-lift">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="btn-neon px-5 py-2 rounded-lg font-display flex items-center gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copiado" : "Copiar"}
        </button>
        <button onClick={download} className="glass px-5 py-2 rounded-lg font-display flex items-center gap-2 hover-lift">
          <Download className="h-4 w-4" /> Baixar .{meta.ext}
        </button>
      </div>

      {snap && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ["Memórias", snap.memory.length],
            ["Conversas", snap.conversations.length],
            ["Mensagens", snap.messages.length],
            ["Itens loja", snap.marketplace.total],
          ].map(([k, v]) => (
            <div key={k as string} className="glass rounded-xl p-3 text-center">
              <div className="text-xl font-display gradient-text">{v as number}</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{k as string}</div>
            </div>
          ))}
        </div>
      )}

      <pre className="glass-strong rounded-2xl p-6 text-xs font-mono whitespace-pre-wrap max-h-[50vh] overflow-y-auto glow-purple">
        {text}
      </pre>

      <section className="glass-strong rounded-2xl p-6 space-y-3">
        <h2 className="text-xl font-display">📥 Importar para esta conta</h2>
        <p className="text-sm text-muted-foreground">
          Envie um <code>luris-json-*.json</code> exportado de outra conta. O que estiver marcado é aplicado nesta conta.
        </p>
        <div className="flex flex-wrap gap-3">
          {([
            ["profile", "Perfil e estilo"],
            ["memory", "Memórias da Luris"],
            ["conversations", "Conversas"],
            ["backgrounds", "Fundo de chat"],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={parts[k]}
                onChange={(e) => setParts((prev) => ({ ...prev, [k]: e.target.checked }))}
                className="accent-primary h-4 w-4"
              />
              {label}
            </label>
          ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }}
        />
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void onFile(f); }}
          onClick={() => fileRef.current?.click()}
          className="border border-dashed border-primary/40 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition"
        >
          {importing ? (
            <span className="flex items-center justify-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Importando…</span>
          ) : (
            <span className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Upload className="h-4 w-4" /> Arraste o .json aqui ou clique para escolher</span>
          )}
        </div>
      </section>
    </div>
  );
}
