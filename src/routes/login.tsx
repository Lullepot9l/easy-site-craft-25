import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { CyberBackground } from "@/components/CyberBackground";
import { LurisLogo } from "@/components/LurisLogo";


export const Route = createFileRoute("/login")({ component: LoginPage });

const REMEMBER_KEY = "luris.remember";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // Pré-preenche e-mail se "lembrar de mim" foi marcado antes
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) { setEmail(saved); setRemember(true); }
    // guarda o código de convite (?invite=XXXX) pra resgatar depois do login
    const code = new URLSearchParams(window.location.search).get("invite");
    if (code) localStorage.setItem("luris.invite", code.toUpperCase());
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Conta criada!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta 🌑");
      }
      if (remember) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setLoading(false); }
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (res.error) toast.error("Erro Google: " + (res.error as Error).message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <CyberBackground />
      <div className="w-full max-w-md glass-strong rounded-2xl p-8 glow-purple relative z-10 animate-fade-in-up">
        <Link to="/" className="flex justify-center mb-6"><LurisLogo /></Link>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode("login")} className={`flex-1 py-2 rounded-lg font-display text-sm ${mode==="login" ? "btn-neon" : "glass"}`}>Entrar</button>
          <button onClick={() => setMode("signup")} className={`flex-1 py-2 rounded-lg font-display text-sm ${mode==="signup" ? "btn-neon" : "glass"}`}>Cadastrar</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input type="email" required placeholder="E-mail" value={email} onChange={(e)=>setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[oklch(0.12_0.04_285)] border border-[oklch(0.5_0.15_295/0.3)] focus:border-[oklch(0.7_0.28_295)] outline-none font-mono text-sm" />
          <input type="password" required minLength={6} placeholder="Senha" value={password} onChange={(e)=>setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[oklch(0.12_0.04_285)] border border-[oklch(0.5_0.15_295/0.3)] focus:border-[oklch(0.7_0.28_295)] outline-none font-mono text-sm" />

          <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)}
              className="accent-[oklch(0.7_0.28_295)] w-4 h-4" />
            Lembrar de mim neste dispositivo
          </label>

          <button type="submit" disabled={loading} className="w-full py-3 btn-neon rounded-lg font-display disabled:opacity-50">
            {loading ? "..." : (mode === "login" ? "ENTRAR" : "CRIAR CONTA")}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> OU <div className="flex-1 h-px bg-border" />
        </div>

        <button onClick={google} className="w-full py-3 rounded-lg glass hover-lift font-display text-sm">
          🌐 Continuar com Google
        </button>

        <p className="mt-6 text-[11px] text-muted-foreground text-center font-mono">
          🌑 LURIS · acesso restrito
        </p>

      </div>
    </div>
  );
}
