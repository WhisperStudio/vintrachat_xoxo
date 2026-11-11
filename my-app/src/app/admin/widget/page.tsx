'use client'

import LoadingAnimation from '@/components/LoadingAnimation'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { FiCheck, FiCode, FiCopy, FiDownload, FiGlobe, FiLayers, FiPlus, FiSettings, FiShield, FiTrash2 } from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { useVintraLanguage } from '@/lib/i18n'
import { createChatWidget, deleteChatWidget, setActiveChatWidget, updateChatWidgetConfig } from '@/lib/auth.service'
import { getEffectiveBusinessPlan, getPlanLimits } from '@/lib/subscription'
import { parseAllowedDomainsInput } from '@/lib/widget-security'
import '@/components/chat/WidgetFlowSettings.css'
import './WidgetStudio.css'

const ChatWidgetStudio = dynamic(() => import('@/app/landings/auth/chatWidget/ChatWidgetBuilder'), { loading: () => <LoadingAnimation label="Laster studio…" /> })
const sections = [
  { id: 'studio', no: 'Assistenten', en: 'Assistant', hintNo: 'Innhold, funksjoner og design', hintEn: 'Knowledge, features and design', icon: FiSettings },
  { id: 'install', no: 'Installer', en: 'Install', hintNo: 'Legg chatten på nettsiden', hintEn: 'Add chat to your website', icon: FiCode },
  { id: 'security', no: 'Synlighet', en: 'Visibility', hintNo: 'Domener og sider', hintEn: 'Domains and pages', icon: FiShield },
  { id: 'widgets', no: 'Mine widgeter', en: 'My widgets', hintNo: 'Opprett og administrer', hintEn: 'Create and manage', icon: FiLayers },
] as const
type Section = (typeof sections)[number]['id']

