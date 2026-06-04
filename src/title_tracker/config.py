"""Constantes et chemins du projet."""
from __future__ import annotations

from pathlib import Path

# ── Arborescence ────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[2]
WEB_DIR   = PROJECT_ROOT / "web"            # gabarits front (template.html, style.css, app.js)
DATA_DIR  = PROJECT_ROOT / "data"           # exports du jeu (Nom-missing.txt / Nom-owned.txt)
DIST_DIR  = PROJECT_ROOT / "dist"           # bundle généré, à ouvrir dans le navigateur
ADDON_DIR = PROJECT_ROOT / "addon" / "titles"  # addon Windower embarqué (pour l'installateur)

# ── Source BG-Wiki ──────────────────────────────────────────────────────────
URL  = "https://www.bg-wiki.com/ffxi/Titles"
BASE = "https://www.bg-wiki.com"
USER_AGENT = "Mozilla/5.0 (compatible; titles-extractor/1.0)"
HTTP_TIMEOUT = 30

# ── Fichiers d'entrée ───────────────────────────────────────────────────────
# Recherchés dans DATA_DIR puis PROJECT_ROOT. Les motifs "Nom-missing.txt" /
# "Nom-owned.txt" (export Kayte) sont également reconnus.
MISSING_FILE = "missing.txt"
OWNED_FILE   = "owned.txt"

# Repli si aucun fichier n'est trouvé.
RAW_MISSING = "A Friend Indeed"
RAW_OWNED   = ""

# ── Fichiers de sortie (dans DIST_DIR) ──────────────────────────────────────
OUTPUT_HTML = "titles_filtered.html"
OUTPUT_CSV  = "titles_filtered.csv"
OUTPUT_DATA = "data.js"

# ── Couleurs des catégories (accent hex utilisé pour badges et filtres) ─────
CAT_COLORS = {
    "Quest":        "#e0b84a",
    "Enemy":        "#e5575c",
    "Battlefield":  "#b06cf5",
    "Mission":      "#4a9eea",
    "Item / Guild": "#37c87a",
    "Job Points":   "#19c2ac",
    "HELM":         "#8ed14a",
    "Minigames":    "#f0a23a",
    "NPC":          "#9aa6ba",
    "Other":        "#8b95a5",
}
DEFAULT_CAT_COLOR = "#9aa6ba"
