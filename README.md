# Vana'diel Title Tracker

**English** · [Français](README.fr.md)

A clean desktop & web app to track your **Final Fantasy XI titles**. It bundles the
full BG-Wiki title list, lets you import what you've unlocked (via a Windower
add-on), and shows what's left to do — with filters, search, progress and a
fully bilingual interface (EN / FR).

> No account, no server: everything runs locally and your data stays on your machine.

## Features

- **Two tabs** — *To do* / *Completed*, with live counters
- **Filters** by category (colored chips + counts) and by NPC
- **Instant search** (title, quest, NPC…)
- **Mark titles on the fly** — ✓ moves a title to *Completed*, ↩ undoes it
- **Global progress** (ring + top bar): owned / total
- **Sortable columns** and clickable **BG-Wiki links**
- **Bilingual UI** (English / French) with a one-click language switch
- **Light & dark themes**
- **Full local save** (tab, filters, search, sort, ownership) via `localStorage`
- **Built-in add-on installer** and **import** of your in-game exports

## Download & install

1. Go to the [**Releases**](../../releases) page and download the latest
   `Vanadiel Title Tracker Setup x.y.z.exe`.
2. Run it. On first launch Windows SmartScreen may warn (unsigned app) →
   **More info → Run anyway**.
3. Launch **Title Tracker** from the Start menu.

> Windows 10/11 (64-bit). Nothing else required — Chromium and Node are bundled.

## Get your titles into the app

The app shows the data; the data comes from the game via a small Windower add-on.

1. In the app, open **Import / Add-on → Install the add-on**, pick your
   **Windower** folder → the add-on is written to `…\addons\titles\`.
2. In-game:
   - `//lua load titles`
   - Visit title NPCs and/or change zones so the add-on records your titles
   - `//titles owned export` then `//titles missing export`
3. Back in the app: **Import / Add-on → Import my titles**, select the
   generated `*-owned.txt` (and optionally `*-missing.txt`) from
   `…\addons\titles\export\`.

The add-on (`titles`, by **Kayte**) is bundled with the app; its source lives in
[`addon/titles/`](addon/titles).

## Build from source

Requires **Python 3.10+** and **Node.js 18+**.

```bash
# 1) Generate the web bundle (scrapes the BG-Wiki title list)
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -r requirements.txt
python titlereportgenerator.py                       # writes ./dist

# 2) Package the desktop app
npm install
npm run dist                                         # builds ./dist_electron/*.exe
```

You can also just open `dist/titles_filtered.html` in a browser (no packaging).

### Project layout

```
src/title_tracker/   Python generator (scrape, categorize, render the bundle)
web/                 Front-end source (template.html, style.css, app.js)
addon/titles/        Bundled Windower add-on (Lua)
electron/            Desktop wrapper (main + preload)
dist/                Generated web bundle (git-ignored)
dist_electron/       Packaged installer (git-ignored)
```

## Credits

- Title data: [BG-Wiki](https://www.bg-wiki.com/ffxi/Titles)
- Windower `titles` add-on: **Kayte**
- App: **Tetsouo**

## License

[MIT](LICENSE) © Tetsouo
