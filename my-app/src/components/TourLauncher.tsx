'use client'

import VintraHost from '@/svgs/VintraHost'
import './TourLauncher.css'

export default function TourLauncher({ no, onClick }: { no: boolean; onClick: () => void }) {
  return <button type="button" className="vintraTourLauncher" onClick={onClick}><VintraHost expression="guiding" /><span>{no ? 'Vis meg rundt' : 'Show me around'}</span></button>
}
