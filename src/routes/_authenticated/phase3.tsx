import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AccessDenied, LoadingShield } from "@/components/AccessDenied";
import { OwnerPhase3 } from "@/components/OwnerPhase3";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/phase3")({ component: Page });

function Page() {
  const { isOwner, loading } = useAuth();
  if (loading) return <LoadingShield />;
  if (!isOwner) return <AccessDenied required="owner" />;
  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="glass-strong rounded-2xl p-6 glow-purple flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-[oklch(0.78_0.28_330)]" />
        <div>
          <h1 className="text-3xl font-display neon-text-magenta">Phase 3 · Quantum & Singularity</h1>
          <p className="text-xs font-mono text-muted-foreground">25 features quantum: neural, matrix, stealth, vault, oracle, swarm.</p>
        </div>
      </header>
      <OwnerPhase3 />
    </div>
  );
}
