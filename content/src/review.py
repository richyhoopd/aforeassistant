from __future__ import annotations
import json
import time
from pathlib import Path
import requests
from .config import cfg

def _api(metodo: str) -> str:
    return f"https://api.telegram.org/bot{cfg().telegram_token}/{metodo}"

def send_text(text: str) -> None:
    requests.post(_api("sendMessage"), json={"chat_id": cfg().telegram_chat_id, "text": text}, timeout=30).raise_for_status()

def send_for_review(image_paths: list[Path], caption: str, item_key: str) -> None:
    markup = json.dumps({"inline_keyboard": [[
        {"text": "✅ Aprobar", "callback_data": f"ok:{item_key}"},
        {"text": "❌ Rechazar", "callback_data": f"no:{item_key}"},
        {"text": "🔄 Regenerar", "callback_data": f"re:{item_key}"},
    ]]})
    # La primera foto lleva caption y botones; extras (carrusel) van simples.
    for n, p in enumerate(image_paths):
        data = {"chat_id": cfg().telegram_chat_id}
        if n == 0:
            data |= {"caption": caption[:1000], "reply_markup": markup}
        with open(p, "rb") as f:
            requests.post(_api("sendPhoto"), data=data, files={"photo": f}, timeout=60).raise_for_status()

def wait_decision(item_key: str, timeout_s: int = 900) -> tuple[str, str | None]:
    offset, fin = 0, time.time() + timeout_s
    decision: str | None = None
    while time.time() < fin:
        r = requests.get(_api("getUpdates"), params={"offset": offset, "timeout": 25}, timeout=35)
        for up in r.json().get("result", []):
            offset = up["update_id"] + 1
            cq = up.get("callback_query")
            if cq and cq.get("data", "").endswith(f":{item_key}"):
                decision = cq["data"].split(":", 1)[0]
                requests.post(_api("answerCallbackQuery"), json={"callback_query_id": cq["id"]}, timeout=30)
                if decision != "re":
                    return decision, None
                fin = time.time() + 60  # ventana corta para feedback de texto
            elif decision == "re" and up.get("message", {}).get("text"):
                return "re", up["message"]["text"]
        if decision == "re" and time.time() >= fin:
            break
    return (decision or "no"), None
