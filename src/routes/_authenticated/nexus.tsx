import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Key, Copy, Trash2, Plus, Save, Terminal, Sparkles, Mic, Play, Activity } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { listVoices, onVoicesReady, getSavedVoiceURI, setSavedVoiceURI, getSavedPitch, setSavedPitch, getSavedRate, setSavedRate, speak, getVoiceProvider, setVoiceProvider, getAIVoice, setAIVoice, AI_VOICES, type VoiceProvider } from "@/lib/voice";
import { AccessDenied, LoadingShield } from "@/components/AccessDenied";

export const Route = createFileRoute("/_authenticated/nexus")({ component: Nexus });

interface ApiKey { id: string; name: string; key: string; created_at: string; last_used_at: string | null; }
interface LogRow { id: string; event: string; created_at: string; }

function Nexus() {
  const { isOwner, loading } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [personality, setPersonality] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [origin, setOrigin] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [pitch, setPitch] = useState<number>(1.35);
  const [rate, setRate] = useState<number>(1.02);
  const [provider, setProvider] = useState<VoiceProvider>("browser");
  const [aiVoice, setAiVoice] = useState<string>("shimmer");

  useEffect(() => {
    setOrigin(window.location.origin);
    const load = () => setVoices(listVoices());
    load(); onVoicesReady(load);
    setVoiceURI(getSavedVoiceURI() ?? "");
    setPitch(getSavedPitch()); setRate(getSavedRate());
    setProvider(getVoiceProvider()); setAiVoice(getAIVoice());
  }, []);
  useEffect(() => {
    if (!isOwner) return;
    refresh();
    supabase.from("luris_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) { setPrompt(data.system_prompt); setPersonality(data.personality); setVoiceEnabled(data.voice_enabled); }
    });
  }, [isOwner]);

  async function refresh() {
    const [k, l] = await Promise.all([
      supabase.from("api_keys").select("*").order("created_at", { ascending: false }),
      supabase.from("system_logs").select("id, event, created_at").order("created_at", { ascending: false }).limit(30),
    ]);
    setKeys((k.data ?? []) as ApiKey[]);
    setLogs((l.data ?? []) as LogRow[]);
  }


  async function createKey() {
    if (!name.trim()) return toast.error("Dê um nome à chave");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const key = `luris_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const { error } = await supabase.from("api_keys").insert({ name: name.trim(), key, user_id: user.id });
    if (error) return toast.error(error.message);
    setName(""); toast.success("Chave criada"); refresh();
  }

  async function delKey(id: string) {
    await supabase.from("api_keys").delete().eq("id", id);
    refresh();
  }

  async function savePersonality() {
    const { error } = await supabase.from("luris_settings").update({
      system_prompt: prompt, personality, voice_enabled: voiceEnabled, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Personalidade atualizada");
  }

  function saveVoice() {
    setSavedVoiceURI(voiceURI || null);
    setSavedPitch(pitch); setSavedRate(rate);
    setVoiceProvider(provider); setAIVoice(aiVoice);
    toast.success("Voz salva");
    speak("Olá Lulle, sou a Luris. Esta é minha nova voz.");
  }
  function testVoice() {
    setSavedVoiceURI(voiceURI || null);
    setSavedPitch(pitch); setSavedRate(rate);
    setVoiceProvider(provider); setAIVoice(aiVoice);
    speak("Olá Lulle, esta é minha voz atual. Posso falar mais grave ou mais aguda se preferir.");
  }


  if (loading) return <LoadingShield />;
  if (!isOwner) return <AccessDenied required="owner" />;
  const endpoint = `${origin}/api/public/luris`;


  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="glass-strong rounded-2xl p-6 glow-magenta">
        <h1 className="text-3xl font-display neon-text-magenta flex items-center gap-3"><Terminal /> NEXUS · API & Personalidade</h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">Sistema secreto · exclusivo Owner</p>
      </header>

      <section className="glass-strong rounded-2xl p-6 space-y-4">
        <h2 className="font-display neon-text flex items-center gap-2"><Sparkles className="h-4 w-4" /> Personalidade da Luris</h2>
        <label className="block text-[11px] font-mono uppercase text-muted-foreground">System Prompt
          <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} rows={6}
            className="w-full glass px-3 py-2 rounded-lg text-sm mt-1 font-mono" />
        </label>
        <label className="block text-[11px] font-mono uppercase text-muted-foreground">Estilo / Personalidade
          <input value={personality} onChange={(e)=>setPersonality(e.target.value)} className="w-full glass px-3 py-2 rounded-lg text-sm mt-1" />
        </label>
        <label className="flex items-center gap-2 text-xs font-mono">
          <input type="checkbox" checked={voiceEnabled} onChange={(e)=>setVoiceEnabled(e.target.checked)} className="accent-[oklch(0.7_0.28_295)]" />
          Voz ativada por padrão
        </label>
        <button onClick={savePersonality} className="btn-neon px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2"><Save className="h-3 w-3" /> Salvar</button>
      </section>

      <section className="glass-strong rounded-2xl p-6 space-y-4">
        <h2 className="font-display neon-text flex items-center gap-2"><Mic className="h-4 w-4" /> Voz da Luris (só Owner)</h2>
        <p className="text-[11px] font-mono text-muted-foreground">Escolha o provedor de voz. <b>Lovable AI</b> = voz feminina realista (recomendado). <b>Navegador</b> = grátis mas robótica.</p>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block text-[11px] font-mono uppercase text-muted-foreground">Provedor
            <select value={provider} onChange={(e)=>setProvider(e.target.value as VoiceProvider)} className="w-full glass px-3 py-2 rounded-lg text-sm mt-1 font-mono">
              <option value="lovable">✨ Lovable AI (natural, recomendado)</option>
              <option value="browser">🖥️ Navegador (grátis, offline)</option>
            </select>
          </label>
          <label className="block text-[11px] font-mono uppercase text-muted-foreground">Voz Lovable AI
            <select value={aiVoice} onChange={(e)=>setAiVoice(e.target.value)} disabled={provider !== "lovable"} className="w-full glass px-3 py-2 rounded-lg text-sm mt-1 font-mono disabled:opacity-40">
              {AI_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-[11px] font-mono uppercase text-muted-foreground">Voz do Navegador (fallback)
          <select value={voiceURI} onChange={(e)=>setVoiceURI(e.target.value)} className="w-full glass px-3 py-2 rounded-lg text-sm mt-1 font-mono">
            <option value="">🔮 Automática (feminina PT-BR)</option>
            {voices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} — {v.lang}{v.default ? " (padrão)" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[11px] font-mono uppercase text-muted-foreground">Tom (pitch): {pitch.toFixed(2)}
            <input type="range" min="0.5" max="2" step="0.05" value={pitch} onChange={(e)=>setPitch(parseFloat(e.target.value))} className="w-full accent-[oklch(0.78_0.28_330)]" />
          </label>
          <label className="block text-[11px] font-mono uppercase text-muted-foreground">Velocidade: {rate.toFixed(2)}
            <input type="range" min="0.6" max="1.6" step="0.05" value={rate} onChange={(e)=>setRate(parseFloat(e.target.value))} className="w-full accent-[oklch(0.78_0.28_330)]" />
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={testVoice} className="glass px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2"><Play className="h-3 w-3" /> Testar</button>
          <button onClick={saveVoice} className="btn-neon px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2"><Save className="h-3 w-3" /> Salvar voz</button>
        </div>
        {!voices.length && <p className="text-[10px] font-mono text-muted-foreground">Nenhuma voz detectada no navegador ainda — interaja com a página e tente novamente.</p>}
      </section>



      <section className="glass-strong rounded-2xl p-6 space-y-4">
        <h2 className="font-display neon-text-magenta flex items-center gap-2"><Key className="h-4 w-4" /> API Keys (usar Luris em outros apps)</h2>
        <div className="flex gap-2">
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nome da chave (ex: meu-bot)" className="flex-1 glass px-3 py-2 rounded-lg text-sm" />
          <button onClick={createKey} className="btn-neon px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2"><Plus className="h-3 w-3" /> Gerar</button>
        </div>
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.id} className="glass p-3 rounded-lg flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm">{k.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground truncate">{k.key}</div>
              </div>
              <button onClick={()=>{navigator.clipboard.writeText(k.key);toast.success("Copiado");}} className="glass p-2 rounded hover-lift"><Copy className="h-3 w-3" /></button>
              <button onClick={()=>delKey(k.id)} className="glass p-2 rounded text-[oklch(0.75_0.2_25)]"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          {!keys.length && <p className="text-xs text-muted-foreground font-mono">Nenhuma chave gerada ainda.</p>}
        </div>

        <div className="bg-black/60 rounded-lg p-4 font-mono text-[11px] border border-[oklch(0.4_0.2_140/0.4)] space-y-1">
          <div className="text-[oklch(0.85_0.18_140)]"># Como usar em outros apps</div>
          <div className="text-muted-foreground">POST <span className="text-[oklch(0.85_0.2_295)]">{endpoint}</span></div>
          <div className="text-muted-foreground">Header: Authorization: Bearer &lt;sua-chave&gt;</div>
          <div className="text-muted-foreground">Body: {`{ "message": "oi luris" }`}</div>
          <button onClick={()=>{navigator.clipboard.writeText(`curl -X POST ${endpoint} -H "Authorization: Bearer SUA_CHAVE" -H "Content-Type: application/json" -d '{"message":"oi luris"}'`);toast.success("cURL copiado");}}
            className="mt-2 btn-neon px-3 py-1 rounded text-[10px]">Copiar cURL</button>
        </div>
      </section>

      <section className="glass-strong rounded-2xl p-6 space-y-3">
        <h2 className="font-display neon-text-cyan flex items-center gap-2"><Activity className="h-4 w-4" /> Logs do sistema</h2>
        <div className="bg-black/60 rounded-lg p-4 font-mono text-[11px] border border-[oklch(0.4_0.2_180/0.4)] space-y-1 max-h-80 overflow-y-auto">
          {logs.length === 0 && <div className="text-muted-foreground">Sem eventos registrados.</div>}
          {logs.map(l => (
            <div key={l.id} className="flex gap-2">
              <span className="text-[oklch(0.7_0.15_295)]">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
              <span className="text-[oklch(0.85_0.18_140)]">→ {l.event}</span>
            </div>
          ))}
        </div>
        <button onClick={refresh} className="glass px-3 py-1.5 rounded text-xs font-mono">↻ Atualizar</button>
      </section>
    </div>
  );
}
