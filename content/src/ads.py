from __future__ import annotations
import json
import requests
from .config import cfg
from .db import upsert_ad_metric

_G = "https://graph.facebook.com/v23.0"

def collect_ads(snapshot_date: str) -> int:
    c = cfg()
    if not c.ads_account_id:
        return 0  # dormido hasta configurar ADS_ACCOUNT_ID (y token con ads_read)
    r = requests.get(f"{_G}/act_{c.ads_account_id}/insights", params={
        "level": "campaign",
        "fields": "campaign_id,campaign_name,spend,impressions,clicks,actions",
        "time_range": json.dumps({"since": snapshot_date, "until": snapshot_date}),
        "access_token": c.ads_token or c.fb_page_token,
    }, timeout=60)
    r.raise_for_status()
    n = 0
    for row in r.json().get("data", []):
        leads = next((int(a["value"]) for a in row.get("actions", [])
                      if a.get("action_type") == "lead"), None)
        upsert_ad_metric({
            "campaign_id": row["campaign_id"],
            "campaign_name": row.get("campaign_name"),
            "snapshot_date": snapshot_date,
            "spend": float(row.get("spend", 0)),
            "impressions": int(row.get("impressions", 0)),
            "clicks": int(row.get("clicks", 0)),
            "leads_reported": leads,
        })
        n += 1
    return n
