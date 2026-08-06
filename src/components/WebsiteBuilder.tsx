import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, Wand2, Save, Eye, Trash2, ExternalLink, Plus, Loader2, Code, Palette, Layers, MessageSquare, Send, Smartphone, Monitor, Copy, Download, Search, Copy as Duplicate, History, FileText, Sparkles, Image as ImgIcon, Mic, MicOff, MousePointer2, Github, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateWebsite, editWebsite, askWebsiteQuestions } from "@/lib/website.functions";

interface Site {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  html: string;
  css: string;
  js: string;
  template: string;
  published: boolean;
  views: number;
  updated_at: string;
}

const TEMPLATES = [
  { id: "landing", label: "Landing Page", icon: "🚀", prompt: "Landing page moderna com hero, features, pricing e CTA" },
  { id: "portfolio", label: "Portfólio", icon: "🎨", prompt: "Portfólio criativo dark com galeria e bio" },
  { id: "ecommerce", label: "E-commerce", icon: "🛒", prompt: "Loja online com grid de produtos e carrinho" },
  { id: "blog", label: "Blog", icon: "📝", prompt: "Blog minimalista com posts e categorias" },
  { id: "agency", label: "Agência", icon: "🏢", prompt: "Site de agência digital com serviços e cases" },
  { id: "saas", label: "SaaS", icon: "⚡", prompt: "Site SaaS com features, demo, depoimentos e planos" },
  { id: "restaurant", label: "Restaurante", icon: "🍽️", prompt: "Site de restaurante com cardápio, fotos e reservas" },
  { id: "event", label: "Evento", icon: "🎉", prompt: "Página de evento com agenda, palestrantes e ingressos" },
  { id: "personal", label: "Pessoal", icon: "👤", prompt: "Site pessoal com bio, links sociais e contato" },
  { id: "gaming", label: "Gaming / Clã", icon: "🎮", prompt: "Site de clã de games dark neon com roster, conquistas, streams e recrutamento" },
  { id: "linktree", label: "Link Hub", icon: "🔗", prompt: "Página de links estilo linktree com avatar, botões animados e tema neon" },
  { id: "musica", label: "Música / DJ", icon: "🎧", prompt: "Site de artista com player, próximos shows, galeria e links de streaming" },
  { id: "docs", label: "Docs / Wiki", icon: "📚", prompt: "Site de documentação com sidebar de navegação, busca simples e blocos de código" },
  { id: "dashboard", label: "Dashboard", icon: "📊", prompt: "Painel com cards de métricas, gráficos em canvas e tabela responsiva" },
  { id: "convite", label: "Convite / Festa", icon: "💌", prompt: "Página de convite com contagem regressiva, local no mapa e confirmação de presença" },
  { id: "blank", label: "Em branco", icon: "📄", prompt: "Página simples em branco para começar do zero" },
];

// Reforços de prompt: clique pra somar detalhes ao pedido
const BOOSTS = [
  { label: "🌑 Dark neon", add: "Tema escuro com neon roxo/magenta, glassmorphism e brilhos suaves." },
  { label: "☀️ Clean claro", add: "Tema claro e minimalista, muito espaço em branco e tipografia grande." },
  { label: "📱 100% responsivo", add: "Totalmente responsivo, com menu hambúrguer no mobile." },
  { label: "✨ Animações", add: "Animações de entrada ao rolar a página, hover suave e transições." },
  { label: "🔍 SEO pronto", add: "Inclua title, meta description, headings semânticos e alt em imagens." },
  { label: "🧩 Muitas seções", add: "Faça uma página longa com pelo menos 7 seções bem distintas." },
  { label: "📝 Formulário", add: "Inclua formulário de contato com validação em JavaScript." },
  { label: "⚡ Sem libs", add: "Use apenas HTML, CSS e JS puros, sem bibliotecas externas." },
];