export default function WidgetAdminPanel({ selectedWidgetKey, onWidgetSelected, setupMode = false, onSetupComplete }: {
  selectedWidgetKey?: string; onWidgetSelected?: (key: string) => void; setupMode?: boolean; onSetupComplete?: () => Promise<void>
} = {}) {
  const { business, dbUser, loading, refreshBusiness } = useAuth()
  const { language } = useVintraLanguage()
  const no = language === 'no'
  const [section, setSection] = useState<Section>('studio')
  const [localKey, setLocalKey] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [domains, setDomains] = useState('')
  const [showPaths, setShowPaths] = useState('')
  const [hidePaths, setHidePaths] = useState('')
  const widgets = business?.chatWidgets || []
  const key = selectedWidgetKey || localKey || business?.activeChatWidgetKey || business?.chatWidgetKey || ''
  const widget = widgets.find(item => item.widgetKey === key)
  const needsSetup = setupMode || widget?.assistantConfig?.setupCompleted === false
  const config = widget?.config || business?.chatWidgetConfig
  const plan = getEffectiveBusinessPlan(business, config)
  const limit = getPlanLimits(plan).maxWidgets
  const canCreate = limit === null || widgets.length < limit
  const embedCode = `<script src="https://chat.vintrastudio.com/widget/${encodeURIComponent(key)}.js" async></script>`

  useEffect(() => {
    setDomains((config?.allowedDomains || []).join('\n'))
    setShowPaths((config?.visibility?.showOnPaths || []).join('\n'))
    setHidePaths((config?.visibility?.hideOnPaths || []).join('\n'))
    setDeleteConfirmed(false)
  }, [key, config])
  useEffect(() => { if (needsSetup) setSection('studio') }, [needsSetup])

  const run = async (action: () => Promise<void>) => {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { await action() }
    catch (error) { setError(error instanceof Error ? error.message : (no ? 'Kunne ikke utføre handlingen.' : 'Unable to complete action.')) }
    finally { setBusy(false) }
  }
  const selectWidget = (next: string) => {
    setLocalKey(next)
    onWidgetSelected?.(next)
  }
  const addWidget = () => run(async () => {
    if (!dbUser?.businessId || !canCreate) return
    const result = await createChatWidget(dbUser.businessId, name.trim() || undefined)
    if (!result.success || !result.widgetKey) throw new Error(result.message)
    selectWidget(result.widgetKey)
    setName('')
    await refreshBusiness()
    setSection('studio')
  })
  const removeWidget = () => run(async () => {
    if (!dbUser?.businessId || !deleteConfirmed || !key) return
    const result = await deleteChatWidget(dbUser.businessId, key)
    if (!result.success) throw new Error(result.message)
    selectWidget('')
    await refreshBusiness()
    setNotice(no ? 'Widgeten er slettet.' : 'Widget deleted.')
  })
  const saveVisibility = () => run(async () => {
    if (!dbUser?.businessId || !config) return
    const result = await updateChatWidgetConfig(dbUser.businessId, {
      ...config, allowedDomains: parseAllowedDomainsInput(domains), visibility: {
        showOnPaths: showPaths.split('\n').map(line => line.trim()).filter(Boolean),
        hideOnPaths: hidePaths.split('\n').map(line => line.trim()).filter(Boolean),
      },
    }, key)
    if (!result.success) throw new Error(result.message)
    await refreshBusiness()
    setNotice(no ? 'Synligheten er lagret.' : 'Visibility saved.')
  })

  if (loading) return <LoadingAnimation label={no ? 'Laster arbeidsområdet…' : 'Loading workspace…'} />
  if (!business || !dbUser) return <p>{no ? 'Logg inn for å administrere assistenten.' : 'Sign in to manage your assistant.'}</p>

  return <div className="widgetAdminSimple">
    {!needsSetup && <nav className="widgetStudioNav" aria-label={no ? 'Widgetadministrasjon' : 'Widget administration'}>{sections.map(item => {
      const Icon = item.icon
      return <button key={item.id} type="button" aria-current={section === item.id ? 'page' : undefined} onClick={() => { setSection(item.id); setNotice(''); setError('') }}><Icon aria-hidden="true" /><span><strong>{no ? item.no : item.en}</strong><small>{no ? item.hintNo : item.hintEn}</small></span></button>
    })}</nav>}
    {error && <p className="widgetStudioAlert" role="alert">{error}</p>}
    {notice && <p className="widgetStudioNotice" role="status"><FiCheck aria-hidden="true" />{notice}</p>}
    {section === 'studio' && <ChatWidgetStudio key={key} embedded widgetKey={key} onWidgetSelected={selectWidget} setupMode={needsSetup} onSetupComplete={async () => { if (setupMode) await onSetupComplete?.(); await refreshBusiness() }} />}
    {section === 'install' && <section className="widgetStudioCard">
      <div className="widgetStudioCardHeading"><span className="widgetStudioIcon"><FiCode /></span><div><h2>{no ? 'Legg assistenten på nettsiden' : 'Add your assistant to your website'}</h2><p>{no ? 'Lagre oppsettet, tillat domenet under Synlighet, og lim inn koden før </body> på nettsiden.' : 'Save your setup, allow your domain under Visibility, and paste this before </body> on your website.'}</p></div></div>
      <pre className="widgetStudioCode"><code>{embedCode}</code></pre>
      <div className="widgetStudioActions"><button type="button" disabled={!key || busy} onClick={() => void run(async () => { await navigator.clipboard.writeText(embedCode); setNotice(no ? 'Koden er kopiert.' : 'Code copied.') })}><FiCopy />{no ? 'Kopier kode' : 'Copy code'}</button><button type="button" className="secondary" disabled={!key} onClick={() => {
        const url = URL.createObjectURL(new Blob([embedCode], { type: 'text/html;charset=utf-8' }))
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'vintra-chat-widget.html'; anchor.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }}><FiDownload />{no ? 'Last ned' : 'Download'}</button></div>
    </section>}
    {section === 'security' && <section className="widgetStudioCard widgetFlowSettings">
      <div className="widgetStudioCardHeading"><span className="widgetStudioIcon"><FiGlobe /></span><div><h2>{no ? 'Hvor skal assistenten vises?' : 'Where should your assistant appear?'}</h2><p>{no ? 'Dette styrer plasseringen på nettsiden. Assistentens svar og funksjoner endrer du under Assistenten.' : 'This controls placement on your website. Edit replies and features under Assistant.'}</p></div></div>
      <label className="widgetFlowField"><span>{no ? 'Tillatte domener' : 'Allowed domains'}</span><textarea rows={4} value={domains} placeholder="din-bedrift.no" onChange={e => setDomains(e.target.value)} /><small>{no ? 'Ett domene eller én full nettsidelenke per linje. Mobilapper kan bruke en app-ID.' : 'One domain or full website URL per line. Mobile apps can use an app ID.'}</small></label>
      <div className="widgetStudioColumns"><label className="widgetFlowField"><span>{no ? 'Vis bare på disse sidene' : 'Only show on these pages'}</span><textarea rows={4} value={showPaths} placeholder={'/\n/produkter*'} onChange={e => setShowPaths(e.target.value)} /><small>{no ? 'Tomt felt betyr alle sider.' : 'Leave empty for all pages.'}</small></label><label className="widgetFlowField"><span>{no ? 'Skjul på disse sidene' : 'Hide on these pages'}</span><textarea rows={4} value={hidePaths} placeholder={'/checkout\n/admin*'} onChange={e => setHidePaths(e.target.value)} /><small>{no ? 'Bruk * for å inkludere undersider.' : 'Use * to include subpages.'}</small></label></div>
      <div className="widgetStudioActions"><button type="button" disabled={busy} onClick={() => void saveVisibility()}><FiCheck />{busy ? (no ? 'Lagrer…' : 'Saving…') : (no ? 'Lagre synlighet' : 'Save visibility')}</button></div>
    </section>}
    {section === 'widgets' && <section className="widgetStudioCard widgetFlowSettings">
      <div className="widgetStudioCardHeading"><span className="widgetStudioIcon"><FiLayers /></span><div><h2>{no ? 'Dine widgeter' : 'Your widgets'}</h2><p>{no ? 'Hver widget har sitt eget innhold, funksjoner, design og installasjonskode.' : 'Each widget has its own knowledge, features, design and installation code.'}</p></div></div>
      <label className="widgetFlowField"><span>{no ? 'Velg widget' : 'Select widget'}</span><select value={key} onChange={e => selectWidget(e.target.value)}>{widgets.map(item => <option key={item.widgetKey} value={item.widgetKey}>{item.name}</option>)}</select></label>
      <div className="widgetStudioActions"><button type="button" onClick={() => setSection('studio')}><FiSettings />{no ? 'Rediger assistenten' : 'Edit assistant'}</button><button type="button" className="secondary" disabled={busy || !key || key === business.activeChatWidgetKey} onClick={() => void run(async () => { const result = await setActiveChatWidget(dbUser.businessId, key); if (!result.success) throw new Error(result.message); await refreshBusiness(); setNotice(no ? 'Widgeten er satt som aktiv.' : 'Widget set as active.') })}><FiCheck />{no ? 'Bruk som aktiv widget' : 'Use as active widget'}</button></div>
      <fieldset><legend>{no ? 'Opprett en widget' : 'Create a widget'}</legend><label className="widgetFlowField"><span>{no ? 'Navn' : 'Name'}</span><input value={name} onChange={e => setName(e.target.value)} placeholder={no ? 'For eksempel kundeservice' : 'For example customer service'} /></label><div className="widgetStudioActions"><button type="button" disabled={busy || !canCreate} onClick={() => void addWidget()}><FiPlus />{no ? 'Opprett og tilpass' : 'Create and customize'}</button></div>{!canCreate && <p>{no ? 'Du har nådd antallet widgeter i abonnementet ditt.' : 'You have reached your plan’s widget limit.'}</p>}</fieldset>
      <details className="studioDetails"><summary><FiTrash2 />{no ? 'Slett valgt widget' : 'Delete selected widget'}</summary><label className="widgetFlowToggle"><span>{no ? 'Jeg vil slette denne widgeten og installasjonsnøkkelen.' : 'I want to delete this widget and its installation key.'}</span><input type="checkbox" checked={deleteConfirmed} onChange={e => setDeleteConfirmed(e.target.checked)} /></label><div className="widgetStudioActions"><button type="button" className="danger" disabled={busy || !deleteConfirmed} onClick={() => void removeWidget()}><FiTrash2 />{no ? 'Slett widget' : 'Delete widget'}</button></div></details>
    </section>}
  </div>
}
