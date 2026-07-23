import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "pt" | "en";
type Dict = Record<string, { pt: string; en: string }>;

const dict: Dict = {
  "nav.dashboard": { pt: "Dashboard", en: "Dashboard" },
  "nav.chat": { pt: "Chat IA", en: "AI Chat" },
  "nav.images": { pt: "Imagens IA", en: "AI Images" },
  "nav.social": { pt: "Social Hub", en: "Social Hub" },
  "nav.marketplace": { pt: "Marketplace", en: "Marketplace" },
  "nav.scriptforge": { pt: "Script Forge", en: "Script Forge" },
  "nav.roblox": { pt: "Roblox Nexus", en: "Roblox Nexus" },
  "nav.premium": { pt: "Premium", en: "Premium" },
  "nav.owner": { pt: "Painel Owner", en: "Owner Panel" },
  "nav.export": { pt: "Exportar Prompt", en: "Export Prompt" },
  "nav.logout": { pt: "Sair", en: "Logout" },
  "landing.title": { pt: "Bem-vindo ao futuro", en: "Welcome to the future" },
  "landing.cta": { pt: "Iniciar LURIS", en: "Launch LURIS" },
  "landing.tag": { pt: "Plataforma IA Cyberpunk Premium", en: "Cyberpunk Premium AI Platform" },
  "auth.login": { pt: "Entrar", en: "Sign in" },
  "auth.signup": { pt: "Cadastrar", en: "Sign up" },
  "auth.email": { pt: "E-mail", en: "Email" },
  "auth.password": { pt: "Senha", en: "Password" },
  "auth.google": { pt: "Continuar com Google", en: "Continue with Google" },
  "price.monthly": { pt: "/mês", en: "/mo" },
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  currency: "BRL" | "USD";
  formatPrice: (brl: number) => string;
  /** Formata um valor em LuCoin (moeda interna da Luris). */
  formatCoins: (coins: number) => string;
}

const I18nCtx = createContext<Ctx | null>(null);
const USD_RATE = 0.18;

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("luris-lang")) as Lang | null;
    if (saved === "pt" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("luris-lang", l);
  };
  const t = (k: string) => dict[k]?.[lang] ?? k;
  const currency: "BRL" | "USD" = lang === "pt" ? "BRL" : "USD";
  const formatPrice = (brl: number) => {
    if (currency === "BRL") return `R$ ${brl.toFixed(2).replace(".", ",")}`;
    return `$ ${(brl * USD_RATE).toFixed(2)}`;
  };
  const formatCoins = (c: number) => `${c.toLocaleString(lang === "pt" ? "pt-BR" : "en-US")} 🪙 LuCoin`;
  return <I18nCtx.Provider value={{ lang, setLang, t, currency, formatPrice, formatCoins }}>{children}</I18nCtx.Provider>;
}


export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
}
