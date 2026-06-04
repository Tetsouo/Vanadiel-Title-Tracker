const { contextBridge, ipcRenderer } = require("electron");

// Expose une API minimale et sûre au renderer (contextIsolation activé).
contextBridge.exposeInMainWorld("electronAPI", {
  installAddon: () => ipcRenderer.invoke("install-addon"),
});
