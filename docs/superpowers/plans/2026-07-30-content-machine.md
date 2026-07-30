# Máquina de contenido social — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pipeline Python (en `content/` de este repo, dockerizado) que genera copy con DeepSeek + imágenes HTML→PNG con Playwright, se aprueba por Telegram, guarda estado en Supabase, y publica automático en página FB + Instagram (GitHub Actions cron) y semi-automático (paquete por Telegram) para grupos FB y TikTok.

**Architecture:** Dos procesos estilo instagod: `generate.py` (local/docker, on-demand, interactivo vía Telegram) y `publish.py` (GitHub Actions cron diario, sin interacción). Estado en tabla `content_items` de Supabase; imágenes en bucket público `content-media` de Supabase Storage. Spec: `docs/superpowers/specs/2026-07-30-contenido-social-design.md`.

**Tech Stack:** Python 3.12, requests, Jinja2, Playwright/Chromium, pytest. Sin frameworks de bot (long-polling crudo de Telegram). Supabase vía PostgREST/Storage REST (sin SDK).

## Global Constraints

- Principios editoriales de `docs/marketing/estrategia.md` van EMBEBIDOS en el prompt de DeepSeek: valor primero; cero promesas de monto ("podrías calificar", nunca "retira $X"); decir que el trámite es gratuito y personal; sin urgencia falsa; no hacerse pasar por IMSS/AFORE/CONSAR; CTA suave con `?source=`.
- Nunca commitear tokens: todo secreto vive en `content/.env` (gitignored) y en GitHub Secrets.
- Python: snake_case, type hints, sin clases donde una función baste.
- Cada módulo de `content/src/` se testea con pytest y mocks de HTTP (monkeypatch de `requests`); Playwright solo en el smoke test marcado `slow`.
- URLs públicas: `SITE_URL` default `https://www.pensionmas.com.mx`.
- Identidad git del repo: `richyhoopd <ricardommmmg@gmail.com>` (ya configurada local). Sin firmas de IA en commits.

## Estructura de archivos

```
content/
  .env.example          # variables documentadas
  requirements.txt
  Dockerfile
  docker-compose.yml    # servicio "content" (generación local)
  pytest.ini
  generate.py           # ENTRYPOINT proceso A
  publish.py            # ENTRYPOINT proceso B
  assets/               # logo, fuentes, fotos (Ricardo los suelta aquí)
  templates/            # Jinja2 HTML: tarjeta.html, checklist.html, lamina.html
  src/
    config.py           # carga de env
    catalog.py          # temas, formatos, grupos, plan_semana()
    copywriter.py       # DeepSeek
    render.py           # Jinja2 + Playwright
    db.py               # Supabase REST (items + storage)
    review.py           # aprobación por Telegram
    publishers.py       # FB Pages + IG Graph
    handoff.py          # paquete diario grupos/TikTok por Telegram
  tests/
    test_catalog.py  test_copywriter.py  test_render.py
    test_db.py  test_review.py  test_publishers.py  test_handoff.py
supabase/migrations/0003_content_items.sql
.github/workflows/content-publish.yml
```

---

### Task 1: Migración `content_items` + bucket `content-media`

**Files:**
- Create: `supabase/migrations/0003_content_items.sql`

**Interfaces:**
- Produces: tabla `content_items` y bucket público `content-media` que usan `db.py` (Task 6) y el resto del pipeline.

- [ ] **Step 1: Escribir la migración**

```sql
-- supabase/migrations/0003_content_items.sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tema TEXT NOT NULL,
  formato TEXT NOT NULL,
  plantilla TEXT NOT NULL DEFAULT 'tarjeta',
  copy_base TEXT,
  captions JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {"fb": "...", "ig": "...", "grupo": "...", "tiktok": "..."}
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- lista de URLs públicas (1..5 láminas)
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,   -- ["fb_page","ig","grupo","tiktok"]
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','published')),
  scheduled_at TIMESTAMPTZ,
  source TEXT,                                   -- ?source= para atribución
  publish_ids JSONB NOT NULL DEFAULT '{}'::jsonb,-- {"fb_page": "id", "ig": "id", "handoff": "sent"}
  last_error TEXT
);

-- Solo el service role toca esta tabla (RLS sin políticas).
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public) VALUES ('content-media','content-media', true)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Aplicar y verificar en local**

Run: `npx supabase db reset` (o `npx supabase migration up` si no quieres resetear datos locales)
Luego: `psql "$(npx supabase status --output json | jq -r .DB_URL 2>/dev/null || echo postgresql://postgres:postgres@127.0.0.1:54322/postgres)" -c "\d content_items" -c "select id, public from storage.buckets where id='content-media'"`
Expected: tabla con las columnas de arriba y bucket `content-media | t`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0003_content_items.sql
git commit -m "feat(content): tabla content_items y bucket content-media"
```

---

### Task 2: Scaffold `content/` + `config.py`

**Files:**
- Create: `content/requirements.txt`, `content/pytest.ini`, `content/.env.example`, `content/src/__init__.py`, `content/src/config.py`, `content/tests/test_config.py`
- Modify: `.gitignore` (agregar `content/.env`, `content/out/`)

**Interfaces:**
- Produces: `config.cfg() -> Config` (dataclass) con: `supabase_url, supabase_service_key, deepseek_api_key, telegram_token, telegram_chat_id, fb_page_id, fb_page_token, ig_user_id, site_url`. Todos los módulos posteriores lo consumen.

- [ ] **Step 1: requirements, pytest.ini y .env.example**

```
# content/requirements.txt
requests==2.32.3
jinja2==3.1.4
playwright==1.49.0
python-dotenv==1.0.1
pytest==8.3.4
```

```ini
# content/pytest.ini
[pytest]
testpaths = tests
markers =
    slow: tests que requieren Chromium instalado
```

```bash
# content/.env.example — copiar a content/.env y llenar
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=
DEEPSEEK_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
FB_PAGE_ID=
FB_PAGE_TOKEN=
IG_USER_ID=
SITE_URL=https://www.pensionmas.com.mx
```

- [ ] **Step 2: Test que falla**

```python
# content/tests/test_config.py
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
```

- [ ] **Step 3: Verificar que falla**

Run: `cd content && python -m pytest tests/test_config.py -v`
Expected: FAIL (ModuleNotFoundError o ImportError).

- [ ] **Step 4: Implementación mínima**

