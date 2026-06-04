"""Logique « métier » : chargement des exports, normalisation, catégorisation."""
from __future__ import annotations

import re

import pandas as pd

from . import config


# ── Lecture des exports du jeu ──────────────────────────────────────────────
def read_titles_from_file(name: str) -> tuple[list[str], str | None]:
    """Cherche `name` (ou un fichier `*-name`) dans data/ puis à la racine.

    Renvoie (lignes, nom_du_personnage) — le nom est déduit du motif
    « Nom-missing.txt » lorsqu'il est présent, sinon None.
    """
    candidates: list = []
    search_dirs = [config.DATA_DIR, config.PROJECT_ROOT]

    for base in search_dirs:                       # correspondance exacte d'abord
        p = base / name
        if p.is_file():
            candidates.append(p)
    for base in search_dirs:                       # puis motif "Nom-name"
        if base.is_dir():
            for f in sorted(base.iterdir()):
                if f.is_file() and f.name.lower().endswith("-" + name.lower()):
                    candidates.append(f)

    if not candidates:
        return [], None

    path = candidates[0]
    character = None
    m = re.match(r"(.+)-" + re.escape(name) + r"$", path.name, re.IGNORECASE)
    if m:
        character = m.group(1)

    text = path.read_text(encoding="utf-8", errors="replace").replace("\r\n", "\n")
    lines = [t.strip() for t in text.splitlines() if t.strip()]
    return lines, character


# ── Normalisation / catégorisation ──────────────────────────────────────────
def normalize_title(s: str) -> str:
    s = str(s).replace("’", "'")
    s = s.replace("A?â,¢", "").replace("A?Å¡", "").replace("™", "").replace("š", "")
    s = re.sub(r"[★☆✦✩✪✫✬✭✮✯]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def categorize_how(how_text: str) -> str:
    h = how_text.strip()
    if h.startswith("Quest"):       return "Quest"
    if h.startswith("Enemy"):       return "Enemy"
    if h.startswith("Battlefield"): return "Battlefield"
    if h.startswith("Mission"):     return "Mission"
    # Titres de rang de nation (San d'Oria / Bastok / Windurst) : obtenus via les
    # Points de Conquête à un rang donné → rattachés à la progression de nation.
    if "Conquest Points" in h:      return "Mission"
    if h.startswith("Item"):        return "Item / Guild"
    if any(x in h for x in ["Job_Points", "Job Points"]):
        return "Job Points"
    if any(x in h for x in ["Garden Furrows", "Coastal Fishing Net",
                            "Pond Dredger", "Mog Garden", "Monster Rearing"]):
        return "HELM"
    if any(x in h for x in ["Chocobo", "Vana'Bout", "Ballista", "Skirmish",
                            "Moblin Maze", "Fish Ranking", "Crystal Stakes"]):
        return "Minigames"
    if h.startswith("NPC"):
        return "NPC"
    return "Other"


def _enemy_tag(row) -> str:
    # Le PNJ « Zuah Lepahnyu » correspond de façon fiable aux titres d'ennemis
    # d'Abyssea (vérifié sur BG-Wiki). Pour les autres ennemis, la page Titles
    # n'expose PAS la zone — impossible d'affirmer « Non-Abyssea » sans ouvrir
    # chaque fiche de NM — donc on laisse l'étiquette vide plutôt que de mentir.
    if row["HowToObtain"].startswith("Enemy") and row["TitleNPC"] == "Zuah Lepahnyu":
        return "Abyssea Enemy"
    return ""


def enrich(df: pd.DataFrame) -> pd.DataFrame:
    """Ajoute les colonnes EnemyTag et Category à un sous-ensemble de titres."""
    df = df.copy()
    df["EnemyTag"] = df.apply(_enemy_tag, axis=1)
    df["Category"] = df["HowToObtain"].apply(categorize_how)
    return df


def split_owned_missing(df: pd.DataFrame, missing_raw: list[str], owned_raw: list[str]
                        ) -> tuple[pd.DataFrame, pd.DataFrame, list[str]]:
    """Découpe la table complète en (à faire, possédés) et liste les non-trouvés.

    Si un export « owned » est fourni, on adopte le modèle COMPLET : tout titre
    de BG-Wiki non possédé est « à faire ». Cela garantit qu'aucun titre ne
    manque dans l'onglet À faire, même si l'export « missing » du jeu est
    incomplet. À défaut d'« owned », on retombe sur la liste « missing ».
    """
    owned_norm = {normalize_title(t) for t in owned_raw}
    norm = df["Title"].map(normalize_title)
    df_owned = enrich(df[norm.isin(owned_norm)])

    if owned_raw:
        df_missing = enrich(df[~norm.isin(owned_norm)])
        reference, found = owned_raw, set(df_owned["Title"].map(normalize_title))
    else:
        missing_norm = {normalize_title(t) for t in missing_raw}
        df_missing = enrich(df[norm.isin(missing_norm)])
        reference, found = missing_raw, set(df_missing["Title"].map(normalize_title))

    unmatched = [t for t in reference if normalize_title(t) not in found]
    return df_missing, df_owned, unmatched
