'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
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
import './page.css'
import './workspace.css'

type AdminTab =
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

export default function AdminPage() {
  const { isAuthenticated, dbUser, business, loading, firebaseUser, logout } = useAuth()
  const router = useRouter()
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
    { tab: 'widgets', label: text.sidebar.chatWidgets },
    { tab: 'websites', label: text.sidebar.websites },
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
    ]
  }, [dbUser])
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
      : [...visibleSupportItems, ...visibleFeedbackItems, ...visibleAdminItems].find(
          (item) => item.tab === activeTab
        )?.label || text.sidebar.overview
  const showTutorial = useMemo(() => {
    if (!dbUser?.businessId || tutorialDismissed) return false

    if (business?.onboarding?.tutorialCompletedAt) {
      return false
    }

    if (!business?.createdAt) {
      return false
    }

    const businessAgeMs = Date.now() - new Date(business.createdAt).getTime()
    const businessAgeDays = businessAgeMs / (1000 * 60 * 60 * 24)
    return businessAgeDays <= 14
  }, [business?.createdAt, business?.onboarding?.tutorialCompletedAt, dbUser?.businessId, tutorialDismissed])

  const tutorialSteps: TutorialStep[] = useMemo(
    () => [
      {
        id: 'top-nav',
        title: text.tutorial.steps.topNav.title,
        description: text.tutorial.steps.topNav.description,
        targetRef: () =>
          document.querySelector<HTMLElement>('[data-vintra-main-nav]') || adminHeaderRef.current,
        ctaLabel: text.tutorial.steps.topNav.cta,
        ctaHref: '/landings/auth/chatWidget',
      },
      {
        id: 'panel-header',
        title: text.tutorial.steps.panelHeader.title,
        description: text.tutorial.steps.panelHeader.description,
        targetRef: () => adminHeaderRef.current,
      },
      {
        id: 'chats',
        title: text.tutorial.steps.chats.title,
        description: text.tutorial.steps.chats.description,
        tab: 'chats',
        targetRef: () => chatsPanelRef.current,
      },
      {
        id: 'tasks',
        title: text.tutorial.steps.tasks.title,
        description: text.tutorial.steps.tasks.description,
        tab: 'tasks',
        targetRef: () => tasksPanelRef.current,
      },
      {
        id: 'feedback',
        title: text.tutorial.steps.feedback.title,
        description: text.tutorial.steps.feedback.description,
        tab: 'feedback',
        targetRef: () => feedbackPanelRef.current,
      },
      {
        id: 'analytics',
        title: text.tutorial.steps.analytics.title,
        description: text.tutorial.steps.analytics.description,
        tab: 'analytics',
        targetRef: () => analyticsPanelRef.current,
      },
      {
        id: 'users',
        title: text.tutorial.steps.users.title,
        description: text.tutorial.steps.users.description,
        tab: 'users',
        targetRef: () => usersPanelRef.current,
      },
      {
        id: 'widgets',
        title: text.tutorial.steps.widgets.title,
        description: text.tutorial.steps.widgets.description,
        tab: 'widgets',
        targetRef: () => widgetsPanelRef.current,
      },
    ],
    [text]
  )

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
    await updateDoc(doc(db, 'businesses', dbUser.businessId), {
      'onboarding.tutorialCompletedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const handleSidebarTabClick = (tab: AdminTab, itemId?: string) => {
    setSelectedItemId(itemId)
    setActiveTab(tab)

    if (mobileNavOpen) window.requestAnimationFrame(() => document.getElementById('admin-workspace')?.focus())
    setMobileNavOpen(false)
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login')
  }, [firebaseUser?.email, isAuthenticated, loading, router])

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
    websites: FiGlobe, settings: FiSettings }
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
        className={`adminPage ${tutorialActive ? 'adminPageTutorialMode' : ''} ${sidebarCollapsed ? 'adminPageSidebarCollapsed' : ''} ${mobileNavOpen ? 'adminPageMobileOpen' : ''}`}>
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
            </nav>
            <div className="adminSidebarBottom">
              {isVintraAdminEmail(firebaseUser?.email) && <Link className="adminSidebarHelp" href="/vintra-admin" title="Vintra-admin"><FiSettings /><span>Vintra-admin</span><FiArrowUpRight /></Link>}
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
              {!['users', 'websites', 'settings'].includes(activeTab) && <div className="adminContentWidgetPicker">
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

          {activeTab === 'websites' && (
            <div className="infoCard adminWebsitesPanel">
              <span className="adminEmptyIcon"><FiGlobe /></span>
              <h1>{text.websites.title}</h1>
              <p>{text.websites.body}</p>
              <Link href="/landings/auth/websites" className="primaryBtn">{no ? 'Åpne mine nettsider' : 'Open my websites'}<FiArrowUpRight /></Link>
            </div>
          )}

          {activeTab === 'widgets' && (
            <div ref={widgetsPanelRef}>
              <WidgetAdminPanel
                selectedWidgetKey={resolvedWidgetKey}
                onWidgetSelected={setSelectedWidgetKey}
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
                    onClick={() => router.push(activeTutorialStep.ctaHref || '/landings/auth/chatWidget')}
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
