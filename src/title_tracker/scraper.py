"""Récupération et parsing de la table des titres sur BG-Wiki."""
from __future__ import annotations

import re
from urllib.parse import urljoin

import pandas as pd
import requests
from bs4 import BeautifulSoup

from . import config


def _cell_links(td) -> list[str]:
    seen, out = set(), []
    for a in td.find_all("a", href=True):
        href = urljoin(config.BASE, a["href"])
        if href not in seen:
            seen.add(href)
            out.append(href)
    return out


def _sanitize_td_keep_anchors(td) -> str:
    """Conserve uniquement les <a>/<br>, absolutise les liens, nettoie le reste."""
    soup = BeautifulSoup(str(td), "lxml")
    td2 = soup.find("td") or soup
    for a in td2.find_all("a", href=True):
        a["href"] = urljoin(config.BASE, a["href"])
    for tag in list(td2.find_all(True)):
        if tag.name not in ("a", "br"):
            tag.unwrap()
    html = td2.decode_contents().replace("\n", " ").strip()
    return re.sub(r"\s{2,}", " ", html)


def fetch_titles_table() -> pd.DataFrame:
    """Télécharge la page Titles et renvoie un DataFrame des titres + métadonnées."""
    resp = requests.get(config.URL, headers={"User-Agent": config.USER_AGENT}, timeout=config.HTTP_TIMEOUT)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    target = None
    for table in soup.find_all("table"):
        ths = [th.get_text(" ", strip=True) for th in table.find_all("th")]
        if len(ths) >= 3 and ths[0] == "Titles" and ths[1] == "How to obtain" and ths[2] == "Title NPC":
            target = table
            break
    if target is None:
        raise RuntimeError("Impossible de localiser la table des titres sur BG-Wiki.")

    rows = []
    for tr in target.find_all("tr"):
        tds = tr.find_all("td")
        if len(tds) != 3:
            continue
        rows.append({
            "Title":            tds[0].get_text(" ", strip=True),
            "HowToObtain":      tds[1].get_text(" ", strip=True),
            "HowToObtainHTML":  _sanitize_td_keep_anchors(tds[1]),
            "HowToObtainLinks": " | ".join(_cell_links(tds[1])),
            "TitleNPC":         tds[2].get_text(" ", strip=True),
        })
    return pd.DataFrame(rows)
