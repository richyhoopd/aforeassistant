"use client"

import { useEffect, useState } from "react"

/**
 * Las dos curvas del logo. `strokeWidth` es el trazo teal; el oro va medio
 * punto por debajo, como en el logo. Las curvas grandes sobre navy (hero,
 * paneles) van a 3; la pequeña del panel de resultado se queda en 2.5.
 *
 * `animate`: se dibujan una vez (stroke-dashoffset, CSS `.draw-curve`).
 * `wave`: ondulan de forma continua. El ondulado es SMIL (`<animate d>`),
 * lo único que anima `d` en Safari; como CSS no puede apagar SMIL, el
 * componente lo omite cuando el usuario pide `prefers-reduced-motion`.
 */
const TEAL = [
  "M0 240 C 260 240, 440 120, 800 20",
  "M0 230 C 250 280, 450 78, 800 30",
  "M0 250 C 270 200, 430 164, 800 10",
  "M0 240 C 260 240, 440 120, 800 20",
]
const GOLD = [
  "M0 258 C 280 258, 470 160, 800 62",
  "M0 248 C 290 218, 460 206, 800 52",
  "M0 268 C 270 298, 480 116, 800 72",
  "M0 258 C 280 258, 470 160, 800 62",
]
const SPLINES = "0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1"

function Wave({ values, dur }: { values: string[]; dur: string }) {
  return (
    <animate
      attributeName="d"
      values={values.join(";")}
      keyTimes="0;0.33;0.66;1"
      calcMode="spline"
      keySplines={SPLINES}
      dur={dur}
      repeatCount="indefinite"
    />
  )
}

export function Curvas({
  className,
  animate = false,
  wave = false,
  strokeWidth = 2.5,
}: {
  className?: string
  animate?: boolean
  wave?: boolean
  strokeWidth?: number
}) {
  const [motionOk, setMotionOk] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setMotionOk(!mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])
  const waving = wave && motionOk

  return (
    <svg
      aria-hidden
      viewBox="0 0 800 260"
      fill="none"
      className={className}
      preserveAspectRatio="xMaxYMax meet"
    >
      <path
        d={TEAL[0]}
        stroke="var(--primary)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={animate ? "draw-curve" : undefined}
      >
        {waving && <Wave values={TEAL} dur="9s" />}
      </path>
      <path
        d={GOLD[0]}
        stroke="var(--accent)"
        strokeWidth={strokeWidth - 0.5}
        strokeLinecap="round"
        style={animate ? ({ "--draw-delay": "0.45s" } as React.CSSProperties) : undefined}
        className={animate ? "draw-curve" : undefined}
      >
        {waving && <Wave values={GOLD} dur="11s" />}
      </path>
    </svg>
  )
}
