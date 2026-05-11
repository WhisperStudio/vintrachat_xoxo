'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiStar, FiMessageSquare, FiUser } from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { getBusinessFeedback } from '@/lib/chat.service'
import { adminFeedbackI18n, useVintraLanguage } from '@/lib/i18n'
import type { BusinessFeedback } from '@/types/database'
import './admin-components.css'

function formatDate(value: Date | undefined, unknownLabel: string) {
  if (!value) return unknownLabel
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function StarRow({ rating, ariaLabel }: { rating: number; ariaLabel: string })
{
  const stars = Array.from({ length: 5 }, (_, index) => index < Math.round(rating))

  return (
    <div className="adminFeedbackStars" aria-label={ariaLabel}>
      {stars.map((filled, index) => (
        <FiStar key={index} className={filled ? 'adminFeedbackStarFilled' : 'adminFeedbackStar'} />
      ))}
    </div>
  )
}

export default function AdminFeedbackPanel({ selectedWidgetKey = '' }: { selectedWidgetKey?: string }) {
  const { dbUser } = useAuth()
  const { language } = useVintraLanguage()
  const text = adminFeedbackI18n[language]
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

  const visibleFeedback = useMemo(
    () => (selectedWidgetKey ? feedback.filter((entry) => entry.widgetKey === selectedWidgetKey) : feedback),
    [feedback, selectedWidgetKey]
  )

  const summary = useMemo(() => {
    const count = visibleFeedback.length
    const average = count
      ? visibleFeedback.reduce((total, item) => total + Number(item.rating || 0), 0) / count
      : 0

    return {
      count,
      average,
    }
  }, [visibleFeedback])

  if (loading) {
    return (
      <div className="infoCard adminDataCard">
        <h1>{text.title}</h1>
        <p>{text.loading}</p>
      </div>
    )
  }

  return (
    <div className="infoCard adminDataCard adminFeedbackPanel">
      <div className="adminSectionHeader">
        <div>
          <h1>{text.title}</h1>
          <p>{text.body}</p>
          {selectedWidgetKey ? (
            <p className="adminDataHint">
              {text.showingWidget} <strong>{selectedWidgetKey}</strong>.
            </p>
          ) : null}
        </div>
      </div>

      <section className="adminFeedbackSummary">
        <div className="adminFeedbackSummaryScore">
          <strong>{summary.average ? summary.average.toFixed(1) : '0.0'}</strong>
          <span>{text.averageRating}</span>
        </div>
        <div className="adminFeedbackSummaryMeta">
          <div>
            <FiStar />
            <strong>{summary.count}</strong>
            <span>{text.totalEntries}</span>
          </div>
          <div>
            <FiMessageSquare />
            <strong>{summary.count ? `${Math.round((summary.average / 5) * 100)}%` : '0%'}</strong>
            <span>{text.positiveSentiment}</span>
          </div>
        </div>
      </section>

      <div className="adminFeedbackList">
        {visibleFeedback.length === 0 ? (
          <p className="adminFeedbackEmpty">{text.empty}</p>
        ) : (
          visibleFeedback.map((entry) => (
            <article key={entry.id} className="adminFeedbackCard">
              <div className="adminFeedbackCardTop">
                <div>
                  <strong>{entry.visitorName || text.anonymousVisitor}</strong>
                  <span>{formatDate(entry.createdAt, text.unknown)}</span>
                </div>
                <StarRow rating={entry.rating} ariaLabel={text.stars(entry.rating.toFixed(1))} />
              </div>
              <p>{entry.text}</p>
              <div className="adminFeedbackCardMeta">
                <span>
                  <FiUser /> {entry.pageTitle || text.website}
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
