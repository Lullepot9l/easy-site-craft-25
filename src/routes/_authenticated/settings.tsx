import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AvatarBubble } from "@/components/AvatarBubble";
import { Image as ImgIcon, Palette, Save, RotateCcw, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

const BG_KEY = "luris.chat.bg";        // JSON: { mode: "color"|"image", value: string, scope: "all"|convId }
const BG_MAP_KEY = "luris.chat.bg.map"; // JSON: Record<convId, {mode,value}>

type BgCfg = { mode: "color" | "image"; value: string };

const PRESETS: BgCfg[] = [
  { mode: "color", value: "oklch(0.15 0.05 285)" },
  { mode: "color", value: "oklch(0.18 0.08 320)" },
  { mode: "color", value: "oklch(0.14 0.03 250)" },
  { mode: "color", value: "oklch(0.12 0.02 200)" },
  { mode: "image", value: "https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?w=1600" },
  { mode: "image", value: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600" },
  { mode: "image", value: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1600" },
  { mode: "image", value: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600" },
];

function SettingsPage() {
  const { user, profile, isOwner } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [scope, setScope] = useState<"all" | "single">("all");
  const [bg, setBg] = useState<BgCfg>({ mode: "color", value: "oklch(0.15 0.05 285)" });
  const [saving, setSaving] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  function readFileAsDataURL(file: File, maxMB: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) return reject(new Error("Só imagens"));
      if (file.size > maxMB * 1024 * 1024) return reject(new Error(`Máx ${maxMB}MB`));
      const r = new FileReader();
      r.onload = (e) => resolve(String(e.target?.result ?? ""));
      r.onerror = () => reject(new Error("Falha ao ler arquivo"));
      r.readAsDataURL(file);
    });
  }

  async function onPickAvatar(file: File | null | undefined) {
    if (!file) return;
    try {
      const url = await readFileAsDataURL(file, 2);
      setAvatarUrl(url);
      toast.success("Foto carregada — clica em Salvar perfil");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  async function onPickBgFile(file: File | null | undefined) {
    if (!file) return;
    try {
      const url = await readFileAsDataURL(file, 4);
      applyBg({ mode: "image", value: url });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  useEffect(() => { setAvatarUrl(profile?.avatar_url ?? ""); setDisplayName(profile?.display_name ?? ""); }, [profile?.id]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BG_KEY);
      if (raw) { const parsed = JSON.parse(raw); if (parsed?.mode) setBg({ mode: parsed.mode, value: parsed.value }); }
    } catch { /* noop */ }
  }, []);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        avatar_url: avatarUrl || null,
        display_name: displayName || null,
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Perfil atualizado 🌑");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setSaving(false); }
  }

  function applyBg(next: BgCfg) {
    setBg(next);
    localStorage.setItem(BG_KEY, JSON.stringify({ ...next, scope }));
    if (scope === "all") {
      localStorage.removeItem(BG_MAP_KEY);
    }
    toast.success("Fundo aplicado — abre o chat pra ver ✨");
  }

  function resetBg() {
    localStorage.removeItem(BG_KEY);
    localStorage.removeItem(BG_MAP_KEY);
    setBg({ mode: "color", value: "oklch(0.15 0.05 285)" });
    toast("Fundo padrão restaurado");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-display gradient-text">⚙️ Configurações</h1>
        <p className="text-sm text-muted-foreground">Foto, nome de exibição e fundo das conversas.</p>
      </div>

      <section className="glass-strong rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg flex items-center gap-2"><ImgIcon className="h-4 w-4" /> Foto & Nome</h2>
        <div className="flex items-center gap-4">
          <AvatarBubble url={avatarUrl} name={displayName} size={72} effect={profile?.equipped_effect ?? (isOwner ? "fx-owner-purple" : null)} />
          <div className="flex-1 space-y-2">
            <input value={displayName} onChange={(e)=>setDisplayName(e.target.value)}
              placeholder="Nome de exibição"
              className="w-full glass px-3 py-2 rounded-lg text-sm font-mono" />
            <input value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)}
              placeholder="URL da foto (ou envie um arquivo abaixo)"
              className="w-full glass px-3 py-2 rounded-lg text-sm font-mono" />
            <div
              onDragOver={(e)=>e.preventDefault()}
              onDrop={(e)=>{ e.preventDefault(); onPickAvatar(e.dataTransfer.files?.[0]); }}
              onClick={()=>avatarFileRef.current?.click()}
              className="glass rounded-lg p-3 border-2 border-dashed border-[oklch(0.4_0.2_295/0.4)] hover:border-[oklch(0.6_0.3_295)] cursor-pointer text-center text-xs font-mono text-muted-foreground">
              <Upload className="h-4 w-4 mx-auto mb-1 text-[oklch(0.7_0.28_295)]" />
              Arrasta ou clica pra enviar uma foto (PNG/JPG, máx 2MB)
            </div>
            <input ref={avatarFileRef} type="file" accept="image/*" className="hidden"
              onChange={(e)=>onPickAvatar(e.target.files?.[0])} />
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-neon px-4 py-2 rounded-lg text-sm font-display flex items-center gap-2">
          <Save className="h-3 w-3" /> {saving ? "..." : "Salvar perfil"}
        </button>
      </section>

      <section className="glass-strong rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg flex items-center gap-2"><Palette className="h-4 w-4" /> Fundo das conversas</h2>

        <div className="flex gap-2 text-xs font-mono">
          <button onClick={()=>setScope("all")} className={`px-3 py-1.5 rounded-lg ${scope==="all"?"btn-neon":"glass"}`}>Todas as conversas</button>
          <button onClick={()=>setScope("single")} className={`px-3 py-1.5 rounded-lg ${scope==="single"?"btn-neon":"glass"}`}>Só a conversa ativa</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={()=>applyBg(p)}
              className={`h-20 rounded-xl border-2 transition hover:scale-105 ${bg.value===p.value?"border-[oklch(0.7_0.3_295)] glow-purple":"border-transparent"}`}
              style={p.mode==="color" ? { background: p.value } : { backgroundImage:`url(${p.value})`, backgroundSize:"cover", backgroundPosition:"center" }} />
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground">URL de imagem própria (cola aqui e aplica):</label>
          <div className="flex gap-2">
            <input placeholder="https://sua-imagem.jpg" value={bg.mode==="image"?bg.value:""}
              onChange={(e)=>setBg({ mode:"image", value:e.target.value })}
              className="flex-1 glass px-3 py-2 rounded-lg text-sm font-mono" />
            <button onClick={()=>bg.mode==="image" && bg.value && applyBg(bg)} className="btn-neon px-4 rounded-lg text-xs font-display">Aplicar</button>
          </div>
          <div
            onDragOver={(e)=>e.preventDefault()}
            onDrop={(e)=>{ e.preventDefault(); onPickBgFile(e.dataTransfer.files?.[0]); }}
            onClick={()=>bgFileRef.current?.click()}
            className="glass rounded-lg p-4 border-2 border-dashed border-[oklch(0.4_0.2_295/0.4)] hover:border-[oklch(0.6_0.3_295)] cursor-pointer text-center text-xs font-mono text-muted-foreground">
            <Upload className="h-5 w-5 mx-auto mb-1 text-[oklch(0.7_0.28_295)]" />
            Ou envia um arquivo do seu PC (arrasta ou clica — PNG/JPG, máx 4MB)
          </div>
          <input ref={bgFileRef} type="file" accept="image/*" className="hidden"
            onChange={(e)=>onPickBgFile(e.target.files?.[0])} />
        </div>

        <button onClick={resetBg} className="glass px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
          <RotateCcw className="h-3 w-3" /> Restaurar padrão
        </button>

        <p className="text-[11px] text-muted-foreground font-mono">
          💡 Em breve: fundos animados também vão aparecer no <b>Marketplace</b> junto com os efeitos de perfil.
        </p>
      </section>
    </div>
  );
}