'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FiArrowRight, FiCheck, FiCreditCard, FiShield, FiZap } from 'react-icons/fi'
import { useVintraLanguage } from '@/lib/i18n'
import { billingEnglish } from './translations'
import { useAuth } from '@/context/AuthContext'
import { PLANS } from '@/lib/billing/catalog.mjs'
import type { Business } from '@/types/database'
import './pricing.css'

type Plan = keyof typeof PLANS
type Cycle = 'monthly' | 'yearly'
type Account = { plan: Plan; canManage: boolean; billing: Business['billing'] | null; usage: { conversations: number; messages: number } }

export default function PricingClient({ configured, testMode, embedded = false }: { configured: boolean; testMode: boolean; embedded?: boolean }) {
  const { firebaseUser, business, loading, isAuthenticated, refreshBusiness } = useAuth()
  const { language, setLanguage } = useVintraLanguage()
  const no = language === 'no'
  const locale = no ? 'nb-NO' : 'en-GB'
  const t = useCallback((text: string) => no ? text : billingEnglish[text] || text, [no])
  const money = (amount: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount / 100)
  const planName = (plan: Plan) => plan === 'free' && !no ? 'Free' : PLANS[plan].name
  const descriptions = { free: t("Bli kjent med kundene dine."), pro: t("For bedrifter som vil vokse."), business: t("Mer kapasitet. Et større team.") }
  const params = useSearchParams()
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [account, setAccount] = useState<Account | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const request = useCallback(async (action: string, data: Record<string, unknown> = {}) => {
    if (!firebaseUser || !business) throw new Error(t("Logg inn med bedriftskontoen din først."))
    const response = await fetch('/api/billing', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await firebaseUser.getIdToken()}` },
      body: JSON.stringify({ action, businessId: business.id, ...data, language }) })
    const result = await response.json()
    if (!response.ok) throw new Error((result.error ? t(result.error) : '') || t("Noe gikk galt. Prøv igjen."))
    return result
  }, [firebaseUser, business, language, t])

  useEffect(() => {
    if (!isAuthenticated || !firebaseUser || !business || !configured) { setAccount(null); return }
    let cancelled = false
    async function load() {
      try {
        const sessionId = params.get('session_id')
        if (sessionId) {
          const result = await request('confirm', { sessionId })
          if (!cancelled) setNotice(result.pending ? t("Betalingen er ikke bekreftet ennå. Oppdater status om et øyeblikk.") : t("Betalingen er bekreftet. Abonnementet ditt er oppdatert!"))
        } else if (params.get('portal') === 'returned') await request('refresh')
        const result = await request('status')
        if (!cancelled) { setAccount(result); setError('') }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : t("Kunne ikke hente abonnementet.")) }
    }
    void load()
    return () => { cancelled = true }
  }, [isAuthenticated, firebaseUser, business, configured, params, request, retry, t])

  async function pay(plan?: Plan, cancel = false) {
    setBusy(cancel ? 'cancel' : plan || 'portal'); setError('')
    try {
      const result = await request(plan ? 'checkout' : 'portal', plan ? { plan, cycle } : { cancel })
      const url = new URL(result.url)
      if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error(t("Ugyldig betalingslenke."))
      window.location.assign(url.href)
    } catch (err) { setError(err instanceof Error ? err.message : t("Kunne ikke åpne betalingen.")); setBusy('') }
  }

  return <main className={embedded ? "billing-page workspaceBilling" : "billing-page"} data-header-tone="dark">
    <div className="billing-wrap">
      <div className="billing-cycle" aria-label={no ? 'Språk' : 'Language'}>
        <button type="button" lang="nb" aria-pressed={no} onClick={() => setLanguage('no')}>Norsk</button>
        <button type="button" lang="en" aria-pressed={!no} onClick={() => setLanguage('en')}>English</button>
      </div>
      <div className="billing-eyebrow"><span /> {t("VINTRA CHAT · ABONNEMENT")}</div>
      <section className="billing-hero">
        <h1>{t("Små spørsmål.")}<br /><span>{t("Store muligheter.")}</span></h1>
        <p>{t("Gi besøkende et svar når de trenger det. Start gratis, og få mer kapasitet og flere muligheter når bedriften vokser.")}</p>
        <div className="billing-cycle" aria-label={t("Betalingsintervall")}>
          <button onClick={() => setCycle('monthly')} aria-pressed={cycle === 'monthly'}>{t("Månedlig")}</button>
          <button onClick={() => setCycle('yearly')} aria-pressed={cycle === 'yearly'}>{t("Årlig")} <span>{t("2 mnd gratis")}</span></button>
        </div>
      </section>
      {!loading && !isAuthenticated && <div className="billing-notice">{no ? 'Sammenlign abonnementene her. ' : 'Compare plans here. '}<Link href="/auth/login?next=%2Fpriser">{no ? 'Logg inn' : 'Sign in'}</Link>{no ? ' eller ' : ' or '}<Link href="/auth/signup">{no ? 'opprett en konto' : 'create an account'}</Link>{no ? ' for å velge abonnement.' : ' to choose a subscription.'}</div>}
      {testMode && configured && <div className="billing-notice">{t("Testmodus: Betalingene her er testbetalinger. Ingen ekte penger trekkes.")}</div>}
      {!configured && <div className="billing-notice">{t("Betaling er ikke aktivert ennå. Du kan fortsatt opprette en gratis konto.")}</div>}
      {params.get('checkout') === 'canceled' && <div className="billing-notice">{t("Betalingen ble avbrutt. Abonnementet ditt er ikke endret.")}</div>}
      {notice && <div role="status" className="billing-notice billing-success">{notice}</div>}
      {error && <div role="alert" className="billing-error">{error} <button onClick={() => setRetry(n => n + 1)}>{t("Prøv igjen")}</button></div>}

      {account && <section className="billing-account" aria-label={t("Ditt abonnement")}>
        <div><span className="billing-small">{business?.name} · {t("DITT ABONNEMENT")}</span><h2>{planName(account.plan)}</h2>
          {account.billing?.cancelAtPeriodEnd && <p>{no ? "Avsluttes" : "Ends on"} {new Date(account.billing.currentPeriodEnd * 1000).toLocaleDateString(locale)}{no ? ". Du beholder tilgangen ut perioden." : ". You keep access until the end of the period."}</p>}
          {account.billing && !['active', 'trialing', 'canceled'].includes(account.billing.status) && <p>{t("Betalingen trenger oppfølging. Oppdater betalingsmåten i kundeportalen.")}</p>}
        </div>
        <div className="billing-usage"><span>{account.usage.conversations} / {PLANS[account.plan].conversations} {t("samtaler i dag")}</span>
          <progress aria-label={t("Samtaleforbruk i dag")} value={account.usage.conversations} max={PLANS[account.plan].conversations} />
          <span>{account.usage.messages} / {PLANS[account.plan].messages} {t("meldinger i dag")}</span>
          <small>{t("Nullstilles kl. 00:00 UTC.")}</small>
        </div>
        <div className="billing-account-actions">
          {account.canManage && account.billing && <button disabled={Boolean(busy)} onClick={() => void pay()}><FiCreditCard /> {t("Administrer betaling")}</button>}
          {account.canManage && account.billing?.subscriptionId && !account.billing.cancelAtPeriodEnd
            && !['canceled', 'incomplete_expired'].includes(account.billing.status) && <>
            <button disabled={Boolean(busy)} onClick={() => void pay(undefined, true)}>
              {busy === 'cancel' ? (no ? 'Åpner Stripe …' : 'Opening Stripe …') : (no ? 'Si opp abonnement' : 'Cancel subscription')}
            </button>
            <small>{no ? 'Bekreft oppsigelsen hos Stripe. Du beholder tilgangen ut den betalte perioden.' : 'Confirm cancellation in Stripe. You keep access until the end of your paid period.'}</small>
          </>}
          <button onClick={() => { setRetry(n => n + 1); void refreshBusiness() }}>{t("Oppdater status")}</button>
        </div>
      </section>}

      <section className="billing-cards" aria-label={t("Velg abonnement")}>
        {(Object.keys(PLANS) as Plan[]).map(plan => {
          const info = PLANS[plan], popular = plan === 'pro', current = account?.plan === plan
          const amount = cycle === 'yearly' ? info.yearly / 12 : info.monthly
          return <article key={plan} className={`billing-card ${popular ? 'billing-featured' : ''}`}>
            {popular && <div className="billing-recommended"><FiZap /> {t("ANBEFALT FOR SMÅ BEDRIFTER")}</div>}
            <div className="billing-card-top"><h2>{planName(plan)}</h2>{current && <span className="billing-current">{t("Din plan")}</span>}</div>
            <p className="billing-description">{descriptions[plan]}</p>
            <div className="billing-price">{money(amount)} <span>{t("kr / mnd")}</span></div>
            <p className="billing-period">{plan === 'free' ? t("Gratis. Ingen betalingskort.") : cycle === 'yearly' ? `${money(info.yearly)} ${no ? "kr faktureres årlig" : "NOK billed yearly"}` : t("Faktureres månedlig")}</p>
            <ul>
              <li><FiCheck /><strong>{info.conversations.toLocaleString(locale)} {t("samtaler per dag")}</strong></li>
              <li><FiCheck />{info.messages.toLocaleString(locale)} {t("meldinger per dag")}</li>
              <li><FiCheck />{info.widgets} {info.widgets === 1 ? 'widget' : t("widgeter")}</li>
              <li><FiCheck />{info.members} {info.members === 1 ? t("teammedlem") : t("teammedlemmer")}</li>
              <li><FiCheck />{t("AI-svar og menneskelig oppfølging")}</li>
              <li><FiCheck />{plan === 'free' ? t("Grunnleggende utseende") : t("Orb-knapp, glassutseende og egne ikoner")}</li>
            </ul>
            {plan === 'free' ? <Link className="billing-cta" href={isAuthenticated ? (embedded ? '/admin?section=builder' : '/landings/auth/chatWidget') : '/auth/signup'}>{isAuthenticated ? t("Åpne widgeten") : t("Start gratis")}<FiArrowRight /></Link>
              : !isAuthenticated ? <Link className="billing-cta" href="/auth/login?next=%2Fpriser">{no ? "Logg inn og velg" : "Sign in and choose"} {planName(plan)}<FiArrowRight /></Link>
              : <button className="billing-cta" disabled={loading || Boolean(busy) || !configured || !account?.canManage}
                onClick={() => void pay(plan)}>{busy === plan ? t("Åpner Stripe …") : current ? t("Administrer abonnement") : `${no ? "Velg" : "Choose"} ${planName(plan)}`}<FiArrowRight /></button>}
          </article>
        })}
      </section>
      <p className="billing-caption">{t("Alle priser er i norske kroner, inkludert eventuell merverdiavgift. Abonnementet fornyes automatisk til du sier det opp. Ingen ekstra bruksgebyrer.")}</p>
      {firebaseUser && account && !account.canManage && <p className="billing-caption">{t("Bedriftens eier administrerer abonnementet.")}</p>}
      <section className="billing-trust"><FiShield /><div><strong>{t("Betal trygt med Stripe.")}</strong><p>{t("Betalingskort håndteres av Stripe. Fakturaer, betalingsmåte og oppsigelse finner du i kundeportalen.")}</p></div></section>
      <section className="billing-comparison">
        <div><span className="billing-small">{t("ET ABONNEMENT SOM PASSER")}</span><h2>{t("Se forskjellen.")}</h2></div>
        <div className="billing-table-scroll"><table><caption className="billing-sr-only">{t("Sammenligning av abonnementer")}</caption><thead><tr><th scope="col">{t("Inkludert")}</th>{Object.values(PLANS).map(p => <th scope="col" key={p.name}>{p.name === "Gratis" && !no ? "Free" : p.name}</th>)}</tr></thead>
          <tbody>{([[t("Samtaler per dag"), 'conversations'], [t("Meldinger per dag"), 'messages'], [t("Widgeter"), 'widgets'], [t("Teammedlemmer"), 'members']] as const).map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{Object.values(PLANS).map(p => <td key={p.name}>{p[key].toLocaleString(locale)}</td>)}</tr>)}
            <tr><th scope="row">{t("Orb-knapp og glassutseende")}</th><td>—</td><td>{t("Inkludert")}</td><td>{t("Inkludert")}</td></tr>
            <tr><th scope="row">{t("Egne grensesnittikoner")}</th><td>—</td><td>{t("Inkludert")}</td><td>{t("Inkludert")}</td></tr>
          </tbody></table></div>
      </section>
      <section className="billing-faq"><div><span className="billing-small">{t("GREIT Å VITE")}</span><h2>{t("Spørsmål om abonnement.")}</h2></div><div>
        <details><summary>{t("Hva skjer når jeg når en grense?")}</summary><p>{t("Nye samtaler eller meldinger pauses når dagsgrensen er nådd. Kvotene deles av alle widgetene i bedriften og nullstilles ved midnatt UTC. Du får aldri en overraskende ekstraregning.")}</p></details>
        <details><summary>{t("Kan jeg endre eller si opp abonnementet?")}</summary><p>{t("Ja. Velg «Si opp abonnement» under «Ditt abonnement» og bekreft hos Stripe. Du beholder tilgangen ut den betalte perioden. Bedriftens eier kan også endre abonnement i kundeportalen.")}</p></details>
        <details><summary>{t("Hva skjer med widgetene ved nedgradering?")}</summary><p>{t("Dataene beholdes. Bare antallet widgeter som inngår i den nye planen er aktive. Betalte designeffekter slås av på Gratis, og teammedlemmer utover grensen mister tilgangen til abonnementet oppgraderes igjen.")}</p></details>
        <details><summary>{t("Hvordan fungerer årsbetaling?")}</summary><p>{t("Du betaler for ti måneder og får tolv. Pro koster 2 990 kr per år, og Enterprise koster 9 990 kr per år. Hele beløpet betales ved starten av perioden.")}</p></details>
      </div></section>
      <footer className="billing-footer"><Link href="/terms">{t("Vilkår")}</Link><Link href="/policy">{t("Personvern")}</Link><a href="mailto:support@vintrastudio.com">{t("Kontakt oss")}</a></footer>
    </div>
  </main>
}
