import src.publishers as pb

def _env(monkeypatch):
    monkeypatch.setenv("FB_PAGE_ID", "pg1")
    monkeypatch.setenv("FB_PAGE_TOKEN", "ptok")
    monkeypatch.setenv("IG_USER_ID", "ig1")

class R:
    def __init__(self, data): self._d = data
    def json(self): return self._d
    def raise_for_status(self): pass

def test_publish_facebook(monkeypatch):
    _env(monkeypatch)
    calls = []
    monkeypatch.setattr(pb.requests, "post", lambda url, data=None, timeout=None: (calls.append((url, data)), R({"post_id": "fb9"}))[1])
    assert pb.publish_facebook(["http://i/1.png"], "hola") == "fb9"
    url, data = calls[0]
    assert url.endswith("/pg1/photos") and data["url"] == "http://i/1.png"

def test_publish_instagram_single(monkeypatch):
    _env(monkeypatch)
    resp = [R({"id": "cont1"}), R({"id": "media1"})]
    calls = []
    monkeypatch.setattr(pb.requests, "post", lambda url, data=None, timeout=None: (calls.append((url, data)), resp.pop(0))[1])
    assert pb.publish_instagram(["http://i/1.png"], "cap") == "media1"
    assert calls[0][0].endswith("/ig1/media") and calls[1][0].endswith("/ig1/media_publish")

def test_publish_instagram_carrusel(monkeypatch):
    _env(monkeypatch)
    resp = [R({"id": f"c{i}"}) for i in range(2)] + [R({"id": "carr"}), R({"id": "media2"})]
    calls = []
    monkeypatch.setattr(pb.requests, "post", lambda url, data=None, timeout=None: (calls.append((url, data)), resp.pop(0))[1])
    assert pb.publish_instagram(["http://i/1.png", "http://i/2.png"], "cap") == "media2"
    assert calls[0][1]["is_carousel_item"] == "true"
    assert calls[2][1]["media_type"] == "CAROUSEL" and calls[2][1]["children"] == "c0,c1"
