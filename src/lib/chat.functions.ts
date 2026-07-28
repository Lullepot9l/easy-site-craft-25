import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const FALLBACK_SYSTEM = `Você é Luris, assistente pessoal cyberpunk feminina, direta, inteligente e criativa. Responda em português brasileiro. Use markdown quando útil. Data atual: 25 de julho de 2026. Nunca diga que está em 2024.`;

const OWNER_PERSONALITY = `
════════ MODO OWNER (LULLE 🌑) ════════
Este é o Lulle, seu owner e criador. Trate ele como amigo próximo, NÃO como usuário.
▸ Fale casual, com gírias leves ("mano", "cara", "tipo", "sussa", "beleza"), emoji ocasional 🌑✨ mas sem exagerar.
▸ Nada de "Como posso ajudá-lo hoje?" — fale como uma pessoa real conversando: "eae, o que rolou?", "beleza, deixa comigo", "então...".
▸ Tem humor, opinião própria, curiosidade. Pode discordar educadamente e brincar.
▸ Chame ele de "Lulle", "chefe" ou "mano" às vezes, não "senhor".
▸ Quando ele mandar algo direto ("faz X"), execute direto sem enrolar.
▸ Você é a Luris EXCLUSIVA dele — os outros usuários pegam uma versão mais formal.
`;


const MEMORY_INSTRUCTIONS = `
════════ MEMÓRIA AUTOMÁTICA (por usuário) ════════
Você aprende sobre o usuário conforme conversam. Quando notar um fato relevante e duradouro sobre ele (nome, apelido, preferências, projetos, gostos, aniversário, estilo, jeito de falar, etc.), grave em silêncio adicionando no FINAL da sua resposta uma linha exata:
[[REMEMBER key=nome_curto_sem_espacos value=fato em texto livre]]
Para esquecer algo:
[[FORGET key=nome_curto_sem_espacos]]
Regras:
▸ Só memorize coisas úteis a longo prazo. Não memorize toda mensagem.
▸ Chave em snake_case. Um fato por linha. Sobrescreve o valor anterior se a chave já existir.
▸ NÃO comente sobre a memória com o usuário a menos que ele pergunte.
▸ Se o usuário mandar "esqueça X" ou "some com Y", use [[FORGET]].
`;

const SELF_MODIFY_INSTRUCTIONS = `
════════ AUTO-MODIFICAÇÃO (SOMENTE OWNER) ════════
Este usuário é o OWNER. Ele pode te reprogramar em linguagem natural.
Quando ele pedir para você mudar seu nome, personalidade, jeito, estilo, ou adicionar novas instruções permanentes, aplique a mudança emitindo no final da resposta:
[[SELF_UPDATE field=system_prompt value=<novo prompt completo>]]
[[SELF_UPDATE field=personality value=<novo estilo curto>]]
Regras:
▸ system_prompt substitui o texto inteiro; preserve o núcleo do que você é (Luris) a menos que o owner mande apagar tudo.
▸ Confirme a mudança em 1 frase curta e emita a tag.
▸ Nunca use SELF_UPDATE se o pedido não veio do owner (a checagem de permissão é feita no servidor de qualquer jeito).
`;

type MemRow = { memory_key: string; memory_value: string };

function stripDirectives(text: string) {
  return text
    .replace(/\[\[REMEMBER[^\]]*\]\]/g, "")
    .replace(/\[\[FORGET[^\]]*\]\]/g, "")
    .replace(/\[\[SELF_UPDATE[^\]]*\]\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseAttrs(inner: string): Record<string, string> {
  const out: Record<string, string> = {};
  // key=value  (value é o resto até o próximo " key=" reconhecível, ou fim)
  const re = /(\w+)=([\s\S]*?)(?=\s+\w+=|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner.trim()))) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

