// Ponte segura entre o app Luris (web) e o Windows/macOS/Linux.
// Expõe window.lurisDesktop.getCurrentGame() para detectar o jogo aberto no PC.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lurisDesktop", {
  platform: process.platform,
  getCurrentGame: () => ipcRenderer.invoke("luris:current-game"),
});
