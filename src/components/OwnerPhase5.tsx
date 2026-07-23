import { useEffect, useState } from "react";
import {
  Atom, Binary, Bird, Bitcoin, BookOpen, Brain, Bug, Camera, Cog, Compass,
  Crosshair, Diamond, Dna, Earth, Eye, Fingerprint, Ghost, Headphones,
  Joystick, Key, Layers3, Microscope, Moon, Orbit, Puzzle, Radar, Radio,
  Rocket, Satellite, Scan, ServerCog, Shield, Snowflake, Sparkles, Sun,
  Telescope, Trophy, Webhook, Wifi, Wind, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type FeatureId =
  | "neural_overdrive" | "dream_engine" | "telepathy_link" | "memory_palace" | "psyche_lab"
  | "ghost_browser" | "stealth_proxy" | "phantom_logs" | "shadow_ops" | "anti_detect"
  | "satellite_view" | "orbital_radar" | "deepspace_index" | "telescope_ai" | "cosmic_compass"
  | "bio_scanner" | "dna_forge" | "wellness_oracle" | "pulse_monitor" | "fingerprint_id"
  | "crypto_oracle" | "alpha_signals" | "yield_engine" | "nft_studio" | "dao_console"
  | "soundscape_ai" | "tour_director" | "arena_mode" | "trophy_room" | "luris_legend";

interface Feature {
  id: FeatureId;
  label: string;
  desc: string;
  icon: typeof Brain;
  category: "Neural" | "Stealth" | "Cosmos" | "Bio" | "Finance" | "Legendary";
  hot?: boolean;
}

const FEATURES: Feature[] = [
  { id: "neural_overdrive", label: "Neural Overdrive", desc: "Boosta o raciocínio das IAs com chain-of-thought estendido.", icon: Brain, category: "Neural", hot: true },
  { id: "dream_engine",     label: "Dream Engine",     desc: "Gera narrativas oníricas e cenários surreais sob demanda.", icon: Moon, category: "Neural" },
  { id: "telepathy_link",   label: "Telepathy Link",   desc: "Sincroniza contexto entre múltiplas abas em tempo real.", icon: Webhook, category: "Neural" },
  { id: "memory_palace",    label: "Memory Palace",    desc: "Arquitetura de memória de longo prazo em camadas.", icon: BookOpen, category: "Neural" },
  { id: "psyche_lab",       label: "Psyche Lab",       desc: "Perfis psicológicos simulados para personas IA.", icon: Microscope, category: "Neural" },

  { id: "ghost_browser",    label: "Ghost Browser",    desc: "Navegação fantasma sem rastros locais.", icon: Ghost, category: "Stealth", hot: true },
  { id: "stealth_proxy",    label: "Stealth Proxy",    desc: "Rotação de identidade simulada por requisição.", icon: Shield, category: "Stealth" },
  { id: "phantom_logs",     label: "Phantom Logs",     desc: "Logs efêmeros que se auto-destroem após leitura.", icon: Bug, category: "Stealth" },
  { id: "shadow_ops",       label: "Shadow Ops",       desc: "Operações ocultas executadas em background.", icon: Eye, category: "Stealth" },
  { id: "anti_detect",      label: "Anti-Detect",      desc: "Modo invisível contra crawlers e fingerprinting.", icon: Fingerprint, category: "Stealth" },

  { id: "satellite_view",   label: "Satellite View",   desc: "Painel orbital de status global dos serviços.", icon: Satellite, category: "Cosmos" },
  { id: "orbital_radar",    label: "Orbital Radar",    desc: "Radar de eventos em tempo real do ecossistema.", icon: Radar, category: "Cosmos" },
  { id: "deepspace_index",  label: "Deep Space Index", desc: "Indexador profundo de conteúdo do app.", icon: Orbit, category: "Cosmos" },
  { id: "telescope_ai",     label: "Telescope AI",     desc: "Visão futurista — projeta tendências e métricas.", icon: Telescope, category: "Cosmos" },
  { id: "cosmic_compass",   label: "Cosmic Compass",   desc: "Roteamento inteligente entre módulos por intenção.", icon: Compass, category: "Cosmos" },

  { id: "bio_scanner",      label: "Bio Scanner",      desc: "Análise de bem-estar e padrões de uso saudáveis.", icon: Scan, category: "Bio" },
  { id: "dna_forge",        label: "DNA Forge",        desc: "Gera 'DNA visual' único por usuário (avatar fractal).", icon: Dna, category: "Bio", hot: true },
  { id: "wellness_oracle",  label: "Wellness Oracle",  desc: "Recomenda pausas e mindfulness conforme atividade.", icon: Sun, category: "Bio" },
  { id: "pulse_monitor",    label: "Pulse Monitor",    desc: "Pulso do sistema: latência, erros e saúde geral.", icon: Wifi, category: "Bio" },
  { id: "fingerprint_id",   label: "Fingerprint ID",   desc: "Identidade biométrica simulada para auth premium.", icon: Key, category: "Bio" },

  { id: "crypto_oracle",    label: "Crypto Oracle",    desc: "Oráculo simulado de preços e tendências crypto.", icon: Bitcoin, category: "Finance" },
  { id: "alpha_signals",    label: "Alpha Signals",    desc: "Sinais de oportunidade com base em IA.", icon: Crosshair, category: "Finance" },
  { id: "yield_engine",     label: "Yield Engine",     desc: "Calculadora de rendimento e simulações.", icon: Diamond, category: "Finance" },
  { id: "nft_studio",       label: "NFT Studio",       desc: "Mint simulado de NFTs com metadados gerados por IA.", icon: Layers3, category: "Finance" },
  { id: "dao_console",      label: "DAO Console",      desc: "Console de governança simulada com votação.", icon: ServerCog, category: "Finance" },

  { id: "soundscape_ai",    label: "Soundscape AI",    desc: "Ambientação sonora generativa por contexto.", icon: Headphones, category: "Legendary" },
  { id: "tour_director",    label: "Tour Director",    desc: "Tour guiado interativo do app inteiro.", icon: Camera, category: "Legendary" },
  { id: "arena_mode",       label: "Arena Mode",       desc: "Modo competitivo com leaderboards XP.", icon: Joystick, category: "Legendary" },
  { id: "trophy_room",      label: "Trophy Room",      desc: "Galeria de conquistas com brilho dinâmico.", icon: Trophy, category: "Legendary" },
  { id: "luris_legend",     label: "Luris Legend",     desc: "Modo lendário: tudo desbloqueado + aura cósmica.", icon: Sparkles, category: "Legendary", hot: true },
];

const CATEGORIES: Feature["category"][] = ["Neural", "Stealth", "Cosmos", "Bio", "Finance", "Legendary"];
const STORE_KEY = "luris.owner.phase5";

export function OwnerPhase5() {
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
    try { localStorage.setItem(STORE_KEY, JSON.stringify([...next])); } catch { /* noop */ }
  }

  async function toggle(f: Feature) {
    const next = new Set(active);
    const on = !next.has(f.id);
    if (on) next.add(f.id); else next.delete(f.id);
    persist(next);
    toast.success(`${f.label} ${on ? "ativado ✨" : "desativado"}`);
    if (user) {
      await supabase.from("system_logs").insert({
        event: `phase5:${f.id}:${on ? "on" : "off"}`,
        user_id: user.id,
      });
    }
    if (f.id === "luris_legend") document.body.classList.toggle("luris-legend", on);
  }

  function activateAll() {
    persist(new Set(FEATURES.map(f => f.id)));
    toast.success("✨ Luris Legend: 30 features Phase 5 ativadas");
  }
  function deactivateAll() { persist(new Set()); toast.success("Phase 5 resetada"); }

  const visible = FEATURES.filter(f =>
    (filter === "all" || f.category === filter) &&
    (!query || f.label.toLowerCase().includes(query.toLowerCase()) || f.desc.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-display gradient-text flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Phase 5 · Luris Legend ({FEATURES.length})
          </h3>
          <p className="text-[11px] font-mono text-muted-foreground">
            {active.size}/{FEATURES.length} ativadas · Neural, Stealth, Cosmos, Bio, Finance & Lendários
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 buscar feature..." className="glass px-3 py-1.5 rounded-lg text-xs font-mono" />
          <button onClick={activateAll} className="glass px-3 py-1.5 rounded-lg text-xs font-mono glow-magenta hover-lift">✨ Legend</button>
          <button onClick={deactivateAll} className="glass px-3 py-1.5 rounded-lg text-xs font-mono hover-lift">Reset</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-mono ${filter === "all" ? "glow-purple ring-1 ring-[oklch(0.78_0.28_295)]" : "glass"}`}>
          Todas ({FEATURES.length})
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-full text-xs font-mono ${filter === c ? "glow-purple ring-1 ring-[oklch(0.78_0.28_295)]" : "glass"}`}>
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
              className={`glass p-4 rounded-xl cursor-pointer hover-lift transition relative overflow-hidden group ${on ? "ring-2 ring-[oklch(0.78_0.28_295)] glow-purple" : ""}`}>
              {f.hot && <span className="absolute top-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.6_0.3_295)] text-white">HOT</span>}
              {on && <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.4_0.2_295/0.15)] to-[oklch(0.4_0.25_330/0.15)] pointer-events-none" />}
              <div className="flex items-start gap-3 relative">
                <div className={`p-2 rounded-lg ${on ? "bg-[oklch(0.5_0.25_295/0.3)]" : "bg-[oklch(0.3_0.1_295/0.3)]"}`}>
                  <f.icon className={`h-5 w-5 ${on ? "text-[oklch(0.85_0.25_295)]" : "text-[oklch(0.7_0.15_295)]"}`} />
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
          <span className="text-[oklch(0.78_0.25_295)]">{detail.label}</span> — {detail.desc}
        </div>
      )}
    </div>
  );
}