```python
# content/src/config.py
from __future__ import annotations
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Config:
    supabase_url: str
    supabase_service_key: str
    deepseek_api_key: str
    telegram_token: str
    telegram_chat_id: str
    fb_page_id: str
    fb_page_token: str
    ig_user_id: str
    site_url: str

def cfg() -> Config:
    return Config(
        supabase_url=os.environ.get("SUPABASE_URL", ""),
        supabase_service_key=os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""),
        deepseek_api_key=os.environ.get("DEEPSEEK_API_KEY", ""),
        telegram_token=os.environ.get("TELEGRAM_BOT_TOKEN", ""),
        telegram_chat_id=os.environ.get("TELEGRAM_CHAT_ID", ""),
        fb_page_id=os.environ.get("FB_PAGE_ID", ""),
        fb_page_token=os.environ.get("FB_PAGE_TOKEN", ""),
        ig_user_id=os.environ.get("IG_USER_ID", ""),
        site_url=os.environ.get("SITE_URL", "https://www.pensionmas.com.mx"),
    )
```

- [ ] **Step 5: Verificar que pasa + commit**

Run: `cd content && python -m pytest -v` → PASS.

```bash
git add content/ .gitignore
git commit -m "feat(content): scaffold del pipeline y config por env"
```

---

### Task 3: `catalog.py` — temas, formatos, grupos y plan semanal

**Files:**
- Create: `content/src/catalog.py`, `content/tests/test_catalog.py`

**Interfaces:**
- Produces:
  - `TEMAS: list[dict]` (code, titulo) — los 10 de estrategia.md.
  - `FORMATOS: list[str]` — `["mito","checklist","sabias_que","caso","anticoyote","pregunta","coyuntura","carrusel"]`.
  - `GRUPOS: list[dict]` (nombre, source) — los 6 de grupos.md.
  - `plan_semana(inicio: datetime.date) -> list[dict]` — items con claves `tema, formato, plantilla, channels, scheduled_at (datetime UTC), source`.
- Reglas: 3 piezas/sem para `["fb_page","ig"]` (lun/mié/vie 15:00 UTC): 1 educativa, 1 anticoyote/confianza, 1 caso o mito. 3 piezas/sem para `["grupo"]` (mar/jue/sáb) con `source` del grupo en turno (rotación por semana ISO + índice). 2 piezas/sem `["tiktok"]` (mié/sáb) formato `carrusel` con plantilla `lamina`. Sin temas repetidos dentro de la misma semana.

- [ ] **Step 1: Test que falla**

```python
# content/tests/test_catalog.py
from datetime import date
from src.catalog import FORMATOS, GRUPOS, TEMAS, plan_semana

def test_plan_semana_estructura():
    items = plan_semana(date(2026, 8, 3))  # lunes
    assert len(items) == 8  # 3 fb+ig, 3 grupo, 2 tiktok
    assert sum(1 for i in items if i["channels"] == ["fb_page", "ig"]) == 3
    assert sum(1 for i in items if i["channels"] == ["grupo"]) == 3
    assert sum(1 for i in items if i["channels"] == ["tiktok"]) == 2

def test_grupo_items_llevan_source_valido():
    items = plan_semana(date(2026, 8, 3))
    sources = {g["source"] for g in GRUPOS}
    for i in items:
        if i["channels"] == ["grupo"]:
            assert i["source"] in sources

def test_temas_no_se_repiten_en_la_semana():
    items = plan_semana(date(2026, 8, 3))
    temas = [i["tema"] for i in items]
    assert len(temas) == len(set(temas))

def test_rotacion_cambia_por_semana():
    s1 = [i for i in plan_semana(date(2026, 8, 3)) if i["channels"] == ["grupo"]]
    s2 = [i for i in plan_semana(date(2026, 8, 10)) if i["channels"] == ["grupo"]]
    assert [i["source"] for i in s1] != [i["source"] for i in s2]

def test_catalogo_completo():
    assert len(TEMAS) == 10 and len(FORMATOS) == 8 and len(GRUPOS) == 6
```

- [ ] **Step 2: Verificar que falla** — `cd content && python -m pytest tests/test_catalog.py -v` → FAIL (import).

- [ ] **Step 3: Implementación**

```python
# content/src/catalog.py
"""Catálogo editorial: qué se publica, dónde y cuándo.

Fuente: docs/marketing/estrategia.md y grupos.md. Determinista por fecha para
que generate.py sea re-ejecutable sin duplicar el plan.
"""
from __future__ import annotations
from datetime import date, datetime, time, timedelta, timezone

TEMAS = [
    {"code": "requisitos", "titulo": "Requisitos del retiro por desempleo (46 días, 3/5 años, una vez cada 5 años)"},
    {"code": "modalidad_ab", "titulo": "Modalidad A vs B explicada con peras y manzanas"},
    {"code": "tramite_gratis", "titulo": "El trámite es GRATIS — cuidado con quien te cobra por hacerlo"},
    {"code": "semanas", "titulo": "Cómo saber cuántas semanas cotizadas tienes (IMSS Digital / AforeWeb)"},
    {"code": "cuando_no", "titulo": "El retiro descuenta semanas: cuándo SÍ conviene y cuándo NO"},
    {"code": "reintegro", "titulo": "Cómo recuperar las semanas descontadas (reintegro)"},
    {"code": "errores", "titulo": "Errores comunes que hacen que rechacen la solicitud"},
    {"code": "que_afore", "titulo": "Qué AFORE tengo y cómo localizarla si no sé"},
    {"code": "mitos", "titulo": "Mitos: es un préstamo, pierdes tu AFORE, solo con abogado"},
    {"code": "checklist_docs", "titulo": "Checklist de documentos antes de ir a tu AFORE"},
]

FORMATOS = ["mito", "checklist", "sabias_que", "caso", "anticoyote", "pregunta", "coyuntura", "carrusel"]

GRUPOS = [
    {"nombre": "Bolsa de Trabajo. México", "source": "fb_bolsa_mx"},
    {"nombre": "Bolsa de trabajo CDMX", "source": "fb_cdmx"},
    {"nombre": "BOLSA DE TRABAJO MONTERREY", "source": "fb_mty"},
    {"nombre": "Empleos Bolsa de Trabajo Mexicali", "source": "fb_mxli"},
    {"nombre": "BOLSA DE TRABAJO", "source": "fb_bolsa"},
    {"nombre": "VACANTES DE EMPLEO", "source": "fb_vacantes"},
]

_HORA_UTC = time(15, 0)  # 9:00 CDMX

def _dt(d: date) -> datetime:
    return datetime.combine(d, _HORA_UTC, tzinfo=timezone.utc)

def plan_semana(inicio: date) -> list[dict]:
    """8 piezas de la semana que empieza en `inicio` (lunes)."""
    semana = inicio.isocalendar().week
    temas = TEMAS[(semana * 3) % len(TEMAS):] + TEMAS[:(semana * 3) % len(TEMAS)]
    pool = iter(temas)
    items: list[dict] = []
    # Página FB + IG: lun educativo, mié anticoyote/confianza, vie caso o mito
    for offset, formato in [(0, "sabias_que"), (2, "anticoyote"), (4, "caso" if semana % 2 else "mito")]:
        items.append({
            "tema": next(pool)["code"], "formato": formato, "plantilla": "tarjeta",
            "channels": ["fb_page", "ig"], "scheduled_at": _dt(inicio + timedelta(days=offset)),
            "source": "fb_page" if offset != 0 else "ig_perfil",
        })
    # Grupos: mar/jue/sáb, grupo en turno rota por semana
    for n, offset in enumerate([1, 3, 5]):
        grupo = GRUPOS[(semana + n) % len(GRUPOS)]
        items.append({
            "tema": next(pool)["code"], "formato": "caso" if n == 2 else "checklist",
            "plantilla": "tarjeta", "channels": ["grupo"],
            "scheduled_at": _dt(inicio + timedelta(days=offset)), "source": grupo["source"],
        })
    # TikTok: mié/sáb carruseles
    for offset in [2, 5]:
        items.append({
            "tema": next(pool)["code"], "formato": "carrusel", "plantilla": "lamina",
            "channels": ["tiktok"], "scheduled_at": _dt(inicio + timedelta(days=offset)),
            "source": "tiktok",
        })
    return items
```

