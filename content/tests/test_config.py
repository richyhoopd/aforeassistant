from src.config import cfg

def test_cfg_lee_env(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "http://x")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "sk")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "dk")
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "tt")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")
    c = cfg()
    assert c.supabase_url == "http://x"
    assert c.site_url == "https://www.pensionmas.com.mx"  # default
