# Asistentes de CURP y NSS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el cliente resuelva su CURP dentro de la página (generador RENAPO client-side) y pueda continuar sin NSS (asistente guiado + captura posterior en /resultado), sin perder leads.

**Architecture:** Generador de CURP como función pura en `lib/curp/` reutilizando `curpCheckDigit` existente. Dos modales (CURP y NSS) en `components/prequalifier/`. `nss` se vuelve opcional en el schema Zod y en `/api/evaluate`, que deduplica por teléfono cuando no hay NSS y responde `nssPending: true` sin crear contrato. La página `/resultado` muestra captura de NSS pendiente y re-envía la evaluación con el payload guardado en sessionStorage.

**Tech Stack:** Next.js 15 (App Router), React 19, Zod 4, shadcn/ui (Dialog, Select ya existen en `components/ui/`), vitest, Supabase (sin migraciones).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-27-curp-nss-asistentes-design.md`.
- Todo el copy de UI en español, tono simple ("lo más fácil posible para el cliente").
- Sin dependencias npm nuevas. Sin llamadas a servicios externos (el generador de CURP es 100% client-side).
- Sin migraciones de DB (`leads.nss` ya es nullable; UNIQUE permite múltiples NULL).
- Commits SIN firma de Claude ni Co-Authored-By (regla del usuario). Identidad git: `richyhoopd <theilluminatiduck@gmail.com>` (ya configurada).
- Correr tests con `npx vitest run <archivo>`.
- OJO al probar manualmente: `.env.local` apunta hoy a Supabase cloud **sin esquema aplicado**. Para pruebas locales, descomentar el bloque "Supabase local" de `.env.local` y comentar el de producción (Supabase local ya corre; admin local: `admin@tulanaya.local` / `Tulanaya2026!`).

---

### Task 1: Generador de CURP (`lib/curp/generate.ts`)

**Files:**
- Create: `lib/curp/generate.ts`
- Test: `lib/curp/generate.test.ts`

**Interfaces:**
- Consumes: `curpCheckDigit(base17: string): string` de `@/lib/validation/identifiers` (ya existe y está probado).
- Produces: `generateCurp(input: CurpInput): string` (CURP de 18 caracteres), `type CurpInput`, `ESTADOS: [string, string][]` (clave RENAPO → nombre para el `<Select>` de Task 2).

- [ ] **Step 1: Write the failing tests**

```ts
// lib/curp/generate.test.ts
import { describe, expect, it } from "vitest"
import { generateCurp, ESTADOS } from "./generate"
import { curpCheckDigit, validateCURP } from "@/lib/validation/identifiers"

const base = {
  nombres: "Carlos",
  apellidoPaterno: "Gómez",
  apellidoMaterno: "Martínez",
  fechaNacimiento: "1990-05-14",
  sexo: "H" as const,
  estado: "DF",
}

