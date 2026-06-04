"""Génération du bundle web : data.js + copie des assets dans dist/."""
from __future__ import annotations

import base64
import csv
import json
import shutil

import pandas as pd

from . import config


ADDON_FILES = ("titles.lua", "exclusions.lua", "npcmap.lua")


def _addon_payload() -> dict:
    """Encode les fichiers de l'addon en base64 pour l'installateur côté navigateur."""
    files = {}
    for name in ADDON_FILES:
        p = config.ADDON_DIR / name
        if p.exists():
            files[name] = base64.b64encode(p.read_bytes()).decode("ascii")
    return {"files": files}


_RECORD_COLS = {
    "Title": "title",
    "HowToObtainHTML": "how",
    "TitleNPC": "npc",
    "EnemyTag": "enemy",
    "Category": "cat",
}


def _records(df: pd.DataFrame) -> list[dict]:
    out = []
    for r in df.itertuples(index=False):
        out.append({
            "title": r.Title,
            "how":   r.HowToObtainHTML,
            "npc":   r.TitleNPC or "",
            "enemy": r.EnemyTag or "",
            "cat":   r.Category,
        })
    return out


def build_payload(df_missing: pd.DataFrame, df_owned: pd.DataFrame,
                  total_game: int, character: str | None) -> dict:
    cats = sorted(set(df_missing["Category"].tolist() + df_owned["Category"].tolist()))
    npcs = sorted({n for n in list(df_missing["TitleNPC"]) + list(df_owned["TitleNPC"]) if n})
    cat_colors = {c: config.CAT_COLORS.get(c, config.DEFAULT_CAT_COLOR) for c in cats}
    return {
        "character": character,
        "totalGame": int(total_game),
        "categories": cats,
        "npcs": npcs,
        "catColors": cat_colors,
        "missing": _records(df_missing),
        "owned": _records(df_owned),
    }


def write_report(df_missing: pd.DataFrame, df_owned: pd.DataFrame,
                 total_game: int, character: str | None) -> None:
    """Écrit dist/ : html (copie du gabarit), style.css, app.js, data.js, csv."""
    config.DIST_DIR.mkdir(parents=True, exist_ok=True)

    # Assets statiques (édités dans web/, copiés tels quels).
    shutil.copy(config.WEB_DIR / "style.css", config.DIST_DIR / "style.css")
    shutil.copy(config.WEB_DIR / "app.js", config.DIST_DIR / "app.js")
    shutil.copy(config.WEB_DIR / "template.html", config.DIST_DIR / config.OUTPUT_HTML)

    # Données → data.js (chargé via <script>, donc compatible file://).
    payload = build_payload(df_missing, df_owned, total_game, character)
    blob = json.dumps(payload, ensure_ascii=False, indent=2).replace("</", "<\\/")
    addon_blob = json.dumps(_addon_payload(), ensure_ascii=False).replace("</", "<\\/")
    js = (
        "// Généré automatiquement par title_tracker — ne pas éditer à la main.\n"
        f"window.__DATA__ = {blob};\n"
        f"window.__ADDON__ = {addon_blob};\n"
    )
    (config.DIST_DIR / config.OUTPUT_DATA).write_text(js, encoding="utf-8")

    # CSV (titres manquants), pratique pour Excel / autres outils.
    df_missing[["Title", "HowToObtain", "HowToObtainLinks", "TitleNPC", "EnemyTag", "Category"]].to_csv(
        config.DIST_DIR / config.OUTPUT_CSV, index=False, encoding="utf-8", quoting=csv.QUOTE_MINIMAL
    )
