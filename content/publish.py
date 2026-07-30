"""ENTRYPOINT Proceso B — worker de publicación (GitHub Actions cron, sin interacción).

Publica items approved vencidos. Cada canal registra su id; si uno falla, el
siguiente cron reintenta SOLO ese canal (patrón instagod).
Uso: python publish.py
"""
from __future__ import annotations

from datetime import datetime, timezone

from src.db import due_items, record_publish
from src.handoff import send_package
from src.publishers import publish_facebook, publish_instagram


def run(now_iso: str) -> dict:
    published = failed = 0
    for item in due_items(now_iso):
        hechos = item.get("publish_ids", {})
        caps = item.get("captions", {})
        acciones = {
            "fb_page": lambda: publish_facebook(item["image_urls"], caps.get("fb", "")),
            "ig": lambda: publish_instagram(item["image_urls"], caps.get("ig", "")),
            "grupo": lambda: send_package(item),
            "tiktok": lambda: send_package(item),
        }
        for canal in item["channels"]:
            if canal in hechos:
                continue
            try:
                record_publish(item["id"], canal, acciones[canal]())
                published += 1
            except Exception as e:  # noqa: BLE001 — un canal caído no detiene el resto
                print(f"[publish] {item['id']}/{canal} falló: {e}")
                failed += 1
    return {"published": published, "failed": failed}


if __name__ == "__main__":
    out = run(datetime.now(timezone.utc).isoformat())
    print(out)
