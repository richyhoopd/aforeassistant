from __future__ import annotations
import requests
from .config import cfg

_G = "https://graph.facebook.com/v23.0"

def publish_facebook(image_urls: list[str], caption: str) -> str:
    c = cfg()
    r = requests.post(f"{_G}/{c.fb_page_id}/photos",
                      data={"url": image_urls[0], "caption": caption, "access_token": c.fb_page_token}, timeout=60)
    r.raise_for_status()
    d = r.json()
    return d.get("post_id") or d["id"]

def _ig_container(data: dict) -> str:
    c = cfg()
    r = requests.post(f"{_G}/{c.ig_user_id}/media", data={**data, "access_token": c.fb_page_token}, timeout=60)
    r.raise_for_status()
    return r.json()["id"]

def publish_instagram(image_urls: list[str], caption: str) -> str:
    c = cfg()
    if len(image_urls) == 1:
        container = _ig_container({"image_url": image_urls[0], "caption": caption})
    else:
        hijos = [_ig_container({"image_url": u, "is_carousel_item": "true"}) for u in image_urls]
        container = _ig_container({"media_type": "CAROUSEL", "children": ",".join(hijos), "caption": caption})
    r = requests.post(f"{_G}/{c.ig_user_id}/media_publish",
                      data={"creation_id": container, "access_token": c.fb_page_token}, timeout=60)
    r.raise_for_status()
    return r.json()["id"]
