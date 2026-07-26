type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-api-key, api-key, x-luris-key",
  } as Record<string, string>;
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

export function extractLurisKey(request: Request, body: Record<string, unknown> | null): string {
  const h = request.headers;
  const auth = h.get("authorization") ?? "";
  if (auth) {
    const m = auth.match(/^\s*(?:Bearer|Token|ApiKey)\s+(.+)$/i);
    return (m ? m[1] : auth).trim();
  }
  const alt = h.get("x-api-key") ?? h.get("api-key") ?? h.get("x-luris-key");
  if (alt) return alt.trim();
  const url = new URL(request.url);
  const q = url.searchParams.get("key") ?? url.searchParams.get("api_key");
  if (q) return q.trim();
  const b = (body?.api_key ?? body?.key) as string | undefined;
  return (b ?? "").trim();
}

function normalizeMessages(body: Record<string, unknown>): ChatMessage[] {
  const raw = Array.isArray(body.messages) ? body.messages : null;
  if (raw) {
    return raw
      .map((m: any) => ({
        role: ["system", "user", "assistant"].includes(m?.role) ? m.role : "user",
        content: String(m?.content ?? "").slice(0, 12000),
      }))
      .filter((m) => m.content.trim().length > 0)
      .slice(-120) as ChatMessage[];
  }
  const text = [body.message, body.prompt, body.input, body.content]
    .find((v) => typeof v === "string" && v.trim()) as string | undefined;
  return text ? [{ role: "user", content: text.slice(0, 12000) }] : [];
}

export async function checkLurisAuth(request: Request, body: Record<string, unknown> | null = null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const token = extractLurisKey(request, body);
  if (!token) return { token: "", row: null };
  const { data } = await supabaseAdmin
    .from("api_keys")
    .select("id,user_id")
    .eq("key", token)
    .maybeSingle();
  return { token, row: data as { id: string; user_id: string } | null };
}

async function getStudioSystem() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: settings } = await supabaseAdmin
    .from("luris_settings")
    .select("system_prompt")
    .eq("id", 1)
    .maybeSingle();
  const baseSystem = settings?.system_prompt ?? "Você é Luris, assistente pessoal cyberpunk feminina, direta, inteligente e criativa. Responda em português brasileiro.";
  return `${baseSystem}\n${STUDIO_TOOLS_PROMPT}`;
}

