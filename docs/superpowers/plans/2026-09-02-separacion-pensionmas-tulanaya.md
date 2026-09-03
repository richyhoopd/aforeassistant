# Separación Pensión+ / tulanaya — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover tulanaya (funnel AFORE) a repo y proyecto Vercel propios con historial íntegro, y convertir la carpeta/repo/dominio actuales en la landing de Pensión+ (calculadora Ley 73/97 + WhatsApp) con el branding navy/teal/oro.

**Architecture:** Parte 1 es operación de repos y Vercel: repo nuevo `richyhoopd/tulanaya`, proyecto Vercel `tulanaya` sin dominio, `mv` de carpetas. Parte 2 es demolición y reconstrucción dentro del repo `aforeassistant`: se borra todo lo que no es la calculadora, la lógica de cálculo sale a `lib/pension/calc.ts` con tests, y se reescriben tokens, layout, landing y calculadora con el sistema visual B.

**Tech Stack:** Next.js 15.5 (App Router, turbopack), React 19, Tailwind v4 (`@theme inline`), shadcn (radix-ui), lucide-react, vitest, Vercel CLI 58, gh CLI.

**Spec:** `docs/superpowers/specs/2026-09-02-separacion-pensionmas-tulanaya-design.md`

## Global Constraints

- Nunca imprimir valores de env vars ni secrets en la terminal, en chat ni en archivos versionados. Copiar con `vercel env pull` a un archivo temporal fuera del repo y borrarlo al terminar.
- Deploy a producción de `pensionmas.com.mx` **solo con aprobación explícita de Ricardo en el momento** (Task 12). Todo lo demás va a preview.
- Nada de Meta (Business Manager, WhatsApp, plantillas, webhook) se toca.
- Paleta exacta: navy `#10213A`, teal `#00A8A8`, oro `#C6A15B`, off-white `#F5F3EE`. Teal nunca como texto sobre claro; texto blanco nunca sobre teal.
- Prohibiciones de diseño: cards con contorno gris; alerts con borde de color + fondo tintado; citas en caja.
- Cuerpo ≥ 17px, labels ≥ 15px, targets táctiles ≥ 44px, `prefers-reduced-motion` respetado.
- Copy es-MX, sin urgencia, montos siempre "estimados".
- Commits en español, imperativo, prefijo `feat:`/`fix:`/`chore:`/`docs:`. Cada commit cierra con:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW
  ```
- Rutas: la carpeta vieja es `~/Work/personal/tulanaya` hasta Task 3; desde Task 3 es `~/Work/personal/pensionmas`. La carpeta nueva es `~/Work/personal/tulanaya-nuevo` hasta Task 3; después `~/Work/personal/tulanaya`.

---

## Parte 1 — Separación

### Task 1: Repo `tulanaya` nuevo con historial íntegro

**Files:**
- Ninguno del proyecto. Solo git remoto y clon.

**Interfaces:**
- Produces: repo `https://github.com/richyhoopd/tulanaya` con `main`, `feat/acompanamiento-post-firma`, `feat/revision-antes-de-firma`; clon en `~/Work/personal/tulanaya-nuevo` con `.env.local`.

- [ ] **Step 1: Verificar que el árbol está limpio y que el plan está commiteado**

Run:
```bash
cd ~/Work/personal/tulanaya && git status --short && git log --oneline -2
```
Expected: sin salida de `status`; el último commit es el del plan (`docs: plan de ...`). Si hay cambios sin commitear, detente y commitéalos primero.

- [ ] **Step 2: Crear el repo privado en GitHub**

Run:
```bash
gh repo create richyhoopd/tulanaya --private --description "tulanaya: asesoría para retiro parcial de AFORE por desempleo" 2>&1 | tail -1
```
Expected: `https://github.com/richyhoopd/tulanaya`. Si dice que ya existe, verifica con `gh repo view richyhoopd/tulanaya --json isEmpty` que esté vacío antes de seguir.

- [ ] **Step 3: Pushear las tres ramas con historial completo**

Run:
```bash
cd ~/Work/personal/tulanaya \
&& git remote add tulanaya https://github.com/richyhoopd/tulanaya.git \
&& git push tulanaya main feat/acompanamiento-post-firma feat/revision-antes-de-firma \
&& gh api repos/richyhoopd/tulanaya/commits?per_page=1 --jq '.[0].sha[0:7]'
```
Expected: el SHA impreso coincide con `git rev-parse --short main`.

- [ ] **Step 4: Verificar que el conteo de commits coincide**

Run:
```bash
cd ~/Work/personal/tulanaya && echo "local: $(git rev-list --count main)"; gh api "repos/richyhoopd/tulanaya/compare/$(git rev-list --max-parents=0 main | tail -1)...main" --jq '.total_commits + 1' | sed 's/^/remoto: /'
```
Expected: los dos números son iguales.

- [ ] **Step 5: Clonar a la carpeta nueva y copiar el `.env.local`**

Run:
```bash
cd ~/Work/personal \
&& git clone https://github.com/richyhoopd/tulanaya.git tulanaya-nuevo \
&& cp tulanaya/.env.local tulanaya-nuevo/.env.local \
&& cp tulanaya/content/.env tulanaya-nuevo/content/.env \
&& cd tulanaya-nuevo && git branch -a && ls -la .env.local content/.env
```
Expected: `remotes/origin/feat/acompanamiento-post-firma`, `remotes/origin/feat/revision-antes-de-firma`, `remotes/origin/main`; los dos `.env` existen.

- [ ] **Step 6: Instalar dependencias y correr los tests en el clon**

Run:
```bash
cd ~/Work/personal/tulanaya-nuevo && npm ci --silent && npx vitest run 2>&1 | tail -5
```
Expected: `Test Files  18 passed`, `Tests ... passed`. Si alguno falla, es un fallo preexistente: anótalo en el reporte y sigue (el clon es idéntico al original).

- [ ] **Step 7: Quitar el remoto temporal de la carpeta vieja**

Run:
```bash
cd ~/Work/personal/tulanaya && git remote remove tulanaya && git remote -v
```
Expected: solo `origin` → `aforeassistant`.

---

### Task 2: Proyecto Vercel `tulanaya` con env vars y deploy de humo

**Files:**
- Crea (fuera del repo, temporal): `~/Work/personal/.aforeassistant-prod.env`
- Crea: `~/Work/personal/tulanaya-nuevo/.vercel/project.json` (lo escribe `vercel link`)

**Interfaces:**
- Consumes: clon de Task 1.
- Produces: proyecto Vercel `lidfis-projects/tulanaya` con 14 env vars de producción y un deploy Ready en `https://tulanaya-<hash>.vercel.app` (la URL exacta la imprime el CLI).

- [ ] **Step 1: Exportar las env vars de producción del proyecto viejo a un archivo temporal**

Run:
```bash
cd ~/Work/personal/tulanaya \
&& vercel env pull --environment=production --yes ../.aforeassistant-prod.env >/dev/null \
&& grep -c "=" ../.aforeassistant-prod.env
```
Expected: un número ≥ 14. No hagas `cat` del archivo.

- [ ] **Step 2: Crear el proyecto Vercel y vincular el clon**

Run:
```bash
cd ~/Work/personal/tulanaya-nuevo \
&& vercel project add tulanaya --scope lidfis-projects 2>&1 | tail -1 \
&& vercel link --yes --scope lidfis-projects --project tulanaya 2>&1 | tail -1 \
&& cat .vercel/project.json
```
Expected: `"projectName":"tulanaya"` y `"orgId":"team_ByZfrrNRecPRePdAqN7DylSe"`.

- [ ] **Step 3: Conectar el repo de GitHub al proyecto**

Run:
```bash
cd ~/Work/personal/tulanaya-nuevo && vercel git connect https://github.com/richyhoopd/tulanaya 2>&1 | tail -2
```
Expected: `Connected GitHub repository richyhoopd/tulanaya!`. Si falla por permisos de la app de GitHub de Vercel, no bloquea: el deploy de humo se hace desde CLI (Step 5) y Ricardo conecta el repo después en `https://vercel.com/lidfis-projects/tulanaya/settings/git`.

- [ ] **Step 4: Cargar las 14 env vars en producción sin imprimir valores**

Run:
```bash
cd ~/Work/personal/tulanaya-nuevo && for k in COBRO_BANCO COBRO_CLABE COBRO_TITULAR CRON_SECRET NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_URL OTP_PEPPER SUPABASE_SERVICE_ROLE_KEY WHATSAPP_APP_SECRET WHATSAPP_ENABLED WHATSAPP_PHONE_NUMBER_ID WHATSAPP_TOKEN WHATSAPP_VERIFY_TOKEN; do
  v="$(grep "^$k=" ../.aforeassistant-prod.env | head -1 | cut -d= -f2-)"; v="${v%\"}"; v="${v#\"}"
  if [ -z "$v" ]; then echo "FALTA $k"; continue; fi
  printf '%s' "$v" | vercel env add "$k" production >/dev/null 2>&1 && echo "ok $k" || echo "ERROR $k"
done
```
Expected: 13 líneas `ok <NOMBRE>`. Cualquier `FALTA` o `ERROR` se reporta antes de seguir. `NEXT_PUBLIC_SITE_URL` se carga en Step 6 con la URL nueva.

- [ ] **Step 5: Deploy de humo a producción del proyecto nuevo (sin dominio custom)**

Run:
```bash
cd ~/Work/personal/tulanaya-nuevo && URL=$(vercel deploy --prod --yes 2>&1 | grep -o 'https://[^ ]*\.vercel\.app' | tail -1) && echo "$URL"
```
Expected: `https://tulanaya-....vercel.app`. La variable `URL` se usa en los pasos siguientes del mismo shell.

- [ ] **Step 6: Cargar `NEXT_PUBLIC_SITE_URL` con la URL nueva y redeploy**

Run:
```bash
cd ~/Work/personal/tulanaya-nuevo && printf '%s' "$URL" | vercel env add NEXT_PUBLIC_SITE_URL production >/dev/null && vercel deploy --prod --yes 2>&1 | grep -E "Production:|Error"
```
Expected: nueva URL Ready.

- [ ] **Step 7: Smoke test**

Run:
```bash
for p in / /pre-calificador /admin/login; do printf '%-20s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$URL$p")"; done; curl -s "$URL" | grep -o 'facebook-domain-verification[^>]*' | head -1
```
Expected: `200` en las tres rutas. La meta tag aparece (sigue en el código de tulanaya; se quita de tulanaya en otro momento, no en este plan).

- [ ] **Step 8: Borrar el archivo temporal de env vars**

Run:
```bash
rm ~/Work/personal/.aforeassistant-prod.env && ls ~/Work/personal/.aforeassistant-prod.env 2>&1 | tail -1
```
Expected: `No such file or directory`.

- [ ] **Step 9: Secrets del GitHub Action `content-publish` en el repo nuevo**

Run:
```bash
gh secret list -R richyhoopd/aforeassistant --json name --jq '.[].name'
```
Expected: lista de nombres (sin valores). Para cada nombre `N`, si existe `N=` en `~/Work/personal/tulanaya-nuevo/content/.env`:
```bash
cd ~/Work/personal/tulanaya-nuevo && for N in $(gh secret list -R richyhoopd/aforeassistant --json name --jq '.[].name'); do
  v="$(grep "^$N=" content/.env | head -1 | cut -d= -f2-)"
  if [ -z "$v" ]; then echo "SIN VALOR LOCAL: $N (Ricardo lo carga a mano en https://github.com/richyhoopd/tulanaya/settings/secrets/actions)"; continue; fi
  printf '%s' "$v" | gh secret set "$N" -R richyhoopd/tulanaya && echo "ok $N"
done
```
Expected: `ok` por cada secret o la línea `SIN VALOR LOCAL` que se reporta a Ricardo. `gh` no puede leer valores de secrets existentes; los que no estén en `content/.env` quedan como pendiente suyo.

---

### Task 3: Renombrar carpetas

**Files:**
- Mueve: `~/Work/personal/tulanaya` → `~/Work/personal/pensionmas`
- Mueve: `~/Work/personal/tulanaya-nuevo` → `~/Work/personal/tulanaya`

- [ ] **Step 1: Verificar que no hay procesos corriendo en ninguna de las dos carpetas**

Run:
```bash
lsof +D ~/Work/personal/tulanaya 2>/dev/null | awk 'NR>1{print $1}' | sort -u; lsof +D ~/Work/personal/tulanaya-nuevo 2>/dev/null | awk 'NR>1{print $1}' | sort -u
```
Expected: sin salida. Si aparece `node` o `supabase`, detén ese proceso antes (es el `next dev` o el Supabase local de tulanaya).

