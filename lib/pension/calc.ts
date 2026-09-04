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