describe("generateCurp", () => {
  it("caso base con acentos", () => {
    expect(generateCurp(base)).toBe("GOMC900514HDFMRR05")
  })

  it("nombre compuesto que inicia con María usa el segundo nombre", () => {
    expect(
      generateCurp({
        nombres: "María Fernanda",
        apellidoPaterno: "García",
        apellidoMaterno: "López",
        fechaNacimiento: "2004-03-04",
        sexo: "M",
        estado: "MN",
      })
    ).toBe("GALF040304MMNRPRA4")
  })

  it("palabra altisonante se censura con X en la segunda posición", () => {
    expect(
      generateCurp({
        nombres: "Omar",
        apellidoPaterno: "Puente",
        apellidoMaterno: "Torres",
        fechaNacimiento: "1995-01-01",
        sexo: "H",
        estado: "JC",
      })
    ).toBe("PXTO950101HJCNRM04")
  })

  it("sin segundo apellido usa X; NE para nacidos en el extranjero", () => {
    expect(
      generateCurp({
        nombres: "Juan",
        apellidoPaterno: "Pérez",
        apellidoMaterno: "",
        fechaNacimiento: "1985-12-31",
        sexo: "H",
        estado: "NE",
      })
    ).toBe("PEXJ851231HNERXN09")
  })

  it("Ñ como consonante interna se sustituye por X", () => {
    expect(
      generateCurp({
        nombres: "Luis",
        apellidoPaterno: "Muñoz",
        apellidoMaterno: "Ávila",
        fechaNacimiento: "1999-10-10",
        sexo: "H",
        estado: "SR",
      })
    ).toBe("MUAL991010HSRXVS05")
  })

  it("ignora prefijos DE/LA/DEL en apellidos", () => {
    const curp = generateCurp({
      ...base,
      apellidoPaterno: "De la Cruz",
    })
    expect(curp.startsWith("CUMC")).toBe(true) // CRUZ → C + U, Martínez → M, Carlos → C
  })

  it("toda CURP generada pasa validateCURP sin warning", () => {
    for (const estado of ["DF", "JC", "NE"]) {
      const curp = generateCurp({ ...base, estado })
      const r = validateCURP(curp)
      expect(r.ok).toBe(true)
      expect(r.warning).toBeUndefined()
      expect(curp[17]).toBe(curpCheckDigit(curp.slice(0, 17)))
    }
  })

  it("catálogo de estados: 33 entradas incluyendo NE", () => {
    expect(ESTADOS).toHaveLength(33)
    expect(ESTADOS.map(([k]) => k)).toContain("NE")
  })
})
```

Nota: los literales esperados se calcularon a mano con el mismo algoritmo. Si al implementar un test falla **solo en el último dígito**, recalcula con `curpCheckDigit(curp.slice(0, 17))` y corrige el literal — los primeros 17 caracteres son la parte importante del algoritmo de construcción y esos sí deben coincidir exactamente.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/curp/generate.test.ts`
Expected: FAIL — `Cannot find module './generate'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/curp/generate.ts
import { curpCheckDigit } from "@/lib/validation/identifiers"

export type CurpInput = {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno?: string
  fechaNacimiento: string // "YYYY-MM-DD"
  sexo: "H" | "M"
  estado: string // clave RENAPO (ver ESTADOS)
}

export const ESTADOS: [string, string][] = [
  ["AS", "Aguascalientes"],
  ["BC", "Baja California"],
  ["BS", "Baja California Sur"],
  ["CC", "Campeche"],
  ["CL", "Coahuila"],
  ["CM", "Colima"],
  ["CS", "Chiapas"],
  ["CH", "Chihuahua"],
  ["DF", "Ciudad de México"],
  ["DG", "Durango"],
  ["GT", "Guanajuato"],
  ["GR", "Guerrero"],
  ["HG", "Hidalgo"],
  ["JC", "Jalisco"],
  ["MC", "Estado de México"],
  ["MN", "Michoacán"],
  ["MS", "Morelos"],
  ["NT", "Nayarit"],
  ["NL", "Nuevo León"],
  ["OC", "Oaxaca"],
  ["PL", "Puebla"],
  ["QT", "Querétaro"],
  ["QR", "Quintana Roo"],
  ["SP", "San Luis Potosí"],
  ["SL", "Sinaloa"],
  ["SR", "Sonora"],
  ["TC", "Tabasco"],
  ["TS", "Tamaulipas"],
  ["TL", "Tlaxcala"],
  ["VZ", "Veracruz"],
  ["YN", "Yucatán"],
  ["ZS", "Zacatecas"],
  ["NE", "Nací en el extranjero"],
]

// Instructivo RENAPO: prefijos que se ignoran al tomar letras de apellidos/nombres.
const PREFIJOS = new Set([
  "DA", "DAS", "DE", "DEL", "DER", "DI", "DIE", "DD",
  "EL", "LA", "LOS", "LAS", "LE", "LES", "MAC", "MC", "VAN", "VON", "Y",
])

// Nombres comunes: si el nombre compuesto inicia con uno de estos, se usa el segundo.
const NOMBRES_COMUNES = new Set(["MARIA", "MA", "JOSE", "J"])

// Catálogo RENAPO de palabras inconvenientes (se censura la 2a letra con X).
const ALTISONANTES = new Set([
  "BACA", "BAKA", "BUEI", "BUEY", "CACA", "CACO", "CAGA", "CAGO", "CAKA",
  "CAKO", "COGE", "COGI", "COJA", "COJE", "COJI", "COJO", "COLA", "CULO",
  "FALO", "FETO", "GETA", "GUEI", "GUEY", "JETA", "JOTO", "KACA", "KACO",
  "KAGA", "KAGO", "KAKA", "KAKO", "KOGE", "KOGI", "KOJA", "KOJE", "KOJI",
  "KOJO", "KOLA", "KULO", "LILO", "LOCA", "LOCO", "LOKA", "LOKO", "MAME",
  "MAMO", "MEAR", "MEAS", "MEON", "MIAR", "MION", "MOCO", "MOKO", "MULA",
  "MULO", "NACA", "NACO", "PEDA", "PEDO", "PENE", "PIPI", "PITO", "POPO",
  "PUTA", "PUTO", "QULO", "RATA", "ROBA", "ROBE", "ROBO", "RUIN", "SENO",
  "TETA", "VACA", "VAGA", "VAGO", "VAKA", "VUEI", "VUEY", "WUEI", "WUEY",
])

function normalizar(s: string): string {
  return s
    .toUpperCase()
    .replace(/Ñ/g, "\u0001") // preservar Ñ durante la des-acentuación
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0001/g, "Ñ")
    .replace(/[^A-ZÑ ]/g, "")
    .trim()
}

// Quita prefijos (DE, LA, MAC...) y devuelve la palabra significativa.
function palabraSignificativa(s: string): string {
  const partes = normalizar(s).split(/\s+/).filter(Boolean)
  while (partes.length > 1 && PREFIJOS.has(partes[0])) partes.shift()
  return partes[0] ?? ""
}

function nombreDePila(nombres: string): string {
  const partes = normalizar(nombres).split(/\s+/).filter(Boolean)
  while (partes.length > 1 && PREFIJOS.has(partes[0])) partes.shift()
  if (partes.length > 1 && NOMBRES_COMUNES.has(partes[0])) return partes[1]
  return partes[0] ?? ""
}

const esVocal = (c: string) => "AEIOU".includes(c)

function primeraLetra(palabra: string): string {
  const c = palabra[0] ?? "X"
  return c === "Ñ" ? "X" : c
}

function vocalInterna(palabra: string): string {
  for (let i = 1; i < palabra.length; i++) {
    if (esVocal(palabra[i])) return palabra[i]
  }
  return "X"
}

function consonanteInterna(palabra: string): string {
  for (let i = 1; i < palabra.length; i++) {
    const c = palabra[i]
    if (c !== " " && !esVocal(c)) return c === "Ñ" ? "X" : c
  }
  return "X"
}

export function generateCurp(input: CurpInput): string {
  const paterno = palabraSignificativa(input.apellidoPaterno)
  const materno = palabraSignificativa(input.apellidoMaterno ?? "")
  const nombre = nombreDePila(input.nombres)

  let prefijo =
    primeraLetra(paterno) +
    vocalInterna(paterno) +
    (materno ? primeraLetra(materno) : "X") +
    (nombre ? primeraLetra(nombre) : "X")
  if (ALTISONANTES.has(prefijo)) prefijo = prefijo[0] + "X" + prefijo.slice(2)

  const [anio, mes, dia] = input.fechaNacimiento.split("-")
  const fecha = anio.slice(2) + mes + dia

  const consonantes =
    consonanteInterna(paterno) +
    (materno ? consonanteInterna(materno) : "X") +
    consonanteInterna(nombre)

  const homoclave = Number(anio) < 2000 ? "0" : "A"

  const base17 =
    prefijo + fecha + input.sexo + input.estado + consonantes + homoclave
  return base17 + curpCheckDigit(base17)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/curp/generate.test.ts`
