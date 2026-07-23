import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, handleLurisChat } from "@/lib/luris-public";

export const Route = createFileRoute("/api/public/luris/v1/chat/completions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      POST: async ({ request }) => handleLurisChat(request, true),
    },
  },
});