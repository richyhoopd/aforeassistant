const columnas = ["60 años", "61", "62", "63", "64", "65+"]

const filas = [
  {
    uma: "1 a 1.99 UMA",
    promedio: "$5,125.24",
    montos: [
      "$3,177 – $4,312",
      "$3,223 – $4,357",
      "$3,257 – $4,403",
      "$3,312 – $4,447",
      "$3,358 – $4,492",
      "$3,403 – $4,538",
    ],
  },
  {
    uma: "2 a 2.99 UMA",
    promedio: "$8,542.07",
    montos: [
      "$4,130 – $5,604",
      "$4,188 – $5,664",
      "$4,248 – $5,723",
      "$4,307 – $5,781",
      "$4,366 – $5,841",
      "$4,424 – $5,900",
    ],
  },
  {
    uma: "3 a 3.99 UMA",
    promedio: "$11,958.00",
    montos: [
      "$5,082 – $6,898",
      "$5,155 – $6,971",
      "$5,228 – $7,044",
      "$5,300 – $7,116",
      "$5,373 – $7,188",
      "$5,446 – $7,261",
    ],
  },
  {
    uma: "4 a 4.99 UMA",
    promedio: "$15,375.00",
    montos: [
      "$6,036 – $8,191",
      "$6,122 – $8,277",
      "$6,208 – $8,364",
      "$6,295 – $8,450",
      "$6,381 – $8,536",
      "$6,467 – $8,622",
    ],
  },
  {
    uma: "5 UMA en adelante",
    promedio: "$17,084.00",
    montos: [
      "$6,989 – $9,485",
      "$7,088 – $9,584",
      "$7,188 – $9,685",
      "$7,288 – $9,784",
      "$7,388 – $9,885",
      "$7,488 – $9,984",
    ],
  },
]

export function TablaGarantizada() {
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl bg-card card-shadow">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <caption className="sr-only">
            Pensión garantizada mensual por rango de UMA y edad de retiro
          </caption>
          <thead>
            <tr className="bg-ink text-white">
              <th scope="col" className="px-5 py-4 text-[15px] font-bold">
                Rango de UMA
              </th>
              <th scope="col" className="px-5 py-4 text-[15px] font-bold">
                Promedio Mensual
              </th>
              {columnas.map((c) => (
                <th key={c} scope="col" className="px-5 py-4 text-[15px] font-bold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={f.uma} className={i % 2 === 1 ? "bg-secondary/60" : undefined}>
                <th
                  scope="row"
                  className="border-t border-border px-5 py-4 text-[15px] font-bold text-ink"
                >
                  {f.uma}
                </th>
                <td className="border-t border-border px-5 py-4 font-display text-lg font-semibold text-ink tabular-nums">
                  {f.promedio}
                </td>
                {f.montos.map((m, j) => (
                  <td
                    key={columnas[j]}
                    className="border-t border-border px-5 py-4 text-[15px] text-muted-foreground tabular-nums"
                  >
                    {m}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
        Cada edad agrupa 11 montos por Salario Base de Cotización ($1,000, $1,025, $1,050, $1,075,
        $1,100, $1,125, $1,150, $1,175, $1,200, $1,225 y $1,250 o más); aquí se muestra el rango de
        ese grupo. El monto mostrado es tu pensión garantizada mensual.
      </p>
    </div>
  )
}
