from pathlib import Path
import src.db as db

class R:
    def __init__(self, data): self._d = data
    status_code = 200
    def json(self): return self._d
    def raise_for_status(self): pass

def _env(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "http://sb")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "sk")

def test_insert_item_postea_a_postgrest(monkeypatch):
    _env(monkeypatch)
    calls = []
    monkeypatch.setattr(db.requests, "post", lambda url, headers=None, json=None, timeout=None: (calls.append((url, json)), R([{"id": "abc"}]))[1])
    item = {"tema": "requisitos", "formato": "mito", "plantilla": "tarjeta",
            "channels": ["fb_page", "ig"], "scheduled_at": None, "source": "fb_page"}
    out = db.insert_item(item, {"captions": {"fb": "x"}, "titulo": "t", "bullets": []}, ["http://img/1.png"])
    assert out == "abc"
    url, body = calls[0]
    assert url == "http://sb/rest/v1/content_items"
    assert body["image_urls"] == ["http://img/1.png"] and body["status"] == "pending"

def test_record_publish_marca_published_cuando_todos(monkeypatch):
    _env(monkeypatch)
    fila = {"id": "abc", "channels": ["fb_page", "ig"], "publish_ids": {"fb_page": "1"}}
    monkeypatch.setattr(db.requests, "get", lambda url, headers=None, params=None, timeout=None: R([fila]))
    patches = []
    monkeypatch.setattr(db.requests, "patch", lambda url, headers=None, json=None, params=None, timeout=None: (patches.append(json), R([]))[1])
    db.record_publish("abc", "ig", "99")
    assert patches[0]["publish_ids"] == {"fb_page": "1", "ig": "99"}
    assert patches[0]["status"] == "published"

def test_upload_image_devuelve_url_publica(monkeypatch, tmp_path):
    _env(monkeypatch)
    png = tmp_path / "x.png"; png.write_bytes(b"png")
    monkeypatch.setattr(db.requests, "post", lambda url, headers=None, data=None, timeout=None: R({"Key": "k"}))
    url = db.upload_image(png)
    assert url.startswith("http://sb/storage/v1/object/public/content-media/")
    assert url.endswith("x.png")

def test_published_items_filtra_por_status(monkeypatch):
    _env(monkeypatch)
    calls = []
    monkeypatch.setattr(db.requests, "get", lambda url, headers=None, params=None, timeout=None: (calls.append(params), R([{"id": "x"}]))[1])
    assert db.published_items() == [{"id": "x"}]
    assert calls[0]["status"] == "eq.published"

def test_upsert_metric_hace_upsert_postgrest(monkeypatch):
    _env(monkeypatch)
    calls = []
    monkeypatch.setattr(db.requests, "post", lambda url, headers=None, params=None, json=None, timeout=None: (calls.append((url, headers, params, json)), R([]))[1])
    db.upsert_metric("it1", "ig", "2026-08-05", {"reach": 100})
    url, headers, params, body = calls[0]
    assert url.endswith("/content_metrics")
    assert headers["Prefer"] == "resolution=merge-duplicates"
    assert params["on_conflict"] == "item_id,channel,snapshot_date"
    assert body == {"item_id": "it1", "channel": "ig", "snapshot_date": "2026-08-05", "metrics": {"reach": 100}}

def test_upsert_ad_metric(monkeypatch):
    _env(monkeypatch)
    calls = []
    monkeypatch.setattr(db.requests, "post", lambda url, headers=None, params=None, json=None, timeout=None: (calls.append((url, params, json)), R([]))[1])
    db.upsert_ad_metric({"campaign_id": "c1", "snapshot_date": "2026-08-05", "spend": 10.5})
    url, params, body = calls[0]
    assert url.endswith("/ads_metrics") and params["on_conflict"] == "campaign_id,snapshot_date"
    assert body["campaign_id"] == "c1"
