# Tracking de contenido y ads — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recolector diario de métricas orgánicas (FB/IG) y de ads (dormido hasta configurar Ad Account), con snapshots en Supabase y página `/admin/contenido` que cruza métricas sociales con leads por `source`.

**Architecture:** Extiende `content/` (mismo estilo: requests + mocks, TDD) con `insights.py`, `ads.py` y entrypoint `metrics.py` que corre como paso extra del workflow diario. Nueva migración `0005`. Página admin server-component con `supabaseAdmin()` siguiendo `app/admin/(protected)/page.tsx`. Spec: `docs/superpowers/specs/2026-07-31-tracking-contenido-design.md`.

**Tech Stack:** Python 3.12 (requests, pytest), Graph API v23.0, Next.js App Router + shadcn table.

## Global Constraints

- Sin secretos commiteados; `ADS_ACCOUNT_ID` es secret opcional (ausente = ads dormido, `collect_ads` devuelve 0 sin llamar a la red).
- Python snake_case + type hints; tests con monkeypatch de `requests`; los mocks de `requests.post` en tests existentes de `db.py` usan kwargs `headers/json/timeout` — los nuevos upserts agregan `params`, así que sus stubs deben aceptar `params=None`.
- Calificado = status ∉ {NEW, REJECTED}; firmado = status ∈ {CONTRACT_SIGNED, DISPERSED, PAID}.
- Identidad git local del repo (`richyhoopd <ricardommmmg@gmail.com>`); NUNCA firmas de IA en commits.
- El working tree puede tener cambios sin commitear de Ricardo (app/(public)/, DESIGN.md, PRODUCT.md, .impeccable/, components/prequalifier/) — jamás `git add -A`; agregar solo archivos propios de la tarea. La página nueva `app/admin/(protected)/contenido/page.tsx` y el layout del admin NO chocan con esos archivos.

---

### Task 1: Migración `0005_content_metrics.sql`

**Files:**
- Create: `supabase/migrations/0005_content_metrics.sql`

**Interfaces:**
- Produces: tablas `content_metrics` y `ads_metrics` que consumen `db.py` (Task 2) y la página admin (Task 6).

- [ ] **Step 1: Escribir la migración**

```sql
CREATE TABLE content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (item_id, channel, snapshot_date)
);

CREATE TABLE ads_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  snapshot_date DATE NOT NULL,
  spend NUMERIC(12,2),
  impressions BIGINT,
  clicks BIGINT,
  leads_reported BIGINT,
  UNIQUE (campaign_id, snapshot_date)
);

-- Solo service role (RLS sin políticas), igual que content_items.
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_metrics ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Aplicar y verificar en local**

Run: `npx supabase migration up`
Luego: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\d content_metrics" -c "\d ads_metrics"`
Expected: ambas tablas con sus UNIQUE constraints.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0005_content_metrics.sql
git commit -m "feat(content): tablas content_metrics y ads_metrics"
```

---

### Task 2: `config.py` + `db.py` — soporte de métricas

**Files:**
- Modify: `content/src/config.py` (agregar campo `ads_account_id`)
- Modify: `content/src/db.py` (3 funciones nuevas al final)
- Modify: `content/tests/test_db.py` (tests nuevos al final)
- Modify: `content/.env.example` (agregar `ADS_ACCOUNT_ID=`)

**Interfaces:**
- Produces: `published_items() -> list[dict]`; `upsert_metric(item_id: str, channel: str, snapshot_date: str, metrics: dict) -> None`; `upsert_ad_metric(row: dict) -> None`; `cfg().ads_account_id` (default `""`).

- [ ] **Step 1: Tests que fallan (append a `content/tests/test_db.py`)**

```python
def test_published_items_filtra_por_status(monkeypatch):
    _env(monkeypatch)
    calls = []
    monkeypatch.setattr(db.requests, "get", lambda url, headers=None, params=None, timeout=None: (calls.append(params), R([{"id": "x"}]))[1])
    assert db.published_items() == [{"id": "x"}]
    assert calls[0]["status"] == "eq.published"

def test_upsert_metric_hace_upsert_postgrest(monkeypatch):
    _env(monkeypatch)
    calls = []
    monkeypatch.setattr(db.requests, "post", lambda url, headers=None, params=None, json=None, timeout=None: (calls.append((url, headers, params, json)), R([]))[1])
    db.upsert_metric("it1", "ig", "2026-08-05", {"reach": 100})
    url, headers, params, body = calls[0]
    assert url.endswith("/content_metrics")
    assert headers["Prefer"] == "resolution=merge-duplicates"
    assert params["on_conflict"] == "item_id,channel,snapshot_date"
    assert body == {"item_id": "it1", "channel": "ig", "snapshot_date": "2026-08-05", "metrics": {"reach": 100}}

