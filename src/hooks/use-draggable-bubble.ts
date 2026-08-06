import { useEffect, useRef, useState } from "react";

type Pos = { x: number; y: number };

/**
 * Bolha flutuante arrastável (ancorada em right/bottom), com posição salva.
 * Clique sem arrastar dispara onTap.
 */
export function useDraggableBubble(storageKey: string, initial: Pos, onTap: () => void) {
  const [pos, setPos] = useState<Pos>(initial);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const tap = useRef(onTap);
  tap.current = onTap;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw) as Pos;
        if (typeof p?.x === "number" && typeof p?.y === "number") setPos(p);
      }
    } catch { /* noop */ }
  }, [storageKey]);

  useEffect(() => {
    function move(e: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      d.moved = true;
      const x = Math.min(Math.max(8, window.innerWidth - e.clientX + d.dx), Math.max(8, window.innerWidth - 72));
      const y = Math.min(Math.max(8, window.innerHeight - e.clientY + d.dy), Math.max(8, window.innerHeight - 72));
      setPos({ x, y });
    }
    function up() {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      setPos((p) => {
        try { localStorage.setItem(storageKey, JSON.stringify(p)); } catch { /* noop */ }
        return p;
      });
      if (!d.moved) tap.current();
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [storageKey]);

  function onPointerDown(e: React.PointerEvent) {
    drag.current = {
      dx: e.clientX - (window.innerWidth - pos.x),
      dy: e.clientY - (window.innerHeight - pos.y),
      moved: false,
    };
  }

  return { pos, onPointerDown, dragging: () => !!drag.current };
}
