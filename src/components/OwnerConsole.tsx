import { useEffect, useRef, useState } from "react";
import { Terminal, Plus, Trash2, Play, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";

type LogLine = { t: number; level: "in" | "out" | "err" | "sys"; text: string };
type CustomCmd = { name: string; desc: string; script: string };

const CMD_STORE = "luris.owner.console.cmds";
const HIST_STORE = "luris.owner.console.hist";

const BUILTINS: { name: string; desc: string }[] = [
  { name: "help", desc: "Lista todos comandos" },
  { name: "clear", desc: "Limpa o console" },
  { name: "whoami", desc: "Mostra sua identidade + role" },
  { name: "stats", desc: "Conta linhas das tabelas principais" },
  { name: "users [query]", desc: "Lista usuários (filtra por nome)" },
  { name: "role <user_id> <role>", desc: "Muda cargo (user|premium|admin|owner)" },
  { name: "coins <user_id> <delta>", desc: "Ajusta coins do usuário (+/-)" },
  { name: "xp <user_id> <delta>", desc: "Ajusta XP" },
  { name: "log <event>", desc: "Insere evento custom em system_logs" },
  { name: "logs [n]", desc: "Mostra últimos N logs (default 20)" },
  { name: "broadcast <msg>", desc: "Toast global pra todo mundo (via log)" },
  { name: "feature <phase> <id> on|off", desc: "Liga/desliga feature local" },
  { name: "theme dragon|matrix|cinema|reset", desc: "Tema visual instantâneo" },
  { name: "echo <texto>", desc: "Repete texto" },
  { name: "cmd add <nome> <script>", desc: "Cria comando custom" },
  { name: "cmd list / cmd del <nome>", desc: "Gerencia custom commands" },
];

export function OwnerConsole() {
  const { user, profile, role } = useAuth();
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<LogLine[]>([
    { t: Date.now(), level: "sys", text: "LURIS Console v1.0 · digite 'help'" },
  ]);
  const [custom, setCustom] = useState<CustomCmd[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [showCmds, setShowCmds] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setCustom(JSON.parse(localStorage.getItem(CMD_STORE) ?? "[]")); } catch { /* */ }
    try { setHistory(JSON.parse(localStorage.getItem(HIST_STORE) ?? "[]")); } catch { /* */ }
  }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }); }, [lines]);

  function push(level: LogLine["level"], text: string) {
    setLines(l => [...l, { t: Date.now(), level, text }]);
  }
  function saveCustom(next: CustomCmd[]) {
    setCustom(next);
    localStorage.setItem(CMD_STORE, JSON.stringify(next));
  }

  async function run(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    push("in", `$ ${cmd}`);
    const next = [cmd, ...history.filter(h => h !== cmd)].slice(0, 50);
    setHistory(next); setHistIdx(-1);
    localStorage.setItem(HIST_STORE, JSON.stringify(next));
    try { await exec(cmd); } catch (e) { push("err", String(e instanceof Error ? e.message : e)); }
  }

  async function exec(cmd: string) {
    const [head, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");

    // custom command?
    const c = custom.find(x => x.name === head);
    if (c) { for (const line of c.script.split("\n").map(s => s.trim()).filter(Boolean)) await exec(line); return; }

    switch (head) {
      case "help": {
        push("out", "═══ BUILTINS ═══");
        BUILTINS.forEach(b => push("out", `  ${b.name.padEnd(32)} ${b.desc}`));
        if (custom.length) {
          push("out", "═══ CUSTOM ═══");
          custom.forEach(c => push("out", `  ${c.name.padEnd(32)} ${c.desc}`));
        }
        return;
      }
      case "clear": setLines([]); return;
      case "echo": push("out", arg); return;
      case "whoami":
        push("out", `id:    ${user?.id ?? "-"}`);
        push("out", `name:  ${profile?.display_name ?? "-"}`);
        push("out", `role:  ${role}`);
        return;
      case "stats": {
        const [u, p, i, m, c, w] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("social_posts").select("id", { count: "exact", head: true }),
          supabase.from("generated_images").select("id", { count: "exact", head: true }),
          supabase.from("messages").select("id", { count: "exact", head: true }),
          supabase.from("conversations").select("id", { count: "exact", head: true }),
          supabase.from("websites").select("id", { count: "exact", head: true }),
        ]);
        push("out", `users:         ${u.count ?? 0}`);
        push("out", `posts:         ${p.count ?? 0}`);
        push("out", `images:        ${i.count ?? 0}`);
        push("out", `messages:      ${m.count ?? 0}`);
        push("out", `conversations: ${c.count ?? 0}`);
        push("out", `websites:      ${w.count ?? 0}`);
        return;
      }
      case "users": {
        const q = supabase.from("profiles").select("id, display_name, username, xp, coins").limit(30);
        const { data, error } = arg ? await q.or(`display_name.ilike.%${arg}%,username.ilike.%${arg}%`) : await q;
        if (error) return push("err", error.message);
        (data ?? []).forEach(u => push("out", `${u.id.slice(0,8)}  ${(u.display_name ?? "-").padEnd(20)} xp:${u.xp} coins:${u.coins}`));
        push("sys", `${data?.length ?? 0} resultado(s)`);
        return;
      }
      case "role": {
        const [uid, r] = rest;
        if (!uid || !r) return push("err", "uso: role <user_id> <role>");
        if (!["user","premium","admin","owner"].includes(r)) return push("err", "role inválido");
        await supabase.from("user_roles").delete().eq("user_id", uid);
        const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: r as AppRole });
        if (error) return push("err", error.message);
        await supabase.from("system_logs").insert({ event: `console:role:${r}`, user_id: uid });
        push("out", `✓ ${uid.slice(0,8)} → ${r}`); return;
      }
      case "coins":
      case "xp": {
        const [uid, deltaStr] = rest;
        const delta = parseInt(deltaStr ?? "", 10);
        if (!uid || Number.isNaN(delta)) return push("err", `uso: ${head} <user_id> <delta>`);
        const col = head as "coins" | "xp";
        const { data: p } = await supabase.from("profiles").select(col).eq("id", uid).maybeSingle();
        const cur = (p as { coins?: number; xp?: number } | null)?.[col] ?? 0;
        const patch = col === "coins" ? { coins: cur + delta } : { xp: cur + delta };
        const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
        if (error) return push("err", error.message);
        push("out", `✓ ${col}: ${cur} → ${cur + delta}`); return;
      }
      case "log": {
        if (!arg) return push("err", "uso: log <event>");
        await supabase.from("system_logs").insert({ event: arg, user_id: user?.id ?? null });
        push("out", "✓ log inserido"); return;
      }
      case "logs": {
        const n = Math.min(100, Math.max(1, parseInt(arg, 10) || 20));
        const { data } = await supabase.from("system_logs").select("event, created_at, user_id").order("created_at", { ascending: false }).limit(n);
        (data ?? []).forEach(l => push("out", `${new Date(l.created_at).toLocaleTimeString()} ${l.event} ${l.user_id?.slice(0,8) ?? ""}`));
        return;
      }
      case "broadcast": {
        if (!arg) return push("err", "uso: broadcast <msg>");
        await supabase.from("system_logs").insert({ event: `BROADCAST:${arg}`, user_id: user?.id ?? null });
        toast.success(`📢 ${arg}`); push("out", "✓ enviado"); return;
      }
      case "feature": {
        const [phase, id, state] = rest;
        if (!phase || !id || !state) return push("err", "uso: feature <phase> <id> on|off");
        const key = `luris.owner.phase${phase}`;
        const cur = new Set<string>(JSON.parse(localStorage.getItem(key) ?? "[]"));
        if (state === "on") cur.add(id); else cur.delete(id);
        localStorage.setItem(key, JSON.stringify([...cur]));
        push("out", `✓ phase${phase} ${id} ${state}`); return;
      }
      case "theme": {
        document.body.classList.remove("dragon-kingdom","matrix-view","cinema-hud","thermal-skin");
        if (arg === "dragon") document.body.classList.add("dragon-kingdom");
        else if (arg === "matrix") document.body.classList.add("matrix-view");
        else if (arg === "cinema") document.body.classList.add("cinema-hud");
        else if (arg !== "reset") return push("err", "tema: dragon|matrix|cinema|reset");
        push("out", `✓ tema → ${arg}`); return;
      }
      case "cmd": {
        const [sub, name, ...scriptParts] = rest;
        if (sub === "list") { custom.forEach(c => push("out", `${c.name}: ${c.desc}`)); if (!custom.length) push("sys","(vazio)"); return; }
        if (sub === "del" && name) { saveCustom(custom.filter(c => c.name !== name)); push("out", `✓ removido ${name}`); return; }
        if (sub === "add" && name && scriptParts.length) {
          const script = scriptParts.join(" ").replace(/;/g, "\n");
          saveCustom([...custom.filter(c => c.name !== name), { name, desc: "custom", script }]);
          push("out", `✓ comando '${name}' criado (use ; para separar linhas)`); return;
        }
        return push("err", "uso: cmd add <nome> <linha1>;<linha2>  |  cmd list  |  cmd del <nome>");
      }
      default:
        push("err", `comando desconhecido: ${head} (digite 'help')`);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { run(input); setInput(""); }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      const ni = Math.min(history.length - 1, histIdx + 1);
      if (history[ni]) { setHistIdx(ni); setInput(history[ni]); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const ni = Math.max(-1, histIdx - 1);
      setHistIdx(ni); setInput(ni === -1 ? "" : history[ni]);
    }
  }

  // form pra criar custom command via UI
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newScript, setNewScript] = useState("");
  function addCustom() {
    if (!newName.trim() || !newScript.trim()) return toast.error("Nome e script obrigatórios");
    saveCustom([...custom.filter(c => c.name !== newName.trim()), { name: newName.trim(), desc: newDesc || "custom", script: newScript }]);
    toast.success(`Comando '${newName}' criado`);
    setNewName(""); setNewDesc(""); setNewScript("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm font-display neon-text">
          <Terminal className="h-4 w-4" /> Owner Console · execução direta
        </div>
        <button onClick={() => setShowCmds(s => !s)} className="glass px-3 py-1.5 rounded text-xs font-mono hover-lift">
          {showCmds ? "Esconder" : "Criar comando custom"}
        </button>
      </div>

      {showCmds && (
        <div className="glass p-3 rounded-lg space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value.replace(/\s+/g, "_"))} placeholder="nome (ex: nuke)" className="glass px-2 py-1.5 rounded text-xs font-mono" />
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="descrição curta" className="glass px-2 py-1.5 rounded text-xs font-mono" />
            <button onClick={addCustom} className="glass px-3 py-1.5 rounded text-xs font-mono hover-lift glow-magenta flex items-center justify-center gap-1">
              <Save className="h-3 w-3" /> Salvar
            </button>
          </div>
          <textarea value={newScript} onChange={(e) => setNewScript(e.target.value)}
            placeholder={"Uma linha por comando. Ex:\nlog reset_pack\ncoins SEU_UUID 5000\ntheme dragon"}
            className="w-full glass p-2 rounded text-xs font-mono min-h-[100px]" />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[10px] font-mono text-muted-foreground">Custom existentes:</div>
            {custom.length === 0 && <span className="text-[10px] text-muted-foreground">(nenhum)</span>}
            {custom.map(c => (
              <div key={c.name} className="glass px-2 py-1 rounded flex items-center gap-1 text-[10px] font-mono">
                <Play className="h-3 w-3 text-[oklch(0.85_0.18_140)] cursor-pointer" onClick={() => run(c.name)} />
                <span>{c.name}</span>
                <Trash2 className="h-3 w-3 text-[oklch(0.7_0.25_25)] cursor-pointer" onClick={() => saveCustom(custom.filter(x => x.name !== c.name))} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-black/80 border border-[oklch(0.4_0.2_140/0.4)] rounded-lg overflow-hidden">
        <div ref={scrollRef} className="h-72 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
          {lines.map((l, i) => (
            <div key={i} className={
              l.level === "in"  ? "text-[oklch(0.85_0.2_295)]" :
              l.level === "err" ? "text-[oklch(0.78_0.28_25)]"  :
              l.level === "sys" ? "text-[oklch(0.7_0.15_60)]"   :
                                  "text-[oklch(0.85_0.18_140)]"
            }>
              {l.text}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-[oklch(0.4_0.2_140/0.4)] p-2 bg-black/60">
          <span className="text-[oklch(0.78_0.28_330)] font-mono text-xs">luris@owner ~$</span>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
            spellCheck={false} autoComplete="off" placeholder="digite um comando (help)"
            className="flex-1 bg-transparent outline-none font-mono text-xs text-[oklch(0.92_0.05_295)]" />
        </div>
      </div>
      <div className="text-[10px] font-mono text-muted-foreground flex gap-3 flex-wrap">
        <span>↑↓ histórico</span>
        <span>Enter executa</span>
        <span>Comandos custom: salvos no seu device</span>
      </div>
    </div>
  );
}
