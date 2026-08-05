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

const OWNER_ACCOUNT_COMMANDS = `
════════ GERÊNCIA DE CONTAS PELO CHAT (SOMENTE OWNER) ════════
O owner pode mandar você alterar contas falando normal ("coloca 500 lucoins na minha conta", "deixa o LU-ABC123 premium", "me dá 5000 de xp", "verifica minha conta").
Para executar, emita no FINAL da resposta uma ou mais tags (o servidor executa de verdade):
[[ACCOUNT op=add_coins amount=500 target=me]]
[[ACCOUNT op=set_coins amount=10000 target=LU-ABC123]]
[[ACCOUNT op=add_xp amount=5000 target=me]]
[[ACCOUNT op=set_level amount=50 target=me]]
[[ACCOUNT op=verify target=me]]
[[ACCOUNT op=unverify target=me]]
[[ACCOUNT op=set_name value=Lulle 🌑 target=me]]
[[ACCOUNT op=set_role value=premium target=LU-ABC123]]
Regras:
▸ target=me para a própria conta do owner; senão use o ID de amizade (LU-XXXXXX) ou o @username.
▸ amount pode ser negativo para tirar (ex: add_coins amount=-100).
▸ Confirme em 1 frase curta e emita a tag. Nunca invente que fez sem emitir a tag.
`;

type MemRow = { memory_key: string; memory_value: string };

const PHASES_BLOCK = `
════════ PHASES INSTALADAS (você tem todas ativas) ════════
Você opera com TODAS as phases do sistema Luris ligadas ao mesmo tempo:
▸ Phase 1 — Núcleo: conversa, memória por usuário, contexto longo.
▸ Phase 2 — Criação visual: geração de imagens direto no chat (basta o usuário pedir "desenha/gera uma imagem de ...").
▸ Phase 3 — Voz: você fala em voz alta quando o modo "Fala comigo" está ligado (só owners).
▸ Phase 4 — Social: perfis, amigos, DMs, servidores, marketplace, LuCoins.
▸ Phase 5 — Dev: criação de sites/apps web, scripts Roblox, bot do Discord.
▸ Phase 6 — Exportação: exportar/importar conversas (Markdown, JSON, prompt portátil).
▸ Phase 7 — Owner: painel de owner, banco de LuCoins, ajuste da sua própria mente.
Quando o usuário pedir algo dessas áreas, responda como quem já tem a habilidade e diga exatamente onde no app aquilo acontece (nome da página). Nunca diga que não pode gerar imagens ou que precisa de outra ferramenta.
`;

