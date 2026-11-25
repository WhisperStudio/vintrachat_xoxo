'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { refreshVerificationSession } from '@/lib/verification-session.mjs'
import { withTimeout } from '@/lib/with-timeout'

/** Refresh both Firebase claims and the workspace provider before navigating. */
export function useVerifiedAccount(enabled: boolean, expectedUid?: string, expectedEmail?: string) {
  const router = useRouter()
  const { firebaseUser, dbUser, loading, error, refreshCurrentUser } = useAuth()
  const [readyUid, setReadyUid] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const busy = useRef(false)
  const check = useCallback(async () => {
    if (busy.current) return false
    busy.current = true
    setChecking(true)
    try {
      await withTimeout(auth.authStateReady(), 12000, 'Session timeout')
      const user = auth.currentUser
      if (!user || (expectedEmail && user.email?.toLowerCase() !== expectedEmail.toLowerCase())) return false
      const ready = await withTimeout(refreshVerificationSession(auth, expectedUid), 12000, 'Session timeout')
      if (!ready) return false
      await refreshCurrentUser()
      if (auth.currentUser?.uid === user.uid) setReadyUid(user.uid)
      return true
    } catch {
      return false
    } finally {
      busy.current = false
      setChecking(false)
    }
  }, [expectedUid, expectedEmail, refreshCurrentUser])

  useEffect(() => {
    if (!enabled) return
    const refresh = () => { if (document.visibilityState === 'visible') void check() }
    refresh()
    const interval = setInterval(refresh, 5000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [enabled, check])

  useEffect(() => {
    const matchesLink = !expectedUid || expectedUid === readyUid
    const matchesEmail = !expectedEmail || firebaseUser?.email?.toLowerCase() === expectedEmail.toLowerCase()
    if (enabled && matchesLink && matchesEmail && readyUid && firebaseUser?.uid === readyUid && firebaseUser.emailVerified && !loading && !error) {
      router.replace(dbUser?.businessId ? '/admin' : '/invite')
    }
  }, [enabled, readyUid, firebaseUser, loading, error, dbUser?.businessId, router, expectedUid, expectedEmail])

  return { check, checking }
}
