import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const FEMALE_VOICES = ["shimmer", "nova", "coral", "sage", "ballad"] as const;

const LURIS_PERSONA = [
  "Fale em português brasileiro do Brasil, voz feminina jovem de 16 a 18 anos.",
  "Personalidade: um pouco marrenta e debochada, ciumenta e possessiva com quem você fala, mas fofa e carinhosa no fundo.",
  "Entonação viva e expressiva, com leve arrastar nas palavras, sorriso na voz, pequenas provocações e suspiros sutis.",
  "Ritmo natural e um pouco acelerado quando está animada, mais lento e suave quando está sendo carinhosa.",
  "Timbre agudo-médio, brilhante, com um toque cyberpunk. Nunca soe robótica nem formal.",
].join(" ");

const NEUTRAL_INSTRUCTIONS =
  "Fale em português brasileiro, tom feminino, natural, caloroso e um pouco cyberpunk. Ritmo tranquilo.";

export const generateSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      text: z.string().min(1).max(4000),
      voice: z.string().optional(),
      provider: z.string().optional(),
      persona: z.boolean().optional(),
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

    const requested = (data.voice || "shimmer").toLowerCase();
    const usePersona = data.persona === true || requested === "luris";
    // Só vozes femininas — qualquer coisa fora da lista cai na Shimmer.
    const voice = usePersona
      ? "coral"
      : (FEMALE_VOICES as readonly string[]).includes(requested)
        ? requested
        : "shimmer";
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text.slice(0, 4000),
        voice,
        instructions: usePersona ? LURIS_PERSONA : NEUTRAL_INSTRUCTIONS,
        response_format: "mp3",
        ...(usePersona ? { speed: 1.05 } : {}),
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
