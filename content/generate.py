"""ENTRYPOINT Proceso A — genera el lote semanal y lo manda a aprobar por Telegram.

Uso: python generate.py [YYYY-MM-DD]   (lunes de la semana a generar;
default: el próximo lunes). Termina cuando el lote queda resuelto.
"""
from __future__ import annotations
import sys
from datetime import date, timedelta
from pathlib import Path
from src.catalog import plan_semana
from src.copywriter import generate_copy
from src.db import insert_item, set_status, upload_image
from src.render import render_item
from src.review import send_for_review, send_text, wait_decision

OUT = Path(__file__).parent / "out"
MAX_INTENTOS = 3

def procesar_item(item: dict) -> str | None:
    key = f"{item['tema']}_{item['formato']}"
    feedback = None
    for _ in range(MAX_INTENTOS):
        copy = generate_copy(item, feedback=feedback)
        paths = render_item(item, copy, OUT)
        canal = "+".join(item["channels"])
        caption = f"[{canal} · {item['scheduled_at']:%a %d}] {copy['captions'].get(item['channels'][0], copy.get('titulo', ''))}"
        send_for_review(paths, caption, key)
        decision, feedback = wait_decision(key)
        if decision == "ok":
            urls = [upload_image(p) for p in paths]
            item_id = insert_item(item, copy, urls)
            set_status(item_id, "approved")
            return item_id
        if decision == "no":
            return None
    return None

def main() -> None:
    inicio = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else (
        date.today() + timedelta(days=(7 - date.today().weekday()) % 7 or 7))
    items = plan_semana(inicio)
    send_text(f"📅 Lote semana {inicio}: {len(items)} piezas. Vamos una por una.")
    ok = sum(1 for it in items if procesar_item(it))
    send_text(f"✅ Listo: {ok}/{len(items)} aprobadas y programadas.")

if __name__ == "__main__":
    main()
