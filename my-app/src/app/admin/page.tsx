'use client'

import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiPlay, FiZap } from 'react-icons/fi'
import AdminAnalyticsPanel from './components/AdminAnalyticsPanel'
import AdminChatsPanel from './components/AdminChatsPanel'
import AdminFeedbackPanel from './components/AdminFeedbackPanel'
import AdminExportTestPanel from './components/AdminExportTestPanel'
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
  | 'export-test'
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
  const [tutorialSpotlight, setTutorialSpotlight] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const supportItems: Array<{ tab: AdminTab; label: string }> = [
    { tab: 'chats', label: 'Chats' },
    { tab: 'tasks', label: 'Tasks' },
    { tab: 'export-test', label: 'Export Test' },
  ]

  const feedbackItems: Array<{ tab: AdminTab; label: string }> = [
    { tab: 'feedback', label: 'Feedback' },
  ]

  const adminItems: Array<{ tab: AdminTab; label: string }> = [
    { tab: 'analytics', label: 'Analytics' },
    { tab: 'users', label: 'User Management' },
    { tab: 'widgets', label: 'Chat Widgets' },
    { tab: 'websites', label: 'Websites' },
    { tab: 'settings', label: 'Settings' },
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
      'export-test',
    ]
  }, [dbUser])
  const visibleSupportItems = supportItems.filter((item) => visibleTabs.includes(item.tab))
  const visibleFeedbackItems = feedbackItems.filter((item) => visibleTabs.includes(item.tab))
  const visibleAdminItems = adminItems.filter((item) => visibleTabs.includes(item.tab))
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
        title: 'Top navigation',
        description:
          'This is your main header navigation. If you want to edit the widget itself, open My Chat Widgets from here.',
        targetRef: () =>
          document.querySelector<HTMLElement>('[data-vintra-main-nav]') || adminHeaderRef.current,
        ctaLabel: 'Open My Chat Widgets',
        ctaHref: '/landings/auth/chatWidget',
      },
      {
        id: 'panel-header',
        title: 'Admin Panel',
        description:
          'This is the control center for the business. From here you manage support, feedback, analytics, users, and widgets.',
        targetRef: () => adminHeaderRef.current,
      },
      {
        id: 'chats',
        title: 'Chats',
        description:
          'Here you can see live visitor conversations, step into support threads, and reply as a human when needed.',
        tab: 'chats',
        targetRef: () => chatsPanelRef.current,
      },
      {
        id: 'tasks',
        title: 'Tasks',
        description:
          'Tasks turn important chat follow-ups into action items with categories, priorities, and notes.',
        tab: 'tasks',
        targetRef: () => tasksPanelRef.current,
      },
      {
        id: 'feedback',
        title: 'Feedback',
        description:
          'Feedback collects star ratings and written comments from customers, with an average score at the top.',
        tab: 'feedback',
        targetRef: () => feedbackPanelRef.current,
      },
      {
        id: 'analytics',
        title: 'Analytics',
        description:
          'Analytics gives you the bigger picture, like traffic, chat volume, and support activity trends.',
        tab: 'analytics',
        targetRef: () => analyticsPanelRef.current,
      },
      {
        id: 'users',
        title: 'User Management',
        description:
          'User management is where you control access, roles, and who can see what in the business account.',
        tab: 'users',
        targetRef: () => usersPanelRef.current,
      },
      {
        id: 'widgets',
        title: 'Chat Widgets',
        description:
          'This is where you adjust the widget appearance, branding, and launch behavior.',
        tab: 'widgets',
        targetRef: () => widgetsPanelRef.current,
      },
    ],
    []
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

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login')
  }, [firebaseUser?.email, isAuthenticated, loading, router])

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

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated || !dbUser) return null

  return (
    <>
      <main
        className={`adminPage ${tutorialActive ? 'adminPageTutorialMode' : ''} ${
          sidebarCollapsed ? 'adminPageSidebarCollapsed' : ''
        }`}
      >
        <aside className={`adminSidebar ${sidebarCollapsed ? 'adminSidebarCollapsed' : ''}`} ref={sidebarRef}>
          <button
            type="button"
            className="adminSidebarCollapseToggle"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
            <span className="adminSidebarEyebrow">Control Center</span>
            <h2>Admin Panel</h2>
          </div>
          <div className="adminSidebarGroup">
            <div className="adminSidebarGroupLabel">General</div>
            <button
              ref={(node) => {
                tabButtonRefs.current.overview = node
              }}
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'sideActive' : ''}
            >
              Overview
            </button>
          </div>
          {visibleSupportItems.length > 0 ? (
          <div className="adminSidebarGroup">
            <div className="adminSidebarGroupLabel">Support</div>
            {visibleSupportItems.map((item) => (
              <button
                key={item.tab}
                ref={(node) => {
                  tabButtonRefs.current[item.tab] = node
                }}
                onClick={() => setActiveTab(item.tab)}
                className={activeTab === item.tab ? 'sideActive' : ''}
              >
                {item.label}
              </button>
            ))}
          </div>
          ) : null}

          {visibleFeedbackItems.length > 0 ? (
            <div className="adminSidebarGroup">
              <div className="adminSidebarGroupLabel">Feedback</div>
              {visibleFeedbackItems.map((item) => (
                <button
                  key={item.tab}
                  ref={(node) => {
                    tabButtonRefs.current[item.tab] = node
                  }}
                  onClick={() => setActiveTab(item.tab)}
                  className={activeTab === item.tab ? 'sideActive' : ''}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          {visibleAdminItems.length > 0 ? (
          <div className="adminSidebarGroup">
            <div className="adminSidebarGroupLabel">Administrative</div>
            {visibleAdminItems.map((item) => (
              <button
                key={item.tab}
                ref={(node) => {
                  tabButtonRefs.current[item.tab] = node
                }}
                onClick={() => setActiveTab(item.tab)}
                className={activeTab === item.tab ? 'sideActive' : ''}
              >
                {item.label}
              </button>
            ))}
          </div>
          ) : null}
        </aside>

        <section className="adminContent">
          {activeTab === 'overview' && (
            <div className="infoCard">
              <div className="adminOverviewHero">
                <div>
                  <h1>Overview</h1>
                  <p>Here you get a quick overview of your account and company setup.</p>
                </div>
                <button
                  type="button"
                  ref={tutorialOrbRef}
                  className="adminTutorialOrb"
                  onClick={openTutorial}
                  aria-label="Start tutorial"
                  title="Start tutorial"
                >
                  <FiPlay />
                  <span>Tutorial</span>
                </button>
              </div>
              {showTutorial ? (
                <section className="adminTutorialCard">
                  <div className="adminTutorialHeader">
                    <div>
                      <span className="adminTutorialEyebrow">Welcome tutorial</span>
                      <h2>Learn the three main work areas</h2>
                      <p>
                        Chats show live visitor conversations, tasks help your team follow up, and
                        feedback collects star ratings plus comments from customers.
                      </p>
                    </div>
                    <button type="button" className="secondaryBtn" onClick={() => void completeTutorial()}>
                      Dismiss tutorial
                    </button>
                  </div>

                  <div className="adminTutorialGrid">
                    <button type="button" className="adminTutorialTile" onClick={() => setActiveTab('chats')}>
                      <strong>Chats</strong>
                      <p>See every live support request, jump into the transcript, and return chats to AI.</p>
                    </button>
                    <button type="button" className="adminTutorialTile" onClick={() => setActiveTab('tasks')}>
                      <strong>Tasks</strong>
                      <p>Turn chat follow-ups into work items with categories, priority, and internal notes.</p>
                    </button>
                    <button type="button" className="adminTutorialTile" onClick={() => setActiveTab('feedback')}>
                      <strong>Feedback</strong>
                      <p>Review customer ratings and comments, with the average star score shown at the top.</p>
                    </button>
                  </div>
                </section>
              ) : null}
              <div className="miniGrid">
                <div className="miniStat">
                  <strong>{dbUser?.displayName || 'User'}</strong>
                  <span>Account Name</span>
                </div>
                <div className="miniStat">
                  <strong>{dbUser?.email}</strong>
                  <span>Email</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div ref={analyticsPanelRef}>
              <AdminAnalyticsPanel />
            </div>
          )}

          {activeTab === 'chats' && (
            <div ref={chatsPanelRef}>
              <AdminChatsPanel />
            </div>
          )}

          {activeTab === 'tasks' && (
            <div ref={tasksPanelRef}>
              <AdminTasksPanel />
            </div>
          )}

          {activeTab === 'feedback' && (
            <div ref={feedbackPanelRef}>
              <AdminFeedbackPanel />
            </div>
          )}

          {activeTab === 'users' && (
            <div ref={usersPanelRef}>
              <AdminUserManagementPanel />
            </div>
          )}

          {activeTab === 'websites' && (
            <div className="infoCard">
              <h1>Website Administration</h1>
              <p>Manage websites, drafts, and publishing here.</p>
            </div>
          )}

          {activeTab === 'widgets' && (
            <div ref={widgetsPanelRef}>
              <WidgetAdminPanel />
            </div>
          )}

          {activeTab === 'export-test' && <AdminExportTestPanel />}

          {activeTab === 'settings' && (
            <div className="infoCard">
              <h1>Settings</h1>
              <p>Account-level settings can be expanded here later.</p>
              <div className="settingsToggleRow">
                <p>More settings coming soon...</p>
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
                    Step {tutorialStepIndex + 1} of {tutorialSteps.length}
                  </span>
                  <button
                    type="button"
                    className="adminTutorialCoachSkip"
                    onClick={() => void closeTutorial(true)}
                  >
                    Finish
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
                    {activeTutorialStep.ctaLabel || 'Open My Chat Widgets'}
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
                    Back
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
                    {tutorialStepIndex >= tutorialMaxStepIndex ? 'Finish' : 'Next'}
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
