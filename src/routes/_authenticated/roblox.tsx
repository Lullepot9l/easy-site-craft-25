import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Puzzle, Gamepad2, Wand2, BookOpen, HardDriveDownload } from "lucide-react";
import { RobloxPlugin } from "@/components/RobloxPlugin";

export const Route = createFileRoute("/_authenticated/roblox")({
  component: Roblox,
  head: () => ({
    meta: [
      { title: "Roblox Studio · Luris IA para criar jogos" },
      { name: "description", content: "Plugin da Luris para Roblox Studio: gere scripts, construa mapas, presets de prompt e hub de jogos suportados." },
      { property: "og:title", content: "Roblox Studio · Luris" },
      { property: "og:description", content: "IA dentro do Roblox Studio: scripts, builds e presets prontos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const GAMES = [
  { n: "Blox Fruits", e: "🍎", t: "Auto Farm · Stats · Devil Fruit" },
  { n: "Pet Simulator 99", e: "🐾", t: "Auto Hatch · Auto Sell · Trade" },
  { n: "Adopt Me", e: "🐶", t: "Trade Helper · Age Tracker" },
  { n: "Brookhaven", e: "🏠", t: "Fly · Speed · Fun Hub" },
  { n: "Da Hood", e: "🔫", t: "Aimbot · ESP · Auto Block" },
  { n: "Arsenal", e: "🎯", t: "Silent Aim · ESP · No Recoil" },
  { n: "Murder Mystery 2", e: "🔪", t: "ESP · Auto Win · Coin Farm" },
  { n: "Doors", e: "🚪", t: "Entity ESP · Item Finder" },
  { n: "Grow a Garden", e: "🌱", t: "Auto Plant · Auto Harvest" },
  { n: "King Legacy", e: "👑", t: "Auto Farm · Boss · Quest" },
];

type Preset = { cat: string; title: string; prompt: string };

const PRESETS: Preset[] = [
  { cat: "Sistemas", title: "Sistema de moedas + loja", prompt: "Crie um sistema de moedas salvo em DataStore com uma loja em GUI que vende 3 itens, com ServerScript e LocalScript separados." },
  { cat: "Sistemas", title: "Inventário com DataStore", prompt: "Crie um inventário por jogador com DataStore2-style (ProfileService simples), UI em grid e RemoteEvents seguros." },
  { cat: "Sistemas", title: "Sistema de níveis e XP", prompt: "Crie um sistema de XP/nível com barra na tela, ganho por matar NPC e salvamento em DataStore." },
  { cat: "Combate", title: "Espada com combo", prompt: "Crie uma ferramenta de espada com 3 golpes em combo, animações, hitbox por Raycast e cooldown." },
  { cat: "Combate", title: "Boss com fases", prompt: "Crie um NPC boss com 3 fases, ataques diferentes, barra de vida na tela e recompensa ao morrer." },
  { cat: "Mapa", title: "Gerador de obby", prompt: "Gere um script de plugin que constrói um obby de 20 plataformas com checkpoints e cores neon." },
  { cat: "Mapa", title: "Cidade procedural", prompt: "Construa no workspace uma cidade simples com ruas, 10 prédios de tamanhos variados e postes com luz." },
  { cat: "UI", title: "Menu principal animado", prompt: "Crie um menu principal com fundo desfocado, botões Play/Loja/Config, animações de tween e som ao clicar." },
  { cat: "UI", title: "HUD de jogo completo", prompt: "Crie um HUD com vida, moedas, minimapa fake e notificações que somem sozinhas." },
  { cat: "Mobile", title: "Controles mobile", prompt: "Crie botões touch para pular, correr e atacar, aparecendo apenas em dispositivos móveis." },
  { cat: "Multiplayer", title: "Round system", prompt: "Crie um sistema de rounds com intermissão, teleporte para arena, contagem no topo da tela e vencedor." },
  { cat: "Economia", title: "Trade entre jogadores", prompt: "Crie um sistema de trade seguro entre dois jogadores com confirmação dupla e validação no servidor." },
];

const CATS = Array.from(new Set(PRESETS.map((p) => p.cat)));

const FEATURES = [
  { n: "Hub Luris", t: "Interface unificada de scripts com tema cyber, drag, minimizar." },
  { n: "Anti-Ban", t: "Camadas de proteção e bypass de detectores comuns." },
  { n: "Auto-Update", t: "Scripts se atualizam sozinhos quando o jogo atualiza." },
  { n: "Suporte Mobile", t: "Funciona em Delta, Codex, Arceus X, Krnl Mobile." },
  { n: "Animações", t: "Transições neon, partículas e som de ativação." },
  { n: "IA Assistente", t: "Pergunte à Luris como usar qualquer script." },
];

function Roblox() {
  const [tab, setTab] = useState<"plugin" | "presets" | "hub">("plugin");
  const [cat, setCat] = useState<string>(CATS[0]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="glass-strong rounded-2xl p-6 glow-purple flex flex-wrap items-center gap-4">
        <Gamepad2 className="h-9 w-9 text-[oklch(0.78_0.28_330)]" />
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-3xl font-display gradient-text">Roblox Studio · Luris</h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Plugin com IA dentro do Studio, presets de prompt prontos e hub de scripts.
          </p>
        </div>
        <Link to="/downloads" className="inline-flex items-center gap-2 px-4 py-2 glass rounded-lg text-xs font-display hover-lift">
          <HardDriveDownload size={14} /> Downloads
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        {([
          ["plugin", "🧩 Plugin do Studio"],
          ["presets", "✨ Presets de prompt"],
          ["hub", "🎮 Hub de jogos"],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-xs font-display transition ${
              tab === k ? "btn-neon glow-purple" : "glass hover-lift"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "plugin" && (
        <section className="space-y-4">
          <div className="glass rounded-xl p-4 flex items-start gap-3">
            <Puzzle className="h-5 w-5 text-[oklch(0.85_0.2_60)] mt-0.5" />
            <p className="text-xs font-mono text-muted-foreground">
              Crie uma API key, baixe o <b>.lua</b> e coloque na pasta de plugins do Studio.
              A Luris responde, gera scripts e insere direto no seu jogo.
            </p>
          </div>
          <RobloxPlugin />
        </section>
      )}

      {tab === "presets" && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono ${
                  cat === c ? "btn-neon" : "glass hover-lift"
                }`}>{c}</button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {PRESETS.filter((p) => p.cat === cat).map((p) => (
              <div key={p.title} className="glass p-4 rounded-xl card-interactive space-y-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-[oklch(0.8_0.25_295)]" />
                  <h3 className="font-display gradient-text text-sm">{p.title}</h3>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground">{p.prompt}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(p.prompt); toast.success("Prompt copiado — cole no plugin ou no chat"); }}
                    className="glass px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1 hover-lift">
                    <Copy className="h-3 w-3" /> Copiar prompt
                  </button>
                  <Link to="/chat" className="px-3 py-1.5 rounded-lg text-[11px] btn-neon font-display">
                    Pedir à Luris →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "hub" && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-display neon-text mb-3">🎯 Jogos suportados</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GAMES.map((g) => (
                <div key={g.n} className="glass p-4 rounded-xl card-interactive flex gap-3 items-start">
                  <div className="text-3xl">{g.e}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display gradient-text">{g.n}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono">{g.t}</p>
                    <Link to="/scriptforge" className="text-[11px] neon-text-magenta hover:underline">Abrir no Forge →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-display neon-text-magenta mb-3">⚡ Recursos do Hub</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURES.map((f) => (
                <div key={f.n} className="glass p-4 rounded-xl card-interactive">
                  <h3 className="font-display gradient-text">{f.n}</h3>
                  <p className="text-xs text-muted-foreground">{f.t}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 neon-text" />
              <h2 className="text-lg font-display neon-text">📜 Loader rápido (exemplo)</h2>
            </div>
            <pre className="bg-black/60 border border-[oklch(0.5_0.15_295/0.3)] rounded-lg p-3 text-xs font-mono text-[oklch(0.85_0.2_295)] overflow-x-auto">
{`loadstring(game:HttpGet("https://luris-ia.lovable.app/hub.lua"))()`}
            </pre>
            <p className="text-[11px] text-muted-foreground font-mono mt-2">
              Cole no seu executor (Delta, Krnl, Codex...). O hub detecta o jogo automaticamente.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
