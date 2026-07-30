import src.handoff as ho


def test_send_package_manda_imagen_y_texto(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "tt")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")
    calls = []

    class R:
        def json(self):
            return {"ok": True}

        def raise_for_status(self):
            pass

    monkeypatch.setattr(
        ho.requests,
        "post",
        lambda url, json=None, timeout=None: (calls.append((url, json)), R())[1],
    )
    item = {
        "channels": ["grupo"],
        "source": "fb_cdmx",
        "image_urls": ["http://i/1.png"],
        "captions": {"grupo": "texto para el grupo"},
    }
    assert ho.send_package(item) == "sent"
    urls = [u for u, _ in calls]
    assert any("sendPhoto" in u for u in urls) and any("sendMessage" in u for u in urls)
    texto = next(j["text"] for u, j in calls if "sendMessage" in u)
    assert "fb_cdmx" in texto and "texto para el grupo" in texto
