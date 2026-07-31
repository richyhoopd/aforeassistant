from __future__ import annotations
import time
from pathlib import Path
import requests
from .config import cfg

def _h() -> dict:
    key = cfg().supabase_service_key
    return {"apikey": key, "Authorization": f"Bearer {key}"}

def _rest(path: str) -> str:
    return f"{cfg().supabase_url}/rest/v1/{path}"

def insert_item(item: dict, copy: dict, image_urls: list[str]) -> str:
    body = {
        "tema": item["tema"], "formato": item["formato"], "plantilla": item["plantilla"],
        "copy_base": copy.get("titulo", ""), "captions": copy.get("captions", {}),
        "image_urls": image_urls, "channels": item["channels"],
        "scheduled_at": item["scheduled_at"].isoformat() if item.get("scheduled_at") else None,
        "source": item.get("source"), "status": "pending",
    }
    r = requests.post(_rest("content_items"), headers={**_h(), "Prefer": "return=representation"}, json=body, timeout=30)
    r.raise_for_status()
    return r.json()[0]["id"]

def due_items(now_iso: str) -> list[dict]:
    r = requests.get(_rest("content_items"), headers=_h(),
                     params={"status": "eq.approved", "scheduled_at": f"lte.{now_iso}", "select": "*"}, timeout=30)
    r.raise_for_status()
    return r.json()

def set_status(item_id: str, status: str) -> None:
    r = requests.patch(_rest("content_items"), headers=_h(),
                       params={"id": f"eq.{item_id}"}, json={"status": status}, timeout=30)
    r.raise_for_status()

def record_publish(item_id: str, channel: str, post_id: str) -> None:
    r = requests.get(_rest("content_items"), headers=_h(),
                     params={"id": f"eq.{item_id}", "select": "id,channels,publish_ids"}, timeout=30)
    r.raise_for_status()
    fila = r.json()[0]
    ids = {**fila.get("publish_ids", {}), channel: post_id}
    body: dict = {"publish_ids": ids}
    if all(c in ids for c in fila["channels"]):
        body["status"] = "published"
    rp = requests.patch(_rest("content_items"), headers=_h(), params={"id": f"eq.{item_id}"}, json=body, timeout=30)
    rp.raise_for_status()

def upload_image(path: Path) -> str:
    nombre = f"{int(time.time())}_{path.name}"
    url = f"{cfg().supabase_url}/storage/v1/object/content-media/{nombre}"
    r = requests.post(url, headers={**_h(), "Content-Type": "image/png"}, data=path.read_bytes(), timeout=60)
    r.raise_for_status()
    return f"{cfg().supabase_url}/storage/v1/object/public/content-media/{nombre}"

def published_items() -> list[dict]:
    r = requests.get(_rest("content_items"), headers=_h(),
                     params={"status": "eq.published", "select": "*"}, timeout=30)
    r.raise_for_status()
    return r.json()

def upsert_metric(item_id: str, channel: str, snapshot_date: str, metrics: dict) -> None:
    r = requests.post(_rest("content_metrics"),
                      headers={**_h(), "Prefer": "resolution=merge-duplicates"},
                      params={"on_conflict": "item_id,channel,snapshot_date"},
                      json={"item_id": item_id, "channel": channel,
                            "snapshot_date": snapshot_date, "metrics": metrics},
                      timeout=30)
    r.raise_for_status()

def upsert_ad_metric(row: dict) -> None:
    r = requests.post(_rest("ads_metrics"),
                      headers={**_h(), "Prefer": "resolution=merge-duplicates"},
                      params={"on_conflict": "campaign_id,snapshot_date"},
                      json=row, timeout=30)
    r.raise_for_status()
