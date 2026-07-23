import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/s/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("websites")
      .select("title, description, html, css, js, published")
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (!data) throw notFound();
    return { site: data };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.site?.title ?? "Site" },
      { name: "description", content: loaderData?.site?.description ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted-foreground">
      Site não encontrado.
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted-foreground">
      Erro ao carregar o site.
    </div>
  ),
  component: SitePage,
});

function SitePage() {
  const { site } = Route.useLoaderData();
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${site.title}</title><meta name="description" content="${site.description ?? ""}"><style>${site.css}</style></head><body>${site.html}<script>${site.js}<\/script></body></html>`;
    ref.current.srcdoc = doc;
  }, [site]);
  return <iframe ref={ref} title={site.title} className="w-screen h-screen border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />;
}
