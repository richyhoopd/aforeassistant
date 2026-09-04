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
  ["blanco / ring #007A7A (hover)", "#FFFFFF", "#007A7A", 4.5],
  ["ring / off-white (anillo de foco)", "#007A7A", "#F5F3EE", 3],
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
