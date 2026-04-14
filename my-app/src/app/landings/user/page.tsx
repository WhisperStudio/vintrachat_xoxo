'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserLanding() {
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
      <main className="page">
        <section className="hero">
          <span className="badge success">Logged in</span>
          <h1>Velkommen tilbake, {dbUser?.displayName}</h1>

          <div className="heroActions">
            <Link href="/admin">
              <button className="primaryBtn">Admin Panel</button>
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
