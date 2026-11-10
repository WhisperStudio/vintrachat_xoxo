'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import PricingClient from '../priser/PricingClient'
const WebsiteBuilder = dynamic(() => import('../landings/guest/websites/WebsiteBuilder'))
const VintraAdminClient = dynamic(() => import('../vintra-admin/VintraAdminClient'))
import { useAuth } from '@/context/AuthContext'
import { needsStudioSetup } from '@/lib/studio-onboarding.mjs'
import { db } from '@/lib/firebase'
import { isVintraAdminEmail } from '@/lib/vintra-admin'
import { useActiveWidgetSelection } from '@/lib/active-widget'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCheck, FiChevronLeft, FiChevronRight, FiMoon, FiSun, FiGrid, FiMessageSquare, FiCheckSquare, FiStar, FiBarChart2, FiUsers, FiLayers, FiGlobe, FiSettings, FiMenu, FiX, FiLogOut, FiHelpCircle } from 'react-icons/fi'
import { businessAdminI18n, useVintraLanguage } from '@/lib/i18n'
import {
  APP_THEME_EVENT,
  resolveAppThemePreference,
  writeAppThemePreference,
} from '@/lib/theme-preference'
import GlobeSwitcher from '@/components/langSwitch'
import AdminDropdown from './components/AdminDropdown'
import AdminAnalyticsPanel from './components/AdminAnalyticsPanel'
import AdminChatsPanel from './components/AdminChatsPanel'
import AdminFeedbackPanel from './components/AdminFeedbackPanel'
import AdminUserManagementPanel from './components/AdminUserManagementPanel'
import AdminTasksPanel from './components/AdminTasksPanel'
import WidgetAdminPanel from './widget/page'
import AdminOverviewPanel from './components/AdminOverviewPanel'
import './workspace-theme.css'
import './page.css'
import './embedded-panels.css'
import './workspace.css'

type AdminTab =
  | 'builder'
  | 'subscriptions'
  | 'vintra'
  | 'overview'
  | 'analytics'
  | 'chats'
  | 'tasks'
  | 'users'
  | 'websites'
  | 'widgets'
  | 'feedback'
  | 'settings'

type TutorialStep = {
  id: string
  title: string
  description: string
  tab?: AdminTab
  targetRef: () => HTMLElement | null
  ctaLabel?: string
  ctaHref?: string
}

type AdminAppearanceTheme = 'light' | 'dark'

