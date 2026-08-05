import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Zap, Shield, Brain, Code2, Image as ImgIcon, Gamepad2,
  Users, ShoppingBag, MessageSquare, Mic, FileText, Cpu, Palette,
  Bot, Globe, Lock, Crown, Rocket,
} from "lucide-react";
import { CyberBackground } from "@/components/CyberBackground";
import { LurisLogo } from "@/components/LurisLogo";
import { InstallApp } from "@/components/InstallApp";
import { MobileModeToggle } from "@/components/MobileModeToggle";
import { useI18n } from "@/lib/i18n";


export const Route = createFileRoute("/")({ component: Landing });

const CATEGORIES = [
  {
    title: "IA & Conversação",
    color: "oklch(0.7_0.28_295)",
    items: [
      { icon: MessageSquare, label: "Chat Luris", desc: "Conversas com memória" },
      { icon: Bot, label: "Assistente Neural", desc: "Multimodal & contexto" },
      { icon: Mic, label: "Voz personalizada", desc: "Ei Luris, finalizei" },
      { icon: FileText, label: "Resumos & PDFs", desc: "Exporta tudo" },
    ],
  },
  {
    title: "Creative AI",
    color: "oklch(0.78_0.28_330)",
    items: [
      { icon: ImgIcon, label: "Geração de imagens", desc: "Logos, wallpapers, art" },
      { icon: Palette, label: "Editor visual", desc: "Estilos & filtros" },
      { icon: Sparkles, label: "Thumbnails HD", desc: "Upscaler integrado" },
      { icon: Globe, label: "Sites instantâneos", desc: "Builder Luris" },
    ],
  },
  {
    title: "Dev & Automação",
    color: "oklch(0.7_0.25_210)",
    items: [
      { icon: Code2, label: "Script Forge", desc: "Editor IDE + IA" },
      { icon: Cpu, label: "Bots & APIs", desc: "Conectores prontos" },
      { icon: Gamepad2, label: "Roblox Nexus", desc: "Lua/LuaU + NPC AI" },
      { icon: Zap, label: "Deploy 1-click", desc: "Cloud nativo" },
    ],
  },
  {
    title: "Social & Marketplace",
    color: "oklch(0.78_0.25_60)",
    items: [
      { icon: Users, label: "Feed & clãs", desc: "Comunidades ativas" },
      { icon: ShoppingBag, label: "Marketplace", desc: "Scripts, assets, UI" },
      { icon: Crown, label: "Battle Pass", desc: "Tiers premium" },
      { icon: Shield, label: "Reputação", desc: "Ranking global" },
    ],
  },
];

function Landing() {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="min-h-screen relative">
      <CyberBackground />

      <header className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-6 relative z-10">
        <LurisLogo />
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button onClick={() => setLang(lang === "pt" ? "en" : "pt")} className="px-3 py-1 rounded-md glass text-sm font-mono">
            {lang === "pt" ? "PT 🇧🇷" : "EN 🇺🇸"}
          </button>
          <Link to="/login" className="px-5 py-2 btn-neon rounded-lg font-display text-sm">
            {t("auth.login")}
          </Link>
        </div>
      </header>


      <main className="px-6 md:px-8 pt-8 pb-24 max-w-7xl mx-auto relative z-10">
        {/* HERO ORGANIZADO — sem raio, dois lados balanceados */}
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-10 items-center mt-6 mb-16 md:mb-20">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-mono neon-text-cyan mb-6">
              <Sparkles className="h-3 w-3" /> {t("landing.tag")} · v2.0
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-black gradient-text leading-[1.05]">
              LURIS<span className="neon-text-magenta">·</span>AI
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-xl font-body leading-relaxed">
              Assistente pessoal cyberpunk em português. Chat com memória, geração de imagens,
              builder de sites, marketplace e battle pass — tudo num só ecossistema.
            </p>
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <Link to="/login" className="px-7 py-3 btn-neon rounded-xl font-display text-base inline-flex items-center gap-2">
                <Rocket className="h-4 w-4" /> Entrar grátis
              </Link>
              <a href="#categorias" className="px-7 py-3 rounded-xl glass hover-lift font-display text-base">
                Ver recursos
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="h-3 w-3 text-[oklch(0.7_0.25_140)]" /> Auth seguro</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-[oklch(0.78_0.25_60)]" /> IA Gemini</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-[oklch(0.78_0.28_295)]" /> Premium</span>
            </div>
          </div>

          {/* card de apresentação à direita — substitui o "raio" */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <div className="absolute -inset-2 bg-gradient-to-br from-[oklch(0.5_0.3_295/0.4)] to-[oklch(0.55_0.32_330/0.4)] rounded-3xl blur-2xl" />
            <div className="relative glass-strong rounded-3xl p-6 border border-[oklch(0.4_0.2_295/0.5)]">
              <div className="flex items-center gap-3 pb-3 border-b border-[oklch(0.4_0.2_295/0.3)]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.6_0.3_295)] to-[oklch(0.6_0.32_330)] flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-display text-sm gradient-text">Luris</div>
                  <div className="text-[10px] font-mono text-[oklch(0.7_0.2_140)]">● online</div>
                </div>
              </div>
              <div className="space-y-3 pt-4 text-sm">
                <div className="glass rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                  Oi! Sou a Luris 🌑 — posso conversar, gerar imagens, escrever scripts e até criar sites pra você.
                </div>
                <div className="btn-neon rounded-2xl rounded-tr-sm p-3 max-w-[85%] ml-auto text-xs font-mono">
                  Cria uma logo cyberpunk pro meu app
                </div>
                <div className="glass rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                  Fechado. Vou usar tons neon roxo/magenta. <span className="neon-text-cyan">Gerando agora...</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {["Chat", "Imagens", "Sites"].map(x => (
                    <div key={x} className="glass rounded-lg p-2 text-center text-[10px] font-mono uppercase">{x}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIAS DA LURIS — organizadas */}
        <section id="categorias" className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-display gradient-text">O que a Luris faz</h2>
            <p className="text-sm text-muted-foreground mt-2 font-mono">4 categorias · 16 capacidades principais</p>
          </div>

          {CATEGORIES.map((cat, ci) => (
            <div key={cat.title} className="animate-fade-in-up" style={{ animationDelay: `${ci * 80}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[oklch(0.4_0.2_295/0.5)]" />
                <h3 className="font-display text-lg uppercase tracking-widest" style={{ color: cat.color }}>{cat.title}</h3>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[oklch(0.4_0.2_295/0.5)]" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {cat.items.map((it) => (
                  <div key={it.label} className="glass p-4 rounded-xl hover-lift border border-[oklch(0.3_0.15_295/0.3)]">
                    <it.icon className="h-6 w-6 mb-2" style={{ color: cat.color }} />
                    <div className="font-display text-sm">{it.label}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-1">{it.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* CTA final */}
        <section className="mt-20 glass-strong rounded-3xl p-10 text-center glow-purple border border-[oklch(0.4_0.2_295/0.4)] animate-fade-in-up">
          <h2 className="text-3xl font-display gradient-text">Bora começar?</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Cria sua conta em 10 segundos. Ganha 100 coins iniciais pra testar imagens e marketplace.
          </p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 px-8 py-3 btn-neon rounded-xl font-display animate-pulse-glow">
            <Rocket className="h-4 w-4" /> Entrar na Luris
          </Link>
        </section>
      </main>
    </div>
  );
}
