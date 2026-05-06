'use client'

import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import {
  FiActivity,
  FiBarChart2,
  FiDatabase,
  FiPlus,
  FiRefreshCcw,
  FiSave,
  FiShield,
  FiSlash,
  FiTool,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { isVintraAdminEmail } from '@/lib/vintra-admin'

type VintraUser = {
  id: string
  email: string
  displayName?: string | null
  role: string
  status: string
  createdAt?: string | null
  updatedAt?: string | null
  lastLogin?: string | null
}

type VintraCategory = {
  id: string
  name: string
  default: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

type VintraModelStat = {
  model: string
  count: number
}

type VintraCountryStat = {
  code: string
  count: number
}

type VintraBusiness = {
  id: string
  name: string
  email: string
  ownerId: string
  widgetKey: string
  plan: string
  assistantEnabled: boolean
  assistantModel: string
  lastChatAt?: string | null
  updatedAt?: string | null
  userCount: number
  chatCount: number
  users: VintraUser[]
  categories: VintraCategory[]
  latestChat?: { id: string; preview: string; status: string; updatedAt?: string | null } | null
  assistantConfig?: {
    enabled: boolean
    model: string
    systemPrompt?: string
    businessContext?: string
    restrictions?: string
    supportTriggerKeywords?: string[]
    handoffMessage?: string
    faqSuggestionsEnabled?: boolean
    faqSuggestions?: string[]
    replyInUserLanguage?: boolean
    responseStyle?: string
    extraInstructions?: string
    forceSelectedModelOnly?: boolean
  } | null
}

type VintraHealth = {
  status: 'online' | 'degraded' | 'offline'
  primaryModel: string
  activeFallbackModel: string | null
  lastHealthyModel: string | null
  model: string
  latencyMs?: number
  checkedAt: string
  detail?: string
  uptimePercent: number
  fallbackModels: Array<{
    model: string
    status: 'online' | 'degraded' | 'offline'
    latencyMs?: number
    detail?: string
  }>
}

type VintraAnalytics = {
  totalSessions: number
  totalMessages: number
  aiOnlySessions: number
  supportRequests: number
  savedSupportChats: number
  averageMessagesPerSession: number
  dailyConversationCounts: Record<string, number>
  countryCounts: Record<string, number>
  topCountries: VintraCountryStat[]
  modelUsage: VintraModelStat[]
  configuredModels: VintraModelStat[]
}

type VintraSummary = {
  adminEmail: string | null
  totals: {
    businesses: number
    users: number
    chats: number
  }
  health: VintraHealth
  latestActivity: string | null
  requestedModel?: string | null
  strictModelOnly?: boolean
  analytics: VintraAnalytics
  businesses: VintraBusiness[]
}

type DraftState = {
  name: string
  email: string
  plan: string
  assistantEnabled: boolean
  assistantModel: string
  systemPrompt: string
  businessContext: string
  restrictions: string
  supportTriggerKeywords: string
  handoffMessage: string
  faqSuggestionsEnabled: boolean
  faqSuggestions: string
  replyInUserLanguage: boolean
  responseStyle: string
  extraInstructions: string
  forceSelectedModelOnly: boolean
}

type VintraTab = 'overview' | 'businesses' | 'gemini' | 'database'

const TAB_LABELS: Array<{ id: VintraTab; label: string; icon: ReactElement }> = [
  { id: 'overview', label: 'Overview', icon: <FiBarChart2 /> },
  { id: 'businesses', label: 'Businesses', icon: <FiDatabase /> },
  { id: 'gemini', label: 'Gemma', icon: <FiTool /> },
  { id: 'database', label: 'Database', icon: <FiUsers /> },
]

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'business', label: 'Business' },
]

const GEMINI_MODEL_OPTIONS = [
  { value: 'gemma-3-4b-it', label: 'Gemma 3 4B IT' },
  { value: 'gemma-3-12b-it', label: 'Gemma 3 12B IT' },
  { value: 'gemma-3-27b-it', label: 'Gemma 3 27B IT' },
  { value: 'gemma-3-1b-it', label: 'Gemma 3 1B IT' },
]

const RECOMMENDED_MODEL = 'gemma-3-4b-it'

function formatDate(value?: string | null) {
  if (!value) return 'No data'
  return new Date(value).toLocaleString()
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value)))
}

function getHealthLabel(status?: string | null) {
  if (status === 'online') return 'Healthy'
  if (status === 'degraded') return 'Partial outage'
  return 'Offline'
}

function getHealthTone(status?: string | null) {
  if (status === 'online') return 'status-online'
  if (status === 'degraded') return 'status-degraded'
  return 'status-offline'
}

