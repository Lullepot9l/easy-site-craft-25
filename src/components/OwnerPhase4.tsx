import { useEffect, useState } from "react";
import {
  Bot, Boxes, Briefcase, Building, Cable, Clapperboard, Cloud, Coins, Cpu,
  Crown, Drum, Feather, Flame, GanttChart, Gem, Globe2, GraduationCap,
  Hammer, Heart, Infinity as InfinityIcon, Layers, Lightbulb, Music2,
  Network, Palette, Plane, Rocket, Shield, Star, Target, Trophy, Wand2,
  Workflow, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type FeatureId =
  | "auto_pilot" | "agent_swarm_pro" | "voice_studio" | "video_director" | "design_lab"
  | "brand_kit" | "infinite_canvas" | "live_collab" | "marketplace_pro" | "crypto_vault"
  | "global_cdn" | "edge_workers" | "ml_trainer" | "data_pipelines" | "ai_translator"
  | "smart_seo" | "growth_engine" | "campaign_lab" | "social_blast" | "ai_recruiter"
  | "edu_academy" | "wellness_hub" | "metrics_god" | "achievement_forge" | "dragon_kingdom";

interface Feature {
  id: FeatureId;
  label: string;
  desc: string;
  icon: typeof Bot;
  category: "Automation" | "Creative" | "Growth" | "Infra" | "Legendary";
  hot?: boolean;
}

const FEATURES: Feature[] = [
  { id: "auto_pilot",      label: "Auto Pilot",      desc: "Agente autônomo executando tarefas 24/7 no painel.", icon: Bot, category: "Automation", hot: true },
  { id: "agent_swarm_pro", label: "Agent Swarm Pro", desc: "Múltiplos agentes coordenados resolvendo tarefas em paralelo.", icon: Boxes, category: "Automation" },
  { id: "voice_studio",    label: "Voice Studio",    desc: "Estúdio de TTS multivoz com clonagem fictícia.", icon: Music2, category: "Creative" },
  { id: "video_director",  label: "Video Director",  desc: "Direção de cenas vídeo via prompt, storyboard automático.", icon: Clapperboard, category: "Creative", hot: true },
  { id: "design_lab",      label: "Design Lab",      desc: "Geração de mockups, logos e sistemas de design completos.", icon: Palette, category: "Creative" },
  { id: "brand_kit",       label: "Brand Kit",       desc: "Kit de marca: paleta, tipografia, logo, voz, tudo coeso.", icon: Feather, category: "Creative" },
  { id: "infinite_canvas", label: "Infinite Canvas", desc: "Canvas infinito estilo Figma com IA assistente.", icon: InfinityIcon, category: "Creative" },
  { id: "live_collab",     label: "Live Collab",     desc: "Edição multi-usuário em tempo real com presença.", icon: Network, category: "Infra" },
  { id: "marketplace_pro", label: "Marketplace Pro", desc: "Marketplace robusto com pagamentos, escrow e disputas.", icon: Briefcase, category: "Growth" },
  { id: "crypto_vault",    label: "Crypto Vault",    desc: "Carteira interna multimoeda simulada com staking.", icon: Coins, category: "Infra" },
  { id: "global_cdn",      label: "Global CDN",      desc: "Distribuição global de sites em 50+ edges.", icon: Globe2, category: "Infra" },
  { id: "edge_workers",    label: "Edge Workers",    desc: "Functions na borda com tempo de resposta <50ms.", icon: Cable, category: "Infra" },
  { id: "ml_trainer",      label: "ML Trainer",      desc: "Pipeline pra treinar pequenos modelos sob demanda.", icon: Cpu, category: "Automation", hot: true },
  { id: "data_pipelines",  label: "Data Pipelines",  desc: "ETL visual conectando todas as fontes do sistema.", icon: Workflow, category: "Infra" },
  { id: "ai_translator",   label: "AI Translator",   desc: "Tradução simultânea em 80 idiomas com tom preservado.", icon: Cloud, category: "Automation" },
  { id: "smart_seo",       label: "Smart SEO",       desc: "Auditoria SEO e auto-fix de meta tags / schema.org.", icon: Target, category: "Growth", hot: true },
  { id: "growth_engine",   label: "Growth Engine",   desc: "Loops virais, referrals e A/B testing turnkey.", icon: Rocket, category: "Growth" },
  { id: "campaign_lab",    label: "Campaign Lab",    desc: "Cria, agenda e analisa campanhas multi-canal.", icon: GanttChart, category: "Growth" },
  { id: "social_blast",    label: "Social Blast",    desc: "Posta em 10 redes ao mesmo tempo com adaptação por canal.", icon: Drum, category: "Growth" },
  { id: "ai_recruiter",    label: "AI Recruiter",    desc: "Triagem de CVs e matching com vagas via embeddings.", icon: Building, category: "Automation" },
  { id: "edu_academy",     label: "Edu Academy",     desc: "Plataforma de cursos com trilhas geradas por IA.", icon: GraduationCap, category: "Creative" },
  { id: "wellness_hub",    label: "Wellness Hub",    desc: "Hub de wellness com lembretes, foco e respiração.", icon: Heart, category: "Creative" },
  { id: "metrics_god",     label: "Metrics God",     desc: "Painel de métricas god-tier com insights preditivos.", icon: Layers, category: "Growth" },
  { id: "achievement_forge", label: "Achievement Forge", desc: "Forja de conquistas, badges e medalhas raras.", icon: Trophy, category: "Legendary" },
  { id: "dragon_kingdom",  label: "Dragon Kingdom",  desc: "Modo lendário: tudo desbloqueado + temas exclusivos.", icon: Crown, category: "Legendary", hot: true },
];

const CATEGORIES: Feature["category"][] = ["Automation", "Creative", "Growth", "Infra", "Legendary"];
const STORE_KEY = "luris.owner.phase4";

export function OwnerPhase4() {
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
    toast.success(`${f.label} ${on ? "ativado 🔥" : "desativado"}`);
    if (user) {
      await supabase.from("system_logs").insert({
        event: `phase4:${f.id}:${on ? "on" : "off"}`,
        user_id: user.id,
      });
    }
    if (f.id === "dragon_kingdom") document.body.classList.toggle("dragon-kingdom", on);
  }

  function activateAll() {
    persist(new Set(FEATURES.map(f => f.id)));
    toast.success("👑 Dragon Kingdom: 25 features Phase 4 ativadas");
  }
  function deactivateAll() { persist(new Set()); toast.success("Phase 4 resetada"); }

  const visible = FEATURES.filter(f =>
    (filter === "all" || f.category === filter) &&
    (!query || f.label.toLowerCase().includes(query.toLowerCase()) || f.desc.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-display gradient-text flex items-center gap-2">
            <Flame className="h-5 w-5" /> Phase 4 · Dragon Kingdom (25)
          </h3>
          <p className="text-[11px] font-mono text-muted-foreground">
            {active.size}/25 ativadas · Automação, Creative, Growth & Lendários
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 buscar feature..." className="glass px-3 py-1.5 rounded-lg text-xs font-mono" />
          <button onClick={activateAll} className="glass px-3 py-1.5 rounded-lg text-xs font-mono glow-magenta hover-lift">👑 Kingdom</button>
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
              {on && <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.4_0.2_25/0.15)] to-[oklch(0.4_0.25_60/0.15)] pointer-events-none" />}
              <div className="flex items-start gap-3 relative">
                <div className={`p-2 rounded-lg ${on ? "bg-[oklch(0.5_0.25_25/0.3)]" : "bg-[oklch(0.3_0.1_295/0.3)]"}`}>
                  <f.icon className={`h-5 w-5 ${on ? "text-[oklch(0.85_0.25_25)]" : "text-[oklch(0.7_0.15_295)]"}`} />
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
          <span className="text-[oklch(0.78_0.25_25)]">{detail.label}</span> — {detail.desc}
        </div>
      )}
    </div>
  );
}
