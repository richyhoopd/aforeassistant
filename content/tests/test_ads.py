import src.ads as ads

class R:
    def __init__(self, data): self._d = data
    def json(self): return self._d
    def raise_for_status(self): pass

def test_dormido_sin_account_id(monkeypatch):
    monkeypatch.delenv("ADS_ACCOUNT_ID", raising=False)
    def explota(*a, **k): raise AssertionError("no debe llamar a la red")
    monkeypatch.setattr(ads.requests, "get", explota)
    assert ads.collect_ads("2026-08-05") == 0

def test_recolecta_campanias(monkeypatch):
    monkeypatch.setenv("ADS_ACCOUNT_ID", "123")
    monkeypatch.setenv("FB_PAGE_TOKEN", "ptok")
    data = {"data": [{
        "campaign_id": "c1", "campaign_name": "Antisapo", "spend": "45.30",
        "impressions": "1000", "clicks": "80",
        "actions": [{"action_type": "lead", "value": "5"}, {"action_type": "link_click", "value": "70"}],
    }]}
    calls = []
    monkeypatch.setattr(ads.requests, "get", lambda url, params=None, timeout=None: (calls.append(url), R(data))[1])
    rows = []
    monkeypatch.setattr(ads, "upsert_ad_metric", lambda row: rows.append(row))
    assert ads.collect_ads("2026-08-05") == 1
    assert "act_123/insights" in calls[0]
    assert rows[0] == {"campaign_id": "c1", "campaign_name": "Antisapo", "snapshot_date": "2026-08-05",
                       "spend": 45.3, "impressions": 1000, "clicks": 80, "leads_reported": 5}

def test_usa_ads_token_dedicado(monkeypatch):
    monkeypatch.setenv("ADS_ACCOUNT_ID", "123")
    monkeypatch.setenv("ADS_TOKEN", "adstok")
    monkeypatch.setenv("FB_PAGE_TOKEN", "ptok")
    data = {"data": []}
    calls = []
    monkeypatch.setattr(ads.requests, "get", lambda url, params=None, timeout=None: (calls.append(params), R(data))[1])
    ads.collect_ads("2026-08-05")
    assert calls[0]["access_token"] == "adstok"
