/**
 * Tema Luris global: aplica o tema escolhido no perfil em TODO o site
 * (tokens de cor do design system), não só no cartão do perfil.
 * Antes os temas comprados no marketplace só gastavam LuCoins e nada mudava.
 */

export const THEME_KEYS = [
  "neon", "nightberry", "sakura", "galaxy", "cyber", "gold", "blood", "mint",
  "matrix", "ocean", "royal", "inferno", "lavender", "void", "aurora", "candy",
] as const;

export type ThemeKey = (typeof THEME_KEYS)[number];

const STORE = "luris.profile.theme";

export function isThemeKey(v?: string | null): v is ThemeKey {
  return !!v && (THEME_KEYS as readonly string[]).includes(v);
}

/** Normaliza qualquer valor vindo do banco/marketplace para um tema válido. */
export function normalizeTheme(v?: string | null): ThemeKey {
  return isThemeKey(v) ? v : "neon";
}

/** Aplica o tema imediatamente (sem reload) e guarda pra próxima visita. */
export function applyProfileTheme(value?: string | null) {
  if (typeof document === "undefined") return;
  const theme = normalizeTheme(value);
  document.documentElement.dataset.lurisTheme = theme;
  try { localStorage.setItem(STORE, theme); } catch { /* noop */ }
}

/** Tema salvo localmente — usado antes do perfil carregar, evita "flash" roxo. */
export function storedTheme(): ThemeKey {
  if (typeof window === "undefined") return "neon";
  try { return normalizeTheme(localStorage.getItem(STORE)); } catch { return "neon"; }
}
