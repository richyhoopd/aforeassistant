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
