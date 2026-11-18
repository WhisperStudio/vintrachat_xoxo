'use client'
import { useId } from 'react'
import './VintraHost.css'

export type HostExpression = 'happy' | 'guiding' | 'attentive' | 'curious' | 'explaining' | 'thinking' | 'celebrating'

const eyes: Record<HostExpression, string> = {
  happy: 'M87 92Q97 76 107 92M143 92Q153 76 163 92',
  guiding: 'M90 85v8M143 92Q153 76 163 92',
  attentive: 'M94 85v9M154 85v9',
  curious: 'M93 89v8M153 82v13M85 75l17-4M145 69l17 4',
  explaining: 'M92 85v9M152 85v9M84 74l16-3M144 71l16 3',
  thinking: 'M88 91h16M148 87h16M85 77l18-4',
  celebrating: 'M86 91l11-10 11 10M142 91l11-10 11 10',
}

export default function VintraHost({ className, expression = 'happy', hardHat = false }: { className?: string; expression?: HostExpression; hardHat?: boolean }) {
  const id = useId()
  const shell = 'url(#' + id + '-shell)'
  const glass = 'url(#' + id + '-glass)'
  return <svg className={'vintraHost ' + (className || '')} data-expression={expression} viewBox="0 0 240 240" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={id + '-shell'} x1="60" y1="40" x2="185" y2="210" gradientUnits="userSpaceOnUse"><stop stopColor="#F3F7FA"/><stop offset=".45" stopColor="#BCD3E4"/><stop offset="1" stopColor="#397FE6"/></linearGradient>
      <linearGradient id={id + '-glass'}><stop stopColor="#173449"/><stop offset="1" stopColor="#0B1D2B"/></linearGradient>
    </defs>
    <ellipse cx="126" cy="222" rx="55" ry="6" fill="#0B1D2B" opacity=".15"/>
    {!hardHat && <><path d="m143 42 7-22" stroke="#397FE6" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="152" cy="17" r="8" fill="#35DFB5" stroke="#C6FFF0" strokeWidth="2"/></>}
    <g fill="#397FE6" stroke="#BCD3E4" strokeWidth="3"><rect x="45" y="76" width="18" height="44" rx="9"/><rect x="186" y="76" width="18" height="44" rx="9"/></g>
    <path d="M76 126Q67 160 83 187Q121 219 163 187Q180 162 170 126Z" fill={shell} stroke="#D5E0E7" strokeWidth="2"/>
    <path d="M57 90C57 24 188 23 192 90L188 122Q124 153 62 122Z" fill={shell} stroke="#F3F7FA" strokeWidth="2"/>
    <path d="M70 86C70 69 94 60 125 60S180 69 180 86L178 110Q125 132 72 110Z" fill={glass} stroke="#526878" strokeWidth="3"/>
    <path d={eyes[expression]} stroke="#35DFB5" strokeWidth="6" strokeLinecap="round"/>
    <path d={expression === 'curious' ? 'M121 108q4-5 8 0q-4 6-8 0' : expression === 'thinking' ? 'M119 108h12' : expression === 'attentive' ? 'M117 107Q125 111 133 107' : expression === 'explaining' ? 'M116 104Q125 119 136 104Z' : 'M114 104Q125 117 137 104'} stroke="#35DFB5" strokeWidth="5" strokeLinecap="round"/>
    <path d="M78 66Q93 48 119 48" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity=".65"/>
    {hardHat && <g className="vintraHostHardHat" transform="translate(0 -3)">
      <path d="M62 54C64-5 184-5 188 54Z" fill="#F7C64C" stroke="#B97818" strokeWidth="2"/>
      <path d="M85 47Q88 15 111 10M164 47Q162 15 139 10" stroke="#DB9C28" strokeWidth="4" strokeLinecap="round"/>
      <rect x="117" y="5" width="16" height="45" rx="7" fill="#FFDE77" stroke="#DB9C28" strokeWidth="2"/>
      <rect x="52" y="49" width="145" height="14" rx="6" fill="#FFDA68" stroke="#B97818" strokeWidth="2"/>
    </g>}
    <path d="m110 156 15 24 15-24" stroke="#35DFB5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <g className="vintraHostArms" stroke="#D5E0E7" strokeWidth="2" fill={shell}>
      {hardHat ? <g className="vintraHostHammer">
        <path d="M77 129Q56 126 38 143L46 158Q62 149 78 145Z" />
        <g transform="rotate(-16 35 137)">
          <rect x="29" y="102" width="11" height="74" rx="4" fill="#A76B3D" stroke="#70462B" />
          <path d="M17 94H49V114H17L9 120L4 117L12 106L4 101L7 96Z" fill="#8FA6B7" stroke="#526878" strokeLinejoin="round" />
          <rect x="45" y="93" width="13" height="22" rx="3" fill="#D5E0E7" stroke="#526878" />
          <path d="M31 110V127" stroke="#D5A271" strokeWidth="3" strokeLinecap="round" />
        </g>
        <path d="M31 138Q27 143 32 152L40 157Q49 155 48 147L45 136Q39 131 35 136Z" />
        <path d="m34 142 8-2m-6 7 8-2" stroke="#87AFC9" strokeWidth="2" strokeLinecap="round" />
      </g> : <g className="vintraHostLeftHand">
      <path d="M77 144Q48 159 32 115L47 106Q58 132 76 126Z"/>
      <path d="M33 116C18 113 14 103 18 98L25 101L19 82Q18 76 24 76L35 94L33 71Q34 65 39 68L45 92L51 78Q55 73 59 79L55 104Q51 117 43 119Z"/>
      </g>}
      <path d="M170 136Q202 137 206 165Q205 185 188 184Q172 182 173 169L182 165Q183 153 170 154Z"/>
    </g>
    {!hardHat && <path d="M12 64 6 57M31 53l-2-10" stroke="#397FE6" strokeWidth="4" strokeLinecap="round"/>}
  </svg>
}