function getPercent(value: number, max: number) {
  if (!max) return 0
  return Math.max(8, Math.min(100, (value / max) * 100))
}

function useVintraFetch(firebaseUser: any) {
  return async function vintraFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    if (!firebaseUser) {
      throw new Error('Missing authenticated user')
    }

    const token = await firebaseUser.getIdToken()
    const headers = new Headers(init.headers || {})
    headers.set('Authorization', `Bearer ${token}`)
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json')
    }

    return fetch(input, {
      ...init,
      headers,
    })
  }
}

function BarList({
  title,
  subtitle,
  items,
  emptyLabel,
}: {
  title: string
  subtitle?: string
  items: Array<{ label: string; value: number; meta?: string }>
  emptyLabel: string
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0)

  return (
    <article className="vintraAdminChartCard">
      <div className="vintraAdminSectionHeader">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {items.length ? (
        <div className="vintraAdminBarList">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="vintraAdminBarRow">
              <div className="vintraAdminBarLabel">
                <strong>{item.label}</strong>
                {item.meta ? <span>{item.meta}</span> : null}
              </div>
              <div className="vintraAdminBarTrack">
                <div
                  className="vintraAdminBarFill"
                  style={{ width: `${getPercent(item.value, maxValue)}%` }}
                />
              </div>
              <strong className="vintraAdminBarValue">{formatNumber(item.value)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="vintraAdminChartEmpty">{emptyLabel}</div>
      )}
    </article>
  )
}

function SummaryStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactElement
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <article className="vintraAdminStatCard">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  )
}

function HealthTimeline({
  items,
  uptimePercent,
}: {
  items: VintraHealth['fallbackModels']
  uptimePercent: number
}) {
  const total = items.length || 1
  const onlineCount = items.filter((item) => item.status === 'online').length
  const degradedCount = items.filter((item) => item.status === 'degraded').length
  const offlineCount = items.filter((item) => item.status === 'offline').length

  return (
    <div className="vintraAdminHealthTimeline">
      <div className="vintraAdminHealthMeter" aria-hidden="true">
        {items.length ? (
          items.map((item) => (
            <span key={item.model} className={`vintraAdminHealthCell status-${item.status}`} />
          ))
        ) : (
          <span className="vintraAdminHealthCell status-offline" />
        )}
      </div>
      <div className="vintraAdminHealthMeta">
        <strong>{Math.max(0, Math.min(100, uptimePercent))}%</strong>
        <span>
          {onlineCount} online, {degradedCount} degraded, {offlineCount} offline
        </span>
      </div>
      <div className="vintraAdminHealthLabels">
        {items.length ? (
          items.map((item) => (
            <span key={item.model} className={`vintraAdminStatus status-${item.status}`}>
              {item.model}
            </span>
          ))
        ) : (
          <span className="vintraAdminStatus status-offline">No model data</span>
        )}
      </div>
    </div>
  )
}