- [ ] **Step 2: Mover**

Run:
```bash
cd ~/Work/personal && mv tulanaya pensionmas && mv tulanaya-nuevo tulanaya && for d in pensionmas tulanaya; do printf '%-12s %s | %s\n' "$d" "$(git -C $d remote get-url origin)" "$(jq -r .projectName $d/.vercel/project.json)"; done
```
Expected:
```
pensionmas   https://github.com/richyhoopd/aforeassistant.git | aforeassistant
tulanaya     https://github.com/richyhoopd/tulanaya.git | tulanaya
```

- [ ] **Step 3: Verificar que el Supabase local de tulanaya sigue apuntando bien**

Run:
```bash
grep -n "project_id" ~/Work/personal/tulanaya/supabase/config.toml
```
Expected: una línea con `project_id`. Si el valor es `tulanaya`, no se toca. Si el valor era el nombre de la carpeta vieja no cambia nada: Supabase CLI usa `project_id`, no la ruta.

---

## Parte 2 — Landing Pensión+ (en `~/Work/personal/pensionmas`)

### Task 4: Extraer la lógica de cálculo a `lib/pension/calc.ts` con tests

**Files:**
- Create: `lib/pension/calc.ts`
- Create: `lib/pension/calc.test.ts`
- Modify: `components/pension/PensionCalculator.tsx:15-160` (tipos y funciones `calcLey73`/`calcLey97` inline se reemplazan por imports; la UI no cambia en esta task)

**Interfaces:**
- Produces:
  ```ts
  export type Ley73Form = { lastJobMonth: string; lastJobYear: string; currentlyWorking: boolean; monthlySalary: string; weeks: string; age: string }
  export type Ley73Input = { monthlySalary: number; weeks: number; age: number; currentlyWorking: boolean; lastJobYear?: number; lastJobMonth?: number }
  export type Ley73Result = { normal: number; optimized: number; basePercentage: number; ageFactor: number; hasRights: boolean; underAge: boolean; fewWeeks: boolean }
  export type Ley97Form = { edad: string; saldoAfore: string; salarioMensual: string; semanas: string; aportaciones: string; rendimiento: string }
  export type Ley97Input = { edad: number; saldoAfore: number; salarioMensual: number; semanas: number; aportaciones: number; rendimientoPct: number }
  export type Ley97Result = { pensionEstimada: number; saldoProyectado: number; modalidad: "Retiro programado" | "Renta vitalicia"; añosParaRetiro: number; cumpleSemanas: boolean }
  export type Parsed<I> = { ok: true; input: I } | { ok: false; errors: Record<string, string> }
  export function parseLey73(form: Ley73Form): Parsed<Ley73Input>
  export function parseLey97(form: Ley97Form): Parsed<Ley97Input>
  export function calcLey73(input: Ley73Input, now?: Date): Ley73Result
  export function calcLey97(input: Ley97Input): Ley97Result
  export const mxn: Intl.NumberFormat
  ```

- [ ] **Step 1: Crear la rama de trabajo**

Run:
```bash
cd ~/Work/personal/pensionmas && git checkout -b feat/landing-pensionmas && git branch --show-current
```
Expected: `feat/landing-pensionmas`.

- [ ] **Step 2: Escribir los tests que fallan**

Create `lib/pension/calc.test.ts`:
```ts
import { describe, expect, it } from "vitest"
import { calcLey73, calcLey97, parseLey73, parseLey97 } from "./calc"

const NOW = new Date(2026, 8, 2) // 2 sep 2026

describe("parseLey73", () => {
  it("rechaza el formulario vacío con un error por campo obligatorio", () => {
    const r = parseLey73({ lastJobMonth: "", lastJobYear: "", currentlyWorking: false, monthlySalary: "", weeks: "", age: "" })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(Object.keys(r.errors).sort()).toEqual(["age", "lastJobMonth", "lastJobYear", "monthlySalary", "weeks"])
  })

  it("no pide fecha de baja si está trabajando", () => {
    const r = parseLey73({ lastJobMonth: "", lastJobYear: "", currentlyWorking: true, monthlySalary: "25000", weeks: "1300", age: "65" })
    expect(r).toEqual({ ok: true, input: { monthlySalary: 25000, weeks: 1300, age: 65, currentlyWorking: true, lastJobYear: undefined, lastJobMonth: undefined } })
  })

  it("valida mes 1-12 y año ≥ 1970", () => {
    const r = parseLey73({ lastJobMonth: "13", lastJobYear: "1960", currentlyWorking: false, monthlySalary: "25000", weeks: "1300", age: "65" })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors).toEqual({ lastJobMonth: "Mes de 1 a 12", lastJobYear: "Ingresa el año de tu baja" })
  })
})

describe("calcLey73", () => {
  const base = { monthlySalary: 25000, weeks: 1300, age: 65, currentlyWorking: true }

  it("65 años, 1300 semanas: 53.75% y factor 1", () => {
    const r = calcLey73(base, NOW)
    expect(r.basePercentage).toBe(53.75)
    expect(r.ageFactor).toBe(1)
    expect(r.normal).toBe(13437.5)
    expect(r.optimized).toBe(33593.75)
    expect(r).toMatchObject({ hasRights: true, underAge: false, fewWeeks: false })
  })

  it("60 años aplica factor 0.75", () => {
    const r = calcLey73({ ...base, age: 60 }, NOW)
    expect(r.ageFactor).toBe(0.75)
    expect(r.normal).toBe(10078.125)
  })

  it("menor de 60 calcula como si tuviera 60 y lo marca", () => {
    const r = calcLey73({ ...base, age: 55 }, NOW)
    expect(r.underAge).toBe(true)
    expect(r.ageFactor).toBe(0.75)
    expect(r.normal).toBe(10078.125)
  })

  it("el porcentaje base se topa en 100", () => {
    const r = calcLey73({ ...base, weeks: 5000 }, NOW)
    expect(r.basePercentage).toBe(100)
    expect(r.normal).toBe(25000)
  })

  it("menos de 500 semanas: sin pensión, marcado fewWeeks", () => {
    const r = calcLey73({ ...base, weeks: 400 }, NOW)
    expect(r).toMatchObject({ normal: 0, optimized: 0, basePercentage: 0, ageFactor: 0, fewWeeks: true, hasRights: true })
  })

  it("más de 5 años sin cotizar y sin trabajar: pierde vigencia", () => {
    const r = calcLey73({ ...base, currentlyWorking: false, lastJobYear: 2015, lastJobMonth: 1 }, NOW)
    expect(r.hasRights).toBe(false)
    expect(r.normal).toBe(0)
  })

  it("baja reciente conserva vigencia", () => {
    const r = calcLey73({ ...base, currentlyWorking: false, lastJobYear: 2024, lastJobMonth: 1 }, NOW)
    expect(r.hasRights).toBe(true)
    expect(r.normal).toBe(13437.5)
  })
})

describe("parseLey97", () => {
  it("rechaza el formulario vacío", () => {
    const r = parseLey97({ edad: "", saldoAfore: "", salarioMensual: "", semanas: "", aportaciones: "", rendimiento: "5" })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(Object.keys(r.errors).sort()).toEqual(["edad", "salarioMensual", "saldoAfore", "semanas"])
  })

  it("acepta semanas 0 y aportaciones vacías como 0", () => {
    const r = parseLey97({ edad: "40", saldoAfore: "100000", salarioMensual: "10000", semanas: "0", aportaciones: "", rendimiento: "5" })
    expect(r).toEqual({ ok: true, input: { edad: 40, saldoAfore: 100000, salarioMensual: 10000, semanas: 0, aportaciones: 0, rendimientoPct: 5 } })
  })
})

describe("calcLey97", () => {
  it("a los 65 no proyecta: retiro programado sobre el saldo actual", () => {
    const r = calcLey97({ edad: 65, saldoAfore: 500000, salarioMensual: 25000, semanas: 900, aportaciones: 0, rendimientoPct: 5 })
    expect(r).toEqual({ pensionEstimada: 2083, saldoProyectado: 500000, modalidad: "Retiro programado", añosParaRetiro: 0, cumpleSemanas: true })
  })

  it("un año de aportación al 5%", () => {
    const r = calcLey97({ edad: 64, saldoAfore: 100000, salarioMensual: 10000, semanas: 700, aportaciones: 0, rendimientoPct: 5 })
    expect(r.saldoProyectado).toBe(112875)
    expect(r.pensionEstimada).toBe(470)
    expect(r.añosParaRetiro).toBe(1)
    expect(r.cumpleSemanas).toBe(false) // 700 + 52 = 752 < 850
  })

  it("saldo mayor a 1.5M sugiere renta vitalicia al 75%", () => {
    const r = calcLey97({ edad: 65, saldoAfore: 2_000_000, salarioMensual: 25000, semanas: 900, aportaciones: 0, rendimientoPct: 5 })
    expect(r.modalidad).toBe("Renta vitalicia")
    expect(r.pensionEstimada).toBe(6250)
  })
})
```

- [ ] **Step 3: Correr los tests y ver que fallan**

Run:
```bash
cd ~/Work/personal/pensionmas && npx vitest run lib/pension 2>&1 | tail -5
```
Expected: `Failed to resolve import "./calc"` o equivalente. FAIL.

- [ ] **Step 4: Implementar `lib/pension/calc.ts`**

Create `lib/pension/calc.ts` (misma lógica que hoy vive en el componente, sin cambios de fórmula):
```ts
export type Ley73Form = {
  lastJobMonth: string
  lastJobYear: string
  currentlyWorking: boolean
  monthlySalary: string
  weeks: string
  age: string
}

export type Ley73Input = {
  monthlySalary: number
  weeks: number
  age: number
  currentlyWorking: boolean
  lastJobYear?: number
  lastJobMonth?: number
}

export type Ley73Result = {
  normal: number
  optimized: number
  basePercentage: number
  ageFactor: number
  hasRights: boolean
  underAge: boolean
  fewWeeks: boolean
}

export type Ley97Form = {
  edad: string
  saldoAfore: string
  salarioMensual: string
  semanas: string
  aportaciones: string
  rendimiento: string
}

export type Ley97Input = {
  edad: number
  saldoAfore: number
  salarioMensual: number
  semanas: number
  aportaciones: number
  rendimientoPct: number
}

export type Ley97Result = {
  pensionEstimada: number
  saldoProyectado: number
  modalidad: "Retiro programado" | "Renta vitalicia"
  añosParaRetiro: number
  cumpleSemanas: boolean
}

export type Parsed<I> = { ok: true; input: I } | { ok: false; errors: Record<string, string> }

export const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

export function parseLey73(form: Ley73Form): Parsed<Ley73Input> {
  const salary = parseFloat(form.monthlySalary)
  const weeks = parseInt(form.weeks)
  const age = parseInt(form.age)
  const lastYear = parseInt(form.lastJobYear)
  const lastMonth = parseInt(form.lastJobMonth)

  const errors: Record<string, string> = {}
  if (!salary || salary <= 0) errors.monthlySalary = "Ingresa tu salario mensual promedio"
  if (!weeks || weeks < 0) errors.weeks = "Ingresa tus semanas cotizadas"
  if (!age || age < 18 || age > 100) errors.age = "Ingresa una edad válida"
  if (!form.currentlyWorking && (!lastMonth || lastMonth < 1 || lastMonth > 12))
    errors.lastJobMonth = "Mes de 1 a 12"
  if (!form.currentlyWorking && (!lastYear || lastYear < 1970))
    errors.lastJobYear = "Ingresa el año de tu baja"
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    input: {
      monthlySalary: salary,
      weeks,
      age,
      currentlyWorking: form.currentlyWorking,
      lastJobYear: form.currentlyWorking ? undefined : lastYear,
      lastJobMonth: form.currentlyWorking ? undefined : lastMonth,
    },
  }
}

export function calcLey73(input: Ley73Input, now: Date = new Date()): Ley73Result {
  const { monthlySalary: salary, weeks, age } = input

  let hasRights = true
  if (!input.currentlyWorking && input.lastJobYear && input.lastJobMonth) {
    const diffYears =
      (now.getTime() - new Date(input.lastJobYear, input.lastJobMonth - 1, 1).getTime()) /
      (1000 * 60 * 60 * 24 * 365)
    if (diffYears > 5) hasRights = false
  }

  const underAge = age < 60
  const fewWeeks = weeks < 500

  if (fewWeeks || !hasRights) {
    return { normal: 0, optimized: 0, basePercentage: 0, ageFactor: 0, hasRights, underAge, fewWeeks }
  }

  let basePercentage = 35
  if (weeks > 500) basePercentage += Math.floor((weeks - 500) / 52) * 1.25
  basePercentage = Math.min(basePercentage, 100)

  const factors: Record<number, number> = { 60: 0.75, 61: 0.8, 62: 0.85, 63: 0.9, 64: 0.95 }
  const effAge = underAge ? 60 : age
  const ageFactor = effAge >= 65 ? 1 : factors[effAge]

  const normal = ((salary * basePercentage) / 100) * ageFactor
  return { normal, optimized: normal * 2.5, basePercentage, ageFactor, hasRights, underAge, fewWeeks }
}

export function parseLey97(form: Ley97Form): Parsed<Ley97Input> {
  const edad = parseInt(form.edad)
  const saldo = parseFloat(form.saldoAfore)
  const salario = parseFloat(form.salarioMensual)
  const semanas = parseInt(form.semanas)
  const voluntarias = parseFloat(form.aportaciones) || 0
  const rendimientoPct = parseFloat(form.rendimiento)

  const errors: Record<string, string> = {}
  if (!edad || edad < 18 || edad > 100) errors.edad = "Ingresa una edad válida"
  if (!saldo || saldo <= 0) errors.saldoAfore = "Ingresa tu saldo actual de AFORE"
  if (!salario || salario <= 0) errors.salarioMensual = "Ingresa un salario válido"
  if (Number.isNaN(semanas) || form.semanas === "") errors.semanas = "Ingresa tus semanas cotizadas"
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    input: { edad, saldoAfore: saldo, salarioMensual: salario, semanas, aportaciones: voluntarias, rendimientoPct },
  }
}

export function calcLey97(input: Ley97Input): Ley97Result {
  const rendimiento = input.rendimientoPct / 100
  const añosParaRetiro = Math.max(65 - input.edad, 0)
  const aportacionAnual = (input.salarioMensual * 0.0625 + input.aportaciones) * 12

  let saldoProyectado = input.saldoAfore
  for (let i = 0; i < añosParaRetiro; i++) {
    saldoProyectado = (saldoProyectado + aportacionAnual) * (1 + rendimiento)
  }

  const retiroProgramado = saldoProyectado / 240
  const rentaVitalicia = retiroProgramado * 0.75

  let modalidad: Ley97Result["modalidad"] = "Retiro programado"
  let pension = retiroProgramado
  if (saldoProyectado > 1_500_000) {
    modalidad = "Renta vitalicia"
    pension = rentaVitalicia
  }

  const cumpleSemanas = input.semanas + añosParaRetiro * 52 >= 850

  return {
    pensionEstimada: Math.round(pension),
    saldoProyectado: Math.round(saldoProyectado),
    modalidad,
    añosParaRetiro,
    cumpleSemanas,
  }
}
```

