'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getBusinessChatAnalytics } from '@/lib/chat.service'
import type { ChatAnalytics } from '@/types/database'
import './admin-components.css'

const emptyAnalytics: ChatAnalytics = {
  totalSessions: 0,
  totalMessages: 0,
  aiOnlySessions: 0,
  supportRequests: 0,
  savedSupportChats: 0,
}

export default function AdminAnalyticsPanel() {
  const { dbUser } = useAuth()
  const [analytics, setAnalytics] = useState<ChatAnalytics>(emptyAnalytics)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadAnalytics() {
      if (!dbUser?.businessId) return

      const data = await getBusinessChatAnalytics(dbUser.businessId)

      if (!mounted) return

      setAnalytics(data || emptyAnalytics)
      setLoading(false)
    }

    loadAnalytics()

    return () => {
      mounted = false
    }
  }, [dbUser?.businessId])

  if (loading) {
    return (
      <div className="infoCard">
        <h1>Analytics</h1>
        <p>Loading chat analytics...</p>
      </div>
    )
  }

  return (
    <div className="infoCard adminDataCard">
      <h1>Analytics</h1>
      <p>Chat totals are updated from the live widget and support escalations.</p>

      <div className="adminStatsGrid">
        <div className="adminStatCard">
          <strong>{analytics.totalSessions}</strong>
          <span>Total chat sessions</span>
        </div>
        <div className="adminStatCard">
          <strong>{analytics.totalMessages}</strong>
          <span>Total user messages</span>
        </div>
        <div className="adminStatCard">
          <strong>{analytics.aiOnlySessions}</strong>
          <span>AI-only sessions</span>
        </div>
        <div className="adminStatCard">
          <strong>{analytics.supportRequests}</strong>
          <span>Support requests</span>
        </div>
        <div className="adminStatCard">
          <strong>{analytics.savedSupportChats}</strong>
          <span>Saved support chats</span>
        </div>
        <div className="adminStatCard">
          <strong>
            {analytics.lastChatAt
              ? new Date(analytics.lastChatAt).toLocaleString()
              : 'No chats yet'}
          </strong>
          <span>Latest chat activity</span>
        </div>
      </div>
    </div>
  )
}