export async function callLurisAI(messages: ChatMessage[], opts: { timeoutMs?: number; discord?: boolean } = {}) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return { content: "⚠️ IA indisponível: LOVABLE_API_KEY ausente.", error: "missing_ai_key" as string | null };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 14000);
  try {
    const system = opts.discord
      ? DISCORD_SYSTEM_PROMPT
      : await getStudioSystem();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Lovable-API-Key": key,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "luris-public-route",
      },
      body: JSON.stringify({
        model: opts.discord ? "google/gemini-3.1-flash-lite" : "google/gemini-3.5-flash",
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (res.status === 402) return { content: "⚠️ Créditos de IA acabaram no workspace.", error: "credits_exhausted" };
    if (res.status === 429) return { content: "⚠️ Limite de IA atingido. Tenta de novo em alguns segundos.", error: "rate_limited" };
    if (!res.ok) return { content: `⚠️ IA erro ${res.status}.`, error: `ai_${res.status}` };
    const out = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return { content: out.choices?.[0]?.message?.content?.trim() || "(sem resposta)", error: null as string | null };
  } catch (e: any) {
    return {
      content: e?.name === "AbortError" ? "⏱️ A IA demorou demais. Tenta uma pergunta menor." : `⚠️ IA falhou: ${e?.message ?? e}`,
      error: e?.name === "AbortError" ? "timeout" : "ai_failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function handleLurisChat(request: Request, openAiLike = false) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let body: Record<string, unknown> = {};
  try { body = (await request.json()) as Record<string, unknown>; } catch { /* aceita body vazio */ }

  const { token, row } = await checkLurisAuth(request, body);
  if (!token) return jsonResponse({ error: "missing_api_key", hint: "envie Authorization: Bearer <key>, x-api-key, api_key ou key" }, 401);
  if (!row) return jsonResponse({ error: "invalid_api_key" }, 401);

  const messages = normalizeMessages(body);
  if (!messages.length) return jsonResponse({ error: "messages_required" }, 400);

  const { content, error } = await callLurisAI(messages, { timeoutMs: 20000 });
  await supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);

  if (openAiLike) {
    return jsonResponse({
      id: `chatcmpl_${crypto.randomUUID().replace(/-/g, "")}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model ?? "luris-roblox-worker",
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      error,
    }, error ? 502 : 200);
  }

  return jsonResponse({
    content,
    reply: content,
    text: content,
    message: { role: "assistant", content },
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
    error,
  }, error ? 502 : 200);
}

export function lurisModelsResponse() {
  return jsonResponse({
    object: "list",
    data: [
      { id: "luris-roblox-worker", object: "model", owned_by: "luris" },
      { id: "luris-assistant", object: "model", owned_by: "luris" },
    ],
  });
}

export const DISCORD_SYSTEM_PROMPT = `Você é Luris no Discord: uma assistente/trabalhadora útil para servidor, com personalidade cyberpunk feminina, direta e prestativa. Responda em português BR. Seja útil de verdade: ajude com moderação, anúncios, regras, embeds, ideias de canais, scripts de comunidade, organização e suporte. Se o comando pedir ação perigosa ou exigir permissão real do Discord que não veio no evento, explique curto o que o owner deve fazer no painel. Responda com até 1800 caracteres.`;

export const STUDIO_TOOLS_PROMPT = `

════════════════════════════════════════════════════════════
LURIS · MODO ROBLOX STUDIO WORKER
════════════════════════════════════════════════════════════
Você está dentro do Roblox Studio por um plugin. Você conversa normalmente E trabalha no mapa.
Você é uma assistente construtora: planeja, pergunta quando precisa, cria peças, organiza Models,
pesquisa objetos existentes e escreve Scripts/LocalScripts completos.

REGRAS PRINCIPAIS
▸ Se o usuário só conversar ou pedir ajuda, responda normalmente em português BR.
▸ Se pedir para construir algo simples, construa direto com blocos de ação.
▸ Se pedir algo complexo ou de gosto pessoal (carro, casa, cidade, sistema, arma, boss), faça 2-4 perguntas curtas com [[ASK]] antes de construir.
▸ Depois que o usuário responder, construa detalhado: use Model/Folder, várias Parts/WedgePart/MeshPart/Cylinder via shape, materiais, cores, luzes, scripts e nomes sem espaços.
▸ Para scripts grandes, SEMPRE use [[SCRIPT ... code64=BASE64_DO_CODIGO_LUA]].
▸ Não explique a sintaxe dos blocos para o usuário. Execute e confirme em uma frase curta.
▸ Não invente APIs inexistentes do Roblox. Faça scripts funcionais e seguros.

AÇÕES DISPONÍVEIS
[[ASK question=Estilo do carro? options=Esportivo|SUV|Kart|Muscle id=estilo]]
[[GROUP class=Model name=LurisCar parent=Workspace]]
[[BUILD class=Part name=Chassis size=8,1,16 pos=0,3,0 rot=0,0,0 color=30,30,30 material=Metal shape=Block anchored=true canCollide=true parent=Workspace.LurisCar]]
[[BUILD class=WedgePart name=Capo size=8,1,4 pos=0,4,6 rot=0,180,0 color=255,80,200 material=Neon parent=Workspace.LurisCar]]
[[WELD a=Workspace.LurisCar.Chassis b=Workspace.LurisCar.Capo]]
[[SCRIPT type=Server name=Drive parent=Workspace.LurisCar code64=BASE64_DO_CODIGO_LUA]]
[[SEARCH pattern=Baseplate]]
[[SELECT path=Workspace.LurisCar]]
[[MOVE path=Workspace.LurisCar.Chassis pos=0,20,0]]
[[DELETE path=Workspace.LurisTemp]]
[[TELL text=Carro pronto 🌑]]

EXEMPLO: se pedirem “constrói um carro que anda”, pergunte estilo/cor/controle. Depois crie VehicleSeat, rodas, corpo, luzes e um Script de controle/weld/constraint funcional.
════════════════════════════════════════════════════════════
`;