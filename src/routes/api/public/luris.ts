import { createFileRoute } from "@tanstack/react-router";
import { checkLurisAuth, corsHeaders, handleLurisChat, jsonResponse, lurisModelsResponse } from "@/lib/luris-public";

export const Route = createFileRoute("/api/public/luris")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("models") === "1") return lurisModelsResponse();

        const { token, row } = await checkLurisAuth(request);
        if (!token) return jsonResponse({ ok: true, service: "luris", auth: false, endpoints: ["/api/public/luris", "/api/public/luris/v1/chat/completions"] });
        return jsonResponse({ ok: true, service: "luris", auth: !!row }, row ? 200 : 401);
      },
      POST: async ({ request }) => handleLurisChat(request),
    },
  },
});
