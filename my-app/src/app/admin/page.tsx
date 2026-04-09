'use client'

import Header from '@/components/header'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import AdminAnalyticsPanel from './components/AdminAnalyticsPanel'
import AdminChatsPanel from './components/AdminChatsPanel'
import AdminExportTestPanel from './components/AdminExportTestPanel'
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
  | 'export-test'
  | 'settings'

export default function AdminPage() {
  const { isAuthenticated, dbUser, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const sidebarRef = useRef<HTMLElement | null>(null)
  const tabButtonRefs = useRef<Partial<Record<AdminTab, HTMLButtonElement | null>>>({})
  const [indicatorStyle, setIndicatorStyle] = useState<{ top: number; height: number } | null>(
    null
  )

  const supportItems: Array<{ tab: AdminTab; label: string }> = [
    { tab: 'chats', label: 'Chats' },
    { tab: 'tasks', label: 'Tasks' },
    { tab: 'export-test', label: 'Export Test' },
  ]

  const adminItems: Array<{ tab: AdminTab; label: string }> = [
    { tab: 'analytics', label: 'Analytics' },
    { tab: 'users', label: 'User Management' },
    { tab: 'widgets', label: 'Chat Widgets' },
    { tab: 'websites', label: 'Websites' },
    { tab: 'settings', label: 'Settings' },
  ]

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, loading, router])

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

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated || !dbUser) return null

  return (
    <>
      <Header />
      <main className="adminPage">
        <aside className="adminSidebar" ref={sidebarRef}>
          {indicatorStyle ? (
            <span
              className="adminSidebarIndicator"
              style={{
                top: `${indicatorStyle.top}px`,
                height: `${indicatorStyle.height}px`,
              }}
            />
          ) : null}
          <div className="adminSidebarHeader">
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
          <div className="adminSidebarGroup">
            <div className="adminSidebarGroupLabel">Support</div>
            {supportItems.map((item) => (
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

          <div className="adminSidebarGroup">
            <div className="adminSidebarGroupLabel">Administrative</div>
            {adminItems.map((item) => (
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
        </aside>

        <section className="adminContent">
          {activeTab === 'overview' && (
            <div className="infoCard">
              <h1>Overview</h1>
              <p>Here you get a quick overview of your account and company setup.</p>
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

          {activeTab === 'analytics' && <AdminAnalyticsPanel />}

          {activeTab === 'chats' && <AdminChatsPanel />}

          {activeTab === 'tasks' && <AdminTasksPanel />}

          {activeTab === 'users' && (
            <div className="infoCard">
              <h1>User Management</h1>
              <p>Manage roles, access, and team collaboration here.</p>
            </div>
          )}

          {activeTab === 'websites' && (
            <div className="infoCard">
              <h1>Website Administration</h1>
              <p>Manage websites, drafts, and publishing here.</p>
            </div>
          )}

          {activeTab === 'widgets' && <WidgetAdminPanel />}

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
      </main>
    </>
  )
}
