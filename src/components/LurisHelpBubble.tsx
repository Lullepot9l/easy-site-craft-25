import { useEffect, useRef, useState } from "react";
import { HelpCircle, X, GripVertical } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const POS_KEY = "luris.help.pos";

type Cmd = { cmd: string; what: string; owner?: boolean };

const CHAT_CMDS: Cmd[] = [
  { cmd: "desenha uma imagem de ...", what: "a Luris cria a imagem na hora, dentro do chat" },
  { cmd: "gera 3 imagens de ...", what: "várias imagens de uma vez no Estúdio" },
  { cmd: "luris, lembre que eu ...", what: "ela guarda o fato na memória da sua conta" },
  { cmd: "esqueça que eu ...", what: "apaga aquele fato da memória" },
  { cmd: "modo Smart (botão)", what: "resposta organizada por prioridade" },
  { cmd: "Fala comigo (botão)", what: "ela responde em texto E fala com a voz escolhida" },
  { cmd: "Compartilhar tela", what: "ela olha sua tela pelo frame enviado" },
  { cmd: "PDF / MD (botões)", what: "exporta a conversa atual" },
];

const OWNER_CMDS: Cmd[] = [
  { cmd: "luris, coloca 500 lucoins na minha conta", what: "adiciona LuCoins", owner: true },
  { cmd: "luris, tira 100 lucoins da conta LU-XXXXXX", what: "remove LuCoins de alguém", owner: true },
  { cmd: "luris, define meus lucoins em 10000", what: "define o saldo exato", owner: true },
  { cmd: "luris, me dá 5000 de xp", what: "adiciona XP", owner: true },
  { cmd: "luris, coloca meu nível em 50", what: "define o nível", owner: true },
  { cmd: "luris, verifica minha conta", what: "coloca o selo verificado ✔", owner: true },
  { cmd: "luris, muda meu nome pra Lulle 🌑", what: "troca o nome de exibição", owner: true },
  { cmd: "luris, deixa @fulano premium", what: "troca o cargo (user/premium/admin/owner)", owner: true },
  { cmd: "luris, muda seus sentimentos pra ...", what: "reprograma a mente dela", owner: true },
];

export function LurisHelpBubble() {
  const { isOwner } = useAuth();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 120 });
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { x: number; y: number };
        if (typeof p?.x === "number" && typeof p?.y === "number") setPos(p);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!drag.current) return;
      drag.current.moved = true;
      const x = Math.min(Math.max(8, window.innerWidth - e.clientX + drag.current.dx), window.innerWidth - 70);
      const y = Math.min(Math.max(8, window.innerHeight - e.clientY + drag.current.dy), window.innerHeight - 70);
      setPos({ x, y });
    }
    function up() {
      if (!drag.current) return;
      const moved = drag.current.moved;
      drag.current = null;
      setPos((p) => { try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch { /* noop */ } return p; });
      if (!moved) setOpen((v) => !v);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  const cmds = isOwner ? [...CHAT_CMDS, ...OWNER_CMDS] : CHAT_CMDS;

  return (
    <div className="fixed z-[60]" style={{ right: pos.x, bottom: pos.y }}>
      {open && (
        <div className="absolute bottom-16 right-0 w-[320px] max-h-[60vh] overflow-y-auto glass-strong rounded-2xl p-4 glow-purple border border-[oklch(0.5_0.25_295/0.5)] animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm gradient-text">Atalhos & comandos da Luris</h3>
            <button onClick={() => setOpen(false)} className="glass p-1 rounded-lg"><X className="h-3 w-3" /></button>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mb-3">
            Fale normal no chat — ela entende. Arraste esta bolha pra onde quiser.
          </p>
          <ul className="space-y-2">
            {cmds.map((c) => (
              <li key={c.cmd} className={`glass rounded-lg p-2 ${c.owner ? "border border-[oklch(0.6_0.28_330/0.4)]" : ""}`}>
                <div className="text-[11px] font-mono text-[oklch(0.88_0.12_295)]">
                  {c.owner && <span className="text-[9px] mr-1 text-[oklch(0.8_0.28_330)]">👑</span>}
                  {c.cmd}
                </div>
                <div className="text-[10px] text-muted-foreground">{c.what}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        aria-label="Ajuda da Luris"
        onPointerDown={(e) => {
          drag.current = {
            dx: e.clientX - (window.innerWidth - pos.x),
            dy: e.clientY - (window.innerHeight - pos.y),
            moved: false,
          };
        }}
        className="h-13 w-13 p-3.5 rounded-full btn-neon glow-purple flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none hover-lift"
      >
        {open ? <GripVertical className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