- [ ] **Step 4: Verificar que pasa** — `python -m pytest tests/test_catalog.py -v` → PASS (5/5).

- [ ] **Step 5: Commit** — `git add content/src/catalog.py content/tests/test_catalog.py && git commit -m "feat(content): catálogo editorial y plan semanal determinista"`

---

### Task 4: `copywriter.py` — DeepSeek

**Files:**
- Create: `content/src/copywriter.py`, `content/tests/test_copywriter.py`

**Interfaces:**
- Consumes: `cfg()` de Task 2; items de `plan_semana()` de Task 3.
- Produces: `generate_copy(item: dict, feedback: str | None = None) -> dict` con claves: `titulo` (para la imagen, ≤60 chars), `bullets` (list[str], 3-5, para la imagen), `captions` (dict con `fb`, `ig`, `grupo`, `tiktok`), `laminas` (list[dict] con `titulo`+`bullets`, solo formato carrusel, 5 elementos; si no, lista vacía). DeepSeek API: POST `https://api.deepseek.com/chat/completions`, modelo `deepseek-chat`, `response_format={"type":"json_object"}`.

- [ ] **Step 1: Test que falla**

```python
# content/tests/test_copywriter.py
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
```

- [ ] **Step 2: Verificar que falla** — `python -m pytest tests/test_copywriter.py -v` → FAIL.

- [ ] **Step 3: Implementación**

```python
# content/src/copywriter.py
from __future__ import annotations
import json
import requests
from .catalog import TEMAS
from .config import cfg

_URL = "https://api.deepseek.com/chat/completions"

_SISTEMA = """Eres el redactor de Pensión+, asesoría honesta de retiro AFORE por desempleo en México.
Principios NO negociables:
- Valor primero: cada pieza enseña algo útil aunque nadie nos contrate.
- CERO promesas de monto: jamás "retira $20,000"; siempre "podrías calificar" o "calcula tu estimado".
- Decir siempre: el trámite es gratuito y personal ante tu AFORE; nosotros cobramos por asesorar y SOLO si recibes tu retiro.
- Sin urgencia falsa. Nunca hacerse pasar por IMSS/AFORE/CONSAR. Nunca pedir NSS/CURP en redes.
- CTA suave al pre-calificador usando el marcador [LINK] tal cual.
- Español mexicano, cercano, sin tecnicismos. Emojis moderados en grupos, sobrios en página.
Responde SOLO JSON con: titulo (<=60 chars), bullets (3-5 strings cortos),
captions {fb, ig, grupo, tiktok}, laminas (si formato=carrusel: 5 objetos {titulo, bullets}; si no: [])."""

def generate_copy(item: dict, feedback: str | None = None) -> dict:
    tema = next(t["titulo"] for t in TEMAS if t["code"] == item["tema"])
    user = f"Tema: {tema}\nFormato: {item['formato']}\nCanales: {item['channels']}"
    if feedback:
        user += f"\nAjuste pedido por el editor (obligatorio): {feedback}"
    body = {
        "model": "deepseek-chat",
        "messages": [{"role": "system", "content": _SISTEMA}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"},
        "temperature": 1.1,
    }
    r = requests.post(_URL, headers={"Authorization": f"Bearer {cfg().deepseek_api_key}"}, json=body, timeout=90)
    r.raise_for_status()
    out = json.loads(r.json()["choices"][0]["message"]["content"])
    link = f"{cfg().site_url}/pre-calificador?source={item.get('source', 'organico')}"
    out["captions"] = {k: v.replace("[LINK]", link) for k, v in out.get("captions", {}).items()}
    out.setdefault("laminas", [])
    return out
```

- [ ] **Step 4: Verificar que pasa** — `python -m pytest tests/test_copywriter.py -v` → PASS.

- [ ] **Step 5: Commit** — `git add content/src/copywriter.py content/tests/test_copywriter.py && git commit -m "feat(content): copywriter DeepSeek con principios editoriales embebidos"`

---

### Task 5: `render.py` — plantillas Jinja2 + Playwright

**Files:**
- Create: `content/src/render.py`, `content/templates/base.html`, `content/templates/tarjeta.html`, `content/templates/lamina.html`, `content/tests/test_render.py`, `content/assets/.gitkeep`

**Interfaces:**
- Consumes: dict de `generate_copy()` (Task 4).
- Produces: `render_item(item: dict, copy: dict, out_dir: Path) -> list[Path]` — 1 PNG 1080×1350 para `tarjeta`; 5 PNGs para `lamina` (carrusel). `render_html(plantilla: str, contexto: dict) -> str` (puro, testeable sin navegador).

