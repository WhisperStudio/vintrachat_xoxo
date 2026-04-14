'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthChatWidget() {
  const { isAuthenticated, dbUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) return null
  if (!isAuthenticated) return null

  return (
    <>
      <main className="page narrow">
        <div className="infoCard">
          <h1>Your Chat Widgets</h1>
          <p>Administrer dine widget-produkter.</p>
        </div>

        <div className="infoCard">
          <h2>Access</h2>
          <p>
            Produkt aktivt:{' '}
            <strong>{dbUser ? 'Ja' : 'Nei'}</strong>
          </p>
        </div>
      </main>
    </>
  )
}
