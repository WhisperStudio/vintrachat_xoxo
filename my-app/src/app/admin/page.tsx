'use client'

import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiPlay, FiZap } from 'react-icons/fi'
import { businessAdminI18n, useVintraLanguage } from '@/lib/i18n'
import AdminDropdown from './components/AdminDropdown'
import AdminAnalyticsPanel from './components/AdminAnalyticsPanel'
import AdminChatsPanel from './components/AdminChatsPanel'
import AdminFeedbackPanel from './components/AdminFeedbackPanel'
import AdminUserManagementPanel from './components/AdminUserManagementPanel'
import AdminTasksPanel from './components/AdminTasksPanel'
import WidgetAdminPanel from './widget/page'
import './page.css'

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

export default function AdminPage() {
  const { isAuthenticated, dbUser, business, loading, firebaseUser } = useAuth()
  const router = useRouter()
  const { language } = useVintraLanguage()
  const text = businessAdminI18n[language]
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
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
  const [indicatorStyle, setIndicatorStyle] = useState<{ top: number; height: number } | null>(
    null
  )
  const [tutorialDismissed, setTutorialDismissed] = useState(false)
  const [tutorialActive, setTutorialActive] = useState(false)
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedWidgetKey, setSelectedWidgetKey] = useState('')
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
  const selectedWidget =
    widgetList.find((widget) => widget.widgetKey === selectedWidgetKey) ||
    widgetList.find((widget) => widget.widgetKey === business?.activeChatWidgetKey) ||
    widgetList[0] ||
    null
  const resolvedWidgetKey = selectedWidget?.widgetKey || ''
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
    setTutorialActive(true)
    setTutorialStepIndex(0)
  }

  const closeTutorial = async (persist = false) => {
    setTutorialActive(false)
    setTutorialSpotlight(null)

    if (!persist) {
      return
    }

    await completeTutorial()
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

  const handleSidebarTabClick = (tab: AdminTab) => {
    setActiveTab(tab)

    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches) {
      setSidebarCollapsed(true)
    }
  }

  useEffect(() => {
    if (!widgetList.length) {
      setSelectedWidgetKey('')
      return
    }

    const isValid = widgetList.some((widget) => widget.widgetKey === selectedWidgetKey)
    if (!selectedWidgetKey || !isValid) {
      const fallbackKey =
        widgetList.find((widget) => widget.widgetKey === business?.activeChatWidgetKey)?.widgetKey ||
        widgetList[0]?.widgetKey ||
        ''
      setSelectedWidgetKey(fallbackKey)
    }
  }, [business?.activeChatWidgetKey, selectedWidgetKey, widgetList])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login')
  }, [firebaseUser?.email, isAuthenticated, loading, router])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const isMobile = window.matchMedia('(max-width: 720px)').matches
    document.body.classList.toggle('admin-mobile-sidebar-open', isMobile && !sidebarCollapsed)

    return () => {
      document.body.classList.remove('admin-mobile-sidebar-open')
    }
  }, [sidebarCollapsed])

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const sidebarEl = sidebarRef.current
      const activeButton = tabButtonRefs.current[activeTab]

      if (!sidebarEl || !activeButton) {
        setIndicatorStyle(null)
        return
      }

      const sidebarRect = sidebarEl.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setIndicatorStyle({
        top: buttonRect.top - sidebarRect.top + sidebarEl.scrollTop,
        height: buttonRect.height,
      })
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeTab])

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

  if (loading) return <div>{text.loading}</div>
  if (!isAuthenticated || !dbUser) return null

  return (
    <>
      <main
        className={`adminPage ${tutorialActive ? 'adminPageTutorialMode' : ''} ${
          sidebarCollapsed ? 'adminPageSidebarCollapsed' : ''
        }`}
      >
        <button
          type="button"
          className="adminMobileHeader"
          onClick={() => setSidebarCollapsed((current) => !current)}
          aria-label={sidebarCollapsed ? text.sidebar.expand : text.sidebar.collapse}
          title={sidebarCollapsed ? text.sidebar.expand : text.sidebar.collapse}
        >
          <div className="adminMobileHeaderCopy">
            <span className="adminSidebarEyebrow">{text.sidebar.eyebrow}</span>
            <strong>{text.sidebar.title}</strong>
          </div>
          <span className="adminMobileCollapseToggle" aria-hidden="true">
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </span>
        </button>

        <div className="adminSidebarFollowScreen">
        <aside className={`adminSidebar ${sidebarCollapsed ? 'adminSidebarCollapsed' : ''}`} ref={sidebarRef}>
          <button
            type="button"
            className="adminSidebarCollapseToggle"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? text.sidebar.expand : text.sidebar.collapse}
            title={sidebarCollapsed ? text.sidebar.expand : text.sidebar.collapse}
          >
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
          {indicatorStyle ? (
            <span
              className="adminSidebarIndicator"
              style={{
                top: `${indicatorStyle.top}px`,
                height: `${indicatorStyle.height}px`,
              }}
            />
          ) : null}
          <div className="adminSidebarHeader" ref={adminHeaderRef}>
            <div className="adminSidebarBrand">
              <img className="adminSidebarLogo" src="/image/logo.png" alt="" aria-hidden="true" />
              <div className="adminSidebarBrandCopy">
                <span className="adminSidebarEyebrow">{text.sidebar.eyebrow}</span>
                <h2>{text.sidebar.title}</h2>
              </div>
            </div>
          </div>
          <div className="adminSidebarGroup">
            <div className="adminSidebarGroupLabel">{text.sidebar.general}</div>
            <button
              ref={(node) => {
                tabButtonRefs.current.overview = node
              }}
              onClick={() => handleSidebarTabClick('overview')}
              className={activeTab === 'overview' ? 'sideActive' : ''}
            >
              {text.sidebar.overview}
            </button>
          </div>
          {visibleSupportItems.length > 0 ? (
          <div className="adminSidebarGroup">
            <div className="adminSidebarGroupLabel">{text.sidebar.support}</div>
            {visibleSupportItems.map((item) => (
              <button
                key={item.tab}
                ref={(node) => {
                  tabButtonRefs.current[item.tab] = node
                }}
                onClick={() => handleSidebarTabClick(item.tab)}
                className={activeTab === item.tab ? 'sideActive' : ''}
              >
                {item.label}
              </button>
            ))}
          </div>
          ) : null}

          {visibleFeedbackItems.length > 0 ? (
            <div className="adminSidebarGroup">
              <div className="adminSidebarGroupLabel">{text.sidebar.feedback}</div>
              {visibleFeedbackItems.map((item) => (
            <button
              key={item.tab}
              ref={(node) => {
                tabButtonRefs.current[item.tab] = node
              }}
              onClick={() => handleSidebarTabClick(item.tab)}
              className={activeTab === item.tab ? 'sideActive' : ''}
            >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          {visibleAdminItems.length > 0 ? (
          <div className="adminSidebarGroup">
            <div className="adminSidebarGroupLabel">{text.sidebar.administrative}</div>
            {visibleAdminItems.map((item) => (
              <button
                key={item.tab}
                ref={(node) => {
                  tabButtonRefs.current[item.tab] = node
                }}
                onClick={() => handleSidebarTabClick(item.tab)}
                className={activeTab === item.tab ? 'sideActive' : ''}
              >
                {item.label}
              </button>
            ))}
          </div>
          ) : null}
        </aside>
        </div>

        <section className="adminContent">
          {activeTab === 'overview' && (
            <div className="infoCard">
              <div className="adminOverviewHero">
                <div>
                  <h1>{text.overview.title}</h1>
                  <p>{text.overview.body}</p>
                </div>
                <button
                  type="button"
                  ref={tutorialOrbRef}
                  className="adminTutorialOrb"
                  onClick={openTutorial}
                  aria-label={text.overview.tutorialAria}
                  title={text.overview.tutorialAria}
                >
                  <FiPlay />
                  <span>{text.overview.tutorial}</span>
                </button>
              </div>
              <section className="adminOverviewWidgetSwitch">
                <div className="adminOverviewWidgetSwitchCopy">
                  <span className="adminSidebarEyebrow">{text.overview.widgetScope}</span>
                  <h2>{text.overview.widgetTitle}</h2>
                  <p>{text.overview.widgetBody}</p>
                </div>
                <AdminDropdown
                  value={resolvedWidgetKey}
                  placeholder={text.overview.selectWidget}
                  options={widgetList.map((widget) => ({
                    value: widget.widgetKey,
                    label: widget.name,
                    description: widget.isDefault ? text.overview.defaultWidget : text.overview.customWidget,
                  }))}
                  onChange={(nextValue) => setSelectedWidgetKey(nextValue)}
                  disabled={!widgetList.length}
                />
              </section>
              {showTutorial ? (
                <section className="adminTutorialCard">
                  <div className="adminTutorialHeader">
                    <div>
                      <span className="adminTutorialEyebrow">{text.overview.welcomeTutorial}</span>
                      <h2>{text.overview.learnAreas}</h2>
                      <p>{text.overview.learnBody}</p>
                    </div>
                    <button type="button" className="secondaryBtn" onClick={() => void completeTutorial()}>
                      {text.overview.dismissTutorial}
                    </button>
                  </div>

                  <div className="adminTutorialGrid">
                    <button type="button" className="adminTutorialTile" onClick={() => setActiveTab('chats')}>
                      <strong>{text.sidebar.chats}</strong>
                      <p>{text.overview.chatsTile}</p>
                    </button>
                    <button type="button" className="adminTutorialTile" onClick={() => setActiveTab('tasks')}>
                      <strong>{text.sidebar.tasks}</strong>
                      <p>{text.overview.tasksTile}</p>
                    </button>
                    <button type="button" className="adminTutorialTile" onClick={() => setActiveTab('feedback')}>
                      <strong>{text.sidebar.feedback}</strong>
                      <p>{text.overview.feedbackTile}</p>
                    </button>
                  </div>
                </section>
              ) : null}
              <div className="miniGrid">
                <div className="miniStat">
                  <strong>{dbUser?.displayName || text.overview.fallbackUser}</strong>
                  <span>{text.overview.accountName}</span>
                </div>
                <div className="miniStat">
                  <strong>{dbUser?.email}</strong>
                  <span>{text.overview.email}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div ref={analyticsPanelRef}>
              <AdminAnalyticsPanel selectedWidgetKey={resolvedWidgetKey} />
            </div>
          )}

          {activeTab === 'chats' && (
            <div ref={chatsPanelRef}>
              <AdminChatsPanel
                selectedWidgetKey={resolvedWidgetKey}
                onWidgetSelected={setSelectedWidgetKey}
              />
            </div>
          )}

          {activeTab === 'tasks' && (
            <div ref={tasksPanelRef}>
              <AdminTasksPanel selectedWidgetKey={resolvedWidgetKey} />
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
            <div className="infoCard">
              <h1>{text.websites.title}</h1>
              <p>{text.websites.body}</p>
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
            <div className="infoCard">
              <h1>{text.settings.title}</h1>
              <p>{text.settings.body}</p>
              <div className="settingsToggleRow">
                <p>{text.settings.comingSoon}</p>
              </div>
            </div>
          )}
        </section>

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
              <div className="adminTutorialCoachCard">
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

                <h3>{activeTutorialStep?.title}</h3>
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