- [ ] **Step 1: Test que falla**

```python
# content/tests/test_render.py
from pathlib import Path
import pytest
from src.render import render_html, render_item

def test_render_html_tarjeta_incluye_contenido():
    html = render_html("tarjeta", {
        "titulo": "Título de prueba", "bullets": ["uno", "dos", "tres"],
        "fuente": "CONSAR", "kicker": "AFORE POR DESEMPLEO",
    })
    assert "Título de prueba" in html and "uno" in html
    assert "gratuito" in html.lower()  # disclaimer fijo en la plantilla

@pytest.mark.slow
def test_render_item_produce_png(tmp_path):
    copy = {"titulo": "T", "bullets": ["a", "b", "c"], "captions": {}, "laminas": []}
    item = {"tema": "requisitos", "formato": "sabias_que", "plantilla": "tarjeta"}
    paths = render_item(item, copy, tmp_path)
    assert len(paths) == 1 and paths[0].stat().st_size > 10_000

@pytest.mark.slow
def test_render_item_carrusel_5_laminas(tmp_path):
    lam = [{"titulo": f"L{i}", "bullets": ["x"]} for i in range(5)]
    copy = {"titulo": "T", "bullets": [], "captions": {}, "laminas": lam}
    item = {"tema": "modalidad_ab", "formato": "carrusel", "plantilla": "lamina"}
    assert len(render_item(item, copy, tmp_path)) == 5
```

- [ ] **Step 2: Verificar que falla** — `python -m pytest tests/test_render.py -v -m "not slow"` → FAIL.

- [ ] **Step 3: Plantillas**

```html
<!-- content/templates/base.html -->
<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; font-family:'Helvetica Neue',Arial,sans-serif; }
  body { width:1080px; height:1350px; background:#0e2a47; color:#fff;
         display:flex; flex-direction:column; padding:72px; }
  .kicker { font-size:30px; letter-spacing:4px; color:#7fd1b9; font-weight:700; }
  h1 { font-size:76px; line-height:1.12; margin:36px 0 48px; }
  ul { list-style:none; }
  li { font-size:42px; line-height:1.35; margin-bottom:28px; padding-left:56px; position:relative; }
  li::before { content:"✓"; position:absolute; left:0; color:#7fd1b9; font-weight:700; }
  footer { margin-top:auto; border-top:2px solid rgba(255,255,255,.25); padding-top:32px;
           font-size:26px; color:rgba(255,255,255,.75); display:flex; justify-content:space-between; }
  .marca { font-weight:800; color:#7fd1b9; font-size:30px; }
</style></head>
<body>
  {% block cuerpo %}{% endblock %}
  <footer>
    <div>El trámite ante tu AFORE es gratuito · {{ fuente or "Fuente: CONSAR" }}</div>
    <div class="marca">Pensión+</div>
  </footer>
</body></html>
```

```html
<!-- content/templates/tarjeta.html -->
{% extends "base.html" %}
{% block cuerpo %}
  <div class="kicker">{{ kicker or "AFORE POR DESEMPLEO" }}</div>
  <h1>{{ titulo }}</h1>
  <ul>{% for b in bullets %}<li>{{ b }}</li>{% endfor %}</ul>
{% endblock %}
```

```html
<!-- content/templates/lamina.html -->
{% extends "base.html" %}
{% block cuerpo %}
  <div class="kicker">{{ kicker or "AFORE POR DESEMPLEO" }} · {{ n }}/{{ total }}</div>
  <h1>{{ titulo }}</h1>
  <ul>{% for b in bullets %}<li>{{ b }}</li>{% endfor %}</ul>
{% endblock %}
```

- [ ] **Step 4: Implementación**

```python
# content/src/render.py
from __future__ import annotations
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

_TPL_DIR = Path(__file__).parent.parent / "templates"
_env = Environment(loader=FileSystemLoader(_TPL_DIR))

def render_html(plantilla: str, contexto: dict) -> str:
    return _env.get_template(f"{plantilla}.html").render(**contexto)

def _screenshot(html: str, out: Path) -> None:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 1350})
        page.set_content(html, wait_until="networkidle")
        page.screenshot(path=str(out))
        browser.close()

def render_item(item: dict, copy: dict, out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    base = f"{item['tema']}_{item['formato']}"
    if item["plantilla"] == "lamina":
        paths = []
        total = len(copy["laminas"])
        for n, lam in enumerate(copy["laminas"], start=1):
            html = render_html("lamina", {**lam, "n": n, "total": total})
            out = out_dir / f"{base}_{n}.png"
            _screenshot(html, out)
            paths.append(out)
        return paths
    html = render_html(item["plantilla"], copy)
    out = out_dir / f"{base}.png"
    _screenshot(html, out)
    return [out]
```

- [ ] **Step 5: Verificar** — `python -m pytest tests/test_render.py -v -m "not slow"` → PASS. Luego `playwright install chromium && python -m pytest tests/test_render.py -v` → PASS los 3 (los slow generan PNGs reales; ábrelos y revisa que se vean bien).

- [ ] **Step 6: Commit** — `git add content/src/render.py content/templates/ content/tests/test_render.py content/assets/.gitkeep && git commit -m "feat(content): render HTML->PNG con Jinja2 y Playwright, plantillas tarjeta y lamina"`

---

### Task 6: `db.py` — Supabase REST (items + storage)

**Files:**
- Create: `content/src/db.py`, `content/tests/test_db.py`

**Interfaces:**
- Consumes: `cfg()`; tabla y bucket de Task 1.
- Produces:
  - `insert_item(item: dict, copy: dict, image_urls: list[str]) -> str` (id)
  - `due_items(now_iso: str) -> list[dict]` — `status=approved` y `scheduled_at <= now`
  - `set_status(item_id: str, status: str) -> None`
  - `record_publish(item_id: str, channel: str, post_id: str) -> None` (merge en `publish_ids`; si todos los `channels` tienen id → `status=published`)
  - `upload_image(path: Path) -> str` (URL pública)

- [ ] **Step 1: Test que falla**

```python
# content/tests/test_db.py
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
```

- [ ] **Step 2: Verificar que falla** — `python -m pytest tests/test_db.py -v` → FAIL.

- [ ] **Step 3: Implementación**

