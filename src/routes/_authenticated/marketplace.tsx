import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Upload, X, Trash2, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { AvatarBubble } from "@/components/AvatarBubble";
import { NAME_COLORS, NAME_FONTS, optionClass } from "@/lib/profile-style";

export const Route = createFileRoute("/_authenticated/marketplace")({ component: Market });

interface Item {
  id: string;
  title: string;
  description: string | null;
  category: string;
  item_type: string;
  price_coins: number;
  image_url: string | null;
  seller_id: string | null;
  is_featured: boolean;
  approved: boolean;
  downloads: number;
  tags: string[] | null;
  content: string | null;
  created_at: string;
}

const TYPES = ["avatar_effect", "chat_background", "name_style", "name_font", "profile_theme", "script", "imagem", "template", "asset", "plugin", "outro"];
const CATEGORIES = ["Avatar Effects", "Fundos de Chat", "Perfil", "Scripts", "Templates", "Assets", "Plugins", "VIP", "LuCoins", "Outros"];

const FX_LABEL: Record<string, string> = {
  "fx-rainbow": "Aura Arco-Íris", "fx-halo": "Halo Dourado", "fx-flame": "Chamas Néon",
  "fx-pulse": "Pulso Magenta", "fx-electric": "Elétrico", "fx-shadow": "Sombra Dark",
  "fx-heart": "Coração Batendo", "fx-galaxy": "Galáxia", "fx-hologram": "Holograma",
  "fx-shine": "Brilho Suave", "fx-ice": "Gelo", "fx-owner": "Coroa Owner",
  "fx-neon-green": "Neon Verde", "fx-blueflame": "Fogo Azul", "fx-void": "Vazio",
  "fx-crystal": "Cristal", "fx-circuit": "Cyber Circuit", "fx-sakura": "Sakura",
  "fx-toxic": "Tóxico", "fx-aurora": "Aurora", "fx-blood": "Sangue", "fx-liquid-gold": "Ouro Líquido",
  "fx-nightberry": "Aura Nightberry", "fx-owner-purple": "Owner Roxo",
  "fx-glitch": "Aura Glitch", "fx-solar": "Aura Solar", "fx-emerald": "Aura Esmeralda",
  "fx-cyberpink": "Aura Cyber Pink", "fx-moon": "Aura Lua",
};

function extractFxTag(tags: string[] | null): string | null {
  return tags?.find((t) => t.startsWith("fx-")) ?? null;
}

function extractStyleTag(tags: string[] | null, prefix: string): string | null {
  const tag = tags?.find((t) => t.startsWith(prefix));
  return tag ? tag.slice(prefix.length) : null;
}

