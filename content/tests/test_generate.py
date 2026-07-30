from datetime import datetime, timezone
import generate as g

def test_procesar_item_aprobado_inserta(monkeypatch, tmp_path):
    item = {"tema": "requisitos", "formato": "mito", "plantilla": "tarjeta",
            "channels": ["fb_page", "ig"], "scheduled_at": datetime(2026, 8, 3, tzinfo=timezone.utc), "source": "fb_page"}
    copy = {"titulo": "t", "bullets": ["a"], "captions": {"fb": "x", "ig": "y", "grupo": "", "tiktok": ""}, "laminas": []}
    png = tmp_path / "i.png"; png.write_bytes(b"p")
    monkeypatch.setattr(g, "generate_copy", lambda it, feedback=None: copy)
    monkeypatch.setattr(g, "render_item", lambda it, c, d: [png])
    monkeypatch.setattr(g, "send_for_review", lambda paths, cap, key: None)
    monkeypatch.setattr(g, "wait_decision", lambda key, timeout_s=900: ("ok", None))
    monkeypatch.setattr(g, "upload_image", lambda p: "http://img/i.png")
    inserted = {}
    monkeypatch.setattr(g, "insert_item", lambda it, c, urls: inserted.update({"urls": urls}) or "id1")
    estados = []
    monkeypatch.setattr(g, "set_status", lambda i, s: estados.append(s))
    assert g.procesar_item(item) == "id1"
    assert inserted["urls"] == ["http://img/i.png"] and estados == ["approved"]

def test_procesar_item_rechazado_no_inserta(monkeypatch, tmp_path):
    item = {"tema": "mitos", "formato": "mito", "plantilla": "tarjeta", "channels": ["grupo"],
            "scheduled_at": datetime(2026, 8, 4, tzinfo=timezone.utc), "source": "fb_cdmx"}
    png = tmp_path / "i.png"; png.write_bytes(b"p")
    monkeypatch.setattr(g, "generate_copy", lambda it, feedback=None: {"titulo": "t", "bullets": [], "captions": {}, "laminas": []})
    monkeypatch.setattr(g, "render_item", lambda it, c, d: [png])
    monkeypatch.setattr(g, "send_for_review", lambda paths, cap, key: None)
    monkeypatch.setattr(g, "wait_decision", lambda key, timeout_s=900: ("no", None))
    assert g.procesar_item(item) is None
