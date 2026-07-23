import { useEffect, useState } from "react";
import { X, Volume2, Save, Sparkles, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AI_VOICES,
  getAIVoice, setAIVoice,
  getSavedPitch, setSavedPitch,
  getSavedRate, setSavedRate,
  getSavedVoiceURI, setSavedVoiceURI,
  getVoiceProvider, setVoiceProvider, type VoiceProvider,
  listVoices, onVoicesReady, speak, stopSpeech,
} from "@/lib/voice";

interface Props { onClose: () => void; }

export function VoiceSettings({ onClose }: Props) {
  const [provider, setProviderState] = useState<VoiceProvider>(getVoiceProvider());
  const [aiVoice, setAiVoiceState] = useState(getAIVoice());
  const [browserURI, setBrowserURI] = useState<string>(getSavedVoiceURI() ?? "");
  const [pitch, setPitch] = useState(getSavedPitch());
  const [rate, setRate] = useState(getSavedRate());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const load = () => setVoices(listVoices().filter(v => /pt|en/i.test(v.lang)));
    load();
    onVoicesReady(load);
    return () => stopSpeech();
  }, []);

  function saveAll() {
    setVoiceProvider(provider);
    setAIVoice(aiVoice);
    setSavedVoiceURI(browserURI || null);
    setSavedPitch(pitch);
    setSavedRate(rate);
    toast.success("Voz salva pra sempre 🌑 — vou usar essa em toda conversa.");
    onClose();
  }

  async function testVoice() {
    stopSpeech();
    const phrase = provider === "lovable"
      ? "Oi, essa é minha voz de estúdio. Bem melhor, né?"
      : "Oi, testando a voz do navegador. Como tô soando?";
    await speak(phrase, { provider, voice: aiVoice, pitch, rate });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="glass-strong rounded-2xl p-6 w-full max-w-lg glow-magenta border border-[oklch(0.5_0.25_330/0.5)] animate-fade-in-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display gradient-text flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-[oklch(0.78_0.28_330)]" />
            Configurar voz da Luris
          </h2>
          <button onClick={onClose} className="glass p-1 rounded-lg"><X className="h-4 w-4" /></button>
        </div>

        <button
          onClick={() => setShowTutorial(v => !v)}
          className="w-full glass rounded-lg px-3 py-2 text-xs font-mono text-left flex items-center gap-2 mb-4 hover-lift"
        >
          <HelpCircle className="h-4 w-4 text-[oklch(0.8_0.18_210)]" />
          {showTutorial ? "Fechar tutorial" : "Como escolher a melhor voz?"}
        </button>

        {showTutorial && (
          <div className="glass rounded-lg p-3 mb-4 text-xs text-[oklch(0.9_0.05_295)] space-y-1.5 font-mono">
            <p><b className="neon-text-magenta">1.</b> Escolha o provedor: <b>Estúdio (Lovable AI)</b> soa humano — recomendo. <b>Navegador</b> é grátis mas robótico.</p>
            <p><b className="neon-text-magenta">2.</b> No Estúdio, teste as vozes femininas: <b>Shimmer</b>, <b>Nova</b>, <b>Coral</b>, <b>Sage</b>.</p>
            <p><b className="neon-text-magenta">3.</b> Ajuste <b>tom (pitch)</b> e <b>velocidade (rate)</b> ao seu gosto — dá clique em <b>Testar</b> pra ouvir.</p>
            <p><b className="neon-text-magenta">4.</b> Clica em <b>💾 Salvar pra sempre</b>. Vou usar essa voz em toda mensagem daqui pra frente até você trocar.</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Provedor</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProviderState("lovable")}
                className={`glass rounded-lg p-3 text-xs font-display flex items-center gap-2 justify-center hover-lift ${provider === "lovable" ? "neon-text-magenta glow-magenta" : ""}`}
              >
                <Sparkles className="h-3 w-3" /> Estúdio (natural)
              </button>
              <button
                type="button"
                onClick={() => setProviderState("browser")}
                className={`glass rounded-lg p-3 text-xs font-display flex items-center gap-2 justify-center hover-lift ${provider === "browser" ? "neon-text glow-purple" : ""}`}
              >
                🖥️ Navegador (grátis)
              </button>
            </div>
          </div>

          {provider === "lovable" ? (
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Voz de estúdio</label>
              <select
                value={aiVoice}
                onChange={(e) => setAiVoiceState(e.target.value)}
                className="w-full glass px-3 py-2 rounded-lg text-sm bg-black/30 outline-none"
              >
                {AI_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                💡 Recomendação Luris: <b className="neon-text-magenta">Shimmer</b> ou <b className="neon-text-magenta">Coral</b> pra sensação humana.
              </p>
            </div>
          ) : (
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Voz do navegador</label>
              <select
                value={browserURI}
                onChange={(e) => setBrowserURI(e.target.value)}
                className="w-full glass px-3 py-2 rounded-lg text-sm bg-black/30 outline-none"
              >
                <option value="">— automático (melhor pt-BR) —</option>
                {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}
              </select>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                No Chrome/Edge procure vozes com <b>Natural</b> ou <b>Neural</b> no nome — soam MUITO melhor.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Tom (pitch): {pitch.toFixed(2)}</label>
              <input type="range" min={0.5} max={1.6} step={0.05} value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))} className="w-full accent-[oklch(0.78_0.28_330)]" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Velocidade: {rate.toFixed(2)}</label>
              <input type="range" min={0.6} max={1.4} step={0.05} value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))} className="w-full accent-[oklch(0.78_0.28_330)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={testVoice} className="glass rounded-lg py-3 font-display text-sm flex items-center justify-center gap-2 hover-lift">
              <Volume2 className="h-4 w-4" /> Testar
            </button>
            <button onClick={saveAll} className="btn-neon rounded-lg py-3 font-display text-sm flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> Salvar pra sempre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
