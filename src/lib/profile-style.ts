/** Opções visuais e de status do perfil (compartilhado entre Configurações e Perfil). */

export const NAME_COLORS = [
  { value: "gradient", label: "Gradiente Luris", className: "gradient-text" },
  { value: "magenta", label: "Magenta Néon", className: "neon-text-magenta" },
  { value: "cyan", label: "Ciano Néon", className: "neon-text-cyan" },
  { value: "rainbow", label: "Arco-Íris Animado", className: "name-rainbow" },
  { value: "gold", label: "Ouro", className: "name-gold" },
  { value: "blood", label: "Sangue", className: "name-blood" },
  { value: "ice", label: "Gelo", className: "name-ice" },
  { value: "toxic", label: "Tóxico", className: "name-toxic" },
  { value: "aurora", label: "Aurora Animada", className: "name-aurora" },
  { value: "candy", label: "Candy", className: "name-candy" },
  { value: "chrome", label: "Cromado", className: "name-chrome" },
  { value: "matrix", label: "Matrix", className: "name-matrix" },
  { value: "void", label: "Vazio", className: "name-void" },
  { value: "sunset", label: "Sunset", className: "name-sunset" },
  { value: "holo", label: "Holográfico", className: "name-holo" },
  { value: "outline", label: "Contorno Néon", className: "name-outline" },
  { value: "soft", label: "Branco Suave", className: "text-[oklch(0.96_0.02_295)]" },
] as const;

export const NAME_FONTS = [
  { value: "display", label: "Cyber (Orbitron)", className: "font-display" },
  { value: "audiowide", label: "Audiowide", className: "font-audiowide" },
  { value: "unica", label: "Unica One", className: "font-unica" },
  { value: "cinzel", label: "Cinzel (Real)", className: "font-cinzel" },
  { value: "pacifico", label: "Pacifico (Fofo)", className: "font-pacifico" },
  { value: "vibes", label: "Great Vibes (Elegante)", className: "font-vibes" },
  { value: "press", label: "Pixel Retro", className: "font-press" },
  { value: "wide", label: "Cyber Largo", className: "font-wide" },
  { value: "tinycaps", label: "Small Caps", className: "font-tiny-caps" },
  { value: "mono", label: "Mono", className: "font-mono" },
  { value: "soft", label: "Soft", className: "font-body" },
] as const;

export const PROFILE_THEMES = [
  { value: "neon", label: "Neon Roxo" },
  { value: "nightberry", label: "Nightberry" },
  { value: "sakura", label: "Sakura" },
  { value: "galaxy", label: "Galáxia" },
  { value: "cyber", label: "Cyber Ciano" },
  { value: "gold", label: "Ouro" },
  { value: "blood", label: "Sangue" },
  { value: "mint", label: "Menta" },
  { value: "matrix", label: "Matrix" },
  { value: "ocean", label: "Oceano" },
  { value: "royal", label: "Real" },
  { value: "inferno", label: "Inferno" },
  { value: "lavender", label: "Lavanda" },
  { value: "void", label: "Vazio" },
  { value: "aurora", label: "Aurora" },
  { value: "candy", label: "Candy" },
] as const;

/** Valores antigos/errados salvos no marketplace → valor válido equivalente. */
const ALIASES: Record<string, string> = {
  nightberry: "pacifico", // fonte "nightberry" nunca existiu em NAME_FONTS
  berry: "pacifico",
  cyber: "wide",
};

/**
 * Garante que o valor salvo no perfil exista na lista de opções.
 * Sem isso, itens do marketplace com valor inválido eram "equipados"
 * (gastando LuCoins) sem alterar nada na tela.
 */
export function normalizeStyleValue(
  options: readonly { value: string }[],
  value?: string | null,
): string | null {
  if (value && options.some((o) => o.value === value)) return value;
  const alias = value ? ALIASES[value] : undefined;
  if (alias && options.some((o) => o.value === alias)) return alias;
  return null;
}

/** Status de atividade — escolha, não texto livre. */
export const ACTIVITY_STATUS = [
  { value: "online", label: "🟢 Online", dot: "oklch(0.75 0.2 145)" },
  { value: "ausente", label: "🌙 Ausente", dot: "oklch(0.8 0.18 85)" },
  { value: "ocupado", label: "⛔ Ocupado", dot: "oklch(0.65 0.24 25)" },
] as const;

export function statusMeta(value?: string | null) {
  return ACTIVITY_STATUS.find((s) => s.value === value) ?? ACTIVITY_STATUS[0];
}

/** Catálogo de jogos usado no seletor e na detecção automática. */
export const GAME_CATALOG = [
  "ROBLOX", "Valorant", "Minecraft", "Fortnite", "League of Legends", "CS2",
  "GTA V", "Free Fire", "Genshin Impact", "Rocket League", "Among Us",
  "Apex Legends", "Overwatch 2", "Terraria", "Stardew Valley", "The Sims 4",
  "Elden Ring", "Dota 2", "PUBG", "Discord (conversando)",
] as const;

export function optionClass(
  options: readonly { value: string; className: string }[],
  value?: string | null,
) {
  return options.find((o) => o.value === value)?.className ?? options[0].className;
}

type DesktopBridge = { getCurrentGame?: () => Promise<string | null> | string | null };

/** True quando o app roda dentro do Luris Desktop (Electron), que consegue ler os processos do PC. */
export function hasDesktopBridge() {
  if (typeof window === "undefined") return false;
  return Boolean((window as unknown as { lurisDesktop?: DesktopBridge }).lurisDesktop?.getCurrentGame);
}

/** Detecta o jogo aberto no PC. Só funciona no Luris Desktop (o navegador não consegue ler processos). */
export async function detectCurrentGame(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const bridge = (window as unknown as { lurisDesktop?: DesktopBridge }).lurisDesktop;
  if (!bridge?.getCurrentGame) return null;
  try {
    const game = await bridge.getCurrentGame();
    return game && String(game).trim() ? String(game).trim() : null;
  } catch {
    return null;
  }
}
