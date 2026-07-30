import src.review as rv

def _env(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "tt")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")

class R:
    def __init__(self, data): self._d = data
    def json(self): return self._d
    def raise_for_status(self): pass

def test_send_for_review_manda_botones(monkeypatch, tmp_path):
    _env(monkeypatch)
    png = tmp_path / "a.png"; png.write_bytes(b"x")
    calls = []
    monkeypatch.setattr(rv.requests, "post", lambda url, data=None, files=None, json=None, timeout=None: (calls.append((url, data, json)), R({"ok": True}))[1])
    rv.send_for_review([png], "caption", "item1")
    url, data, _ = calls[0]
    assert "sendPhoto" in url
    assert "ok:item1" in data["reply_markup"] and "re:item1" in data["reply_markup"]

def test_wait_decision_parsea_callback(monkeypatch):
    _env(monkeypatch)
    updates = [{"ok": True, "result": [
        {"update_id": 1, "callback_query": {"id": "cq", "data": "ok:item1"}},
    ]}, {"ok": True, "result": []}]
    monkeypatch.setattr(rv.requests, "get", lambda url, params=None, timeout=None: R(updates.pop(0)))
    monkeypatch.setattr(rv.requests, "post", lambda url, data=None, json=None, timeout=None: R({"ok": True}))
    decision, feedback = rv.wait_decision("item1", timeout_s=5)
    assert decision == "ok" and feedback is None

def test_wait_decision_confirma_offset(monkeypatch):
    _env(monkeypatch)
    get_calls = []
    updates = [{"ok": True, "result": [
        {"update_id": 1, "callback_query": {"id": "cq", "data": "ok:item1"}},
    ]}, {"ok": True, "result": []}]
    def mock_get(url, params=None, timeout=None):
        get_calls.append((url, params))
        return R(updates.pop(0))
    monkeypatch.setattr(rv.requests, "get", mock_get)
    monkeypatch.setattr(rv.requests, "post", lambda url, data=None, json=None, timeout=None: R({"ok": True}))
    decision, feedback = rv.wait_decision("item1", timeout_s=5)
    assert decision == "ok" and feedback is None
    # Verificar que se hizo un GET con offset=2 para confirmar el offset
    assert len(get_calls) == 2
    _, confirm_params = get_calls[1]
    assert confirm_params["offset"] == 2