- [ ] **Step 5: Correr los tests y ver que pasan**

Run:
```bash
cd ~/Work/personal/pensionmas && npx vitest run lib/pension 2>&1 | tail -5
```
Expected: `Tests  14 passed`.

- [ ] **Step 6: Reemplazar la lógica inline del componente por los imports**

En `components/pension/PensionCalculator.tsx`:
- Borra las líneas 15-37 (`const mxn = ...`, `type Ley73Result`, `type Ley97Result`).
- Agrega tras los imports: `import { calcLey73, calcLey97, mxn, parseLey73, parseLey97, type Ley73Result, type Ley97Result } from "@/lib/pension/calc"`.
- Reemplaza el cuerpo de `const calcLey73 = () => { ... }` (líneas 60-124) por:
  ```ts
  const onCalcLey73 = () => {
    const parsed = parseLey73(l73)
    if (!parsed.ok) { setE73(parsed.errors); return }
    setE73({})
    setR73(calcLey73(parsed.input))
  }
  ```
- Reemplaza el cuerpo de `const calcLey97 = () => { ... }` (líneas 138-183) por:
  ```ts
  const onCalcLey97 = () => {
    const parsed = parseLey97(l97)
    if (!parsed.ok) { setE97(parsed.errors); return }
    setE97({})
    setR97(calcLey97(parsed.input))
  }
  ```
- Cambia `onClick={calcLey73}` → `onClick={onCalcLey73}` y `onClick={calcLey97}` → `onClick={onCalcLey97}`.

- [ ] **Step 7: Build y lint**

Run:
```bash
cd ~/Work/personal/pensionmas && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep -E "error|Error|✓ Compiled|Compiled successfully" | head -5
```
Expected: lint sin errores; build compila.

- [ ] **Step 8: Commit**

```bash
cd ~/Work/personal/pensionmas && git add lib/pension components/pension/PensionCalculator.tsx && git commit -m "feat(pension): extraer cálculo Ley 73/97 a lib/pension/calc con tests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW"
```

---

### Task 5: Demoler el funnel

**Files:**
- Delete: `app/(public)/pre-calificador`, `app/(public)/resultado`, `app/(public)/firmar`, `app/(public)/terminos`, `app/firmado`, `app/admin`, `app/api`
- Delete: `components/admin`, `components/prequalifier`, `components/sign`, `components/landing/HeroShowcase.tsx`, `components/landing/MoneyBackdrop.tsx`, `components/landing/StatsBars.tsx`
- Delete: `lib/contracts`, `lib/curp`, `lib/eligibility`, `lib/followups`, `lib/pdf`, `lib/pipeline`, `lib/review`, `lib/supabase`, `lib/validation`, `lib/whatsapp`, `lib/checklist.ts`, `lib/checklist.test.ts`, `lib/config.ts`, `lib/events.ts`, `lib/otp.ts`, `lib/otp.test.ts`, `lib/site-url.ts`
- Delete: `supabase/`, `content/`, `.github/workflows/content-publish.yml`, `vercel.json`, `scripts/`, `docs/marketing`, `docs/whatsapp`, `PENDIENTES.md`
- Delete: `public/fonts/`, `public/images/avatar-1.jpg`, `avatar-2.jpg`, `avatar-3.jpg`, `asesoria-datos.jpg`, `asesoria-hombre.jpg`, `asesoria-mujer.jpg`, `exito-whatsapp.jpg`, `persona-hero.png`, `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- Delete: `components/ui/badge.tsx`, `dialog.tsx`, `select.tsx`, `sonner.tsx`, `table.tsx`, `textarea.tsx`
- Modify: `package.json`, `.gitignore`, `.env.example`

- [ ] **Step 1: Borrar rutas, lib, componentes e infra**

Run:
```bash
cd ~/Work/personal/pensionmas && git rm -rq \
  "app/(public)/pre-calificador" "app/(public)/resultado" "app/(public)/firmar" "app/(public)/terminos" app/firmado app/admin app/api \
  components/admin components/prequalifier components/sign components/landing/HeroShowcase.tsx components/landing/MoneyBackdrop.tsx components/landing/StatsBars.tsx \
  lib/contracts lib/curp lib/eligibility lib/followups lib/pdf lib/pipeline lib/review lib/supabase lib/validation lib/whatsapp lib/checklist.ts lib/checklist.test.ts lib/config.ts lib/events.ts lib/otp.ts lib/otp.test.ts lib/site-url.ts \
  supabase content .github/workflows/content-publish.yml vercel.json scripts docs/marketing docs/whatsapp PENDIENTES.md \
  public/fonts public/images/avatar-1.jpg public/images/avatar-2.jpg public/images/avatar-3.jpg public/images/asesoria-datos.jpg public/images/asesoria-hombre.jpg public/images/asesoria-mujer.jpg public/images/exito-whatsapp.jpg public/images/persona-hero.png public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg \
  components/ui/badge.tsx components/ui/dialog.tsx components/ui/select.tsx components/ui/sonner.tsx components/ui/table.tsx components/ui/textarea.tsx \
  "app/(public)/page.tsx" \
