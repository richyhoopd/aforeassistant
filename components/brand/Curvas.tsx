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