```python
# content/src/db.py
from __future__ import annotations
import time
from pathlib import Path
import requests
from .config import cfg

def _h() -> dict:
    key = cfg().supabase_service_key
    return {"apikey": key, "Authorization": f"Bearer {key}"}

def _rest(path: str) -> str:
    return f"{cfg().supabase_url}/rest/v1/{path}"

def insert_item(item: dict, copy: dict, image_urls: list[str]) -> str:
    body = {
        "tema": item["tema"], "formato": item["formato"], "plantilla": item["plantilla"],
        "copy_base": copy.get("titulo", ""), "captions": copy.get("captions", {}),
        "image_urls": image_urls, "channels": item["channels"],
        "scheduled_at": item["scheduled_at"].isoformat() if item.get("scheduled_at") else None,
        "source": item.get("source"), "status": "pending",
    }
    r = requests.post(_rest("content_items"), headers={**_h(), "Prefer": "return=representation"}, json=body, timeout=30)
    r.raise_for_status()
    return r.json()[0]["id"]

def due_items(now_iso: str) -> list[dict]:
    r = requests.get(_rest("content_items"), headers=_h(),
                     params={"status": "eq.approved", "scheduled_at": f"lte.{now_iso}", "select": "*"}, timeout=30)
    r.raise_for_status()
    return r.json()

def set_status(item_id: str, status: str) -> None:
    r = requests.patch(_rest("content_items"), headers=_h(),
                       params={"id": f"eq.{item_id}"}, json={"status": status}, timeout=30)
    r.raise_for_status()

def record_publish(item_id: str, channel: str, post_id: str) -> None:
    r = requests.get(_rest("content_items"), headers=_h(),
                     params={"id": f"eq.{item_id}", "select": "id,channels,publish_ids"}, timeout=30)
    r.raise_for_status()
    fila = r.json()[0]
    ids = {**fila.get("publish_ids", {}), channel: post_id}
    body: dict = {"publish_ids": ids}
    if all(c in ids for c in fila["channels"]):
        body["status"] = "published"
    rp = requests.patch(_rest("content_items"), headers=_h(), params={"id": f"eq.{item_id}"}, json=body, timeout=30)
    rp.raise_for_status()

def upload_image(path: Path) -> str:
    nombre = f"{int(time.time())}_{path.name}"
    url = f"{cfg().supabase_url}/storage/v1/object/content-media/{nombre}"
    r = requests.post(url, headers={**_h(), "Content-Type": "image/png"}, data=path.read_bytes(), timeout=60)
    r.raise_for_status()
    return f"{cfg().supabase_url}/storage/v1/object/public/content-media/{nombre}"
```

- [ ] **Step 4: Verificar que pasa** — `python -m pytest tests/test_db.py -v` → PASS.

- [ ] **Step 5: Commit** — `git add content/src/db.py content/tests/test_db.py && git commit -m "feat(content): capa Supabase REST para items y storage"`

---

### Task 7: `review.py` — aprobación por Telegram

**Files:**
- Create: `content/src/review.py`, `content/tests/test_review.py`

**Interfaces:**
- Consumes: `cfg()`.
- Produces:
  - `send_for_review(image_paths: list[Path], caption: str, item_key: str) -> None` — manda foto(s) + botones `Aprobar` (`ok:{item_key}`), `Rechazar` (`no:{item_key}`), `Regenerar` (`re:{item_key}`).
  - `wait_decision(item_key: str, timeout_s: int = 900) -> tuple[str, str | None]` — long-polling `getUpdates`; devuelve `("ok"|"no"|"re", feedback)`. Si la decisión es `re` y el siguiente mensaje de texto llega en <60s, ese texto es el feedback.
  - `send_text(text: str) -> None` — mensajes de estado.

- [ ] **Step 1: Test que falla**

```python
# content/tests/test_review.py
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
    ]}]
    monkeypatch.setattr(rv.requests, "get", lambda url, params=None, timeout=None: R(updates.pop(0)))
    monkeypatch.setattr(rv.requests, "post", lambda url, data=None, json=None, timeout=None: R({"ok": True}))
    decision, feedback = rv.wait_decision("item1", timeout_s=5)
    assert decision == "ok" and feedback is None
```

- [ ] **Step 2: Verificar que falla** — `python -m pytest tests/test_review.py -v` → FAIL.

- [ ] **Step 3: Implementación**

```python
# content/src/review.py
from __future__ import annotations
import json
import time
from pathlib import Path
import requests
from .config import cfg

def _api(metodo: str) -> str:
    return f"https://api.telegram.org/bot{cfg().telegram_token}/{metodo}"

def send_text(text: str) -> None:
    requests.post(_api("sendMessage"), json={"chat_id": cfg().telegram_chat_id, "text": text}, timeout=30).raise_for_status()

def send_for_review(image_paths: list[Path], caption: str, item_key: str) -> None:
    markup = json.dumps({"inline_keyboard": [[
        {"text": "✅ Aprobar", "callback_data": f"ok:{item_key}"},
        {"text": "❌ Rechazar", "callback_data": f"no:{item_key}"},
        {"text": "🔄 Regenerar", "callback_data": f"re:{item_key}"},
    ]]})
    # La primera foto lleva caption y botones; extras (carrusel) van simples.
    for n, p in enumerate(image_paths):
        data = {"chat_id": cfg().telegram_chat_id}
        if n == 0:
            data |= {"caption": caption[:1000], "reply_markup": markup}
        with open(p, "rb") as f:
            requests.post(_api("sendPhoto"), data=data, files={"photo": f}, timeout=60).raise_for_status()

def wait_decision(item_key: str, timeout_s: int = 900) -> tuple[str, str | None]:
    offset, fin = 0, time.time() + timeout_s
    decision: str | None = None
    while time.time() < fin:
        r = requests.get(_api("getUpdates"), params={"offset": offset, "timeout": 25}, timeout=35)
        for up in r.json().get("result", []):
            offset = up["update_id"] + 1
            cq = up.get("callback_query")
            if cq and cq.get("data", "").endswith(f":{item_key}"):
                decision = cq["data"].split(":", 1)[0]
                requests.post(_api("answerCallbackQuery"), json={"callback_query_id": cq["id"]}, timeout=30)
                if decision != "re":
                    return decision, None
                fin = time.time() + 60  # ventana corta para feedback de texto
            elif decision == "re" and up.get("message", {}).get("text"):
                return "re", up["message"]["text"]
        if decision == "re" and time.time() >= fin:
            break
    return (decision or "no"), None
```