export default function VintraAdminClient() {
  const { firebaseUser, loading, logout } = useAuth()
  const router = useRouter()
  const [summary, setSummary] = useState<VintraSummary | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [activeTab, setActiveTab] = useState<VintraTab>('overview')
  const [confirmPlanChange, setConfirmPlanChange] = useState(false)
  const [confirmBusinessDelete, setConfirmBusinessDelete] = useState(false)
  const [confirmUserDelete, setConfirmUserDelete] = useState<Record<string, boolean>>({})
  const [confirmCategoryDelete, setConfirmCategoryDelete] = useState<Record<string, boolean>>({})
  const [healthTestModel, setHealthTestModel] = useState(RECOMMENDED_MODEL)

  const vintraFetch = useVintraFetch(firebaseUser)
  const isAllowed = isVintraAdminEmail(firebaseUser?.email)

  const selectedBusiness = useMemo(() => {
    if (!summary?.businesses.length) return null
    return summary.businesses.find((business) => business.id === selectedBusinessId) || summary.businesses[0]
  }, [selectedBusinessId, summary?.businesses])

  const modelHealthMap = useMemo(() => {
    return new Map((summary?.health.fallbackModels || []).map((entry) => [entry.model, entry.status] as const))
  }, [summary?.health.fallbackModels])

  useEffect(() => {
    if (!summary?.health.primaryModel) return
    setHealthTestModel((current) => current || summary.health.primaryModel)
  }, [summary?.health.primaryModel])

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace('/auth/login')
      return
    }

    if (!loading && firebaseUser && !isAllowed) {
      router.replace('/admin')
    }
  }, [firebaseUser, isAllowed, loading, router])

  useEffect(() => {
    if (!selectedBusiness) {
      setDraft(null)
      return
    }

    setSelectedBusinessId(selectedBusiness.id)
    setDraft({
      name: selectedBusiness.name,
      email: selectedBusiness.email,
      plan: selectedBusiness.plan,
      assistantEnabled: selectedBusiness.assistantEnabled,
      assistantModel: selectedBusiness.assistantModel,
      systemPrompt: selectedBusiness.assistantConfig?.systemPrompt || '',
      businessContext: selectedBusiness.assistantConfig?.businessContext || '',
      restrictions: selectedBusiness.assistantConfig?.restrictions || '',
      supportTriggerKeywords: (selectedBusiness.assistantConfig?.supportTriggerKeywords || []).join(', '),
      handoffMessage: selectedBusiness.assistantConfig?.handoffMessage || '',
      faqSuggestionsEnabled: selectedBusiness.assistantConfig?.faqSuggestionsEnabled ?? true,
      faqSuggestions: (selectedBusiness.assistantConfig?.faqSuggestions || []).join('\n'),
      replyInUserLanguage: selectedBusiness.assistantConfig?.replyInUserLanguage ?? true,
      responseStyle: selectedBusiness.assistantConfig?.responseStyle || '',
      extraInstructions: selectedBusiness.assistantConfig?.extraInstructions || '',
      forceSelectedModelOnly: selectedBusiness.assistantConfig?.forceSelectedModelOnly ?? false,
    })
    setConfirmPlanChange(false)
    setConfirmBusinessDelete(false)
  }, [selectedBusiness])

  const buildSummaryUrl = (model?: string | null, strictModelOnly = false) => {
    const params = new URLSearchParams()
    const nextModel = String(model || '').trim()
    if (nextModel) params.set('model', nextModel)
    if (strictModelOnly) params.set('strict', '1')
    const query = params.toString()
    return query ? `/api/vintra-admin/summary?${query}` : '/api/vintra-admin/summary'
  }

  const loadSummary = async (model?: string | null, strictModelOnly = false) => {
    if (!firebaseUser) return
    setBusy(true)
    setError('')

    try {
      const response = await vintraFetch(buildSummaryUrl(model, strictModelOnly))
      const payload = (await response.json()) as VintraSummary & { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Could not load Vintra summary')
      }

      setSummary(payload)
      setSelectedBusinessId((current) => current || payload.businesses[0]?.id || null)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Could not load Vintra summary')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!firebaseUser || !isAllowed) return
    void loadSummary()
    const interval = window.setInterval(() => {
      void loadSummary()
    }, 30000)

    return () => window.clearInterval(interval)
  }, [firebaseUser, isAllowed])

  const saveBusiness = async () => {
    if (!selectedBusiness || !draft) return
    setBusy(true)
    setStatusMessage('')

    try {
      const planChanged = draft.plan !== selectedBusiness.plan
      const response = await vintraFetch(`/api/vintra-admin/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: draft.name,
          email: draft.email,
          plan: planChanged ? draft.plan : undefined,
          confirmPlanChange: planChanged ? confirmPlanChange : undefined,
          assistantConfig: {
            enabled: draft.assistantEnabled,
            model: draft.assistantModel,
            systemPrompt: draft.systemPrompt,
            businessContext: draft.businessContext,
            restrictions: draft.restrictions,
            supportTriggerKeywords: draft.supportTriggerKeywords
              .split(',')
              .map((entry) => entry.trim())
              .filter(Boolean),
            handoffMessage: draft.handoffMessage,
            faqSuggestionsEnabled: draft.faqSuggestionsEnabled,
            faqSuggestions: draft.faqSuggestions
              .split(/\n|,/)
              .map((entry) => entry.trim())
              .filter(Boolean),
            replyInUserLanguage: draft.replyInUserLanguage,
            responseStyle: draft.responseStyle,
            extraInstructions: draft.extraInstructions,
            forceSelectedModelOnly: draft.forceSelectedModelOnly,
          },
        }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Could not save business')

      setConfirmPlanChange(false)
      setStatusMessage('Business settings saved')
      await loadSummary()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save business')
    } finally {
      setBusy(false)
    }
  }

  const deleteBusiness = async () => {
    if (!selectedBusiness) return
    setBusy(true)
    setStatusMessage('')

    try {
      const response = await vintraFetch(`/api/vintra-admin/businesses/${selectedBusiness.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirm: confirmBusinessDelete }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Could not delete business')

      setStatusMessage('Business deleted')
      setConfirmBusinessDelete(false)
      setSelectedBusinessId(null)
      await loadSummary()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete business')
    } finally {
      setBusy(false)
    }
  }

  const addCategory = async () => {
    if (!selectedBusiness || !newCategoryName.trim()) return
    setBusy(true)
    setStatusMessage('')

    try {
      const response = await vintraFetch(`/api/vintra-admin/businesses/${selectedBusiness.id}/categories`, {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Could not add category')

      setNewCategoryName('')
      setStatusMessage('Category added')
      await loadSummary()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not add category')
    } finally {
      setBusy(false)
    }
  }

  const removeCategory = async (categoryId: string) => {
    if (!selectedBusiness) return
    setBusy(true)
    setStatusMessage('')

    try {
      const response = await vintraFetch(`/api/vintra-admin/businesses/${selectedBusiness.id}/categories`, {
        method: 'DELETE',
        body: JSON.stringify({ categoryId, confirm: true }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Could not remove category')

      setStatusMessage('Category removed')
      setConfirmCategoryDelete((current) => ({ ...current, [categoryId]: false }))
      await loadSummary()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not remove category')
    } finally {
      setBusy(false)
    }
  }

  const removeUser = async (userId: string) => {
    if (!selectedBusiness) return
    setBusy(true)
    setStatusMessage('')

    try {
      const response = await vintraFetch(`/api/vintra-admin/businesses/${selectedBusiness.id}/users/${userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Could not remove user')

      setStatusMessage('User removed')
      setConfirmUserDelete((current) => ({ ...current, [userId]: false }))
      await loadSummary()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not remove user')
    } finally {
      setBusy(false)
    }
  }

  const businessBars =
    summary?.businesses
      .slice()
      .sort((a, b) => (b.chatCount + b.userCount) - (a.chatCount + a.userCount))
      .slice(0, 6)
      .map((business) => ({
        label: business.name,
        value: business.chatCount + business.userCount,
        meta: `${business.userCount} users • ${business.chatCount} chats`,
      })) || []

  const dailyUsageBars = summary
    ? Object.entries(summary.analytics.dailyConversationCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([day, count]) => ({ label: day, value: Number(count || 0), meta: 'sessions' }))
    : []

  const modelBars =
    summary?.analytics.modelUsage.length
      ? summary.analytics.modelUsage.map((entry) => ({ label: entry.model, value: entry.count, meta: 'AI requests' }))
      : summary?.analytics.configuredModels.map((entry) => ({ label: entry.model, value: entry.count, meta: 'configured' })) || []

  const countryBars =
    summary?.analytics.topCountries.map((entry) => ({ label: entry.code, value: entry.count, meta: 'visits' })) || []

  const totalCategories = summary?.businesses.reduce((sum, business) => sum + business.categories.length, 0) || 0

  if (loading) {
    return (
      <main className="vintraAdminShell">
        <div className="vintraAdminLoading">Loading Vintra admin...</div>
      </main>
    )
  }

  if (!firebaseUser) {
    return (
      <main className="vintraAdminShell">
        <div className="vintraAdminGuard">
          <FiShield />
          <h1>Sign in required</h1>
          <p>You need a Vintra account to access this console.</p>
        </div>
      </main>
    )
  }

  if (!isAllowed) {
    return (
      <main className="vintraAdminShell">
        <div className="vintraAdminGuard">
          <FiSlash />
          <h1>Access denied</h1>
          <p>This area is restricted to Vintra mail accounts only.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="vintraAdminShell">
      <section className="vintraAdminHero">
        <div>
          <p className="vintraAdminEyebrow">Internal control room</p>
          <h1>Vintra Admin</h1>
          <p>Monitor database users, businesses, Gemma health, and AI usage from one place.</p>
        </div>
        <div className="vintraAdminHeroActions">
          <button type="button" className="vintraAdminButton secondary" onClick={() => void loadSummary()} disabled={busy}>
            <FiRefreshCcw />
            Refresh
          </button>
        </div>
      </section>

      <nav className="vintraAdminTabs" aria-label="Vintra admin sections">
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`vintraAdminTab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <section className="vintraAdminStats">
        <SummaryStat icon={<FiDatabase />} label="Businesses" value={summary?.totals.businesses ?? 0} />
        <SummaryStat icon={<FiUsers />} label="Users" value={summary?.totals.users ?? 0} />
        <SummaryStat icon={<FiActivity />} label="Chats" value={summary?.totals.chats ?? 0} />
        <SummaryStat
          icon={<FiTool />}
          label="Gemma"
          value={summary?.health.model || 'Unknown'}
          hint={getHealthLabel(summary?.health.status)}
        />
      </section>

      {activeTab === 'overview' ? (
        <section className="vintraAdminPanel vintraAdminDetails">
          <div className="vintraAdminSectionHeader">
            <div>
              <h2>Overview</h2>
              <p>Database totals, AI usage, and recent activity snapshots.</p>
            </div>
            <span className="vintraAdminBadge">Last activity {formatDate(summary?.latestActivity)}</span>
          </div>

          <div className="vintraAdminChartsGrid">
            <BarList
              title="Businesses"
              subtitle="Largest accounts by combined users and chats."
              items={businessBars}
              emptyLabel="No businesses yet."
            />
            <BarList
              title="AI activity"
              subtitle="Gemma requests and model usage across the database."
              items={modelBars}
              emptyLabel="No AI usage yet."
            />
            <BarList
              title="Weekly sessions"
              subtitle="Conversation volume from the last range in storage."
              items={dailyUsageBars}
              emptyLabel="No timeline data yet."
            />
            <BarList
              title="Top countries"
              subtitle="Country spread from recent chats."
              items={countryBars}
              emptyLabel="No country data yet."
            />
          </div>
        </section>
      ) : null}

      {activeTab === 'businesses' ? (
        <section className="vintraAdminGrid">
          <aside className="vintraAdminPanel">
            <div className="vintraAdminPanelHeader">
              <div>
                <h2>Businesses</h2>
                <p>{summary?.businesses.length ?? 0} businesses in database</p>
              </div>
              <span>{summary?.businesses.length ?? 0}</span>
            </div>

            <div className="vintraAdminList">
              {summary?.businesses.map((business) => (
                <button
                  key={business.id}
                  type="button"
                  className={`vintraAdminListItem ${selectedBusiness?.id === business.id ? 'active' : ''}`}
                  onClick={() => setSelectedBusinessId(business.id)}
                >
                  <strong>{business.name}</strong>
                  <span>{business.email}</span>
                  <small>
                    {business.userCount} users · {business.chatCount} chats · {business.plan}
                  </small>
                </button>
              ))}
            </div>
          </aside>

          <section className="vintraAdminPanel vintraAdminDetails">
            {selectedBusiness && draft ? (
              <>
                <div className="vintraAdminPanelHeader">
                  <div>
                    <h2>{selectedBusiness.name}</h2>
                    <p>Owner: {selectedBusiness.email}</p>
                  </div>
                  <div className="vintraAdminBadge">Updated {formatDate(selectedBusiness.updatedAt)}</div>
                </div>

                <div className="vintraAdminSection">
                  <div className="vintraAdminSectionHeader">
                    <div>
                      <h3>Business settings</h3>
                      <p>Edit metadata, plan, and assistant settings.</p>
                    </div>
                    <button type="button" className="vintraAdminButton primary" onClick={saveBusiness} disabled={busy}>
                      <FiSave />
                      Save
                    </button>
                  </div>

                  <div className="vintraAdminFormGrid">
                    <label>
                      <span>Name</span>
                      <input
                        value={draft.name}
                        onChange={(event) => setDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                      />
                    </label>
                    <label>
                      <span>Email</span>
                      <input
                        value={draft.email}
                        onChange={(event) => setDraft((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                      />
                    </label>
                    <label>
                      <span>Plan</span>
                      <select
                        value={draft.plan}
                        onChange={(event) => setDraft((prev) => (prev ? { ...prev, plan: event.target.value } : prev))}
                      >
                        {PLAN_OPTIONS.map((plan) => (
                          <option key={plan.value} value={plan.value}>
                            {plan.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="vintraAdminToggle">
                      <span>AI enabled</span>
                      <input
                        type="checkbox"
                        checked={draft.assistantEnabled}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, assistantEnabled: event.target.checked } : prev))
                        }
                      />
                    </label>
                    <label>
                      <span>Model</span>
                      <input
                        value={draft.assistantModel}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, assistantModel: event.target.value } : prev))
                        }
                        placeholder="gemma-3-4b-it"
                      />
                                            <small className="vintraAdminHint">
                        Pick a Gemma model below to switch manually, or type a custom model id. Green means healthy,
                        yellow means partial outage, and red means offline.
                      </small>
                      <div className="vintraAdminModelPills">
                        {GEMINI_MODEL_OPTIONS.map((model) => (
                          <button
                            key={model.value}
                            type="button"
                            className={`vintraAdminButton secondary vintraAdminModelButton ${
                              draft.assistantModel === model.value ? 'active' : ''
                            } ${modelHealthMap.get(model.value) ? `status-${modelHealthMap.get(model.value)}` : ''}`}
                            onClick={() =>
                              setDraft((prev) => (prev ? { ...prev, assistantModel: model.value } : prev))
                            }
                          >
                            {model.label}
                            {model.value === RECOMMENDED_MODEL ? ' · Recommended' : ''}
                          </button>
                        ))}
                      </div>
                    </label>
                    <label className="vintraAdminToggle">
                      <span>Force selected model only</span>
                      <input
                        type="checkbox"
                        checked={draft.forceSelectedModelOnly}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev ? { ...prev, forceSelectedModelOnly: event.target.checked } : prev
                          )
                        }
                      />
                    </label>
                    <small className="vintraAdminHint">
                      Turn this on to disable fallback completely and test one model at a time. Best starting point is
                      usually <strong>{RECOMMENDED_MODEL}</strong>.
                    </small>
                    <label className="vintraAdminFull">
                      <span>System prompt</span>
                      <textarea
                        rows={4}
                        value={draft.systemPrompt}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, systemPrompt: event.target.value } : prev))
                        }
                      />
                    </label>
                    <label className="vintraAdminFull">
                      <span>Business context</span>
                      <textarea
                        rows={5}
                        value={draft.businessContext}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, businessContext: event.target.value } : prev))
                        }
                      />
                    </label>
                    <label className="vintraAdminFull">
                      <span>Restrictions</span>
                      <textarea
                        rows={3}
                        value={draft.restrictions}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, restrictions: event.target.value } : prev))
                        }
                      />
                    </label>
                    <label className="vintraAdminFull">
                      <span>Support trigger keywords</span>
                      <input
                        value={draft.supportTriggerKeywords}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, supportTriggerKeywords: event.target.value } : prev))
                        }
                      />
                    </label>
                    <label className="vintraAdminFull">
                      <span>Human handoff message</span>
                      <textarea
                        rows={3}
                        value={draft.handoffMessage}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, handoffMessage: event.target.value } : prev))
                        }
                      />
                    </label>
                    {draft.plan !== selectedBusiness.plan ? (
                      <label className="vintraAdminFull vintraAdminConfirmRow">
                        <input
                          type="checkbox"
                          checked={confirmPlanChange}
                          onChange={(event) => setConfirmPlanChange(event.target.checked)}
                        />
                        <span>
                          Confirm plan change from <strong>{selectedBusiness.plan}</strong> to{' '}
                          <strong>{draft.plan}</strong>
                        </span>
                      </label>
                    ) : null}
                  </div>
                </div>

                <div className="vintraAdminTwoCol">
                  <div className="vintraAdminSection">
                    <div className="vintraAdminSectionHeader">
                      <div>
                        <h3>Users</h3>
                        <p>Remove user access with an extra confirmation checkmark.</p>
                      </div>
                      <span>{selectedBusiness.userCount}</span>
                    </div>
                    <div className="vintraAdminScrollList">
                      {selectedBusiness.users.length ? (
                        selectedBusiness.users.map((user) => (
                          <article key={user.id} className="vintraAdminListCard">
                            <div>
                              <strong>{user.displayName || user.email}</strong>
                              <span>{user.email}</span>
                            </div>
                            <div className="vintraAdminRowMeta">
                              <span>{user.role}</span>
                              <span>{user.status}</span>
                              <span>{formatDate(user.lastLogin)}</span>
                            </div>
                            <label className="vintraAdminConfirmRow">
                              <input
                                type="checkbox"
                                checked={Boolean(confirmUserDelete[user.id])}
                                onChange={(event) =>
                                  setConfirmUserDelete((current) => ({
                                    ...current,
                                    [user.id]: event.target.checked,
                                  }))
                                }
                              />
                              <span>Confirm removal</span>
                            </label>
                            <button
                              type="button"
                              className="vintraAdminDangerLink"
                              onClick={() => removeUser(user.id)}
                              disabled={busy || !confirmUserDelete[user.id]}
                            >
                              <FiTrash2 />
                              Remove user
                            </button>
                          </article>
                        ))
                      ) : (
                        <p>No users found.</p>
                      )}
                    </div>
                  </div>

                  <div className="vintraAdminSection">
                    <div className="vintraAdminSectionHeader">
                      <div>
                        <h3>Categories</h3>
                        <p>Add or remove support categories with confirmation.</p>
                      </div>
                      <span>{selectedBusiness.categories.length}</span>
                    </div>

                    <div className="vintraAdminInlineAdd">
                      <input
                        placeholder="New category"
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                      />
                      <button type="button" className="vintraAdminButton secondary" onClick={addCategory} disabled={busy}>
                        <FiPlus />
                        Add
                      </button>
                    </div>

                    <div className="vintraAdminScrollList">
                      {selectedBusiness.categories.length ? (
                        selectedBusiness.categories.map((category) => (
                          <article key={category.id} className="vintraAdminListCard">
                            <div>
                              <strong>{category.name}</strong>
                              <span>{category.default ? 'Default' : 'Custom'}</span>
                            </div>
                            <label className="vintraAdminConfirmRow">
                              <input
                                type="checkbox"
                                checked={Boolean(confirmCategoryDelete[category.id])}
                                onChange={(event) =>
                                  setConfirmCategoryDelete((current) => ({
                                    ...current,
                                    [category.id]: event.target.checked,
                                  }))
                                }
                              />
                              <span>Confirm removal</span>
                            </label>
                            <button
                              type="button"
                              className="vintraAdminDangerLink"
                              onClick={() => removeCategory(category.id)}
                              disabled={busy || !confirmCategoryDelete[category.id]}
                            >
                              <FiTrash2 />
                              Remove
                            </button>
                          </article>
                        ))
                      ) : (
                        <p>No categories yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="vintraAdminSection">
                  <div className="vintraAdminSectionHeader">
                    <div>
                      <h3>Delete business</h3>
                      <p>This permanently removes the business, users, chats, and support tasks.</p>
                    </div>
                    <span className="vintraAdminStatus status-offline">Danger zone</span>
                  </div>
                  <label className="vintraAdminConfirmRow">
                    <input
                      type="checkbox"
                      checked={confirmBusinessDelete}
                      onChange={(event) => setConfirmBusinessDelete(event.target.checked)}
                    />
                    <span>I understand this action cannot be undone.</span>
                  </label>
                  <button
                    type="button"
                    className="vintraAdminButton danger"
                    onClick={() => void deleteBusiness()}
                    disabled={busy || !confirmBusinessDelete}
                  >
                    <FiTrash2 />
                    Delete business
                  </button>
                </div>

                <div className="vintraAdminSection">
                  <div className="vintraAdminSectionHeader">
                    <div>
                      <h3>Recent chats</h3>
                      <p>Latest conversation snapshot for this business.</p>
                    </div>
                    <span>{selectedBusiness.chatCount}</span>
                  </div>
                  <div className="vintraAdminScrollList">
                    {selectedBusiness.latestChat ? (
                      <article className="vintraAdminListCard">
                        <div>
                          <strong>{selectedBusiness.latestChat.id}</strong>
                          <span>{selectedBusiness.latestChat.preview}</span>
                        </div>
                        <div className="vintraAdminRowMeta">
                          <span>{selectedBusiness.latestChat.status}</span>
                          <span>{formatDate(selectedBusiness.latestChat.updatedAt)}</span>
                        </div>
                      </article>
                    ) : (
                      <p>No chats logged yet.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="vintraAdminEmpty">
                <FiBarChart2 />
                <h3>No business selected</h3>
                <p>Pick a business from the left side to inspect users, categories, plan, and AI settings.</p>
              </div>
            )}
          </section>
        </section>
      ) : null}

      {activeTab === 'gemini' ? (
        <section className="vintraAdminDetails">
          <div className="vintraAdminSection">
            <div className="vintraAdminSectionHeader">
              <div>
                <h2>Gemma</h2>
                <p>Live health, fallback chain, and AI usage across the database.</p>
              </div>
              <span className={`vintraAdminStatus ${getHealthTone(summary?.health.status)}`}>
                {getHealthLabel(summary?.health.status)}
              </span>
            </div>

            <div className="vintraAdminTwoCol">
              <article className="vintraAdminChartCard">
                <h3>API health</h3>
                <div className="vintraAdminHealthControls">
                  <div className="vintraAdminModelPills">
                    {GEMINI_MODEL_OPTIONS.map((model) => (
                      <button
                        key={model.value}
                        type="button"
                        className={`vintraAdminButton secondary vintraAdminModelButton ${
                          healthTestModel === model.value ? 'active' : ''
                        } ${modelHealthMap.get(model.value) ? `status-${modelHealthMap.get(model.value)}` : ''}`}
                        onClick={() => setHealthTestModel(model.value)}
                      >
                        {model.label}
                      </button>
                    ))}
                  </div>
                  <div className="vintraAdminModelActions">
                    <button
                      type="button"
                      className="vintraAdminButton primary vintraAdminModelButton"
                      onClick={() => void loadSummary(healthTestModel, true)}
                      disabled={busy}
                    >
                      Test selected model
                    </button>
                    <button
                      type="button"
                      className="vintraAdminButton secondary vintraAdminModelButton"
                      onClick={() => void loadSummary()}
                      disabled={busy}
                    >
                      Refresh default
                    </button>
                  </div>
                </div>
                <p>Model: {summary?.health.model || 'Unknown'}</p>
                <p>Primary model: {summary?.health.primaryModel || 'Unknown'}</p>
                <p>Testing model: {summary?.requestedModel || summary?.health.primaryModel || 'Unknown'}</p>
                <p>
                  Active fallback:{' '}
                  <strong>{summary?.health.activeFallbackModel || 'None'}</strong>
                </p>
                <p>
                  Last healthy model:{' '}
                  <strong>{summary?.health.lastHealthyModel || summary?.health.model || 'Unknown'}</strong>
                </p>
                <p>Checked at: {summary?.health.checkedAt ? new Date(summary.health.checkedAt).toLocaleString() : 'Unknown'}</p>
                <p>{summary?.health.detail || 'Gemma is reachable.'}</p>
                <p>Latency: {summary?.health.latencyMs ? `${summary.health.latencyMs} ms` : 'No latency data'}</p>
                <p>
                  Status: <strong>{getHealthLabel(summary?.health.status)}</strong>
                </p>
                <p>
                  {summary?.strictModelOnly
                    ? 'Strict mode is enabled for this test. Only the selected Gemma model was checked.'
                    : 'Auto fallback is enabled. If one model fails, the API tries the next one in order.'}
                </p>
                <HealthTimeline
                  items={summary?.health.fallbackModels || []}
                  uptimePercent={summary?.health.uptimePercent || 0}
                />
              </article>

              <article className="vintraAdminChartCard">
                <h3>Fallback chain</h3>
                <div className="vintraAdminPillList">
                  {summary?.health.fallbackModels.map((entry) => (
                    <span key={entry.model} className={`vintraAdminStatus status-${entry.status}`}>
                      {entry.model}
                    </span>
                  ))}
                </div>
                <p className="vintraAdminHelpText">
                  This is the exact order the chat API will try when the primary model is unavailable.
                </p>
              </article>
            </div>
          </div>

          <div className="vintraAdminChartsGrid">
            <BarList
              title="Model usage"
              subtitle="How many AI requests each model has handled."
              items={modelBars}
              emptyLabel="No model usage yet."
            />
            <BarList
              title="Daily AI volume"
              subtitle="Total conversations started per day."
              items={dailyUsageBars}
              emptyLabel="No daily data yet."
            />
          </div>

          <div className="vintraAdminSection">
            <div className="vintraAdminSectionHeader">
              <div>
                <h3>Usage totals</h3>
                <p>These are database-backed totals for the AI layer.</p>
              </div>
            </div>
            <div className="vintraAdminStats compact">
              <SummaryStat icon={<FiActivity />} label="Sessions" value={summary?.analytics.totalSessions ?? 0} />
              <SummaryStat icon={<FiUsers />} label="Messages" value={summary?.analytics.totalMessages ?? 0} />
              <SummaryStat icon={<FiTool />} label="AI-only" value={summary?.analytics.aiOnlySessions ?? 0} />
              <SummaryStat icon={<FiDatabase />} label="Human handoffs" value={summary?.analytics.supportRequests ?? 0} />
            </div>
            <p className="vintraAdminHelpText">
              Average messages per session: {summary?.analytics.averageMessagesPerSession?.toFixed(2) || '0.00'}
            </p>
          </div>
        </section>
      ) : null}

      {activeTab === 'database' ? (
        <section className="vintraAdminDetails">
          <div className="vintraAdminSection">
            <div className="vintraAdminSectionHeader">
              <div>
                <h2>Database</h2>
                <p>Quick snapshot of the data currently stored in Firestore.</p>
              </div>
              <span className="vintraAdminBadge">{totalCategories} categories</span>
            </div>

            <div className="vintraAdminTwoCol">
              <BarList
                title="Businesses"
                subtitle="Top accounts by overall activity."
                items={businessBars}
                emptyLabel="No businesses found."
              />
              <BarList
                title="Countries"
                subtitle="Where chats are coming from."
                items={countryBars}
                emptyLabel="No country data found."
              />
            </div>
          </div>

          <div className="vintraAdminSection">
            <div className="vintraAdminSectionHeader">
              <div>
                <h3>Latest activity</h3>
                <p>Selected business and database-wide numbers.</p>
              </div>
            </div>
            <div className="vintraAdminList">
              {summary?.businesses.length ? (
                summary.businesses.slice(0, 5).map((business) => (
                  <article key={business.id} className="vintraAdminListCard">
                    <div>
                      <strong>{business.name}</strong>
                      <span>{business.email}</span>
                    </div>
                    <div className="vintraAdminRowMeta">
                      <span>{business.userCount} users</span>
                      <span>{business.chatCount} chats</span>
                      <span>{business.plan}</span>
                      <span>{formatDate(business.lastChatAt)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p>No database records found.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {error ? <div className="vintraAdminBanner error">{error}</div> : null}
      {statusMessage ? <div className="vintraAdminBanner success">{statusMessage}</div> : null}
    </main>
  )
}
