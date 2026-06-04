#!/usr/bin/env python3
"""Point d'entrée de compatibilité.

La logique vit désormais dans le paquet `src/title_tracker`. Ce fichier reste
pour conserver l'habitude `python titlereportgenerator.py`. Équivalent :

    python -m title_tracker
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from title_tracker.cli import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