- [ ] **Step 4: Verificar que pasa** — `python -m pytest tests/test_review.py -v` → PASS.

- [ ] **Step 5: Commit** — `git add content/src/review.py content/tests/test_review.py && git commit -m "feat(content): aprobación por Telegram con botones y feedback de regeneración"`

---

### Task 8: `generate.py` — entrypoint del proceso A

**Files:**
- Create: `content/generate.py`, `content/tests/test_generate.py`

**Interfaces:**
- Consumes: todo lo anterior (`plan_semana`, `generate_copy`, `render_item`, `upload_image`, `insert_item`, `send_for_review`, `wait_decision`, `set_status`).
- Produces: función `procesar_item(item: dict) -> str | None` (id insertado o None si rechazado) y `main()` que corre el lote de la próxima semana. Flujo por item: copy → render → Telegram → si `re`: regenerar con feedback (máx 3 intentos) → si `ok`: subir imágenes, insertar como `approved`; si `no`: no insertar.

- [ ] **Step 1: Test que falla**

```python
# content/tests/test_generate.py
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
```

- [ ] **Step 2: Verificar que falla** — `python -m pytest tests/test_generate.py -v` → FAIL.

- [ ] **Step 3: Implementación**

```python
# content/generate.py
"""ENTRYPOINT Proceso A — genera el lote semanal y lo manda a aprobar por Telegram.

Uso: python generate.py [YYYY-MM-DD]   (lunes de la semana a generar;
default: el próximo lunes). Termina cuando el lote queda resuelto.
"""
from __future__ import annotations
import sys
from datetime import date, timedelta
from pathlib import Path
from src.catalog import plan_semana
from src.copywriter import generate_copy
from src.db import insert_item, set_status, upload_image
from src.render import render_item
from src.review import send_for_review, send_text, wait_decision

OUT = Path(__file__).parent / "out"
MAX_INTENTOS = 3

def procesar_item(item: dict) -> str | None:
    key = f"{item['tema']}_{item['formato']}"
    feedback = None
    for _ in range(MAX_INTENTOS):
        copy = generate_copy(item, feedback=feedback)
        paths = render_item(item, copy, OUT)
        canal = "+".join(item["channels"])
        caption = f"[{canal} · {item['scheduled_at']:%a %d}] {copy['captions'].get(item['channels'][0], copy.get('titulo', ''))}"
        send_for_review(paths, caption, key)
        decision, feedback = wait_decision(key)
        if decision == "ok":
            urls = [upload_image(p) for p in paths]
            item_id = insert_item(item, copy, urls)
            set_status(item_id, "approved")
            return item_id
        if decision == "no":
            return None
    return None

def main() -> None:
    inicio = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else (
        date.today() + timedelta(days=(7 - date.today().weekday()) % 7 or 7))
    items = plan_semana(inicio)
    send_text(f"📅 Lote semana {inicio}: {len(items)} piezas. Vamos una por una.")
    ok = sum(1 for it in items if procesar_item(it))
    send_text(f"✅ Listo: {ok}/{len(items)} aprobadas y programadas.")

if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Verificar** — `python -m pytest tests/test_generate.py -v` → PASS y `python -m pytest -m "not slow"` → todo verde.

- [ ] **Step 5: Commit** — `git add content/generate.py content/tests/test_generate.py && git commit -m "feat(content): entrypoint de generación con lote semanal y reintentos"`

---

### Task 9: `publishers.py` — FB Pages + Instagram Graph

**Files:**
- Create: `content/src/publishers.py`, `content/tests/test_publishers.py`

**Interfaces:**
- Consumes: `cfg()`.
- Produces:
  - `publish_facebook(image_urls: list[str], caption: str) -> str` — POST `https://graph.facebook.com/v23.0/{page_id}/photos` con `url` + `caption` (una foto; si hay varias, publica la primera — carrusel FB es fase 2).
  - `publish_instagram(image_urls: list[str], caption: str) -> str` — 1 imagen: container + publish; 2+: containers `is_carousel_item=true` → container `media_type=CAROUSEL` → publish.

- [ ] **Step 1: Test que falla**

```python
# content/tests/test_publishers.py
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
```

- [ ] **Step 2: Verificar que falla** — `python -m pytest tests/test_publishers.py -v` → FAIL.

- [ ] **Step 3: Implementación**

```python
# content/src/publishers.py
from __future__ import annotations
import requests
from .config import cfg

_G = "https://graph.facebook.com/v23.0"

def publish_facebook(image_urls: list[str], caption: str) -> str:
    c = cfg()
    r = requests.post(f"{_G}/{c.fb_page_id}/photos",
                      data={"url": image_urls[0], "caption": caption, "access_token": c.fb_page_token}, timeout=60)
    r.raise_for_status()
    d = r.json()
    return d.get("post_id") or d["id"]

def _ig_container(data: dict) -> str:
    c = cfg()
    r = requests.post(f"{_G}/{c.ig_user_id}/media", data={**data, "access_token": c.fb_page_token}, timeout=60)
    r.raise_for_status()
    return r.json()["id"]

def publish_instagram(image_urls: list[str], caption: str) -> str:
    c = cfg()
    if len(image_urls) == 1:
        container = _ig_container({"image_url": image_urls[0], "caption": caption})
    else:
        hijos = [_ig_container({"image_url": u, "is_carousel_item": "true"}) for u in image_urls]
        container = _ig_container({"media_type": "CAROUSEL", "children": ",".join(hijos), "caption": caption})
    r = requests.post(f"{_G}/{c.ig_user_id}/media_publish",
                      data={"creation_id": container, "access_token": c.fb_page_token}, timeout=60)
    r.raise_for_status()
    return r.json()["id"]
```

- [ ] **Step 4: Verificar que pasa** — `python -m pytest tests/test_publishers.py -v` → PASS.

- [ ] **Step 5: Commit** — `git add content/src/publishers.py content/tests/test_publishers.py && git commit -m "feat(content): publishers de página FB e Instagram (single y carrusel)"`

---

### Task 10: `handoff.py` + `publish.py` — proceso B completo

**Files:**
- Create: `content/src/handoff.py`, `content/publish.py`, `content/tests/test_handoff.py`, `content/tests/test_publish.py`

