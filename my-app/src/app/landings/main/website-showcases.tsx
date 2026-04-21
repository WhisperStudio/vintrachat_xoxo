'use client'

import type { ComponentType } from 'react'
import { BusinessShowcase } from './business-showcase'
import { PortfolioShowcase } from './portfolio-showcase'
import { RestaurantShowcase } from './restaurant-showcase'
import { ServiceShowcase } from './service-showcase'
import { ShopShowcase } from './shop-showcase'
import { StartupShowcase } from './startup-showcase'
import type { ShowcaseProps } from './website-showcases.shared'

type ShowcaseComponent = ComponentType<ShowcaseProps>

const showcaseMap: Record<string, ShowcaseComponent> = {
  Restaurant: RestaurantShowcase,
  Portfolio: PortfolioShowcase,
  Nettbutikk: ShopShowcase,
  Startup: StartupShowcase,
  'Frisør / Spa': ServiceShowcase,
  Bedrift: BusinessShowcase,
}

export const websites = [
  { label: 'Restaurant', color: '#E85D26', accent: '#FFF4EE', lines: ['Smakenes Hus', 'Moderne norsk mat', '★★★★★'], img: '🍽️' },
  { label: 'Portfolio', color: '#1A6BFF', accent: '#EEF4FF', lines: ['Ola Nordmann', 'Designer & Utvikler', 'Se arbeid →'], img: '🎨' },
  { label: 'Nettbutikk', color: '#0C9E6A', accent: '#EEFAF4', lines: ['NordicShop', 'Fri frakt over 499kr', 'Handl nå →'], img: '🛍️' },
  { label: 'Startup', color: '#7C3AED', accent: '#F5F0FF', lines: ['LaunchFast', 'Fra idé til produkt', 'Book demo →'], img: '🚀' },
  { label: 'Frisør / Spa', color: '#D4449A', accent: '#FDF0F8', lines: ['Studio Ella', 'Book din time', 'Bestill nå →'], img: '✂️' },
  { label: 'Bedrift', color: '#1E3A5F', accent: '#EFF3F8', lines: ['Nordvest AS', 'Pålitelig siden 1998', 'Kontakt oss →'], img: '🏢' },
]

export function WebsiteShowcaseModal({ label, onClose }: { label: string; onClose: () => void }) {
  const Showcase = showcaseMap[label]
  if (!Showcase) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        padding: 12,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(100%, 980px)',
          height: 'min(88vh, 760px)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <Showcase onClose={onClose} />
      </div>
    </div>
  )
}

