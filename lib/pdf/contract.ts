import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib"
import { CONTRACT_TITLE, contractClauses } from "./contract-text"

export type ContractData = {
  folio: string
  fullName: string
  nss: string
  curp: string
  phone: string
  commissionPct: number
  estimatedMin: number
  estimatedMax: number
  breakdown?: { tax: number; admin: number }
  signedAtISO: string
  signaturePngBytes: Uint8Array
  ip: string
  userAgent: string
}

const A4: [number, number] = [595.28, 841.89]
const MARGIN = 56
const WIDTH = A4[0] - MARGIN * 2

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function buildContractPdf(d: ContractData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage(A4)
  let y = A4[1] - MARGIN

  const newPageIfNeeded = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage(A4)
      y = A4[1] - MARGIN
    }
  }

  const drawLines = (
    lines: string[],
    f: PDFFont,
    size: number,
    lineGap = 3,
    color = rgb(0.1, 0.1, 0.1)
  ) => {
    for (const line of lines) {
      newPageIfNeeded(size + lineGap)
      page.drawText(line, { x: MARGIN, y, size, font: f, color })
      y -= size + lineGap
    }
  }

  drawLines(wrap(CONTRACT_TITLE, bold, 14, WIDTH), bold, 14)
  y -= 4
  drawLines(
    [`Folio: ${d.folio}    Fecha de firma: ${d.signedAtISO}`],
    font,
    9,
    3,
    rgb(0.35, 0.35, 0.35)
  )
  y -= 10

  drawLines(["Datos del Cliente"], bold, 11)
  drawLines(
    [
      `Nombre: ${d.fullName}`,
      `NSS: ${d.nss}    CURP: ${d.curp}`,
      `Teléfono verificado por OTP: ${d.phone}`,
    ],
    font,
    10
  )
  y -= 10

  for (const clause of contractClauses(d)) {
    newPageIfNeeded(40)
    drawLines([clause.heading], bold, 10.5)
    drawLines(wrap(clause.body, font, 9.5, WIDTH), font, 9.5)
    y -= 8
  }

  newPageIfNeeded(150)
  y -= 10
  drawLines(["Firma del Cliente"], bold, 11)
  const sig = await doc.embedPng(d.signaturePngBytes)
  const sigDims = sig.scaleToFit(220, 90)
  newPageIfNeeded(sigDims.height + 60)
  page.drawImage(sig, { x: MARGIN, y: y - sigDims.height, ...sigDims })
  y -= sigDims.height + 8
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + 240, y },
    thickness: 0.7,
    color: rgb(0.2, 0.2, 0.2),
  })
  y -= 14
  drawLines([d.fullName], font, 10)
  y -= 8
  drawLines(
    [
      "Evidencia de firma electrónica:",
      `IP: ${d.ip}`,
      `Dispositivo: ${d.userAgent.slice(0, 110)}`,
      `Fecha y hora (UTC): ${d.signedAtISO}`,
    ],
    font,
    8,
    2.5,
    rgb(0.35, 0.35, 0.35)
  )

  return doc.save()
}
