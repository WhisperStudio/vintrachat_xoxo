import React from 'react'

export default function MountainBackground({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1600 600"
      preserveAspectRatio="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mb-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--mb-sky-top, transparent)" />
          <stop offset="100%" stopColor="var(--mb-sky-bottom, transparent)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="100%" height="100%" fill="url(#mb-sky)" />

      {/* distant ridge */}
      <path
        className="mb-ridge"
        d="M0,420 C120,320 260,360 420,300 C520,260 680,320 820,260 C980,190 1140,340 1280,300 C1400,270 1500,340 1600,320 L1600,600 L0,600 Z"
      />

      {/* main peaks */}
      <path
        className="mb-peaks-back"
        d="M0,520 L120,380 L220,420 L330,300 L460,460 L600,260 L760,460 L920,300 L1080,480 L1240,360 L1400,520 L1600,420 L1600,600 L0,600 Z"
      />

      <path
        className="mb-peaks-front"
        d="M0,600 L140,460 L260,520 L380,380 L520,560 L680,340 L820,560 L980,380 L1120,560 L1260,420 L1440,600 Z"
      />
    </svg>
  )
}
