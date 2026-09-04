/**
 * Las dos curvas del logo. `strokeWidth` es el trazo teal; el oro va medio
 * punto por debajo, como en el logo. Las curvas grandes sobre navy (hero,
 * paneles) van a 3; la pequeña del panel de resultado se queda en 2.5.
 */
export function Curvas({
  className,
  animate = false,
  strokeWidth = 2.5,
}: {
  className?: string
  animate?: boolean
  strokeWidth?: number
}) {
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
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={animate ? "draw-curve" : undefined}
      />
      <path
        d="M0 258 C 280 258, 470 160, 800 62"
        stroke="var(--accent)"
        strokeWidth={strokeWidth - 0.5}
        strokeLinecap="round"
        style={animate ? ({ "--draw-delay": "0.45s" } as React.CSSProperties) : undefined}
        className={animate ? "draw-curve" : undefined}
      />
    </svg>
  )
}
