# Revisión antes de la firma — diseño

Fecha: 2026-08-03
Estado: aprobado (Ricardo delegó las decisiones finales; ver "Decisiones tomadas sin consulta")

## Problema

Hoy `/api/evaluate` califica al lead, crea el contrato y devuelve el enlace de firma en el
mismo request. El cliente pasa de "no te conozco" a "firmé un contrato que me cobra
honorarios" en menos de un minuto, sin que nadie haya hecho nada por él. No percibe
asesoría porque no la hubo: la máquina cobró antes de trabajar.

Objetivo: que la firma llegue **después** de un trabajo real y visible sobre su caso, con
una persona identificable detrás.

## Flujo nuevo

1. **Califica** (`/api/evaluate`): se crea/actualiza el lead en `QUALIFIED`, se corre el
   semáforo de revisión, se guarda `contract_due_at = now() + 1h` y el asesor asignado, y
   sale de inmediato la plantilla `revisando_caso_pensionmas`. **No se crea contrato.**
2. **Pantalla de resultado**: muestra el estimado y los pendientes, y explica que el caso
   está en revisión y que le escribimos por WhatsApp en menos de una hora. Ya no ofrece
   firmar.
3. **Revisión**:
   - `GREEN` → al vencer `contract_due_at`, dentro de la ventana 8:00–21:00 (America/Mexico_City),
     el cron crea el contrato y envía `caso_revisado_pensionmas` con el enlace de firma.
   - `AMBER`/`RED` → el cron no toca el lead. Espera el tap de "Enviar contrato" en el panel.
4. **Firma**: la página `/firmar/[token]` muestra quién revisó el caso, qué se verificó y
   cuándo. El resto del flujo (OTP, PDF, folio, bienvenida) no cambia.

Sin NSS no hay contrato posible: esos leads no entran al pipeline y siguen con el
recordatorio `recordatorio_nss` que ya existe.

## Semáforo de revisión

`lib/review/evaluate.ts`, función pura, sin I/O. Entrada: fila del lead + duplicados
detectados. Salida: `{ level, flags[] }` con `flags: { code, label, level }`.

**RED** (nunca automático):
- `retiro_reciente` — `last_withdrawal_within_5y` verdadero.
- `duplicado_activo` — otro lead con el mismo teléfono, NSS o CURP en `CONTRACT_SIGNED`,
  `DISPERSED` o `PAID`.
- `no_contactar` — `do_not_contact` verdadero.

**AMBER** (requiere ojo humano):
- `nss_checksum` — el NSS no cuadra con su dígito verificador.
- `curp_checksum` — la CURP no cuadra con su dígito verificador.
- `edad_incoherente` — edad derivada de la CURP fuera de 18–75, o `edad - years_contributing < 16`.
- `nombre_incompleto` — menos de dos palabras.
- `baja_antigua` — más de 365 días desde `fecha_baja`.
- `salario_atipico` — salario mensual menor a $3,000 o mayor a $150,000.
- `telefono_compartido` — otro lead distinto con el mismo teléfono en estado activo.

**GREEN**: ninguna bandera.

`expediente_actualizado` y `cuenta_bancaria` **no** afectan el semáforo: que el cliente no
sepa si su expediente está al día es lo normal y es justamente lo que la asesoría resuelve.
Se persisten y se muestran en el panel como contexto del acompañamiento.

## Modelo de datos (migración `0006`)

| Tabla | Columna | Tipo | Para qué |
|---|---|---|---|
| `leads` | `review_level` | TEXT | `GREEN` / `AMBER` / `RED` |
| `leads` | `review_flags` | JSONB | Banderas con código y etiqueta legible |
| `leads` | `contract_due_at` | TIMESTAMPTZ | Cuándo vence la espera de 1 hora |
| `leads` | `advisor_name` | TEXT | Asesor asignado, congelado en el lead |
| `leads` | `reviewed_at` | TIMESTAMPTZ | Cuándo se aprobó |
| `leads` | `reviewed_by` | TEXT | `auto` o el email del admin |
| `leads` | `expediente_actualizado` | TEXT | `si` / `no` / `nose` |
| `leads` | `cuenta_bancaria` | TEXT | `si` / `no` / `nose` |
| `contracts` | `commission_pct` | NUMERIC(5,2) DEFAULT 10.00 | Honorarios como porcentaje |
| `contracts` | `dispersed_amount` | NUMERIC(10,2) | Monto real depositado |

