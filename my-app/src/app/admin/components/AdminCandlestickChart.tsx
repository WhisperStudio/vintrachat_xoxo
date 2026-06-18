'use client'

import React from 'react'
import './CandlestickChart.css'

export type CandlestickPoint = {
  dayIndex: number
  dayLabel: string
  hour: number
  hourLabel: string
  value: number
}

type AdminCandlestickChartProps = {
  data: CandlestickPoint[]
}

export default function AdminCandlestickChart({ data }: AdminCandlestickChartProps) {
  const dayLabels = Array.from(
    data.reduce((map, entry) => map.set(entry.dayIndex, entry.dayLabel), new Map<number, string>()).entries()
  )
    .sort((a, b) => a[0] - b[0])
    .map(([, label]) => label)

  const hourLabels = Array.from(
    data.reduce((map, entry) => map.set(entry.hour, entry.hourLabel), new Map<number, string>()).entries()
  )
    .sort((a, b) => a[0] - b[0])
    .map(([, label]) => label)

  const cellMap = new Map(data.map((entry) => [`${entry.dayIndex}-${entry.hour}`, entry]))
  const maxValue = data.reduce((max, entry) => Math.max(max, entry.value), 0)

  function getCellColor(value: number) {
    if (maxValue <= 0 || value <= 0) return 'rgba(226, 232, 240, 0.42)'

    const intensity = value / maxValue
    if (intensity >= 0.8) return 'rgba(22, 163, 74, 0.96)'
    if (intensity >= 0.55) return 'rgba(34, 197, 94, 0.8)'
    if (intensity >= 0.3) return 'rgba(74, 222, 128, 0.64)'
    return 'rgba(134, 239, 172, 0.48)'
  }

  return (
    <div className="candlestick-chart-container">
      <div
        className="candlestick-heatmap"
        style={{ gridTemplateColumns: `72px repeat(${dayLabels.length}, minmax(72px, 1fr))` }}
      >
        <div className="candlestick-corner" />

        {dayLabels.map((label) => (
          <div key={label} className="candlestick-day-label">
            {label}
          </div>
        ))}

        {hourLabels.map((hourLabel, hourIndex) => (
          <React.Fragment key={hourLabel}>
            <div className="candlestick-hour-label">{hourLabel}</div>

            {dayLabels.map((dayLabel, dayIndex) => {
              const cell = cellMap.get(`${dayIndex}-${hourIndex}`)
              const value = cell?.value || 0

              return (
                <div
                  key={`${dayLabel}-${hourLabel}`}
                  className="candlestick-cell"
                  style={{ background: getCellColor(value) }}
                  title={`${dayLabel} ${hourLabel} - ${value.toFixed(2)}`}
                >
                  <span>{value > 0 ? value.toFixed(2) : ''}</span>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