function Market() {
  const { user, isOwner, profile } = useAuth();
  const { formatCoins } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("Todos");
  const [tab, setTab] = useState<"shop" | "inventory">("shop");

  // form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [itemType, setItemType] = useState(TYPES[0]);
  const [price, setPrice] = useState(10);
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    const { data } = await supabase.from("marketplace_items")
      .select("*").order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(500);
    setItems((data ?? []) as Item[]);
    if (user) {
      const { data: inv } = await supabase.from("user_inventory").select("item_id").eq("user_id", user.id);
      setInventory(new Set((inv ?? []).map((r) => r.item_id as string)));
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const up = await supabase.storage.from("marketplace").upload(path, file);
        if (up.error) throw up.error;
        image_url = supabase.storage.from("marketplace").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("marketplace_items").insert({
        seller_id: user.id,
        title, description: desc,
        category, item_type: itemType,
        price_coins: Math.max(0, Math.floor(price)),
        image_url,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        approved: isOwner,
      });
      if (error) throw error;
      toast.success(isOwner ? "Item publicado!" : "Enviado para aprovação 🌑");
      setOpen(false); setTitle(""); setDesc(""); setPrice(10); setTags(""); setFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao publicar");
    } finally { setLoading(false); }
  }

  async function remove(it: Item) {
    if (!confirm("Remover item?")) return;
    const { error } = await supabase.from("marketplace_items").delete().eq("id", it.id);
    if (error) toast.error(error.message); else { toast.success("Removido"); load(); }
  }
  async function approve(it: Item) {
    await supabase.from("marketplace_items").update({ approved: true }).eq("id", it.id);
    load();
  }

  async function buy(it: Item) {
    if (!user || !profile) return toast.error("Faça login");
    if (inventory.has(it.id)) return toast.info("Você já tem esse item — vai lá no inventário e equipa 🌑");
    if ((profile.coins ?? 0) < it.price_coins) return toast.error(`Faltam LuCoins. Você tem ${profile.coins} 🪙`);
    // Deduct + insert inventory
    const newBalance = (profile.coins ?? 0) - it.price_coins;
    const { error: e1 } = await supabase.from("profiles").update({ coins: newBalance }).eq("id", user.id);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await supabase.from("user_inventory").insert({ user_id: user.id, item_id: it.id });
    if (e2) return toast.error(e2.message);
    // increment downloads counter for popularity
    await supabase.from("marketplace_items").update({ downloads: (it.downloads ?? 0) + 1 }).eq("id", it.id);
    toast.success(`✨ ${it.title} desbloqueado! Vai no inventário e clica em Equipar.`);
    // Reload profile coins by hard reload of auth would be heavy — just refetch inventory + local coin state
    setInventory((s) => new Set(s).add(it.id));
    // update profile in-place (best-effort)
    profile.coins = newBalance;
  }

  async function equip(it: Item) {
    if (!user) return;
    const fx = extractFxTag(it.tags);
    let patch: Record<string, string | null> | null = null;
    let label = it.title;
    if (it.item_type === "avatar_effect" && fx) {
      if ((fx === "fx-owner" || fx === "fx-owner-purple") && !isOwner) return toast.error("Efeito exclusivo Owner 👑");
      patch = { equipped_effect: fx };
      label = FX_LABEL[fx] ?? fx;
    } else if (it.item_type === "name_style") {
      patch = { name_color: it.content ?? extractStyleTag(it.tags, "name-") ?? "gradient" };
    } else if (it.item_type === "name_font") {
      patch = { name_font: it.content ?? extractStyleTag(it.tags, "font-") ?? "nightberry" };
    } else if (it.item_type === "profile_theme") {
      patch = { profile_theme: it.content ?? extractStyleTag(it.tags, "theme-") ?? "nightberry" };
    } else if (it.item_type === "chat_background") {
      const value = it.content ?? it.image_url ?? "oklch(0.18 0.12 295)";
      localStorage.setItem("luris.chat.bg", JSON.stringify({ mode: value.startsWith("http") || value.startsWith("data:") ? "image" : "color", value, scope: "all" }));
      toast.success(`Fundo ${it.title} aplicado nas conversas!`);
      return;
    }
    if (!patch) return toast.error("Esse item ainda não é equipável.");
    const { error } = await supabase.from("profiles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success(`${label} equipado!`);
    window.location.reload();
  }

  async function unequip() {
    if (!user) return;
    await supabase.from("profiles").update({ equipped_effect: null }).eq("id", user.id);
    toast.success("Efeito removido");
    window.location.reload();
  }

  const filtered = useMemo(() => {
    const base = items.filter(i => i.approved || isOwner || i.seller_id === user?.id);
    if (tab === "inventory") return base.filter(i => inventory.has(i.id));
    if (filter === "Todos") return base;
    return base.filter(i => i.category === filter);
  }, [items, inventory, filter, tab, isOwner, user?.id]);

  const equippedFx = profile?.equipped_effect ?? null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="glass-strong rounded-2xl p-6 flex items-center justify-between flex-wrap gap-3 glow-purple">
        <div className="flex items-center gap-4">
          <AvatarBubble url={profile?.avatar_url} name={profile?.display_name} size={56} effect={equippedFx ?? (isOwner ? "fx-owner" : null)} />
          <div>
            <h1 className="text-3xl font-display gradient-text">🛒 Marketplace</h1>
            <p className="text-xs font-mono text-muted-foreground">Saldo: <b className="neon-text-magenta">{formatCoins(profile?.coins ?? 0)}</b></p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-neon px-4 py-2 rounded-lg font-display text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Publicar item
        </button>
      </header>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex glass rounded-lg p-1">
          <button onClick={() => setTab("shop")} className={`px-3 py-1.5 rounded-md text-xs font-display ${tab === "shop" ? "btn-neon" : ""}`}>🛒 Loja</button>
          <button onClick={() => setTab("inventory")} className={`px-3 py-1.5 rounded-md text-xs font-display ${tab === "inventory" ? "btn-neon" : ""}`}>🎒 Meu inventário</button>
        </div>
        {tab === "shop" && (
          <div className="flex flex-wrap gap-1">
            {["Todos", ...CATEGORIES].map((c) => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase ${filter === c ? "btn-neon" : "glass hover:bg-white/5"}`}>
                {c}
              </button>
            ))}
          </div>
        )}
        {tab === "inventory" && equippedFx && (
          <button onClick={unequip} className="glass px-3 py-1.5 rounded-md text-xs font-mono ml-auto">
            Remover efeito equipado
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((it) => {
          const fx = extractFxTag(it.tags);
          const owned = inventory.has(it.id);
          const isCosmetic = ["avatar_effect", "chat_background", "name_style", "name_font", "profile_theme"].includes(it.item_type);
          const isEquipped = Boolean(fx && fx === equippedFx);
          return (
            <div key={it.id} className="glass p-4 rounded-xl hover-lift relative group">
              {!it.approved && <span className="absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-[oklch(0.4_0.2_60/0.4)] text-[oklch(0.85_0.18_80)]">pendente</span>}
              {it.is_featured && <span className="absolute top-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-[oklch(0.3_0.28_330/0.5)] neon-text-magenta">★ destaque</span>}

              {fx ? (
                <div className="aspect-video rounded-lg mb-3 bg-gradient-to-br from-[oklch(0.18_0.15_295)] to-[oklch(0.15_0.2_330)] flex items-center justify-center">
                  <AvatarBubble name="L" size={80} effect={fx} />
                </div>
              ) : it.item_type === "chat_background" ? (
                <div className="aspect-video rounded-lg overflow-hidden mb-3 flex items-center justify-center text-sm font-display"
                  style={it.content?.startsWith("http") || it.image_url ? { backgroundImage: `linear-gradient(oklch(0.08 0.04 285 / 0.25), oklch(0.08 0.04 285 / 0.65)), url(${it.content?.startsWith("http") ? it.content : it.image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: it.content ?? "oklch(0.18 0.12 295)" }}>
                  Fundo de conversa
                </div>
              ) : it.item_type === "name_style" || it.item_type === "name_font" || it.item_type === "profile_theme" ? (
                <div className={`aspect-video rounded-lg mb-3 flex items-center justify-center ${it.item_type === "profile_theme" ? `profile-theme-${it.content ?? "neon"}` : "bg-gradient-to-br from-[oklch(0.18_0.1_295)] to-[oklch(0.12_0.1_330)]"}`}>
                  <div className={`text-3xl ${
                    it.item_type === "name_font" ? optionClass(NAME_FONTS, it.content) : "font-display"
                  } ${
                    it.item_type === "name_style" ? optionClass(NAME_COLORS, it.content) : "gradient-text"
                  }`}>Luris</div>
                </div>
              ) : (
                <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-[oklch(0.3_0.25_295)] to-[oklch(0.3_0.3_330)] flex items-center justify-center text-4xl">
                  {it.image_url ? <img src={it.image_url} alt={it.title} className="w-full h-full object-cover" /> : "✨"}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-mono neon-text-cyan uppercase mb-1">
                <span>{it.category}</span> · <span className="opacity-60">{it.item_type}</span>
              </div>
              <h3 className="font-display text-lg gradient-text">{it.title}</h3>
              {it.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{it.description}</p>}

              <div className="flex justify-between items-center mt-3 gap-2 flex-wrap">
                <span className="text-lg font-display neon-text-magenta">
                  {it.price_coins === 0 ? "Grátis" : `${it.price_coins} 🪙`}
                </span>
                <div className="flex gap-1 items-center flex-wrap">
                  {isOwner && !it.approved && <button onClick={() => approve(it)} className="text-[10px] glass px-2 py-1 rounded">aprovar</button>}
                  {(it.seller_id === user?.id || isOwner) && (
                    <button onClick={() => remove(it)} className="glass p-1.5 rounded text-[oklch(0.7_0.25_25)]"><Trash2 className="h-3 w-3" /></button>
                  )}

                  {owned && isCosmetic && (
                    isEquipped
                      ? <span className="glass px-2 py-1 rounded-md text-[10px] font-mono flex items-center gap-1 neon-text-cyan"><Check className="h-3 w-3" />equipado</span>
                      : <button onClick={() => equip(it)} className="btn-neon px-3 py-1 rounded-md text-xs font-display flex items-center gap-1"><Sparkles className="h-3 w-3" /> Equipar</button>
                  )}
                  {owned && !isCosmetic && <span className="glass px-2 py-1 rounded-md text-[10px] font-mono">✓ comprado</span>}
                  {!owned && <button onClick={() => buy(it)} className="btn-neon px-3 py-1 rounded-md text-xs font-display">Comprar</button>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground font-mono py-12">
            {tab === "inventory" ? "Você ainda não comprou nada. Vai na loja 🛒" : "Nenhum item nessa categoria. Seja o primeiro a publicar 🌑"}
          </p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-2xl p-6 w-full max-w-lg glow-purple space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl gradient-text">Publicar no Marketplace</h2>
              <button type="button" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <input required placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} className="w-full glass px-3 py-2 rounded-lg text-sm" />
            <textarea placeholder="Descrição" value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="w-full glass px-3 py-2 rounded-lg text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={category} onChange={e=>setCategory(e.target.value)} className="glass px-3 py-2 rounded-lg text-sm">
                {CATEGORIES.map(c=> <option key={c}>{c}</option>)}
              </select>
              <select value={itemType} onChange={e=>setItemType(e.target.value)} className="glass px-3 py-2 rounded-lg text-sm">
                {TYPES.map(t=> <option key={t}>{t}</option>)}
              </select>
            </div>
            <input type="number" min={0} placeholder="Preço em LuCoins (0 = grátis)" value={price} onChange={e=>setPrice(+e.target.value)} className="w-full glass px-3 py-2 rounded-lg text-sm" />
            <input placeholder="Tags separadas por vírgula (ex: fx-rainbow, animated)" value={tags} onChange={e=>setTags(e.target.value)} className="w-full glass px-3 py-2 rounded-lg text-sm" />
            <label className="flex items-center gap-2 glass px-3 py-2 rounded-lg text-xs cursor-pointer">
              <Upload className="h-4 w-4" /> {file?.name ?? "Selecionar imagem (opcional)"}
              <input type="file" accept="image/*" className="hidden" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
            </label>
            <button type="submit" disabled={loading} className="w-full btn-neon py-3 rounded-lg font-display disabled:opacity-50">
              {loading ? "Publicando..." : "Publicar"}
            </button>
            {!isOwner && <p className="text-[10px] text-muted-foreground font-mono text-center">Itens passam por aprovação do Owner antes de ficarem visíveis publicamente.</p>}
          </form>
        </div>
      )}
    </div>
  );
}