def test_upsert_ad_metric(monkeypatch):
    _env(monkeypatch)
    calls = []
    monkeypatch.setattr(db.requests, "post", lambda url, headers=None, params=None, json=None, timeout=None: (calls.append((url, params, json)), R([]))[1])
    db.upsert_ad_metric({"campaign_id": "c1", "snapshot_date": "2026-08-05", "spend": 10.5})
    url, params, body = calls[0]
    assert url.endswith("/ads_metrics") and params["on_conflict"] == "campaign_id,snapshot_date"
    assert body["campaign_id"] == "c1"
```

- [ ] **Step 2: Verificar que fallan** — `cd content && python3 -m pytest tests/test_db.py -v` → FAIL (AttributeError).

- [ ] **Step 3: Implementación**

En `content/src/config.py`: agregar al dataclass `Config` el campo `ads_account_id: str` (después de `ig_user_id`) y en `cfg()`: `ads_account_id=os.environ.get("ADS_ACCOUNT_ID", ""),`. En `content/.env.example` agregar línea `ADS_ACCOUNT_ID=` con comentario `# vacío = lector de ads dormido`.

Append a `content/src/db.py`:

```python
def published_items() -> list[dict]:
    r = requests.get(_rest("content_items"), headers=_h(),
                     params={"status": "eq.published", "select": "*"}, timeout=30)
    r.raise_for_status()
    return r.json()

def upsert_metric(item_id: str, channel: str, snapshot_date: str, metrics: dict) -> None:
    r = requests.post(_rest("content_metrics"),
                      headers={**_h(), "Prefer": "resolution=merge-duplicates"},
                      params={"on_conflict": "item_id,channel,snapshot_date"},
                      json={"item_id": item_id, "channel": channel,
                            "snapshot_date": snapshot_date, "metrics": metrics},
                      timeout=30)
    r.raise_for_status()

def upsert_ad_metric(row: dict) -> None:
    r = requests.post(_rest("ads_metrics"),
                      headers={**_h(), "Prefer": "resolution=merge-duplicates"},
                      params={"on_conflict": "campaign_id,snapshot_date"},
                      json=row, timeout=30)
    r.raise_for_status()
```

- [ ] **Step 4: Verificar que pasan** — `python3 -m pytest tests/test_db.py tests/test_config.py -v` → PASS todo.

- [ ] **Step 5: Commit**

```bash
git add content/src/config.py content/src/db.py content/tests/test_db.py content/.env.example
git commit -m "feat(content): upserts de métricas y config de ads account"
```

---

### Task 3: `insights.py` — recolector orgánico FB/IG

**Files:**
- Create: `content/src/insights.py`, `content/tests/test_insights.py`

**Interfaces:**
- Consumes: `cfg().fb_page_token`; `published_items()`, `upsert_metric()` de Task 2.
- Produces: `fetch_fb_insights(post_id: str) -> dict`; `fetch_ig_insights(media_id: str) -> dict`; `collect(snapshot_date: str) -> int` (número de snapshots guardados; salta canales sin id o con valor `"sent"`; una pieza caída no detiene el resto).

- [ ] **Step 1: Tests que fallan**

```python
# content/tests/test_insights.py
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
```

- [ ] **Step 2: Verificar que fallan** — `python3 -m pytest tests/test_insights.py -v` → FAIL (import).

- [ ] **Step 3: Implementación**

