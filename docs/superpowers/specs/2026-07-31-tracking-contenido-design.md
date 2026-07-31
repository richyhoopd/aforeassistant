# Tracking de contenido y ads — Pensión+ (diseño)

**Fecha:** 2026-07-31 · **Estado:** aprobado por Ricardo

**Objetivo:** medir cómo le va al contenido publicado por la máquina (`content/`)
— alcance e interacción social por post, y sobre todo leads/firmas atribuidos por
`?source=` — y dejar preparada la lectura de resultados de ads de Meta, todo
visible en el admin de la web.

## Decisiones

- **Snapshots diarios**, no totales: tabla `content_metrics` con una fila por
  pieza × canal × día → series de tiempo baratas (jsonb de métricas).
- **Recolector orgánico** como paso extra del cron diario de GitHub Actions
  (después de publicar): FB post (reactions, comments, shares, reach) e IG media
  (reach, likes, comments, saved, shares) vía Graph API con los `publish_ids`
  ya guardados. Grupos y TikTok no tienen API → su señal son los leads por
  `source` (ya existen en `leads.source_ref`).
- **Ads: preparado, dormido.** `ads.py` lee insights de campañas (nivel
  campaign: gasto, impresiones, clicks, leads reportados) → `ads_metrics`.
  Solo corre si `ADS_ACCOUNT_ID` está configurado (y el token tiene `ads_read`).
  Se activa cargando 1 secret cuando Ricardo empiece a pautar.
- **Admin `/admin/contenido`**: página protegida (mismos patrones: server
  component, `supabaseAdmin()`, tabla shadcn, link en el nav del layout) que
  cruza por pieza: métricas sociales del último snapshot + leads/calificados/
  firmados de su `source`. Sección de ads visible solo cuando haya filas en
  `ads_metrics`.
- Conteos sobre `leads`: calificado = status ∉ {NEW, REJECTED}; firmado =
  status ∈ {CONTRACT_SIGNED, DISPERSED, PAID}.

## Esquema

- `content_metrics(id, item_id FK content_items ON DELETE CASCADE, channel,
  snapshot_date, metrics jsonb, UNIQUE(item_id, channel, snapshot_date))`, RLS
  sin políticas.
- `ads_metrics(id, campaign_id, campaign_name, snapshot_date, spend,
  impressions, clicks, leads_reported, UNIQUE(campaign_id, snapshot_date))`,
  RLS sin políticas.

## Fuera de alcance

- Métricas de TikTok/grupos (sin API pública utilizable).
- Gestión/creación de campañas de ads desde el admin (solo lectura de insights).
- Gráficas; fase 1 es tabla con último snapshot (las series ya quedan guardadas
  para graficar después).
