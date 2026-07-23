import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Code2, Gamepad2, Image as ImgIcon, Sparkles, Users, ShoppingBag, Shield, Zap, Cpu, Cloud, Activity } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

const CATEGORIES = [
  { title: "🧠 IA & Automação", color: "purple", items: ["Chat IA", "Assistente Neural", "IA com memória", "IA por voz", "IA treinável", "IA multimodal", "IA para empresas", "IA educacional"], to: "/chat", icon: Brain },
  { title: "💻 Desenvolvimento", color: "cyan", items: ["Script Forge", "Gerador de APIs", "Criador de bots", "IA programadora", "Debug automático", "Conversor de linguagens", "Templates", "Deploy cloud"], to: "/scriptforge", icon: Code2 },
  { title: "🎮 Roblox Universe", color: "magenta", items: ["Roblox Nexus", "Studio AI", "Marketplace Roblox", "Templates de jogos", "Assets Roblox", "Anti-exploit", "Scripts Lua/LuaU", "NPC Generator"], to: "/roblox", icon: Gamepad2 },
  { title: "🎨 Creative AI", color: "magenta", items: ["Criador de imagens", "Logos", "Wallpapers", "Thumbnails", "IA para vídeos*", "IA para músicas*", "Editor de imagens", "Upscaler HD"], to: "/images", icon: ImgIcon },
  { title: "🌐 Social Hub", color: "cyan", items: ["Feed global", "Comunidades", "Fóruns", "Equipes", "Seguidores", "Reputação", "Ranking", "Chats privados"], to: "/social", icon: Users },
  { title: "🛒 Marketplace", color: "purple", items: ["Efeitos animados de avatar", "Scripts premium", "Assets 3D", "Plugins", "Templates", "Interfaces UI", "Loja VIP", "LuCoins"], to: "/marketplace", icon: ShoppingBag },
  { title: "⚡ Ferramentas Premium", color: "purple", items: ["Tradutor IA", "OCR inteligente", "Resumidor IA", "Gerador PDF", "Apresentações", "Conversor de arquivos", "Scanner de código", "Detector de erros"], to: "/premium", icon: Zap },
  { title: "🔐 Segurança", color: "cyan", items: ["Anti spam", "Anti bot", "Proteção APIs", "Permissões", "Logs criptografados", "2FA", "Sessões seguras", "Painel de segurança"], to: "/premium", icon: Shield },
  { title: "🚀 Neural Labs (Early Access)", color: "magenta", items: ["Quantum AI", "Neural Cloud", "AI Forge", "Dragon Network", "Tokyo Grid", "Omni AI", "Hyper Automation", "AI Sandbox"], to: "/premium", icon: Cpu },
];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Brain; color: string }) {
  return (
    <div className={`glass p-5 rounded-xl hover-lift relative overflow-hidden`}>
      <Icon className={`absolute -right-3 -bottom-3 h-20 w-20 opacity-10 text-[oklch(0.65_0.3_${color})]`} />
      <div className="text-xs font-mono text-muted-foreground uppercase">{label}</div>
      <div className="text-3xl font-display gradient-text mt-1">{value}</div>
    </div>
  );
}

function Dashboard() {
  const { profile, role } = useAuth();
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-4xl font-display gradient-text">
          Bem-vindo, <span className="neon-text-magenta">{profile?.display_name ?? "User"}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Cargo: <span className="neon-text-cyan font-mono uppercase">{role}</span> · Sistema LURIS online</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="XP" value={`${profile?.xp ?? 0}`} icon={Activity} color="295" />
        <StatCard label="Nível" value={`${profile?.level ?? 1}`} icon={Sparkles} color="295" />
        <StatCard label="🪙 LuCoins" value={`${profile?.coins ?? 0}`} icon={Cloud} color="295" />
        <StatCard label="Status" value="ONLINE" icon={Cpu} color="295" />
      </div>

      <div>
        <h2 className="text-2xl font-display neon-text mb-4">◢ Ecossistema LURIS ◣</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat, i) => (
            <Link key={i} to={cat.to} className="glass p-5 rounded-xl hover-lift block animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <cat.icon className="h-6 w-6 text-[oklch(0.78_0.28_330)]" />
                <h3 className="font-display text-lg gradient-text">{cat.title}</h3>
              </div>
              <ul className="text-xs space-y-1 text-[oklch(0.85_0.08_295)] font-mono">
                {cat.items.map((it) => (
                  <li key={it} className="flex items-center gap-2"><span className="neon-text-cyan">▸</span>{it}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-4 font-mono">* recursos marcados precisam de APIs externas pagas (Runway, Suno) — UI pronta, integração sob demanda.</p>
      </div>
    </div>
  );
}
