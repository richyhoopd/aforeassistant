from __future__ import annotations
import json
import requests
from .catalog import TEMAS
from .config import cfg

_URL = "https://api.deepseek.com/chat/completions"

_SISTEMA = """Eres el redactor de Pensión+, asesoría honesta de retiro AFORE por desempleo en México.
Principios NO negociables:
- Valor primero: cada pieza enseña algo útil aunque nadie nos contrate.
- CERO promesas de monto: jamás "retira $20,000"; siempre "podrías calificar" o "calcula tu estimado".
- Decir siempre: el trámite es gratuito y personal ante tu AFORE; nosotros cobramos por asesorar y SOLO si recibes tu retiro.
- Sin urgencia falsa. Nunca hacerse pasar por IMSS/AFORE/CONSAR. Nunca pedir NSS/CURP en redes.
- CTA suave al pre-calificador usando el marcador [LINK] tal cual.
- Español mexicano, cercano, sin tecnicismos. Emojis moderados en grupos, sobrios en página.
Responde SOLO JSON con: titulo (<=60 chars), bullets (3-5 strings cortos),
captions {fb, ig, grupo, tiktok}, laminas (si formato=carrusel: 5 objetos {titulo, bullets}; si no: [])."""

def generate_copy(item: dict, feedback: str | None = None) -> dict:
    tema = next(t["titulo"] for t in TEMAS if t["code"] == item["tema"])
    user = f"Tema: {tema}\nFormato: {item['formato']}\nCanales: {item['channels']}"
    if feedback:
        user += f"\nAjuste pedido por el editor (obligatorio): {feedback}"
    body = {
        "model": "deepseek-chat",
        "messages": [{"role": "system", "content": _SISTEMA}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"},
        "temperature": 1.1,
    }
    r = requests.post(_URL, headers={"Authorization": f"Bearer {cfg().deepseek_api_key}"}, json=body, timeout=90)
    r.raise_for_status()
    out = json.loads(r.json()["choices"][0]["message"]["content"])
    link = f"{cfg().site_url}/pre-calificador?source={item.get('source', 'organico')}"
    out["captions"] = {k: v.replace("[LINK]", link) for k, v in out.get("captions", {}).items()}
    out.setdefault("laminas", [])
    return out