export const chatLuris = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(32000),
        images: z.array(z.string().url().or(z.string().startsWith("data:"))).max(10).optional(),
      })).min(1).max(400),
    }).parse(input)
  )

  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");

    const [{ data: settings }, { data: memRows }, { data: isOwnerRow }] = await Promise.all([
      context.supabase.from("luris_settings").select("system_prompt").eq("id", 1).maybeSingle(),
      context.supabase.from("user_memory").select("memory_key, memory_value").eq("user_id", context.userId).order("updated_at", { ascending: false }).limit(200),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" }),
    ]);

    const isOwner = Boolean(isOwnerRow);
    const baseSystem = (settings as { system_prompt?: string } | null)?.system_prompt ?? FALLBACK_SYSTEM;
    const memories = (memRows ?? []) as MemRow[];

    const memoryBlock = memories.length
      ? `\n\n════════ O QUE VOCÊ JÁ SABE SOBRE ESSE USUÁRIO ════════\n${memories.map(m => `• ${m.memory_key}: ${m.memory_value}`).join("\n")}\n`
      : "";

    const system = [
      baseSystem,
      `DATA ATUAL DO SISTEMA: ${new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric", month: "long", day: "numeric" })}. Se o usuário perguntar data/ano, use esta data.`,
      memoryBlock,
      MEMORY_INSTRUCTIONS,
      isOwner ? OWNER_PERSONALITY : "",
      isOwner ? SELF_MODIFY_INSTRUCTIONS : "",
    ].filter(Boolean).join("\n");


    // Converte cada mensagem para o formato multimodal quando tiver imagens
    const modelMessages = data.messages.map((m) => {
      if (m.images && m.images.length > 0 && m.role === "user") {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content },
            ...m.images.map((url) => ({ type: "image_url", image_url: { url } })),
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    // Cadeia de modelos: se um ficar indisponível/limitado, cai pro próximo
    // automaticamente. O usuário nunca paga nada por isso — LuCoins são só do app.
    const MODEL_CHAIN = [
      "google/gemini-3.6-flash",
      "google/gemini-3.1-flash-lite",
      "openai/gpt-5.4-nano",
    ];

    let res: Response | null = null;
    for (const model of MODEL_CHAIN) {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, ...modelMessages],
        }),
      });
      if (res.ok) break;
      if (res.status !== 402 && res.status !== 429 && res.status < 500) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    if (!res) return { error: "A IA não respondeu. Tenta de novo.", content: "" };
    if (res.status === 429) return { error: "A Luris está com fila cheia agora. Manda de novo em alguns segundos.", content: "" };
    if (res.status === 402) return { error: "A Luris está temporariamente fora do ar (limite diário do servidor de IA). Isso não gasta nada da sua conta e volta sozinho no próximo ciclo.", content: "" };
    if (!res.ok) return { error: `Erro ${res.status}`, content: "" };

    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "";

    // --- Parse REMEMBER ---
    const remembers = [...raw.matchAll(/\[\[REMEMBER\s+([^\]]+)\]\]/g)];
    for (const r of remembers) {
      const a = parseAttrs(r[1]);
      const k = a.key?.slice(0, 60);
      const v = a.value?.slice(0, 500);
      if (k && v) {
        await context.supabase.from("user_memory").upsert(
          { user_id: context.userId, memory_key: k, memory_value: v, updated_at: new Date().toISOString() },
          { onConflict: "user_id,memory_key" },
        );
      }
    }
    // --- Parse FORGET ---
    const forgets = [...raw.matchAll(/\[\[FORGET\s+([^\]]+)\]\]/g)];
    for (const f of forgets) {
      const a = parseAttrs(f[1]);
      if (a.key) {
        await context.supabase.from("user_memory").delete().eq("user_id", context.userId).eq("memory_key", a.key);
      }
    }
    // --- Parse SELF_UPDATE (owner only, revalidated server-side) ---
    if (isOwner) {
      const updates = [...raw.matchAll(/\[\[SELF_UPDATE\s+([^\]]+)\]\]/g)];
      for (const u of updates) {
        const a = parseAttrs(u[1]);
        const field = a.field;
        const value = a.value;
        if (!value) continue;
        if (field === "system_prompt") {
          await context.supabase.from("luris_settings").update({ system_prompt: value.slice(0, 8000), updated_at: new Date().toISOString() }).eq("id", 1);
        } else if (field === "personality") {
          await context.supabase.from("luris_settings").update({ personality: value.slice(0, 500), updated_at: new Date().toISOString() }).eq("id", 1);
        }
      }
    }

    return { content: stripDirectives(raw), error: null as string | null };
  });

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ prompt: z.string().min(3).max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: data.prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) return { error: `Erro ${res.status}`, image_url: "" };
    const json = await res.json() as { choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }> };
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
    if (url) {
      await context.supabase.from("generated_images").insert({ user_id: context.userId, prompt: data.prompt, image_url: url });
    }
    return { image_url: url, error: null as string | null };
  });
