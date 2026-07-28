# Asistentes de CURP y NSS en el pre-calificador

**Fecha:** 2026-07-27 · **Principio rector:** que al cliente le cueste lo menos posible; nunca perder un lead por no tener un dato a la mano.

## Problema

En el paso "Identificación" del pre-calificador, quien no sabe su CURP o NSS tiene que salir de la página a buscarlos, y muchos no regresan.

## Solución

### 1. Orden de campos: CURP primero, NSS después

La CURP se puede generar en la página y el portal del IMSS localiza el NSS a partir de la CURP. Resolver la CURP primero simplifica el resto.

### 2. Asistente de CURP (100% en la página)

- Link bajo el campo: "¿No sabes tu CURP? Génerala aquí" → modal.
- Pide: nombre(s), primer apellido, segundo apellido (opcional), fecha de nacimiento, sexo, estado de nacimiento.
- Genera la CURP completa client-side: 16 caracteres deterministas del algoritmo público RENAPO + homoclave heurística (`0` para nacidos antes de 2000, `A` desde 2000) + dígito verificador calculado.
- Autollena el campo con aviso: "verifícala contra tu INE si la tienes a la mano".
- Implementación: `lib/curp/generate.ts` (función pura, sin dependencias ni servicios externos) + tests vitest con casos conocidos.

### 3. NSS opcional con asistente guiado

- El campo NSS deja de ser obligatorio en el formulario.
- Link bajo el campo: "¿No lo sabes? Sácalo en 2 minutos" → modal con 3 pasos:
  1. Botón "Copiar mi CURP" (toma la del campo).
  2. Botón que abre el portal oficial del IMSS (Localiza tu NSS) en pestaña nueva.
  3. "Te llega por correo en minutos; pégalo aquí al volver."
- También puede dejarlo vacío y continuar — el flujo no se detiene.

### 4. Backend: `POST /api/evaluate`

- `nss` opcional en `preQualifierSchema` (cadena vacía → ausente).
- Dedupe: con NSS, igual que hoy (un NSS = un lead). Sin NSS, buscar lead por **teléfono** y actualizar o insertar explícitamente (sustituye el `upsert onConflict: "nss"`, que con null duplicaría leads).
- El guard de "ya firmó" revisa por NSS y por teléfono.
- Elegible **con** NSS → contrato + `signUrl`, igual que hoy.
- Elegible **sin** NSS → responde `nssPending: true`, lead queda QUALIFIED, sin contrato (el PDF imprime el NSS, no puede generarse sin él).

### 5. Pantalla de resultado con `nssPending`

- Muestra la estimación normal + "Para generar tu contrato solo falta tu NSS": campo NSS, el mismo asistente y botón que re-envía la evaluación con el NSS → recibe su `signUrl`.
- Si cierra la página, el lead ya quedó guardado y se le da seguimiento por WhatsApp.

## Sin cambios

- `validateCURP` / `validateNSS` se conservan.
- Esquema de base de datos: sin migraciones (`nss` ya es nullable y UNIQUE permite múltiples NULL).
- Flujo de firma, OTP y PDF: sin cambios.

## Pruebas

- Unit (vitest): generador de CURP (casos conocidos, nombres compuestos, Ñ, palabras altisonantes del catálogo RENAPO, homoclave por año).
- Manual: flujo completo con y sin NSS; verificar que sin NSS no se crea contrato y que al completarlo llega el `signUrl`.
