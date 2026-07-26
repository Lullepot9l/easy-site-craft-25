import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, Pencil, Server, Sparkles, MessageSquare, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AvatarBubble } from "@/components/AvatarBubble";
import { NAME_COLORS, NAME_FONTS, optionClass, statusMeta } from "@/lib/profile-style";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Luris IA" },
      { name: "description", content: "Seu cartão de perfil na Luris IA: aura, status de atividade, jogo atual, coleção de jogos, servidores mútuos e estilo do nome." },
      { property: "og:title", content: "Meu perfil — Luris IA" },
      { property: "og:description", content: "Cartão de perfil Luris IA com aura animada, status, jogos e estilo personalizado." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, role, isOwner, user } = useAuth();
  const theme = profile?.profile_theme ?? "neon";
  const status = statusMeta(profile?.activity_status);
  const joined = profile?.created_at ?? user?.created_at;
  const games = profile?.favorite_games ?? [];
  const servers = profile?.mutual_servers ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-display gradient-text">🪪 Meu perfil</h1>
        <Link to="/settings" className="btn-neon px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2">
          <Pencil className="h-3 w-3" /> Editar perfil
        </Link>
      </div>

      <section className={`glass-strong rounded-2xl overflow-hidden profile-theme-${theme}`}>
        <div className="h-28 bg-gradient-to-r from-[oklch(0.35_0.25_295/0.7)] via-[oklch(0.3_0.28_330/0.6)] to-[oklch(0.25_0.2_260/0.6)] animate-pulse-slow" />
        <div className="p-6 -mt-14">
          <div className="flex items-end gap-4 flex-wrap">
            <AvatarBubble url={profile?.avatar_url} name={profile?.display_name} size={112}
              effect={profile?.equipped_effect ?? (isOwner ? "fx-owner-purple" : null)} />
            <div className="flex-1 min-w-0 pb-1">
              <div className={`text-4xl truncate ${optionClass(NAME_FONTS, profile?.name_font)} ${optionClass(NAME_COLORS, profile?.name_color)}`}>
                {profile?.display_name ?? "Sem nome"}
              </div>
              <div className="font-mono text-xs neon-text-cyan">
                @{profile?.username ?? "usuario"} · {profile?.codename ?? "sem codinome"} · <span className="uppercase">{role}</span>
                {profile?.is_verified && " · ✅"}
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">
            {profile?.bio || "Sem descrição ainda — escreve algo nas Configurações pras pessoas te conhecerem."}
          </p>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <Card title="Status de atividade">
              <span className="inline-flex items-center gap-2 text-sm font-mono">
                <span className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: status.dot }} />
                {status.label}
              </span>
              {profile?.current_game && (
                <div className="mt-2 glass rounded-lg p-2.5 flex items-center gap-2 text-sm">
                  <Gamepad2 className="h-4 w-4 neon-text-magenta" />
                  <span>Jogando <b>{profile.current_game}</b></span>
                </div>
              )}
            </Card>

            <Card title="Coleção de jogos">
              {games.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {games.map((g) => (
                    <span key={g} className="glass px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1 hover-lift">
                      <Gamepad2 className="h-3 w-3" /> {g}
                    </span>
                  ))}
                </div>
              ) : <Empty>Nenhum jogo favorito escolhido.</Empty>}
            </Card>

            <Card title="Servidores mútuos">
              {servers.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {servers.map((s) => (
                    <span key={s} className="glass px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1">
                      <Server className="h-3 w-3" /> {s}
                    </span>
                  ))}
                </div>
              ) : <Empty>Nenhum servidor em comum listado.</Empty>}
            </Card>

            <Card title="Conta">
              <ul className="space-y-1.5 text-[12px] font-mono text-muted-foreground">
                <li className="flex items-center gap-2"><CalendarDays className="h-3 w-3" /> Entrou em {joined ? new Date(joined).toLocaleDateString("pt-BR") : "—"}</li>
                <li className="flex items-center gap-2"><Sparkles className="h-3 w-3" /> Nível {profile?.level ?? 1} · {profile?.xp ?? 0} XP · {profile?.coins ?? 0} 🪙</li>
                <li className="flex items-center gap-2"><MessageSquare className="h-3 w-3" /> Discord: {profile?.discord_username ?? "—"} · WhatsApp: {profile?.whatsapp_number ?? "—"}</li>
                {profile?.account_id && <li>ID: {profile.account_id}</li>}
              </ul>
            </Card>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <Link to="/marketplace" className="glass px-3 py-1.5 rounded-lg text-xs font-mono hover-lift flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Trocar aura / estilo no Marketplace
            </Link>
            <Link to="/friends" className="glass px-3 py-1.5 rounded-lg text-xs font-mono hover-lift flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> Amigos & DMs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-4 hover-lift">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[oklch(0.6_0.15_295)] mb-2">{title}</div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-mono text-muted-foreground">{children}</p>;
}