**Interfaces:**
- Consumes: `due_items`, `record_publish`, `publish_facebook`, `publish_instagram`, `send_text` y Telegram `sendPhoto` (vía `review.send_for_review` NO — handoff manda sin botones).
- Produces:
  - `handoff.send_package(item: dict) -> str` — manda por Telegram las imágenes (por URL con `sendPhoto`) + el caption del canal (`grupo` o `tiktok`) + instrucción ("Pegar en grupo X con este texto"); devuelve `"sent"`.
  - `publish.run(now_iso: str) -> dict` — recorre `due_items`; por canal pendiente (sin id en `publish_ids`): `fb_page→publish_facebook`, `ig→publish_instagram`, `grupo|tiktok→send_package`; registra con `record_publish`; una excepción en un canal no detiene los demás (guarda `last_error` implícitamente al no registrar y continúa). Devuelve `{"published": n, "failed": m}`.

- [ ] **Step 1: Tests que fallan**

```python
# content/tests/test_handoff.py
import src.handoff as ho

def test_send_package_manda_imagen_y_texto(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "tt")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")
    calls = []
    class R:
        def json(self): return {"ok": True}
        def raise_for_status(self): pass
    monkeypatch.setattr(ho.requests, "post", lambda url, json=None, timeout=None: (calls.append((url, json)), R())[1])
    item = {"channels": ["grupo"], "source": "fb_cdmx", "image_urls": ["http://i/1.png"],
            "captions": {"grupo": "texto para el grupo"}}
    assert ho.send_package(item) == "sent"
    urls = [u for u, _ in calls]
    assert any("sendPhoto" in u for u in urls) and any("sendMessage" in u for u in urls)
    texto = next(j["text"] for u, j in calls if "sendMessage" in u)
    assert "fb_cdmx" in texto and "texto para el grupo" in texto
```

```python
# content/tests/test_publish.py
import publish as pw

def test_run_publica_por_canal_y_registra(monkeypatch):
    fila = {"id": "abc", "channels": ["fb_page", "ig"], "publish_ids": {},
            "image_urls": ["http://i/1.png"], "captions": {"fb": "cf", "ig": "ci"}}
    monkeypatch.setattr(pw, "due_items", lambda now: [fila])
    registros = []
    monkeypatch.setattr(pw, "record_publish", lambda i, c, p: registros.append((c, p)))
    monkeypatch.setattr(pw, "publish_facebook", lambda urls, cap: "fb1")
    monkeypatch.setattr(pw, "publish_instagram", lambda urls, cap: "ig1")
    out = pw.run("2026-08-03T15:00:00Z")
    assert out == {"published": 2, "failed": 0}
    assert ("fb_page", "fb1") in registros and ("ig", "ig1") in registros

def test_run_falla_un_canal_sigue_el_otro(monkeypatch):
    fila = {"id": "abc", "channels": ["fb_page", "ig"], "publish_ids": {},
            "image_urls": ["http://i/1.png"], "captions": {"fb": "cf", "ig": "ci"}}
    monkeypatch.setattr(pw, "due_items", lambda now: [fila])
    registros = []
    monkeypatch.setattr(pw, "record_publish", lambda i, c, p: registros.append(c))
    def boom(urls, cap): raise RuntimeError("token vencido")
    monkeypatch.setattr(pw, "publish_facebook", boom)
    monkeypatch.setattr(pw, "publish_instagram", lambda urls, cap: "ig1")
    out = pw.run("2026-08-03T15:00:00Z")
    assert out == {"published": 1, "failed": 1} and registros == ["ig"]

def test_run_no_repite_canal_ya_publicado(monkeypatch):
    fila = {"id": "abc", "channels": ["fb_page", "ig"], "publish_ids": {"fb_page": "fb1"},
            "image_urls": ["http://i/1.png"], "captions": {"fb": "cf", "ig": "ci"}}
    monkeypatch.setattr(pw, "due_items", lambda now: [fila])
    llamado = []
    monkeypatch.setattr(pw, "publish_facebook", lambda urls, cap: llamado.append("fb") or "x")
    monkeypatch.setattr(pw, "publish_instagram", lambda urls, cap: "ig1")
    monkeypatch.setattr(pw, "record_publish", lambda i, c, p: None)
    pw.run("2026-08-03T15:00:00Z")
    assert llamado == []  # fb ya tenía id, no se duplica
```

- [ ] **Step 2: Verificar que fallan** — `python -m pytest tests/test_handoff.py tests/test_publish.py -v` → FAIL.

- [ ] **Step 3: Implementación**

```python
# content/src/handoff.py
from __future__ import annotations
import requests
from .catalog import GRUPOS
from .config import cfg

def _api(m: str) -> str:
    return f"https://api.telegram.org/bot{cfg().telegram_token}/{m}"

def send_package(item: dict) -> str:
    canal = item["channels"][0]  # "grupo" o "tiktok"
    chat = cfg().telegram_chat_id
    for url in item["image_urls"]:
        requests.post(_api("sendPhoto"), json={"chat_id": chat, "photo": url}, timeout=60).raise_for_status()
    if canal == "grupo":
        nombre = next((g["nombre"] for g in GRUPOS if g["source"] == item["source"]), item["source"])
        instr = f"📋 Pegar HOY en «{nombre}» ({item['source']}) desde tu perfil:"
    else:
        instr = "🎵 Subir HOY a TikTok en photo-mode con este caption:"
    caption = item.get("captions", {}).get(canal, "")
    requests.post(_api("sendMessage"), json={"chat_id": chat, "text": f"{instr}\n\n{caption}"}, timeout=30).raise_for_status()
    return "sent"
```

```python
# content/publish.py
"""ENTRYPOINT Proceso B — worker de publicación (GitHub Actions cron, sin interacción).

Publica items approved vencidos. Cada canal registra su id; si uno falla, el
siguiente cron reintenta SOLO ese canal (patrón instagod).
Uso: python publish.py
"""
from __future__ import annotations
from datetime import datetime, timezone
from src.db import due_items, record_publish
from src.handoff import send_package
from src.publishers import publish_facebook, publish_instagram

def run(now_iso: str) -> dict:
    published = failed = 0
    for item in due_items(now_iso):
        hechos = item.get("publish_ids", {})
        caps = item.get("captions", {})
        acciones = {
            "fb_page": lambda: publish_facebook(item["image_urls"], caps.get("fb", "")),
            "ig": lambda: publish_instagram(item["image_urls"], caps.get("ig", "")),
            "grupo": lambda: send_package(item),
            "tiktok": lambda: send_package(item),
        }
        for canal in item["channels"]:
            if canal in hechos:
                continue
            try:
                record_publish(item["id"], canal, acciones[canal]())
                published += 1
            except Exception as e:  # noqa: BLE001 — un canal caído no detiene el resto
                print(f"[publish] {item['id']}/{canal} falló: {e}")
                failed += 1
    return {"published": published, "failed": failed}

if __name__ == "__main__":
    out = run(datetime.now(timezone.utc).isoformat())
    print(out)
```

