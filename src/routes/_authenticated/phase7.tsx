import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AccessDenied, LoadingShield } from "@/components/AccessDenied";
import { OwnerPhase7 } from "@/components/OwnerPhase7";
import { Infinity as InfinityIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/phase7")({ component: Page });

function Page() {
  const { isOwner, loading } = useAuth();
  if (loading) return <LoadingShield />;
  if (!isOwner) return <AccessDenied required="owner" />;
  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="glass-strong rounded-2xl p-6 glow-magenta flex items-center gap-3">
        <InfinityIcon className="h-8 w-8 text-[oklch(0.78_0.28_330)]" />
        <div>
          <h1 className="text-3xl font-display neon-text-magenta">Phase 7 · Luris Infinity</h1>
          <p className="text-xs font-mono text-muted-foreground">41 features: educação, saúde, direito, travel, fashion, kids, sports, spirit.</p>
        </div>
      </header>
      <OwnerPhase7 />
    </div>
  );
}