&& git mv "app/(public)/pension/page.tsx" "app/(public)/page.tsx" \
&& find app components lib public -type f | sort
```
La landing vieja del funnel se borra y `/pension` pasa a ser `/` desde ya (con el diseño viejo; se reescribe en Task 10). Así el build no se rompe por imports de componentes borrados.

Expected exacto:
```
app/(public)/layout.tsx
app/(public)/page.tsx
app/(public)/privacidad/page.tsx
app/favicon.ico
app/globals.css
app/layout.tsx
components/landing/Reveal.tsx
components/pension/PensionCalculator.tsx
components/ui/button.tsx
components/ui/card.tsx
components/ui/checkbox.tsx
components/ui/input.tsx
components/ui/label.tsx
lib/pension/calc.test.ts
lib/pension/calc.ts
lib/utils.ts
public/images/pensionmas-icon.png
```

- [ ] **Step 2: Reescribir `package.json`**

Reemplaza el archivo completo por:
```json
{
  "name": "pensionmas",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.27.0",
    "next": "15.5.22",
    "radix-ui": "^1.6.7",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^6.0.4",
    "eslint": "^9",
    "eslint-config-next": "15.5.22",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 3: Reescribir `.env.example` y podar `.gitignore`**

`.env.example` queda con una sola línea:
```
# La landing de Pensión+ no usa variables de entorno.
```
En `.gitignore` borra las líneas `!content/.env.example`, `content/.env`, `content/out/`, `__pycache__/`, `*.pyc` y el comentario `# python`.

- [ ] **Step 4: Reinstalar y verificar que no queda ningún import muerto**

Run:
```bash
cd ~/Work/personal/pensionmas && rm -rf node_modules package-lock.json && npm install --silent && grep -rn "supabase\|whatsapp\|pdf-lib\|zod\|sonner\|react-hook-form\|framer-motion\|next-themes\|server-only\|@/lib/config\|@/lib/site-url" app components lib --include="*.ts" --include="*.tsx" | grep -v "^lib/pension"
```
Expected: solo `components/pension/PensionCalculator.tsx:4:import { motion, useReducedMotion } from "framer-motion"` (se quita en Task 9). Nada más.

- [ ] **Step 5: Build (se espera que falle por framer-motion y por `/pre-calificador` en el layout)**

Run:
```bash
cd ~/Work/personal/pensionmas && npm run build 2>&1 | grep -iE "error|cannot find|module not found" | head -5
```
Expected: `Module not found: Can't resolve 'framer-motion'`. Es el único error aceptable aquí; se resuelve en Task 9. Si aparece cualquier otro, arréglalo antes del commit.

- [ ] **Step 6: Commit**

```bash
cd ~/Work/personal/pensionmas && git add -A && git commit -m "chore: eliminar el funnel de tulanaya; Pensión+ queda como landing

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW"
```

---

### Task 6: Tokens, fuentes y layout raíz

**Files:**
- Modify: `app/globals.css` (reescritura completa)
- Modify: `app/layout.tsx` (reescritura completa)
- Modify: `components/ui/button.tsx:6,50-56` (radios)
- Create: `scripts/contrast.mjs`

**Interfaces:**
- Produces: clases Tailwind `bg-ink text-ink bg-primary text-primary-foreground text-primary-text bg-accent text-accent text-accent-deep text-muted-on-navy bg-navy-2 font-display font-sans`, utilidades `.anim-rise`, `.reveal`, `.reveal-hidden`, `.card-shadow`, `.draw-curve`.

- [ ] **Step 1: Script de contraste**

Create `scripts/contrast.mjs`:
```js
// Uso: node scripts/contrast.mjs  — imprime el ratio WCAG 2 de cada par de la spec y falla si alguno baja del mínimo declarado.
const hex = (h) => h.replace("#", "").match(/.{2}/g).map((x) => parseInt(x, 16) / 255)
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const ratio = (a, b) => { const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }

const pairs = [
  ["texto navy / off-white", "#10213A", "#F5F3EE", 4.5],
  ["navy / botón teal", "#10213A", "#00A8A8", 4.5],
  ["primary-text / off-white", "#0E6E6E", "#F5F3EE", 4.5],
  ["primary-text / blanco", "#0E6E6E", "#FFFFFF", 4.5],
  ["oro / navy", "#C6A15B", "#10213A", 4.5],
  ["accent-deep / off-white", "#8A6A2E", "#F5F3EE", 4.5],
  ["muted-foreground / off-white", "#4F5868", "#F5F3EE", 4.5],
  ["muted-foreground / blanco", "#4F5868", "#FFFFFF", 4.5],
  ["muted-on-navy / navy", "#B7BFCC", "#10213A", 4.5],
  ["blanco / navy", "#FFFFFF", "#10213A", 4.5],
  ["ring / off-white (gráfico)", "#007A7A", "#F5F3EE", 3],
  ["teal / navy (gráfico)", "#00A8A8", "#10213A", 3],
]
let fail = false
for (const [name, a, b, min] of pairs) {
  const r = ratio(a, b)
  const ok = r >= min
  if (!ok) fail = true
  console.log(`${ok ? "ok " : "FAIL"} ${r.toFixed(2)}:1  ${name}  (mín ${min})`)
}
process.exit(fail ? 1 : 0)
```

Run:
```bash
cd ~/Work/personal/pensionmas && node scripts/contrast.mjs
```
Expected: 12 líneas `ok`, exit 0. Si alguna falla, el hex de ese token se ajusta (más oscuro para texto en claro, más claro para texto en navy) hasta pasar, y se anota el nuevo hex en `DESIGN.md` (Task 10).

- [ ] **Step 2: Reescribir `app/globals.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --radius: 0.75rem;

  --background: oklch(0.964 0.007 89);
  --foreground: oklch(0.247 0.053 258);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.247 0.053 258);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.247 0.053 258);
  --primary: oklch(0.662 0.113 195);
  --primary-foreground: oklch(0.247 0.053 258);
  --primary-text: oklch(0.489 0.08 195);
  --secondary: oklch(0.93 0.012 89);
  --secondary-foreground: oklch(0.247 0.053 258);
  --muted: oklch(0.93 0.012 89);
  --muted-foreground: oklch(0.459 0.029 262);
  --muted-on-navy: oklch(0.802 0.02 260);
  --accent: oklch(0.728 0.099 82);
  --accent-foreground: oklch(0.247 0.053 258);
  --accent-deep: oklch(0.544 0.087 81);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.901 0.014 89);
  --input: oklch(0.93 0.012 89);
  --ring: oklch(0.525 0.09 195);
  --ink: oklch(0.247 0.053 258);
  --navy-2: oklch(0.293 0.061 258);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-text: var(--primary-text);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted-on-navy: var(--muted-on-navy);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent-deep: var(--accent-deep);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-ink: var(--ink);
  --color-navy-2: var(--navy-2);
  --font-sans: var(--font-nunito);
  --font-display: var(--font-outfit);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-background text-foreground;
    font-size: 1.0625rem;
    line-height: 1.6;
  }
  h1, h2, h3 {
    text-wrap: balance;
  }
}

/* Sombra única de card: nunca borde gris. */
.card-shadow {
  box-shadow:
    0 1px 2px oklch(0.247 0.053 258 / 0.05),
    0 16px 40px -24px oklch(0.247 0.053 258 / 0.22);
}

/* Reveal de scroll: visible por defecto, solo anima con JS. */
.reveal {
  transition:
    opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal-hidden {
  opacity: 0;
  transform: translateY(16px);
}

@keyframes rise-in {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}
.anim-rise {
  animation: rise-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--rise-delay, 0s);
}

/* Las curvas del logo se dibujan una vez. */
@keyframes draw {
  to { stroke-dashoffset: 0; }
}
.draw-curve {
  stroke-dasharray: 1600;
  stroke-dashoffset: 1600;
  animation: draw 0.9s ease-out forwards;
  animation-delay: var(--draw-delay, 0.2s);
}

/* Entrada del resultado de la calculadora, sin framer-motion. */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.anim-fade-up {
  animation: fade-up 0.2s ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { transition: none; }
  .anim-rise, .anim-fade-up { animation: none; }
  .draw-curve { animation: none; stroke-dashoffset: 0; }
}
```

- [ ] **Step 3: Reescribir `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next"
import { Nunito_Sans, Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
})

const SITE = "https://www.pensionmas.com.mx"

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Pensión+ — Calcula y mejora tu pensión del IMSS",
  description:
    "Calcula tu pensión estimada bajo Ley 73 o Ley 97 del IMSS y descubre estrategias reales (Modalidad 40, asignaciones familiares, ahorro voluntario) para mejorarla.",
  openGraph: {
    title: "Pensión+ — Calcula y mejora tu pensión del IMSS",
    description: "Calculadora Ley 73 / Ley 97 y estrategias para mejorar tu pensión. Asesoría clara, sin promesas.",
    url: SITE,
    siteName: "Pensión+",
    locale: "es_MX",
    type: "website",
  },
  twitter: { card: "summary_large_image", site: "@pensionmasmx" },
  verification: {
    other: {
      "facebook-domain-verification": "h76gliptuljmxgit6aicr71tmqujv8",
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#10213A",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body className={`${outfit.variable} ${nunito.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Radios del botón**

En `components/ui/button.tsx`: en la cadena base de `cva` (línea 6) cambia `rounded-full` → `rounded-lg`. En `size` cambia `xs: "h-6 gap-1 rounded-full` → `rounded-md`, `sm: "h-8 gap-1.5 rounded-full` → `rounded-md`, `lg: "h-10 rounded-full px-6` → `"h-12 rounded-lg px-6 text-base`, `"icon-xs": "size-6 rounded-full` → `rounded-md`. Borra las clases `dark:` de `destructive`, `outline` y `ghost` (no hay modo oscuro).

- [ ] **Step 5: Verificar que Tailwind genera las clases nuevas**

Run:
```bash
cd ~/Work/personal/pensionmas && npm run build 2>&1 | grep -iE "error|module not found" | head -3
```
Expected: solo el `Module not found: Can't resolve 'framer-motion'` (pendiente de Task 9). Ningún error de CSS.

- [ ] **Step 6: Commit**

```bash
cd ~/Work/personal/pensionmas && git add app/globals.css app/layout.tsx components/ui/button.tsx scripts/contrast.mjs && git commit -m "feat(brand): tokens navy/teal/oro, Outfit + Nunito Sans y verificación de contraste

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW"
```

---

### Task 7: Logo, curvas, favicon y OG

**Files:**
- Create: `components/brand/Logo.tsx`
- Create: `components/brand/Curvas.tsx`
- Create: `app/icon.svg`
- Create: `app/apple-icon.tsx`
- Create: `app/opengraph-image.tsx`
- Delete: `app/favicon.ico`, `public/images/pensionmas-icon.png`

**Interfaces:**
- Produces:
  ```tsx
  export function Logo({ tone, className }: { tone: "light" | "dark"; className?: string }) // "dark" = wordmark blanco para fondos navy; "light" = wordmark navy para fondos claros
  export function Curvas({ className, animate }: { className?: string; animate?: boolean }) // SVG decorativo aria-hidden, 800x260 viewBox, dos paths teal y oro
  ```

- [ ] **Step 1: `components/brand/Logo.tsx`**

El wordmark es tipográfico (Outfit 500, minúsculas) con el "+" en teal; no se traza en SVG para que escale con la fuente y herede `currentColor`.
```tsx
import { cn } from "@/lib/utils"

export function Logo({ tone, className }: { tone: "light" | "dark"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display font-medium lowercase leading-none tracking-[-0.02em]",
        tone === "dark" ? "text-white" : "text-ink",
        className
      )}
      aria-label="Pensión+"
    >
      pensión
      <span aria-hidden className={cn("ml-0.5 font-bold", tone === "dark" ? "text-primary" : "text-ring")}>
        +
      </span>
    </span>
  )
}
```
Nota: sobre claro el "+" usa `--ring` (#007A7A) porque el teal puro da 2.6:1 sobre off-white; sobre navy usa el teal de marca.

- [ ] **Step 2: `components/brand/Curvas.tsx`**

```tsx
export function Curvas({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 260"
      fill="none"
      className={className}
      preserveAspectRatio="xMaxYMax meet"
    >
      <path
        d="M0 240 C 260 240, 440 120, 800 20"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={animate ? "draw-curve" : undefined}
      />
      <path
        d="M0 258 C 280 258, 470 160, 800 62"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        style={animate ? ({ "--draw-delay": "0.45s" } as React.CSSProperties) : undefined}
        className={animate ? "draw-curve" : undefined}
      />
    </svg>
  )
}
```

- [ ] **Step 3: Favicon SVG (`app/icon.svg`)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="32" fill="#10213A"/>
  <rect x="27" y="14" width="10" height="36" rx="2" fill="#00A8A8"/>
  <rect x="14" y="27" width="36" height="10" rx="2" fill="#00A8A8"/>
</svg>
```

- [ ] **Step 4: Apple icon y OG con `ImageResponse`**

Create `app/apple-icon.tsx`:
```tsx
import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#10213A", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 40 }}>
        <div style={{ position: "relative", width: 100, height: 100, display: "flex" }}>
          <div style={{ position: "absolute", left: 36, top: 0, width: 28, height: 100, background: "#00A8A8", borderRadius: 6 }} />
          <div style={{ position: "absolute", left: 0, top: 36, width: 100, height: 28, background: "#00A8A8", borderRadius: 6 }} />
        </div>
      </div>
    ),
    size
  )
}
```

Create `app/opengraph-image.tsx`:
```tsx
import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Pensión+ — Calcula y mejora tu pensión del IMSS"

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#10213A", display: "flex", flexDirection: "column", justifyContent: "center", padding: 96, color: "white", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: -2, display: "flex" }}>
          pensión<span style={{ color: "#00A8A8", marginLeft: 6 }}>+</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: "#B7BFCC", maxWidth: 900 }}>
          Calcula tu pensión del IMSS (Ley 73 / Ley 97) y descubre cómo mejorarla.
        </div>
        <svg viewBox="0 0 800 260" width="700" height="228" style={{ position: "absolute", right: 0, bottom: 0 }}>
          <path d="M0 240 C 260 240, 440 120, 800 20" stroke="#00A8A8" strokeWidth="4" fill="none" />
          <path d="M0 258 C 280 258, 470 160, 800 62" stroke="#C6A15B" strokeWidth="3" fill="none" />
        </svg>
      </div>
    ),
    size
  )
}
```

- [ ] **Step 5: Borrar el favicon viejo**

Run:
```bash
cd ~/Work/personal/pensionmas && git rm -q app/favicon.ico && ls app
```
Expected: `app` contiene `icon.svg apple-icon.tsx opengraph-image.tsx` y ya no `favicon.ico`. El PNG `public/images/pensionmas-icon.png` se borra en Task 8, cuando el layout deje de usarlo.

- [ ] **Step 6: Commit**

```bash
cd ~/Work/personal/pensionmas && git add -A app components/brand && git commit -m "feat(brand): logo tipográfico, curvas SVG, favicon, apple-icon y OG

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW"
```

---

### Task 8: Header, footer y aviso de privacidad

**Files:**
- Modify: `app/(public)/layout.tsx` (reescritura)
- Modify: `app/(public)/privacidad/page.tsx` (reescritura)
- Create: `lib/site.ts`

**Interfaces:**
- Produces: `export const WA_LINK: string` y `export const WA_DISPLAY = "33 4968 7609"` en `lib/site.ts`.

- [ ] **Step 1: `lib/site.ts`**

```ts
export const WA_LINK =
  "https://wa.me/523349687609?text=Hola%2C%20us%C3%A9%20la%20calculadora%20de%20pensi%C3%B3n%20y%20quiero%20mejorar%20mi%20pensi%C3%B3n"
export const WA_DISPLAY = "33 4968 7609"
export const SITE_NAME = "Pensión+"
export const SITE_DOMAIN = "pensionmas.com.mx"
```

- [ ] **Step 2: Reescribir `app/(public)/layout.tsx`**

```tsx
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { WA_LINK } from "@/lib/site"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Logo tone="light" className="text-[28px] sm:text-[32px]" />
          </Link>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-bold text-primary-foreground transition-colors duration-150 hover:bg-ring hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <MessageCircle className="size-5" aria-hidden />
            WhatsApp
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-ink text-muted-on-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo tone="dark" className="text-[36px]" />
              <p className="mt-4 max-w-xs text-[15px] leading-relaxed">
                Calcula tu pensión del IMSS y conoce las estrategias para mejorarla. Asesoría clara, sin
                promesas.
              </p>
            </div>
            <nav aria-label="Páginas" className="text-[15px]">
              <p className="font-bold text-white">Páginas</p>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/" className="transition-colors hover:text-white">Inicio</Link></li>
                <li><Link href="/#calculadora" className="transition-colors hover:text-white">Calculadora</Link></li>
                <li><Link href="/#estrategias" className="transition-colors hover:text-white">Estrategias</Link></li>
                <li><Link href="/#preguntas" className="transition-colors hover:text-white">Preguntas</Link></li>
              </ul>
            </nav>
            <nav aria-label="Legal y contacto" className="text-[15px]">
              <p className="font-bold text-white">Legal y contacto</p>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/privacidad" className="transition-colors hover:text-white">Aviso de privacidad</Link></li>
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-white">
                    <MessageCircle className="size-4 text-primary" aria-hidden />
                    WhatsApp
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-12 space-y-3 border-t border-white/10 pt-8 text-sm leading-relaxed text-white/60">
            <p>
              Pensión+ es un servicio privado de asesoría informativa. No somos una AFORE, institución
              financiera ni autoridad; no tenemos vínculo con CONSAR, las AFOREs ni el IMSS.
            </p>
            <p>
              Los montos de esta página son estimaciones con base en las reglas generales del IMSS. El
              dictamen final siempre lo emite el IMSS.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/60">
            <p>© {new Date().getFullYear()} Pensión+. Todos los derechos reservados.</p>
            <p>pensionmas.com.mx</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 3: Reescribir `app/(public)/privacidad/page.tsx`**

