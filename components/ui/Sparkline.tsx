import React from 'react'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  /** De-emphasis hue for the trend line (sap-ink-meta by default). */
  color?: string
  /** Accent hue for the current/last-point marker (sap-primary by default). */
  accentColor?: string
  /** Surface color for the marker's separating ring. */
  surfaceColor?: string
  endDotRadius?: number
  title?: string
}

/**
 * Minimal inline trend line — hand-rolled SVG rather than a charting-library instance, since
 * this renders many times per page (one per table row) and a full chart component's overhead
 * isn't worth it for a glance-only visual that sits beside the already-tabulated exact values.
 */
export function Sparkline({
  values,
  width = 72,
  height = 24,
  color = '#475e75',
  accentColor = '#0057d2',
  surfaceColor = '#ffffff',
  endDotRadius = 2.5,
  title,
}: SparklineProps) {
  if (values.length === 0) return null

  const padding = endDotRadius + 1
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  const points = values.map((v, i) => {
    const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * (width - padding * 2) + padding
    const normalized = range === 0 ? 0.5 : (v - min) / range
    const y = height - padding - normalized * (height - padding * 2)
    return { x, y }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      {title && <title>{title}</title>}
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={endDotRadius + 1.5} fill={surfaceColor} />
      <circle cx={last.x} cy={last.y} r={endDotRadius} fill={accentColor} />
    </svg>
  )
}
