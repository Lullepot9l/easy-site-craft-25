import { useEffect, useState } from "react";
import {
  Atom, Beaker, BookOpen, Bot, Brain, Briefcase, Building2, Cake, Camera,
  Car, ChartBar, Cherry, Church, Cigarette, Cloud, Code, Coffee, Compass,
  CreditCard, Crosshair, Crown, Diamond, Dna, Droplet, Earth, Egg, Eye,
  Feather, FileLock2, Fingerprint, Flame, Globe2, GraduationCap, Hammer,
  Headphones, Heart, Infinity as InfinityIcon, Key, Languages, Layers,
  Leaf, Library, LifeBuoy, Magnet, Map, Microscope, Moon, Music, Network,
  Newspaper, Orbit, Palette, PenTool, Phone, PiggyBank, Plane, Puzzle,
  Rocket, ScanFace, Scissors, Search, Shield, Snowflake, Stethoscope, Sun,
  Sword, Target, Telescope, Thermometer, ToyBrick, Train, Trophy, Watch,
  Wifi, Wind, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type FeatureId =
  | "edu_master" | "tutor_ai" | "exam_forge" | "campus_grid" | "library_quantum"
  | "med_scan" | "diagnose_ai" | "pharma_lab" | "vital_pulse" | "therapy_room"
  | "law_oracle" | "case_forge" | "contract_ai" | "court_radar" | "evidence_vault"
  | "travel_pilot" | "hotel_concierge" | "flight_radar" | "passport_ai" | "world_map"
  | "fashion_lab" | "stylist_ai" | "runway_mode" | "fabric_forge" | "trend_oracle"
  | "kids_world" | "story_teller" | "dream_garden" | "tiny_studio" | "magic_box"
  | "sport_arena" | "coach_ai" | "stat_master" | "fan_pulse" | "league_grid"
  | "spirit_oracle" | "mantra_ai" | "zen_room" | "aura_scan" | "destiny_map"
  | "luris_infinity";

interface Feature {
  id: FeatureId;
  label: string;
  desc: string;
  icon: typeof Brain;
  category: "Educacao" | "Saude" | "Direito" | "Travel" | "Fashion" | "Kids" | "Sports" | "Spirit" | "Legendary";
  hot?: boolean;
}

const FEATURES: Feature[] = [
  { id: "edu_master",      label: "Edu Master",       desc: "Plataforma de ensino adaptativa com IA tutora.", icon: GraduationCap, category: "Educacao", hot: true },
  { id: "tutor_ai",        label: "Tutor AI",         desc: "Tutor pessoal 24/7 que explica qualquer matéria.", icon: BookOpen, category: "Educacao" },
  { id: "exam_forge",      label: "Exam Forge",       desc: "Gera provas, simulados e correções automáticas.", icon: PenTool, category: "Educacao" },
  { id: "campus_grid",     label: "Campus Grid",      desc: "Mapa interativo de campus universitário.", icon: Building2, category: "Educacao" },
  { id: "library_quantum", label: "Library Quantum",  desc: "Biblioteca digital com busca semântica.", icon: Library, category: "Educacao" },

  { id: "med_scan",        label: "Med Scan",         desc: "Scanner médico simulado com diagnóstico IA.", icon: Stethoscope, category: "Saude", hot: true },
  { id: "diagnose_ai",     label: "Diagnose AI",      desc: "Análise de sintomas com sugestões clínicas.", icon: Microscope, category: "Saude" },
  { id: "pharma_lab",      label: "Pharma Lab",       desc: "Catálogo de fármacos e interações.", icon: Beaker, category: "Saude" },
  { id: "vital_pulse",     label: "Vital Pulse",      desc: "Dashboard vital com batimentos animados.", icon: Heart, category: "Saude" },
  { id: "therapy_room",    label: "Therapy Room",     desc: "Sala de terapia com IA empática.", icon: Brain, category: "Saude" },

  { id: "law_oracle",      label: "Law Oracle",       desc: "Oráculo jurídico com base em jurisprudência.", icon: Shield, category: "Direito", hot: true },
  { id: "case_forge",      label: "Case Forge",       desc: "Monta petições e teses automaticamente.", icon: Briefcase, category: "Direito" },
  { id: "contract_ai",     label: "Contract AI",      desc: "Revisa contratos e marca cláusulas de risco.", icon: FileLock2, category: "Direito" },
  { id: "court_radar",     label: "Court Radar",      desc: "Acompanha processos em tempo real.", icon: Crosshair, category: "Direito" },
  { id: "evidence_vault",  label: "Evidence Vault",   desc: "Cofre criptografado de provas e documentos.", icon: Key, category: "Direito" },

  { id: "travel_pilot",    label: "Travel Pilot",     desc: "Roteiros de viagem inteligentes.", icon: Plane, category: "Travel", hot: true },
  { id: "hotel_concierge", label: "Hotel Concierge",  desc: "Concierge virtual de hotéis premium.", icon: Crown, category: "Travel" },
  { id: "flight_radar",    label: "Flight Radar",     desc: "Radar de voos com preço previsto.", icon: Compass, category: "Travel" },
  { id: "passport_ai",     label: "Passport AI",      desc: "Verifica vistos e documentos por país.", icon: ScanFace, category: "Travel" },
  { id: "world_map",       label: "World Map",        desc: "Mapa global interativo com pontos quentes.", icon: Globe2, category: "Travel" },

  { id: "fashion_lab",     label: "Fashion Lab",      desc: "Studio de moda com try-on virtual.", icon: Palette, category: "Fashion", hot: true },
  { id: "stylist_ai",      label: "Stylist AI",       desc: "Sugere looks com base no clima e ocasião.", icon: Scissors, category: "Fashion" },
  { id: "runway_mode",     label: "Runway Mode",      desc: "Passarela animada com modelos virtuais.", icon: Camera, category: "Fashion" },
  { id: "fabric_forge",    label: "Fabric Forge",     desc: "Gera estampas e tecidos por IA.", icon: Layers, category: "Fashion" },
  { id: "trend_oracle",    label: "Trend Oracle",     desc: "Prevê tendências por estação.", icon: Eye, category: "Fashion" },

  { id: "kids_world",      label: "Kids World",       desc: "Mundo infantil seguro e gamificado.", icon: ToyBrick, category: "Kids", hot: true },
  { id: "story_teller",    label: "Story Teller",     desc: "Conta histórias personalizadas com narração.", icon: BookOpen, category: "Kids" },
  { id: "dream_garden",    label: "Dream Garden",     desc: "Jardim onírico relaxante para dormir.", icon: Moon, category: "Kids" },
  { id: "tiny_studio",     label: "Tiny Studio",      desc: "Studio de desenho infantil com IA.", icon: PenTool, category: "Kids" },
  { id: "magic_box",       label: "Magic Box",        desc: "Caixa de truques mágicos interativos.", icon: Puzzle, category: "Kids" },

  { id: "sport_arena",     label: "Sport Arena",      desc: "Arena esportiva com estatísticas vivas.", icon: Trophy, category: "Sports", hot: true },
  { id: "coach_ai",        label: "Coach AI",         desc: "Treinador pessoal com plano adaptativo.", icon: Target, category: "Sports" },
  { id: "stat_master",     label: "Stat Master",      desc: "Métricas avançadas de qualquer atleta.", icon: ChartBar, category: "Sports" },
  { id: "fan_pulse",       label: "Fan Pulse",        desc: "Pulso da torcida em tempo real.", icon: Heart, category: "Sports" },
  { id: "league_grid",     label: "League Grid",      desc: "Grid de campeonatos do mundo todo.", icon: Network, category: "Sports" },

  { id: "spirit_oracle",   label: "Spirit Oracle",    desc: "Oráculo espiritual multifé.", icon: Feather, category: "Spirit", hot: true },
  { id: "mantra_ai",       label: "Mantra AI",        desc: "Gera mantras e afirmações diárias.", icon: Music, category: "Spirit" },
  { id: "zen_room",        label: "Zen Room",         desc: "Sala zen com sons binaurais e respiração guiada.", icon: Leaf, category: "Spirit" },
  { id: "aura_scan",       label: "Aura Scan",        desc: "Scanner de aura simulado com cores.", icon: Droplet, category: "Spirit" },
  { id: "destiny_map",     label: "Destiny Map",      desc: "Mapa astral interativo.", icon: Orbit, category: "Spirit" },

  { id: "luris_infinity",  label: "✦ Luris Infinity", desc: "Modo lendário: une TODAS as fases anteriores num só comando.", icon: InfinityIcon, category: "Legendary", hot: true },
];

const STORE_KEY = "luris.phase7.features";
const CATEGORIES: Feature["category"][] = ["Educacao","Saude","Direito","Travel","Fashion","Kids","Sports","Spirit","Legendary"];

export function OwnerPhase7() {
  const { user } = useAuth();
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FEATURES.map(f => [f.id, true]))
  );
  const [filter, setFilter] = useState<Feature["category"] | "Todas">("Todas");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Feature | null>(null);

  useEffect(() => {
    setActive(Object.fromEntries(FEATURES.map(f => [f.id, true])));
  }, []);

  function persist(next: Record<string, boolean>) {
    setActive(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  async function toggle(f: Feature) {
    const next = { ...active, [f.id]: !active[f.id] };
    persist(next);
    if (f.id === "luris_infinity") {
      document.body.classList.toggle("luris-infinity", next[f.id]);
    }
    toast.success(`${next[f.id] ? "Ativado" : "Desativado"}: ${f.label}`);
    if (user) {
      await supabase.from("system_logs").insert({
        event: `phase7:${f.id}:${next[f.id] ? "on" : "off"}`,
        user_id: user.id,
      });
    }
  }

  async function enableAll() {
    const next: Record<string, boolean> = {};
    FEATURES.forEach(f => { next[f.id] = true; });
    persist(next);
    document.body.classList.add("luris-infinity");
    toast.success("∞ Phase 7 totalmente ativada");
    if (user) await supabase.from("system_logs").insert({ event: "phase7:all:on", user_id: user.id });
  }

  const list = FEATURES.filter(f => {
    if (filter !== "Todas" && f.category !== filter) return false;
    if (q && !`${f.label} ${f.desc}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const activeCount = Object.values(active).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 buscar feature..."
          className="glass px-3 py-1.5 rounded-lg text-xs font-mono flex-1 min-w-[180px]"
        />
        <button onClick={enableAll} className="btn-neon px-3 py-1.5 rounded-lg text-xs font-mono">
          ∞ Infinity
        </button>
        <span className="text-xs font-mono text-muted-foreground">{activeCount}/{FEATURES.length} ativos</span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {(["Todas", ...CATEGORIES] as const).map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`glass px-3 py-1 rounded-full hover-lift ${filter === c ? "neon-border neon-text-magenta" : ""}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(f => {
          const on = !!active[f.id];
          return (
            <div
              key={f.id}
              className={`glass rounded-xl p-4 hover-lift relative overflow-hidden ${on ? "glow-magenta" : ""}`}
            >
              {f.hot && <span className="absolute top-2 right-2 text-[9px] font-mono uppercase neon-text-cyan">hot</span>}
              <div className="flex items-start gap-3">
                <div className={`shrink-0 p-2 rounded-lg ${on ? "bg-[oklch(0.3_0.18_330_/_0.4)]" : "bg-[oklch(0.2_0.05_295_/_0.4)]"}`}>
                  <f.icon className="h-5 w-5 text-[oklch(0.78_0.28_330)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-display flex items-center justify-between gap-2">
                    <span className="truncate">{f.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{f.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.desc}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => toggle(f)}
                      className={`text-[11px] font-mono px-2 py-1 rounded ${on ? "btn-neon" : "glass"}`}
                    >
                      {on ? "ON" : "OFF"}
                    </button>
                    <button
                      onClick={() => setDetail(f)}
                      className="text-[11px] font-mono px-2 py-1 rounded glass"
                    >
                      detalhes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-2xl p-6 max-w-md w-full glow-magenta"
          >
            <div className="flex items-center gap-3 mb-3">
              <detail.icon className="h-7 w-7 text-[oklch(0.78_0.28_330)]" />
              <h3 className="text-xl font-display neon-text-magenta">{detail.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{detail.desc}</p>
            <div className="text-[11px] font-mono text-muted-foreground mb-4">
              Categoria: <span className="neon-text-cyan">{detail.category}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { toggle(detail); setDetail(null); }} className="btn-neon px-3 py-1.5 rounded text-xs font-mono">
                {active[detail.id] ? "Desativar" : "Ativar"}
              </button>
              <button onClick={() => setDetail(null)} className="glass px-3 py-1.5 rounded text-xs font-mono">
                fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