```tsx
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Aviso de privacidad — Pensión+" }

const sections: { h: string; p: string[] }[] = [
  {
    h: "Responsable",
    p: [
      "Grupo Inmobiliario HeredaBienes, con domicilio en Av. López Mateos Norte 507, Col. Herrera y Cairo, C.P. 44680, Guadalajara, Jalisco, México (el \"Responsable\"), es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
    ],
  },
  {
    h: "Qué datos tratamos",
    p: [
      "Este sitio no tiene formularios ni cuentas. La calculadora funciona en tu navegador: los datos que escribes (edad, salario, semanas, saldo) no se envían a ningún servidor ni se guardan.",
      "Si decides escribirnos por WhatsApp, tratamos tu número de teléfono, tu nombre y la información que nos compartas para responder tu consulta. WhatsApp es un servicio de Meta Platforms, Inc. y se rige por su propio aviso de privacidad.",
    ],
  },
  {
    h: "Finalidades",
    p: [
      "Responder tu consulta y, si lo pides, darte asesoría sobre tu pensión. No usamos tus datos para publicidad ni los compartimos con terceros, salvo obligación legal.",
    ],
  },
  {
    h: "Derechos ARCO",
    p: [
      "Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos escribiendo al mismo WhatsApp por el que nos contactaste. Respondemos en un plazo máximo de 20 días hábiles.",
    ],
  },
  {
    h: "Cookies",
    p: ["Este sitio no usa cookies de rastreo ni herramientas de analítica."],
  },
  {
    h: "Cambios a este aviso",
    p: ["Cualquier cambio se publica en esta misma página con la fecha de actualización."],
  },
]

export default function PrivacidadPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-tight text-ink">
        Aviso de privacidad
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">Última actualización: 2 de septiembre de 2026.</p>
      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-2xl font-semibold text-ink">{s.h}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-foreground/85">
              {s.p.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Borrar el PNG del logo viejo**

Run:
```bash
cd ~/Work/personal/pensionmas && git rm -q public/images/pensionmas-icon.png && rmdir public/images 2>/dev/null; grep -rn "pensionmas-icon" app components || echo "sin referencias"
```
Expected: `sin referencias`.

- [ ] **Step 5: Commit**

```bash
cd ~/Work/personal/pensionmas && git add -A "app/(public)/layout.tsx" "app/(public)/privacidad/page.tsx" lib/site.ts public && git commit -m "feat(landing): header y footer con la marca nueva; aviso de privacidad reducido

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW"
```

---

### Task 9: Calculadora con el sistema visual B (sin framer-motion)

**Files:**
- Modify: `components/pension/PensionCalculator.tsx` (reescritura completa de la UI; la lógica ya vive en `lib/pension/calc.ts`)

**Interfaces:**
- Consumes: `parseLey73, parseLey97, calcLey73, calcLey97, mxn` y tipos de `@/lib/pension/calc`.
- Produces: `export function PensionCalculator()` sin props; incluye `<noscript>` con CTA.

- [ ] **Step 1: Reescribir el componente**

```tsx
"use client"

import { useId, useState } from "react"
import { AlertCircle, Calculator, CheckCircle2, MessageCircle, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Curvas } from "@/components/brand/Curvas"
import { WA_LINK } from "@/lib/site"
import {
  calcLey73,
  calcLey97,
  mxn,
  parseLey73,
  parseLey97,
  type Ley73Form,
  type Ley73Result,
  type Ley97Form,
  type Ley97Result,
} from "@/lib/pension/calc"

const inputCls =
  "mt-1.5 h-12 rounded-lg border-0 bg-secondary px-3 text-base text-ink shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white"
const labelCls = "text-[15px] font-semibold text-ink"
const hintCls = "mt-1 text-[15px] text-muted-foreground"
const btnCls =
  "flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground transition-colors duration-150 hover:bg-ring hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null
  return (
    <p id={id} role="alert" className="mt-1 text-[15px] font-semibold text-destructive">
      {msg}
    </p>
  )
}

