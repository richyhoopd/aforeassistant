# Plantillas de WhatsApp y configuración de Meta

## Plantillas para registrar (idioma: es_MX)

Copiar el cuerpo EXACTO en Meta Business → WhatsApp Manager → Plantillas → Crear.

### 1. `recordatorio_nss` — categoría **Utility**

```
Hola {{1}}, ya calificaste para tu retiro AFORE estimado de {{2}}. Solo falta tu NSS para generar tu contrato. Retómalo aquí: {{3}}. Responde BAJA si no deseas recordatorios.
```

Ejemplos para la revisión de Meta: {{1}} = Carlos, {{2}} = $47,954 a $59,020, {{3}} = https://tulanaya.mx/pre-calificador?source=wa-nss

### 2. `recordatorio_firma` — categoría **Utility**

```
Hola {{1}}, tu contrato de asesoría está listo para firma. Fírmalo aquí: {{2}} (liga válida 72 horas). Responde BAJA si no deseas recordatorios.
```

Ejemplos: {{1}} = Carlos, {{2}} = https://tulanaya.mx/firmar/abc123

### 3. `ya_calificas_tulanaya` — categoría **Marketing**

```
Hola {{1}}, cuando te evaluaste te faltaban días de desempleo — hoy ya cumples el requisito de 46 días. Evalúate de nuevo gratis: {{2}}.
```

Ejemplos: {{1}} = Carlos, {{2}} = https://tulanaya.mx/pre-calificador?source=wa-califica

### 4. `bienvenida_tulanaya` — (ya especificada para el flujo de firma; sin cambios)

## Guía paso a paso (solo tú puedes hacerlo)

1. **Meta Business Suite** → crear/verificar el negocio (business.facebook.com). La verificación puede pedir documentos del negocio; sin ella las plantillas Marketing tienen límites.
2. **App de desarrollador** (developers.facebook.com) → Crear app → tipo Business → agregar producto **WhatsApp**.
3. **Número**: en WhatsApp → API Setup, agrega y verifica tu número real (no puede estar registrado en la app normal de WhatsApp).
4. **Plantillas**: WhatsApp Manager → Message Templates → crear las 4 de arriba con idioma **es_MX** y las categorías indicadas. Meta tarda de minutos a horas en aprobarlas.
5. **Credenciales** → `.env` de producción (Vercel):
   - `WHATSAPP_TOKEN` = token permanente (System User token con permiso whatsapp_business_messaging; el token temporal de API Setup caduca en 24h).
   - `WHATSAPP_PHONE_NUMBER_ID` = Phone number ID del API Setup.
   - `WHATSAPP_ENABLED=true` (hasta que las plantillas estén aprobadas, déjalo en false).
6. **Webhook**: en la app → WhatsApp → Configuration → Webhook:
   - Callback URL: `https://<tu-dominio>/api/whatsapp/webhook`
   - Verify token: el mismo valor que pongas en `WHATSAPP_VERIFY_TOKEN`
   - Suscribir el campo `messages`.
7. **Cron**: en Vercel, definir env `CRON_SECRET` (openssl rand -hex 32). El cron de `vercel.json` queda activo al desplegar.

## Operación

- Dry-run: con `WHATSAPP_ENABLED=false` el cron registra `reminder_dry_run` en el timeline del lead sin mandar nada.
- Cadencia: 1, 3 y 7 días; máximo 3 recordatorios por escenario; "ya calificas" solo una vez.
- Opt-out: si el cliente responde BAJA/STOP/NO, el lead queda `do_not_contact` y no vuelve a recibir mensajes automáticos.
