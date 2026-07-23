import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders, lurisModelsResponse } from "@/lib/luris-public";

export const Route = createFileRoute("/api/public/luris/v1/models")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      GET: async () => lurisModelsResponse(),
    },
  },
});