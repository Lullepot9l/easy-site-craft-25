import { createFileRoute } from "@tanstack/react-router";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/export")({ component: ExportPage });

const MASTER_PROMPT = `# LURIS AI — Master Prompt (Brief Completo)

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

function ExportPage() {
  const [copied, setCopied] = useState(false);

  function download() {
    const blob = new Blob([MASTER_PROMPT], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "luris-ai-master-prompt.md"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Prompt baixado");
  }
  function copy() {
    navigator.clipboard.writeText(MASTER_PROMPT);
    setCopied(true);
    toast.success("Copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 max-w-4xl animate-fade-in-up">
      <header>
        <h1 className="text-3xl font-display gradient-text">📦 Exportar Master Prompt</h1>
        <p className="text-sm text-muted-foreground">Copie ou baixe o brief completo para usar em outros projetos/contas.</p>
      </header>

      <div className="flex gap-2">
        <button onClick={copy} className="btn-neon px-5 py-2 rounded-lg font-display flex items-center gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copiado" : "Copiar"}
        </button>
        <button onClick={download} className="glass px-5 py-2 rounded-lg font-display flex items-center gap-2 hover-lift">
          <Download className="h-4 w-4" /> Baixar .md
        </button>
      </div>

      <pre className="glass-strong rounded-2xl p-6 text-xs font-mono whitespace-pre-wrap max-h-[60vh] overflow-y-auto glow-purple">
        {MASTER_PROMPT}
      </pre>
    </div>
  );
}
