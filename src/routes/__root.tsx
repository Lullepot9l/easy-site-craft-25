import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { I18nProvider } from "@/lib/i18n";
import { CyberBackground } from "@/components/CyberBackground";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative">
      <CyberBackground />
      <div className="text-center glass-strong p-10 rounded-2xl glow-purple max-w-md">
        <h1 className="text-7xl font-display gradient-text">404</h1>
        <p className="mt-4 text-muted-foreground">Setor não encontrado na grid.</p>
        <Link to="/" className="mt-6 inline-block px-6 py-2 btn-neon rounded-lg">Voltar à base</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative">
      <CyberBackground />
      <div className="text-center glass-strong p-10 rounded-2xl glow-magenta max-w-md">
        <h1 className="text-2xl font-display neon-text-magenta">Falha no sistema</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 px-6 py-2 btn-neon rounded-lg">
          Reiniciar módulo
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Luris IA — Assistente premium, chat, imagens e scripts" },
      { name: "description", content: "Luris IA: assistente de inteligência artificial em português com chat, geração de imagens, script forge, marketplace e painel Owner. Ecossistema premium estilo Tóquio cyberpunk." },
      { name: "keywords", content: "luris ia, luris ai, assistente ia, chat ia, ia brasileira, ia premium, script ai, roblox luris, ia cyberpunk" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "Lulle🌑" },
      { property: "og:title", content: "Luris IA — Assistente premium, chat, imagens e scripts" },
      { property: "og:description", content: "Luris IA: assistente de inteligência artificial em português com chat, geração de imagens, script forge, marketplace e painel Owner. Ecossistema premium estilo Tóquio cyberpunk." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://luris.lovable.app/" },
      { property: "og:site_name", content: "Luris IA" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:title", content: "Luris IA — Assistente premium, chat, imagens e scripts" },
      { name: "twitter:description", content: "Luris IA: assistente de inteligência artificial em português com chat, geração de imagens, script forge, marketplace e painel Owner. Ecossistema premium estilo Tóquio cyberpunk." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/01c2c27c-58d2-48f3-8785-47dd6923a748/id-preview-494cda46--53121100-7631-4267-8c59-bd4882550793.lovable.app-1779225558511.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/01c2c27c-58d2-48f3-8785-47dd6923a748/id-preview-494cda46--53121100-7631-4267-8c59-bd4882550793.lovable.app-1779225558511.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Audiowide&family=Cinzel:wght@700&family=Pacifico&family=Great+Vibes&family=Press+Start+2P&family=Unica+One&display=swap" },
      { rel: "icon", type: "image/png", sizes: "any", href: "/luris-icon.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/luris-icon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/luris-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/luris-icon.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/luris-icon.png" },
      { rel: "shortcut icon", type: "image/png", href: "/luris-icon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/luris-icon.png" },
      { rel: "mask-icon", href: "/luris-icon.png", color: "#7c3aed" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "canonical", href: "https://luris.lovable.app/" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Só invalida cache em login/logout reais. TOKEN_REFRESHED ao voltar
      // de outra aba não pode reexecutar loaders (zerava o chat).
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        queryClient.invalidateQueries();
      }
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <Toaster theme="dark" position="top-right" toastOptions={{ className: "glass-strong" }} />
        <Outlet />
      </I18nProvider>
    </QueryClientProvider>
  );
}
