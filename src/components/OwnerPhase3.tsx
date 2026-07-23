import { useEffect, useState } from "react";
import {
  Atom, Binary, BrainCircuit, CircuitBoard, Cog, Compass, Crosshair, Box as Cube,
  Diamond, Dna, Fingerprint, Flame, Gauge, Hexagon, Key, Microscope,
  Orbit, Pyramid, Radar, Satellite, ShieldCheck, Sigma, Telescope, Waves, Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type FeatureId =
  | "quantum_core" | "neural_mesh" | "holo_terminal" | "ai_compiler" | "bio_signature"
  | "stealth_mode" | "predictive_ui" | "thermal_skin" | "satellite_net" | "echo_chamber"
  | "fractal_engine" | "time_dilation" | "vault_x" | "infra_radar" | "ai_lab"
  | "deep_sync" | "ghost_protocol" | "swarm_ai" | "hyper_threads" | "neon_oracle"
  | "matrix_view" | "rune_compiler" | "phantom_workspace" | "singularity_kit" | "dragon_forge";

interface Feature {
  id: FeatureId;
  label: string;
  desc: string;
  icon: typeof Atom;
  category: "Quantum" | "AI Lab" | "Security" | "Infra" | "Legendary";
  hot?: boolean;
}

const FEATURES: Feature[] = [
  { id: "quantum_core", label: "Quantum Core", desc: "Processamento simulado quântico para queries IA.", icon: Atom, category: "Quantum", hot: true },
  { id: "neural_mesh", label: "Neural Mesh", desc: "Rede neural distribuída entre todos os agentes ativos.", icon: BrainCircuit, category: "AI Lab" },
  { id: "holo_terminal", label: "Holo Terminal", desc: "Terminal 3D holográfico com comandos por voz.", icon: CircuitBoard, category: "Legendary" },
  { id: "ai_compiler", label: "AI Compiler", desc: "Compila projetos completos a partir de descrição natural.", icon: Cog, category: "AI Lab", hot: true },
  { id: "bio_signature", label: "Bio Signature", desc: "Login biométrico fictício com auth dupla.", icon: Fingerprint, category: "Security" },
  { id: "stealth_mode", label: "Stealth Mode", desc: "Esconde sua presença do feed social e online.", icon: Crosshair, category: "Security" },
  { id: "predictive_ui", label: "Predictive UI", desc: "Interface se reorganiza prevendo seu próximo clique.", icon: Compass, category: "AI Lab" },
  { id: "thermal_skin", label: "Thermal Skin", desc: "Skin termal reagindo à carga de CPU/GPU.", icon: Flame, category: "Legendary" },
  { id: "satellite_net", label: "Satellite Net", desc: "Status global em rede via satélites simulados.", icon: Satellite, category: "Infra" },
  { id: "echo_chamber", label: "Echo Chamber", desc: "Áudio espacial 3D nas chamadas e chats.", icon: Waves, category: "Legendary" },
  { id: "fractal_engine", label: "Fractal Engine", desc: "Renderiza fractais procedurais como fundo.", icon: Hexagon, category: "Quantum" },
  { id: "time_dilation", label: "Time Dilation", desc: "Slow-motion cinematográfico nas transições.", icon: Gauge, category: "Legendary" },
  { id: "vault_x", label: "Vault X", desc: "Cofre encriptado para credenciais e tokens.", icon: Key, category: "Security", hot: true },
  { id: "infra_radar", label: "Infra Radar", desc: "Mapa de servidores e latência em tempo real.", icon: Radar, category: "Infra" },
  { id: "ai_lab", label: "AI Lab", desc: "Sandbox para testar modelos IA lado a lado.", icon: Microscope, category: "AI Lab" },
  { id: "deep_sync", label: "Deep Sync", desc: "Sincroniza tudo entre dispositivos em ms.", icon: Wifi, category: "Infra" },
  { id: "ghost_protocol", label: "Ghost Protocol", desc: "Operações invisíveis sem deixar logs.", icon: Sigma, category: "Security" },
  { id: "swarm_ai", label: "Swarm AI", desc: "Múltiplos mini-agentes resolvendo em paralelo.", icon: Orbit, category: "AI Lab", hot: true },
  { id: "hyper_threads", label: "Hyper Threads", desc: "Multi-tarefa massiva no chat e builder.", icon: Binary, category: "Infra" },
  { id: "neon_oracle", label: "Neon Oracle", desc: "IA preditiva para tomada de decisão.", icon: Telescope, category: "AI Lab" },
  { id: "matrix_view", label: "Matrix View", desc: "Modo visual estilo Matrix com chuva de código.", icon: Cube, category: "Legendary" },
  { id: "rune_compiler", label: "Rune Compiler", desc: "Linguagem runica compilando para JS/Python.", icon: Dna, category: "Quantum" },
  { id: "phantom_workspace", label: "Phantom Workspace", desc: "Workspace temporário auto-destrutivo.", icon: Pyramid, category: "Security" },
  { id: "singularity_kit", label: "Singularity Kit", desc: "Pacote definitivo de AI + GPU virtual.", icon: Diamond, category: "Legendary", hot: true },
  { id: "dragon_forge", label: "Dragon Forge 🐉", desc: "Construa qualquer coisa com 1 comando. Owner only.", icon: ShieldCheck, category: "Legendary", hot: true },
];

const CATEGORIES = ["Quantum", "AI Lab", "Security", "Infra", "Legendary"] as const;
const STORAGE_KEY = "luris.owner.phase3";

export function OwnerPhase3() {
  const { user } = useAuth();
  const [active, setActive] = useState<Set<FeatureId>>(() => new Set(FEATURES.map(f => f.id)));
  const [filter, setFilter] = useState<"all" | typeof CATEGORIES[number]>("all");
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
    toast.success(`${f.label} ${on ? "ativado ⚡" : "desativado"}`);
    if (user) {
      await supabase.from("system_logs").insert({
        event: `phase3:${f.id}:${on ? "on" : "off"}`,
        user_id: user.id,
      });
    }
    if (f.id === "matrix_view") document.body.classList.toggle("matrix-view", on);
    if (f.id === "thermal_skin") document.body.classList.toggle("thermal-skin", on);
  }

  function activateAll() {
    persist(new Set(FEATURES.map(f => f.id)));
    toast.success("🐉 Singularity online: 25 features ativadas");
  }
  function deactivateAll() { persist(new Set()); toast.success("Tudo desativado"); }

  const visible = FEATURES.filter(f =>
    (filter === "all" || f.category === filter) &&
    (!query || f.label.toLowerCase().includes(query.toLowerCase()) || f.desc.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-display gradient-text flex items-center gap-2">
            <Atom className="h-5 w-5" /> Phase 3 · Quantum & Singularity (25)
          </h3>
          <p className="text-[11px] font-mono text-muted-foreground">
            {active.size}/25 ativadas · Click para alternar · Hover para detalhes
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 buscar feature..." className="glass px-3 py-1.5 rounded-lg text-xs font-mono" />
          <button onClick={activateAll} className="glass px-3 py-1.5 rounded-lg text-xs font-mono glow-magenta hover-lift">⚡ Singularity</button>
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
