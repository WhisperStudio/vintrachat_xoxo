'use client'

import Header from '@/components/header'
import { useAuth } from '@/components/auth-provider'
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
  const { isLoggedIn, user, updatePurchases } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  useEffect(() => {
    if (!isLoggedIn) router.push('/auth/login')
  }, [isLoggedIn, router])

  if (!isLoggedIn || !user) return null

  const unlocked = {
    websites: user.purchases.websites,
    widgets: user.purchases.chatWidget,
  }

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
            onClick={() => unlocked.websites && setActiveTab('websites')}
            className={!unlocked.websites ? 'sideLocked' : activeTab === 'websites' ? 'sideActive' : ''}
          >
            Websites {!unlocked.websites && '(Locked)'}
          </button>

          <button
            onClick={() => unlocked.widgets && setActiveTab('widgets')}
            className={!unlocked.widgets ? 'sideLocked' : activeTab === 'widgets' ? 'sideActive' : ''}
          >
            Chat Widgets {!unlocked.widgets && '(Locked)'}
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
                  <strong>{user.purchases.websites ? 'Active' : 'Inactive'}</strong>
                  <span>Website Product</span>
                </div>
                <div className="miniStat">
                  <strong>{user.purchases.chatWidget ? 'Active' : 'Inactive'}</strong>
                  <span>Chat Widget Product</span>
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
              <p>Midletidig lokal demo for kjøp/access.</p>

              <div className="settingsToggleRow">
                <label>
                  <input
                    type="checkbox"
                    checked={user.purchases.websites}
                    onChange={(e) =>
                      updatePurchases({
                        ...user.purchases,
                        websites: e.target.checked,
                      })
                    }
                  />
                  Unlock Websites
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={user.purchases.chatWidget}
                    onChange={(e) =>
                      updatePurchases({
                        ...user.purchases,
                        chatWidget: e.target.checked,
                      })
                    }
                  />
                  Unlock Chat Widget
                </label>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  )
}