```python
# content/src/insights.py
from __future__ import annotations
import requests
from .config import cfg
from .db import published_items, upsert_metric

_G = "https://graph.facebook.com/v23.0"

def fetch_fb_insights(post_id: str) -> dict:
    tok = cfg().fb_page_token
    r = requests.get(f"{_G}/{post_id}", params={
        "fields": "reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0),shares",
        "access_token": tok,
    }, timeout=30)
    r.raise_for_status()
    d = r.json()
    out = {
        "reactions": d.get("reactions", {}).get("summary", {}).get("total_count", 0),
        "comments": d.get("comments", {}).get("summary", {}).get("total_count", 0),
        "shares": d.get("shares", {}).get("count", 0),
    }
    ri = requests.get(f"{_G}/{post_id}/insights", params={
        "metric": "post_impressions_unique", "access_token": tok,
    }, timeout=30)
    if ri.ok:
        data = ri.json().get("data", [])
        if data and data[0].get("values"):
            out["reach"] = data[0]["values"][0].get("value", 0)
    return out

def fetch_ig_insights(media_id: str) -> dict:
    r = requests.get(f"{_G}/{media_id}/insights", params={
        "metric": "reach,likes,comments,saved,shares", "access_token": cfg().fb_page_token,
    }, timeout=30)
    r.raise_for_status()
    return {d["name"]: (d.get("values") or [{}])[0].get("value", 0) for d in r.json().get("data", [])}

_FETCHERS = (("fb_page", fetch_fb_insights), ("ig", fetch_ig_insights))

def collect(snapshot_date: str) -> int:
    n = 0
    for item in published_items():
        ids = item.get("publish_ids", {})
        for channel, _default in _FETCHERS:
            post_id = ids.get(channel)
            if not post_id or post_id == "sent":
                continue
            fetcher = fetch_fb_insights if channel == "fb_page" else fetch_ig_insights
            try:
                upsert_metric(item["id"], channel, snapshot_date, fetcher(post_id))
                n += 1
            except Exception as e:  # noqa: BLE001 — una pieza caída no detiene la recolección
                print(f"[insights] {item['id']}/{channel} falló: {e}")
    return n
```

Nota para el implementador: el test parchea `ins.fetch_fb_insights`/`ins.fetch_ig_insights` a nivel módulo, por eso `collect` debe resolver el fetcher dinámicamente desde el módulo (como arriba, referenciando los nombres globales en el cuerpo) y no capturarlos en el tuple en tiempo de import. Si prefieres, elimina `_FETCHERS` y usa `for channel in ("fb_page", "ig")` directamente — es equivalente y más simple; lo que no puede pasar es que el tuple congele las referencias originales.

- [ ] **Step 4: Verificar que pasan** — `python3 -m pytest tests/test_insights.py -v` → PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add content/src/insights.py content/tests/test_insights.py
git commit -m "feat(content): recolector de insights orgánicos FB/IG"
```

---

### Task 4: `ads.py` — lector de campañas (dormido)

**Files:**
- Create: `content/src/ads.py`, `content/tests/test_ads.py`

**Interfaces:**
- Consumes: `cfg().ads_account_id`, `cfg().fb_page_token`; `upsert_ad_metric()` de Task 2.
- Produces: `collect_ads(snapshot_date: str) -> int` — 0 sin tocar la red si `ads_account_id` vacío; si no, insights nivel campaign del día y upsert por campaña.

- [ ] **Step 1: Tests que fallan**

```python
# content/tests/test_ads.py
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
```

- [ ] **Step 2: Verificar que fallan** — `python3 -m pytest tests/test_ads.py -v` → FAIL (import).

- [ ] **Step 3: Implementación**

```python
# content/src/ads.py
from __future__ import annotations
import json
import requests
from .config import cfg
from .db import upsert_ad_metric

_G = "https://graph.facebook.com/v23.0"

def collect_ads(snapshot_date: str) -> int:
    c = cfg()
    if not c.ads_account_id:
        return 0  # dormido hasta configurar ADS_ACCOUNT_ID (y token con ads_read)
    r = requests.get(f"{_G}/act_{c.ads_account_id}/insights", params={
        "level": "campaign",
        "fields": "campaign_id,campaign_name,spend,impressions,clicks,actions",
        "time_range": json.dumps({"since": snapshot_date, "until": snapshot_date}),
        "access_token": c.fb_page_token,
    }, timeout=60)
    r.raise_for_status()
    n = 0
    for row in r.json().get("data", []):
        leads = next((int(a["value"]) for a in row.get("actions", [])
                      if a.get("action_type") == "lead"), None)
        upsert_ad_metric({
            "campaign_id": row["campaign_id"],
            "campaign_name": row.get("campaign_name"),
            "snapshot_date": snapshot_date,
            "spend": float(row.get("spend", 0)),
            "impressions": int(row.get("impressions", 0)),
            "clicks": int(row.get("clicks", 0)),
            "leads_reported": leads,
        })
        n += 1
    return n
```

- [ ] **Step 4: Verificar que pasan** — `python3 -m pytest tests/test_ads.py -v` → PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add content/src/ads.py content/tests/test_ads.py
git commit -m "feat(content): lector de insights de ads, dormido sin account id"
```

---

### Task 5: `metrics.py` + workflow + docs

**Files:**
- Create: `content/metrics.py`
- Modify: `.github/workflows/content-publish.yml` (paso nuevo tras publish)
- Modify: `content/README.md` (sección de métricas + secret opcional)
- Modify: `PENDIENTES.md` (nota en el punto de la máquina de contenido)

