from __future__ import annotations
import requests
from .config import cfg
from .db import published_items, upsert_metric

_G = "https://graph.facebook.com/v23.0"

def fetch_fb_insights(post_id: str) -> dict:
    tok = cfg().fb_page_token
    r = requests.get(f"{_G}/{post_id}", params={
        "fields": "reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0),shares",
        "access_token": tok,
    }, timeout=30)
    r.raise_for_status()
    d = r.json()
    out = {
        "reactions": d.get("reactions", {}).get("summary", {}).get("total_count", 0),
        "comments": d.get("comments", {}).get("summary", {}).get("total_count", 0),
        "shares": d.get("shares", {}).get("count", 0),
    }
    ri = requests.get(f"{_G}/{post_id}/insights", params={
        "metric": "post_impressions_unique", "access_token": tok,
    }, timeout=30)
    if ri.ok:
        data = ri.json().get("data", [])
        if data and data[0].get("values"):
            out["reach"] = data[0]["values"][0].get("value", 0)
    return out

def fetch_ig_insights(media_id: str) -> dict:
    r = requests.get(f"{_G}/{media_id}/insights", params={
        "metric": "reach,likes,comments,saved,shares", "access_token": cfg().fb_page_token,
    }, timeout=30)
    r.raise_for_status()
    return {d["name"]: (d.get("values") or [{}])[0].get("value", 0) for d in r.json().get("data", [])}

def collect(snapshot_date: str) -> int:
    n = 0
    for item in published_items():
        ids = item.get("publish_ids", {})
        for channel in ("fb_page", "ig"):
            post_id = ids.get(channel)
            if not post_id or post_id == "sent":
                continue
            fetcher = fetch_fb_insights if channel == "fb_page" else fetch_ig_insights
            try:
                upsert_metric(item["id"], channel, snapshot_date, fetcher(post_id))
                n += 1
            except Exception as e:  # noqa: BLE001 — una pieza caída no detiene la recolección
                print(f"[insights] {item['id']}/{channel} falló: {e}")
    return n