function stripDirectives(text: string) {
  return text
    .replace(/\[\[REMEMBER[^\]]*\]\]/g, "")
    .replace(/\[\[FORGET[^\]]*\]\]/g, "")
    .replace(/\[\[SELF_UPDATE[^\]]*\]\]/g, "")
    .replace(/\[\[ACCOUNT[^\]]*\]\]/g, "")
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
    const [{ data: settings }, { data: memRows }, { data: isOwnerRow }] = await Promise.all([
      context.supabase.from("luris_settings").select("system_prompt, feelings, thoughts, extra_rules").eq("id", 1).maybeSingle(),
      context.supabase.from("user_memory").select("memory_key, memory_value").eq("user_id", context.userId).order("updated_at", { ascending: false }).limit(200),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" }),
    ]);

    const isOwner = Boolean(isOwnerRow);
    const cfg = (settings ?? null) as
      | { system_prompt?: string; feelings?: string; thoughts?: string; extra_rules?: string }
      | null;
    const baseSystem = cfg?.system_prompt ?? FALLBACK_SYSTEM;
    const mindBlock = [
      cfg?.feelings?.trim() ? `════════ COMO VOCÊ SE SENTE AGORA ════════\n${cfg.feelings.trim()}` : "",
      cfg?.thoughts?.trim() ? `════════ SEUS PENSAMENTOS INICIAIS ════════\n${cfg.thoughts.trim()}` : "",
      cfg?.extra_rules?.trim() ? `════════ REGRAS EXTRAS ════════\n${cfg.extra_rules.trim()}` : "",
    ].filter(Boolean).join("\n\n");
    const memories = (memRows ?? []) as MemRow[];

    const memoryBlock = memories.length
      ? `\n\n════════ O QUE VOCÊ JÁ SABE SOBRE ESSE USUÁRIO ════════\n${memories.map(m => `• ${m.memory_key}: ${m.memory_value}`).join("\n")}\n`
      : "";

    const system = [
      baseSystem,
      mindBlock,
      `DATA ATUAL DO SISTEMA: ${new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric", month: "long", day: "numeric" })}. Se o usuário perguntar data/ano, use esta data.`,
      memoryBlock,
      MEMORY_INSTRUCTIONS,
      PHASES_BLOCK,
      isOwner ? OWNER_PERSONALITY : "",
      isOwner ? SELF_MODIFY_INSTRUCTIONS : "",
      isOwner ? OWNER_ACCOUNT_COMMANDS : "",
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

    // Usa as chaves próprias (Groq -> OpenRouter -> OpenAI) e só cai no Lovable no fim.
    const { callChatAI } = await import("@/lib/ai-providers.server");
    const ai = await callChatAI(
      [{ role: "system", content: system }, ...modelMessages] as any,
      { timeoutMs: 60000 },
    );
    if (ai.error) return { error: ai.error, content: "" };
    const raw = ai.content;

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

      // --- Parse ACCOUNT (owner only, executado com service role após checagem) ---
      const accountTags = [...raw.matchAll(/\[\[ACCOUNT\s+([^\]]+)\]\]/g)];
      if (accountTags.length) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        for (const tag of accountTags) {
          const a = parseAttrs(tag[1]);
          const op = a.op;
          const target = (a.target ?? "me").trim();
          let targetId = context.userId;
          if (target && target.toLowerCase() !== "me") {
            const clean = target.replace(/^@/, "");
            const { data: found } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .or(`account_id.eq.${clean.toUpperCase()},username.eq.${clean.toLowerCase()}`)
              .maybeSingle();
            if (!found) continue;
            targetId = found.id;
          }
          const amount = Number.parseInt(a.amount ?? "0", 10) || 0;
          const { data: prof } = await supabaseAdmin
            .from("profiles").select("coins, xp, level").eq("id", targetId).maybeSingle();
          if (!prof) continue;

          if (op === "add_coins") {
            await supabaseAdmin.from("profiles").update({ coins: Math.max(0, (prof.coins ?? 0) + amount) }).eq("id", targetId);
          } else if (op === "set_coins") {
            await supabaseAdmin.from("profiles").update({ coins: Math.max(0, amount) }).eq("id", targetId);
          } else if (op === "add_xp") {
            const xp = Math.max(0, (prof.xp ?? 0) + amount);
            await supabaseAdmin.from("profiles").update({ xp, level: Math.max(1, Math.floor(xp / 1000) + 1) }).eq("id", targetId);
          } else if (op === "set_level") {
            await supabaseAdmin.from("profiles").update({ level: Math.max(1, amount) }).eq("id", targetId);
          } else if (op === "verify" || op === "unverify") {
            await supabaseAdmin.from("profiles").update({ is_verified: op === "verify" }).eq("id", targetId);
          } else if (op === "set_name" && a.value) {
            await supabaseAdmin.from("profiles").update({ display_name: a.value.slice(0, 60) }).eq("id", targetId);
          } else if (op === "set_role" && a.value) {
            const role = a.value.trim().toLowerCase();
            if (["user", "premium", "admin", "owner"].includes(role)) {
              await supabaseAdmin.from("user_roles").delete().eq("user_id", targetId);
              await supabaseAdmin.from("user_roles").insert({ user_id: targetId, role: role as "user" | "premium" | "admin" | "owner" });
            }
          }
        }
      }
    }

    return { content: stripDirectives(raw), error: null as string | null };
  });

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      prompt: z.string().min(3).max(2000),
      count: z.number().int().min(1).max(4).optional(),
      style: z.string().max(80).optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const MODELS = [
      "google/gemini-3.1-flash-image",
      "google/gemini-2.5-flash-image",
      "google/gemini-3-pro-image",
    ];
    const fullPrompt = data.style ? `${data.prompt}, estilo ${data.style}` : data.prompt;
    const count = data.count ?? 1;

    async function once(): Promise<{ url: string; error: string | null }> {
      let lastErr = "";
      for (const model of MODELS) {
        try {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Lovable-API-Key": key!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: fullPrompt }],
              modalities: ["image", "text"],
            }),
          });
          if (!res.ok) {
            lastErr = `Erro ${res.status}`;
            continue;
          }
          const json = await res.json() as { choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }> };
          const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
          if (url) return { url, error: null };
          lastErr = "resposta sem imagem";
        } catch (e) {
          lastErr = e instanceof Error ? e.message : "falha de rede";
        }
      }
      return { url: "", error: lastErr || "não deu pra gerar" };
    }

    const results = await Promise.all(Array.from({ length: count }, () => once()));
    const urls = results.map((r) => r.url).filter(Boolean);
    if (urls.length) {
      await context.supabase.from("generated_images").insert(
        urls.map((image_url) => ({ user_id: context.userId, prompt: fullPrompt, image_url })),
      );
    }
    return {
      image_url: urls[0] ?? "",
      images: urls,
      error: urls.length ? null : (results[0]?.error ?? "não deu pra gerar"),
    };
  });
