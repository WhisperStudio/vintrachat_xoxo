'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FiArrowRight, FiBarChart2, FiClock, FiMessageCircle, FiRefreshCw, FiShield, FiTrendingUp, FiUsers } from 'react-icons/fi'

import { useAuth } from '@/context/AuthContext'
import { userDashboardI18n, useVintraLanguage } from '@/lib/i18n'
import './page.css'

type TimelinePoint = {
  label: string
  value: number
  date: Date
}

type DashboardAnalytics = {
  dailyConversationCounts?: Record<string, number>
  timeline?: Array<{
    id: string
    kind: string
    sessionId: string
    createdAt: Date
  }>
  countryCounts?: Record<string, number>
  totalSessions?: number
  totalMessages?: number
  supportRequests?: number
  savedSupportChats?: number
  lastChatAt?: Date
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatDate(date: Date | undefined, locale: string) {
  if (!date) return ''

  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getRoleLabel(role: string | undefined, text: (typeof userDashboardI18n)[keyof typeof userDashboardI18n]) {
  if (!role) return text.roleLabels.user

  return text.roleLabels[role as keyof typeof text.roleLabels] || text.roleLabels.user
}

function buildWeekSeries(analytics: DashboardAnalytics | null | undefined, locale: string) {
  const today = new Date()
  const points: TimelinePoint[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)

    const label = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
    }).format(date)

    points.push({
      label,
      value: Number(analytics?.dailyConversationCounts?.[getDateKey(date)] || 0),
      date,
    })
  }

  const total = points.reduce((sum, point) => sum + point.value, 0)
  const average = points.length ? total / points.length : 0
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0] || { label: '', value: 0, date: today })

  return {
    points,
    total,
    average,
    peak,
  }
}

