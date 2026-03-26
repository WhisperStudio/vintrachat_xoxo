'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

type PastelCircleBackgroundProps = {
  className?: string
  style?: React.CSSProperties
  count?: number
  minSize?: number
  maxSize?: number
  blur?: number
  animated?: boolean
}

type Size = {
  width: number
  height: number
}

type CircleItem = {
  id: number
  x: number
  y: number
  size: number
  color: string
  opacity: number
  duration: number
  delay: number
  dx: number
  dy: number
}

const PASTEL_COLORS = [
  '#F8C8DC',
  '#D6E6FF',
  '#E7D8FF',
  '#CFF5E7',
  '#FFE7BF',
  '#FFD6E0',
  '#D9F0FF',
  '#EADCF8',
  '#FDE2E4',
  '#E2F0CB',
  '#CDE7F0',
  '#F9DCC4',
]

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function PastelCircleBackground({
  className,
  style,
  count = 24,
  minSize = 36,
  maxSize = 180,
  blur = 0,
  animated = true,
}: PastelCircleBackgroundProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<Size>({ width: 1400, height: 900 })

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const updateSize = () => {
      const parent = el.parentElement
      const target = parent ?? el
      const rect = target.getBoundingClientRect()

      if (rect.width > 0 && rect.height > 0) {
        setSize({
          width: rect.width,
          height: rect.height,
        })
      }
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      updateSize()
    })

    observer.observe(el)
    if (el.parentElement) observer.observe(el.parentElement)
    window.addEventListener('resize', updateSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  const circles = useMemo<CircleItem[]>(() => {
    const width = Math.max(size.width, 320)
    const height = Math.max(size.height, 320)

    const areaScale = Math.max(1, (width * height) / (1400 * 900))
    const targetCount = Math.max(8, Math.round(count * areaScale * 0.9))

    const rand = mulberry32(Math.round(width + height + targetCount))
    const placed: CircleItem[] = []

    const tryPlaceCircle = (id: number) => {
      for (let attempt = 0; attempt < 140; attempt++) {
        const sizeValue = minSize + rand() * (maxSize - minSize)
        const radius = sizeValue / 2

        const x = radius + rand() * Math.max(1, width - sizeValue)
        const y = radius + rand() * Math.max(1, height - sizeValue)

        const tooClose = placed.some((c) => {
          const dx = c.x - x
          const dy = c.y - y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = c.size / 2 + radius + 18
          return dist < minDist
        })

        if (!tooClose) {
          placed.push({
            id,
            x,
            y,
            size: sizeValue,
            color: PASTEL_COLORS[Math.floor(rand() * PASTEL_COLORS.length)],
            opacity: 0.45 + rand() * 0.35,
            duration: 10 + rand() * 12,
            delay: -rand() * 8,
            dx: -18 + rand() * 36,
            dy: -14 + rand() * 28,
          })
          return
        }
      }

      const fallbackSize = minSize + rand() * (maxSize - minSize)
      placed.push({
        id,
        x: fallbackSize / 2 + rand() * Math.max(1, width - fallbackSize),
        y: fallbackSize / 2 + rand() * Math.max(1, height - fallbackSize),
        size: fallbackSize,
        color: PASTEL_COLORS[Math.floor(rand() * PASTEL_COLORS.length)],
        opacity: 0.35 + rand() * 0.25,
        duration: 10 + rand() * 12,
        delay: -rand() * 8,
        dx: -18 + rand() * 36,
        dy: -14 + rand() * 28,
      })
    }

    for (let i = 0; i < targetCount; i++) {
      tryPlaceCircle(i)
    }

    return placed
  }, [size, count, minSize, maxSize])

  return (
    <div
      ref={rootRef}
      className={className}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {circles.map((circle) => (
          <span
            key={circle.id}
            style={{
              position: 'absolute',
              left: circle.x - circle.size / 2,
              top: circle.y - circle.size / 2,
              width: circle.size,
              height: circle.size,
              borderRadius: '999px',
              background: circle.color,
              opacity: circle.opacity,
              filter: blur > 0 ? `blur(${blur}px)` : undefined,
              animation: animated
                ? `pastelFloat ${circle.duration}s ease-in-out ${circle.delay}s infinite alternate`
                : undefined,
              ['--dx' as any]: `${circle.dx}px`,
              ['--dy' as any]: `${circle.dy}px`,
            }}
          />
        ))}

        <style jsx>{`
          @keyframes pastelFloat {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            50% {
              transform: translate(calc(var(--dx) * 0.45), calc(var(--dy) * 0.45)) scale(1.03);
            }
            100% {
              transform: translate(var(--dx), var(--dy)) scale(0.98);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
