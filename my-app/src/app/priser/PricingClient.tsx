'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FiArrowRight, FiCheck, FiCreditCard, FiShield, FiZap } from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { PLANS } from '@/lib/billing/catalog.mjs'
import type { Business } from '@/types/database'
import './pricing.css'

type Plan = keyof typeof PLANS
type Cycle = 'monthly' | 'yearly'
type Account = { plan: Plan; canManage: boolean; billing: Business['billing'] | null; usage: { conversations: number; messages: number } }
const money = (amount: number) => new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(amount / 100)
const descriptions = { free: 'Bli kjent med kundene dine.', pro: 'For bedrifter som vil vokse.', business: 'Mer kapasitet. Et større team.' }

export default function PricingClient({ configured, testMode }: { configured: boolean; testMode: boolean }) {
  const { firebaseUser, business, loading, refreshBusiness } = useAuth()
  const params = useSearchParams()
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [account, setAccount] = useState<Account | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const request = useCallback(async (action: string, data: Record<string, unknown> = {}) => {
    if (!firebaseUser || !business) throw new Error('Logg inn med bedriftskontoen din først.')
    const response = await fetch('/api/billing', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await firebaseUser.getIdToken()}` },
      body: JSON.stringify({ action, businessId: business.id, ...data }) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Noe gikk galt. Prøv igjen.')
    return result
  }, [firebaseUser, business])

  useEffect(() => {
    if (!firebaseUser || !business || !configured) return
    let cancelled = false
    async function load() {
      try {
        const sessionId = params.get('session_id')
        if (sessionId) {
          const result = await request('confirm', { sessionId })
          if (!cancelled) setNotice(result.pending ? 'Betalingen er ikke bekreftet ennå. Oppdater status om et øyeblikk.' : 'Betalingen er bekreftet. Abonnementet ditt er oppdatert!')
        } else if (params.get('portal') === 'returned') await request('refresh')
        const result = await request('status')
        if (!cancelled) { setAccount(result); setError('') }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Kunne ikke hente abonnementet.') }
    }
    void load()
    return () => { cancelled = true }
  }, [firebaseUser, business, configured, params, request, retry])

  async function pay(plan?: Plan) {
    setBusy(plan || 'portal'); setError('')
    try {
      const result = await request(plan ? 'checkout' : 'portal', plan ? { plan, cycle } : {})
      const url = new URL(result.url)
      if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error('Ugyldig betalingslenke.')
      window.location.assign(url.href)
    } catch (err) { setError(err instanceof Error ? err.message : 'Kunne ikke åpne betalingen.'); setBusy('') }
  }

  return <main className="billing-page" data-header-tone="dark">
    <div className="billing-wrap">
      <div className="billing-eyebrow"><span /> VINTRA CHAT · ABONNEMENT</div>
      <section className="billing-hero">
        <h1>Små spørsmål.<br /><span>Store muligheter.</span></h1>
        <p>Gi besøkende et svar når de trenger det. Start gratis, og få mer kapasitet og flere muligheter når bedriften vokser.</p>
        <div className="billing-cycle" aria-label="Betalingsintervall">
          <button onClick={() => setCycle('monthly')} aria-pressed={cycle === 'monthly'}>Månedlig</button>
          <button onClick={() => setCycle('yearly')} aria-pressed={cycle === 'yearly'}>Årlig <span>2 mnd gratis</span></button>
        </div>
      </section>
      {testMode && configured && <div className="billing-notice">Testmodus: Betalingene her er testbetalinger. Ingen ekte penger trekkes.</div>}
      {!configured && <div className="billing-notice">Betaling er ikke aktivert ennå. Du kan fortsatt opprette en gratis konto.</div>}
      {params.get('checkout') === 'canceled' && <div className="billing-notice">Betalingen ble avbrutt. Abonnementet ditt er ikke endret.</div>}
      {notice && <div role="status" className="billing-notice billing-success">{notice}</div>}
      {error && <div role="alert" className="billing-error">{error} <button onClick={() => setRetry(n => n + 1)}>Prøv igjen</button></div>}

      {account && <section className="billing-account" aria-label="Ditt abonnement">
        <div><span className="billing-small">{business?.name} · DITT ABONNEMENT</span><h2>{PLANS[account.plan].name}</h2>
          {account.billing?.cancelAtPeriodEnd && <p>Avsluttes {new Date(account.billing.currentPeriodEnd * 1000).toLocaleDateString('nb-NO')}. Du beholder tilgangen ut perioden.</p>}
          {account.billing && !['active', 'trialing', 'canceled'].includes(account.billing.status) && <p>Betalingen trenger oppfølging. Oppdater betalingsmåten i kundeportalen.</p>}
        </div>
        <div className="billing-usage"><span>{account.usage.conversations} / {PLANS[account.plan].conversations} samtaler i dag</span>
          <progress aria-label="Samtaleforbruk i dag" value={account.usage.conversations} max={PLANS[account.plan].conversations} />
          <span>{account.usage.messages} / {PLANS[account.plan].messages} meldinger i dag</span>
          <small>Nullstilles kl. 00:00 UTC.</small>
        </div>
        <div className="billing-account-actions">
          {account.canManage && account.billing && <button disabled={Boolean(busy)} onClick={() => void pay()}><FiCreditCard /> Administrer betaling</button>}
          <button onClick={() => { setRetry(n => n + 1); void refreshBusiness() }}>Oppdater status</button>
        </div>
      </section>}

      <section className="billing-cards" aria-label="Velg abonnement">
        {(Object.keys(PLANS) as Plan[]).map(plan => {
          const info = PLANS[plan], popular = plan === 'pro', current = account?.plan === plan
          const amount = cycle === 'yearly' ? info.yearly / 12 : info.monthly
          return <article key={plan} className={`billing-card ${popular ? 'billing-featured' : ''}`}>
            {popular && <div className="billing-recommended"><FiZap /> ANBEFALT FOR SMÅ BEDRIFTER</div>}
            <div className="billing-card-top"><h2>{info.name}</h2>{current && <span className="billing-current">Din plan</span>}</div>
            <p className="billing-description">{descriptions[plan]}</p>
            <div className="billing-price">{money(amount)} <span>kr / mnd</span></div>
            <p className="billing-period">{plan === 'free' ? 'Gratis. Ingen betalingskort.' : cycle === 'yearly' ? `${money(info.yearly)} kr faktureres årlig` : 'Faktureres månedlig'}</p>
            <ul>
              <li><FiCheck /><strong>{info.conversations.toLocaleString('nb-NO')} samtaler per dag</strong></li>
              <li><FiCheck />{info.messages.toLocaleString('nb-NO')} meldinger per dag</li>
              <li><FiCheck />{info.widgets} {info.widgets === 1 ? 'widget' : 'widgeter'}</li>
              <li><FiCheck />{info.members} {info.members === 1 ? 'teammedlem' : 'teammedlemmer'}</li>
              <li><FiCheck />AI-svar og menneskelig oppfølging</li>
              <li><FiCheck />{plan === 'free' ? 'Grunnleggende utseende' : 'Orb-knapp, glassutseende og egne ikoner'}</li>
            </ul>
            {plan === 'free' ? <Link className="billing-cta" href={firebaseUser ? '/landings/auth/chatWidget' : '/auth/signup'}>{firebaseUser ? 'Åpne widgeten' : 'Start gratis'}<FiArrowRight /></Link>
              : !firebaseUser ? <Link className="billing-cta" href="/auth/login?next=%2Fpriser">Logg inn og velg {info.name}<FiArrowRight /></Link>
              : <button className="billing-cta" disabled={loading || Boolean(busy) || !configured || !account?.canManage}
                onClick={() => void pay(plan)}>{busy === plan ? 'Åpner Stripe …' : current ? 'Administrer abonnement' : `Velg ${info.name}`}<FiArrowRight /></button>}
          </article>
        })}
      </section>
      <p className="billing-caption">Alle priser er i norske kroner, inkludert eventuell merverdiavgift. Abonnementet fornyes automatisk til du sier det opp. Ingen ekstra bruksgebyrer.</p>
      {firebaseUser && account && !account.canManage && <p className="billing-caption">Bedriftens eier administrerer abonnementet.</p>}
      <section className="billing-trust"><FiShield /><div><strong>Betal trygt med Stripe.</strong><p>Betalingskort håndteres av Stripe. Fakturaer, betalingsmåte og oppsigelse finner du i kundeportalen.</p></div></section>
      <section className="billing-comparison">
        <div><span className="billing-small">ET ABONNEMENT SOM PASSER</span><h2>Se forskjellen.</h2></div>
        <div className="billing-table-scroll"><table><caption className="billing-sr-only">Sammenligning av abonnementer</caption><thead><tr><th scope="col">Inkludert</th>{Object.values(PLANS).map(p => <th scope="col" key={p.name}>{p.name}</th>)}</tr></thead>
          <tbody>{([['Samtaler per dag', 'conversations'], ['Meldinger per dag', 'messages'], ['Widgeter', 'widgets'], ['Teammedlemmer', 'members']] as const).map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{Object.values(PLANS).map(p => <td key={p.name}>{p[key].toLocaleString('nb-NO')}</td>)}</tr>)}
            <tr><th scope="row">Orb-knapp og glassutseende</th><td>—</td><td>Inkludert</td><td>Inkludert</td></tr>
            <tr><th scope="row">Egne grensesnittikoner</th><td>—</td><td>Inkludert</td><td>Inkludert</td></tr>
          </tbody></table></div>
      </section>
      <section className="billing-faq"><div><span className="billing-small">GREIT Å VITE</span><h2>Spørsmål om abonnement.</h2></div><div>
        <details><summary>Hva skjer når jeg når en grense?</summary><p>Nye samtaler eller meldinger pauses når dagsgrensen er nådd. Kvotene deles av alle widgetene i bedriften og nullstilles ved midnatt UTC. Du får aldri en overraskende ekstraregning.</p></details>
        <details><summary>Kan jeg endre eller si opp abonnementet?</summary><p>Ja. Bedriftens eier kan åpne kundeportalen herfra. Stripe viser beløp og tidspunkt før en endring bekreftes. Nedgraderinger og oppsigelser gjelder ved slutten av den betalte perioden.</p></details>
        <details><summary>Hva skjer med widgetene ved nedgradering?</summary><p>Dataene beholdes. Bare antallet widgeter som inngår i den nye planen er aktive. Betalte designeffekter slås av på Gratis, og teammedlemmer utover grensen mister tilgangen til abonnementet oppgraderes igjen.</p></details>
        <details><summary>Hvordan fungerer årsbetaling?</summary><p>Du betaler for ti måneder og får tolv. Pro koster 2 990 kr per år, og Enterprise koster 9 990 kr per år. Hele beløpet betales ved starten av perioden.</p></details>
      </div></section>
      <footer className="billing-footer"><Link href="/terms">Vilkår</Link><Link href="/policy">Personvern</Link><a href="mailto:support@vintrastudio.com">Kontakt oss</a></footer>
    </div>
  </main>
}
