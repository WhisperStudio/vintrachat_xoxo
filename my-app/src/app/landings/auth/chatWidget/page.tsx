'use client'

import Header from '@/components/header'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthChatWidget() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) router.push('/auth/login')
  }, [isLoggedIn, router])

  if (!isLoggedIn) return null

  return (
    <>
      <Header />
      <main className="page narrow">
        <div className="infoCard">
          <h1>Your Chat Widgets</h1>
          <p>Administrer dine widget-produkter, oppsett og senere kundedata.</p>
        </div>

        <div className="infoCard">
          <h2>Access</h2>
          <p>
            Produkt aktivt:{' '}
            <strong>{user?.purchases.chatWidget ? 'Ja' : 'Nei'}</strong>
          </p>
        </div>

        <div className="infoCard">
          <h2>What you can do</h2>
          <ul className="cleanList">
            <li>Se widget-oppsett</li>
            <li>Forberede customization</li>
            <li>Bygge videre på admin og chatflyt</li>
          </ul>
        </div>
      </main>
    </>
  )
}