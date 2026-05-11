'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserLanding() {
  const { isAuthenticated, dbUser, loading } = useAuth()
  const { language } = useLanguage()
  const router = useRouter()
  const text = language === 'no'
    ? {
        badge: 'Logget inn',
        title: 'Velkommen tilbake',
        admin: 'Adminpanel',
      }
    : {
        badge: 'Logged in',
        title: 'Welcome back',
        admin: 'Admin Panel',
      }

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) return null
  if (!isAuthenticated) return null

  return (
    <>
      <main className="page">
        <section className="hero">
          <span className="badge success">{text.badge}</span>
          <h1>{text.title}, {dbUser?.displayName}</h1>

          <div className="heroActions">
            <Link href="/admin">
              <button className="primaryBtn">{text.admin}</button>
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
