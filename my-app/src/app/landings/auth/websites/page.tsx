'use client'

import Header from '@/components/header'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthWebsites() {
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
          <h1>Your Websites</h1>
          <p>Her ser du nettsider og nettsted-relatert innhold knyttet til brukeren din.</p>
        </div>

        <div className="infoCard">
          <h2>Access</h2>
          <p>
            Produkt aktivt:{' '}
            <strong>{user?.purchases.websites ? 'Ja' : 'Nei'}</strong>
          </p>
        </div>

        <div className="infoCard">
          <h2>What you can do</h2>
          <ul className="cleanList">
            <li>Se prosjektoversikt</li>
            <li>Forberede publisering</li>
            <li>Administrere innhold senere</li>
          </ul>
        </div>
      </main>
    </>
  )
}