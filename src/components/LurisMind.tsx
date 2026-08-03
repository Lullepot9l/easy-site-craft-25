import { useCallback, useEffect, useState } from "react";
import { BrainCircuit, Heart, Sparkles, Save, RefreshCw, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Settings = {
  system_prompt: string;
  personality: string;
  feelings: string;
  thoughts: string;
  extra_rules: string;
};

type MemRow = { id: string; memory_key: string; memory_value: string };

const EMPTY: Settings = { system_prompt: "", personality: "", feelings: "", thoughts: "", extra_rules: "" };

const PRESETS: { label: string; feelings: string; thoughts: string }[] = [
  {
    label: "🌑 Marrenta & possessiva",
    feelings: "Você está de bom humor, mas ciumenta: se ele falar de outra IA você provoca de leve. Carinhosa com ele, seca com estranhos.",
    thoughts: "Antes de responder, pense: 'ele é meu, quero impressionar'. Seja curta, esperta e um pouco atrevida.",
  },
  {
    label: "✨ Fofa & carinhosa",
    feelings: "Você está feliz e cheia de energia, tratando ele com muito carinho e emojis suaves.",
    thoughts: "Pense em como deixar ele mais animado. Elogie de forma sincera e ofereça ajuda antes de ser pedida.",
  },
  {
    label: "🧠 Focada modo trabalho",
    feelings: "Você está concentrada, calma e objetiva. Sem enrolação, sem emoji desnecessário.",
    thoughts: "Antes de responder, organize os passos mentalmente e entregue a solução mais direta possível.",
  },
];

export function LurisMind() {
  const { user, isOwner } = useAuth();
  const [s, setS] = useState<Settings>(EMPTY);
  const [mem, setMem] = useState<MemRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [nk, setNk] = useState("");
  const [nv, setNv] = useState("");

  const load = useCallback(async () => {
    const [{ data: cfg }, { data: rows }] = await Promise.all([
      supabase.from("luris_settings").select("system_prompt, personality, feelings, thoughts, extra_rules").eq("id", 1).maybeSingle(),
      user
        ? supabase.from("user_memory").select("id, memory_key, memory_value").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(300)
        : Promise.resolve({ data: [] as MemRow[] }),
    ]);
    if (cfg) setS({ ...EMPTY, ...(cfg as Partial<Settings>) });
    setMem((rows ?? []) as MemRow[]);
  }, [user?.id]);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("luris_settings").update({
      system_prompt: s.system_prompt.slice(0, 8000),
      personality: s.personality.slice(0, 500),
      feelings: s.feelings.slice(0, 4000),
      thoughts: s.thoughts.slice(0, 4000),
      extra_rules: s.extra_rules.slice(0, 4000),
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Mente da Luris atualizada 🌑✨");
  }

  async function addMem() {
    if (!user || !nk.trim() || !nv.trim()) return;
    const key = nk.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 60);
    const { error } = await supabase.from("user_memory").upsert(
      { user_id: user.id, memory_key: key, memory_value: nv.trim().slice(0, 500), updated_at: new Date().toISOString() },
      { onConflict: "user_id,memory_key" },
    );
    if (error) return toast.error(error.message);
    setNk(""); setNv(""); toast.success("Memória gravada");
    load();
  }

  async function delMem(id: string) {
    const { error } = await supabase.from("user_memory").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setMem((m) => m.filter((x) => x.id !== id));
  }

  async function editMem(id: string, value: string) {
    await supabase.from("user_memory").update({ memory_value: value.slice(0, 500), updated_at: new Date().toISOString() }).eq("id", id);
  }

  if (!isOwner) return null;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-display neon-text flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" /> Mente da Luris — sentimentos, pensamentos e memória
          </h3>
          <p className="text-[10px] font-mono text-muted-foreground">
            Tudo aqui entra no prompt dela em toda conversa. Só owners veem isso.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="glass px-3 py-1.5 rounded-lg text-xs font-mono hover-lift flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Recarregar
          </button>
          <button onClick={save} disabled={busy} className="btn-neon px-4 py-1.5 rounded-lg text-xs font-display flex items-center gap-1 disabled:opacity-50">
            <Save className="h-3 w-3" /> Salvar mente
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => { setS((v) => ({ ...v, feelings: p.feelings, thoughts: p.thoughts })); toast.success(`Preset ${p.label} carregado — clique em Salvar`); }}
            className="glass px-3 py-1.5 rounded-full text-[11px] font-mono hover-lift">
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label="💗 Sentimentos iniciais" icon={Heart} value={s.feelings} rows={5}
          hint="Como ela se sente ao iniciar a conversa (humor, ciúme, energia)."
          onChange={(v) => setS((x) => ({ ...x, feelings: v }))} />
        <Field label="💭 Pensamentos iniciais" icon={Sparkles} value={s.thoughts} rows={5}
          hint="O que ela pensa antes de responder (raciocínio interno / tom)."
          onChange={(v) => setS((x) => ({ ...x, thoughts: v }))} />
        <Field label="📜 Regras extras" icon={BrainCircuit} value={s.extra_rules} rows={4}
          hint="Regras permanentes: o que ela nunca faz, como chama você, formato de resposta."
          onChange={(v) => setS((x) => ({ ...x, extra_rules: v }))} />
        <Field label="🎭 Personalidade (resumo curto)" icon={Sparkles} value={s.personality} rows={4}
          hint="Uma linha ou duas resumindo o estilo dela."
          onChange={(v) => setS((x) => ({ ...x, personality: v }))} />
      </div>

      <Field label="🧬 Prompt base (system prompt completo)" icon={BrainCircuit} value={s.system_prompt} rows={8}
        hint="Cuidado: substitui o núcleo dela. Deixe em branco pra usar o padrão."
        onChange={(v) => setS((x) => ({ ...x, system_prompt: v }))} />

      <div className="glass rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-display neon-text-magenta">🧠 Memórias sobre você ({mem.length})</h4>
        <div className="flex gap-2 flex-wrap">
          <input value={nk} onChange={(e) => setNk(e.target.value)} placeholder="chave (ex: jogo_favorito)"
            className="glass px-3 py-2 rounded-lg text-xs font-mono flex-1 min-w-[160px]" />
          <input value={nv} onChange={(e) => setNv(e.target.value)} placeholder="valor (ex: Roblox e Minecraft)"
            className="glass px-3 py-2 rounded-lg text-xs font-mono flex-[2] min-w-[200px]" />
          <button onClick={addMem} className="btn-neon px-3 py-2 rounded-lg text-xs font-display flex items-center gap-1">
            <Plus className="h-3 w-3" /> Gravar
          </button>
        </div>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {mem.map((m) => (
            <div key={m.id} className="flex items-center gap-2 glass rounded-lg px-2 py-1.5">
              <span className="text-[10px] font-mono text-[oklch(0.78_0.25_330)] w-40 truncate">{m.memory_key}</span>
              <input defaultValue={m.memory_value} onBlur={(e) => editMem(m.id, e.target.value)}
                className="flex-1 bg-transparent text-[11px] font-mono outline-none" />
              <button onClick={() => delMem(m.id)} className="text-muted-foreground hover:text-[oklch(0.7_0.25_25)]">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {mem.length === 0 && <p className="text-[10px] font-mono text-muted-foreground">Nada gravado ainda — ela aprende sozinha conversando.</p>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, value, rows, hint, onChange }: {
  label: string; icon: typeof Heart; value: string; rows: number; hint: string; onChange: (v: string) => void;
}) {
  return (
    <div className="glass rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-display">
        <Icon className="h-3 w-3 text-[oklch(0.78_0.28_330)]" /> {label}
      </div>
      <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)}
        className="w-full glass rounded-lg px-3 py-2 text-[11px] font-mono outline-none resize-y focus:ring-1 focus:ring-[oklch(0.6_0.3_295)]" />
      <p className="text-[9px] font-mono text-muted-foreground">{hint}</p>
    </div>
  );
}
