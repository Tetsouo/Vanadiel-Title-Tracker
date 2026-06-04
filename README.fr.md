# Vana'diel Title Tracker

[English](README.md) · **Français**

Une application de bureau & web soignée pour suivre tes **titres de Final
Fantasy XI**. Elle embarque la liste complète des titres de BG-Wiki, te laisse
importer ce que tu as débloqué (via un addon Windower), et affiche ce qu'il te
reste à faire — avec filtres, recherche, progression et une interface
entièrement bilingue (FR / EN).

> Aucun compte, aucun serveur : tout tourne en local et tes données restent sur ta machine.

## Fonctionnalités

- **Deux onglets** — *À faire* / *Accomplis*, avec compteurs en temps réel
- **Filtres** par catégorie (puces colorées + compteurs) et par PNJ
- **Recherche instantanée** (titre, quête, PNJ…)
- **Validation à la volée** — ✓ déplace un titre vers *Accomplis*, ↩ annule
- **Progression globale** (anneau + barre supérieure) : obtenus / total
- **Colonnes triables** et **liens BG-Wiki** cliquables
- **Interface bilingue** (français / anglais) avec bascule en un clic
- **Thèmes clair & sombre**
- **Sauvegarde locale complète** (onglet, filtres, recherche, tri, possession) via `localStorage`
- **Installateur d'addon intégré** et **import** de tes exports en jeu

## Téléchargement & installation

1. Va sur la page [**Releases**](../../releases) et télécharge le dernier
   `Vanadiel Title Tracker Setup x.y.z.exe`.
2. Lance-le. Au 1ᵉʳ démarrage, Windows SmartScreen peut avertir (app non
   signée) → **Informations complémentaires → Exécuter quand même**.
3. Ouvre **Title Tracker** depuis le menu Démarrer.

> Windows 10/11 (64-bit). Rien d'autre n'est requis — Chromium et Node sont embarqués.

## Récupérer tes titres dans l'app

L'app affiche les données ; les données viennent du jeu via un petit addon Windower.

1. Dans l'app, ouvre **Importer / Addon → Installer l'addon**, choisis ton
   dossier **Windower** → l'addon est écrit dans `…\addons\titles\`.
2. En jeu :
   - `//lua load titles`
   - Visite les PNJ de titres et/ou change de zone pour que l'addon enregistre tes titres
   - `//titles owned export` puis `//titles missing export`
3. De retour dans l'app : **Importer / Addon → Importer mes titres**, sélectionne
   les fichiers générés `*-owned.txt` (et éventuellement `*-missing.txt`) dans
   `…\addons\titles\export\`.

L'addon (`titles`, par **Kayte**) est embarqué dans l'app ; sa source se trouve
dans [`addon/titles/`](addon/titles).

## Compiler depuis les sources

Nécessite **Python 3.10+** et **Node.js 18+**.

```bash
# 1) Générer le bundle web (récupère la liste des titres sur BG-Wiki)
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -r requirements.txt
python titlereportgenerator.py                       # écrit ./dist

# 2) Empaqueter l'app de bureau
npm install
npm run dist                                         # construit ./dist_electron/*.exe
```

Tu peux aussi simplement ouvrir `dist/titles_filtered.html` dans un navigateur
(sans empaquetage).

### Arborescence

```
src/title_tracker/   Générateur Python (scrape, catégorisation, rendu du bundle)
web/                 Source du front (template.html, style.css, app.js)
addon/titles/        Addon Windower embarqué (Lua)
electron/            Enveloppe bureau (main + preload)
dist/                Bundle web généré (ignoré par git)
dist_electron/       Installeur empaqueté (ignoré par git)
```

## Crédits

- Données des titres : [BG-Wiki](https://www.bg-wiki.com/ffxi/Titles)
- Addon Windower `titles` : **Kayte**
- Application : **Tetsouo**

## Licence

[MIT](LICENSE) © Tetsouo
