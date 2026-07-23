import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/roblox")({ component: Roblox });

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

const FEATURES = [
  { n: "Hub Luris", t: "Interface unificada de scripts com tema cyber, drag, minimizar." },
  { n: "Anti-Ban", t: "Camadas de proteção e bypass de detectores comuns." },
  { n: "Auto-Update", t: "Scripts se atualizam sozinhos quando o jogo atualiza." },
  { n: "Suporte Mobile", t: "Funciona em Delta, Codex, Arceus X, Krnl Mobile." },
  { n: "Animações", t: "Transições neon, partículas e som de ativação." },
  { n: "IA Assistente", t: "Pergunte à Luris como usar qualquer script." },
];

function Roblox() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="glass-strong rounded-2xl p-6 glow-purple">
        <h1 className="text-4xl font-display gradient-text">🎮 Roblox Luris</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Hub de scripts oficial Luris · sem censura · com IA integrada para te ajudar a usar.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-display neon-text mb-3">🎯 Jogos suportados</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GAMES.map((g) => (
            <div key={g.n} className="glass p-4 rounded-xl hover-lift flex gap-3 items-start">
              <div className="text-3xl">{g.e}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display gradient-text">{g.n}</h3>
                <p className="text-[11px] text-muted-foreground font-mono">{g.t}</p>
                <Link to="/scriptforge" className="text-[11px] neon-text-magenta hover:underline">Abrir no Forge →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-display neon-text-magenta mb-3">⚡ Recursos do Hub</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.n} className="glass p-4 rounded-xl">
              <h3 className="font-display gradient-text">{f.n}</h3>
              <p className="text-xs text-muted-foreground">{f.t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-strong rounded-2xl p-6">
        <h2 className="text-lg font-display neon-text mb-2">📜 Loader rápido (exemplo)</h2>
        <pre className="bg-black/60 border border-[oklch(0.5_0.15_295/0.3)] rounded-lg p-3 text-xs font-mono text-[oklch(0.85_0.2_295)] overflow-x-auto">
{`loadstring(game:HttpGet("https://luris.lovable.app/hub.lua"))()`}
        </pre>
        <p className="text-[11px] text-muted-foreground font-mono mt-2">
          Cole no seu executor (Delta, Krnl, Codex...). O hub detecta o jogo automaticamente.
        </p>
      </section>
    </div>
  );
}
