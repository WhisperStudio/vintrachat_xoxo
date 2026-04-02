'use client'

import Header from '@/components/header'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

          <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'sideActive' : ''}>
            Overview
          </button>
          <button onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'sideActive' : ''}>
            Analytics
          </button>
          <button onClick={() => setActiveTab('chats')} className={activeTab === 'chats' ? 'sideActive' : ''}>
            Chats
          </button>
          <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'sideActive' : ''}>
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
            <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'sideActive' : ''}>
              Settings
            </button>
          </div>
        </aside>

        <section className="adminContent">
          {activeTab === 'overview' && (
            <div className="infoCard">
              <h1>Overview</h1>
              <p>Her får du en rask oversikt over konto, produkter og status.</p>
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
            <div className="infoCard">
              <h1>Analytics</h1>
              <p>Her kan du senere legge inn besøksdata, samtaler og konverteringer.</p>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="infoCard">
              <h1>Chats</h1>
              <p>Dette området kan senere vise kundedialoger, live chats og support-tråder.</p>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="infoCard">
              <h1>User Management</h1>
              <p>Her kan du senere styre roller, tilgang og samarbeid.</p>
            </div>
          )}

          {activeTab === 'websites' && (
            <div className="infoCard">
              <h1>Website Administration</h1>
              <p>Administrer websites, utkast og publisering her.</p>
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="infoCard">
              <h1>Chat Widget Administration</h1>
              <p>Administrer widget-oppsett, farger, plassering og integrasjoner.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="infoCard">
              <h1>Settings</h1>
              <p>Administrer kontoinnstillinger og preferanser her.</p>
              <div className="settingsToggleRow">
                <p>Innstillinger kommer snart...</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  )
}