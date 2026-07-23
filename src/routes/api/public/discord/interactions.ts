import { createFileRoute } from "@tanstack/react-router";
import nacl from "tweetnacl";
import { callLurisAI } from "@/lib/luris-public";

/**
 * Discord Interactions Endpoint (HTTP webhook mode).
 * Configure em https://discord.com/developers → Application → General Info
 * como "Interactions Endpoint URL": https://<seu-dominio>/api/public/discord/interactions
 */

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function verify(request: Request, rawBody: string, publicKey: string): Promise<boolean> {
  const sig = request.headers.get("x-signature-ed25519");
  const ts = request.headers.get("x-signature-timestamp");
  if (!sig || !ts) return false;
  try {
    return nacl.sign.detached.verify(
      new TextEncoder().encode(ts + rawBody),
      hexToBytes(sig),
      hexToBytes(publicKey),
    );
  } catch {
    return false;
  }
}

function interactionJson(body: unknown) {
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

function optionText(options: any[] = []): string {
  const flat = options.flatMap((o: any) => o.type === 1 ? (o.options ?? []) : [o]);
  return flat.map((o: any) => `${o.name}: ${o.value}`).join(" | ");
}

export const Route = createFileRoute("/api/public/discord/interactions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: cfg } = await supabaseAdmin
          .from("owner_discord_config")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (!cfg?.public_key) return new Response("public_key not configured", { status: 500 });

        const ok = await verify(request, rawBody, cfg.public_key);
        if (!ok) return new Response("invalid request signature", { status: 401 });

        const interaction = JSON.parse(rawBody);

        // PING
        if (interaction.type === 1) return interactionJson({ type: 1 });

        // APPLICATION_COMMAND
        if (interaction.type === 2) {
          const started = Date.now();
          const name = interaction.data?.name as string;
          const sub = interaction.data?.options?.find((o: any) => o.type === 1)?.name;
          const fullName = sub ? `${name} ${sub}` : name;

          // extrai argumentos texto; se não houver comando cadastrado, vira chat IA mesmo assim
          const userInput = optionText(interaction.data?.options ?? []) || `/${fullName}`;

          const { data: cmd } = await supabaseAdmin
            .from("discord_commands")
            .select("*")
            .eq("owner_id", cfg.owner_id)
            .eq("name", name)
            .maybeSingle();

          let content = "";
          let embed: any = null;
          let ephemeral = false;

          if (!cmd || !cmd.enabled) {
            const prompt = userInput === `/${fullName}`
              ? `O usuário executou /${fullName}. Responda como assistente do servidor e ofereça ajuda útil.`
              : userInput;
            const ai = await callLurisAI([{ role: "user", content: prompt }], { discord: true, timeoutMs: 1500 });
            content = ai.content;
          } else {
            ephemeral = !!cmd.ephemeral;

            if (cmd.response_type === "embed" && cmd.response_embed) {
              embed = { ...(cmd.response_embed as any), timestamp: new Date().toISOString() };
            } else if (cmd.response_type === "ai") {
              const persona = cmd.ai_prompt || (cfg as any).ai_persona || "Você é Luris, IA cyberpunk sarcástica e útil. Responda curto e em português.";
              const ai = await callLurisAI([
                { role: "system", content: persona },
                { role: "user", content: userInput },
              ], { discord: true, timeoutMs: 1500 });
              content = ai.content;
            } else {
              content = cmd.response_content || `✅ Comando \`/${fullName}\` executado.`;
            }

            await supabaseAdmin
              .from("discord_commands")
              .update({ usage_count: (cmd.usage_count ?? 0) + 1, last_used_at: new Date().toISOString() })
              .eq("id", cmd.id);
          }

          await supabaseAdmin.from("discord_command_logs").insert({
            owner_id: cfg.owner_id,
            command_name: fullName,
            user_id: interaction.member?.user?.id ?? interaction.user?.id,
            username: interaction.member?.user?.username ?? interaction.user?.username,
            guild_id: interaction.guild_id,
            channel_id: interaction.channel_id,
            success: true,
            latency_ms: Date.now() - started,
          });

          return interactionJson({
            type: 4,
            data: {
              content: content ? content.slice(0, 1900) : undefined,
              embeds: embed ? [embed] : undefined,
              flags: ephemeral ? 64 : 0,
            },
          });
        }

        return interactionJson({ type: 4, data: { content: "Interação não suportada.", flags: 64 } });
      },
    },
  },
});
