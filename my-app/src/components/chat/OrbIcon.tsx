import type { SVGProps } from 'react'

export const ORB_ICON_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="vintraOrbCore" cx="34%" cy="28%" r="78%">
      <stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.96"/>
      <stop offset="18%" stop-color="#0f172a" stop-opacity="0.98"/>
      <stop offset="62%" stop-color="#081120" stop-opacity="1"/>
      <stop offset="100%" stop-color="#020712" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="vintraOrbRing" cx="50%" cy="50%" r="58%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="58%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="59%" stop-color="#22d3ee" stop-opacity="0.95"/>
      <stop offset="63%" stop-color="#06b6d4" stop-opacity="0.72"/>
      <stop offset="71%" stop-color="#0f172a" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vintraOrbGlow" cx="34%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="24%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="12" cy="12" r="10.3" fill="#101826"/>
  <circle cx="12" cy="12" r="8.5" fill="url(#vintraOrbCore)"/>
  <circle cx="12" cy="12" r="6.7" fill="url(#vintraOrbRing)"/>
  <circle cx="12" cy="12" r="4.1" fill="#07111d"/>
  <circle cx="9" cy="8" r="2.1" fill="url(#vintraOrbGlow)"/>
  <circle cx="8.8" cy="7.7" r="0.7" fill="#ffffff" fill-opacity="0.92"/>
  <circle cx="6.2" cy="11.6" r="0.34" fill="#67e8f9" fill-opacity="0.85"/>
  <circle cx="7.1" cy="15.3" r="0.28" fill="#67e8f9" fill-opacity="0.8"/>
  <circle cx="16.9" cy="8.8" r="0.28" fill="#67e8f9" fill-opacity="0.7"/>
  <circle cx="17.8" cy="12.7" r="0.32" fill="#67e8f9" fill-opacity="0.72"/>
  <circle cx="16.2" cy="16" r="0.24" fill="#67e8f9" fill-opacity="0.68"/>
  <circle cx="12" cy="12" r="8.5" stroke="#65e7f8" stroke-opacity="0.4" stroke-width="0.35"/>
</svg>
`.trim()

export function OrbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="vintraOrbCore" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.96" />
          <stop offset="18%" stopColor="#0f172a" stopOpacity="0.98" />
          <stop offset="62%" stopColor="#081120" stopOpacity="1" />
          <stop offset="100%" stopColor="#020712" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="vintraOrbRing" cx="50%" cy="50%" r="58%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="58%" stopColor="#000000" stopOpacity="0" />
          <stop offset="59%" stopColor="#22d3ee" stopOpacity="0.95" />
          <stop offset="63%" stopColor="#06b6d4" stopOpacity="0.72" />
          <stop offset="71%" stopColor="#0f172a" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vintraOrbGlow" cx="34%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="24%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10.3" fill="#101826" />
      <circle cx="12" cy="12" r="8.5" fill="url(#vintraOrbCore)" />
      <circle cx="12" cy="12" r="6.7" fill="url(#vintraOrbRing)" />
      <circle cx="12" cy="12" r="4.1" fill="#07111d" />
      <circle cx="9" cy="8" r="2.1" fill="url(#vintraOrbGlow)" />
      <circle cx="8.8" cy="7.7" r="0.7" fill="#ffffff" fillOpacity="0.92" />
      <circle cx="6.2" cy="11.6" r="0.34" fill="#67e8f9" fillOpacity="0.85" />
      <circle cx="7.1" cy="15.3" r="0.28" fill="#67e8f9" fillOpacity="0.8" />
      <circle cx="16.9" cy="8.8" r="0.28" fill="#67e8f9" fillOpacity="0.7" />
      <circle cx="17.8" cy="12.7" r="0.32" fill="#67e8f9" fillOpacity="0.72" />
      <circle cx="16.2" cy="16" r="0.24" fill="#67e8f9" fillOpacity="0.68" />
      <circle cx="12" cy="12" r="8.5" stroke="#65e7f8" strokeOpacity="0.4" strokeWidth="0.35" />
    </svg>
  )
}

export default OrbIcon