El enum `lead_status` no cambia. `QUALIFIED` pasa a significar "calificado, en revisión" y
`CONTRACT_PENDING` "contrato enviado, sin firmar" — que es lo que ya significaban.

## Honorarios: 10% de lo depositado

La cláusula tercera deja de tener monto fijo:

> El Cliente pagará honorarios equivalentes al **10% (IVA incluido) del monto que la AFORE
> le deposite efectivamente**, exigibles únicamente después del depósito. Sobre el rango
> estimado de $X a $Y, esto equivale aproximadamente a $X/10 a $Y/10. Si el trámite no
> procede, el Cliente no debe cantidad alguna.

`contractClauses` recibe `commissionPct` en lugar de `commissionAmount`. El monto exacto se
conoce al dispersar: el panel captura `dispersed_amount` y de ahí sale el cobro.
`leads.commission_amount` y `contracts.commission_amount` quedan como columnas históricas de
los contratos ya firmados; no se usan en texto nuevo.

## Orquestación

`/api/cron/pipeline` (GET, `Bearer CRON_SECRET`, `maxDuration = 60`). Lógica pura en
`lib/pipeline/plan.ts`:

```
planPipeline(leads, now) -> [{ leadId }]
```

Selecciona leads `QUALIFIED` con NSS, `review_level = 'GREEN'`, `contract_due_at <= now`,
sin contrato vigente, sin `do_not_contact` ni `human_takeover`, con menos de 3 envíos
fallidos, y con `now` dentro de 8:00–21:00 hora de Ciudad de México (configurable con
`PIPELINE_HORA_INICIO` / `PIPELINE_HORA_FIN`, porque es una decisión operativa). Fuera de la
ventana no devuelve nada: el lead espera al siguiente tick diurno.

El envío vive en `lib/contracts/send.ts`, compartido por el cron y el panel: crea el
contrato, manda `caso_revisado_pensionmas` con el `sign_token` como parámetro del botón,
mueve el lead a `CONTRACT_PENDING` y registra `contract_sent` con `{ auto: true | false }`.

**Tick**: el plan Hobby de Vercel permite un solo cron diario, así que el tick de 15 minutos
lo dispara `pg_cron` + `pg_net` desde Supabase. El SQL queda en
`supabase/snippets/pipeline-cron.sql` (fuera de `migrations/` porque incluye el
`CRON_SECRET`). El cron diario de `vercel.json` sigue como está para los followups.

## Plantillas de WhatsApp (nuevas, es_MX, Utility)

**`revisando_caso_pensionmas`** — {{1}} nombre, {{2}} asesor.
> Hola {{1}}, soy {{2}} de Pensión+. Recibí tu evaluación y voy a revisar tu caso
> personalmente: tus días sin empleo, que tus datos de identidad cuadren y qué modalidad de
> retiro te conviene. Te escribo en menos de 1 hora con lo que encuentre.

Botones: `Tengo una duda` · `No enviar recordatorios` (quick reply).

**`contrato_listo_pensionmas`** — {{1}} nombre, {{2}} hallazgo, {{3}} asesor.
> Hola {{1}}, ya revisé tu caso. {{2}} Tu contrato de asesoría quedó listo para tu firma y
> el enlace es válido por 72 horas. Soy {{3}}, tu asesor en Pensión+, y cualquier duda me
> escribes por aquí.

Botones: `Firmar mi contrato` (URL dinámica `https://www.pensionmas.com.mx/firmar/{{1}}`) ·
`Quiero que me expliquen` (quick reply).

Corregido durante la implementación: la primera versión (`caso_revisado_pensionmas`)
mencionaba el precio y Meta la clasificó **MARKETING**, lo que la somete a límites por
usuario justo en el mensaje que entrega el contrato. La versión sin precio quedó UTILITY.
El precio sigue visible en la página de firma y en la cláusula tercera.

El hallazgo {{3}} se arma de un catálogo cerrado de frases verificables sobre datos que sí
tenemos (días de desempleo confirmados, checksums de NSS/CURP, modalidad aplicable). **Nunca
se afirma haber consultado al IMSS, a la AFORE o a CONSAR**: no tenemos ese acceso y
`PRODUCT.md` prohíbe la promesa que no se puede demostrar.

