import src.insights as ins

class R:
    def __init__(self, data, ok=True): self._d, self.ok = data, ok
    def json(self): return self._d
    def raise_for_status(self): pass

def _env(monkeypatch):
    monkeypatch.setenv("FB_PAGE_TOKEN", "ptok")

def test_fetch_fb_insights_arma_metricas(monkeypatch):
    _env(monkeypatch)
    resp = [
        R({"reactions": {"summary": {"total_count": 7}}, "comments": {"summary": {"total_count": 2}}, "shares": {"count": 3}}),
        R({"data": [{"name": "post_impressions_unique", "values": [{"value": 150}]}]}),
    ]
    monkeypatch.setattr(ins.requests, "get", lambda url, params=None, timeout=None: resp.pop(0))
    out = ins.fetch_fb_insights("pg_1")
    assert out == {"reactions": 7, "comments": 2, "shares": 3, "reach": 150}

def test_fetch_ig_insights_mapea_data(monkeypatch):
    _env(monkeypatch)
    data = {"data": [{"name": "reach", "values": [{"value": 90}]}, {"name": "likes", "values": [{"value": 12}]}]}
    monkeypatch.setattr(ins.requests, "get", lambda url, params=None, timeout=None: R(data))
    assert ins.fetch_ig_insights("m1") == {"reach": 90, "likes": 12}

def test_collect_salta_sent_y_sigue_ante_error(monkeypatch):
    _env(monkeypatch)
    items = [
        {"id": "a", "publish_ids": {"fb_page": "fb1", "ig": "ig1"}},
        {"id": "b", "publish_ids": {"grupo": "sent"}},
        {"id": "c", "publish_ids": {"ig": "ig2"}},
    ]
    monkeypatch.setattr(ins, "published_items", lambda: items)
    def fb(post_id): return {"reach": 1}
    def ig(media_id):
        if media_id == "ig2":
            raise RuntimeError("token vencido")
        return {"reach": 2}
    monkeypatch.setattr(ins, "fetch_fb_insights", fb)
    monkeypatch.setattr(ins, "fetch_ig_insights", ig)
    saved = []
    monkeypatch.setattr(ins, "upsert_metric", lambda i, c, d, m: saved.append((i, c)))
    assert ins.collect("2026-08-05") == 2
    assert ("a", "fb_page") in saved and ("a", "ig") in saved
    assert not any(i == "b" for i, _ in saved)  # "sent" no es un id de Graph
