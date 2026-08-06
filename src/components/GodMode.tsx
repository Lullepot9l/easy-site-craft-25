import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useDraggableBubble } from "@/hooks/use-draggable-bubble";

export function GodMode() {
  const { isOwner, profile } = useAuth();
  const [active, setActive] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { pos, onPointerDown } = useDraggableBubble(
    "luris.assistant.pos",
    { x: 24, y: 24 },
    () => setAvatarOpen((v) => !v),
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.shiftKey && (e.key === "L" || e.key === "l")) {
        if (!isOwner) {
          toast.error("🔒 God Mode é exclusivo do Owner");
          return;
        }
        setActive((v) => {
          toast.success(v ? "God Mode desativado" : "🐉 GOD MODE ATIVO");
          return !v;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOwner]);

  return (
    <>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-[60]">
          <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.3_0.3_330/0.15)] via-transparent to-[oklch(0.3_0.3_295/0.15)] animate-pulse" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-strong px-5 py-2 rounded-full glow-magenta font-display neon-text-magenta text-sm pointer-events-auto flex items-center gap-3">
            🐉 GOD MODE · {profile?.display_name}
            <button onClick={() => setActive(false)} className="opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
          </div>
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 text-[28rem] opacity-10 select-none">🐉</div>
        </div>
      )}

      <div className="fixed z-50 flex flex-col items-end gap-2" style={{ right: pos.x, bottom: pos.y }}>
        {avatarOpen && (
          <div className="glass-strong rounded-2xl p-4 w-72 glow-purple animate-fade-in-up">
            <div className="font-display neon-text mb-1">Luris · sua assistente pessoal</div>
            <p className="text-xs text-muted-foreground mb-3">Olá {profile?.display_name ?? "viajante"}. Posso te levar a qualquer setor.</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/chat" onClick={() => setAvatarOpen(false)} className="glass p-2 rounded-lg hover-lift text-center">💬 Chat</Link>
              <Link to="/images" onClick={() => setAvatarOpen(false)} className="glass p-2 rounded-lg hover-lift text-center">🎨 Imagens</Link>
              <Link to="/downloads" onClick={() => setAvatarOpen(false)} className="glass p-2 rounded-lg hover-lift text-center">⬇️ Downloads</Link>
              <Link to="/social" onClick={() => setAvatarOpen(false)} className="glass p-2 rounded-lg hover-lift text-center">🌐 Social</Link>
            </div>
            <p className="mt-3 text-[10px] font-mono text-muted-foreground">Arraste esta bolha pra onde quiser.</p>
            {isOwner && <p className="mt-3 text-[10px] font-mono text-muted-foreground">Dica: <span className="neon-text-magenta">Shift + L</span> ativa o God Mode</p>}
          </div>
        )}
        <button
          aria-label="Assistente Luris"
          onPointerDown={onPointerDown}
          className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-[oklch(0.6_0.3_295)] to-[oklch(0.6_0.32_330)] glow-purple flex items-center justify-center hover:scale-110 transition cursor-grab active:cursor-grabbing touch-none select-none">
          <img src="/luris-icon.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <Sparkles className="relative h-6 w-6 text-white drop-shadow" />
        </button>
      </div>
    </>
  );
}
