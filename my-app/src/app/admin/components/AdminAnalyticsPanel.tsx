'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import {
  FiActivity,
  FiClock,
  FiGlobe,
  FiCpu,
  FiPieChart,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { getBusinessChatAnalytics } from '@/lib/chat.service'
import type { ChatAnalytics, ChatAnalyticsEvent } from '@/types/database'
import AdminDropdown from './AdminDropdown'
import './admin-components.css'

declare global {
  interface Window {
    google?: any
  }
}

type AnalyticsView = 'overview' | 'timeline' | 'geography'
type AnalyticsRange = '24h' | '7d' | '30d' | 'all'

type RangeAnalytics = {
  totalSessions: number
  supportRequests: number
  aiOnlySessions: number
  savedSupportChats: number
  countryCounts: Record<string, number>
  lastActivityAt: Date | null
}

type AnalyticsCard = {
  label: string
  value: ReactNode
  detail: string
  icon: ComponentType
  tone: 'green' | 'blue' | 'violet' | 'amber' | 'sky' | 'slate'
}

const emptyAnalytics: ChatAnalytics = {
  totalSessions: 0,
  totalMessages: 0,
  aiOnlySessions: 0,
  supportRequests: 0,
  savedSupportChats: 0,
  countryCounts: {},
  timeline: [],
}

function loadGoogleCharts() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.charts) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-charts="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Charts failed to load')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.gstatic.com/charts/loader.js'
    script.async = true
    script.dataset.googleCharts = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Charts failed to load'))
    document.head.appendChild(script)
  })
}

function getRangeStart(range: AnalyticsRange) {
  const now = new Date()
  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default:
      return new Date(0)
  }
}

function getTimelineBucketStart(date: Date, range: AnalyticsRange) {
  const bucket = new Date(date)

  if (range === '24h') {
    bucket.setMinutes(0, 0, 0)
    return bucket
  }

  if (range === '7d' || range === '30d' || range === 'all') {
    bucket.setHours(0, 0, 0, 0)
    return bucket
  }

  return bucket
}

function buildRangeAnalytics(events: ChatAnalyticsEvent[]): RangeAnalytics {
  const sessionStarts = new Set<string>()
  const supportRequestedSessions = new Set<string>()
  const supportChatSessions = new Set<string>()
  const sessionCountries = new Map<string, string>()
  let lastActivityAt: Date | null = null

  events.forEach((event) => {
    const createdAt = new Date(event.createdAt)
    if (!Number.isNaN(createdAt.getTime()) && (!lastActivityAt || createdAt > lastActivityAt)) {
      lastActivityAt = createdAt
    }

    if (event.countryCode && !sessionCountries.has(event.sessionId)) {
      sessionCountries.set(event.sessionId, event.countryCode)
    }

    switch (event.kind) {
      case 'session-start':
        sessionStarts.add(event.sessionId)
        break
      case 'support-request':
        supportRequestedSessions.add(event.sessionId)
        supportChatSessions.add(event.sessionId)
        break
      case 'support-message':
      case 'support-open':
      case 'support-returned':
        supportChatSessions.add(event.sessionId)
        break
      default:
        break
    }
  })

  const countryCounts = Array.from(sessionCountries.values()).reduce<Record<string, number>>(
    (accumulator, countryCode) => {
      accumulator[countryCode] = (accumulator[countryCode] || 0) + 1
      return accumulator
    },
    {}
  )

  return {
    totalSessions: sessionStarts.size,
    supportRequests: supportRequestedSessions.size,
    aiOnlySessions: Math.max(sessionStarts.size - supportRequestedSessions.size, 0),
    savedSupportChats: supportChatSessions.size,
    countryCounts,
    lastActivityAt,
  }
}

function buildEmptyTimelineBuckets(range: AnalyticsRange) {
  const now = new Date()
  const start = getRangeStart(range)
  const placeholderStart = start.getTime() === 0 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : start

  return [
    { bucket: placeholderStart, activity: 0, handovers: 0 },
    { bucket: now, activity: 0, handovers: 0 },
  ]
}