export function PensionCalculator() {
  const uid = useId()
  const [tab, setTab] = useState<"ley73" | "ley97">("ley73")

  const [l73, setL73] = useState<Ley73Form>({
    lastJobMonth: "",
    lastJobYear: "",
    currentlyWorking: false,
    monthlySalary: "",
    weeks: "",
    age: "",
  })
  const [r73, setR73] = useState<Ley73Result | null>(null)
  const [e73, setE73] = useState<Record<string, string>>({})

  const [l97, setL97] = useState<Ley97Form>({
    edad: "",
    saldoAfore: "",
    salarioMensual: "",
    semanas: "",
    aportaciones: "",
    rendimiento: "5",
  })
  const [r97, setR97] = useState<Ley97Result | null>(null)
  const [e97, setE97] = useState<Record<string, string>>({})

  const onCalcLey73 = () => {
    const parsed = parseLey73(l73)
    if (!parsed.ok) {
      setE73(parsed.errors)
      return
    }
    setE73({})
    setR73(calcLey73(parsed.input))
  }

  const onCalcLey97 = () => {
    const parsed = parseLey97(l97)
    if (!parsed.ok) {
      setE97(parsed.errors)
      return
    }
    setE97({})
    setR97(calcLey97(parsed.input))
  }

  const f = (n: string) => `${uid}-${n}`

  return (
    <div className="card-shadow relative mx-auto w-full max-w-5xl rounded-2xl bg-card p-5 sm:p-8">
      <noscript>
        <p className="mb-6 rounded-lg bg-accent/25 p-4 text-ink">
          La calculadora necesita JavaScript. Si prefieres, escríbenos por{" "}
          <a href={WA_LINK} className="font-bold underline">WhatsApp</a> y la hacemos contigo.
        </p>
      </noscript>

      <div className="flex justify-center">
        <div className="inline-flex w-full max-w-sm rounded-lg bg-secondary p-1" role="tablist" aria-label="Ley aplicable">
          {(
            [
              ["ley73", "Ley 73", Calculator],
              ["ley97", "Ley 97", TrendingUp],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={f(`tab-${key}`)}
              aria-selected={tab === key}
              aria-controls={f(`panel-${key}`)}
              onClick={() => setTab(key)}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-[15px] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                tab === key ? "bg-ink text-white" : "text-muted-foreground hover:text-ink"
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        {/* Formulario */}
        <div role="tabpanel" id={f(`panel-${tab}`)} aria-labelledby={f(`tab-${tab}`)}>
          {tab === "ley73" ? (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onCalcLey73() }} noValidate>
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink">Calculadora Ley 73</h3>
                <p className={hintCls}>Con solo 4 datos sabrás cuánto podrías recibir cada mes.</p>
              </div>

              <fieldset>
                <legend className={labelCls}>Fecha de baja de tu último trabajo</legend>
                <div className="mt-1.5 flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor={f("l73-mes")} className="text-[15px] text-muted-foreground">Mes</Label>
                    <Input id={f("l73-mes")} type="number" inputMode="numeric" min={1} max={12} placeholder="MM"
                      disabled={l73.currentlyWorking} value={l73.lastJobMonth}
                      aria-invalid={!!e73.lastJobMonth} aria-describedby={e73.lastJobMonth ? f("e-l73-mes") : undefined}
                      onChange={(e) => setL73({ ...l73, lastJobMonth: e.target.value })} className={inputCls} />
                    <FieldError id={f("e-l73-mes")} msg={e73.lastJobMonth} />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={f("l73-ano")} className="text-[15px] text-muted-foreground">Año</Label>
                    <Input id={f("l73-ano")} type="number" inputMode="numeric" min={1970} max={2026} placeholder="AAAA"
                      disabled={l73.currentlyWorking} value={l73.lastJobYear}
                      aria-invalid={!!e73.lastJobYear} aria-describedby={e73.lastJobYear ? f("e-l73-ano") : undefined}
                      onChange={(e) => setL73({ ...l73, lastJobYear: e.target.value })} className={inputCls} />
                    <FieldError id={f("e-l73-ano")} msg={e73.lastJobYear} />
                  </div>
                </div>
                <label className="mt-3 flex min-h-11 items-center gap-3 text-[15px] text-ink">
                  <Checkbox
                    className="size-5"
                    checked={l73.currentlyWorking}
                    onCheckedChange={(c) => setL73({ ...l73, currentlyWorking: c === true })}
                  />
                  Actualmente estoy trabajando
                </label>
              </fieldset>

              <div>
                <Label htmlFor={f("l73-salario")} className={labelCls}>Salario mensual (promedio de últimos 5 años)</Label>
                <Input id={f("l73-salario")} type="number" inputMode="numeric" placeholder="$25,000" value={l73.monthlySalary}
                  aria-invalid={!!e73.monthlySalary} aria-describedby={e73.monthlySalary ? f("e-l73-salario") : undefined}
                  onChange={(e) => setL73({ ...l73, monthlySalary: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l73-salario")} msg={e73.monthlySalary} />
              </div>

              <div>
                <Label htmlFor={f("l73-semanas")} className={labelCls}>Semanas cotizadas</Label>
                <Input id={f("l73-semanas")} type="number" inputMode="numeric" placeholder="1,300" value={l73.weeks}
                  aria-invalid={!!e73.weeks} aria-describedby={e73.weeks ? f("e-l73-semanas") : f("h-l73-semanas")}
                  onChange={(e) => setL73({ ...l73, weeks: e.target.value })} className={inputCls} />
                <p id={f("h-l73-semanas")} className={hintCls}>Referencia: 25 años trabajados ≈ 1,300 semanas.</p>
                <FieldError id={f("e-l73-semanas")} msg={e73.weeks} />
              </div>

              <div>
                <Label htmlFor={f("l73-edad")} className={labelCls}>Edad actual</Label>
                <Input id={f("l73-edad")} type="number" inputMode="numeric" placeholder="60" value={l73.age}
                  aria-invalid={!!e73.age} aria-describedby={e73.age ? f("e-l73-edad") : undefined}
                  onChange={(e) => setL73({ ...l73, age: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l73-edad")} msg={e73.age} />
              </div>

              <button type="submit" className={btnCls}>Calcular mi pensión estimada</button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onCalcLey97() }} noValidate>
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink">Calculadora Ley 97</h3>
                <p className={hintCls}>Tu pensión depende del saldo que acumules en tu AFORE.</p>
              </div>

              <div>
                <Label htmlFor={f("l97-edad")} className={labelCls}>Edad actual</Label>
                <Input id={f("l97-edad")} type="number" inputMode="numeric" placeholder="45" value={l97.edad}
                  aria-invalid={!!e97.edad} aria-describedby={e97.edad ? f("e-l97-edad") : undefined}
                  onChange={(e) => setL97({ ...l97, edad: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l97-edad")} msg={e97.edad} />
              </div>

              <div>
                <Label htmlFor={f("l97-saldo")} className={labelCls}>Saldo actual en tu AFORE</Label>
                <Input id={f("l97-saldo")} type="number" inputMode="numeric" placeholder="$350,000" value={l97.saldoAfore}
                  aria-invalid={!!e97.saldoAfore} aria-describedby={e97.saldoAfore ? f("e-l97-saldo") : f("h-l97-saldo")}
                  onChange={(e) => setL97({ ...l97, saldoAfore: e.target.value })} className={inputCls} />
                <p id={f("h-l97-saldo")} className={hintCls}>Viene en tu estado de cuenta de AFORE.</p>
                <FieldError id={f("e-l97-saldo")} msg={e97.saldoAfore} />
              </div>

              <div>
                <Label htmlFor={f("l97-salario")} className={labelCls}>Salario mensual actual</Label>
                <Input id={f("l97-salario")} type="number" inputMode="numeric" placeholder="$25,000" value={l97.salarioMensual}
                  aria-invalid={!!e97.salarioMensual} aria-describedby={e97.salarioMensual ? f("e-l97-salario") : undefined}
                  onChange={(e) => setL97({ ...l97, salarioMensual: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l97-salario")} msg={e97.salarioMensual} />
              </div>

              <div>
                <Label htmlFor={f("l97-semanas")} className={labelCls}>Semanas cotizadas</Label>
                <Input id={f("l97-semanas")} type="number" inputMode="numeric" placeholder="800" value={l97.semanas}
                  aria-invalid={!!e97.semanas} aria-describedby={e97.semanas ? f("e-l97-semanas") : undefined}
                  onChange={(e) => setL97({ ...l97, semanas: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l97-semanas")} msg={e97.semanas} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <Label htmlFor={f("l97-voluntarias")} className={labelCls}>Aportación voluntaria mensual</Label>
                  <Input id={f("l97-voluntarias")} type="number" inputMode="numeric" placeholder="$0" value={l97.aportaciones}
                    onChange={(e) => setL97({ ...l97, aportaciones: e.target.value })} className={inputCls} />
                </div>
                <div className="sm:w-48">
                  <Label htmlFor={f("l97-rendimiento")} className={labelCls}>Rendimiento anual</Label>
                  <select
                    id={f("l97-rendimiento")}
                    value={l97.rendimiento}
                    onChange={(e) => setL97({ ...l97, rendimiento: e.target.value })}
                    className="mt-1.5 h-12 w-full rounded-lg border-0 bg-secondary px-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="3">3% conservador</option>
                    <option value="5">5% moderado</option>
                    <option value="7">7% optimista</option>
                  </select>
                </div>
              </div>

              <button type="submit" className={btnCls}>Proyectar mi pensión</button>
            </form>
          )}
        </div>

        {/* Resultado */}
        <div className="lg:sticky lg:top-24" aria-live="polite">
          {tab === "ley73" ? (
            r73 === null ? (
              <ResultPlaceholder text="Llena tus datos y calcula: aquí verás tu pensión mensual estimada bajo la Ley 73." />
            ) : (
              <ResultPanel key={JSON.stringify(r73)}>
                {!r73.hasRights || r73.fewWeeks ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-1 size-6 shrink-0 text-accent" aria-hidden />
                    <div>
                      <h4 className="font-display text-xl font-semibold text-white">
                        {r73.fewWeeks ? "Aún no llegas a 500 semanas" : "Sin vigencia de derechos"}
                      </h4>
                      <p className="mt-2 leading-relaxed text-muted-on-navy">
                        {r73.fewWeeks
                          ? "La pensión Ley 73 requiere al menos 500 semanas cotizadas. Hay caminos para sumar semanas (por ejemplo, Modalidad 40): platícanos tu caso y lo revisamos."
                          : "Han pasado más de 5 años desde tu última cotización y no estás activo en el IMSS. En este caso no es posible pensionarse por Ley 73, salvo que se reactive la vigencia. Eso también se puede planear: platícanos tu caso."}
                      </p>
                      <WaLink />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[15px] font-semibold text-muted-on-navy">Pensión mensual estimada (Ley 73)</p>
                    <p className="mt-2 font-display text-[clamp(2.5rem,8vw,3.5rem)] font-semibold leading-none tracking-[-0.02em] text-accent tabular-nums">
                      {mxn.format(r73.normal)}
                    </p>
                    {r73.underAge && (
                      <p className="mt-3 text-[15px] text-muted-on-navy">
                        Calculada como si te pensionaras a los 60 años (la edad mínima para solicitarla).
                      </p>
                    )}
                    <p className="mt-4 leading-relaxed text-muted-on-navy">
                      Se calculó con un <strong className="text-white">{r73.basePercentage.toFixed(2)}%</strong> sobre tu
                      salario promedio y un factor por edad de retiro del{" "}
                      <strong className="text-white">{(r73.ageFactor * 100).toFixed(0)}%</strong>.
                    </p>
                    <div className="mt-5 rounded-xl bg-navy-2 p-4">
                      <p className="flex items-center gap-2 text-[15px] font-bold text-white">
                        <TrendingUp className="size-4 text-primary" aria-hidden />
                        Con estrategias de optimización podría llegar hasta
                      </p>
                      <p className="mt-1 font-display text-3xl font-semibold text-white tabular-nums">
                        {mxn.format(r73.optimized)}
                      </p>
                      <p className="mt-2 text-[15px] text-muted-on-navy">
                        Estimación ilustrativa con estrategias como Modalidad 40 y asignaciones familiares. El
                        resultado depende de tu caso y del dictamen del IMSS.
                      </p>
                    </div>
                    <WaLink />
                  </div>
                )}
              </ResultPanel>
            )
          ) : r97 === null ? (
            <ResultPlaceholder text="Llena tus datos y proyecta: aquí verás tu saldo estimado a los 65 años y la pensión mensual que alcanzaría." />
          ) : (
            <ResultPanel key={JSON.stringify(r97)}>
              <p className="text-[15px] font-semibold text-muted-on-navy">Pensión mensual estimada (Ley 97, a los 65 años)</p>
              <p className="mt-2 font-display text-[clamp(2.5rem,8vw,3.5rem)] font-semibold leading-none tracking-[-0.02em] text-accent tabular-nums">
                {mxn.format(r97.pensionEstimada)}
              </p>
              <dl className="mt-5 space-y-2 text-[15px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-on-navy">Saldo proyectado en tu AFORE</dt>
                  <dd className="font-bold text-white tabular-nums">{mxn.format(r97.saldoProyectado)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-on-navy">Modalidad sugerida</dt>
                  <dd className="font-bold text-white">{r97.modalidad}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-on-navy">Años para tu retiro</dt>
                  <dd className="font-bold text-white tabular-nums">{r97.añosParaRetiro}</dd>
                </div>
              </dl>
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-navy-2 p-4 text-[15px] text-muted-on-navy">
                {r97.cumpleSemanas ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                )}
                {r97.cumpleSemanas
                  ? "Vas en camino de cumplir las semanas mínimas. Las aportaciones voluntarias y un mejor rendimiento pueden cambiar mucho el resultado final."
                  : "Con tu ritmo actual no alcanzarías las 850 semanas mínimas que pide la Ley 97. Se puede corregir a tiempo: platícanos tu caso."}
              </p>
              <WaLink />
            </ResultPanel>
          )}
          <p className="mt-4 px-2 text-[15px] leading-relaxed text-muted-foreground">
            Estos cálculos son estimaciones informativas con base en las reglas generales del IMSS. Los montos
            finales dependen de tu historial exacto, la vigencia de tus derechos y el dictamen oficial.
          </p>
        </div>
      </div>
    </div>
  )
}

function ResultPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="anim-fade-up relative overflow-hidden rounded-2xl bg-ink p-6 sm:p-8">
      <Curvas className="pointer-events-none absolute -bottom-2 -right-6 w-56 opacity-70" />
      <div className="relative">{children}</div>
    </div>
  )
}

function ResultPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl bg-secondary p-8">
      <p className="max-w-xs text-center text-muted-foreground">{text}</p>
    </div>
  )
}

function WaLink() {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-bold text-primary-foreground transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
    >
      <MessageCircle className="size-4" aria-hidden />
      Platicar mi caso
    </a>
  )
}
```

- [ ] **Step 2: Tests, lint y build**

Run:
```bash
cd ~/Work/personal/pensionmas && npx vitest run 2>&1 | tail -3 && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep -iE "error|module not found|✓|Compiled" | head -5
```
Expected: `Tests  14 passed`; lint limpio; build compila (ya no hay `framer-motion`). Si el build se queja de `/pre-calificador` en `app/(public)/page.tsx`, es la landing vieja: se reescribe en Task 10, sigue.

- [ ] **Step 3: Commit**

```bash
cd ~/Work/personal/pensionmas && git add components/pension/PensionCalculator.tsx && git commit -m "feat(calculadora): UI con la marca nueva, accesible y sin framer-motion

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW"
```

---

### Task 10: La landing en `/`, redirect de `/pension`, 404, sitemap y docs

**Files:**
- Modify: `app/(public)/page.tsx` (reescritura completa; desde Task 5 contiene el `/pension` viejo)
- Modify: `next.config.ts` (redirect)
- Create: `app/not-found.tsx`, `app/sitemap.ts`, `app/robots.ts`
- Modify: `DESIGN.md`, `PRODUCT.md` (reescritura); Create: `PENDIENTES.md`

- [ ] **Step 1: Reescribir `app/(public)/page.tsx`**

```tsx
import { MessageCircle, Plus } from "lucide-react"
import { Curvas } from "@/components/brand/Curvas"
import { Reveal } from "@/components/landing/Reveal"
import { PensionCalculator } from "@/components/pension/PensionCalculator"
import { WA_LINK } from "@/lib/site"

const leyes = [
  {
    nombre: "Ley 73",
    lema: "La oportunidad dorada",
    chip: "Antes de julio de 1997",
    aplica: "Aplica si comenzaste a cotizar antes del 1 de julio de 1997.",
    navy: true,
    puntos: [
      "Pensión vitalicia garantizada por el Estado",
      "Solo 500 semanas cotizadas requeridas",
      "Aguinaldo anual incluido",
      "Basada en el promedio salarial de tus últimos 5 años",
    ],
  },
  {
    nombre: "Ley 97",
    lema: "Tu esfuerzo, tu recompensa",
    chip: "Después de julio de 1997",
    aplica: "Aplica si comenzaste a cotizar después del 1 de julio de 1997.",
    navy: false,
    puntos: [
      "Pensión basada en el saldo de tu AFORE",
      "850 semanas requeridas en 2025 (aumenta cada año)",
      "Renta vitalicia o retiro programado",
      "Depende de los rendimientos de inversión",
    ],
  },
]

const garantizada = [
  { monto: "$3,414", etiqueta: "Pensión mínima" },
  { monto: "$6,000", etiqueta: "Promedio nacional" },
  { monto: "$10,732", etiqueta: "Pensión máxima" },
]

const estrategias = [
  {
    title: "Modalidad 40",
    body: "Sigue cotizando de forma voluntaria para subir tu salario base y sumar semanas. Bien planeada, es de las inversiones más rentables que existen para tu pensión.",
  },
  {
    title: "Asignaciones familiares",
    body: "Un derecho poco conocido: por cónyuge, hijos menores o ascendientes dependientes tu pensión puede aumentar hasta 25%, de forma permanente.",
  },
  {
    title: "Ahorro voluntario",
    body: "Aportaciones voluntarias a tu AFORE con interés compuesto a tu favor. Cada año que empiezas antes cambia el resultado final.",
  },
  {
    title: "Elegir bien tu momento",
    body: "Pensionarte a los 60 o a los 65 cambia tu pensión hasta 25%. También importa no perder la vigencia de derechos: eso se planea con años de anticipación.",
  },
]

const faqs = [
  {
    q: "¿La calculadora es exacta?",
    a: "No. Es una estimación con las reglas generales del IMSS. El monto real depende de tu historial exacto, la vigencia de tus derechos y el dictamen oficial.",
  },
  {
    q: "¿Cómo sé si soy Ley 73 o Ley 97?",
    a: "Por la fecha en que empezaste a cotizar al IMSS: antes del 1 de julio de 1997 eres Ley 73; después, Ley 97. Lo confirmas en tu constancia de semanas cotizadas.",
  },
  {
    q: "¿Qué es la Modalidad 40?",
    a: "Un esquema del IMSS para seguir cotizando por tu cuenta después de dejar un empleo, con el salario que elijas dentro de los topes. Sirve para subir el promedio salarial y sumar semanas.",
  },
  {
    q: "¿Cobran por la asesoría inicial?",
    a: "No. Platicar tu caso por WhatsApp no tiene costo. Si hay una estrategia que aplique para ti, te explicamos en qué consiste y qué implica antes de que decidas nada.",
  },
  {
    q: "¿Ustedes son el IMSS o una AFORE?",
    a: "No. Somos un servicio privado de asesoría. No tenemos vínculo con el IMSS, CONSAR ni ninguna AFORE.",
  },
]

const h2 = "font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink"

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pb-28 pt-16 text-white sm:pb-36 sm:pt-24">
        <Curvas animate className="pointer-events-none absolute -bottom-4 right-0 w-[70%] max-w-4xl" />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="anim-rise max-w-3xl">
            <h1 className="font-display text-[clamp(2.25rem,6vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
              Tu pensión puede ser más grande de lo que crees.
            </h1>
          </div>
          <div className="anim-rise max-w-xl" style={{ "--rise-delay": "0.08s" } as React.CSSProperties}>
            <p className="mt-6 text-lg text-muted-on-navy">
              El 70% de los adultos mayores en México no recibe pensión, casi siempre por desinformación,
              trámites complejos o pérdida de derechos. Calcula la tuya y descubre cuánto margen tienes
              para mejorarla.
            </p>
          </div>
          <div className="anim-rise mt-8 flex flex-wrap items-center gap-4" style={{ "--rise-delay": "0.16s" } as React.CSSProperties}>
            <a
              href="#calculadora"
              className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-base font-bold text-primary-foreground transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Calcular mi pensión
            </a>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 text-base font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 hover:decoration-white"
            >
              <MessageCircle className="size-5 text-primary" aria-hidden />
              Platicar mi caso
            </a>
          </div>
        </div>
      </section>

      {/* Calculadora (muerde el hero) */}
      <section id="calculadora" className="relative -mt-16 scroll-mt-24 sm:-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <PensionCalculator />
        </div>
      </section>

      {/* Ley 73 vs Ley 97 */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6 sm:pt-32">
        <Reveal>
          <h2 className={`mx-auto max-w-3xl text-center ${h2}`}>
            ¿Ley 73 o Ley 97? Tu futuro depende de conocer la diferencia.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            La regla es una fecha: cuándo empezaste a cotizar al IMSS.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {leyes.map((ley, i) => (
            <Reveal key={ley.nombre} delay={i * 0.08} className="h-full">
              <article
                className={`flex h-full flex-col rounded-2xl p-7 sm:p-9 ${
                  ley.navy ? "bg-ink text-white" : "card-shadow bg-card text-ink"
                }`}
              >
                <span
                  className={`inline-flex w-fit rounded-md px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide ${
                    ley.navy ? "bg-navy-2 text-muted-on-navy" : "bg-secondary text-primary-text"
                  }`}
                >
                  {ley.chip}
                </span>
                <h3 className="mt-5 font-display text-3xl font-semibold">
                  {ley.nombre}
                  <span className={`block text-lg font-normal ${ley.navy ? "text-muted-on-navy" : "text-muted-foreground"}`}>
                    {ley.lema}
                  </span>
                </h3>
                <ul className={`mt-5 space-y-3 leading-relaxed ${ley.navy ? "text-muted-on-navy" : "text-foreground/85"}`}>
                  {ley.puntos.map((p) => (
                    <li key={p} className="flex items-start gap-2.5">
                      <Plus aria-hidden className={`mt-1.5 size-4 shrink-0 ${ley.navy ? "text-primary" : "text-primary-text"}`} />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-6 text-[15px] font-bold">{ley.aplica}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pensión garantizada */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6 sm:pt-32">
        <div className="rounded-3xl bg-secondary px-6 py-14 sm:px-12 sm:py-16">
          <Reveal>
            <h2 className={`mx-auto max-w-3xl text-center ${h2}`}>
              ¿Sabes cuánto es la pensión garantizada?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Si cotizas bajo la Ley 97 y tu ahorro no alcanza, el gobierno garantiza una pensión mínima.
              La pregunta es si alcanza para vivir con tranquilidad.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-4">
            {garantizada.map((g, i) => (
              <Reveal key={g.etiqueta} delay={i * 0.08}>
                <div className="text-center">
                  <p className="inline-block border-b-[3px] border-accent pb-1 font-display text-4xl font-semibold tracking-[-0.02em] text-ink tabular-nums">
                    {g.monto}
                  </p>
                  <p className="mt-3 text-[15px] font-bold text-ink">{g.etiqueta}</p>
                  <p className="text-[15px] text-muted-foreground">al mes</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-[15px] leading-relaxed text-muted-foreground">
              La mayoría de los trabajadores recibe alrededor de $6,000 al mes: una cantidad difícil para
              cubrir vivienda, salud y alimentación. Si aún no te pensionas, estás a tiempo de cambiar ese
              número. Montos de referencia 2025; verifica el vigente con el IMSS.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Estrategias */}
      <section id="estrategias" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pt-24 sm:px-6 sm:pt-32">
        <Reveal>
          <h2 className={`mx-auto max-w-3xl text-center ${h2}`}>Las estrategias que cambian el resultado.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Una pensión optimizada casi siempre se explica por lo mismo: planeación con años de anticipación.
          </p>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-4xl gap-x-14 sm:grid-cols-2">
          {estrategias.map((e, i) => (
            <Reveal key={e.title} delay={i * 0.05}>
              <div className="flex gap-4 border-t border-border py-7">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/12 font-display text-lg font-semibold text-primary-text">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink">{e.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{e.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="mx-auto w-full max-w-3xl scroll-mt-24 px-4 pt-24 sm:px-6 sm:pt-32">
        <Reveal>
          <h2 className={`text-center ${h2}`}>Preguntas frecuentes</h2>
        </Reveal>
        <div className="mt-10 border-t border-border">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus aria-hidden className="size-5 shrink-0 text-primary-text transition-transform duration-150 group-open:rotate-45" />
              </summary>
              <p className="pb-6 leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center sm:px-12 sm:py-20">
            <Curvas className="pointer-events-none absolute -bottom-3 right-0 w-[60%] max-w-2xl opacity-80" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-[clamp(2rem,4.5vw,3.1rem)] font-semibold leading-tight tracking-[-0.02em] text-white">
                Cada año cuenta. Empieza hoy.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-on-navy">
                Cuéntanos tu caso por WhatsApp y te decimos, sin costo, qué estrategia aplica para ti y qué
                tan lejos puede llegar tu pensión.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-primary-foreground transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <MessageCircle className="size-5" aria-hidden />
                Platicar mi caso por WhatsApp
              </a>
              <p className="mx-auto mt-6 max-w-md text-[15px] text-white/60">
                Asesoría informativa. Los montos de esta página son estimaciones; el dictamen final siempre
                lo emite el IMSS.
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Redirect de `/pension` a `/`**

`next.config.ts`:
```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/pension", destination: "/", permanent: true }]
  },
}

export default nextConfig
```

- [ ] **Step 3: 404, sitemap y robots**

Create `app/not-found.tsx`:
```tsx
import Link from "next/link"
import { Logo } from "@/components/brand/Logo"

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Logo tone="light" className="text-[36px]" />
      <h1 className="font-display text-3xl font-semibold text-ink">Esta página no existe.</h1>
      <Link
        href="/"
        className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-base font-bold text-primary-foreground hover:bg-ring hover:text-white"
      >
        Ir a la calculadora
      </Link>
    </main>
  )
}
```

Create `app/sitemap.ts`:
```ts
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.pensionmas.com.mx"
  return [
    { url: `${base}/`, lastModified: new Date("2026-09-02"), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/privacidad`, lastModified: new Date("2026-09-02"), changeFrequency: "yearly", priority: 0.2 },
  ]
}
```

Create `app/robots.ts`:
```ts
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://www.pensionmas.com.mx/sitemap.xml",
  }
}
```

- [ ] **Step 4: Reescribir `PRODUCT.md`, `DESIGN.md` y crear `PENDIENTES.md`**

`PRODUCT.md`:
```markdown
# Product

## Users

Personas en México de 40 a 65 años que cotizan o cotizaron al IMSS y quieren saber cuánto recibirán de pensión y si pueden mejorarla. Llegan desde búsqueda, redes o recomendación, casi siempre desde el celular. No son expertos financieros y desconfían de "gestores".

## Product Purpose

Pensión+ (pensionmas.com.mx) es una landing con calculadora de pensión IMSS (Ley 73 y Ley 97) y explicación de las estrategias que la mejoran (Modalidad 40, asignaciones familiares, ahorro voluntario, momento del retiro). Éxito = personas que calculan y escriben por WhatsApp para platicar su caso. No captura datos, no tiene backend.

## Brand Personality

Confiable, claro, cercano. Serio sin ser frío: navy profundo como base, teal para la acción, oro para las cifras que importan.

## Anti-references

- Sitios de "préstamos exprés": urgencia, rojos, contadores.
- Parecer sitio del IMSS/CONSAR.
- Template fintech genérico con degradados y stock corporativo.

## Design Principles

1. La calculadora es la puerta: va inmediatamente después del hero y muerde su borde.
2. Cifras siempre "estimadas", con la regla que las produce a la vista.
3. Español mexicano llano. "Tu pensión", "tu caso".
4. Un solo CTA: WhatsApp.

## Accessibility

Cuerpo 17px, labels 15px, contraste AA verificado con `node scripts/contrast.mjs`, targets ≥ 44px, `prefers-reduced-motion` respetado, formularios con `aria-invalid` y errores en texto.
```

`DESIGN.md`:
```markdown
# Design

Sistema visual de Pensión+ (v3, 2-sep-2026). Propuesta "navy primero": el sitio se ve como el logo.

## Theme

Hero y CTA en navy sólido; cuerpo en off-white. Teal para acción y curvas; oro para cifras sobre navy y subrayados. Un solo tema: no hay modo oscuro, el navy es contenido.

## Color

| Token | OKLCH | Hex | Uso |
|---|---|---|---|
| `--background` | `oklch(0.964 0.007 89)` | #F5F3EE | cuerpo |
| `--ink` / `--foreground` | `oklch(0.247 0.053 258)` | #10213A | texto, hero, CTA, footer |
| `--card` | `oklch(1 0 0)` | #FFFFFF | calculadora, card Ley 97 (solo sombra) |
| `--secondary` / `--input` | `oklch(0.93 0.012 89)` | ≈#ECE8DF | bandas, inputs |
| `--primary` | `oklch(0.662 0.113 195)` | #00A8A8 | botones, curvas, "+". Solo relleno o sobre navy |
| `--primary-foreground` | = ink | #10213A | texto de botón teal |
| `--primary-text` | `oklch(0.489 0.08 195)` | #0E6E6E | links e iconos teal sobre claro |
| `--accent` | `oklch(0.728 0.099 82)` | #C6A15B | cifras sobre navy, subrayados |
| `--accent-deep` | `oklch(0.544 0.087 81)` | #8A6A2E | oro como texto sobre claro |
| `--muted-foreground` | `oklch(0.459 0.029 262)` | #4F5868 | secundario sobre claro |
| `--muted-on-navy` | `oklch(0.802 0.02 260)` | #B7BFCC | secundario sobre navy |
| `--navy-2` | `oklch(0.293 0.061 258)` | #182C4A | paneles dentro de navy |
| `--border` | `oklch(0.901 0.014 89)` | #E2DED4 | hairlines |
| `--ring` | `oklch(0.525 0.09 195)` | #007A7A | foco; "+" del logo bajo 24px |

Reglas duras: teal nunca como texto sobre claro; blanco nunca sobre teal; oro nunca como texto sobre claro. Verificación: `node scripts/contrast.mjs`.

## Typography

- Display: Outfit 500/600/700 (`font-display`). h1 `clamp(2.25rem,6vw,3.5rem)`, h2 `clamp(1.75rem,4vw,2.5rem)`, h3 1.375rem, cifras `clamp(2.5rem,8vw,3.5rem)` con `tabular-nums`.
- Body: Nunito Sans 400/600/700 (`font-sans`). Cuerpo 17px lh 1.6; labels y meta 15px; nada por debajo.

## Radius

`--radius: 0.75rem`. Botones e inputs `rounded-lg`, cards `rounded-2xl`, paneles `rounded-3xl`.

## Components

- **Logo** (`components/brand/Logo.tsx`): tipográfico, Outfit 500 minúsculas, "+" teal. `tone="dark"` sobre navy, `tone="light"` sobre claro (el "+" usa `--ring`). Header 28/32px, footer 36px. El hero no repite el wordmark.
- **Curvas** (`components/brand/Curvas.tsx`): las dos curvas del logo en SVG, teal 2.5px y oro 2px. Hero (animadas), CTA y panel de resultado.
- **Calculadora**: card blanca con `.card-shadow` que muerde el hero; tabs segmentadas (activa navy); inputs 48px sin borde sobre `--secondary`; resultado en panel navy con cifra en oro.
- **Cards Ley 73 / Ley 97**: 73 navy, 97 blanca. Sin contorno.
- **FAQ**: `<details>` con hairlines, "+" que rota 45°.
- **Favicon**: `app/icon.svg`, "+" teal en círculo navy. `apple-icon.tsx` y `opengraph-image.tsx` con `ImageResponse`.

## Prohibiciones

- Cards con contorno gris. Cards = sombra `.card-shadow` o relleno `--secondary`.
- Alerts con borde de color + fondo tintado. Aviso = relleno `bg-accent/25 text-ink` o `bg-navy-2` sobre navy, sin borde.
- Citas en caja.
- Modo oscuro.

## Motion

`.anim-rise` en hero; `Reveal` (visible por defecto, IntersectionObserver); `.draw-curve` dibuja las curvas una vez; `.anim-fade-up` en el resultado. Botones `transition-colors 150ms`. Todo se apaga con `prefers-reduced-motion`. Sin framer-motion.
```

`PENDIENTES.md`:
```markdown
# Pendientes que solo Ricardo puede resolver

- **Cifras de pensión garantizada** (`$3,414 / $6,000 / $10,732`): se copiaron de la versión anterior sin verificar. Confirmar el monto vigente en el IMSS y citar año y fuente en la sección.
- **Entidad responsable en `/privacidad`**: dice "Grupo Inmobiliario HeredaBienes". Confirmar que es la entidad correcta para Pensión+.
- **Renombrar** repo `aforeassistant` → `pensionmas` y proyecto Vercel `aforeassistant` → `pensionmas` (opcional, cosmético): `gh repo rename pensionmas -R richyhoopd/aforeassistant` y `https://vercel.com/lidfis-projects/aforeassistant/settings`.
- **Twitter/X** `@pensionmasmx` está en la metadata: confirmar que la cuenta sigue viva o quitarla.
```

- [ ] **Step 5: Tests, lint y build completos**

Run:
```bash
cd ~/Work/personal/pensionmas && npx vitest run 2>&1 | tail -3 && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | tail -15
```
Expected: `Tests 14 passed`; lint limpio; build lista las rutas `/`, `/privacidad`, `/_not-found`, `/sitemap.xml`, `/robots.txt`, `/icon.svg`, `/apple-icon`, `/opengraph-image`, sin errores.

- [ ] **Step 6: Commit**

```bash
cd ~/Work/personal/pensionmas && git add -A && git commit -m "feat(landing): Pensión+ en raíz con la marca nueva; /pension redirige; 404, sitemap, robots y docs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW"
```

---

### Task 11: Preview en Vercel y verificación

**Files:** ninguno.

- [ ] **Step 1: Push de la rama y deploy a preview**

Run:
```bash
cd ~/Work/personal/pensionmas && git push -u origin feat/landing-pensionmas && PREVIEW=$(vercel deploy --yes 2>&1 | grep -o 'https://[^ ]*\.vercel\.app' | tail -1) && echo "$PREVIEW"
```
Expected: `https://aforeassistant-....vercel.app`. La variable `PREVIEW` se usa en los pasos siguientes del mismo shell.

- [ ] **Step 2: Smoke**

Run:
```bash
for p in / /privacidad /pension /api/whatsapp /pre-calificador /admin /sitemap.xml /robots.txt /icon.svg /opengraph-image; do printf '%-18s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$PREVIEW$p")"; done; echo; curl -s "$PREVIEW" | grep -o 'facebook-domain-verification" content="[^"]*"'; curl -s "$PREVIEW" | grep -c "framer"
```
Expected:
```
/                  200
/privacidad        200
/pension           308 https://.../
/api/whatsapp      404
/pre-calificador   404
/admin             404
/sitemap.xml       200
/robots.txt        200
/icon.svg          200
/opengraph-image   200
facebook-domain-verification" content="h76gliptuljmxgit6aicr71tmqujv8"
0
```
Si el preview está protegido por Vercel Authentication (401), usa la skill `vercel:access-protected-vercel-deployment` o pide a Ricardo que desactive la protección para previews.

- [ ] **Step 3: Contraste y Lighthouse**

Run:
```bash
cd ~/Work/personal/pensionmas && node scripts/contrast.mjs | grep -c "^ok" && npx --yes lighthouse "$PREVIEW" --preset=perf --form-factor=mobile --only-categories=accessibility,performance,best-practices,seo --output=json --output-path=/tmp/lh.json --chrome-flags="--headless" >/dev/null 2>&1; node -e 'const r=require("/tmp/lh.json").categories;for(const k in r)console.log(k, Math.round(r[k].score*100))'
```
Expected: `12` pares ok; `accessibility ≥ 95`, `performance ≥ 90`. Si accesibilidad baja de 95, corrige lo que reporte Lighthouse (`node -e 'const a=require("/tmp/lh.json").audits;for(const k in a)if(a[k].score===0)console.log(k)'`) antes de seguir.

- [ ] **Step 4: Verificación visual móvil y desktop**

Con el navegador (Chrome tools) abre `$PREVIEW` a 390px y 1280px de ancho. Revisa la lista y anota lo que no cumpla:
- Hero navy con curvas dibujándose; calculadora blanca montada sobre el borde.
- Tab activa navy; inputs sin borde, con ring teal al foco; botón teal con texto navy.
- Resultado: panel navy, cifra en oro, curvas en la esquina.
- Ley 73 navy, Ley 97 blanca sin contorno.
- Cifras garantizadas con subrayado oro.
- FAQ con "+" que rota.
- Footer navy con logo blanco.
- Ningún borde gris en cards; ningún texto teal sobre claro.

Guarda las capturas en el scratchpad de la sesión (no en el repo) y pásalas a Ricardo con `SendUserFile`.

- [ ] **Step 5: Reportar a Ricardo y esperar su revisión del preview**

Mensaje con la URL del preview, la tabla del smoke, los scores de Lighthouse y las capturas. **No mergear ni desplegar a producción hasta que él lo apruebe explícitamente.**

---

### Task 12: Producción (solo con aprobación explícita de Ricardo)

**Files:** ninguno.

- [ ] **Step 1: Confirmar la aprobación**

Solo continúa si Ricardo escribió, en esta conversación y después de ver el preview, algo equivalente a "despliega a producción". Si no, detente aquí.

- [ ] **Step 2: Borrar las env vars del proyecto `aforeassistant`**

Precondición: el deploy de tulanaya (Task 2) está Ready con sus propias env vars.
Run:
```bash
cd ~/Work/personal/pensionmas && for k in COBRO_BANCO COBRO_CLABE COBRO_TITULAR CRON_SECRET NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_URL OTP_PEPPER SUPABASE_SERVICE_ROLE_KEY WHATSAPP_APP_SECRET WHATSAPP_ENABLED WHATSAPP_PHONE_NUMBER_ID WHATSAPP_TOKEN WHATSAPP_VERIFY_TOKEN; do vercel env rm "$k" production --yes >/dev/null 2>&1 && echo "rm $k" || echo "NO ESTABA $k"; done; vercel env ls production 2>/dev/null | awk 'NR>2{print $1}'
```
Expected: 14 líneas `rm`; la lista final está vacía.

- [ ] **Step 3: Merge a main y deploy**

Run:
```bash
cd ~/Work/personal/pensionmas && git checkout main && git merge --no-ff feat/landing-pensionmas -m "Pensión+: landing con la marca nueva; el funnel de tulanaya vive en richyhoopd/tulanaya

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW" && git push origin main && vercel deploy --prod --yes 2>&1 | grep -E "Production:|Error"
```
Expected: `Production: https://...`.

- [ ] **Step 4: Smoke en el dominio real**

Run:
```bash
for p in / /privacidad /pension /api/whatsapp; do printf '%-16s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://www.pensionmas.com.mx$p")"; done; curl -s https://www.pensionmas.com.mx | grep -o 'facebook-domain-verification" content="[^"]*"'
```
Expected: `200`, `200`, `308 → /`, `404`, y la meta tag presente.

- [ ] **Step 5: Borrar la rama de trabajo y el cron viejo**

Run:
```bash
cd ~/Work/personal/pensionmas && git branch -d feat/landing-pensionmas && git push origin --delete feat/landing-pensionmas
```
El cron `/api/cron/followups` desaparece solo: ya no hay `vercel.json`. Verifica en `https://vercel.com/lidfis-projects/aforeassistant/settings/cron-jobs` que la lista esté vacía.

---

### Task 13: Vault

**Files (en `~/Work/_vault`):**
- Create: `Personal/Sessions/2026-09-02-separacion-pensionmas-tulanaya.md`
- Modify: `Personal/Overview.md` (sección "tulanaya / Pensión+" y tabla resumen)
- Modify: `Dashboard.md` (línea de tulanaya en Blockers y fila de Personal)
- Modify: `Personal/Decisions-Log.md` si existe; si no, crearlo con la entrada.

- [ ] **Step 1: Nota de sesión**

Create `Personal/Sessions/2026-09-02-separacion-pensionmas-tulanaya.md`:
```markdown
# 2026-09-02 — Separación Pensión+ / tulanaya y landing con marca nueva

Continúa [[Personal/Overview]].

## Qué se hizo

- tulanaya movido a repo propio `richyhoopd/tulanaya` (historial íntegro, 3 ramas) y proyecto Vercel `lidfis-projects/tulanaya` sin dominio, con las 14 env vars de producción. Deploy de humo Ready.
- Carpetas: `~/Work/personal/pensionmas` (repo `aforeassistant`, dominio `pensionmas.com.mx`) y `~/Work/personal/tulanaya` (repo nuevo).
- Pensión+ reconstruido como landing: calculadora Ley 73/97 (lógica en `lib/pension/calc.ts` con 14 tests), estrategias, FAQ, CTA WhatsApp. Branding navy `#10213A` / teal `#00A8A8` / oro `#C6A15B` / off-white `#F5F3EE`, Outfit + Nunito Sans. Commits: `pensionmas <hash-merge>`.
- Funnel, admin, API, Supabase, WhatsApp, cron y GitHub Action `content-publish` eliminados de Pensión+.
- Env vars del proyecto `aforeassistant` borradas tras el deploy de tulanaya.

## Decisiones tomadas

- Separación in-place (el dominio no se toca); ver [[Personal/Decisions-Log]].
- Branding "navy primero" sobre "editorial claro".
- El teal de marca no sirve como texto sobre claro (2.6:1): se usa `#0E6E6E` para links e iconos.

## Próximos pasos

- Ricardo: dominio y verificación de Meta para tulanaya; URL del webhook de WhatsApp; plantillas con marca propia; entidad legal.
- Ricardo: verificar cifras de pensión garantizada y citar fuente (`PENDIENTES.md` del repo).
- Opcional: renombrar repo y proyecto Vercel a `pensionmas`.

## Addendum

(vacío)
```
Sustituye `<hash-merge>` por el hash corto real del merge de Task 12 (o del último commit de la rama si producción no se desplegó; en ese caso dilo aquí).

- [ ] **Step 2: Decisions-Log**

Si `Personal/Decisions-Log.md` no existe, créalo con `# Decisions-Log — Personal` y luego la entrada. Entrada ARRIBA, separada por `---`:
```markdown
## 2026-09-02 — Pensión+ y tulanaya se separan; el dominio se queda con Pensión+

**Decisión:** El repo `aforeassistant`, el proyecto Vercel y `pensionmas.com.mx` quedan como landing de Pensión+ (calculadora + WhatsApp, sin backend). tulanaya se lleva el funnel completo a `richyhoopd/tulanaya` y a un proyecto Vercel propio sin dominio.

**Contexto:** Un solo repo servía dos productos y la marca de Pensión+ se estaba usando para el funnel de AFORE. Mover el dominio implicaba DNS y re-verificar en Meta; dejarlo donde está implica cero configuración.

**Consecuencias:** tulanaya pierde la verificación de dominio de Meta y las plantillas `*_pensionmas`; necesita dominio y marca propios antes de operar WhatsApp. Pensión+ no captura datos ni tiene env vars.

[[Personal/Sessions/2026-09-02-separacion-pensionmas-tulanaya]]

---
```

- [ ] **Step 3: Overview y Dashboard**

En `Personal/Overview.md`, sección `## tulanaya / Pensión+`: reemplaza el aviso "Tres nombres para el mismo producto" por dos filas: `tulanaya` (carpeta `~/Work/personal/tulanaya`, repo `richyhoopd/tulanaya`, Vercel `tulanaya`, sin dominio) y `Pensión+` (carpeta `~/Work/personal/pensionmas`, repo `aforeassistant`, Vercel `aforeassistant`, `pensionmas.com.mx`, landing sin backend). En la tabla resumen, divide la fila `tulanaya / pensionmas` en dos.
En `Dashboard.md`, el blocker `🟠 Tulanaya` cambia a: "app de Meta en modo desarrollo; ahora sin dominio propio tras la separación. Bloqueada por entidad legal y por dominio." Enlaza la sesión.

- [ ] **Step 4: Commit del vault**

```bash
cd ~/Work/_vault && git add Personal Dashboard.md && git commit -m "personal: separación Pensión+ / tulanaya y landing con marca nueva

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011hp6ghfBn4MXcxJ3YUkNoW"
```
