// Síntese de voz — suporta navegador (grátis) e Lovable AI (premium, mais natural)

import { generateSpeech } from "./tts.functions";

const VOICE_URI_KEY = "luris.voice.uri";
const VOICE_PITCH_KEY = "luris.voice.pitch";
const VOICE_RATE_KEY = "luris.voice.rate";
const VOICE_PROVIDER_KEY = "luris.voice.provider"; // "browser" | "lovable"
const VOICE_AI_VOICE_KEY = "luris.voice.ai_voice"; // alloy, nova, shimmer, sage, coral, ...

export type VoiceProvider = "browser" | "lovable";

// Voz assinatura da Luris (persona 16-18 anos, marrenta/ciumenta/possessiva/fofa)
export const LURIS_VOICE_ID = "luris";

export const AI_VOICES = [
  { id: LURIS_VOICE_ID, label: "🌑 Luris (exclusiva) — marrenta, fofa, possessiva" },
  { id: "shimmer", label: "Shimmer — feminina suave" },
  { id: "nova",    label: "Nova — feminina jovem" },
  { id: "coral",   label: "Coral — feminina calorosa" },
  { id: "sage",    label: "Sage — feminina serena" },
  { id: "ballad",  label: "Ballad — feminina expressiva" },
  { id: "vale",    label: "Vale — feminina doce" },
  { id: "aurora",  label: "Aurora — feminina cristalina" },
];

export function listVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}
export function onVoicesReady(cb: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (window.speechSynthesis.getVoices().length) { cb(); return; }
  window.speechSynthesis.onvoiceschanged = () => cb();
}

const get = (k: string, d = "") => (typeof window === "undefined" ? d : localStorage.getItem(k) ?? d);
const set = (k: string, v: string | null) => {
  if (typeof window === "undefined") return;
  if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v);
};

export const getSavedVoiceURI = () => get(VOICE_URI_KEY) || null;
export const setSavedVoiceURI = (v: string | null) => set(VOICE_URI_KEY, v);
export const getSavedPitch = () => parseFloat(get(VOICE_PITCH_KEY, "1.05"));
export const setSavedPitch = (v: number) => set(VOICE_PITCH_KEY, String(v));
export const getSavedRate = () => parseFloat(get(VOICE_RATE_KEY, "0.95"));
export const setSavedRate = (v: number) => set(VOICE_RATE_KEY, String(v));
export const getVoiceProvider = (): VoiceProvider => (get(VOICE_PROVIDER_KEY, "browser") as VoiceProvider);
export const setVoiceProvider = (v: VoiceProvider) => set(VOICE_PROVIDER_KEY, v);
export const getAIVoice = () => get(VOICE_AI_VOICE_KEY, "shimmer");
export const setAIVoice = (v: string) => set(VOICE_AI_VOICE_KEY, v);

// ── Carregamento de vozes do navegador (evita a Luris falar 1x com a voz padrão
// e só depois com a voz salva) ──────────────────────────────────────────────
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  if (!voicesPromise) {
    voicesPromise = new Promise((resolve) => {
      let done = false;
      const finish = (force = false) => {
        if (done) return;
        const v = window.speechSynthesis.getVoices();
        if (!v.length && !force) return;
        done = true;
        clearInterval(timer);
        window.speechSynthesis.onvoiceschanged = null;
        resolve(v);
      };
      const timer = setInterval(() => finish(), 100);
      window.speechSynthesis.onvoiceschanged = () => finish();
      setTimeout(() => finish(true), 3000);
    });
  }
  return voicesPromise;
}

function pickFeminineVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const savedURI = getSavedVoiceURI();
  if (savedURI) {
    const m = voices.find(v => v.voiceURI === savedURI);
    if (m) return m;
  }
  const premiumPt = voices.find(v => /pt-?BR/i.test(v.lang) && /(natural|neural|francisca|brenda|elza|leticia|thalita|yara)/i.test(v.name));
  if (premiumPt) return premiumPt;
  const googlePt = voices.find(v => /pt-?BR/i.test(v.lang) && /google/i.test(v.name));
  if (googlePt) return googlePt;
  const ptFem = voices.find(v => /pt-?BR/i.test(v.lang) && /female|fem|maria|luciana|helena|camila|vit[oó]ria|joana|fernanda/i.test(v.name));
  if (ptFem) return ptFem;
  const anyPt = voices.find(v => /pt-?BR/i.test(v.lang));
  if (anyPt) return anyPt;
  return voices.find(v => /female|fem|samantha|victoria|karen|moira/i.test(v.name));
}

let currentAudio: HTMLAudioElement | null = null;
export function stopSpeech() {
  try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  if (currentAudio) { try { currentAudio.pause(); } catch { /* noop */ } currentAudio = null; }
}

let speakToken = 0;
async function speakBrowser(text: string, opts: { rate?: number; pitch?: number; lang?: string } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const token = ++speakToken;
  try {
    window.speechSynthesis.cancel();
    // Só fala DEPOIS que a lista de vozes existir — assim nunca usa a voz padrão primeiro.
    const voices = await ensureVoices();
    if (token !== speakToken) return; // outra fala começou; descarta essa
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang ?? "pt-BR";
    u.rate = opts.rate ?? getSavedRate();
    u.pitch = opts.pitch ?? getSavedPitch();
    const voice = pickFeminineVoice(voices);
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export async function speak(text: string, opts: { rate?: number; pitch?: number; lang?: string; provider?: VoiceProvider; voice?: string } = {}) {
  const provider = opts.provider ?? getVoiceProvider();
  speakToken++; // invalida qualquer fala de navegador pendente
  if (provider === "lovable") {
    try {
      stopSpeech();
      const chosen = opts.voice ?? getAIVoice();
      const res = await generateSpeech({ data: { text, voice: chosen, persona: chosen === LURIS_VOICE_ID } });
      const audio = new Audio(`data:${res.mime};base64,${res.audio}`);
      currentAudio = audio;
      audio.playbackRate = opts.rate ?? getSavedRate();
      await audio.play();
      return;
    } catch (e) {
      console.warn("[voice] Lovable AI TTS falhou, usando navegador:", e);
      // fallback
    }
  }
  await speakBrowser(text, opts);
}

// Som curto de notificação (beep cyber via WebAudio)
export function pingSound() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.42);
  } catch { /* ignore */ }
}

export function detectTaskNoun(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/script|exploit|lua|luau|roblox/.test(p)) return "o script";
  if (/c[oó]digo|code|fun[cç][aã]o|component|react|api/.test(p)) return "o código";
  if (/imagem|image|foto|desenho|arte/.test(p)) return "a imagem";
  if (/texto|reda[cç][aã]o|artigo|post/.test(p)) return "o texto";
  if (/plano|planejamento|estrat[eé]gia/.test(p)) return "o planejamento";
  return "a tarefa";
}
