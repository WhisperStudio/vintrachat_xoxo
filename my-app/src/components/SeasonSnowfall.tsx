import type { CSSProperties } from 'react'
import './season-snowfall.css'

export default function SeasonSnowfall({ viewport = false }: { viewport?: boolean }) {
  return <div className={`seasonSnowField${viewport ? ' seasonSnowField--viewport' : ''}`} aria-hidden="true">
    {Array.from({ length: 38 }, (_, index) => <span key={index} style={{
      left: `${(index * 37 + 11) % 100}%`,
      animationDelay: `${-((index * 13) % 31)}s`,
      animationDuration: `${18 + (index * 7) % 15}s`,
      fontSize: `${8 + (index * 5) % 9}px`,
      '--snow-rest': `${(index * 29) % 100}%`,
    } as CSSProperties}>❄</span>)}
  </div>
}
