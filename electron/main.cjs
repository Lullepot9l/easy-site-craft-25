// Luris Desktop — wrapper Electron para rodar como aplicativo nativo
// no Windows, macOS e Linux, com ícone e nome próprios.
const { app, BrowserWindow, shell, Menu } = require("electron");
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
