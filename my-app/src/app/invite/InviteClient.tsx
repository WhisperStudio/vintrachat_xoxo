'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { acceptInvitation } from '@/lib/invitation.service'
import { useAuth } from '@/context/AuthContext'

export default function InviteClient() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const searchParams = useSearchParams()
  const router = useRouter()
  const { firebaseUser } = useAuth()

  useEffect(() => {
    const handleInvite = async () => {
      const invitationId = searchParams.get('token')
      const businessId = searchParams.get('business')

      if (!invitationId || !businessId) {
        setError('Ugyldig invite link')
        setLoading(false)
        return
      }

      if (!firebaseUser) {
        setError('Du må være logget inn for å akseptere invitasjon')
        setLoading(false)
        return
      }

      try {
        const result = await acceptInvitation(invitationId, businessId, firebaseUser.uid)

        if (result.success) {
          setMessage('Invitasjon akseptert! Omdirigerer...')
          setTimeout(() => {
            router.push('/admin')
          }, 2000)
        } else {
          setError(result.message || 'Kunne ikke akseptere invitasjon')
        }
      } catch {
        setError('En feil oppstod')
      }

      setLoading(false)
    }

    if (firebaseUser) {
      handleInvite()
    } else {
      setLoading(false)
      setError('Du må være logget inn')
    }
  }, [firebaseUser, searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Behandler invitasjon...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {message ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Suksess!</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Feil</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Logg inn
            </button>
          </div>
        )}
      </div>
    </div>
  )
}