function countryCodeToFlagEmoji(countryCode?: string) {
  const normalized = String(countryCode || '').trim().toUpperCase()

  if (!/^[A-Z]{2}$/.test(normalized) || normalized === 'XX') {
    return '🌐'
  }

  const codePoints = [...normalized].map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

function countryCodeToFlagImage(countryCode?: string) {
  const normalized = String(countryCode || '').trim().toUpperCase()

  if (!/^[A-Z]{2}$/.test(normalized) || normalized === 'XX') {
    return null
  }

  return `https://flagcdn.com/w40/${normalized.toLowerCase()}.png`
}

function eventLabel(kind: ChatAnalyticsEvent['kind']) {
  switch (kind) {
    case 'session-start':
      return 'Session created'
    case 'visitor-message':
      return 'Visitor message'
    case 'assistant-reply':
      return 'AI reply'
    case 'support-request':
      return 'Support request'
    case 'support-message':
      return 'Human reply'
    case 'support-open':
      return 'Human accepted'
    case 'support-returned':
      return 'Returned to AI'
    default:
      return 'Event'
  }
}

export default function AdminAnalyticsPanel() {
  const { dbUser } = useAuth()
  const [analytics, setAnalytics] = useState<ChatAnalytics>(emptyAnalytics)
  const [loading, setLoading] = useState(true)
  const [chartReady, setChartReady] = useState(false)
  const [view, setView] = useState<AnalyticsView>('overview')
  const [range, setRange] = useState<AnalyticsRange>('7d')
  const overviewRef = useRef<HTMLDivElement | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const geographyRef = useRef<HTMLDivElement | null>(null)
  const viewToggleRef = useRef<HTMLDivElement | null>(null)
  const viewButtonRefs = useRef<Partial<Record<AnalyticsView, HTMLButtonElement | null>>>({})
  const [viewIndicator, setViewIndicator] = useState<{ left: number; width: number } | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadAnalytics() {
      if (!dbUser?.businessId) return

      const data = await getBusinessChatAnalytics(dbUser.businessId)

      if (!mounted) return

      setAnalytics(data || emptyAnalytics)
      setLoading(false)
    }

    void loadAnalytics()

    return () => {
      mounted = false
    }
  }, [dbUser?.businessId])

  useEffect(() => {
    let mounted = true

    async function bootstrapCharts() {
      if (typeof window === 'undefined') return

      try {
        await loadGoogleCharts()
        if (!mounted || !window.google?.charts) return

        window.google.charts.load('current', {
          packages: ['corechart', 'geochart'],
        })

        window.google.charts.setOnLoadCallback(() => {
          if (mounted) setChartReady(true)
        })
      } catch {
        if (mounted) setChartReady(false)
      }
    }

    void bootstrapCharts()

    return () => {
      mounted = false
    }
  }, [])

  const timelineEvents = useMemo(() => {
    const start = getRangeStart(range)
    return [...(analytics.timeline || [])]
      .filter((event) => new Date(event.createdAt) >= start)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [analytics.timeline, range])

  const rangeAnalytics = useMemo(() => buildRangeAnalytics(timelineEvents), [timelineEvents])

  const analyticsCards = useMemo(() => {
    const supportRate =
      rangeAnalytics.totalSessions > 0
        ? Math.round((rangeAnalytics.supportRequests / rangeAnalytics.totalSessions) * 100)
        : 0
    const aiRate =
      rangeAnalytics.totalSessions > 0
        ? Math.round((rangeAnalytics.aiOnlySessions / rangeAnalytics.totalSessions) * 100)
        : 0
    const savedRate =
      rangeAnalytics.supportRequests > 0
        ? Math.round((rangeAnalytics.savedSupportChats / rangeAnalytics.supportRequests) * 100)
        : 0
    const latestCountry =
      Object.entries(rangeAnalytics.countryCounts || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'XX'

    return [
      {
        label: 'Total sessions',
        value: rangeAnalytics.totalSessions,
        detail: 'Selected range only',
        icon: FiActivity,
        tone: 'green',
      },
      {
        label: 'Support requests',
        value: rangeAnalytics.supportRequests,
        detail: `${supportRate}% of sessions in range`,
        icon: FiShield,
        tone: 'blue',
      },
      {
        label: 'AI-only sessions',
        value: rangeAnalytics.aiOnlySessions,
        detail: `${aiRate}% handled fully by AI`,
        icon: FiCpu,
        tone: 'violet',
      },
      {
        label: 'Saved support chats',
        value: rangeAnalytics.savedSupportChats,
        detail: `${savedRate}% of support requests`,
        icon: FiTrendingUp,
        tone: 'amber',
      },
      {
        label: 'Top country',
        value: (
          <span className="adminAnalyticsCountryValue">
            {countryCodeToFlagImage(latestCountry) ? (
              <img
                className="adminAnalyticsCountryFlag"
                src={countryCodeToFlagImage(latestCountry) as string}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <FiGlobe className="adminAnalyticsCountryFlagFallback" aria-hidden="true" />
            )}
            <span>{latestCountry}</span>
          </span>
        ),
        detail: 'Based on selected range',
        icon: FiGlobe,
        tone: 'sky',
      },
      {
        label: 'Last activity',
        value: analytics.lastChatAt ? new Date(analytics.lastChatAt).toLocaleTimeString() : 'None',
        detail: analytics.lastChatAt
          ? new Date(analytics.lastChatAt).toLocaleString()
          : 'No chats yet',
        icon: FiClock,
        tone: 'slate',
      },
    ] satisfies AnalyticsCard[]
  }, [rangeAnalytics])

  const timelineBuckets = useMemo(() => {
    const map = new Map<number, { bucket: Date; activity: number; handovers: number }>()

    timelineEvents.forEach((event) => {
      const date = new Date(event.createdAt)
      const bucketStart = getTimelineBucketStart(date, range)
      const bucketKey = bucketStart.getTime()
      const current = map.get(bucketKey) || {
        bucket: bucketStart,
        activity: 0,
        handovers: 0,
      }

      current.activity += 1
      if (event.kind === 'support-request' || event.kind === 'support-open') {
        current.handovers += 1
      }

      map.set(bucketKey, current)
    })

    return Array.from(map.values()).sort(
      (a, b) => a.bucket.getTime() - b.bucket.getTime()
    )
  }, [range, timelineEvents])

  const countryEntries = useMemo(() => {
    return Object.entries(rangeAnalytics.countryCounts || {}).sort((a, b) => b[1] - a[1])
  }, [rangeAnalytics.countryCounts])

  useEffect(() => {
    if (!chartReady || !window.google?.charts) return

    const google = window.google

    if (view === 'overview' && overviewRef.current) {
      const hasOverviewData =
        rangeAnalytics.aiOnlySessions > 0 ||
        rangeAnalytics.supportRequests > 0 ||
        rangeAnalytics.savedSupportChats > 0

      const pieData = google.visualization.arrayToDataTable([
        ['Type', 'Count'],
        ...(hasOverviewData
          ? [
              ['AI only', rangeAnalytics.aiOnlySessions],
              ['Support requested', rangeAnalytics.supportRequests],
              ['Saved follow-ups', rangeAnalytics.savedSupportChats],
            ]
          : [['No data', 1]]),
      ])

      const pieChart = new google.visualization.PieChart(overviewRef.current)
      pieChart.draw(pieData, {
        backgroundColor: 'transparent',
        pieHole: 0.72,
        legend: { position: 'bottom', textStyle: { color: '#475569', fontName: 'Inter' } },
        chartArea: { left: 10, top: 10, width: '92%', height: '82%' },
        colors: hasOverviewData ? ['#60a5fa', '#34d399', '#f59e0b'] : ['#cbd5e1'],
        pieSliceText: 'none',
        tooltip: { textStyle: { fontName: 'Inter' } },
        fontName: 'Inter',
      })
    }

    if (view === 'timeline' && timelineRef.current) {
      const lineChart = new google.visualization.LineChart(timelineRef.current)
      const chartTimelineBuckets =
        timelineBuckets.length > 0 ? timelineBuckets : buildEmptyTimelineBuckets(range)

      const lineData = google.visualization.arrayToDataTable([
        ['Time', 'Activity', 'Handovers'],
        ...chartTimelineBuckets.map((bucket) => [bucket.bucket, bucket.activity, bucket.handovers]),
      ])

      lineChart.draw(lineData, {
        backgroundColor: 'transparent',
        legend: { position: 'bottom', textStyle: { color: '#475569', fontName: 'Inter' } },
        chartArea: { left: 56, top: 24, width: '84%', height: '68%' },
        colors: ['#7c3aed', '#10b981'],
        curveType: 'function',
        pointSize: 5,
        hAxis: {
          textStyle: { color: '#64748b', fontName: 'Inter' },
          gridlines: { color: 'rgba(148, 163, 184, 0.12)' },
          format: range === '24h' ? 'HH:mm' : 'MMM d',
        },
        vAxis: {
          textStyle: { color: '#64748b', fontName: 'Inter' },
          gridlines: { color: 'rgba(148, 163, 184, 0.12)' },
          minValue: 0,
        },
        tooltip: { textStyle: { fontName: 'Inter' } },
        fontName: 'Inter',
      })
    }

    if (view === 'geography' && geographyRef.current) {
      const geoData = google.visualization.arrayToDataTable([
        ['Country', 'Sessions'],
        ...countryEntries,
      ])

      const geoChart = new google.visualization.GeoChart(geographyRef.current)
      geoChart.draw(geoData, {
        backgroundColor: 'transparent',
        colorAxis: { colors: ['#dbeafe', '#60a5fa', '#1d4ed8'] },
        datalessRegionColor: '#eef2f7',
        defaultColor: '#94a3b8',
        legend: 'none',
        tooltip: { textStyle: { fontName: 'Inter' } },
      })
    }
  }, [
    chartReady,
    countryEntries,
    range,
    rangeAnalytics.aiOnlySessions,
    rangeAnalytics.savedSupportChats,
    rangeAnalytics.supportRequests,
    timelineBuckets,
    view,
  ])

  const topCountries = countryEntries.slice(0, 6)

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const toggleEl = viewToggleRef.current
      const activeButton = viewButtonRefs.current[view]

      if (!toggleEl || !activeButton) {
        setViewIndicator(null)
        return
      }

      const toggleRect = toggleEl.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setViewIndicator({
        left: buttonRect.left - toggleRect.left,
        width: buttonRect.width,
      })
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [view])

  if (loading) {
    return (
      <div className="infoCard adminDataCard">
        <h1>Analytics</h1>
        <p>Loading chat analytics...</p>
      </div>
    )
  }

  return (
    <div className="infoCard adminDataCard adminAnalyticsPanel">
      <div className="adminSectionHeader">
        <div>
          <h1>Analytics</h1>
          <p>Live widget activity, support handovers, geography, and timeline trends.</p>
        </div>
        <div className="adminAnalyticsBadge">
          {rangeAnalytics.lastActivityAt
            ? `Updated ${new Date(rangeAnalytics.lastActivityAt).toLocaleString()}`
            : 'No recent activity'}
        </div>
      </div>

      <div className="adminAnalyticsCards">
        {analyticsCards.map((card) => {
          const Icon = card.icon

          return (
            <article key={card.label} className={`adminAnalyticsStatCard adminAnalyticsTone-${card.tone}`}>
              <div className="adminAnalyticsStatTop">
                <span className="adminAnalyticsIcon">
                  <Icon />
                </span>
                <span>{card.label}</span>
              </div>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          )
        })}
      </div>

      <div className="adminAnalyticsControls">
        <div className="adminAnalyticsViewToggle" ref={viewToggleRef}>
          {viewIndicator ? (
            <span
              className="adminAnalyticsViewToggleIndicator"
              style={{
                transform: `translateX(${viewIndicator.left}px)`,
                width: `${viewIndicator.width}px`,
              }}
            />
          ) : null}
          <button
            ref={(node) => {
              viewButtonRefs.current.overview = node
            }}
            type="button"
            className={view === 'overview' ? 'active' : ''}
            onClick={() => setView('overview')}
          >
            <FiPieChart />
            Overview
          </button>
          <button
            ref={(node) => {
              viewButtonRefs.current.timeline = node
            }}
            type="button"
            className={view === 'timeline' ? 'active' : ''}
            onClick={() => setView('timeline')}
          >
            <FiTrendingUp />
            Timeline
          </button>
          <button
            ref={(node) => {
              viewButtonRefs.current.geography = node
            }}
            type="button"
            className={view === 'geography' ? 'active' : ''}
            onClick={() => setView('geography')}
          >
            <FiGlobe />
            Geography
          </button>
        </div>

        <label className="adminTaskFilter adminAnalyticsRange">
          <span>
            <FiClock /> Time range
          </span>
          <AdminDropdown
            value={range}
            options={[
              { value: '24h', label: 'Last 24 hours' },
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: 'all', label: 'All time' },
            ]}
            onChange={(nextValue) => setRange(nextValue as AnalyticsRange)}
          />
        </label>
      </div>

      {view === 'overview' ? (
        <div className="adminAnalyticsCharts">
          <section className="adminAnalyticsChartCard adminAnalyticsChartCardWide">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>Conversation mix</h2>
                <p>How chats split between AI-only, support requests, and saved follow-ups.</p>
              </div>
            </div>
            <div ref={overviewRef} className="adminGoogleChart" />
          </section>

          <section className="adminAnalyticsChartCard">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>Top countries</h2>
                <p>Visitor country codes captured from the widget.</p>
              </div>
            </div>
            <div className="adminAnalyticsCountryList">
              {topCountries.length ? (
                topCountries.map(([country, count]) => (
                  <div key={country} className="adminAnalyticsCountryRow">
                    <strong>
                      {countryCodeToFlagImage(country) ? (
                        <img
                          className="adminAnalyticsCountryFlag"
                          src={countryCodeToFlagImage(country) as string}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <FiGlobe className="adminAnalyticsCountryFlagFallback" aria-hidden="true" />
                      )}
                      {country}
                    </strong>
                    <span>{count}</span>
                  </div>
                ))
              ) : (
                <p className="adminTaskEmptyState">No country data yet.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {view === 'timeline' ? (
        <div className="adminAnalyticsCharts">
          <section className="adminAnalyticsChartCard adminAnalyticsChartCardWide">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>Activity timeline</h2>
                <p>Zoom the timeline using the range selector above.</p>
              </div>
            </div>
            <div ref={timelineRef} className="adminGoogleChart" />
          </section>

          <section className="adminAnalyticsChartCard">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>Recent events</h2>
                <p>Latest chat events with precise timestamps.</p>
              </div>
            </div>
            <div className="adminAnalyticsEventList">
              {timelineEvents.slice(-8).reverse().map((event) => (
                <article key={event.id} className="adminAnalyticsEventItem">
                  <div>
                    <strong>{eventLabel(event.kind)}</strong>
                    <span>{event.countryCode || 'XX'}</span>
                  </div>
                  <p>{new Date(event.createdAt).toLocaleString()}</p>
                </article>
              ))}
              {!timelineEvents.length ? <p className="adminTaskEmptyState">No timeline events yet.</p> : null}
            </div>
          </section>
        </div>
      ) : null}

      {view === 'geography' ? (
        <div className="adminAnalyticsCharts">
          <section className="adminAnalyticsChartCard adminAnalyticsChartCardWide">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>Geography map</h2>
                <p>Country-code map based on visitor traffic.</p>
              </div>
            </div>
            <div ref={geographyRef} className="adminGoogleChart adminGoogleChartTall" />
          </section>

          <section className="adminAnalyticsChartCard">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>Country breakdown</h2>
                <p>Largest visitor groups from the selected range.</p>
              </div>
            </div>
            <div className="adminAnalyticsCountryList">
              {topCountries.length ? (
                topCountries.map(([country, count]) => (
                  <div key={country} className="adminAnalyticsCountryRow">
                    <strong>
                      {countryCodeToFlagImage(country) ? (
                        <img
                          className="adminAnalyticsCountryFlag"
                          src={countryCodeToFlagImage(country) as string}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <FiGlobe className="adminAnalyticsCountryFlagFallback" aria-hidden="true" />
                      )}
                      {country}
                    </strong>
                    <span>{count}</span>
                  </div>
                ))
              ) : (
                <p className="adminTaskEmptyState">No country data yet.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
