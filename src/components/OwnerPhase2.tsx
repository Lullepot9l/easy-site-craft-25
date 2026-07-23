import { useEffect, useState } from "react";
import {
  Cloud, Zap, Ghost, Bot, Music, Calendar, Radio, Brain, Box, Sparkles,
  Gamepad2, Code2, Image as ImageIcon, Mic, Trophy, Wand2, Eye, Activity,
  Rocket, Cpu, Network, Layers, Wallet, Star, Infinity,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type FeatureId =
  | "weather" | "neon_reactive" | "spectator" | "ai_assistant" | "music_player"
  | "live_events" | "ai_streaming" | "neural_systems" | "infinity_grid" | "particles"
  | "saas_builder" | "engine_builder" | "asset_gen" | "voice_clone" | "achievements_x2"
  | "wallpaper_webgl" | "cinema_hud" | "telemetry_3d" | "startup_sim" | "ai_dev_console"
  | "agent_marketplace" | "plugin_creator" | "mega_projects" | "team_auto" | "omni_systems";

interface Feature {
  id: FeatureId;
  label: string;
  desc: string;
  icon: typeof Cloud;
  category: "Visual" | "AI Pro" | "Audio/Vídeo" | "Dev" | "Premium";
  hot?: boolean;
}

const FEATURES: Feature[] = [
  { id: "weather", label: "Clima Cyberpunk", desc: "Ambiente dinâmico (chuva neon, neblina holográfica) reagindo à hora.", icon: Cloud, category: "Visual" },
  { id: "neon_reactive", label: "Energia Neon Reativa", desc: "Partículas de energia seguindo o cursor com glow magenta.", icon: Zap, category: "Visual", hot: true },
  { id: "spectator", label: "Modo Espectador Holográfico", desc: "Veja a sessão de outros usuários em modo só-leitura.", icon: Ghost, category: "Premium" },
  { id: "ai_assistant", label: "Assistente IA Flutuante", desc: "Bolha global da Luris em qualquer tela.", icon: Bot, category: "AI Pro", hot: true },
  { id: "music_player", label: "AI Music Player", desc: "Playlist gerada por IA sincronizada com seu humor.", icon: Music, category: "Audio/Vídeo" },
  { id: "live_events", label: "Eventos ao Vivo", desc: "Sistema de eventos com countdown global.", icon: Calendar, category: "Premium" },
  { id: "ai_streaming", label: "AI Streaming Mode", desc: "Overlay e cenas estilo OBS direto no browser.", icon: Radio, category: "Audio/Vídeo" },
  { id: "neural_systems", label: "Omni Neural Systems", desc: "Conjunto de modelos IA orquestrados em paralelo.", icon: Brain, category: "AI Pro", hot: true },
  { id: "infinity_grid", label: "Infinity Grid", desc: "Plano de fundo infinito com profundidade 3D.", icon: Infinity, category: "Visual" },
  { id: "particles", label: "Partículas Quantum", desc: "Sistema de partículas WebGL no fundo.", icon: Sparkles, category: "Visual" },
  { id: "saas_builder", label: "SaaS Builder IA", desc: "IA cria sistemas SaaS completos no Builder.", icon: Rocket, category: "AI Pro" },
  { id: "engine_builder", label: "Engine Builder", desc: "Crie suas próprias engines de jogo.", icon: Gamepad2, category: "Dev" },
  { id: "asset_gen", label: "Geração de Assets ∞", desc: "Imagens, ícones e modelos ilimitados.", icon: ImageIcon, category: "AI Pro" },
  { id: "voice_clone", label: "Clone de Voz", desc: "Treine sua voz e use no Companion.", icon: Mic, category: "Audio/Vídeo" },
  { id: "achievements_x2", label: "Conquistas Lendárias", desc: "Pacote extra de 50 conquistas secretas.", icon: Trophy, category: "Premium" },
  { id: "wallpaper_webgl", label: "Wallpaper Vivo WebGL", desc: "Wallpapers animados shader-based.", icon: Wand2, category: "Visual" },
  { id: "cinema_hud", label: "Cinema HUD", desc: "Modo widescreen com letterboxing.", icon: Eye, category: "Visual" },
  { id: "telemetry_3d", label: "Telemetria 3D", desc: "Métricas em globo 3D rotativo.", icon: Activity, category: "Premium" },
  { id: "startup_sim", label: "Startup Simulator", desc: "Simulador de criação de startup futurista.", icon: Rocket, category: "Premium" },
  { id: "ai_dev_console", label: "AI Dev Console", desc: "REPL com IA para Python/JS/SQL.", icon: Code2, category: "Dev", hot: true },
  { id: "agent_marketplace", label: "Marketplace de Agentes", desc: "Compre/venda agentes IA prontos.", icon: Wallet, category: "AI Pro" },
  { id: "plugin_creator", label: "Criador de Plugins", desc: "Construa extensões com IA.", icon: Layers, category: "Dev" },
  { id: "mega_projects", label: "Megaprojetos IA", desc: "Gerencie projetos com 1000+ tarefas.", icon: Network, category: "AI Pro" },
  { id: "team_auto", label: "Automação de Equipes", desc: "IA orquestra times e workflows.", icon: Cpu, category: "AI Pro" },
  { id: "omni_systems", label: "Omni Systems Premium", desc: "Pacote exclusivo Owner com tudo desbloqueado.", icon: Star, category: "Premium", hot: true },
];

const CATEGORIES = ["Visual", "AI Pro", "Audio/Vídeo", "Dev", "Premium"] as const;
const STORAGE_KEY = "luris.owner.phase2";

export function OwnerPhase2() {
  const { user } = useAuth();
  const [active, setActive] = useState<Set<FeatureId>>(() => new Set(FEATURES.map(f => f.id)));
  const [filter, setFilter] = useState<"all" | Feature["category"]>("all");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Feature | null>(null);

  useEffect(() => {
    setActive(new Set(FEATURES.map(f => f.id)));
  }, []);

  function persist(next: Set<FeatureId>) {
    setActive(new Set(next));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }

  async function toggle(f: Feature) {
    const next = new Set(active);
    const on = !next.has(f.id);
    if (on) next.add(f.id); else next.delete(f.id);
    persist(next);
    toast.success(`${f.label} ${on ? "ativado 🔥" : "desativado"}`);
    if (user) {
      await supabase.from("system_logs").insert({
        event: `phase2:${f.id}:${on ? "on" : "off"}`,
        user_id: user.id,
      });
    }
    // Side effects (visual feedback)
    if (f.id === "cinema_hud") document.body.classList.toggle("cinema-hud", on);
    if (f.id === "neon_reactive") document.body.classList.toggle("neon-reactive", on);
  }

  function activateAll() {
    persist(new Set(FEATURES.map(f => f.id)));
    toast.success("🐉 OMNI MODE: 25 features ativadas");
  }
  function deactivateAll() {
    persist(new Set());
    toast.success("Tudo desativado");
  }

  const visible = FEATURES.filter(f =>
    (filter === "all" || f.category === filter) &&
    (!query || f.label.toLowerCase().includes(query.toLowerCase()) || f.desc.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-display gradient-text flex items-center gap-2">
            <Box className="h-5 w-5" /> Phase 2 · 25 Features Owner Exclusive
          </h3>
          <p className="text-[11px] font-mono text-muted-foreground">
            {active.size}/25 ativadas · Click para alternar · Hover para detalhes
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 buscar feature..." className="glass px-3 py-1.5 rounded-lg text-xs font-mono" />
          <button onClick={activateAll} className="glass px-3 py-1.5 rounded-lg text-xs font-mono glow-magenta hover-lift">🐉 Ativar tudo</button>
          <button onClick={deactivateAll} className="glass px-3 py-1.5 rounded-lg text-xs font-mono hover-lift">Reset</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-mono ${filter === "all" ? "glow-purple ring-1 ring-[oklch(0.78_0.28_330)]" : "glass"}`}>
          Todas ({FEATURES.length})
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-full text-xs font-mono ${filter === c ? "glow-purple ring-1 ring-[oklch(0.78_0.28_330)]" : "glass"}`}>
            {c} ({FEATURES.filter(f => f.category === c).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {visible.map(f => {
          const on = active.has(f.id);
          return (
            <div key={f.id}
              onClick={() => toggle(f)}
              onMouseEnter={() => setDetail(f)}
              className={`glass p-4 rounded-xl cursor-pointer hover-lift transition relative overflow-hidden group ${on ? "ring-2 ring-[oklch(0.78_0.28_330)] glow-magenta" : ""}`}>
              {f.hot && <span className="absolute top-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.6_0.3_25)] text-white">HOT</span>}
              {on && <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.4_0.2_295/0.15)] to-[oklch(0.4_0.2_330/0.15)] pointer-events-none" />}
              <div className="flex items-start gap-3 relative">
                <div className={`p-2 rounded-lg ${on ? "bg-[oklch(0.5_0.25_330/0.3)]" : "bg-[oklch(0.3_0.1_295/0.3)]"}`}>
                  <f.icon className={`h-5 w-5 ${on ? "text-[oklch(0.85_0.25_330)]" : "text-[oklch(0.7_0.15_295)]"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm truncate">{f.label}</div>
                  <div className="text-[10px] font-mono text-muted-foreground line-clamp-2 mt-1">{f.desc}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.25_0.15_295/0.4)] text-[oklch(0.78_0.2_295)]">{f.category}</span>
                    <span className={`text-[9px] font-mono ${on ? "text-[oklch(0.85_0.25_140)]" : "text-muted-foreground"}`}>
                      ● {on ? "ATIVO" : "off"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="col-span-full text-center py-8 text-xs text-muted-foreground font-mono">
            Nenhuma feature bate com a busca.
          </div>
        )}
      </div>

      {detail && (
        <div className="glass p-3 rounded-lg text-[11px] font-mono">
          <span className="text-[oklch(0.78_0.25_330)]">{detail.label}</span> — {detail.desc}
        </div>
      )}
    </div>
  );
}
