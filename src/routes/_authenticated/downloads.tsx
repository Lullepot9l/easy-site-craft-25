import { createFileRoute, Link } from "@tanstack/react-router";
import { MonitorDown, Apple, Bot, Smartphone, Puzzle, Gamepad2, MessageSquare, ShieldCheck, Cpu, HardDriveDownload } from "lucide-react";
import { InstallApp } from "@/components/InstallApp";
import { MobileModeToggle } from "@/components/MobileModeToggle";
import lurisWinZip from "@/assets/Luris-Windows.zip.asset.json";

export const Route = createFileRoute("/_authenticated/downloads")({
  component: Downloads,
  head: () => ({
    meta: [
      { title: "Downloads Luris · app para Windows, iPhone e Android" },
      { name: "description", content: "Central de downloads da Luris: aplicativo .exe para Windows, PWA para iPhone e Android, plugin do Roblox Studio e bot do Discord." },
      { property: "og:title", content: "Downloads Luris" },
      { property: "og:description", content: "Baixe a Luris no Windows, iPhone, Android, Roblox Studio e Discord." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const WIN_SPECS = [
  { i: Cpu, t: "Windows 10/11 · 64-bit", d: "Janela nativa, sem barra do navegador" },
  { i: Gamepad2, t: "Detecção de jogo", d: "Mostra no perfil o jogo aberto no PC" },
  { i: ShieldCheck, t: "Modo offline", d: "Abre e mantém seus dados locais sem internet" },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-strong rounded-2xl p-5 card-interactive ${className}`}>{children}</div>;
}

function Downloads() {
  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl">
      <header className="glass-strong rounded-2xl p-6 glow-purple flex items-center gap-3">
        <HardDriveDownload className="h-9 w-9 text-[oklch(0.78_0.28_330)]" />
        <div>
          <h1 className="text-3xl font-display gradient-text">Downloads · luris.app</h1>
          <p className="text-xs font-mono text-muted-foreground">
            Tudo num só lugar: PC, celular, Roblox Studio e Discord.
          </p>
        </div>
      </header>

      {/* WINDOWS */}
      <Card className="glow-purple">
        <div className="flex items-center gap-2 mb-2">
          <MonitorDown className="h-5 w-5 neon-text-magenta" />
          <h2 className="text-xl font-display neon-text-magenta">Luris para Windows (.exe)</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 my-4">
          {WIN_SPECS.map((s) => (
            <div key={s.t} className="glass rounded-xl p-3">
              <s.i className="h-4 w-4 mb-1 text-[oklch(0.8_0.2_295)]" />
              <div className="text-xs font-display">{s.t}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
        <ol className="list-decimal pl-5 space-y-1 text-xs font-mono text-muted-foreground mb-4">
          <li>Baixe <b>Luris-Windows.zip</b>.</li>
          <li>Botão direito → <b>Extrair tudo</b>.</li>
          <li>Abra a pasta e rode <b>Luris.exe</b>.</li>
          <li>Se o Windows avisar: <b>Mais informações → Executar assim mesmo</b>.</li>
        </ol>
        <a href={lurisWinZip.url} download="Luris-Windows.zip"
          className="inline-flex items-center gap-2 px-5 py-2.5 btn-neon rounded-xl font-display glow-purple">
          <MonitorDown size={16} /> Baixar Luris-Windows.zip
        </a>
      </Card>

      {/* MOBILE */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="h-5 w-5 neon-text" />
          <h2 className="text-xl font-display neon-text">Celular · iPhone e Android</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="glass rounded-xl p-3 text-xs">
            <div className="flex items-center gap-2 font-display mb-1"><Apple className="h-4 w-4" /> iPhone / iPad</div>
            <ol className="list-decimal pl-4 space-y-0.5 font-mono text-[11px] text-muted-foreground">
              <li>Abra no <b>Safari</b>.</li>
              <li>Toque em <b>Compartilhar</b> (▲).</li>
              <li><b>Adicionar à Tela de Início</b>.</li>
            </ol>
          </div>
          <div className="glass rounded-xl p-3 text-xs">
            <div className="flex items-center gap-2 font-display mb-1"><Bot className="h-4 w-4" /> Android</div>
            <ol className="list-decimal pl-4 space-y-0.5 font-mono text-[11px] text-muted-foreground">
              <li>Abra no <b>Chrome</b>.</li>
              <li>Menu <b>⋮</b> → <b>Instalar aplicativo</b>.</li>
              <li>Confirme <b>Instalar</b>.</li>
            </ol>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <InstallApp />
          <MobileModeToggle />
        </div>
      </Card>

      {/* EXTRAS */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Puzzle className="h-5 w-5 text-[oklch(0.85_0.2_60)]" />
            <h2 className="text-lg font-display gradient-text">Plugin do Roblox Studio</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Gere o arquivo <b>.lua</b> com sua API key embutida e converse com a Luris dentro do Studio.
          </p>
          <Link to="/roblox" className="inline-flex items-center gap-2 px-4 py-2 glass rounded-lg font-display text-sm hover-lift">
            <Gamepad2 size={14} /> Abrir Roblox Studio
          </Link>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-5 w-5 text-[oklch(0.78_0.28_330)]" />
            <h2 className="text-lg font-display gradient-text">Bot do Discord</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Instale a Luris no seu servidor: slash commands, embeds e respostas com IA.
          </p>
          <Link to="/discord" className="inline-flex items-center gap-2 px-4 py-2 glass rounded-lg font-display text-sm hover-lift">
            <MessageSquare size={14} /> Painel do Discord
          </Link>
        </Card>
      </div>
    </div>
  );
}