- [ ] **Step 4: Verificar** — `python -m pytest -m "not slow" -v` → toda la suite PASS.

- [ ] **Step 5: Commit** — `git add content/src/handoff.py content/publish.py content/tests/test_handoff.py content/tests/test_publish.py && git commit -m "feat(content): worker de publicación con handoff de grupos/tiktok"`

---

### Task 11: Docker (generación local)

**Files:**
- Create: `content/Dockerfile`, `content/docker-compose.yml`, `content/README.md`

**Interfaces:**
- Consumes: todo el pipeline.
- Produces: `docker compose run --rm generate` funcional en la Mac de Ricardo.

- [ ] **Step 1: Dockerfile y compose**

```dockerfile
# content/Dockerfile
FROM mcr.microsoft.com/playwright/python:v1.49.0-noble
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "generate.py"]
```

```yaml
# content/docker-compose.yml
services:
  generate:
    build: .
    env_file: .env
    volumes:
      - ./out:/app/out
      - ./assets:/app/assets
      - ./templates:/app/templates
    # Para hablar con el Supabase local desde el contenedor:
    # SUPABASE_URL=http://host.docker.internal:54321 en .env
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

- [ ] **Step 2: README corto**

```markdown
# content/ — máquina de contenido Pensión+

Spec: `docs/superpowers/specs/2026-07-30-contenido-social-design.md`.

## Generar el lote semanal (local)
1. `cp .env.example .env` y llenar (Supabase prod o local, DeepSeek, Telegram, FB/IG).
2. `docker compose run --rm generate` — el bot de Telegram te va pasando las 8
   piezas para aprobar/rechazar/regenerar.

## Publicación
Automática vía GitHub Actions (`.github/workflows/content-publish.yml`, cron
diario 15:00 UTC). Página FB e IG se publican solas; grupos y TikTok llegan por
Telegram listos para pegar.

## Tests
`python -m pytest -m "not slow"` (rápidos) · `python -m pytest` (con render real,
requiere `playwright install chromium`).
```

- [ ] **Step 3: Probar build y suite dentro del contenedor**

Run: `cd content && docker compose build && docker compose run --rm generate python -m pytest -v`
Expected: build OK y suite completa PASS (la imagen de Playwright ya trae Chromium — los `slow` corren).

- [ ] **Step 4: Commit** — `git add content/Dockerfile content/docker-compose.yml content/README.md && git commit -m "feat(content): docker para generación local"`

---

### Task 12: GitHub Actions cron + secrets + cierre

**Files:**
- Create: `.github/workflows/content-publish.yml`
- Modify: `PENDIENTES.md` (nueva sección de la máquina de contenido)

**Interfaces:**
- Consumes: `content/publish.py`.
- Produces: publicación diaria automática sin depender de la Mac.

- [ ] **Step 1: Workflow**

```yaml
# .github/workflows/content-publish.yml
name: content-publish
on:
  schedule:
    - cron: "0 15 * * *"   # 9:00 CDMX
  workflow_dispatch: {}
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install requests python-dotenv jinja2  # publish no renderiza; sin playwright
      - run: python publish.py
        working-directory: content
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
          FB_PAGE_ID: ${{ secrets.FB_PAGE_ID }}
          FB_PAGE_TOKEN: ${{ secrets.FB_PAGE_TOKEN }}
          IG_USER_ID: ${{ secrets.IG_USER_ID }}
```

- [ ] **Step 2: Cargar secrets**

Run (con valores reales de `content/.env`):
```bash
gh secret set SUPABASE_URL --body "https://wdczbfhfgpsbhwexikgp.supabase.co"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "..."
gh secret set TELEGRAM_BOT_TOKEN --body "..."
gh secret set TELEGRAM_CHAT_ID --body "..."
gh secret set FB_PAGE_ID --body "..."
gh secret set FB_PAGE_TOKEN --body "..."
gh secret set IG_USER_ID --body "..."
```

- [ ] **Step 3: Probar el workflow a mano**

Run: `gh workflow run content-publish && sleep 60 && gh run list --workflow=content-publish --limit 1`
Expected: run `completed success` (con 0 items due imprime `{'published': 0, 'failed': 0}`).

- [ ] **Step 4: Actualizar PENDIENTES.md**

Agregar al final de la sección de marketing (punto 8):

```markdown
   - **Máquina de contenido (30-jul):** pipeline en `content/` — `docker compose run --rm generate` genera el lote semanal (aprobación por Telegram), GitHub Actions publica diario (página FB + IG automático; grupos y TikTok llegan por Telegram para pegar a mano). Falta: crear bot de Telegram dedicado, token de página FB con permisos `pages_manage_posts` + `instagram_content_publish`, y soltar assets (logo/fotos) en `content/assets/`.
```

- [ ] **Step 5: Commit final**

```bash
git add .github/workflows/content-publish.yml PENDIENTES.md
git commit -m "feat(content): cron de publicación diaria en GitHub Actions"
git push origin main
```

---

## Self-review del plan

- **Cobertura del spec:** arquitectura 2 procesos ✓ (T8, T10-12), Supabase estado+storage ✓ (T1, T6), DeepSeek con principios ✓ (T4), render profesional ✓ (T5), Telegram aprobar/rechazar/regenerar ✓ (T7), FB+IG automático con carrusel IG ✓ (T9), grupos/TikTok handoff ✓ (T10), medición: `source` viaja en cada item y el funnel ya mide `source_ref` ✓. Pauta fase 2: fuera de alcance ✓.
- **Sin placeholders:** cada step lleva código o comando completo.
- **Consistencia de tipos:** `plan_semana` produce los dicts que consumen `generate_copy`/`render_item`/`insert_item`; `due_items` devuelve filas con `captions`/`image_urls`/`channels`/`publish_ids` que consume `publish.run`; claves de captions (`fb`, `ig`, `grupo`, `tiktok`) consistentes entre T4, T8 y T10.
