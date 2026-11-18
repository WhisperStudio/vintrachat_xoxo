'use client'

import WebsiteConstructionCover from '@/components/WebsiteConstructionCover'
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

  return <WebsiteConstructionCover />
}
