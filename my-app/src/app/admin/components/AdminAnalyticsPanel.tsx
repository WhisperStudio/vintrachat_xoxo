'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import {
  FiActivity,
  FiClock,
  FiCpu,
  FiGlobe,
  FiMessageSquare,
  FiPieChart,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { getBusinessChatAnalytics, getRecentAiChatLogs } from '@/lib/chat.service'
import { adminAnalyticsI18n, useVintraLanguage } from '@/lib/i18n'
import type { AiChatLog, ChatAnalytics, ChatAnalyticsEvent } from '@/types/database'
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

type AnalyticsCardTone = 'orange' | 'purple' | 'cyan' | 'pink' | 'sky' | 'slate'

type AnalyticsCard = {
  label: string
  value: ReactNode
  detail: string
  icon: ComponentType
  tone: AnalyticsCardTone
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

const emptyAiChatLogs: AiChatLog[] = []

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

  bucket.setHours(0, 0, 0, 0)
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

function getWeekdayLabels(language: 'no' | 'en') {
  return language === 'no'
    ? ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}

function getHourLabel(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

export default function AdminAnalyticsPanel({ selectedWidgetKey = '' }: { selectedWidgetKey?: string }) {
  const { dbUser } = useAuth()
  const { language } = useVintraLanguage()
  const text = adminAnalyticsI18n[language]
  const [analytics, setAnalytics] = useState<ChatAnalytics>(emptyAnalytics)
  const [aiChatLogs, setAiChatLogs] = useState<AiChatLog[]>(emptyAiChatLogs)
  const [loading, setLoading] = useState(true)
  const [chartReady, setChartReady] = useState(false)
  const [view, setView] = useState<AnalyticsView>('overview')
  const [range, setRange] = useState<AnalyticsRange>('7d')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const overviewRef = useRef<HTMLDivElement | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const geographyRef = useRef<HTMLDivElement | null>(null)
  const activityRef = useRef<HTMLDivElement | null>(null)
  const viewToggleRef = useRef<HTMLDivElement | null>(null)
  const viewButtonRefs = useRef<Partial<Record<AnalyticsView, HTMLButtonElement | null>>>({})
  const [viewIndicator, setViewIndicator] = useState<{ left: number; width: number } | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadAnalytics() {
      if (!dbUser?.businessId) return

      const [analyticsData, aiLogs] = await Promise.all([
        getBusinessChatAnalytics(dbUser.businessId, {
          widgetKey: selectedWidgetKey || undefined,
        }),
        getRecentAiChatLogs(dbUser.businessId, {
          widgetKey: selectedWidgetKey || undefined,
          limitCount: 80,
        }),
      ])

      if (!mounted) return

      setAnalytics(analyticsData || emptyAnalytics)
      setAiChatLogs(aiLogs)
      setLoading(false)
    }

    setLoading(true)
    void loadAnalytics()

    return () => {
      mounted = false
    }
  }, [dbUser?.businessId, selectedWidgetKey])

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

  const rangeStart = useMemo(() => getRangeStart(range), [range])

  const timelineEvents = useMemo(() => {
    return [...(analytics.timeline || [])]
      .filter((event) => {
        if (!selectedWidgetKey) return true
        return event.widgetKey ? event.widgetKey === selectedWidgetKey : false
      })
      .filter((event) => new Date(event.createdAt) >= rangeStart)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [analytics.timeline, rangeStart, selectedWidgetKey])

  const rangeAnalytics = useMemo(() => buildRangeAnalytics(timelineEvents), [timelineEvents])

  const countryEntries = useMemo(() => {
    return Object.entries(rangeAnalytics.countryCounts || {}).sort((a, b) => b[1] - a[1])
  }, [rangeAnalytics.countryCounts])

  useEffect(() => {
    if (!countryEntries.length) {
      setSelectedCountry(null)
      return
    }

    if (selectedCountry && countryEntries.some(([country]) => country === selectedCountry)) {
      return
    }

    setSelectedCountry(countryEntries[0][0])
  }, [countryEntries, selectedCountry])

  const filteredAiChatLogs = useMemo(() => {
    return aiChatLogs
      .filter((log) => !selectedWidgetKey || log.widgetKey === selectedWidgetKey)
      .filter((log) => log.updatedAt >= rangeStart)
  }, [aiChatLogs, rangeStart, selectedWidgetKey])

  const selectedCountryMessages = useMemo(() => {
    if (!selectedCountry) return []

    return filteredAiChatLogs
      .filter((log) => log.countryCode === selectedCountry)
      .flatMap((log) =>
        log.messages
          .filter((message) => message.role === 'user')
          .map((message) => ({
            ...message,
            countryCode: log.countryCode,
            pageTitle: log.pageTitle,
            pageUrl: log.pageUrl,
            sessionId: log.sessionId,
          }))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 4)
  }, [filteredAiChatLogs, selectedCountry])

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
    const lastActivityAt = rangeAnalytics.lastActivityAt

    return [
      {
        label: text.totalSessions,
        value: rangeAnalytics.totalSessions,
        detail: language === 'no' ? 'Valgt periode' : 'Selected range',
        icon: FiActivity,
        tone: 'orange',
      },
      {
        label: text.supportRequests,
        value: rangeAnalytics.supportRequests,
        detail: `${supportRate}%`,
        icon: FiShield,
        tone: 'purple',
      },
      {
        label: text.aiOnlySessions,
        value: rangeAnalytics.aiOnlySessions,
        detail: `${aiRate}%`,
        icon: FiCpu,
        tone: 'cyan',
      },
      {
        label: text.savedSupportChats,
        value: rangeAnalytics.savedSupportChats,
        detail: `${savedRate}%`,
        icon: FiMessageSquare,
        tone: 'pink',
      },
      {
        label: text.topCountry,
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
        detail: language === 'no' ? 'Mest aktivt land' : 'Most active country',
        icon: FiGlobe,
        tone: 'sky',
      },
      {
        label: text.lastActivity,
        value: lastActivityAt ? lastActivityAt.toLocaleTimeString() : text.none,
        detail: lastActivityAt ? lastActivityAt.toLocaleDateString() : text.noChatsYet,
        icon: FiClock,
        tone: 'slate',
      },
    ] satisfies AnalyticsCard[]
  }, [language, rangeAnalytics, text])

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

    return Array.from(map.values()).sort((a, b) => a.bucket.getTime() - b.bucket.getTime())
  }, [range, timelineEvents])

  const visitorEvents = useMemo(
    () => timelineEvents.filter((event) => event.kind === 'visitor-message'),
    [timelineEvents]
  )

  const peakHours = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))

    visitorEvents.forEach((event) => {
      const createdAt = new Date(event.createdAt)
      counts[createdAt.getHours()].count += 1
    })

    return counts.sort((a, b) => b.count - a.count).slice(0, 6)
  }, [visitorEvents])

  const weekdayLabels = useMemo(() => getWeekdayLabels(language), [language])

  const weekdayActivity = useMemo(() => {
    const counts = Array.from({ length: 7 }, (_, index) => ({
      label: weekdayLabels[index],
      count: 0,
    }))

    visitorEvents.forEach((event) => {
      const createdAt = new Date(event.createdAt)
      const dayIndex = (createdAt.getDay() + 6) % 7
      counts[dayIndex].count += 1
    })

    return counts
  }, [visitorEvents, weekdayLabels])

  const weekdayActivityMax = useMemo(
    () => weekdayActivity.reduce((maxValue, entry) => Math.max(maxValue, entry.count), 0),
    [weekdayActivity]
  )

  useEffect(() => {
    if (!chartReady || !window.google?.charts) return

    const google = window.google

    if (view === 'overview' && overviewRef.current) {
      const hasOverviewData =
        rangeAnalytics.aiOnlySessions > 0 ||
        rangeAnalytics.supportRequests > 0 ||
        rangeAnalytics.savedSupportChats > 0

      const pieData = google.visualization.arrayToDataTable([
        [text.chartLabels.type, text.chartLabels.count],
        ...(hasOverviewData
          ? [
              [text.chartLabels.aiOnly, rangeAnalytics.aiOnlySessions],
              [text.chartLabels.supportRequested, rangeAnalytics.supportRequests],
              [text.chartLabels.savedFollowUps, rangeAnalytics.savedSupportChats],
            ]
          : [[text.chartLabels.noData, 1]]),
      ])

      const pieChart = new google.visualization.PieChart(overviewRef.current)
      pieChart.draw(pieData, {
        backgroundColor: 'transparent',
        pieHole: 0.72,
        legend: { position: 'bottom', textStyle: { color: '#475569', fontName: 'Inter' } },
        chartArea: { left: 10, top: 10, width: '92%', height: '82%' },
        colors: hasOverviewData ? ['#f97316', '#8b5cf6', '#ec4899'] : ['#cbd5e1'],
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
        [text.chartLabels.time, text.chartLabels.activity, text.chartLabels.handovers],
        ...chartTimelineBuckets.map((bucket) => [bucket.bucket, bucket.activity, bucket.handovers]),
      ])

      lineChart.draw(lineData, {
        backgroundColor: 'transparent',
        legend: { position: 'bottom', textStyle: { color: '#475569', fontName: 'Inter' } },
        chartArea: { left: 56, top: 24, width: '84%', height: '68%' },
        colors: ['#8b5cf6', '#f97316'],
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

    if (view === 'timeline' && activityRef.current) {
      const activityChart = new google.visualization.CandlestickChart(activityRef.current)
      const hasActivityData = weekdayActivityMax > 0
      const activityData = google.visualization.arrayToDataTable(
        [
          weekdayActivity.map((entry) => [
            entry.label,
            0,
            0,
            hasActivityData ? entry.count : 1,
            hasActivityData ? entry.count : 1,
          ]),
        ],
        true
      )

      activityChart.draw(activityData, {
        legend: 'none',
        backgroundColor: 'transparent',
        bar: { groupWidth: '100%' },
        candlestick: {
          fallingColor: { strokeWidth: 0, fill: '#e57373' },
          risingColor: { strokeWidth: 0, fill: '#c62828' },
        },
        enableInteractivity: false,
        tooltip: { trigger: 'none' },
        chartArea: { left: 56, top: 18, width: '86%', height: '72%' },
        hAxis: {
          textStyle: { color: '#64748b', fontName: 'Inter' },
        },
        vAxis: {
          minValue: 0,
          viewWindow: { min: 0 },
          textStyle: { color: '#64748b', fontName: 'Inter' },
          gridlines: { color: 'rgba(239, 68, 68, 0.12)' },
        },
      })
    }

    if (view === 'geography' && geographyRef.current && countryEntries.length > 0) {
      const geoData = google.visualization.arrayToDataTable([
        [text.chartLabels.country, text.chartLabels.sessions],
        ...countryEntries,
      ])

      const geoChart = new google.visualization.GeoChart(geographyRef.current)
      geoChart.draw(geoData, {
        backgroundColor: 'transparent',
        colorAxis: { colors: ['#fde7d8', '#c084fc', '#0ea5e9'] },
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
    text,
    timelineBuckets,
    weekdayActivity,
    weekdayActivityMax,
    view,
  ])
  const topCountries = countryEntries.slice(0, 8)

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
        <h1>{text.title}</h1>
        <p>{text.loading}</p>
      </div>
    )
  }

  return (
    <div className="infoCard adminDataCard adminAnalyticsPanel">
      <div className="adminSectionHeader adminAnalyticsHeader">
        <div>
          <h1>{text.title}</h1>
          <p className="adminDataHint">{text.body}</p>
          {selectedWidgetKey ? (
            <p className="adminDataHint">
              {text.showingWidget} <strong>{selectedWidgetKey}</strong>.
            </p>
          ) : null}
        </div>
      </div>

      <div className="adminAnalyticsControls">
        <div className="adminAnalyticsBadge">
          {rangeAnalytics.lastActivityAt
            ? `${text.updated} ${new Date(rangeAnalytics.lastActivityAt).toLocaleString()}`
            : text.noRecentActivity}
        </div>

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
          {(['overview', 'timeline', 'geography'] as AnalyticsView[]).map((nextView) => {
            const icon =
              nextView === 'overview' ? <FiPieChart /> : nextView === 'timeline' ? <FiTrendingUp /> : <FiGlobe />

            return (
              <button
                key={nextView}
                ref={(node) => {
                  viewButtonRefs.current[nextView] = node
                }}
                type="button"
                className={view === nextView ? 'active' : ''}
                onClick={() => setView(nextView)}
              >
                {icon}
                {text[nextView]}
              </button>
            )
          })}
        </div>

        <label className="adminTaskFilter adminAnalyticsRange">
          <span>
            <FiClock /> {text.timeRange}
          </span>
          <AdminDropdown
            value={range}
            options={[
              { value: '24h', label: text.ranges.day },
              { value: '7d', label: text.ranges.week },
              { value: '30d', label: text.ranges.month },
              { value: 'all', label: text.ranges.all },
            ]}
            onChange={(nextValue) => setRange(nextValue as AnalyticsRange)}
          />
        </label>
      </div>

      <div className="adminAnalyticsSummaryStrip">
        {analyticsCards.map((card) => {
          const Icon = card.icon

          return (
            <article key={card.label} className={`adminAnalyticsMiniStat adminAnalyticsTone-${card.tone}`}>
              <span className="adminAnalyticsIcon">
                <Icon />
              </span>
              <div className="adminAnalyticsMiniStatCopy">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
              <small>{card.detail}</small>
            </article>
          )
        })}
      </div>

      {view === 'overview' ? (
        <div className="adminAnalyticsCharts">
          <section className="adminAnalyticsChartCard adminAnalyticsChartCardWide">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>{text.conversationMix}</h2>
                <p>{text.conversationMixBody}</p>
              </div>
            </div>
            <div ref={overviewRef} className="adminGoogleChart" />
          </section>

          <div className="adminAnalyticsChartStack">
            <section className="adminAnalyticsChartCard">
              <div className="adminAnalyticsChartHeader">
                <div>
                  <h2>{text.topCountries}</h2>
                  <p>{text.topCountriesHint}</p>
                </div>
              </div>
              <div className="adminAnalyticsCountryList">
                {topCountries.length ? (
                  topCountries.map(([country, count]) => (
                    <button
                      key={country}
                      type="button"
                      className={`adminAnalyticsCountryRow ${selectedCountry === country ? 'is-active' : ''}`}
                      onClick={() => setSelectedCountry(country)}
                    >
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
                    </button>
                  ))
                ) : (
                  <p className="adminTaskEmptyState">{text.noCountryData}</p>
                )}
              </div>
            </section>

            <section className="adminAnalyticsChartCard">
              <div className="adminAnalyticsChartHeader">
                <div>
                  <h2>{text.recentCountryMessages}</h2>
                  <p>{text.recentCountryMessagesBody}</p>
                </div>
              </div>

              {!selectedCountry ? (
                <p className="adminTaskEmptyState">{text.noCountrySelected}</p>
              ) : (
                <div className="adminAnalyticsMessageFeed">
                  <div className="adminAnalyticsMessageFeedHeader">
                    <span>{text.messagesFrom}</span>
                    <strong>{selectedCountry}</strong>
                  </div>

                  {selectedCountryMessages.length ? (
                    selectedCountryMessages.map((message) => (
                      <article key={message.id} className="adminAnalyticsMessageCard">
                        <p>{message.text}</p>
                        <small>
                          {text.messageSentAt} {message.createdAt.toLocaleString()}
                        </small>
                      </article>
                    ))
                  ) : (
                    <p className="adminTaskEmptyState">{text.recentCountryMessagesEmpty}</p>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}

      {view === 'timeline' ? (
        <div className="adminAnalyticsCharts">
          <section className="adminAnalyticsChartCard adminAnalyticsChartCardWide">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>{text.activityTimeline}</h2>
                <p>{text.activityTimelineBody}</p>
              </div>
            </div>
            <div ref={timelineRef} className="adminGoogleChart" />
          </section>

          <div className="adminAnalyticsChartStack">
            <section className="adminAnalyticsChartCard">
              <div className="adminAnalyticsChartHeader">
                <div>
                  <h2>{text.peakHours}</h2>
                  <p>{text.peakHoursBody}</p>
                </div>
              </div>
              <div className="adminAnalyticsBarList">
                {peakHours.some((hour) => hour.count > 0) ? (
                  peakHours.map((entry) => (
                    <div key={entry.hour} className="adminAnalyticsBarItem">
                      <div className="adminAnalyticsBarItemTop">
                        <strong>{getHourLabel(entry.hour)}</strong>
                        <span>{entry.count}</span>
                      </div>
                      <div className="adminAnalyticsBarTrack">
                        <span
                          className="adminAnalyticsBarFill"
                          style={{
                            width: `${peakHours[0]?.count ? (entry.count / peakHours[0].count) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="adminTaskEmptyState">{text.peakHoursEmpty}</p>
                )}
              </div>
            </section>

            <section className="adminAnalyticsChartCard">
              <div className="adminAnalyticsChartHeader">
                <div>
                  <h2>{text.recentEvents}</h2>
                  <p>{text.recentEventsBody}</p>
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
                {!timelineEvents.length ? <p className="adminTaskEmptyState">{text.noTimelineEvents}</p> : null}
              </div>
            </section>
          </div>

          <section className="adminAnalyticsChartCard adminAnalyticsChartCardSpanFull">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>{text.activityHeatmap}</h2>
                <p>{text.activityHeatmapBody}</p>
              </div>
            </div>

            {weekdayActivityMax === 0 ? (
              <p className="adminTaskEmptyState">{text.activityHeatmapEmpty}</p>
            ) : (
              <div className="adminAnalyticsCandlestick">
                <div ref={activityRef} className="adminGoogleChart adminGoogleChartActivity" />
              </div>
            )}
          </section>
        </div>
      ) : null}

      {view === 'geography' ? (
        <div className="adminAnalyticsCharts">
          <section className="adminAnalyticsChartCard adminAnalyticsChartCardWide">
            <div className="adminAnalyticsChartHeader">
              <div>
                <h2>{text.geographyMap}</h2>
                <p>{text.geographyMapBody}</p>
              </div>
            </div>
            {countryEntries.length ? (
              <div ref={geographyRef} className="adminGoogleChart adminGoogleChartTall" />
            ) : (
              <p className="adminTaskEmptyState">{text.noCountryData}</p>
            )}
          </section>

          <div className="adminAnalyticsChartStack">
            <section className="adminAnalyticsChartCard">
              <div className="adminAnalyticsChartHeader">
                <div>
                  <h2>{text.countryBreakdown}</h2>
                  <p>{text.topCountriesHint}</p>
                </div>
              </div>
              <div className="adminAnalyticsCountryList">
                {topCountries.length ? (
                  topCountries.map(([country, count]) => (
                    <button
                      key={country}
                      type="button"
                      className={`adminAnalyticsCountryRow ${selectedCountry === country ? 'is-active' : ''}`}
                      onClick={() => setSelectedCountry(country)}
                    >
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
                    </button>
                  ))
                ) : (
                  <p className="adminTaskEmptyState">{text.noCountryData}</p>
                )}
              </div>
            </section>

            <section className="adminAnalyticsChartCard">
              <div className="adminAnalyticsChartHeader">
                <div>
                  <h2>{text.recentCountryMessages}</h2>
                  <p>{text.recentCountryMessagesBody}</p>
                </div>
              </div>

              {!selectedCountry ? (
                <p className="adminTaskEmptyState">{text.noCountrySelected}</p>
              ) : selectedCountryMessages.length ? (
                <div className="adminAnalyticsMessageFeed">
                  <div className="adminAnalyticsMessageFeedHeader">
                    <span>{text.messagesFrom}</span>
                    <strong>{selectedCountry}</strong>
                  </div>
                  {selectedCountryMessages.map((message) => (
                    <article key={message.id} className="adminAnalyticsMessageCard">
                      <p>{message.text}</p>
                      <small>
                        {text.messageSentAt} {message.createdAt.toLocaleString()}
                      </small>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="adminTaskEmptyState">{text.recentCountryMessagesEmpty}</p>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  )
}
