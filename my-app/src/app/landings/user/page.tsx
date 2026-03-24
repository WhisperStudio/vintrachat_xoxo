'use client'

import Header from '@/components/header'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserLanding() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn) return null

  return (
    <>
      <Header />
      <main className="page">
        <section className="hero">
          <span className="badge success">Logged in</span>
          <h1>Velkommen tilbake, {user?.name}</h1>
          <p>
            Her ser du dine produkter, snarveier og administrasjon. Alt er satt opp
            så du lett kan bygge videre senere.
          </p>

          <div className="heroActions">
            <Link href="/admin">
              <button className="primaryBtn">Go to Admin Panel</button>
            </Link>
            <Link href="/landings/auth/websites">
              <button className="secondaryBtn">My Products</button>
            </Link>
          </div>
        </section>

        <section className="cardGrid">
          <div className="featureCard">
            <h2>Your Websites</h2>
            <p>Se og administrer nettsider du har tilgang til.</p>
            <Link href="/landings/auth/websites">
              <button className="secondaryBtn">Open websites</button>
            </Link>
          </div>

          <div className="featureCard">
            <h2>Your Chat Widgets</h2>
            <p>Se og administrer widgets, innstillinger og visninger.</p>
            <Link href="/landings/auth/chat-widget">
              <button className="primaryBtn">Open widgets</button>
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}