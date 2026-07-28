import { useEffect, useState } from "react";
import { Smartphone, Monitor } from "lucide-react";

const KEY = "luris.viewmode"; // "mobile" | "desktop"

function applyMode(mode: "mobile" | "desktop") {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute(
      "content",
      mode === "mobile"
        ? "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        : "width=1200, initial-scale=0.3, maximum-scale=5",
    );
  }
  document.documentElement.classList.toggle("force-desktop", mode === "desktop");
}

export function MobileModeToggle({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as "mobile" | "desktop" | null) ?? "mobile";
    setMode(saved);
    applyMode(saved);
  }, []);

  function toggle() {
    const next = mode === "mobile" ? "desktop" : "mobile";
    setMode(next);
    localStorage.setItem(KEY, next);
    applyMode(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg glass hover-lift font-display text-sm ${className}`}
      title="Alternar entre site mobile (em pé) e site completo"
    >
      {mode === "mobile" ? <Smartphone size={16} /> : <Monitor size={16} />}
      {mode === "mobile" ? "Site mobile (ativo)" : "Site completo (ativo)"}
    </button>
  );
}
