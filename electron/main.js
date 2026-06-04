const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");

const ADDON_FILES = ["titles.lua", "exclusions.lua", "npcmap.lua"];

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 920,
    minHeight: 600,
    backgroundColor: "#0b0c0f",
    title: "Vana'diel Title Tracker",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, "..", "dist", "titles_filtered.html"));

  // Les liens externes (BG-Wiki) s'ouvrent dans le navigateur par défaut.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow" };
  });
}

// Installation de l'addon : dialogue natif + écriture directe sur le disque.
ipcMain.handle("install-addon", async () => {
  const win = BrowserWindow.getFocusedWindow();
  const r = await dialog.showOpenDialog(win, {
    title: "Choisis ton dossier Windower (ou son sous-dossier addons)",
    properties: ["openDirectory"],
  });
  if (r.canceled || !r.filePaths.length) return { canceled: true };
  try {
    const base = r.filePaths[0];
    const addons = path.basename(base).toLowerCase() === "addons" ? base : path.join(base, "addons");
    const titles = path.join(addons, "titles");
    fs.mkdirSync(path.join(titles, "data"), { recursive: true });
    fs.mkdirSync(path.join(titles, "export"), { recursive: true });
    const srcDir = path.join(__dirname, "..", "addon", "titles");
    let n = 0;
    for (const f of ADDON_FILES) {
      fs.writeFileSync(path.join(titles, f), fs.readFileSync(path.join(srcDir, f)));
      n++;
    }
    return { ok: true, dest: titles, count: n };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