**Interfaces:**
- Consumes: `collect()` (Task 3), `collect_ads()` (Task 4).
- Produces: entrypoint diario de recolección.

- [ ] **Step 1: Entrypoint**

```python
# content/metrics.py
"""ENTRYPOINT Proceso C — recolector diario de métricas (corre tras publish en Actions).

Orgánico: snapshots FB/IG de cada pieza publicada. Ads: dormido hasta
configurar ADS_ACCOUNT_ID. Uso: python metrics.py
"""
from __future__ import annotations
from datetime import date
from src.ads import collect_ads
from src.insights import collect

if __name__ == "__main__":
    hoy = date.today().isoformat()
    print({"organic_snapshots": collect(hoy), "ad_campaigns": collect_ads(hoy)})
```

- [ ] **Step 2: Paso en el workflow**

En `.github/workflows/content-publish.yml`, después del step `python publish.py`, agregar (misma indentación, mismo bloque env más la línea nueva):

```yaml
      - run: python metrics.py
        working-directory: content
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
          FB_PAGE_ID: ${{ secrets.FB_PAGE_ID }}
          FB_PAGE_TOKEN: ${{ secrets.FB_PAGE_TOKEN }}
          IG_USER_ID: ${{ secrets.IG_USER_ID }}
          ADS_ACCOUNT_ID: ${{ secrets.ADS_ACCOUNT_ID }}
```

- [ ] **Step 3: Docs**

En `content/README.md`, después de la sección "## Publicación", agregar:

```markdown
## Métricas

Tras publicar, el mismo workflow corre `python metrics.py`: guarda un snapshot
diario por pieza publicada (FB: reactions/comments/shares/reach; IG:
reach/likes/comments/saved/shares) en `content_metrics`, y si `ADS_ACCOUNT_ID`
está configurado (secret opcional; el token necesita `ads_read`), los insights
por campaña del día en `ads_metrics`. Todo se ve en `/admin/contenido`.
```

En `PENDIENTES.md`, dentro de la entrada "Máquina de contenido (30-jul)", agregar al final: `Tracking (31-jul): métricas FB/IG diarias + lector de ads dormido (activar con secret ADS_ACCOUNT_ID al pautar); dashboard en /admin/contenido.`

- [ ] **Step 4: Verificar** — `cd content && python3 -m pytest -m "not slow" -q` → todo verde; YAML válido: `python3 -c "import yaml,sys; yaml.safe_load(open('../.github/workflows/content-publish.yml'))"` (si falta pyyaml: `ruby -ryaml -e "YAML.load_file('.github/workflows/content-publish.yml')"` desde la raíz).

- [ ] **Step 5: Commit**

```bash
git add content/metrics.py .github/workflows/content-publish.yml content/README.md PENDIENTES.md
git commit -m "feat(content): recolección diaria de métricas en el cron de publicación"
```

---

### Task 6: Admin `/admin/contenido`

**Files:**
- Create: `app/admin/(protected)/contenido/page.tsx`
- Modify: `app/admin/(protected)/layout.tsx` (link "Contenido" en el nav, después del link "Leads")

**Interfaces:**
- Consumes: tablas `content_items`, `content_metrics`, `ads_metrics`, `leads` vía `supabaseAdmin()`.

- [ ] **Step 1: Página**