### Efecto colateral valioso: destraba el OTP

El quick reply `Quiero que me expliquen` genera un mensaje entrante, y eso **abre la ventana
de 24 h**. El webhook lo detecta, responde por texto libre y a partir de ahí el OTP —que hoy
va por texto libre porque `codigo_pensionmas` sigue bloqueada por la verificación del
negocio— sí se entrega. No sustituye a la plantilla Authentication, pero convierte el caso
"cliente nuevo que nunca escribió" en uno atendible mientras la verificación avanza.

## Cambios en la interfaz

**`/firmar/[token]`** — bloque nuevo arriba del contrato: "Revisado por {asesor}" con la
fecha, la lista de lo verificado y el honorario expresado como porcentaje. Es lo que liga la
firma al trabajo previo.

**`/resultado`** — sin botón de firma. Estado "tu caso está en revisión" con el asesor
asignado y el plazo de una hora.

**Panel del lead** — tarjeta de revisión con el semáforo, las banderas legibles, el contexto
de expediente/cuenta bancaria, y los botones "Enviar contrato ahora" y "Marcar revisado".
`POST /api/admin/leads/[id]/send-contract`.

## Corrección de arrastre

`planFollowups` dispara el recordatorio `nss` para todo lead `QUALIFIED` sin contrato. Con
el flujo nuevo, un lead que sí dio su NSS y está esperando revisión caería en esa rama y
recibiría un recordatorio pidiéndole un dato que ya entregó. Se añade `nss` a `FollowupLead`
y la rama exige `nss == null`.

## Errores y casos borde

- **Envío fallido del contrato**: se registra `contract_send_failed`, se borra el contrato
  recién creado y el lead **no** pasa a `CONTRACT_PENDING`; el siguiente tick reintenta.
  A los 3 fallos acumulados el pipeline lo excluye y queda para revisión manual.
- **Ámbar o rojo que nadie revisa**: el cliente ya recibió "te escribo en menos de 1 hora" y
  su contrato no sale solo. El panel muestra arriba un aviso con los casos vencidos que
  esperan decisión humana, para que no se queden en silencio.
- **Doble envío**: `lib/contracts/send.ts` verifica que no exista contrato vigente sin firmar
  antes de crear uno. El botón del panel y el cron pasan por la misma verificación.
- **Lead que responde antes de la hora**: si escribe por WhatsApp, `human_takeover` puede
  activarse desde el panel y el cron lo deja en paz.
- **Ventana horaria**: un lead que califica a las 23:00 recibe su "estamos revisando" al
  momento (está despierto, acaba de usar el sitio) y el contrato a las 8:00.
- **`WHATSAPP_ENABLED=false`**: igual que hoy, se registra el intento sin enviar y el flujo
  no se rompe.

## Pruebas

Unitarias (vitest, sin red ni base de datos):
- `lib/review/evaluate.test.ts` — cada bandera, precedencia RED > AMBER > GREEN, caso limpio.
- `lib/pipeline/plan.test.ts` — vencimiento, ventana horaria en ambos bordes, exclusiones
  (sin NSS, no verde, con contrato, opt-out, takeover).
- `lib/followups/plan.test.ts` — caso nuevo: lead `QUALIFIED` **con** NSS no recibe `nss`.
- `lib/pdf/contract.test.ts` y el texto del contrato — honorario como porcentaje.

## Decisiones tomadas sin consulta

Ricardo delegó el cierre del diseño. Estas son las decisiones que no alcanzó a ver:

1. **Expediente y cuenta bancaria no son banderas ámbar.** Si lo fueran, casi todos los
   leads caerían en revisión manual y el auto-aprueba-verdes no serviría de nada.
2. **El hallazgo del mensaje sale de un catálogo cerrado**, no de texto libre generado. Evita
   prometer trabajo que no se hizo.
3. **El quick reply extra en `caso_revisado_pensionmas`** se agrega principalmente para abrir
   la ventana de 24 h y destrabar el OTP.
4. **No se toca `main`.** El código depende de la migración `0006`; desplegarlo antes de
   aplicarla rompe producción.
