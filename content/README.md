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

## Secrets de GitHub Actions
Para habilitar la publicación automática, cargar estos 7 secrets en el repositorio
(values obtenidos de `content/.env`):

```bash
gh secret set SUPABASE_URL --body "https://wdczbfhfgpsbhwexikgp.supabase.co"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "..."
gh secret set TELEGRAM_BOT_TOKEN --body "..."
gh secret set TELEGRAM_CHAT_ID --body "..."
gh secret set FB_PAGE_ID --body "..."
gh secret set FB_PAGE_TOKEN --body "..."
gh secret set IG_USER_ID --body "..."
```

Pendiente: cargar los valores reales y ejecutar los comandos anteriores.
