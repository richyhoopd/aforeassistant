import publish as pw


def test_run_publica_por_canal_y_registra(monkeypatch):
    fila = {
        "id": "abc",
        "channels": ["fb_page", "ig"],
        "publish_ids": {},
        "image_urls": ["http://i/1.png"],
        "captions": {"fb": "cf", "ig": "ci"},
    }
    monkeypatch.setattr(pw, "due_items", lambda now: [fila])
    registros = []
    monkeypatch.setattr(pw, "record_publish", lambda i, c, p: registros.append((c, p)))
    monkeypatch.setattr(pw, "publish_facebook", lambda urls, cap: "fb1")
    monkeypatch.setattr(pw, "publish_instagram", lambda urls, cap: "ig1")
    out = pw.run("2026-08-03T15:00:00Z")
    assert out == {"published": 2, "failed": 0}
    assert ("fb_page", "fb1") in registros and ("ig", "ig1") in registros


def test_run_falla_un_canal_sigue_el_otro(monkeypatch):
    fila = {
        "id": "abc",
        "channels": ["fb_page", "ig"],
        "publish_ids": {},
        "image_urls": ["http://i/1.png"],
        "captions": {"fb": "cf", "ig": "ci"},
    }
    monkeypatch.setattr(pw, "due_items", lambda now: [fila])
    registros = []
    monkeypatch.setattr(pw, "record_publish", lambda i, c, p: registros.append(c))

    def boom(urls, cap):
        raise RuntimeError("token vencido")

    monkeypatch.setattr(pw, "publish_facebook", boom)
    monkeypatch.setattr(pw, "publish_instagram", lambda urls, cap: "ig1")
    out = pw.run("2026-08-03T15:00:00Z")
    assert out == {"published": 1, "failed": 1} and registros == ["ig"]


def test_run_no_repite_canal_ya_publicado(monkeypatch):
    fila = {
        "id": "abc",
        "channels": ["fb_page", "ig"],
        "publish_ids": {"fb_page": "fb1"},
        "image_urls": ["http://i/1.png"],
        "captions": {"fb": "cf", "ig": "ci"},
    }
    monkeypatch.setattr(pw, "due_items", lambda now: [fila])
    llamado = []
    monkeypatch.setattr(pw, "publish_facebook", lambda urls, cap: llamado.append("fb") or "x")
    monkeypatch.setattr(pw, "publish_instagram", lambda urls, cap: "ig1")
    monkeypatch.setattr(pw, "record_publish", lambda i, c, p: None)
    pw.run("2026-08-03T15:00:00Z")
    assert llamado == []  # fb ya tenía id, no se duplica
