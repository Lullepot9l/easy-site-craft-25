import { useEffect, useState } from "react";
import {
  Anchor, Aperture, Award, Banknote, BellRing, Box, Calculator, Castle,
  ChefHat, CircuitBoard, Clapperboard, Clock, Cloudy, Codepen, Compass,
  Cpu, Dices, Drama, Factory, Film, FlaskConical, Gauge, Gift, Hexagon,
  Hourglass, Landmark, Lightbulb, MapPinned, Medal, Megaphone, Mic,
  Mountain, Package, PaintBucket, Pizza, Plug, Radio, Rocket, Send,
  Server, Settings2, Shapes, Shirt, ShoppingCart, Signal, Sparkles, Tag,
  Tent, Ticket, Tractor, TreePine, Truck, Tv, Umbrella, Utensils, Verified,
  Vibrate, Wallet, Waves, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type FeatureId =
  | "factory_os" | "supply_chain" | "fleet_tracker" | "warehouse_grid" | "smart_invoice"
  | "stock_radar" | "price_oracle" | "tax_robot" | "wallet_pro" | "subscription_engine"
  | "studio_cinema" | "podcast_lab" | "radio_tower" | "live_room" | "stream_director"
  | "kitchen_ai" | "menu_genius" | "delivery_pilot" | "reservation_bot" | "loyalty_forge"
  | "event_orchestra" | "ticket_gate" | "festival_mode" | "fan_arena" | "merch_drop"
  | "smart_farm" | "weather_sage" | "eco_pulse" | "ocean_watch" | "mountain_hud"
  | "city_grid" | "transit_ai" | "civic_voice" | "policy_lab" | "luris_titan";

interface Feature {
  id: FeatureId;
  label: string;
  desc: string;
  icon: typeof Box;
  category: "Industria" | "Fintech" | "Midia" | "Food" | "Eventos" | "EcoCidade" | "Legendary";
  hot?: boolean;
}

const FEATURES: Feature[] = [
  { id: "factory_os",      label: "Factory OS",       desc: "Sistema operacional simulado de chão de fábrica.", icon: Factory, category: "Industria", hot: true },
  { id: "supply_chain",    label: "Supply Chain AI",  desc: "Otimiza rotas e estoques em tempo real.", icon: Truck, category: "Industria" },
  { id: "fleet_tracker",   label: "Fleet Tracker",    desc: "Mapa vivo da frota com telemetria fictícia.", icon: MapPinned, category: "Industria" },
  { id: "warehouse_grid",  label: "Warehouse Grid",   desc: "Grade 3D do armazém com heatmap de SKUs.", icon: Package, category: "Industria" },
  { id: "smart_invoice",   label: "Smart Invoice",    desc: "Geração e parsing de notas fiscais por IA.", icon: Calculator, category: "Industria" },

  { id: "stock_radar",     label: "Stock Radar",      desc: "Radar de ações com sinais simulados.", icon: Signal, category: "Fintech", hot: true },
  { id: "price_oracle",    label: "Price Oracle",     desc: "Oráculo de preços multi-mercado.", icon: Tag, category: "Fintech" },
  { id: "tax_robot",       label: "Tax Robot",        desc: "Simulador fiscal automático com cenários.", icon: Banknote, category: "Fintech" },
  { id: "wallet_pro",      label: "Wallet Pro",       desc: "Carteira unificada cartão + crypto fictícia.", icon: Wallet, category: "Fintech" },
  { id: "subscription_engine", label: "Subscription Engine", desc: "Motor de assinaturas com churn predito.", icon: BellRing, category: "Fintech" },

  { id: "studio_cinema",   label: "Studio Cinema",    desc: "Estúdio virtual para edição de filmes IA.", icon: Film, category: "Midia", hot: true },
  { id: "podcast_lab",     label: "Podcast Lab",      desc: "Gera, edita e publica podcasts via IA.", icon: Mic, category: "Midia" },
  { id: "radio_tower",     label: "Radio Tower",      desc: "Rádio generativa 24/7 estilo lofi cyberpunk.", icon: Radio, category: "Midia" },
  { id: "live_room",       label: "Live Room",        desc: "Sala ao vivo com chat IA moderando.", icon: Tv, category: "Midia" },
  { id: "stream_director", label: "Stream Director",  desc: "Direção automática de streams multi-cam.", icon: Clapperboard, category: "Midia" },

  { id: "kitchen_ai",      label: "Kitchen AI",       desc: "Sugestões de receitas com base em ingredientes.", icon: ChefHat, category: "Food" },
  { id: "menu_genius",     label: "Menu Genius",      desc: "Cria cardápios completos com preço sugerido.", icon: Utensils, category: "Food" },
  { id: "delivery_pilot",  label: "Delivery Pilot",   desc: "Otimização de rotas de entrega.", icon: Pizza, category: "Food" },
  { id: "reservation_bot", label: "Reservation Bot",  desc: "Reservas automáticas via assistente.", icon: Clock, category: "Food" },
  { id: "loyalty_forge",   label: "Loyalty Forge",    desc: "Programa de fidelidade gamificado.", icon: Gift, category: "Food" },

  { id: "event_orchestra", label: "Event Orchestra",  desc: "Orquestração completa de eventos.", icon: Drama, category: "Eventos", hot: true },
  { id: "ticket_gate",     label: "Ticket Gate",      desc: "Bilhetagem com QR + anti-fraude IA.", icon: Ticket, category: "Eventos" },
  { id: "festival_mode",   label: "Festival Mode",    desc: "Modo festival: mapa, line-up e horários.", icon: Tent, category: "Eventos" },
  { id: "fan_arena",       label: "Fan Arena",        desc: "Arena de fãs com rankings ao vivo.", icon: Medal, category: "Eventos" },
  { id: "merch_drop",      label: "Merch Drop",       desc: "Drops de mercadoria limitada com hype.", icon: Shirt, category: "Eventos" },

  { id: "smart_farm",      label: "Smart Farm",       desc: "Agricultura inteligente com sensores fictícios.", icon: Tractor, category: "EcoCidade" },
  { id: "weather_sage",    label: "Weather Sage",     desc: "Previsão hiper-local com IA.", icon: Cloudy, category: "EcoCidade" },
  { id: "eco_pulse",       label: "Eco Pulse",        desc: "Painel de impacto ambiental do sistema.", icon: TreePine, category: "EcoCidade" },
  { id: "ocean_watch",     label: "Ocean Watch",      desc: "Monitor de oceanos e marés simulado.", icon: Waves, category: "EcoCidade" },
  { id: "mountain_hud",    label: "Mountain HUD",     desc: "HUD topográfico de relevo e trilhas.", icon: Mountain, category: "EcoCidade" },

  { id: "city_grid",       label: "City Grid",        desc: "Grade de cidade inteligente em tempo real.", icon: Hexagon, category: "EcoCidade" },
  { id: "transit_ai",      label: "Transit AI",       desc: "Otimização de transporte público fictício.", icon: Compass, category: "EcoCidade" },
  { id: "civic_voice",     label: "Civic Voice",      desc: "Canal de participação cidadã com IA.", icon: Megaphone, category: "EcoCidade" },
  { id: "policy_lab",      label: "Policy Lab",       desc: "Laboratório de políticas públicas simuladas.", icon: Landmark, category: "EcoCidade" },

  { id: "luris_titan",     label: "Luris Titan",      desc: "Modo titã: combina Phase 1–6 num só HUD lendário.", icon: Sparkles, category: "Legendary", hot: true },
];

const CATEGORIES: Feature["category"][] = ["Industria", "Fintech", "Midia", "Food", "Eventos", "EcoCidade", "Legendary"];
const STORE_KEY = "luris.owner.phase6";

export function OwnerPhase6() {
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
    toast.success(`${f.label} ${on ? "ativado 🛠️" : "desativado"}`);
    if (user) {
      await supabase.from("system_logs").insert({
        event: `phase6:${f.id}:${on ? "on" : "off"}`,
        user_id: user.id,
      });
    }
    if (f.id === "luris_titan") document.body.classList.toggle("luris-titan", on);
  }

  function activateAll() {
    persist(new Set(FEATURES.map(f => f.id)));
    toast.success(`🛠️ Luris Titan: ${FEATURES.length} features Phase 6 ativadas`);
  }
  function deactivateAll() { persist(new Set()); toast.success("Phase 6 resetada"); }

  const visible = FEATURES.filter(f =>
    (filter === "all" || f.category === filter) &&
    (!query || f.label.toLowerCase().includes(query.toLowerCase()) || f.desc.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-display gradient-text flex items-center gap-2">
            <Factory className="h-5 w-5" /> Phase 6 · Luris Titan ({FEATURES.length})
          </h3>
          <p className="text-[11px] font-mono text-muted-foreground">
            {active.size}/{FEATURES.length} ativadas · Indústria, Fintech, Mídia, Food, Eventos, EcoCidade & Lendários
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 buscar feature..." className="glass px-3 py-1.5 rounded-lg text-xs font-mono" />
          <button onClick={activateAll} className="glass px-3 py-1.5 rounded-lg text-xs font-mono glow-magenta hover-lift">🛠️ Titan</button>
          <button onClick={deactivateAll} className="glass px-3 py-1.5 rounded-lg text-xs font-mono hover-lift">Reset</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-mono ${filter === "all" ? "glow-purple ring-1 ring-[oklch(0.78_0.28_60)]" : "glass"}`}>
          Todas ({FEATURES.length})
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-full text-xs font-mono ${filter === c ? "glow-purple ring-1 ring-[oklch(0.78_0.28_60)]" : "glass"}`}>
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
              className={`glass p-4 rounded-xl cursor-pointer hover-lift transition relative overflow-hidden group ${on ? "ring-2 ring-[oklch(0.78_0.28_60)] glow-purple" : ""}`}>
              {f.hot && <span className="absolute top-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.6_0.3_60)] text-white">HOT</span>}
              {on && <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.4_0.2_60/0.15)] to-[oklch(0.4_0.25_30/0.15)] pointer-events-none" />}
              <div className="flex items-start gap-3 relative">
                <div className={`p-2 rounded-lg ${on ? "bg-[oklch(0.5_0.25_60/0.3)]" : "bg-[oklch(0.3_0.1_295/0.3)]"}`}>
                  <f.icon className={`h-5 w-5 ${on ? "text-[oklch(0.85_0.25_60)]" : "text-[oklch(0.7_0.15_295)]"}`} />
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
          <span className="text-[oklch(0.78_0.25_60)]">{detail.label}</span> — {detail.desc}
        </div>
      )}
    </div>
  );
}