// Web Speech API typing helper
type SpeechRecognitionLike = {
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
  continuous: boolean; interimResults: boolean; lang: string;
};

export function WebsiteBuilder({ ownerId }: { ownerId: string }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [active, setActive] = useState<Site | null>(null);
  const [prompt, setPrompt] = useState("");
  const [template, setTemplate] = useState("landing");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"preview" | "html" | "css" | "js" | "seo">("preview");
  const [newOpen, setNewOpen] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [siteQuery, setSiteQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "draft">("all");
  const [showHistory, setShowHistory] = useState(false);
  const [visualEdit, setVisualEdit] = useState(false);
  const [questions, setQuestions] = useState<{ q: string; suggestions: string[] }[]>([]);
  const [askingQ, setAskingQ] = useState(false);
  const [listening, setListening] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const livePreviewTimer = useRef<number | null>(null);
  const gen = useServerFn(generateWebsite);
  const edit = useServerFn(editWebsite);
  const ask = useServerFn(askWebsiteQuestions);

  const filteredSites = useMemo(() => sites.filter(s => {
    if (filter === "live" && !s.published) return false;
    if (filter === "draft" && s.published) return false;
    if (!siteQuery.trim()) return true;
    const q = siteQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q);
  }), [sites, siteQuery, filter]);

  function snapshot(s: Site, label: string) {
    try {
      const key = `luris.site.history.${s.id}`;
      const arr = JSON.parse(localStorage.getItem(key) ?? "[]");
      arr.unshift({ at: Date.now(), label, html: s.html, css: s.css, js: s.js, title: s.title });
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 20)));
    } catch { /* noop */ }
  }
  function getHistory(id: string): Array<{ at: number; label: string; html: string; css: string; js: string; title: string }> {
    try { return JSON.parse(localStorage.getItem(`luris.site.history.${id}`) ?? "[]"); } catch { return []; }
  }

  useEffect(() => { refresh(); }, []);

  // LIVE preview — re-render com debounce sempre que o code muda
  useEffect(() => {
    if (!active) return;
    if (livePreviewTimer.current) window.clearTimeout(livePreviewTimer.current);
    livePreviewTimer.current = window.setTimeout(() => renderPreview(), 250);
    return () => { if (livePreviewTimer.current) window.clearTimeout(livePreviewTimer.current); };
  }, [active?.html, active?.css, active?.js, active?.title, tab, visualEdit]);

  async function refresh() {
    const { data } = await supabase.from("websites").select("*").order("updated_at", { ascending: false });
    setSites((data ?? []) as Site[]);
  }

  function renderPreview() {
    if (!iframeRef.current || !active) return;
    const veScript = visualEdit ? `
      document.documentElement.style.cursor='crosshair';
      document.body.addEventListener('mouseover',function(e){if(e.target===document.body)return;e.target.style.outline='2px dashed #ec4899';},true);
      document.body.addEventListener('mouseout',function(e){if(e.target===document.body)return;e.target.style.outline='';},true);
      document.body.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();
        var sel=e.target.tagName.toLowerCase()+(e.target.id?'#'+e.target.id:'')+(e.target.className?'.'+String(e.target.className).split(' ').filter(Boolean).join('.'):'');
        var txt=(e.target.innerText||'').slice(0,80);
        parent.postMessage({_luris:'pick',selector:sel,text:txt},'*');
      },true);
    ` : "";
    const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${active.title}</title><style>${active.css}</style></head><body>${active.html}<script>${active.js}<\/script><script>${veScript}<\/script></body></html>`;
    iframeRef.current.srcdoc = doc;
  }

  // Visual Edit pick → manda a instrução pro chat
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data as { _luris?: string; selector?: string; text?: string };
      if (!d || d._luris !== "pick") return;
      const sel = d.selector ?? "";
      const txt = d.text ?? "";
      setChatInput(prev => prev || `Edite o elemento "${sel}"${txt ? ` (texto atual: "${txt}")` : ""}: `);
      toast.success(`Elemento selecionado · descreva a mudança no chat`);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  async function askQuestions() {
    if (!prompt.trim()) return toast.error("Descreva o site primeiro");
    setAskingQ(true);
    try {
      const r = await ask({ data: { prompt } });
      if (r.error) toast.error(r.error);
      setQuestions(r.questions ?? []);
      if (!r.questions?.length) toast.success("Prompt já está completo — pode gerar direto");
    } finally { setAskingQ(false); }
  }

  async function createSite() {
    if (!prompt.trim()) return toast.error("Descreva o site");
    setLoading(true);
    try {
      const result = await gen({ data: { prompt, template } });
      if (result.error || !result.site) { toast.error(result.error ?? "Erro"); return; }
      const slug = `${template}-${Math.random().toString(36).slice(2, 8)}`;
      const { data, error } = await supabase.from("websites").insert({
        owner_id: ownerId,
        slug,
        title: result.site.title,
        description: result.site.description,
        html: result.site.html,
        css: result.site.css,
        js: result.site.js,
        template,
      }).select().single();
      if (error) return toast.error(error.message);
      toast.success("Site gerado! 🌐");
      setNewOpen(false);
      setPrompt("");
      setQuestions([]);
      setActive(data as Site);
      refresh();
    } finally { setLoading(false); }
  }

  async function saveActive() {
    if (!active) return;
    snapshot(active, "manual save");
    const { error } = await supabase.from("websites").update({
      title: active.title, html: active.html, css: active.css, js: active.js,
      description: active.description, published: active.published, slug: active.slug,
    }).eq("id", active.id);
    if (error) return toast.error(error.message);
    toast.success("Salvo · snapshot guardado");
    refresh();
  }

  async function duplicateSite(s: Site) {
    const slug = `${s.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("websites").insert({
      owner_id: ownerId, slug, title: `${s.title} (cópia)`, description: s.description,
      html: s.html, css: s.css, js: s.js, template: s.template,
    }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Site duplicado");
    setActive(data as Site);
    refresh();
  }

  function restoreSnapshot(snap: { html: string; css: string; js: string; title: string }) {
    if (!active) return;
    setActive({ ...active, ...snap });
    toast.success("Snapshot restaurado · clique Salvar p/ confirmar");
  }

  async function togglePublish() {
    if (!active) return;
    const next = !active.published;
    setActive({ ...active, published: next });
    await supabase.from("websites").update({ published: next }).eq("id", active.id);
    toast.success(next ? "Publicado 🌍" : "Despublicado");
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Excluir site?")) return;
    await supabase.from("websites").delete().eq("id", id);
    if (active?.id === id) setActive(null);
    toast.success("Removido");
    refresh();
  }

  async function regenerate() {
    if (!active) return;
    const desc = window.prompt("Nova descrição (deixe vazio para reusar):", active.description ?? "");
    if (desc === null) return;
    setLoading(true);
    try {
      const result = await gen({ data: { prompt: desc || active.title, template: active.template } });
      if (result.error || !result.site) { toast.error(result.error ?? "Erro"); return; }
      setActive({ ...active, ...result.site, description: result.site.description });
      toast.success("Regenerado");
    } finally { setLoading(false); }
  }

  async function sendChatEdit() {
    if (!active || !chatInput.trim() || editing) return;
    const instr = chatInput.trim();
    setChat(c => [...c, { role: "user", text: instr }]);
    setChatInput("");
    setEditing(true);
    try {
      const r = await edit({ data: {
        instruction: instr,
        html: active.html, css: active.css, js: active.js,
        title: active.title, description: active.description ?? "",
      }});
      if (r.error || !r.site) {
        setChat(c => [...c, { role: "ai", text: `⚠️ ${r.error ?? "Erro"}` }]);
        toast.error(r.error ?? "Erro");
        return;
      }
      snapshot(active, `ai: ${instr.slice(0, 40)}`);
      setActive({ ...active, ...r.site, description: r.site.description });
      setChat(c => [...c, { role: "ai", text: `✓ ${r.summary ?? "Atualizado"}` }]);
      await supabase.from("websites").update({
        html: r.site.html, css: r.site.css, js: r.site.js,
        title: r.site.title, description: r.site.description,
      }).eq("id", active.id);
      refresh();
    } finally { setEditing(false); }
  }

  function copyCode() {
    if (!active) return;
    const full = `<!doctype html><html><head><meta charset="utf-8"><title>${active.title}</title><style>${active.css}</style></head><body>${active.html}<script>${active.js}<\/script></body></html>`;
    navigator.clipboard.writeText(full);
    toast.success("HTML copiado");
  }

  function downloadSite() {
    if (!active) return;
    const full = `<!doctype html><html><head><meta charset="utf-8"><title>${active.title}</title><style>${active.css}</style></head><body>${active.html}<script>${active.js}<\/script></body></html>`;
    const blob = new Blob([full], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${active.slug}.html`;
    a.click();
  }

  function downloadBundle() {
    if (!active) return;
    // bundle "lite": gera 3 arquivos pra colar no GitHub
    const files = [
      { name: `${active.slug}-index.html`, content: `<!doctype html><html><head><meta charset="utf-8"><title>${active.title}</title><link rel="stylesheet" href="style.css"></head><body>${active.html}<script src="script.js"><\/script></body></html>` },
      { name: `${active.slug}-style.css`, content: active.css },
      { name: `${active.slug}-script.js`, content: active.js },
      { name: `${active.slug}-README.md`, content: `# ${active.title}\n\n${active.description ?? ""}\n\nGerado pelo LURIS Website Builder.\n\n## Deploy\n1. Sobe os 3 arquivos (renomeie removendo o prefixo) num repo GitHub\n2. Ative GitHub Pages na aba Settings\n3. Pronto.\n` },
    ];
    files.forEach(f => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([f.content], { type: "text/plain" }));
      a.download = f.name; a.click();
    });
    toast.success("Bundle baixado · 3 arquivos + README");
  }

  function insertImageBlock() {
    if (!active) return;
    const seed = window.prompt("Tema da imagem (seed do picsum):", "ocean");
    if (!seed) return;
    const w = window.prompt("Largura (px)", "1200") ?? "1200";
    const h = window.prompt("Altura (px)", "600") ?? "600";
    const img = `\n<figure class="luris-img"><img src="https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}" alt="${seed}" loading="lazy" /></figure>\n`;
    setActive({ ...active, html: active.html + img });
    toast.success("Imagem inserida no fim do HTML");
  }

  function toggleVoice(target: "create" | "chat") {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SR) return toast.error("Voz não suportada neste navegador");
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.lang = "pt-BR"; r.continuous = false; r.interimResults = false;
    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      if (target === "create") setPrompt(p => (p ? p + " " : "") + text);
      else setChatInput(p => (p ? p + " " : "") + text);
    };
    r.onerror = () => { setListening(false); toast.error("Erro no microfone"); };
    r.onend = () => setListening(false);
    recogRef.current = r;
    r.start(); setListening(true);
    toast.success("🎙️ Falando... (PT-BR)");
  }

  return (
    <section className="glass-strong rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-display neon-text flex items-center gap-2">
          <Globe className="h-5 w-5" /> Website Builder · IA Forge PRO
          <span className="text-[10px] font-mono text-muted-foreground">({sites.length} sites · sem limites)</span>
        </h2>
        <button onClick={() => setNewOpen(!newOpen)} className="glass px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-mono hover-lift glow-purple">
          <Plus className="h-4 w-4" /> Novo site
        </button>
      </div>

      {newOpen && (
        <div className="glass p-4 rounded-xl space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setTemplate(t.id); setPrompt(t.prompt); }}
                className={`glass p-3 rounded-lg text-xs font-mono hover-lift text-left transition ${template === t.id ? "ring-2 ring-[oklch(0.78_0.28_330)] glow-magenta" : ""}`}>
                <div className="text-2xl mb-1">{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Reforços de estilo (clique pra somar)</div>
            <div className="flex flex-wrap gap-1.5">
              {BOOSTS.map(b => (
                <button key={b.label} onClick={() => setPrompt(p => (p ? `${p.trim()} ${b.add}` : b.add))}
                  className="glass px-2.5 py-1 rounded-lg text-[11px] font-mono hover-lift">
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva seu site SEM limites: cores, seções, conteúdo, estilo, qualquer tema, qualquer tamanho..."
              className="w-full glass p-3 pr-12 rounded-lg text-sm min-h-[120px] font-mono" />
            <button onClick={() => toggleVoice("create")} title="Ditar por voz"
              className={`absolute top-2 right-2 glass p-2 rounded ${listening ? "glow-magenta ring-1 ring-[oklch(0.78_0.28_330)]" : ""}`}>
              {listening ? <MicOff className="h-4 w-4 text-[oklch(0.78_0.28_25)]" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          {questions.length > 0 && (
            <div className="glass p-3 rounded-lg space-y-2 border border-[oklch(0.4_0.2_60/0.4)]">
              <div className="text-xs font-display text-[oklch(0.85_0.2_60)] flex items-center gap-1"><HelpCircle className="h-3 w-3" /> A IA quer confirmar antes de gerar:</div>
              {questions.map((q, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-xs font-mono">{i + 1}. {q.q}</div>
                  <div className="flex flex-wrap gap-1">
                    {q.suggestions?.map(s => (
                      <button key={s} onClick={() => setPrompt(p => `${p}\n${q.q} → ${s}`)}
                        className="glass px-2 py-0.5 rounded text-[10px] font-mono hover-lift">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button onClick={askQuestions} disabled={askingQ || !prompt.trim()} className="glass px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-mono hover-lift">
              {askingQ ? <Loader2 className="h-4 w-4 animate-spin" /> : <HelpCircle className="h-4 w-4" />}
              Refinar com perguntas
            </button>
            <button onClick={createSite} disabled={loading} className="glass px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-mono glow-magenta hover-lift">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Gerar com IA (sem limites)
            </button>
            <button onClick={() => { setNewOpen(false); setQuestions([]); }} className="glass px-4 py-2 rounded-lg text-sm font-mono hover-lift">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_320px] gap-4">
        <div className="space-y-2 max-h-[760px] overflow-y-auto pr-1">
          <div className="glass rounded-lg p-2 space-y-2 sticky top-0 z-10 bg-background/80 backdrop-blur">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input value={siteQuery} onChange={(e) => setSiteQuery(e.target.value)} placeholder="buscar site..."
                className="w-full glass pl-7 pr-2 py-1.5 rounded text-xs font-mono" />
            </div>
            <div className="flex gap-1">
              {(["all","live","draft"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 px-2 py-1 rounded text-[10px] font-mono uppercase ${filter === f ? "glow-purple ring-1 ring-[oklch(0.78_0.28_330)]" : "glass"}`}>
                  {f === "all" ? `Todos (${sites.length})` : f === "live" ? `Live (${sites.filter(s=>s.published).length})` : `Draft (${sites.filter(s=>!s.published).length})`}
                </button>
              ))}
            </div>
          </div>
          {filteredSites.length === 0 && <div className="text-xs text-muted-foreground font-mono p-4 text-center">{sites.length === 0 ? "Nenhum site ainda." : "Nada bate com a busca."}</div>}
          {filteredSites.map(s => (
            <div key={s.id} onClick={() => { setActive(s); setChat([]); setShowHistory(false); }}
              className={`glass p-3 rounded-lg cursor-pointer hover-lift transition ${active?.id === s.id ? "ring-2 ring-[oklch(0.78_0.28_330)]" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm truncate">{s.title}</div>
                  <div className="font-mono text-[10px] text-muted-foreground truncate">/{s.slug}</div>
                  <div className="flex gap-2 mt-1 text-[9px] font-mono text-muted-foreground">
                    <span>👁 {s.views}</span>
                    <span>{new Date(s.updated_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {s.published && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.4_0.2_140/0.4)] text-[oklch(0.85_0.18_140)]">LIVE</span>}
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); duplicateSite(s); }} title="Duplicar" className="opacity-50 hover:opacity-100">
                      <Duplicate className="h-3 w-3 text-[oklch(0.78_0.25_60)]" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); remove(s.id); }} title="Excluir" className="opacity-50 hover:opacity-100">
                      <Trash2 className="h-3 w-3 text-[oklch(0.7_0.25_25)]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-xl overflow-hidden flex flex-col min-h-[760px]">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono text-sm">
              ← Selecione um site ou crie um novo
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 p-2 border-b border-border/30 flex-wrap">
                <input value={active.title} onChange={(e) => setActive({ ...active, title: e.target.value })}
                  className="glass px-2 py-1 rounded text-xs font-mono flex-1 min-w-[120px]" />
                <input value={active.slug} onChange={(e) => setActive({ ...active, slug: e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase() })}
                  className="glass px-2 py-1 rounded text-xs font-mono w-32" placeholder="slug" />
                {[
                  { id: "preview" as const, i: Eye, l: "Preview" },
                  { id: "html" as const, i: Layers, l: "HTML" },
                  { id: "css" as const, i: Palette, l: "CSS" },
                  { id: "js" as const, i: Code, l: "JS" },
                  { id: "seo" as const, i: FileText, l: "SEO" },
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`glass px-2 py-1 rounded text-xs font-mono flex items-center gap-1 ${tab === t.id ? "glow-purple ring-1 ring-[oklch(0.78_0.28_330)]" : ""}`}>
                    <t.i className="h-3 w-3" /> {t.l}
                  </button>
                ))}
                <button onClick={() => setVisualEdit(v => !v)} title="Visual Edit: clique no preview pra selecionar"
                  className={`glass px-2 py-1 rounded text-xs font-mono hover-lift flex items-center gap-1 ${visualEdit ? "glow-magenta ring-1 ring-[oklch(0.78_0.28_330)]" : ""}`}>
                  <MousePointer2 className="h-3 w-3" /> VE
                </button>
                <button onClick={insertImageBlock} title="Inserir imagem" className="glass px-2 py-1 rounded text-xs font-mono hover-lift"><ImgIcon className="h-3 w-3" /></button>
                <button onClick={() => setShowHistory(h => !h)} title="Histórico de snapshots" className={`glass px-2 py-1 rounded text-xs font-mono hover-lift ${showHistory ? "glow-magenta ring-1 ring-[oklch(0.78_0.28_330)]" : ""}`}>
                  <History className="h-3 w-3" />
                </button>
                {tab === "preview" && (
                  <div className="flex gap-0.5">
                    <button onClick={() => setDevice("desktop")} className={`glass px-2 py-1 rounded text-xs ${device === "desktop" ? "glow-purple ring-1 ring-[oklch(0.78_0.28_330)]" : ""}`}><Monitor className="h-3 w-3" /></button>
                    <button onClick={() => setDevice("mobile")} className={`glass px-2 py-1 rounded text-xs ${device === "mobile" ? "glow-purple ring-1 ring-[oklch(0.78_0.28_330)]" : ""}`}><Smartphone className="h-3 w-3" /></button>
                  </div>
                )}
                <button onClick={copyCode} title="Copiar HTML" className="glass px-2 py-1 rounded text-xs font-mono hover-lift"><Copy className="h-3 w-3" /></button>
                <button onClick={downloadSite} title="Download .html único" className="glass px-2 py-1 rounded text-xs font-mono hover-lift"><Download className="h-3 w-3" /></button>
                <button onClick={downloadBundle} title="Bundle p/ GitHub (3 arquivos)" className="glass px-2 py-1 rounded text-xs font-mono hover-lift"><Github className="h-3 w-3" /></button>
                <button onClick={regenerate} disabled={loading} title="Regenerar com IA" className="glass px-2 py-1 rounded text-xs font-mono hover-lift">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                </button>
                <button onClick={saveActive} className="glass px-3 py-1 rounded text-xs font-mono hover-lift glow-purple flex items-center gap-1">
                  <Save className="h-3 w-3" /> Salvar
                </button>
                <button onClick={togglePublish} className={`px-3 py-1 rounded text-xs font-mono hover-lift flex items-center gap-1 ${active.published ? "bg-[oklch(0.4_0.2_140/0.4)] text-[oklch(0.85_0.18_140)]" : "glass"}`}>
                  <Globe className="h-3 w-3" /> {active.published ? "Live" : "Publicar"}
                </button>
                {active.published && (
                  <a href={`/s/${active.slug}`} target="_blank" rel="noreferrer" className="glass px-2 py-1 rounded text-xs font-mono hover-lift">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex-1 bg-black/40 overflow-hidden flex p-2 relative">
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                {tab === "preview" && (
                  <div className={`bg-white h-full transition-all ${device === "mobile" ? "w-[390px] rounded-2xl border-4 border-black/60 shadow-2xl" : "w-full"}`}>
                    <iframe ref={iframeRef} title="preview" className="w-full h-full" sandbox="allow-scripts allow-same-origin" />
                  </div>
                )}
                {tab === "html" && <textarea value={active.html} onChange={(e) => setActive({ ...active, html: e.target.value })} className="w-full h-full bg-transparent p-3 font-mono text-xs text-[oklch(0.85_0.18_140)] resize-none outline-none" spellCheck={false} />}
                {tab === "css" && <textarea value={active.css} onChange={(e) => setActive({ ...active, css: e.target.value })} className="w-full h-full bg-transparent p-3 font-mono text-xs text-[oklch(0.85_0.2_295)] resize-none outline-none" spellCheck={false} />}
                {tab === "js" && <textarea value={active.js} onChange={(e) => setActive({ ...active, js: e.target.value })} className="w-full h-full bg-transparent p-3 font-mono text-xs text-[oklch(0.78_0.25_60)] resize-none outline-none" spellCheck={false} />}
                {tab === "seo" && (
                  <div className="w-full h-full overflow-y-auto p-4 space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-muted-foreground">Title (SEO)</label>
                      <input value={active.title} onChange={(e) => setActive({ ...active, title: e.target.value })}
                        className="w-full glass px-2 py-1.5 rounded mt-1" maxLength={60} />
                      <div className="text-[10px] text-muted-foreground mt-0.5">{active.title.length}/60 chars</div>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Meta description</label>
                      <textarea value={active.description ?? ""} onChange={(e) => setActive({ ...active, description: e.target.value })}
                        className="w-full glass px-2 py-1.5 rounded mt-1 min-h-[80px]" maxLength={160} />
                      <div className="text-[10px] text-muted-foreground mt-0.5">{(active.description ?? "").length}/160 chars</div>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Slug · URL</label>
                      <input value={active.slug} onChange={(e) => setActive({ ...active, slug: e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase() })}
                        className="w-full glass px-2 py-1.5 rounded mt-1" />
                      <div className="text-[10px] text-muted-foreground mt-0.5">URL pública: /s/{active.slug}</div>
                    </div>
                    <div className="glass p-3 rounded space-y-2">
                      <div className="text-[oklch(0.78_0.25_330)] flex items-center gap-1"><Sparkles className="h-3 w-3" /> Preview do Google</div>
                      <div className="bg-white text-black p-3 rounded">
                        <div className="text-[#1a0dab] text-base truncate">{active.title}</div>
                        <div className="text-[#006621] text-[11px]">luris.app/s/{active.slug}</div>
                        <div className="text-[#545454] text-xs line-clamp-2">{active.description}</div>
                      </div>
                    </div>
                    <div className="text-muted-foreground">📊 {active.views} visualizações · Template: {active.template}</div>
                  </div>
                )}
                </div>
                {showHistory && active && (
                  <div className="absolute top-0 right-0 h-full w-72 glass-strong border-l border-border/40 overflow-y-auto p-3 space-y-2 z-20">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-display neon-text-magenta">Snapshots</h4>
                      <button onClick={() => setShowHistory(false)} className="text-xs text-muted-foreground">✕</button>
                    </div>
                    {getHistory(active.id).length === 0 && <div className="text-[10px] font-mono text-muted-foreground">Nenhum snapshot ainda.</div>}
                    {getHistory(active.id).map((snap, i) => (
                      <button key={i} onClick={() => restoreSnapshot(snap)} className="w-full glass p-2 rounded text-left hover-lift">
                        <div className="text-[10px] font-mono text-[oklch(0.78_0.25_330)]">{new Date(snap.at).toLocaleString("pt-BR")}</div>
                        <div className="text-[11px] font-mono truncate">{snap.label}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Chat para editar */}
        <div className="glass rounded-xl flex flex-col min-h-[760px] overflow-hidden">
          <button onClick={() => setChatOpen(!chatOpen)} className="flex items-center gap-2 p-3 border-b border-border/30 text-sm font-display neon-text-magenta">
            <MessageSquare className="h-4 w-4" /> Chat AI Edit {chatOpen ? "▾" : "▸"}
          </button>
          {chatOpen && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs font-mono">
                {!active && <div className="text-muted-foreground text-center py-8">Selecione um site para editar via chat</div>}
                {active && chat.length === 0 && (
                  <div className="space-y-2">
                    <div className="text-muted-foreground">💡 Diga o que mudar (texto ou voz):</div>
                    {[
                      "Trocar a cor primária para roxo neon",
                      "Adicionar uma seção de depoimentos com 3 cards",
                      "Adicionar botão de WhatsApp flutuante",
                      "Trocar o hero por um vídeo de fundo",
                      "Adicionar dark mode toggle no header",
                    ].map(s => (
                      <button key={s} onClick={() => setChatInput(s)} className="block w-full text-left glass p-2 rounded hover-lift text-[11px]">→ {s}</button>
                    ))}
                  </div>
                )}
                {chat.map((m, i) => (
                  <div key={i} className={`p-2 rounded-lg ${m.role === "user" ? "bg-[oklch(0.3_0.2_295/0.3)] ml-4" : "bg-[oklch(0.25_0.15_140/0.2)] mr-4 text-[oklch(0.85_0.18_140)]"}`}>
                    <div className="text-[9px] uppercase opacity-60 mb-1">{m.role === "user" ? "Você" : "Luris"}</div>
                    {m.text}
                  </div>
                ))}
                {editing && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Editando ao vivo...</div>}
              </div>
              <div className="border-t border-border/30 p-2 flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatEdit(); } }}
                  placeholder={active ? "Ex: deixa o header sticky e roxo (sem limites)" : "Selecione um site"}
                  disabled={!active || editing}
                  className="flex-1 glass p-2 rounded text-xs font-mono resize-none min-h-[60px]"
                />
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggleVoice("chat")} disabled={!active} title="Voz"
                    className={`glass px-3 py-2 rounded hover-lift disabled:opacity-40 ${listening ? "glow-magenta ring-1 ring-[oklch(0.78_0.28_330)]" : ""}`}>
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button onClick={sendChatEdit} disabled={!active || editing || !chatInput.trim()}
                    className="glass px-3 py-2 rounded glow-magenta hover-lift disabled:opacity-40">
                    {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
