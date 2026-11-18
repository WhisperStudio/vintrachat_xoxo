'use client'
import { useId } from 'react'

export default function VintraHost({ className, expression = 'happy' }: { className?: string; expression?: 'happy' | 'guiding' | 'attentive' }) {
  const id = useId()
  const shell = 'url(#' + id + '-shell)'
  const glass = 'url(#' + id + '-glass)'
  return <svg className={className} viewBox="0 0 240 240" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={id + '-shell'} x1="60" y1="40" x2="185" y2="210" gradientUnits="userSpaceOnUse"><stop stopColor="#F3F7FA"/><stop offset=".45" stopColor="#BCD3E4"/><stop offset="1" stopColor="#397FE6"/></linearGradient>
      <linearGradient id={id + '-glass'}><stop stopColor="#173449"/><stop offset="1" stopColor="#0B1D2B"/></linearGradient>
    </defs>
    <ellipse cx="126" cy="222" rx="55" ry="6" fill="#0B1D2B" opacity=".15"/>
    <path d="m143 42 7-22" stroke="#397FE6" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="152" cy="17" r="8" fill="#35DFB5" stroke="#C6FFF0" strokeWidth="2"/>
    <g fill="#397FE6" stroke="#BCD3E4" strokeWidth="3"><rect x="45" y="76" width="18" height="44" rx="9"/><rect x="186" y="76" width="18" height="44" rx="9"/></g>
    <path d="M76 126Q67 160 83 187Q121 219 163 187Q180 162 170 126Z" fill={shell} stroke="#D5E0E7" strokeWidth="2"/>
    <path d="M57 90C57 24 188 23 192 90L188 122Q124 153 62 122Z" fill={shell} stroke="#F3F7FA" strokeWidth="2"/>
    <path d="M70 86Q76 58 125 58Q171 58 180 86L178 111Q126 134 72 111Z" fill={glass} stroke="#526878" strokeWidth="3"/>
    <path d={expression === 'attentive' ? 'M94 85v9M154 85v9' : expression === 'guiding' ? 'M90 85v8M143 92Q153 76 163 92' : 'M87 92Q97 76 107 92M143 92Q153 76 163 92'} stroke="#35DFB5" strokeWidth="6" strokeLinecap="round"/>
    <path d={expression === 'attentive' ? 'M117 107Q125 111 133 107' : 'M114 104Q125 117 137 104'} stroke="#35DFB5" strokeWidth="5" strokeLinecap="round"/>
    <path d="M78 66Q93 48 119 48" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity=".65"/>
    <path d="m114 162 10 12 17-20" stroke="#35DFB5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <g className="vintraHostArms" stroke="#D5E0E7" strokeWidth="2" fill={shell}>
      <path d="M77 144Q48 159 32 115L47 106Q58 132 76 126Z"/>
      <path d="M33 116C18 113 14 103 18 98L25 101L19 82Q18 76 24 76L35 94L33 71Q34 65 39 68L45 92L51 78Q55 73 59 79L55 104Q51 117 43 119Z"/>
      <path d="M170 136Q202 137 206 165Q205 185 188 184Q172 182 173 169L182 165Q183 153 170 154Z"/>
    </g>
    <path d="M12 64 6 57M31 53l-2-10" stroke="#397FE6" strokeWidth="4" strokeLinecap="round"/>
  </svg>
}
