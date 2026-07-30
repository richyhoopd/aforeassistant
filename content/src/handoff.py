from __future__ import annotations

import requests

from .catalog import GRUPOS
from .config import cfg


def _api(m: str) -> str:
    return f"https://api.telegram.org/bot{cfg().telegram_token}/{m}"


def send_package(item: dict) -> str:
    canal = item["channels"][0]  # "grupo" o "tiktok"
    chat = cfg().telegram_chat_id
    for url in item["image_urls"]:
        requests.post(
            _api("sendPhoto"),
            json={"chat_id": chat, "photo": url},
            timeout=60,
        ).raise_for_status()
    if canal == "grupo":
        nombre = next(
            (g["nombre"] for g in GRUPOS if g["source"] == item["source"]),
            item["source"],
        )
        instr = f"📋 Pegar HOY en «{nombre}» ({item['source']}) desde tu perfil:"
    else:
        instr = "🎵 Subir HOY a TikTok en photo-mode con este caption:"
    caption = item.get("captions", {}).get(canal, "")
    requests.post(
        _api("sendMessage"),
        json={"chat_id": chat, "text": f"{instr}\n\n{caption}"},
        timeout=30,
    ).raise_for_status()
    return "sent"
