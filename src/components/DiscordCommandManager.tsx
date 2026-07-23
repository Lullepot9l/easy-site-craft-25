import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listCommands, upsertCommand, deleteCommand, toggleCommand,
  importPresets, syncCommandsToDiscord, saveInteractionsConfig,
  listCommandLogs, clearCommandLogs,
} from "@/lib/discord-commands.functions";
import { COMMAND_PRESETS, COMMAND_CATEGORIES } from "@/lib/discord-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search, Plus, Trash2, Save, RefreshCw, Download, Upload,
  Star, Terminal, ShieldCheck, ChevronDown, ChevronRight,
} from "lucide-react";

type Cmd = any;

export function DiscordCommandManager() {
  const [cmds, setCmds] = useState<Cmd[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Cmd | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [pubKey, setPubKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [token, setToken] = useState("");
  const [appId, setAppId] = useState("");
  const [guildId, setGuildId] = useState("");

  const list = useServerFn(listCommands);
  const save = useServerFn(upsertCommand);
  const del = useServerFn(deleteCommand);
  const tog = useServerFn(toggleCommand);
  const imp = useServerFn(importPresets);
  const sync = useServerFn(syncCommandsToDiscord);
  const saveCfg = useServerFn(saveInteractionsConfig);
  const getLogs = useServerFn(listCommandLogs);
  const clrLogs = useServerFn(clearCommandLogs);

  async function refresh() {
    setLoading(true);
    try { setCmds(await list()); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("owner_discord_config").select("*").limit(1).maybeSingle();
      if (data) {
        setPubKey(data.public_key || "");
        setEndpoint(data.interactions_endpoint || "");
        setToken(data.bot_token || "");
        setAppId(data.client_id || "");
        setGuildId(data.guild_id || "");
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return cmds.filter((c) => {
      if (cat !== "all" && c.category !== cat) return false;
      if (q && !`${c.name} ${c.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [cmds, q, cat]);

  const grouped = useMemo(() => {
    const g: Record<string, Cmd[]> = {};
    for (const c of filtered) { (g[c.category] ||= []).push(c); }
    return g;
  }, [filtered]);

  async function importAll() {
    try {
      const r = await imp({ data: { presets: COMMAND_PRESETS as any, scope: "guild", guild_id: guildId || null } });
      toast.success(`${r.count} comandos importados.`);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  async function importCat(category: string) {
    const presets = COMMAND_PRESETS.filter((p) => p.category === category);
    try {
      const r = await imp({ data: { presets: presets as any, scope: "guild", guild_id: guildId || null } });
      toast.success(`${r.count} comandos da categoria ${category} importados.`);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  async function syncAll() {
    if (!token || !appId) return toast.error("Configure token e Application ID na aba Configuração.");
    try {
      const r = await sync({ data: { token, applicationId: appId, guildId: guildId || undefined } });
      toast.success(`${r.synced} comandos sincronizados no Discord.`);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  async function saveInteractions() {
    if (!pubKey) return toast.error("Cole a Public Key da aplicação Discord.");
    try {
      await saveCfg({ data: { public_key: pubKey, interactions_endpoint: endpoint || null } });
      toast.success("Interactions configurado. Cole a URL no portal Discord.");
    } catch (e: any) { toast.error(e.message); }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(cmds, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "luris-discord-commands.json"; a.click();
    URL.revokeObjectURL(url);
  }

  async function refreshLogs() {
    try { setLogs(await getLogs({ data: { limit: 100 } })); } catch (e: any) { toast.error(e.message); }
  }

  const interactionsUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/public/discord/interactions`
    : "/api/public/discord/interactions";

  return (
    <div className="glass-strong rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Terminal className="h-6 w-6 text-[oklch(0.78_0.28_330)]" />
        <h2 className="text-2xl font-display neon-text-magenta">Slash Commands · Profissional</h2>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="presets">Presets ({COMMAND_PRESETS.length})</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="interactions">Interactions (fix erro)</TabsTrigger>
          <TabsTrigger value="logs" onClick={refreshLogs}>Logs</TabsTrigger>
        </TabsList>

        {/* CATALOG */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar comando..." className="pl-9" />
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)}
              className="bg-background border border-border rounded px-3 py-2 text-sm">
              <option value="all">Todas categorias</option>
              {COMMAND_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
            <Button size="sm" variant="outline" onClick={exportJson}>
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
            <Button size="sm" onClick={syncAll}>
              <Upload className="h-4 w-4 mr-1" /> Sincronizar no Discord
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setEditing({ name: "", description: "", category: "geral", response_content: "", response_type: "text" }); }}>
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </div>

          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum comando ainda. Vá em <b>Presets</b> e importe o catálogo profissional.
            </div>
          )}

          {Object.entries(grouped).map(([category, arr]) => (
            <details key={category} open className="rounded-lg border border-border/60 bg-background/30">
              <summary className="cursor-pointer px-4 py-2 font-mono text-sm flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                <span className="text-[oklch(0.78_0.28_330)]">{category}</span>
                <Badge variant="secondary">{arr.length}</Badge>
              </summary>
              <div className="grid gap-2 p-3">
                {arr.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded border border-border/40 hover:border-border">
                    <Switch checked={c.enabled} onCheckedChange={async (v) => {
                      await tog({ data: { id: c.id, enabled: v } }); refresh();
                    }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">
                        /{c.name}
                        {Array.isArray(c.subcommands) && c.subcommands.length > 0 && (
                          <span className="text-muted-foreground text-xs ml-2">
                            +{c.subcommands.length} sub
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{c.description}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{c.usage_count ?? 0} usos</Badge>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      if (confirm(`Excluir /${c.name}?`)) { await del({ data: { id: c.id } }); refresh(); }
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </TabsContent>

        {/* PRESETS */}
        <TabsContent value="presets" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Catálogo profissional com <b>{COMMAND_PRESETS.length}</b> comandos, estilo MEE6/Carl-bot/Dyno.
            </p>
            <Button onClick={importAll}>
              <Plus className="h-4 w-4 mr-1" /> Importar todos ({COMMAND_PRESETS.length})
            </Button>
          </div>
          <div className="grid gap-2">
            {COMMAND_CATEGORIES.map((category) => {
              const arr = COMMAND_PRESETS.filter((p) => p.category === category);
              if (arr.length === 0) return null;
              return (
                <div key={category} className="p-3 rounded border border-border/40 bg-background/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-sm text-[oklch(0.78_0.28_330)]">
                      {category} <Badge variant="secondary" className="ml-2">{arr.length}</Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => importCat(category)}>Importar</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {arr.map((p) => (
                      <Badge key={p.name} variant="outline" className="text-[10px] font-mono">/{p.name}</Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* EDITOR */}
        <TabsContent value="editor" className="space-y-3">
          {!editing ? (
            <p className="text-sm text-muted-foreground">
              Selecione um comando no catálogo ou clique em <b>Novo</b>.
            </p>
          ) : (
            <div className="grid gap-3 max-w-2xl">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Nome</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Tipo de resposta</Label>
                  <select value={editing.response_type ?? "text"}
                    onChange={(e) => setEditing({ ...editing, response_type: e.target.value })}
                    className="w-full bg-background border border-border rounded px-2 py-2 text-sm">
                    <option value="text">Texto</option>
                    <option value="embed">Embed</option>
                    <option value="ai">IA</option>
                  </select>
                </div>
                <div>
                  <Label>Cooldown (s)</Label>
                  <Input type="number" value={editing.cooldown_seconds ?? 0}
                    onChange={(e) => setEditing({ ...editing, cooldown_seconds: Number(e.target.value) })} />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={!!editing.ephemeral}
                      onCheckedChange={(v) => setEditing({ ...editing, ephemeral: v })} />
                    Ephemeral
                  </label>
                </div>
              </div>
              <div>
                <Label>Conteúdo da resposta</Label>
                <Textarea rows={4} value={editing.response_content ?? ""}
                  onChange={(e) => setEditing({ ...editing, response_content: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Cargos permitidos (IDs, vírgula)</Label>
                  <Input value={(editing.allowed_roles || []).join(",")}
                    onChange={(e) => setEditing({ ...editing, allowed_roles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </div>
                <div>
                  <Label>Canais permitidos</Label>
                  <Input value={(editing.allowed_channels || []).join(",")}
                    onChange={(e) => setEditing({ ...editing, allowed_channels: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </div>
                <div>
                  <Label>Usuários permitidos</Label>
                  <Input value={(editing.allowed_users || []).join(",")}
                    onChange={(e) => setEditing({ ...editing, allowed_users: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={async () => {
                  try {
                    await save({ data: editing });
                    toast.success("Comando salvo.");
                    setEditing(null); refresh();
                  } catch (e: any) { toast.error(e.message); }
                }}>
                  <Save className="h-4 w-4 mr-1" /> Salvar
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* INTERACTIONS */}
        <TabsContent value="interactions" className="space-y-4">
          <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/10 text-sm">
            <b>⚠️ Erro "O aplicativo não respondeu"?</b> Discord precisa saber onde enviar as interações.
            Configure o Interactions Endpoint URL no portal Discord e cole aqui a Public Key da aplicação.
          </div>

          <div>
            <Label>Interactions Endpoint URL (cole no portal Discord)</Label>
            <div className="flex gap-2">
              <Input value={interactionsUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(interactionsUrl); toast.success("Copiado!"); }}>
                Copiar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              → Discord Developer Portal → Sua aplicação → <b>General Information</b> → <b>Interactions Endpoint URL</b>.
            </p>
          </div>

          <div>
            <Label>Public Key da aplicação (Discord Portal → General Information)</Label>
            <Input value={pubKey} onChange={(e) => setPubKey(e.target.value)} placeholder="cole a Public Key hex..." className="font-mono text-xs" />
          </div>

          <Button onClick={saveInteractions}>
            <ShieldCheck className="h-4 w-4 mr-1" /> Salvar Public Key
          </Button>

          <div className="p-4 rounded-lg border border-border/50 text-xs font-mono space-y-1">
            <div><b>Passo 1:</b> Cole a URL acima no campo "Interactions Endpoint URL" no portal Discord.</div>
            <div><b>Passo 2:</b> Copie a Public Key da mesma tela e cole aqui.</div>
            <div><b>Passo 3:</b> Salve. Discord vai fazer um PING → se sua Public Key estiver certa, ele aceita.</div>
            <div><b>Passo 4:</b> Volte em Catálogo → clique "Sincronizar no Discord" para registrar os comandos.</div>
            <div><b>Passo 5:</b> Teste no Discord — o comando responde direto por HTTP, sem bot 24/7.</div>
          </div>
        </TabsContent>

        {/* LOGS */}
        <TabsContent value="logs" className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refreshLogs}>
              <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
            <Button size="sm" variant="outline" onClick={async () => {
              if (confirm("Limpar todos os logs?")) { await clrLogs(); refreshLogs(); }
            }}>
              <Trash2 className="h-4 w-4 mr-1" /> Limpar
            </Button>
          </div>
          <div className="rounded-lg border border-border/40 divide-y divide-border/40 max-h-[500px] overflow-auto">
            {logs.length === 0 && <div className="p-4 text-sm text-muted-foreground">Sem logs ainda.</div>}
            {logs.map((l) => (
              <div key={l.id} className="p-2 text-xs flex items-center gap-3 font-mono">
                <span className={l.success ? "text-green-400" : "text-red-400"}>●</span>
                <span className="text-muted-foreground w-40 shrink-0">{new Date(l.created_at).toLocaleString()}</span>
                <span className="w-40 shrink-0 truncate">/{l.command_name}</span>
                <span className="text-muted-foreground truncate flex-1">{l.username} · {l.guild_id}</span>
                <span className="text-muted-foreground">{l.latency_ms}ms</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