export default function AdminWorkspace({ billingConfigured, billingTestMode }: { billingConfigured: boolean; billingTestMode: boolean }) {
  const { isAuthenticated, dbUser, business, loading, firebaseUser, logout, refreshBusiness, error: accountError } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useVintraLanguage()
  const text = businessAdminI18n[language]
  const [adminTheme, setAdminTheme] = useState<AdminAppearanceTheme>('light')
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>()
  const sidebarRef = useRef<HTMLElement | null>(null)
  const adminHeaderRef = useRef<HTMLDivElement | null>(null)
  const tutorialOrbRef = useRef<HTMLButtonElement | null>(null)
  const analyticsPanelRef = useRef<HTMLDivElement | null>(null)
  const chatsPanelRef = useRef<HTMLDivElement | null>(null)
  const tasksPanelRef = useRef<HTMLDivElement | null>(null)
  const feedbackPanelRef = useRef<HTMLDivElement | null>(null)
  const usersPanelRef = useRef<HTMLDivElement | null>(null)
  const widgetsPanelRef = useRef<HTMLDivElement | null>(null)
  const tabButtonRefs = useRef<Partial<Record<AdminTab, HTMLButtonElement | null>>>({})
  const [setupInProgress, setSetupInProgress] = useState(false)
  const [tourChecked, setTourChecked] = useState(false)
  const [tourSeen, setTourSeen] = useState(false)
  const autoTourStarted = useRef('')
  const [tutorialDismissed, setTutorialDismissed] = useState(false)
  const [tutorialActive, setTutorialActive] = useState(false)
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const [tutorialSpotlight, setTutorialSpotlight] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const supportItems: Array<{ tab: AdminTab; label: string }> = [
    { tab: 'chats', label: text.sidebar.chats },
    { tab: 'tasks', label: text.sidebar.tasks },
  ]

  const feedbackItems: Array<{ tab: AdminTab; label: string }> = [
    { tab: 'feedback', label: text.sidebar.feedback },
  ]

  const adminItems: Array<{ tab: AdminTab; label: string }> = [
    { tab: 'analytics', label: text.sidebar.analytics },
    { tab: 'users', label: text.sidebar.userManagement },
    { tab: 'settings', label: text.sidebar.settings },
  ]

  const visibleTabs = useMemo(() => {
    if (!dbUser) {
      return ['overview'] as AdminTab[]
    }

    return [
      'overview',
      'analytics',
      'users',
      'widgets',
      'websites',
      'settings',
      'feedback',
      'chats',
      'tasks',
      'builder',
      'subscriptions',
      ...(firebaseUser?.emailVerified && isVintraAdminEmail(firebaseUser.email) ? ['vintra'] : []),
    ]
  }, [dbUser, firebaseUser])
  const visibleSupportItems = supportItems.filter((item) => visibleTabs.includes(item.tab))
  const visibleFeedbackItems = feedbackItems.filter((item) => visibleTabs.includes(item.tab))
  const visibleAdminItems = adminItems.filter((item) => visibleTabs.includes(item.tab))
  const widgetList = business?.chatWidgets || []
  const { selectedWidgetKey, setSelectedWidgetKey } = useActiveWidgetSelection(
    dbUser?.businessId,
    widgetList,
    business?.activeChatWidgetKey || ''
  )
  const selectedWidget =
    widgetList.find((widget) => widget.widgetKey === selectedWidgetKey) ||
    widgetList.find((widget) => widget.widgetKey === business?.activeChatWidgetKey) ||
    widgetList[0] ||
    null
  const resolvedWidgetKey = selectedWidget?.widgetKey || ''
  const activeTabTitle =
    activeTab === 'overview'
      ? text.overview.title
      : activeTab === 'widgets' || activeTab === 'builder' ? 'Widget studio'
      : activeTab === 'subscriptions' ? (language === 'no' ? 'Abonnementer' : 'Subscriptions')
      : activeTab === 'vintra' ? 'Vintra-admin'
      : activeTab === 'websites' ? (language === 'no' ? 'Nettsidebygging' : 'Website builder')
      : [...visibleSupportItems, ...visibleFeedbackItems, ...visibleAdminItems].find(
          (item) => item.tab === activeTab
        )?.label || text.sidebar.overview
  const showTutorial = tourChecked && !tourSeen && !tutorialDismissed && !setupInProgress
  const tutorialSteps: TutorialStep[] = useMemo(() => {
    const content: { id: AdminTab; no: string; en: string; descNo: string; descEn: string; target?: () => HTMLElement | null }[] = [
      { id: 'overview', no: 'Oversikten din', en: 'Your overview', descNo: 'Her ser du hva som skjer i bedriften: nye samtaler, oppgaver og tilbakemeldinger. Dette er startsiden din.', descEn: 'See what is happening in your business: new conversations, tasks and feedback. This is your starting point.' },
      { id: 'widgets', no: 'Ett sted for assistenten', en: 'One home for your assistant', descNo: 'Bedriften, Svarstil, Funksjoner og Design samler hele oppsettet. Forhåndsvisningen viser endringene. Her finner du også installasjon, synlighet og widgetlisten.', descEn: 'Business, Response style, Features and Design contain your entire setup. The preview shows changes. Installation, visibility and the widget list are here too.', target: () => widgetsPanelRef.current },
      { id: 'chats', no: 'Samtaler med kundene', en: 'Customer conversations', descNo: 'Les samtaler, følg med på henvendelser og svar selv når menneskelig support er aktivert. Velg riktig widget øverst.', descEn: 'Read conversations, follow requests and reply yourself when human support is enabled. Select the right widget at the top.', target: () => chatsPanelRef.current },
      { id: 'tasks', no: 'Tickets og oppgaver', en: 'Tickets and tasks', descNo: 'Her kommer tickets fra kundene og oppgaver teamet oppretter. Følg status, prioritet og kontaktinfo frem til saken er løst.', descEn: 'Find visitor tickets and team tasks here. Track status, priority and contact details until each issue is resolved.', target: () => tasksPanelRef.current },
      { id: 'feedback', no: 'Anmeldelser', en: 'Reviews', descNo: 'Se vurderinger og kommentarer fra kunder. Om kunden kan gi en anmeldelse, velger du under Funksjoner i Widget studio.', descEn: 'Read customer ratings and comments. Enable reviews under Features in Widget studio.', target: () => feedbackPanelRef.current },
      { id: 'analytics', no: 'Se hva som fungerer', en: 'See what works', descNo: 'Statistikken viser aktivitet og bruk over tid. Bruk den til å forbedre innholdet og oppdage spørsmål kundene ofte stiller.', descEn: 'Statistics show activity and usage over time. Use them to improve content and spot common questions.', target: () => analyticsPanelRef.current },
      { id: 'users', no: 'Teamet og tilgangene', en: 'Your team and access', descNo: 'Inviter kolleger og velg hvem som kan administrere, svare og lese. Antall teammedlemmer avhenger av abonnementet.', descEn: 'Invite colleagues and choose who can manage, reply or read. Team access depends on your plan.', target: () => usersPanelRef.current },
      { id: 'websites', no: 'Nettsidebygging', en: 'Website builder', descNo: 'Utforsk eller utform en nettside for bedriften. Dette er et eget verktøy; du trenger ikke en ny nettside for å bruke chatten.', descEn: 'Explore or design a business website. This is a separate tool; a new website is not required to use chat.' },
      { id: 'subscriptions', no: 'Abonnement og forbruk', en: 'Plan and usage', descNo: 'Sammenlign abonnement, se hva som er inkludert og administrer betaling. Du velger selv om du vil endre abonnementet.', descEn: 'Compare plans, see what is included and manage billing. Plan changes are always your choice.' },
      { id: 'settings', no: 'Dine innstillinger', en: 'Your settings', descNo: 'Tilpass språk, utseende og andre innstillinger for arbeidsområdet. Hjelpeknappen øverst starter denne omvisningen på nytt.', descEn: 'Adjust language, appearance and workspace preferences. The help button at the top restarts this tour.' },
      { id: 'vintra', no: 'Vintra-administrasjon', en: 'Vintra administration', descNo: 'Dette området er for Vintra-administratorer og gir oversikt over bedrifter og plattforminnstillinger.', descEn: 'This area is for Vintra administrators and provides business and platform administration.' },
    ]
    return content.filter(step => visibleTabs.includes(step.id)).map(step => ({ id: step.id, tab: step.id, title: language === 'no' ? step.no : step.en, description: language === 'no' ? step.descNo : step.descEn, targetRef: step.target || (() => document.getElementById('admin-workspace')) }))
  }, [language, visibleTabs])

  useEffect(() => {
    if (loading || !business || !firebaseUser) return
    if (needsStudioSetup(business, firebaseUser.uid)) {
      setSetupInProgress(true)
      setActiveTab('widgets')
    }
  }, [loading, business, firebaseUser])
  useEffect(() => {
    if (!business || !firebaseUser) return
    let seen = business.ownerId === firebaseUser.uid && Boolean(business.onboarding?.tutorialCompletedAt)
    try { seen = seen || window.localStorage.getItem('vintra-tour:' + business.id + ':' + firebaseUser.uid) === 'done' } catch {}
    setTourSeen(seen)
    setTourChecked(true)
  }, [business?.id, firebaseUser?.uid])
  useEffect(() => {
    if (!tourChecked || tourSeen || setupInProgress || loading || !business || !firebaseUser || needsStudioSetup(business, firebaseUser.uid)) return
    if (autoTourStarted.current === firebaseUser.uid) return
    autoTourStarted.current = firebaseUser.uid
    setTutorialStepIndex(0)
    setTutorialActive(true)
    setActiveTab('overview')
  }, [tourChecked, tourSeen, setupInProgress, loading, business, firebaseUser])
  const finishStudioSetup = async () => {
    if (!dbUser?.businessId) return
    await updateDoc(doc(db, 'businesses', dbUser.businessId), { 'onboarding.widgetSetupCompletedAt': serverTimestamp(), updatedAt: serverTimestamp() })
    await refreshBusiness()
    autoTourStarted.current = firebaseUser?.uid || ''
    setSetupInProgress(false)
    setTutorialStepIndex(0)
    setTutorialActive(true)
    setActiveTab('overview')
  }

  useEffect(() => {
    const section = searchParams.get('section')
    if (section === 'builder' || section === 'widget') setActiveTab('widgets')
    else if (section && visibleTabs.includes(section)) setActiveTab(section as AdminTab)
  }, [searchParams, visibleTabs])

  const activeTutorialStep = tutorialSteps[tutorialStepIndex] || tutorialSteps[0]
  const tutorialMaxStepIndex = tutorialSteps.length - 1

  const openTutorial = () => {
    setMobileNavOpen(false)
    setTutorialActive(true)
    setTutorialStepIndex(0)
  }

  const closeTutorial = async (persist = false) => {
    setTutorialActive(false)
    setTutorialSpotlight(null)

    if (!persist) {
      return
    }

    try { await completeTutorial() } catch { setTutorialDismissed(true) }
  }

  const goToTutorialStep = (nextIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(tutorialMaxStepIndex, nextIndex))
    setTutorialStepIndex(clampedIndex)
    const nextStep = tutorialSteps[clampedIndex]
    if (nextStep?.tab) {
      setActiveTab(nextStep.tab)
    }
  }

  const completeTutorial = async () => {
    if (!dbUser?.businessId) return

    setTutorialDismissed(true)
    setTourSeen(true)
    try { window.localStorage.setItem('vintra-tour:' + dbUser.businessId + ':' + firebaseUser?.uid, 'done') } catch {}
    if (business?.ownerId !== firebaseUser?.uid) return
    await updateDoc(doc(db, 'businesses', dbUser.businessId), {
      'onboarding.tutorialCompletedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const handleSidebarTabClick = (tab: AdminTab, itemId?: string) => {
    setSelectedItemId(itemId)
    setActiveTab(tab)
    const params = new URLSearchParams(window.location.search)
    params.set('section', tab)
    router.replace('/admin?' + params.toString(), { scroll: false })

    if (mobileNavOpen) window.requestAnimationFrame(() => document.getElementById('admin-workspace')?.focus())
    setMobileNavOpen(false)
  }

  useEffect(() => {
    if (loading || accountError) return
    if (!firebaseUser) router.replace('/auth/login')
    else if (!isAuthenticated) router.replace('/invite')
  }, [firebaseUser, isAuthenticated, loading, accountError, router])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const syncTheme = () => setAdminTheme(resolveAppThemePreference())
    const syncThemeFromEvent = () => syncTheme()
    const syncThemeFromStorage = () => syncTheme()

    syncTheme()
    media.addEventListener?.('change', syncTheme)
    window.addEventListener(APP_THEME_EVENT, syncThemeFromEvent)
    window.addEventListener('storage', syncThemeFromStorage)

    return () => {
      media.removeEventListener?.('change', syncTheme)
      window.removeEventListener(APP_THEME_EVENT, syncThemeFromEvent)
      window.removeEventListener('storage', syncThemeFromStorage)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('admin-mobile-sidebar-open', mobileNavOpen)
    if (mobileNavOpen) sidebarRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onResize = () => { if (window.innerWidth > 900) setMobileNavOpen(false) }
    window.addEventListener('resize', onResize)
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && mobileNavOpen) {
        const items = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a, button:not(:disabled)') || []).filter(item => item.getClientRects().length)
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
      if (event.key === 'Escape' && mobileNavOpen) {
        setMobileNavOpen(false)
        window.requestAnimationFrame(() => menuButtonRef.current?.focus())
      }
    }
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('resize', onResize)
      document.body.classList.remove('admin-mobile-sidebar-open')
      window.removeEventListener('keydown', close)
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab((visibleTabs[0] || 'overview') as AdminTab)
    }
  }, [activeTab, visibleTabs])

  useEffect(() => {
    if (!tutorialActive) return

    const nextStep = tutorialSteps[tutorialStepIndex]
    if (!nextStep) return

    if (nextStep.tab && activeTab !== nextStep.tab) {
      setActiveTab(nextStep.tab)
    }
  }, [activeTab, tutorialActive, tutorialStepIndex, tutorialSteps])

  useLayoutEffect(() => {
    if (!tutorialActive) {
      setTutorialSpotlight(null)
      return
    }

    const updateSpotlight = () => {
      const target = activeTutorialStep?.targetRef()
      if (!target) {
        setTutorialSpotlight(null)
        return
      }

      const rect = target.getBoundingClientRect()
      const padding = 14

      setTutorialSpotlight({
        top: Math.max(10, rect.top - padding),
        left: Math.max(10, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      })
    }

    updateSpotlight()
    const raf = window.requestAnimationFrame(updateSpotlight)
    window.addEventListener('resize', updateSpotlight)
    window.addEventListener('scroll', updateSpotlight, true)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight, true)
    }
  }, [activeTab, activeTutorialStep, tutorialActive, tutorialStepIndex])

  useEffect(() => {
    if (!tutorialActive) return
    const coach = document.querySelector<HTMLElement>('.adminTutorialCoachCard')
    coach?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setTutorialActive(false); tutorialOrbRef.current?.focus() }
      if (event.key === 'Tab') {
        const items = Array.from(coach?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || [])
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && (document.activeElement === first || document.activeElement === coach)) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [tutorialActive])

  if (loading) return <main className="adminLoading" aria-busy="true"><FiLayers /><p>{text.loading}</p></main>
  if (!isAuthenticated || !dbUser) return null

  const no = language === 'no'
  const navIcons = { overview: FiGrid, chats: FiMessageSquare, tasks: FiCheckSquare,
    feedback: FiStar, analytics: FiBarChart2, users: FiUsers, widgets: FiLayers,
    websites: FiGlobe, settings: FiSettings, builder: FiLayers, subscriptions: FiLayers, vintra: FiSettings }
  const renderNavItem = (tab: AdminTab, label: string) => {
    const Icon = navIcons[tab]
    return <button key={tab} type="button" title={label}
      ref={node => { tabButtonRefs.current[tab] = node }}
      onClick={() => handleSidebarTabClick(tab)}
      className={activeTab === tab ? 'sideActive' : ''}
      aria-current={activeTab === tab ? 'page' : undefined}>
      <Icon aria-hidden="true" /><span>{label}</span>
      {activeTab === tab && <span className="adminNavDot" aria-hidden="true" />}
    </button>
  }

  return (
    <>
      <main data-admin-theme={adminTheme}
        className={`workspaceTheme adminPage ${tutorialActive ? 'adminPageTutorialMode' : ''} ${sidebarCollapsed ? 'adminPageSidebarCollapsed' : ''} ${mobileNavOpen ? 'adminPageMobileOpen' : ''}`}>
        <a className="adminSkipLink" href="#admin-workspace">{no ? 'Hopp til innhold' : 'Skip to content'}</a>
        {mobileNavOpen && <button className="adminMobileBackdrop" tabIndex={-1} aria-label={no ? 'Lukk meny' : 'Close menu'} onClick={() => setMobileNavOpen(false)} />}
        <div className="adminSidebarFollowScreen">
          <aside id="admin-navigation" className={`adminSidebar ${sidebarCollapsed ? 'adminSidebarCollapsed' : ''}`} ref={sidebarRef}>
            <div className="adminSidebarHeader">
              <Link href="/landings/main" className="adminSidebarBrand" aria-label="Vintra">
                <span className="adminBrandMark"><FiLayers /></span>
                <span className="adminSidebarBrandCopy"><strong>vintra<span>®</span></strong><small>{no ? 'ARBEIDSOMRÅDE' : 'WORKSPACE'}</small></span>
              </Link>
              <button type="button" className="adminSidebarCollapseToggle" onClick={() => setSidebarCollapsed(current => !current)}
                aria-label={sidebarCollapsed ? text.sidebar.expand : text.sidebar.collapse} title={sidebarCollapsed ? text.sidebar.expand : text.sidebar.collapse}>
                {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
              </button>
              <button type="button" className="adminMobileClose" aria-label={no ? 'Lukk meny' : 'Close menu'} onClick={() => { setMobileNavOpen(false); window.requestAnimationFrame(() => menuButtonRef.current?.focus()) }}><FiX /></button>
            </div>
            <button className="adminBusinessCard" onClick={() => handleSidebarTabClick('overview')} title={business?.name}>
              <span className="adminBusinessAvatar">{(business?.name || 'V').slice(0, 1).toUpperCase()}</span>
              <span><strong>{business?.name || 'Vintra'}</strong><small>{no ? 'Din bedrift' : 'Your business'}</small></span>
            </button>
            <nav className="adminNavigation" aria-label={text.sidebar.title}>
              <div className="adminSidebarGroup"><Link href="/landings/main" title={no ? 'Gå til hovedsiden' : 'Go to homepage'}><FiArrowLeft aria-hidden="true" /><span>{no ? 'Gå til hovedsiden' : 'Go to homepage'}</span></Link></div>
              <div className="adminSidebarGroup">
                <div className="adminSidebarGroupLabel">{no ? 'Arbeidsområde' : 'Workspace'}</div>
                {renderNavItem('overview', text.sidebar.overview)}
                {visibleSupportItems.map(item => renderNavItem(item.tab, item.label))}
                {visibleFeedbackItems.map(item => renderNavItem(item.tab, item.label))}
              </div>
              <div className="adminSidebarGroup">
                <div className="adminSidebarGroupLabel">{text.sidebar.administrative}</div>
                {visibleAdminItems.map(item => renderNavItem(item.tab, item.label))}
              </div>
              <div className="adminSidebarGroup">
                <div className="adminSidebarGroupLabel">{no ? 'Bygg og administrer' : 'Build and manage'}</div>
                {renderNavItem('websites', no ? 'Nettsidebygging' : 'Website builder')}
                {renderNavItem('widgets', 'Widget studio')}
                {renderNavItem('subscriptions', no ? 'Abonnementer' : 'Subscriptions')}
              </div>
              {firebaseUser?.emailVerified && isVintraAdminEmail(firebaseUser.email) && (
                <div className="adminSidebarGroup">
                  <div className="adminSidebarGroupLabel">Vintra</div>
                  {renderNavItem('vintra', 'Vintra-admin')}
                </div>
              )}
            </nav>
            <div className="adminSidebarBottom">
              <button className="adminSidebarHelp" onClick={openTutorial} title={text.overview.tutorial}><FiHelpCircle /><span>{text.overview.tutorial}</span><FiArrowUpRight /></button>
              <div className="adminProfile">
                <span className="adminProfileAvatar">{(dbUser.displayName || dbUser.email).slice(0, 2).toUpperCase()}</span>
                <Link href="/landings/user" className="adminProfileLink" title={no ? 'Min konto' : 'My account'}><strong>{dbUser.displayName || dbUser.email.split('@')[0]}</strong><small>{dbUser.email}</small></Link>
                <button type="button" title={no ? 'Logg ut' : 'Sign out'} aria-label={no ? 'Logg ut' : 'Sign out'}
                  onClick={async () => { try { await logout(); router.push('/auth/login') } catch { setLogoutError(no ? 'Kunne ikke logge ut. Prøv igjen.' : 'Could not sign out. Try again.') } }}><FiLogOut /></button>
              </div>
              {logoutError && <p className="adminLogoutError" role="alert">{logoutError}</p>}
            </div>
          </aside>
        </div>

        <div className="adminMain" inert={mobileNavOpen || undefined}>
          <header className="adminContentTopbar" ref={adminHeaderRef}>
            <div className="adminBreadcrumb">
              <button type="button" ref={menuButtonRef} className="adminMobileMenu" aria-expanded={mobileNavOpen} aria-controls="admin-navigation"
                aria-label={text.sidebar.expand} onClick={() => setMobileNavOpen(current => !current)}><FiMenu /></button>
              <span>{business?.name || 'Vintra'}</span><FiChevronRight aria-hidden="true" /><strong>{activeTabTitle}</strong>
            </div>
            <div className="adminContentTopbarActions">
              {!['users', 'websites', 'settings', 'builder', 'subscriptions', 'vintra'].includes(activeTab) && <div className="adminContentWidgetPicker">
                <FiLayers aria-hidden="true" />
                <AdminDropdown value={resolvedWidgetKey} placeholder={text.overview.selectWidget}
                  options={widgetList.map(widget => ({ value: widget.widgetKey, label: widget.name }))}
                  onChange={setSelectedWidgetKey} disabled={!widgetList.length} />
              </div>}
              <button type="button" className="adminHeaderIcon" onClick={() => writeAppThemePreference(adminTheme === 'light' ? 'dark' : 'light')}
                aria-label={adminTheme === 'light' ? text.settings.darkMode : text.settings.lightMode} title={adminTheme === 'light' ? text.settings.darkMode : text.settings.lightMode}>
                {adminTheme === 'light' ? <FiMoon /> : <FiSun />}
              </button>
              <button type="button" ref={tutorialOrbRef} className="adminHeaderIcon" onClick={openTutorial} aria-label={text.overview.tutorialAria} title={text.overview.tutorialAria}><FiHelpCircle /></button>
            </div>
          </header>
          <section className="adminContent" id="admin-workspace" tabIndex={-1} aria-label={activeTabTitle}>
          {activeTab === 'overview' && <AdminOverviewPanel key={dbUser.businessId} selectedWidgetKey={resolvedWidgetKey}
            onNavigate={handleSidebarTabClick} showTutorial={showTutorial} onStartTutorial={openTutorial} />}

          {activeTab === 'analytics' && (
            <div ref={analyticsPanelRef}>
              <AdminAnalyticsPanel selectedWidgetKey={resolvedWidgetKey} theme={adminTheme} />
            </div>
          )}

          {activeTab === 'chats' && (
            <div ref={chatsPanelRef}>
              <AdminChatsPanel
                hideWidgetPicker
                initialChatId={selectedItemId}
                selectedWidgetKey={resolvedWidgetKey}
                onWidgetSelected={setSelectedWidgetKey}
              />
            </div>
          )}

          {activeTab === 'tasks' && (
            <div ref={tasksPanelRef}>
              <AdminTasksPanel initialTaskId={selectedItemId} selectedWidgetKey={resolvedWidgetKey} />
            </div>
          )}

          {activeTab === 'feedback' && (
            <div ref={feedbackPanelRef}>
              <AdminFeedbackPanel selectedWidgetKey={resolvedWidgetKey} />
            </div>
          )}

          {activeTab === 'users' && (
            <div ref={usersPanelRef}>
              <AdminUserManagementPanel />
            </div>
          )}

          {activeTab === 'websites' && <WebsiteBuilder embedded />}
          {activeTab === 'subscriptions' && <PricingClient configured={billingConfigured} testMode={billingTestMode} embedded />}
          {activeTab === 'vintra' && firebaseUser?.emailVerified && isVintraAdminEmail(firebaseUser.email) && <VintraAdminClient embedded />}

          {activeTab === 'widgets' && (
            <div ref={widgetsPanelRef}>
              <WidgetAdminPanel
                selectedWidgetKey={resolvedWidgetKey}
                onWidgetSelected={setSelectedWidgetKey}
                setupMode={setupInProgress}
                onSetupComplete={finishStudioSetup}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="infoCard adminSettingsPanel">
              <h1>{text.settings.title}</h1>
              <p>{text.settings.body}</p>
              <div className="adminSettingsGrid">
                <section className="adminSettingsSection">
                  <div className="adminSettingsSectionHeader">
                    <div>
                      <h2>{text.settings.languageTitle}</h2>
                      <p>{text.settings.languageBody}</p>
                    </div>
                  </div>
                  <div className="adminSettingsLanguageCard">
                    <GlobeSwitcher size={68} glass={adminTheme === 'light'} />
                  </div>
                </section>

                <section className="adminSettingsSection">
                  <div className="adminSettingsSectionHeader">
                    <div>
                      <h2>{text.settings.themeTitle}</h2>
                      <p>{text.settings.themeBody}</p>
                    </div>
                  </div>
                  <div className="adminThemeOptions" role="group" aria-label={text.settings.themeTitle}>
                    <button
                      type="button"
                      className={`adminThemeOption ${adminTheme === 'light' ? 'active' : ''}`}
                      onClick={() => writeAppThemePreference('light')}
                      aria-pressed={adminTheme === 'light'}
                    >
                      <span className="adminThemeOptionIcon">
                        <FiSun />
                      </span>
                      <span className="adminThemeOptionCopy">
                        <strong>{text.settings.lightMode}</strong>
                        <small>{text.settings.lightModeDesc}</small>
                      </span>
                      {adminTheme === 'light' ? <FiCheck className="adminThemeOptionCheck" /> : null}
                    </button>

                    <button
                      type="button"
                      className={`adminThemeOption ${adminTheme === 'dark' ? 'active' : ''}`}
                      onClick={() => writeAppThemePreference('dark')}
                      aria-pressed={adminTheme === 'dark'}
                    >
                      <span className="adminThemeOptionIcon">
                        <FiMoon />
                      </span>
                      <span className="adminThemeOptionCopy">
                        <strong>{text.settings.darkMode}</strong>
                        <small>{text.settings.darkModeDesc}</small>
                      </span>
                      {adminTheme === 'dark' ? <FiCheck className="adminThemeOptionCheck" /> : null}
                    </button>
                  </div>
                </section>

                <section className="adminSettingsSection">
                  <div className="adminSettingsSectionHeader">
                    <div>
                      <h2>Policy</h2>
                      <p>
                        Se de offentlige retningslinjene for personvern, sikkerhet, AI-bruk og support.
                      </p>
                    </div>
                  </div>
                  <div className="adminSettingsLinkCard">
                    <span className="adminSettingsLinkEyebrow">Public page</span>
                    <strong>Åpne policy-siden</strong>
                    <p>
                      Denne lenken åpner den eksterne policy-siden som besøkende og kunder kan lese.
                    </p>
                    <Link href="/policy" className="adminSettingsLinkButton">
                      <span>Gå til policy</span>
                      <FiArrowUpRight />
                    </Link>
                  </div>
                </section>
              </div>
            </div>
          )}
          </section>
        </div>

        {tutorialActive && tutorialSpotlight ? (
          <>
            <div
              className="adminTutorialBackdrop adminTutorialBackdropTop"
              style={{ height: `${tutorialSpotlight.top}px` }}
            />
            <div
              className="adminTutorialBackdrop adminTutorialBackdropLeft"
              style={{
                top: `${tutorialSpotlight.top}px`,
                left: '0px',
                width: `${tutorialSpotlight.left}px`,
                height: `${tutorialSpotlight.height}px`,
              }}
            />
            <div
              className="adminTutorialBackdrop adminTutorialBackdropRight"
              style={{
                top: `${tutorialSpotlight.top}px`,
                left: `${tutorialSpotlight.left + tutorialSpotlight.width}px`,
                right: '0px',
                height: `${tutorialSpotlight.height}px`,
              }}
            />
            <div
              className="adminTutorialBackdrop adminTutorialBackdropBottom"
              style={{
                top: `${tutorialSpotlight.top + tutorialSpotlight.height}px`,
                left: '0px',
                right: '0px',
                bottom: '0px',
              }}
            />
            <div
              className="adminTutorialSpotlight"
              style={{
                top: `${tutorialSpotlight.top}px`,
                left: `${tutorialSpotlight.left}px`,
                width: `${tutorialSpotlight.width}px`,
                height: `${tutorialSpotlight.height}px`,
              }}
            />
            <div className="adminTutorialCoach">
              <div className="adminTutorialCoachCard" role="dialog" aria-modal="true" aria-labelledby="admin-guide-title" tabIndex={-1}>
                <div className="adminTutorialCoachTop">
                  <span className="adminTutorialCoachStep">
                    {text.tutorial.step} {tutorialStepIndex + 1} {text.tutorial.of} {tutorialSteps.length}
                  </span>
                  <button
                    type="button"
                    className="adminTutorialCoachSkip"
                    onClick={() => void closeTutorial(true)}
                  >
                    {text.tutorial.finish}
                  </button>
                </div>

                <h3 id="admin-guide-title">{activeTutorialStep?.title}</h3>
                <p>{activeTutorialStep?.description}</p>

                {activeTutorialStep?.ctaHref ? (
                  <button
                    type="button"
                    className="adminTutorialCoachCta"
                    onClick={() => router.push(activeTutorialStep.ctaHref || '/admin?section=builder')}
                  >
                    {activeTutorialStep.ctaLabel || text.tutorial.steps.topNav.cta}
                    <FiArrowUpRight />
                  </button>
                ) : null}

                <div className="adminTutorialQuickNav">
                  {tutorialSteps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      className={index === tutorialStepIndex ? 'active' : ''}
                      onClick={() => goToTutorialStep(index)}
                    >
                      {step.title}
                    </button>
                  ))}
                </div>

                <div className="adminTutorialCoachNav">
                  <button
                    type="button"
                    className="adminTutorialNavBtn"
                    onClick={() => goToTutorialStep(tutorialStepIndex - 1)}
                    disabled={tutorialStepIndex === 0}
                  >
                    <FiArrowLeft />
                    {text.tutorial.back}
                  </button>
                  <button
                    type="button"
                    className="adminTutorialNavBtn adminTutorialNavBtnPrimary"
                    onClick={() => {
                      if (tutorialStepIndex >= tutorialMaxStepIndex) {
                        void closeTutorial(true)
                        return
                      }

                      goToTutorialStep(tutorialStepIndex + 1)
                    }}
                  >
                    {tutorialStepIndex >= tutorialMaxStepIndex ? text.tutorial.finish : text.tutorial.next}
                    <FiArrowRight />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </>
  )
}