Expected: PASS (8 tests). Si un literal falla solo en el dígito 18, ver la nota del Step 1.

También correr la suite completa para no romper nada: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/curp/generate.ts lib/curp/generate.test.ts
git commit -m "feat: generador de CURP client-side (algoritmo RENAPO)"
```

---

### Task 2: NSS opcional en schema y `/api/evaluate` con `nssPending`

**Files:**
- Modify: `lib/validation/schemas.ts:20-30` (campo `nss`)
- Modify: `app/api/evaluate/route.ts`
- Test: `lib/validation/schemas.test.ts` (nuevo)

**Interfaces:**
- Consumes: `preQualifierSchema`, `validateNSS` existentes.
- Produces: `preQualifierSchema` donde `nss?: string` (ausente o vacío ⇒ `undefined`); respuesta de `/api/evaluate` con campo nuevo `nssPending: true` cuando es elegible sin NSS (y en ese caso **sin** `signUrl`). Task 3 y 5 dependen de esto.

- [ ] **Step 1: Write the failing test**

```ts
// lib/validation/schemas.test.ts
import { describe, expect, it } from "vitest"
import { preQualifierSchema } from "./schemas"

const valid = {
  fullName: "Carlos Gómez Martínez",
  phone: "5512345678",
  email: "",
  curp: "GOMC900514HDFMRR05",
  fechaBaja: "2026-05-01",
  monthlySalary: 12000,
  yearsContributing: 10,
  lastWithdrawalWithin5y: false,
  privacyConsent: true,
}

