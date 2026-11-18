'use client'

import Link from 'next/link'
import VintraHost from '@/svgs/VintraHost'
import { useVintraLanguage } from '@/lib/i18n'
import './WebsiteConstructionCover.css'

export default function WebsiteConstructionCover({ embedded = false }: { embedded?: boolean }) {
  const { language } = useVintraLanguage()
  const no = language === 'no'
  return <section className={'websiteConstruction' + (embedded ? ' websiteConstructionEmbedded' : '')} aria-labelledby="website-construction-title" data-header-tone="light">
    <div className="websiteConstructionContent">
      <div className="websiteConstructionBubble"><span>{no ? 'EN LITEN BYGGEPAUSE' : 'A LITTLE BUILDING BREAK'}</span><h1 id="website-construction-title">{no ? 'Obs! Denne siden er under konstruksjon.' : 'Heads up! This page is under construction.'}</h1><p>{no ? 'Jeg har tatt på vernehjelmen. Vi bygger et bedre sted å lage nettsiden din – kom gjerne tilbake senere!' : 'Hard hat on! We are building a better place to create your website. Come back and see us later!'}</p></div>
      <VintraHost hardHat expression="happy" />
      <div className="websiteConstructionGround" aria-hidden="true" />
      <Link href={embedded ? '/admin?section=widgets' : '/landings/auth/chatWidget'}>{no ? 'Prøv chatwidgeten i mellomtiden' : 'Try the chat widget while we build'}</Link>
      {!embedded && <Link className="websiteConstructionBack" href="/">{no ? 'Til forsiden' : 'Back to home'}</Link>}
    </div>
  </section>
}
