// Luris Desktop — wrapper Electron para rodar como aplicativo nativo
// no Windows, macOS e Linux, com ícone e nome próprios.
const { app, BrowserWindow, shell, Menu, ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");

// URL do Luris publicado. Se você publicar em outro domínio,
// basta editar essa linha e reempacotar.
const LURIS_URL =
  process.env.LURIS_URL ||
  "https://id-preview--1de79d54-a6f3-4cd0-a8b0-e7de4c704084.lovable.app";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0a0014",
    title: "Luris",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      // Compartilhamento de tela do navegador embutido:
      // permite getDisplayMedia sem prompt extra.
    },
  });

  Menu.setApplicationMenu(null);

  // Abre links externos no navegador padrão em vez de dentro do app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  win.loadURL(LURIS_URL);
}

// ===== Detecção do jogo aberto no PC =====
// Mapa processo -> nome bonito exibido no perfil.
const GAME_PROCESSES = [
  ["RobloxPlayerBeta", "ROBLOX"],
  ["VALORANT", "Valorant"],
  ["javaw", "Minecraft"],
  ["Minecraft", "Minecraft"],
  ["FortniteClient", "Fortnite"],
  ["LeagueofLegends", "League of Legends"],
  ["League of Legends", "League of Legends"],
  ["cs2", "CS2"],
  ["GTA5", "GTA V"],
  ["FreeFire", "Free Fire"],
  ["GenshinImpact", "Genshin Impact"],
  ["RocketLeague", "Rocket League"],
  ["Among Us", "Among Us"],
  ["r5apex", "Apex Legends"],
  ["Overwatch", "Overwatch 2"],
  ["Terraria", "Terraria"],
  ["Stardew Valley", "Stardew Valley"],
  ["TS4", "The Sims 4"],
  ["eldenring", "Elden Ring"],
  ["dota2", "Dota 2"],
  ["TslGame", "PUBG"],
  ["Discord", "Discord (conversando)"],
];

function listProcesses() {
  const cmd = process.platform === "win32" ? "tasklist /fo csv /nh" : "ps -eo comm";
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => resolve(err ? "" : String(stdout)));
  });
}

ipcMain.handle("luris:current-game", async () => {
  const out = (await listProcesses()).toLowerCase();
  if (!out) return null;
  for (const [proc, label] of GAME_PROCESSES) {
    if (out.includes(proc.toLowerCase())) return label;
  }
  return null;
});

app.setName("Luris");

// Permite que a página use getDisplayMedia() sem tela cheia
app.commandLine.appendSwitch("enable-features", "WebRTCPipeWireCapturer");

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
