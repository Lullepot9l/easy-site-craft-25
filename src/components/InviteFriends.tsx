import { useCallback, useEffect, useState } from "react";
import { Gift, Copy, RefreshCw, Trash2, Coins, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Invite = {
  id: string; code: string; invited_id: string | null;
  redeemed: boolean; reward_coins: number; created_at: string;
};

const REWARD = 10;

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 8; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export function InviteFriends() {
  const { user } = useAuth();
  const [list, setList] = useState<Invite[]>([]);
  const [redeem, setRedeem] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("invites").select("id, code, invited_id, redeemed, reward_coins, created_at")
      .eq("inviter_id", user.id).order("created_at", { ascending: false }).limit(50);
    setList((data ?? []) as Invite[]);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("invites").insert({ inviter_id: user.id, code: makeCode(), reward_coins: REWARD });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Convite criado! Cada amigo que entrar vale +${REWARD} 🪙`);
    load();
  }

  function link(code: string) {
    return `${window.location.origin}/login?invite=${code}`;
  }

  async function copy(code: string) {
    await navigator.clipboard.writeText(link(code));
    toast.success("Link copiado — manda pro seu amigo!");
  }

  async function share(code: string) {
    const url = link(code);
    if (navigator.share) {
      try { await navigator.share({ title: "Entra na Luris comigo 🌑", text: "Cria sua conta com meu convite:", url }); return; } catch { /* cancelado */ }
    }
    copy(code);
  }

  async function del(id: string) {
    await supabase.from("invites").delete().eq("id", id);
    setList((l) => l.filter((i) => i.id !== id));
  }

  async function useCode() {
    if (!user) return;
    const code = redeem.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    const { data: inv } = await supabase
      .from("invites").select("id, inviter_id, redeemed, reward_coins").eq("code", code).maybeSingle();
    if (!inv) { setBusy(false); return toast.error("Convite não encontrado"); }
    if (inv.redeemed) { setBusy(false); return toast.error("Esse convite já foi usado"); }
    if (inv.inviter_id === user.id) { setBusy(false); return toast.error("Você não pode usar o próprio convite 😅"); }

    const { error } = await supabase.from("invites")
      .update({ invited_id: user.id, redeemed: true, redeemed_at: new Date().toISOString() })
      .eq("id", inv.id);
    if (error) { setBusy(false); return toast.error(error.message); }

    // recompensa o convidador
    const { data: p } = await supabase.from("profiles").select("coins").eq("id", inv.inviter_id).maybeSingle();
    await supabase.from("profiles").update({ coins: (p?.coins ?? 0) + (inv.reward_coins ?? REWARD) }).eq("id", inv.inviter_id);
    // e dá um bônus de boas-vindas pra quem entrou
    const { data: me } = await supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle();
    await supabase.from("profiles").update({ coins: (me?.coins ?? 0) + REWARD }).eq("id", user.id);

    // vira amizade automática
    await supabase.from("friendships").insert({ requester_id: inv.inviter_id, addressee_id: user.id, status: "accepted" });

    setBusy(false); setRedeem("");
    toast.success(`Convite resgatado! Vocês já são amigos e cada um ganhou +${REWARD} 🪙`);
    load();
  }

  const earned = list.filter((i) => i.redeemed).length * REWARD;

  return (
    <div className="glass-strong rounded-2xl p-5 space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-display neon-text flex items-center gap-2">
            <Gift className="h-4 w-4" /> Convide amigos · +{REWARD} 🪙 por amigo
          </h3>
          <p className="text-[10px] font-mono text-muted-foreground">
            {list.filter(i => i.redeemed).length} convites usados · <span className="neon-text-magenta">{earned} 🪙 ganhos</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="glass px-3 py-1.5 rounded-lg text-xs font-mono hover-lift"><RefreshCw className="h-3 w-3" /></button>
          <button onClick={create} disabled={busy} className="btn-neon px-4 py-1.5 rounded-lg text-xs font-display disabled:opacity-50">
            + Gerar link de convite
          </button>
        </div>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {list.map((i) => (
          <div key={i.id} className="glass rounded-lg px-3 py-2 flex items-center gap-2 text-[11px] font-mono">
            <span className={`px-1.5 py-0.5 rounded ${i.redeemed ? "bg-[oklch(0.4_0.25_140/0.3)] text-[oklch(0.85_0.25_140)]" : "bg-[oklch(0.3_0.15_295/0.4)]"}`}>
              {i.redeemed ? <Check className="h-3 w-3 inline" /> : "livre"}
            </span>
            <span className="flex-1 truncate">{link(i.code)}</span>
            <span className="flex items-center gap-1 text-[oklch(0.85_0.25_60)]"><Coins className="h-3 w-3" />{i.reward_coins}</span>
            <button onClick={() => copy(i.code)} title="Copiar" className="hover:text-[oklch(0.85_0.25_330)]"><Copy className="h-3 w-3" /></button>
            <button onClick={() => share(i.code)} title="Compartilhar" className="hover:text-[oklch(0.85_0.25_330)]">📤</button>
            <button onClick={() => del(i.id)} className="text-muted-foreground hover:text-[oklch(0.7_0.25_25)]"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
        {list.length === 0 && <p className="text-[10px] font-mono text-muted-foreground">Nenhum convite ainda. Gera um link e manda pros amigos!</p>}
      </div>

      <div className="glass rounded-lg p-3 flex gap-2 flex-wrap items-center">
        <span className="text-[11px] font-mono text-muted-foreground">Recebeu um convite?</span>
        <input value={redeem} onChange={(e) => setRedeem(e.target.value)} placeholder="CÓDIGO"
          className="glass px-3 py-1.5 rounded-lg text-xs font-mono uppercase flex-1 min-w-[120px]" />
        <button onClick={useCode} disabled={busy || !redeem.trim()} className="btn-neon px-3 py-1.5 rounded-lg text-xs font-display disabled:opacity-50">
          Resgatar
        </button>
      </div>
    </div>
  );
}
