import json
import src.copywriter as cw

FAKE = {
    "titulo": "¿Sin trabajo 46 días? Tu AFORE tiene un apoyo",
    "bullets": ["Es TU dinero, no un préstamo", "Cuenta con 3+ años", "No usado en 5 años"],
    "captions": {"fb": "texto fb [LINK]", "ig": "texto ig", "grupo": "texto grupo [LINK]", "tiktok": "texto tt"},
    "laminas": [],
}

def _stub_deepseek(monkeypatch, contenido, capturas):
    class R:
        status_code = 200
        def json(self):
            return {"choices": [{"message": {"content": json.dumps(contenido)}}]}
        def raise_for_status(self): pass
    def fake_post(url, headers=None, json=None, timeout=None):
        capturas.append({"url": url, "body": json})
        return R()
    monkeypatch.setattr(cw.requests, "post", fake_post)

def test_generate_copy_estructura_y_link(monkeypatch):
    monkeypatch.setenv("DEEPSEEK_API_KEY", "dk")
    caps = []
    _stub_deepseek(monkeypatch, FAKE, caps)
    item = {"tema": "requisitos", "formato": "sabias_que", "channels": ["fb_page", "ig"], "source": "fb_page"}
    out = cw.generate_copy(item)
    assert out["titulo"] and len(out["bullets"]) >= 3
    # [LINK] se reemplaza por el pre-calificador con ?source=
    assert "pre-calificador?source=fb_page" in out["captions"]["fb"]
    assert "[LINK]" not in json.dumps(out["captions"])

def test_prompt_incluye_principios_y_feedback(monkeypatch):
    monkeypatch.setenv("DEEPSEEK_API_KEY", "dk")
    caps = []
    _stub_deepseek(monkeypatch, FAKE, caps)
    item = {"tema": "mitos", "formato": "mito", "channels": ["grupo"], "source": "fb_cdmx"}
    cw.generate_copy(item, feedback="menos emojis")
    prompt = json.dumps(caps[0]["body"], ensure_ascii=False)
    assert "gratuito" in prompt          # principio anti-coyote embebido
    assert "menos emojis" in prompt      # feedback de regeneración
    assert caps[0]["body"]["response_format"] == {"type": "json_object"}
