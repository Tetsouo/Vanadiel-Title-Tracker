"""Orchestration : charge les exports, scrape BG-Wiki, génère le bundle web."""
from __future__ import annotations

import sys

from . import config, report, scraper, titles


def _force_utf8_stdout() -> None:
    """Évite les UnicodeEncodeError sur la console Windows (cp1252)."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


def _load(name: str, raw_fallback: str) -> tuple[list[str], str | None]:
    lines, character = titles.read_titles_from_file(name)
    if lines:
        print(f"[INFO] {len(lines)} titres chargés depuis '{name}'")
        return lines, character
    lines = [t.strip() for t in raw_fallback.splitlines() if t.strip()]
    print(f"[INFO] '{name}' introuvable — repli sur la liste intégrée ({len(lines)} titres)")
    return lines, None


def run() -> None:
    # `--blank` : build PUBLIC sans aucune donnée joueur (tout en « à faire »,
    # 0 possédé). Idéal pour distribuer : chaque joueur importe ses titres.
    blank = "--blank" in sys.argv

    if blank:
        print("[INFO] Build PUBLIC (vierge) — aucune donnée joueur intégrée")
        character = None
    else:
        missing_raw, char_m = _load(config.MISSING_FILE, config.RAW_MISSING)
        owned_raw, char_o = _load(config.OWNED_FILE, config.RAW_OWNED)
        character = char_m or char_o

    print("[INFO] Récupération de la table des titres sur BG-Wiki…")
    df = scraper.fetch_titles_table()
    total_game = len(df)
    print(f"[INFO] {total_game} titres trouvés sur BG-Wiki")

    if blank:
        df_missing = titles.enrich(df)            # tous les titres = à faire
        df_owned = titles.enrich(df.iloc[:0])     # aucun possédé
        unmatched = []
    else:
        df_missing, df_owned, unmatched = titles.split_owned_missing(df, missing_raw, owned_raw)

    if unmatched:
        print(f"\n[WARN] {len(unmatched)} titre(s) de l'export introuvable(s) sur BG-Wiki (orthographe ?) :")
        for t in unmatched[:10]:
            print(f"  - {t}")

    report.write_report(df_missing, df_owned, total_game, character)

    out = config.DIST_DIR / config.OUTPUT_HTML
    print(f"\n✔ Bundle écrit dans : {config.DIST_DIR}")
    print(f"  ({len(df_missing)} manquants / {len(df_owned)} obtenus / {total_game} au total)")
    print(f"➜ Ouvrez {out} dans votre navigateur.")


def main() -> int:
    _force_utf8_stdout()
    try:
        run()
        return 0
    except Exception as e:  # noqa: BLE001 — message lisible pour l'utilisateur final
        print("ERREUR:", e)
        return 1
