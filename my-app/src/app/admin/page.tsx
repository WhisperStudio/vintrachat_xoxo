'use client'

import Header from '@/components/header'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminAnalyticsPanel from './components/AdminAnalyticsPanel'
import AdminChatsPanel from './components/AdminChatsPanel'
import WidgetAdminPanel from './widget/page'

type AdminTab =
  | 'overview'
  | 'analytics'
  | 'chats'
  | 'users'
  | 'websites'
  | 'widgets'
  | 'settings'

export default function AdminPage() {
  const { isAuthenticated, dbUser, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, loading, router])

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated || !dbUser) return null

  return (
    <>
      <Header />
      <main className="adminPage">
        <aside className="adminSidebar">
          <h2>Admin Panel</h2>

          <button
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? 'sideActive' : ''}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'sideActive' : ''}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={activeTab === 'chats' ? 'sideActive' : ''}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={activeTab === 'users' ? 'sideActive' : ''}
          >
            User Management
          </button>

          <button
            onClick={() => setActiveTab('websites')}
            className={activeTab === 'websites' ? 'sideActive' : ''}
          >
            Websites
          </button>

          <button
            onClick={() => setActiveTab('widgets')}
            className={activeTab === 'widgets' ? 'sideActive' : ''}
          >
            Chat Widgets
          </button>

          <div className="sidebarBottom">
            <button
              onClick={() => setActiveTab('settings')}
              className={activeTab === 'settings' ? 'sideActive' : ''}
            >
              Settings
            </button>
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
