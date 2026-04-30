'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiStar, FiMessageSquare, FiUser } from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { getBusinessFeedback } from '@/lib/chat.service'
import type { BusinessFeedback } from '@/types/database'
import './admin-components.css'

function formatDate(value?: Date) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function StarRow({ rating }: { rating: number }) {
  const stars = Array.from({ length: 5 }, (_, index) => index < Math.round(rating))

  return (
    <div className="adminFeedbackStars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {stars.map((filled, index) => (
        <FiStar key={index} className={filled ? 'adminFeedbackStarFilled' : 'adminFeedbackStar'} />
      ))}
    </div>
  )
}

export default function AdminFeedbackPanel() {
  const { dbUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<BusinessFeedback[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!dbUser?.businessId) return

      const entries = await getBusinessFeedback(dbUser.businessId)

      if (!mounted) return

      setFeedback(entries)
      setLoading(false)
    }

    void load()

    const interval = window.setInterval(() => {
      void load()
    }, 5000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [dbUser?.businessId])

  const summary = useMemo(() => {
    const count = feedback.length
    const average = count
      ? feedback.reduce((total, item) => total + Number(item.rating || 0), 0) / count
      : 0

    return {
      count,
      average,
    }
  }, [feedback])

  if (loading) {
    return (
      <div className="infoCard adminDataCard">
        <h1>Feedback</h1>
        <p>Loading feedback...</p>
      </div>
    )
  }

  return (
    <div className="infoCard adminDataCard adminFeedbackPanel">
      <div className="adminSectionHeader">
        <div>
          <h1>Feedback</h1>
          <p>Collect customer feedback and track how people rate the experience.</p>
        </div>
      </div>

      <section className="adminFeedbackSummary">
        <div className="adminFeedbackSummaryScore">
          <strong>{summary.average ? summary.average.toFixed(1) : '0.0'}</strong>
          <span>Average rating</span>
        </div>
        <div className="adminFeedbackSummaryMeta">
          <div>
            <FiStar />
            <strong>{summary.count}</strong>
            <span>Total feedback entries</span>
          </div>
          <div>
            <FiMessageSquare />
            <strong>{summary.count ? `${Math.round((summary.average / 5) * 100)}%` : '0%'}</strong>
            <span>Positive sentiment</span>
          </div>
        </div>
      </section>

      <div className="adminFeedbackList">
        {feedback.length === 0 ? (
          <p className="adminFeedbackEmpty">No feedback has been submitted yet.</p>
        ) : (
          feedback.map((entry) => (
            <article key={entry.id} className="adminFeedbackCard">
              <div className="adminFeedbackCardTop">
                <div>
                  <strong>{entry.visitorName || 'Anonymous visitor'}</strong>
                  <span>{formatDate(entry.createdAt)}</span>
                </div>
                <StarRow rating={entry.rating} />
              </div>
              <p>{entry.text}</p>
              <div className="adminFeedbackCardMeta">
                <span>
                  <FiUser /> {entry.pageTitle || 'Website'}
                </span>
                <span>{entry.countryCode || 'XX'}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