describe("preQualifierSchema nss opcional", () => {
  it("acepta sin nss y lo deja undefined", () => {
    const r = preQualifierSchema.safeParse({ ...valid })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.nss).toBeUndefined()
  })

  it("acepta nss vacío como undefined", () => {
    const r = preQualifierSchema.safeParse({ ...valid, nss: "" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.nss).toBeUndefined()
  })

  it("normaliza nss válido", () => {
    const r = preQualifierSchema.safeParse({ ...valid, nss: "1234567890 3" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.nss).toBe("12345678903")
  })

  it("rechaza nss malformado (no vacío)", () => {
    const r = preQualifierSchema.safeParse({ ...valid, nss: "123" })
    expect(r.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/validation/schemas.test.ts`
Expected: FAIL — los dos primeros tests (hoy `nss` es obligatorio).

- [ ] **Step 3: Modify the schema**

En `lib/validation/schemas.ts`, reemplazar el campo `nss` por:

```ts
  nss: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || !v.trim()) return undefined
      const r = validateNSS(v)
      if (!r.ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El NSS debe tener 11 dígitos",
        })
        return z.NEVER
      }
      return r.normalized!
    }),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/validation/schemas.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Modify `/api/evaluate`**

En `app/api/evaluate/route.ts`:

**5a.** Reemplazar la búsqueda del lead existente (líneas 21-26) — con NSS se busca por NSS, sin NSS por teléfono:

```ts
    // Un lead que ya firmó (o cobró) no debe resetearse por re-evaluarse.
    // Dedupe: por NSS cuando viene; si no, por teléfono.
    const { data: existingRows } = await db
      .from("leads")
      .select("id, status")
      .eq(d.nss ? "nss" : "phone", d.nss ?? d.phone)
      .order("created_at", { ascending: false })
      .limit(1)
    const existing = existingRows?.[0] ?? null
```

**5b.** En `leadRow`, la línea `nss: d.nss,` cambia a incluirse solo cuando viene (para no borrar un NSS ya capturado si el cliente re-evalúa sin él):

```ts
      ...(d.nss ? { nss: d.nss } : {}),
```

**5c.** Reemplazar el upsert (líneas 68-74) por update/insert explícito (el upsert `onConflict: "nss"` duplicaría leads con `nss` null):

```ts
    // Un NSS (o teléfono) = un lead: si ya existe, se actualiza y continúa su flujo.
    const { data: lead, error } = existing
      ? await db
          .from("leads")
          .update(leadRow)
          .eq("id", existing.id)
          .select("id")
          .single()
      : await db.from("leads").insert(leadRow).select("id").single()
    if (error) throw error
    leadId = lead.id
```

**5d.** Después del `if (!result.eligible)` (línea 85-87), antes de crear el contrato, cortar cuando no hay NSS — el PDF del contrato imprime el NSS y no puede generarse sin él:

```ts
    if (!d.nss) {
      await logEvent(leadId, "nss_pending", {})
      return NextResponse.json({
        eligible: true,
        result,
        commission: COMISION_DEFAULT,
        nssPending: true,
      })
    }
```

- [ ] **Step 6: Verify build and full test suite**

Run: `npx vitest run && npx tsc --noEmit`
Expected: todo PASS, sin errores de tipos.

- [ ] **Step 7: Commit**

```bash
git add lib/validation/schemas.ts lib/validation/schemas.test.ts app/api/evaluate/route.ts
git commit -m "feat: NSS opcional en pre-calificador; evaluate responde nssPending sin crear contrato"
```

---

### Task 3: Modal generador de CURP (`CurpHelperDialog`)

**Files:**
- Create: `components/prequalifier/CurpHelperDialog.tsx`

**Interfaces:**
- Consumes: `generateCurp`, `ESTADOS`, `type CurpInput` de `@/lib/curp/generate`; `Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger` de `@/components/ui/dialog`; `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` de `@/components/ui/select`; `Input`, `Label`, `Button` de `@/components/ui/`.
- Produces: `<CurpHelperDialog onGenerated={(curp: string) => void} />` — Task 4 lo monta bajo el campo CURP.

- [ ] **Step 1: Write the component**

```tsx
// components/prequalifier/CurpHelperDialog.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ESTADOS, generateCurp } from "@/lib/curp/generate"

export function CurpHelperDialog({
  onGenerated,
}: {
  onGenerated: (curp: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [nombres, setNombres] = useState("")
  const [paterno, setPaterno] = useState("")
  const [materno, setMaterno] = useState("")
  const [fecha, setFecha] = useState("")
  const [sexo, setSexo] = useState("")
  const [estado, setEstado] = useState("")
  const [error, setError] = useState("")

  const generar = () => {
    if (!nombres.trim() || !paterno.trim() || !fecha || !sexo || !estado) {
      setError("Llena todos los campos marcados para generar tu CURP")
      return
    }
    onGenerated(
      generateCurp({
        nombres,
        apellidoPaterno: paterno,
        apellidoMaterno: materno,
        fechaNacimiento: fecha,
        sexo: sexo as "H" | "M",
        estado,
      })
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-sm text-primary underline">
          ¿No sabes tu CURP? Génerala aquí en 30 segundos
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Genera tu CURP</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="curp-nombres">Nombre(s) *</Label>
            <Input
              id="curp-nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              placeholder="Como aparece en tu acta"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="curp-paterno">Primer apellido *</Label>
            <Input
              id="curp-paterno"
              value={paterno}
              onChange={(e) => setPaterno(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="curp-materno">Segundo apellido</Label>
            <Input
              id="curp-materno"
              value={materno}
              onChange={(e) => setMaterno(e.target.value)}
              placeholder="Déjalo vacío si no tienes"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="curp-fecha">Fecha de nacimiento *</Label>
            <Input
              id="curp-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sexo (como en tu acta) *</Label>
            <Select value={sexo} onValueChange={setSexo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="H">Hombre</SelectItem>
                <SelectItem value="M">Mujer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado donde naciste *</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map(([clave, nombre]) => (
                  <SelectItem key={clave} value={clave}>
                    {nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={generar}>
            Generar mi CURP
          </Button>
          <p className="text-xs text-muted-foreground">
            La generamos con el algoritmo oficial. Si tienes tu INE a la mano,
            verifica que coincida.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: sin errores. (La verificación visual llega en Task 4 cuando se monta en el formulario.)

- [ ] **Step 3: Commit**

```bash
git add components/prequalifier/CurpHelperDialog.tsx
git commit -m "feat: modal generador de CURP"
```

---

### Task 4: Modal asistente de NSS + integración en el formulario

**Files:**
- Create: `components/prequalifier/NssHelperDialog.tsx`
- Modify: `components/prequalifier/PreQualifierForm.tsx`

**Interfaces:**
- Consumes: `CurpHelperDialog` (Task 3), `validateNSS`/`validateCURP` existentes.
- Produces: `<NssHelperDialog curp={string} />` (Task 5 lo reutiliza); el form envía `nss: data.nss || undefined` y guarda el payload completo en `sessionStorage["tulanaya:solicitud"]` (Task 5 lo lee).

- [ ] **Step 1: Write NssHelperDialog**

```tsx
// components/prequalifier/NssHelperDialog.tsx
"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const IMSS_URL =
  "https://serviciosdigitales.imss.gob.mx/gestionAsegurados-web-externo/localizaNSS"

export function NssHelperDialog({ curp }: { curp: string }) {
  const [copied, setCopied] = useState(false)

  const copiar = async () => {
    await navigator.clipboard.writeText(curp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="text-sm text-primary underline">
          ¿No sabes tu NSS? Sácalo gratis en 2 minutos
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saca tu NSS en el portal del IMSS</DialogTitle>
        </DialogHeader>
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <div className="space-y-2">
              <p>Copia tu CURP (la vas a pegar en el portal del IMSS):</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copiar}
                disabled={!curp}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "¡Copiada!" : curp || "Primero llena tu CURP"}
              </Button>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <div className="space-y-2">
              <p>
                Abre el portal del IMSS (se abre en otra pestaña — esta página se
                queda como está), pega tu CURP y escribe tu correo:
              </p>
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={IMSS_URL} target="_blank" rel="noopener noreferrer">
                  Abrir portal del IMSS <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <p>
              Tu NSS te llega por correo en unos minutos. Regresa aquí y pégalo —
              y si tarda, no te preocupes: puedes continuar sin él y nos lo
              mandas después por WhatsApp.
            </p>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Integrate both dialogs into PreQualifierForm**

En `components/prequalifier/PreQualifierForm.tsx`:

**2a.** Imports nuevos:

```tsx
import { CurpHelperDialog } from "./CurpHelperDialog"
import { NssHelperDialog } from "./NssHelperDialog"
```

**2b.** Validación del paso 1 (líneas 69-76): CURP sigue obligatoria; NSS solo se valida si viene:

```tsx
    if (step === 1) {
      const curp = validateCURP(data.curp)
      if (!curp.ok) e.curp = "Revisa tu CURP (18 caracteres)"
      else if (curp.warning) w.curp = curp.warning
      if (data.nss.trim()) {
        const nss = validateNSS(data.nss)
        if (!nss.ok) e.nss = "El NSS tiene 11 dígitos (o déjalo vacío y dánoslo después)"
        else if (nss.warning) w.nss = nss.warning
      }
    }
```

**2c.** El paso 1 del render (líneas 191-204) queda con CURP primero y NSS opcional, cada uno con su asistente:

```tsx
          {step === 1 && (
            <>
              {field("curp", "CURP", { placeholder: "18 caracteres" })}
              <CurpHelperDialog
                onGenerated={(curp) => set("curp", curp)}
              />
              {field("nss", "NSS — si no lo tienes a la mano, déjalo vacío", {
                inputMode: "numeric",
                placeholder: "11 dígitos (opcional)",
              })}
              <NssHelperDialog curp={data.curp} />
              <p className="text-xs text-muted-foreground">
                Tus datos viajan cifrados y solo se usan para tu evaluación.
              </p>
            </>
          )}
```

**2d.** En `submit()` (líneas 110-122): enviar `nss` solo si viene y guardar el payload para que `/resultado` pueda completar el NSS después:

```tsx
      const payload = {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        nss: data.nss || undefined,
        curp: data.curp,
        fechaBaja: data.fechaBaja,
        monthlySalary: Number(data.monthlySalary),
        yearsContributing: Number(data.yearsContributing),
        lastWithdrawalWithin5y: data.lastWithdrawalWithin5y === "si",
        privacyConsent: data.privacyConsent,
        sourceRef: search.get("source") ?? undefined,
      }
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setServerError(body.error ?? "Ocurrió un error, intenta de nuevo.")
        return
      }
      sessionStorage.setItem("tulanaya:solicitud", JSON.stringify(payload))
      sessionStorage.setItem("tulanaya:resultado", JSON.stringify(body))
      router.push("/resultado")
```

- [ ] **Step 3: Verify compile + visual check**

Run: `npx tsc --noEmit` — sin errores.

Con el dev server corriendo y `.env.local` apuntando a Supabase **local** (ver Global Constraints), abrir `http://localhost:3000/pre-calificador`, llegar al paso Identificación y verificar: CURP arriba, NSS abajo con "(opcional)", ambos links abren su modal, el generador llena el campo CURP (probar con: Carlos Gómez Martínez, 14/05/1990, Hombre, Ciudad de México → debe llenar `GOMC900514HDFMRR05`), y el botón de copiar CURP del modal NSS copia el valor.

- [ ] **Step 4: Commit**

```bash
git add components/prequalifier/NssHelperDialog.tsx components/prequalifier/PreQualifierForm.tsx
git commit -m "feat: asistentes de CURP y NSS en el paso de identificación"
```

---

### Task 5: Captura de NSS pendiente en `/resultado`

**Files:**
- Create: `components/prequalifier/NssPendingCard.tsx`
- Modify: `app/(public)/resultado/page.tsx`

**Interfaces:**
- Consumes: `NssHelperDialog` (Task 4), `validateNSS`, respuesta `nssPending` de `/api/evaluate` (Task 2), `sessionStorage["tulanaya:solicitud"]` (Task 4).
- Produces: `<NssPendingCard onUpdated={(body: unknown) => void} />` — al completar el NSS re-evalúa y entrega el body nuevo (ya con `signUrl`) al padre.

- [ ] **Step 1: Write NssPendingCard**

```tsx
// components/prequalifier/NssPendingCard.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateNSS } from "@/lib/validation/identifiers"
import { NssHelperDialog } from "./NssHelperDialog"

export function NssPendingCard({
  onUpdated,
}: {
  onUpdated: (body: unknown) => void
}) {
  const [nss, setNss] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)

  const solicitudRaw =
    typeof window !== "undefined"
      ? sessionStorage.getItem("tulanaya:solicitud")
      : null

  const enviar = async () => {
    const check = validateNSS(nss)
    if (!check.ok) {
      setError("El NSS tiene 11 dígitos")
      return
    }
    if (!solicitudRaw) return
    setSending(true)
    setError("")
    try {
      const payload = { ...JSON.parse(solicitudRaw), nss: check.normalized }
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? "Ocurrió un error, intenta de nuevo.")
        return
      }
      sessionStorage.setItem("tulanaya:solicitud", JSON.stringify(payload))
      sessionStorage.setItem("tulanaya:resultado", JSON.stringify(body))
      onUpdated(body)
    } catch {
      setError("Sin conexión. Revisa tu internet e intenta de nuevo.")
    } finally {
      setSending(false)
    }
  }

  if (!solicitudRaw) {
    return (
      <div className="mt-6 rounded-lg border p-4 text-sm text-muted-foreground">
        Para firmar tu contrato nos falta tu NSS.{" "}
        <Link href="/pre-calificador" className="underline">
          Vuelve a evaluarte con tu NSS
        </Link>{" "}
        (toma 2 minutos) o mándanoslo por WhatsApp.
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">
        Para generar tu contrato solo falta tu NSS
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="nss-pendiente">Número de Seguridad Social (NSS)</Label>
        <Input
          id="nss-pendiente"
          inputMode="numeric"
          placeholder="11 dígitos"
          value={nss}
          onChange={(e) => setNss(e.target.value)}
          aria-invalid={!!error}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <NssHelperDialog curp={JSON.parse(solicitudRaw).curp ?? ""} />
      <Button className="w-full" onClick={enviar} disabled={sending}>
        {sending && <Loader2 className="size-4 animate-spin" />}
        Generar mi contrato
      </Button>
      <p className="text-xs text-muted-foreground">
        Si no lo tienes ahora, no pasa nada: guardamos tu evaluación y te
        contactamos por WhatsApp.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Integrate into resultado page**

En `app/(public)/resultado/page.tsx`:

**2a.** Import: `import { NssPendingCard } from "@/components/prequalifier/NssPendingCard"`

**2b.** En `type Payload`, agregar `nssPending?: boolean` (junto a `signUrl?: string`).

**2c.** Debajo del bloque `{data.signUrl && (...)}` (líneas 137-143), agregar:

```tsx
      {data.nssPending && !data.signUrl && (
        <NssPendingCard onUpdated={(body) => setData(body as Payload)} />
      )}
```

- [ ] **Step 3: Manual end-to-end test**

Con Supabase **local** activo en `.env.local` y el dev server corriendo:

1. Flujo **sin NSS**: pre-calificador completo dejando NSS vacío (usar CURP generada, teléfono `5599887766`, fecha de baja hace ~3 meses, salario 12000, 10 años, sin retiros). En `/resultado` debe verse la estimación + card "solo falta tu NSS" y **no** el botón de firmar.
2. En la card, pegar NSS `12345678903`, click "Generar mi contrato" → debe aparecer el botón "Firmar contrato de asesoría".
3. Verificar en Supabase Studio (http://127.0.0.1:54323) que hay **un solo lead** con ese teléfono, con `nss` capturado y status `CONTRACT_PENDING`, y eventos `nss_pending` + `evaluated` en `lead_events`.
4. Flujo **con NSS** (regresión): repetir con otro teléfono y NSS `98765432109` desde el formulario → `/resultado` muestra directo el botón de firmar.

- [ ] **Step 4: Full suite + build**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: todo PASS.

- [ ] **Step 5: Commit**

```bash
git add components/prequalifier/NssPendingCard.tsx "app/(public)/resultado/page.tsx"
git commit -m "feat: captura de NSS pendiente en resultado para generar contrato"
```
