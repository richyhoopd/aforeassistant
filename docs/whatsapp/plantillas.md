# Plantillas de WhatsApp y configuración de Meta

## Plantillas para registrar (idioma: es_MX)

Copiar el cuerpo EXACTO en Meta Business → WhatsApp Manager → Plantillas → Crear.

**Diseño para clientes poco tecnológicos:** todo lo que requiera acción tiene botón (un tap), nunca liga pegada en el texto; el opt-out también es botón (nadie tiene que escribir "BAJA", aunque escribirlo sigue funcionando). En el editor de Meta: sección **Botones** → "Ir al sitio web" (URL) y "Respuesta rápida" — se pueden combinar en la misma plantilla.

### 1. `recordatorio_nss` — categoría **Utility**

```
Hola {{1}}, ya calificaste para tu retiro AFORE estimado de {{2}}. Solo nos falta tu NSS (Número de Seguridad Social, 11 dígitos) para generar tu contrato.

Toca el botón para continuar. Si lo prefieres, respóndenos por aquí con tu NSS, o mándanos una foto de un documento donde aparezca (constancia del IMSS, credencial o estado de cuenta AFORE).
```

Botones:
- **Ir al sitio web** · texto: `Continuar mi trámite` · URL estática: `https://www.pensionmas.com.mx/pre-calificador?source=wa-nss`
- **Respuesta rápida** · texto: `No enviar recordatorios`

Ejemplos para la revisión de Meta: {{1}} = Carlos, {{2}} = $47,954 a $59,020

### 2. `recordatorio_firma` — categoría **Utility**

```
Hola {{1}}, tu contrato de asesoría ya está listo. Toca el botón para leerlo y firmarlo desde tu celular. La liga es válida por 72 horas.
```

Botones:
- **Ir al sitio web** · texto: `Firmar mi contrato` · URL **dinámica**: `https://www.pensionmas.com.mx/firmar/{{1}}` (ejemplo de la variable: `abc123`)
- **Respuesta rápida** · texto: `No enviar recordatorios`

Ejemplos: {{1}} del cuerpo = Carlos

### 3. `ya_calificas_pensionmas` — categoría **Marketing**

```
Hola {{1}}, cuando te evaluaste aún no cumplías los días de desempleo que pide la ley. ¡Hoy ya los cumples! Toca el botón para evaluarte otra vez: es gratis y tarda 2 minutos.
```

Botones:
- **Ir al sitio web** · texto: `Evaluarme gratis` · URL estática: `https://www.pensionmas.com.mx/pre-calificador?source=wa-califica`
- **Respuesta rápida** · texto: `No recibir más mensajes`

Ejemplos: {{1}} = Carlos

### 4. `bienvenida_pensionmas` — categoría **Utility**

Enviada por `app/api/contracts/sign` al firmar: {{1}} = primer nombre, {{2}} = folio.

```
Hola {{1}}, recibimos tu contrato firmado con folio {{2}}. Te acompañaremos en tu trámite de retiro AFORE y te escribiremos por aquí con los siguientes pasos.
```

Botones:
- **Respuesta rápida** · texto: `Tengo una duda`

Ejemplos: {{1}} = Carlos, {{2}} = PMAS-12345678

### 5. `codigo_pensionmas` — categoría **Authentication** (OTP)

Texto prefabricado de Meta con botón **"Copiar código"** (actívalo); caducidad del código: 10 minutos. El código debe migrarse de `sendWhatsAppText` a esta plantilla antes de prender envíos reales.

## NSS por imagen — evaluación

**Sí conviene.** El NSS son 11 dígitos que el cliente típico no sabe de memoria; pedirle que lo teclee en un formulario web es la mayor fricción del funnel. Casi todos tienen una foto de su credencial del IMSS o su constancia. Flujo propuesto (manual primero, sin OCR):

1. El cliente responde al recordatorio con una foto (o con el NSS en texto).
2. El webhook descarga la imagen del API de Meta (los medios caducan ~30 días en sus servidores) y la guarda en el bucket privado de Supabase; registra evento `inbound_media` en el timeline del lead.
3. El admin ve la imagen en el timeline, captura el NSS a mano en el panel y el flujo continúa normal (generar contrato → recordatorio de firma).
4. OCR automático: solo si el volumen lo justifica más adelante.

El aviso de privacidad ya cubre la recolección de NSS; la imagen queda en bucket privado igual que los contratos.

## Cambios de código requeridos por los botones (pendientes)

- `sendWhatsAppTemplate` hoy solo manda parámetros de cuerpo; necesita soportar el componente `button` con parámetro de URL para la liga dinámica de `recordatorio_firma` (el token de firma ya no viaja en el cuerpo).
- `recordatorio_nss` baja de 3 a 2 parámetros de cuerpo (la liga ahora es botón estático) — ajustar el cron de followups.
- Webhook: los taps de respuesta rápida llegan como `type: "button"` (no `text`) — leer `button.text`/`button.payload` y tratar `No enviar recordatorios` / `No recibir más mensajes` como opt-out (además de BAJA/STOP/NO escritos). `Tengo una duda` se registra como `inbound_whatsapp` normal.
- Webhook: mensajes `type: "image"` → descargar media con el `WHATSAPP_TOKEN`, guardar en Storage y registrar `inbound_media`.

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
   - Copiar el App Secret (App Settings → Basic) a `WHATSAPP_APP_SECRET` — sin esto el webhook no valida la firma de las peticiones entrantes.
7. **Cron**: en Vercel, definir env `CRON_SECRET` (openssl rand -hex 32). El cron de `vercel.json` queda activo al desplegar.

## Operación

- Dry-run: con `WHATSAPP_ENABLED=false` el cron registra `reminder_dry_run` en el timeline del lead sin mandar nada.
- Cadencia: 1, 3 y 7 días; máximo 3 recordatorios por escenario; "ya calificas" solo una vez.
- Opt-out: si el cliente responde BAJA/STOP/NO o toca el botón "No enviar recordatorios"/"No recibir más mensajes", el lead queda `do_not_contact` y no vuelve a recibir mensajes automáticos.