export default function UserLanding() {
  const { isAuthenticated, dbUser, business, loading } = useAuth()
  const { language } = useVintraLanguage()
  const router = useRouter()
  const text = userDashboardI18n[language]
  const locale = language === 'no' ? 'no-NO' : 'en-US'

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  const dashboard = useMemo(() => {
    const analytics = business?.chatAnalytics
    const week = buildWeekSeries(analytics, locale)
    const recentEvents = [...(analytics?.timeline || [])]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)

    const topCountry = Object.entries(analytics?.countryCounts || {})
      .sort(([, left], [, right]) => right - left)
      .at(0)

    const activeWidget =
      business?.chatWidgets?.find((widget) => widget.widgetKey === business.activeChatWidgetKey) ||
      business?.chatWidgets?.[0] ||
      null

    const accountName =
      dbUser?.displayName?.trim() ||
      dbUser?.email?.split('@')[0] ||
      text.unknown

    return {
      accountName,
      workspaceName: business?.name || text.unknown,
      roleLabel: getRoleLabel(dbUser?.role, text),
      totalSessions: analytics?.totalSessions || 0,
      totalMessages: analytics?.totalMessages || 0,
      supportRequests: analytics?.supportRequests || 0,
      savedChats: analytics?.savedSupportChats || 0,
      lastChatAt: analytics?.lastChatAt,
      topCountry: topCountry ? `${topCountry[0].toUpperCase()}${topCountry[0].slice(1)} (${topCountry[1]})` : text.unknown,
      activeWidgetName: activeWidget?.name || text.unknown,
      week,
      recentEvents,
    }
  }, [business, dbUser?.displayName, dbUser?.email, dbUser?.role, locale, text])

  if (loading) {
    return (
      <main className="page userDashboardPage">
        <div className="infoCard userDashboardLoading">{text.loading}</div>
      </main>
    )
  }

  if (!isAuthenticated || !dbUser) return null

  return (
    <main className="page userDashboardPage">
      <section className="userDashboardHero">
        <div className="userDashboardHeroCopy">
          <span className="userDashboardEyebrow">{text.eyebrow}</span>
          <h1>
            {text.title}, {dashboard.accountName}
          </h1>
          <p>{text.subtitle}</p>

          <div className="userDashboardMetaRow">
            <span className="userDashboardMetaPill">
              <FiShield />
              {dashboard.roleLabel}
            </span>
            <span className="userDashboardMetaPill">
              <FiUsers />
              {dashboard.workspaceName}
            </span>
            <span className="userDashboardMetaPill">
              <FiClock />
              {dashboard.lastChatAt ? formatDate(dashboard.lastChatAt, locale) : text.unknown}
            </span>
          </div>
        </div>

        <div className="userDashboardHeroPanel infoCard">
          <span className="userDashboardPanelLabel">{text.startAnalytics}</span>
          <strong>{dashboard.totalSessions}</strong>
          <p>{text.weekTotal}</p>
          <div className="userDashboardHeroPanelRows">
            <div>
              <span>{text.topCountry}</span>
              <strong>{dashboard.topCountry}</strong>
            </div>
            <div>
              <span>{text.activeWidget}</span>
              <strong>{dashboard.activeWidgetName}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="userDashboardStats">
        <article className="userDashboardStatCard">
          <FiBarChart2 />
          <div>
            <span>{text.totalSessions}</span>
            <strong>{dashboard.totalSessions}</strong>
          </div>
        </article>
        <article className="userDashboardStatCard">
          <FiMessageCircle />
          <div>
            <span>{text.totalMessages}</span>
            <strong>{dashboard.totalMessages}</strong>
          </div>
        </article>
        <article className="userDashboardStatCard">
          <FiTrendingUp />
          <div>
            <span>{text.supportRequests}</span>
            <strong>{dashboard.supportRequests}</strong>
          </div>
        </article>
        <article className="userDashboardStatCard">
          <FiRefreshCw />
          <div>
            <span>{text.savedChats}</span>
            <strong>{dashboard.savedChats}</strong>
          </div>
        </article>
      </section>

      <section className="userDashboardLayout">
        <article className="infoCard userDashboardHotcard">
          <div className="userDashboardSectionHeader">
            <div>
              <span className="userDashboardSectionKicker">{text.lastSevenDays}</span>
              <h2>{text.statsCard}</h2>
              <p>{text.quickActionsBody}</p>
            </div>
            <div className="userDashboardWeekSummary">
              <div>
                <span>{text.weekTotal}</span>
                <strong>{dashboard.week.total}</strong>
              </div>
              <div>
                <span>{text.dailyAverage}</span>
                <strong>{dashboard.week.average.toFixed(1)}</strong>
              </div>
              <div>
                <span>{text.peakDay}</span>
                <strong>
                  {dashboard.week.peak.label || text.unknown} {dashboard.week.peak.value}
                </strong>
              </div>
            </div>
          </div>

          <div className="userDashboardChart" aria-label={text.lastSevenDays}>
            {dashboard.week.points.map((point) => {
              const max = Math.max(...dashboard.week.points.map((item) => item.value), 1)
              const height = Math.max(14, Math.round((point.value / max) * 100))

              return (
                <div key={`${point.label}-${getDateKey(point.date)}`} className="userDashboardChartBar">
                  <div className="userDashboardChartBarTrack">
                    <span style={{ height: `${height}%` }} />
                  </div>
                  <strong>{point.value}</strong>
                  <span>{point.label}</span>
                </div>
              )
            })}
          </div>
        </article>

        <div className="userDashboardSideStack">
          <article className="infoCard userDashboardSideCard">
            <div className="userDashboardSectionHeader compact">
              <div>
                <span className="userDashboardSectionKicker">{text.quickActions}</span>
                <h2>{text.quickActions}</h2>
              </div>
            </div>

            <div className="userDashboardQuickActions">
              <Link href="/admin" className="userDashboardActionCard">
                <span>{text.openAdmin}</span>
                <FiArrowRight />
              </Link>
              <Link href="/landings/auth/chatWidget" className="userDashboardActionCard">
                <span>{text.openWidget}</span>
                <FiArrowRight />
              </Link>
              <Link href="/landings/auth/websites" className="userDashboardActionCard">
                <span>{text.openWebsites}</span>
                <FiArrowRight />
              </Link>
            </div>
          </article>

          <article className="infoCard userDashboardSideCard">
            <div className="userDashboardSectionHeader compact">
              <div>
                <span className="userDashboardSectionKicker">{text.recentActivity}</span>
                <h2>{text.activity}</h2>
              </div>
            </div>

            {dashboard.recentEvents.length ? (
              <div className="userDashboardActivityList">
                {dashboard.recentEvents.map((event) => (
                  <div key={event.id} className="userDashboardActivityItem">
                    <div>
                      <strong>
                        {text.latestEvents[event.kind as keyof typeof text.latestEvents] || event.kind}
                      </strong>
                      <span>{event.sessionId}</span>
                    </div>
                    <time dateTime={event.createdAt.toISOString()}>{formatDate(event.createdAt, locale)}</time>
                  </div>
                ))}
              </div>
            ) : (
              <p className="userDashboardEmpty">{text.noActivity}</p>
            )}
          </article>

          <article className="infoCard userDashboardSideCard">
            <div className="userDashboardSectionHeader compact">
              <div>
                <span className="userDashboardSectionKicker">{text.insights}</span>
                <h2>{text.insights}</h2>
              </div>
            </div>

            <div className="userDashboardInsights">
              <div>
                <span>{text.workspace}</span>
                <strong>{dashboard.workspaceName}</strong>
              </div>
              <div>
                <span>{text.role}</span>
                <strong>{dashboard.roleLabel}</strong>
              </div>
              <div>
                <span>{text.lastChat}</span>
                <strong>{dashboard.lastChatAt ? formatDate(dashboard.lastChatAt, locale) : text.unknown}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
