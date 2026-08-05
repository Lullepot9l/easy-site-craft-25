// Temas de DM (conversas privadas) — usados em /friends e no marketplace.
export type DmTheme = {
  key: string;
  name: string;
  bg_color: string;
  bg_image_url: string | null;
  bubble_color: string;
  accent_color: string;
  price: number;
};

export const DM_THEMES: DmTheme[] = [
  { key: "nightberry", name: "Nightberry 🌑", bg_color: "#0a0512", bg_image_url: null, bubble_color: "oklch(0.3 0.2 295 / 0.5)", accent_color: "oklch(0.7 0.28 295)", price: 0 },
  { key: "cyberpink", name: "Cyber Pink 💗", bg_color: "#12051a", bg_image_url: null, bubble_color: "oklch(0.32 0.2 330 / 0.55)", accent_color: "oklch(0.75 0.3 330)", price: 120 },
  { key: "midnight", name: "Meia-Noite 🌌", bg_color: "#03060f", bg_image_url: null, bubble_color: "oklch(0.28 0.14 265 / 0.6)", accent_color: "oklch(0.72 0.24 265)", price: 120 },
  { key: "toxic", name: "Tóxico ☢️", bg_color: "#05120a", bg_image_url: null, bubble_color: "oklch(0.3 0.18 145 / 0.5)", accent_color: "oklch(0.78 0.26 145)", price: 150 },
  { key: "sunset", name: "Sunset 🌇", bg_color: "#170a06", bg_image_url: null, bubble_color: "oklch(0.32 0.16 40 / 0.55)", accent_color: "oklch(0.8 0.22 55)", price: 150 },
  { key: "ice", name: "Gelo ❄️", bg_color: "#04101a", bg_image_url: null, bubble_color: "oklch(0.32 0.12 220 / 0.55)", accent_color: "oklch(0.82 0.18 210)", price: 150 },
  { key: "sakura", name: "Sakura 🌸", bg_color: "#170a12", bg_image_url: null, bubble_color: "oklch(0.36 0.12 350 / 0.5)", accent_color: "oklch(0.86 0.14 350)", price: 180 },
  { key: "matrix", name: "Matrix 🟩", bg_color: "#020904", bg_image_url: null, bubble_color: "oklch(0.26 0.16 150 / 0.6)", accent_color: "oklch(0.8 0.3 150)", price: 180 },
  { key: "royal", name: "Real 👑", bg_color: "#0d0714", bg_image_url: null, bubble_color: "oklch(0.32 0.16 300 / 0.55)", accent_color: "oklch(0.85 0.2 85)", price: 220 },
  { key: "blood", name: "Sangue 🩸", bg_color: "#120306", bg_image_url: null, bubble_color: "oklch(0.3 0.2 25 / 0.55)", accent_color: "oklch(0.72 0.28 25)", price: 220 },
  { key: "ocean", name: "Oceano 🌊", bg_color: "#031014", bg_image_url: null, bubble_color: "oklch(0.3 0.14 205 / 0.55)", accent_color: "oklch(0.78 0.2 195)", price: 200 },
  { key: "luris", name: "Luris Exclusive ✨", bg_color: "#0b0417", bg_image_url: null, bubble_color: "oklch(0.34 0.22 310 / 0.6)", accent_color: "oklch(0.82 0.3 320)", price: 400 },
];

export const DM_THEME_MAP: Record<string, DmTheme> = Object.fromEntries(DM_THEMES.map((t) => [t.key, t]));
