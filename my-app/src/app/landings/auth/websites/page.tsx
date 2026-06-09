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
          <h1>This page is currently under development</h1>
          <p>Contact us for more information. support@vintrachat.com or use our chatbot.</p>
        </div>
      </main>
    </>
  )
}
