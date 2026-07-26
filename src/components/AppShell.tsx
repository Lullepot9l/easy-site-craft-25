import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, MessageSquare, Image as ImgIcon, Users, ShoppingBag,
  Code2, Gamepad2, Crown, FileDown, LogOut, Sparkles, Globe, Terminal, Zap,
  Flame, Infinity as InfinityIcon, ChevronDown, Heart, Settings2, IdCard,
} from "lucide-react";
import { useState, type ReactNode, type ComponentType } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LurisLogo } from "@/components/LurisLogo";
import { CyberBackground } from "@/components/CyberBackground";
import { GodMode } from "@/components/GodMode";
import { AvatarBubble } from "@/components/AvatarBubble";

type NavItem = { to: string; icon: ComponentType<{ className?: string }>; label: string };

const MAIN_NAV_KEYS = [
  { to: "/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
  { to: "/chat", icon: MessageSquare, key: "nav.chat" },
  { to: "/images", icon: ImgIcon, key: "nav.images" },
] as const;

const HUB_NAV_KEYS = [
  { to: "/social", icon: Users, key: "nav.social" },
  { to: "/marketplace", icon: ShoppingBag, key: "nav.marketplace" },
  { to: "/premium", icon: Sparkles, key: "nav.premium" },
] as const;

const COMMUNITY_NAV: NavItem[] = [
  { to: "/friends", icon: Heart, label: "Amigos / DMs" },
];

const ACCOUNT_NAV: NavItem[] = [
  { to: "/profile", icon: IdCard, label: "Meu perfil" },
  { to: "/settings", icon: Settings2, label: "Configurações" },
];

const DEV_NAV_KEYS = [
  { to: "/scriptforge", icon: Code2, key: "nav.scriptforge" },
  { to: "/roblox", icon: Gamepad2, key: "nav.roblox" },
] as const;

const OWNER_TOOLS: NavItem[] = [
  { to: "/owner", icon: Crown, label: "Owner" },
  { to: "/discord", icon: MessageSquare, label: "Discord Bot" },
  { to: "/nexus", icon: Terminal, label: "Nexus" },
  { to: "/hub", icon: Zap, label: "Hub" },
  { to: "/export", icon: FileDown, label: "Export" },
];

const OWNER_PHASES: NavItem[] = [
  { to: "/phase1", icon: Sparkles, label: "P1 · Gamif" },
  { to: "/phase2", icon: Sparkles, label: "P2 · Omni" },
  { to: "/phase3", icon: Sparkles, label: "P3 · Quantum" },
  { to: "/phase4", icon: Flame,    label: "P4 · Kingdom" },
  { to: "/phase5", icon: Sparkles, label: "P5 · Legend" },
  { to: "/phase6", icon: Flame,    label: "P6 · Titan" },
  { to: "/phase7", icon: InfinityIcon, label: "P7 · Infinity" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { profile, role, isOwner } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Até breve");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex relative">
      <CyberBackground />
      <aside className="w-64 glass-strong border-r border-[oklch(0.4_0.15_295/0.3)] flex flex-col p-4 sticky top-0 h-screen z-10">
        <div className="mb-6"><LurisLogo size="text-2xl" /></div>

        <nav className="space-y-4 flex-1 overflow-y-auto pr-1">
          <NavGroup label="Principal" path={path} items={MAIN_NAV_KEYS.map(i => ({ to: i.to, icon: i.icon, label: t(i.key) }))} />
          <NavGroup label="Comunidade" path={path} items={[...HUB_NAV_KEYS.map(i => ({ to: i.to, icon: i.icon, label: t(i.key) })), ...COMMUNITY_NAV]} />
          <NavGroup label="Conta" path={path} items={ACCOUNT_NAV} />
          {isOwner && (
            <NavGroup label="Dev" path={path} items={DEV_NAV_KEYS.map(i => ({ to: i.to, icon: i.icon, label: t(i.key) }))} />
          )}

          {isOwner && (
            <>
              <OwnerCollapse label="Owner · Tools" path={path} items={OWNER_TOOLS} accent="magenta" defaultOpen />
              <OwnerCollapse label="Owner · Phases" path={path} items={OWNER_PHASES} accent="magenta" compact />
            </>
          )}
        </nav>


        <div className="mt-4 pt-4 border-t border-[oklch(0.4_0.15_295/0.3)] space-y-2">
          <div className="flex items-center gap-2 text-xs px-2">
            <AvatarBubble url={profile?.avatar_url} name={profile?.display_name} size={32} effect={profile?.equipped_effect ?? (isOwner ? "fx-owner-purple" : null)} />
            <div className="min-w-0">
              <div className="truncate text-[oklch(0.92_0.04_295)]">{profile?.display_name ?? "..."}</div>
              <div className="text-[10px] uppercase neon-text-cyan font-mono">{role}</div>
            </div>
          </div>
          <button onClick={() => setLang(lang === "pt" ? "en" : "pt")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs font-mono hover-lift">
            <Globe className="h-3 w-3" /> {lang === "pt" ? "PT 🇧🇷 → EN" : "EN 🇺🇸 → PT"}
          </button>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs font-display text-[oklch(0.75_0.2_25)] hover:bg-[oklch(0.3_0.2_25/0.3)]">
            <LogOut className="h-3 w-3" /> {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 relative z-10 overflow-x-hidden">{children}</main>
      <GodMode />
    </div>
  );
}

function NavLink({ item, path, compact = false, accent = "purple" }: {
  item: NavItem; path: string; compact?: boolean; accent?: "purple" | "magenta";
}) {
  const active = path.startsWith(item.to);
  const activeCls = accent === "magenta"
    ? "bg-[oklch(0.3_0.25_330/0.4)] neon-text-magenta glow-magenta"
    : "bg-[oklch(0.3_0.2_295/0.4)] neon-text glow-purple";
  const hoverCls = accent === "magenta"
    ? "hover:bg-[oklch(0.25_0.2_330/0.25)]"
    : "hover:bg-[oklch(0.2_0.08_295/0.3)]";
  return (
    <Link to={item.to}
      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg font-display transition ${
        compact ? "text-xs" : "text-sm"
      } ${active ? activeCls : `text-[oklch(0.85_0.05_295)] ${hoverCls}`}`}>
      <item.icon className={compact ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0"} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroup({ label, items, path }: { label: string; items: NavItem[]; path: string }) {
  return (
    <div className="space-y-0.5">
      <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[oklch(0.55_0.1_295)]">{label}</div>
      {items.map((it) => <NavLink key={it.to} item={it} path={path} />)}
    </div>
  );
}

function OwnerCollapse({ label, items, path, accent = "magenta", defaultOpen = false, compact = false }: {
  label: string; items: NavItem[]; path: string; accent?: "purple" | "magenta"; defaultOpen?: boolean; compact?: boolean;
}) {
  const hasActive = items.some((i) => path.startsWith(i.to));
  const [open, setOpen] = useState(defaultOpen || hasActive);
  return (
    <div className="space-y-0.5">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-[oklch(0.7_0.2_330)] hover:text-[oklch(0.85_0.25_330)]">
        <span>{label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && items.map((it) => <NavLink key={it.to} item={it} path={path} accent={accent} compact={compact} />)}
    </div>
  );
}

