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
    .replace(/Ñ/g, "") // preservar Ñ durante la des-acentuación
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(//g, "Ñ")
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