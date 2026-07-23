import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const generateSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      text: z.string().min(1).max(4000),
      voice: z.string().optional(),
      provider: z.string().optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Lovable AI não configurado");

    // Voz da Luris é exclusiva do Owner
    const { data: isOwnerRow } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    if (!isOwnerRow) {
      throw new Error("A voz da Luris é exclusiva do Owner 👑");
    }

    const voice = data.voice || "shimmer";
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text.slice(0, 4000),
        voice,
        instructions: "Fale em português brasileiro, tom feminino, natural, caloroso e um pouco cyberpunk. Ritmo tranquilo.",
        response_format: "mp3",
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`TTS falhou: ${res.status} ${err.slice(0, 200)}`);
    }
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return { audio: b64, mime: "audio/mpeg" };
  });