```tsx
// app/admin/(protected)/contenido/page.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabaseAdmin } from "@/lib/supabase/server"

type MetricRow = {
  item_id: string
  channel: string
  snapshot_date: string
  metrics: Record<string, number>
}

const num = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("es-MX")

const mxn = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

const SIGNED = ["CONTRACT_SIGNED", "DISPERSED", "PAID"]

export default async function AdminContenido() {
  const db = supabaseAdmin()
  const [{ data: items }, { data: metricRows }, { data: leads }, { data: ads }] =
    await Promise.all([
      db
        .from("content_items")
        .select("id, tema, formato, channels, status, scheduled_at, source, publish_ids")
        .in("status", ["approved", "published"])
        .order("scheduled_at", { ascending: false })
        .limit(100),
      db
        .from("content_metrics")
        .select("item_id, channel, snapshot_date, metrics")
        .order("snapshot_date", { ascending: false })
        .limit(1000),
      db.from("leads").select("source_ref, status"),
      db
        .from("ads_metrics")
        .select("campaign_id, campaign_name, snapshot_date, spend, impressions, clicks, leads_reported")
        .order("snapshot_date", { ascending: false })
        .limit(200),
    ])

  // último snapshot por pieza × canal
  const latest = new Map<string, Record<string, number>>()
  for (const m of (metricRows ?? []) as MetricRow[]) {
    const key = `${m.item_id}:${m.channel}`
    if (!latest.has(key)) latest.set(key, m.metrics)
  }

  // funnel por source
  const bySource = new Map<string, { total: number; qualified: number; signed: number }>()
  for (const l of leads ?? []) {
    if (!l.source_ref) continue
    const s = bySource.get(l.source_ref) ?? { total: 0, qualified: 0, signed: 0 }
    s.total += 1
    if (l.status !== "NEW" && l.status !== "REJECTED") s.qualified += 1
    if (SIGNED.includes(l.status)) s.signed += 1
    bySource.set(l.source_ref, s)
  }

  const fmtSocial = (m?: Record<string, number>) =>
    m
      ? Object.entries(m)
          .map(([k, v]) => `${k} ${num(v)}`)
          .join(" · ")
      : "—"

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-4 text-xl font-bold">Contenido</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pieza</TableHead>
              <TableHead>Canales</TableHead>
              <TableHead>Programada</TableHead>
              <TableHead>Facebook</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>Leads (source)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(items ?? []).map((it) => {
              const funnel = it.source ? bySource.get(it.source) : undefined
              return (
                <TableRow key={it.id}>
                  <TableCell>
                    <span className="font-medium">{it.tema}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{it.formato}</span>
                    {it.status !== "published" && (
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {it.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(it.channels as string[]).join(", ")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {it.scheduled_at ? new Date(it.scheduled_at).toLocaleDateString("es-MX") : "—"}
                  </TableCell>
                  <TableCell className="text-xs">{fmtSocial(latest.get(`${it.id}:fb_page`))}</TableCell>
                  <TableCell className="text-xs">{fmtSocial(latest.get(`${it.id}:ig`))}</TableCell>
                  <TableCell className="text-xs">
                    {funnel
                      ? `${funnel.total} leads · ${funnel.qualified} calif. · ${funnel.signed} firmados`
                      : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
            {(items ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Sin piezas todavía — corre el generador semanal
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Ads</h2>
        {(ads ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin campañas todavía. Al pautar, configura el secret ADS_ACCOUNT_ID y los
            insights aparecerán aquí solos.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaña</TableHead>
                <TableHead>Día</TableHead>
                <TableHead>Gasto</TableHead>
                <TableHead>Impresiones</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>CPL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ads ?? []).map((a) => (
                <TableRow key={`${a.campaign_id}:${a.snapshot_date}`}>
                  <TableCell className="font-medium">{a.campaign_name ?? a.campaign_id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.snapshot_date}</TableCell>
                  <TableCell>{mxn(a.spend)}</TableCell>
                  <TableCell>{num(a.impressions)}</TableCell>
                  <TableCell>{num(a.clicks)}</TableCell>
                  <TableCell>{num(a.leads_reported)}</TableCell>
                  <TableCell>
                    {a.leads_reported ? mxn((a.spend ?? 0) / a.leads_reported) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Link en el nav**

En `app/admin/(protected)/layout.tsx`, después del `<Link>` de "Leads", agregar:

```tsx
          <Link href="/admin/contenido" className="text-muted-foreground hover:text-foreground">
            Contenido
          </Link>
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit` → sin errores. Luego `npm run build` (o `npx next build`) → build OK. Con Supabase local corriendo, `npm run dev` y abrir http://localhost:3000/admin/contenido con el admin local (`admin@tulanaya.local` / `Tulanaya2026!`) → la página carga con "Sin piezas todavía" y la nota de ads.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/contenido/page.tsx" "app/admin/(protected)/layout.tsx"
git commit -m "feat(admin): dashboard de contenido con métricas sociales, funnel por source y ads"
```

---

## Self-review del plan

- **Cobertura del spec:** snapshots diarios ✓ (T1, T2, T3), recolector en el cron ✓ (T5), ads dormido ✓ (T4, T5), admin cruzando métricas + funnel por source con las definiciones exactas de calificado/firmado ✓ (T6), sección ads condicional ✓ (T6). Fuera de alcance respetado (sin gráficas, sin TikTok/grupos API, solo lectura de ads).
- **Placeholders:** ninguno; todo step tiene código o comando completo.
- **Consistencia de tipos:** `upsert_metric(item_id, channel, snapshot_date, metrics)` igual en T2 (definición), T3 (uso y mock del test); `upsert_ad_metric(row)` igual en T2/T4; claves de `publish_ids` (`fb_page`, `ig`, valor `"sent"`) consistentes con `publish.py`/`handoff.py` existentes; columnas de T1 = selects de T6.
