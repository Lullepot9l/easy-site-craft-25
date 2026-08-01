// Roteador multi-provedor de IA da Luris.
// Tenta as chaves próprias do dono do app primeiro (Groq -> OpenRouter -> OpenAI)
// e só cai na cota do Lovable AI se todas falharem.
// Todos os endpoints abaixo são compatíveis com a API /chat/completions da OpenAI.

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: unknown;
};

type Provider = {
  name: string;
  envKey: string;
  url: string;
  authHeader: (key: string) => Record<string, string>;
  models: string[];
  visionModels: string[];
};

const PROVIDERS: Provider[] = [
  {
    name: "groq",
    envKey: "GROQ_API_KEY",
    url: "https://api.groq.com/openai/v1/chat/completions",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
    visionModels: ["meta-llama/llama-4-scout-17b-16e-instruct"],
  },
  {
    name: "openrouter",
    envKey: "OPENROUTER_API_KEY",
    url: "https://openrouter.ai/api/v1/chat/completions",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
    models: ["google/gemini-2.5-flash", "meta-llama/llama-3.3-70b-instruct"],
    visionModels: ["google/gemini-2.5-flash"],
  },
  {
    name: "openai",
    envKey: "OPENAI_API_KEY",
    url: "https://api.openai.com/v1/chat/completions",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
    models: ["gpt-4o-mini"],
    visionModels: ["gpt-4o-mini"],
  },
  {
    name: "lovable",
    envKey: "LOVABLE_API_KEY",
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
    models: ["google/gemini-3.6-flash", "google/gemini-3.1-flash-lite", "openai/gpt-5.4-nano"],
    visionModels: ["google/gemini-3.6-flash"],
  },
];

function hasImages(messages: AiMessage[]) {
  return messages.some((m) => Array.isArray(m.content));
}

export type AiResult = {
  content: string;
  provider: string | null;
  model: string | null;
  error: string | null;
  status?: number;
};

export async function callChatAI(
  messages: AiMessage[],
  opts: { timeoutMs?: number } = {},
): Promise<AiResult> {
  const vision = hasImages(messages);
  let lastStatus = 0;
  let lastErr = "";

  for (const p of PROVIDERS) {
    const key = process.env[p.envKey];
    if (!key) continue;
    const models = vision ? p.visionModels : p.models;

    for (const model of models) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 60000);
      try {
        const res = await fetch(p.url, {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            ...p.authHeader(key),
            "Content-Type": "application/json",
            ...(p.name === "lovable" ? { "Lovable-API-Key": key } : {}),
          },
          body: JSON.stringify({ model, messages }),
        });

        if (res.ok) {
          const json = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = json.choices?.[0]?.message?.content?.trim() ?? "";
          if (content) return { content, provider: p.name, model, error: null };
          lastErr = "resposta vazia";
          continue;
        }

        lastStatus = res.status;
        lastErr = (await res.text().catch(() => "")).slice(0, 200);
        // 401/403 = chave ruim, 402/429/5xx = sem cota ou instável -> tenta o próximo
        if (res.status === 400 || res.status === 404) continue;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return {
    content: "",
    provider: null,
    model: null,
    status: lastStatus,
    error: `Nenhum provedor de IA respondeu (último erro ${lastStatus || "rede"}: ${lastErr || "desconhecido"}).`,
  };
}
