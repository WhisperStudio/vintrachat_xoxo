'use client'

import { useEffect, useState } from 'react'
import TourLauncher from '@/components/TourLauncher'
import StudioTourAnchor from '@/components/chat/StudioTourAnchor'
import VintraHost, { type HostExpression } from '@/svgs/VintraHost'
import './PricingGuide.css'

export default function PricingGuide({ no, autoStart, hasAccount }: { no: boolean; autoStart: boolean; hasAccount: boolean }) {
  const [step, setStep] = useState<number | null>(null)
  useEffect(() => {
    if (!autoStart) return
    try { if (localStorage.getItem('vintra:pricing-tour:v1') !== 'seen') setStep(0) }
    catch { setStep(0) }
  }, [autoStart])
  const finish = () => {
    try { localStorage.setItem('vintra:pricing-tour:v1', 'seen') } catch { /* Optional browser storage. */ }
    setStep(null)
  }
  const steps: { selector: string; title: string; text: string; expression: HostExpression }[] = [
    { selector: '.billing-cards', expression: 'curious', title: no ? 'Skal vi finne riktig abonnement?' : 'Shall we find your plan?', text: no ? 'Her sammenligner du Gratis, Pro og Enterprise. Start med det du trenger nå. Kortene viser kapasitet, teamstørrelse og funksjoner for hver plan.' : 'Compare Free, Pro and Enterprise here. Start with what you need today. Each card shows capacity, team size and included features.' },
    { selector: '.billing-cycle', expression: 'explaining', title: no ? 'Månedlig eller årlig?' : 'Monthly or yearly?', text: no ? 'Prøv bryteren! Prisene oppdateres når du bytter. Ved årsbetaling vises en pris per måned, og hele årsbeløpet står under. Årsbeløpet betales samlet.' : 'Try the switch! Prices update when you change it. Yearly billing shows a monthly equivalent, with the full annual total underneath. The annual total is paid together.' },
    { selector: '.billing-comparison', expression: 'attentive', title: no ? 'Se forskjellene side om side' : 'Compare the details', text: no ? 'Her ser du dagsgrenser for samtaler og meldinger, antall widgeter og plass til teamet. Kvotene deles av bedriftens widgeter. Velg kapasitet som passer trafikken din.' : 'Compare daily conversation and message limits, widgets and team seats. Quotas are shared across your business widgets. Choose capacity that fits your traffic.' },
    { selector: '.billing-faq', expression: 'explaining', title: no ? 'Lurer du på noe?' : 'Any questions?', text: no ? 'Åpne et spørsmål for å lese om grenser, årsbetaling, nedgradering og oppsigelse. Her finner du detaljene før du velger.' : 'Open a question to read about limits, yearly billing, downgrades and cancellation. Find the details here before choosing.' },
    { selector: hasAccount ? '.billing-account' : '.billing-cards', expression: 'celebrating', title: no ? 'Du har oversikten!' : 'You are all set!', text: hasAccount ? (no ? 'Under Ditt abonnement ser du planen og forbruket ditt. Har du tilgang til å administrere betaling, finner du også knappene for betaling og oppsigelse her.' : 'Your subscription shows your plan and usage. If you can manage billing, payment and cancellation controls appear here too.') : (no ? 'Logg inn eller opprett en konto når du vil velge abonnement. Du kan starte gratis og komme tilbake hit når du trenger mer. Jeg er her nede til venstre hvis du vil ta runden på nytt.' : 'Sign in or create an account when you want to choose a plan. Start free and return when you need more. Find me in the bottom-left corner to take the tour again.') },
  ]
  if (step === null) return <TourLauncher no={no} onClick={() => setStep(0)} />
  return <StudioTourAnchor selector={steps[step].selector} inline nearTarget={step === 1}><aside className="pricingGuide" aria-label={no ? 'Veiledning til abonnement' : 'Subscription guide'} onKeyDown={event => { if (event.key === 'Escape') finish() }}>
    <style>{'[data-vintra-widget-key="GIN6CPbnBnbTOoEPU3wctBqr"] { display: none !important; }'}</style>
    <VintraHost expression={steps[step].expression} />
    <div aria-live="polite"><small>VINTRA · {step + 1}/{steps.length}</small><h2>{steps[step].title}</h2><p>{steps[step].text}</p>
      <div className="pricingGuideProgress" aria-hidden="true">{steps.map((_, index) => <i key={index} data-complete={index <= step} />)}</div>
      <div className="pricingGuideActions"><button type="button" onClick={finish}>{no ? 'Hopp over' : 'Skip tour'}</button>{step > 0 && <button type="button" onClick={() => setStep(step - 1)}>{no ? 'Forrige' : 'Previous'}</button>}<button type="button" className="pricingGuideNext" onClick={() => step === steps.length - 1 ? finish() : setStep(step + 1)}>{step === steps.length - 1 ? (no ? 'Ferdig!' : 'Done!') : (no ? 'Neste' : 'Next')}</button></div>
    </div>
  </aside></StudioTourAnchor>
}
