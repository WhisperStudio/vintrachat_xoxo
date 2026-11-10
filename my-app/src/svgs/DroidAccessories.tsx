import { useId } from 'react'

export default function DroidAccessories() {
  const id = useId()
  return <>
    <svg className="droidSeasonalHat" viewBox="0 0 120 95" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fabric`} x2="1" y2="1"><stop stopColor="#ff626d" /><stop offset=".5" stopColor="#d82b45" /><stop offset="1" stopColor="#8c1735" /></linearGradient>
        <linearGradient id={`${id}-trim`} x2="0" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#bcd7e8" /></linearGradient>
      </defs>
      <path d="M14 73C18 52 24 31 45 18 66 4 88 9 99 24 106 34 106 44 101 50L86 46C88 37 84 30 77 29 71 42 77 55 91 69Z" fill={`url(#${id}-fabric)`} />
      <path d="M46 24Q29 46 28 67M76 32Q68 51 81 65" fill="none" stroke="#ffb0b5" strokeWidth="2" opacity=".35" />
      <path d="M10 69Q54 56 96 66Q104 69 101 79Q54 70 12 82Q4 81 5 76Z" fill={`url(#${id}-trim)`} stroke="#fff" strokeWidth="2" />
      <path d="M16 73Q54 62 94 70" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <circle cx="99" cy="48" r="12" fill={`url(#${id}-trim)`} stroke="#fff" strokeWidth="2" />
      <circle cx="96" cy="44" r="4" fill="#fff" opacity=".8" />
    </svg>
    <svg className="droidSeasonalGlasses" viewBox="0 0 120 40" aria-hidden="true">
      <path d="M3 8 10 10M110 10 117 8M52 14Q60 8 68 14" fill="none" stroke="#7fe8ef" strokeWidth="4" strokeLinecap="round" />
      <path d="M9 6H51L48 29Q30 39 14 28ZM69 6H111L106 28Q90 39 72 29Z" fill="#082339" stroke="#74e6eb" strokeWidth="3" strokeLinejoin="round" />
      <path d="m18 12 7 0-8 12m17-12h7L27 28m51-16h7l-9 12m17-12h7L88 28" fill="none" stroke="#3dbbd5" strokeWidth="3" opacity=".6" />
      <path d="M12 5H49M71 5H108" stroke="#d1ffff" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <svg className="droidSeasonalEars" viewBox="0 0 100 100" aria-hidden="true">
      <g fill="#bbdef5" stroke="#effaff" strokeWidth="2">
        <path d="M23 94C17 70 3 23 15 8 28-4 39 44 40 89Z" />
        <path d="M60 89C61 44 72-4 85 8 97 23 83 70 77 94Z" />
      </g>
      <g fill="#f7a9cc" stroke="#df82b5" strokeWidth="1.5">
        <path d="M26 77C21 57 14 24 19 20 25 17 31 54 32 78Z" />
        <path d="M68 78C69 54 75 17 81 20 86 24 79 57 74 77Z" />
      </g>
      <path d="m24 44 4 11-1 7m48-18-4 11 1 7" fill="none" stroke="#fff0fa" strokeWidth="2" />
      <g fill="#3edbdc"><rect x="24" y="83" width="12" height="5" rx="2" /><rect x="64" y="83" width="12" height="5" rx="2" /></g>
    </svg>
  </>
}
