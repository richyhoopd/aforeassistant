# Máquina de contenido social — Pensión+ (diseño)

**Fecha:** 2026-07-30 · **Estado:** aprobado por Ricardo

**Objetivo:** producir y distribuir a diario contenido de valor sobre retiro AFORE
por desempleo (pensión, AFORE, IMSS) que traiga leads orgánicos gratuitos al
pre-calificador, con atribución por `?source=`, y que después permita decidir qué
pautar con datos de conversión, no de likes.

## Decisiones tomadas (y descartadas)

- **Pipeline Python estilo instagod, dockerizado en tulanaya.** Se descartó
  portar `content_studio` (Odoo 15) a un Odoo 18 propio en VM (Oracle Free u
  otra): más infra de la necesaria por ahora. El módulo quedó respaldado en
  `github.com/richyhoopd/content_studio` (privado) como **fuente de referencia**
  para el render HTML→PNG y el flujo de revisión por Telegram.
- **Grupos de Facebook: semi-automático.** La API de grupos de Meta murió en
  2024; automatizar con browser-bot viola ToS y arriesga el perfil y el acceso a
  los grupos. La máquina entrega el paquete listo por Telegram y Ricardo pega a
  mano (1-2 min/día) desde su perfil, como piden las reglas de los grupos.
- **TikTok: semi-manual en fase 1.** Sin publisher de API (requiere app de
  developer + auditoría). Carruseles photo-mode subidos a mano desde la app con
  el paquete de Telegram. API en fase 2 si hay tracción.
- **Página FB + Instagram: publicación 100% automática** (las cuentas ya
  existen; IG profesional vinculada a la página; tokens vía la app Meta "Afore
  Assistant").
- **Arranque en dos vías:** publicación manual desde esta semana con
  `docs/marketing/posts.md` (10 posts listos) en los 6 grupos de
  `docs/marketing/grupos.md`, mientras se construye el pipeline (~1 semana). La
  máquina nace calibrada con lo observado.

## Arquitectura

Dos procesos, mismo patrón que instagod:

- **Proceso A — Generación (local, on-demand).** Contenedor Python en el
  docker-compose de tulanaya. Lee el calendario, genera copy con **DeepSeek**,
  renderiza la imagen **HTML/CSS → PNG con Playwright/Chromium** (plantillas
  como en content_studio), y manda cada pieza a **Telegram** con botones:
  aprobar / rechazar / regenerar / cambiar plantilla. Termina cuando se resuelve
  el lote (normalmente el lote semanal, ~10 min de revisión).
- **Proceso B — Publicación (cron, sin interacción).** Corre en **GitHub
  Actions** (no depende de la Mac). Publica piezas `approved` cuya hora llegó:
  Graph API para página FB e IG; para grupos/TikTok manda el paquete del día por
  Telegram. Reintento por canal: cada canal guarda su id de post; si uno falla,
  el siguiente cron reintenta solo ese (patrón de instagod).
- **Estado: Supabase de tulanaya** (no Sheets). Tabla `content_items`: tema,
  formato, plantilla, copy, canal(es), estado (`pending → approved → published`),
  `scheduled_at`, `source`, ids de publicación por canal, y métricas asociadas
  después. Imágenes en bucket **público** de Supabase Storage (IG descarga el
  PNG desde esa URL).

## Sistema de contenido

Cada pieza = **tema × formato × plantilla visual**. Los 10 temas y los
principios no negociables ya viven en `docs/marketing/estrategia.md` (valor
primero, cero promesas de monto, anti-coyote, sin urgencia falsa, CTA suave con
`?source=`). El prompt de DeepSeek incorpora esos principios como sistema.

Formatos rotables:

| Formato | Nota |
|---|---|
| Mito vs Realidad | Corregir desinformación da autoridad y shares |
| Checklist visual | Se guarda/comparte; señal fuerte para el algoritmo |
| ¿Sabías que…? | Dato duro específico (46 días, 11.5%, reintegro) |
| Caso anónimo | Historia estilo post 10; ideal para grupos estrictos |
| Anti-coyote | El diferenciador; genera confianza y comentarios |
| Pregunta del público | Responde preguntas reales de comentarios de grupos |
| Coyuntura | UMA, cambios IMSS/CONSAR; único "urgente" legítimo; se pauta bien |
| Carrusel educativo | 5 láminas (ej. Modalidad A vs B); rey del alcance en IG; sirve tal cual en TikTok |

**Mezcla semanal** (cadencia de estrategia.md): página FB + IG 3/semana
(1 educativo, 1 confianza, 1 historia/mito); grupos 2-3/semana por grupo rotando
tema y variando texto (nunca el mismo texto el mismo día en varios grupos);
TikTok 2/semana (carruseles).

**Plantillas y assets de confianza:** logo Pensión+, paleta consistente, cita de
fuente al pie ("Fuente: CONSAR/DOF"), disclaimer fijo ("El trámite ante tu AFORE
es gratuito"), fotos stock de personas mexicanas reales. Carpeta `assets/` donde
Ricardo puede soltar material; las plantillas lo toman.

## Distribución

| Canal | Modo | Mecanismo |
|---|---|---|
| Página FB | Automático | Graph API Pages |
| Instagram | Automático | IG Graph API |
| Grupos FB | Semi-auto | Paquete diario por Telegram (imagen + copy + `?source=` del grupo en turno) |
| TikTok | Semi-auto | Mismo paquete, caption adaptado, photo-mode |

## Medición y pauta (fase 2)

Atribución ya existente: `?source=` → `source_ref` del lead → % aptos y
% firmados en el admin. `content_items` guarda qué pieza salió con qué `source`:
cada post se juzga por **leads y firmas**, no por likes. Regla de pauta: solo se
pauta lo que ya convirtió orgánico (esperado: coyuntura y anti-coyote), decisión
a ~1 mes con datos.

## Fuera de alcance (fase 1)

- Publisher de TikTok por API (auditoría de developer).
- Video generado (solo imágenes/carruseles).
- OCR/automatización de respuestas en comentarios.
- Pauta pagada (fase 2, con datos).
