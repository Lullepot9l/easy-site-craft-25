import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AccessDenied, LoadingShield } from "@/components/AccessDenied";
import { DiscordIntegration } from "@/components/DiscordIntegration";
import { DiscordCommandManager } from "@/components/DiscordCommandManager";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/discord")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Discord · Bot Luris" },
      { name: "description", content: "Painel owner para configurar e controlar o bot Luris no Discord." },
    ],
  }),
});

function Page() {
  const { isOwner, loading, user } = useAuth();
  if (loading) return <LoadingShield />;
  if (!isOwner || !user) return <AccessDenied required="owner" />;
  return (
    <div className="space-y-6 animate-fade-in-up max-w-6xl">
      <header className="glass-strong rounded-2xl p-6 glow-purple flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-[oklch(0.78_0.28_330)]" />
        <div>
          <h1 className="text-3xl font-display neon-text-magenta">Discord · Bot Luris</h1>
          <p className="text-xs font-mono text-muted-foreground">
            Painel completo: perfil do bot (avatar/banner/nome), mensagens, embeds, DMs, canais, cargos, membros e slash commands.
          </p>
        </div>
      </header>
      <DiscordCommandManager />
      <DiscordIntegration ownerId={user.id} />
    </div>
  );
}
