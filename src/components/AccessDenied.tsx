import { Link } from "@tanstack/react-router";
import { Lock, ArrowLeft } from "lucide-react";

export function AccessDenied({ required = "owner" }: { required?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-in-up">
      <div className="relative">
        <div className="absolute inset-0 bg-[oklch(0.6_0.32_25/0.3)] blur-3xl" />
        <Lock className="relative h-16 w-16 text-[oklch(0.75_0.25_25)]" />
      </div>
      <h1 className="text-3xl font-display neon-text-magenta">Acesso negado</h1>
      <p className="text-sm font-mono text-muted-foreground">Requer permissão: <span className="neon-text-cyan">{required}</span></p>
      <Link to="/dashboard" className="btn-neon px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2">
        <ArrowLeft className="h-3 w-3" /> Voltar ao dashboard
      </Link>
    </div>
  );
}

export function LoadingShield({ label = "Verificando permissões..." }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-full border-2 border-[oklch(0.7_0.28_295)] border-t-transparent animate-spin" />
      <p className="font-mono text-xs text-[oklch(0.7_0.15_295)] animate-pulse">{label}</p>
    </div>
  );
}
