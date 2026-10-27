'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  FiArrowRight,
  FiArrowUpRight,
  FiCheck,
  FiCheckSquare,
  FiClock,
  FiLayers,
  FiMessageSquare,
  FiRefreshCw,
  FiStar,
  FiUsers,
} from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { useVintraLanguage } from '@/lib/i18n'
import {
  getBusinessFeedback,
  getSupportChats,
  getSupportTasks,
} from '@/lib/chat.service'
import type {
  BusinessFeedback,
  SupportChatSession,
  SupportTask,
} from '@/types/database'

type Destination =
  'chats' | 'tasks' | 'feedback' | 'widgets' | 'users' | 'analytics'
type Props = {
  selectedWidgetKey: string
  onNavigate: (tab: Destination, itemId?: string) => void
  showTutorial: boolean
  onStartTutorial: () => void
}

export default function AdminOverviewPanel({
  selectedWidgetKey,
  onNavigate,
  showTutorial,
  onStartTutorial,
}: Props) {
  const { dbUser, business } = useAuth()
  const { language } = useVintraLanguage()
  const no = language === 'no'
  const locale = no ? 'nb-NO' : 'en-GB'
  const [data, setData] = useState<{
    chats: SupportChatSession[]
    tasks: SupportTask[]
    feedback: BusinessFeedback[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    if (!dbUser?.businessId) return
    setLoading(true)
    setError(false)
    Promise.all([
      getSupportChats(dbUser.businessId),
      getSupportTasks(dbUser.businessId),
      getBusinessFeedback(dbUser.businessId),
    ])
      .then(([chats, tasks, feedback]) => {
        if (cancelled) return
        setData({ chats, tasks, feedback })
        setUpdatedAt(new Date())
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [dbUser?.businessId, revision])

  const inWidget = (item: { widgetKey?: string }) =>
    !selectedWidgetKey || item.widgetKey === selectedWidgetKey
  const chats = (data?.chats || []).filter(inWidget)
  const tasks = (data?.tasks || []).filter(inWidget)
  const feedback = (data?.feedback || []).filter(inWidget)
  const waiting = chats.filter((chat) => chat.status === 'needs-human')
  const open = chats.filter((chat) =>
    ['needs-human', 'open'].includes(chat.status),
  )
  const unfinished = tasks.filter((task) => task.status !== 'done')
  const average = feedback.length
    ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length
    : null
  const firstName = dbUser?.displayName?.trim().split(/\s+/)[0]
  const now = updatedAt || new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6 + index,
    )
    const next = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    )
    return {
      date,
      count: chats.filter(
        (chat) =>
          new Date(chat.createdAt) >= date && new Date(chat.createdAt) < next,
      ).length,
    }
  })
  const peak = Math.max(1, ...days.map((day) => day.count))
  const metrics = [
    {
      label: no ? 'Åpne samtaler' : 'Open conversations',
      value: open.length,
      detail: no
        ? `${waiting.length} venter på svar`
        : `${waiting.length} waiting for a reply`,
      icon: FiMessageSquare,
      tab: 'chats' as const,
      tone: 'sage',
    },
    {
      label: no ? 'Oppgaver å følge opp' : 'Tasks to follow up',
      value: unfinished.length,
      detail: no
        ? 'Åpne, pågående og blokkerte'
        : 'Open, in progress and blocked',
      icon: FiCheckSquare,
      tab: 'tasks' as const,
      tone: 'sand',
    },
    {
      label: no ? 'Kundetilfredshet' : 'Customer satisfaction',
      value:
        average?.toLocaleString(locale, { maximumFractionDigits: 1 }) || '—',
      detail: no
        ? `${feedback.length} tilbakemeldinger`
        : `${feedback.length} reviews`,
      icon: FiStar,
      tab: 'feedback' as const,
      tone: 'lavender',
    },
    {
      label: no ? 'Chat-widgets' : 'Chat widgets',
      value: business?.chatWidgets?.length || 0,
      detail: no ? 'I bedriften din' : 'In your business',
      icon: FiLayers,
      tab: 'widgets' as const,
      tone: 'blue',
    },
  ]
  const statusLabel = (status: SupportChatSession['status']) =>
    ({
      'needs-human': no ? 'Venter på svar' : 'Waiting',
      open: no ? 'Pågående' : 'In progress',
      'ai-active': no ? 'Hos AI' : 'With AI',
      closed: no ? 'Avsluttet' : 'Closed',
    })[status]
  const unavailable = !data || error

  return (
    <div className="adminOverview">
      <div className="adminPageHeading">
        <div>
          <span className="adminEyebrow">
            {no ? 'DITT KONTROLLSENTER' : 'YOUR CONTROL CENTRE'}
          </span>
          <h1>
            {no ? 'Godt å se deg' : 'Good to see you'}
            {firstName ? `, ${firstName}` : ''}
            <span className="adminHeadingDot">.</span>
          </h1>
          <p>
            {no
              ? 'Her er oversikten. Ta tak i det som trenger deg.'
              : 'Your workspace at a glance. Focus on what needs you.'}
          </p>
        </div>
        <div className="adminHeadingActions">
          <button
            className="adminIconButton"
            onClick={refresh}
            disabled={loading}
            title={no ? 'Oppdater oversikten' : 'Refresh overview'}
            aria-label={no ? 'Oppdater oversikten' : 'Refresh overview'}
          >
            <FiRefreshCw className={loading ? 'adminRefreshing' : ''} />
          </button>
          <button className="primaryBtn" onClick={() => onNavigate('chats')}>
            <FiMessageSquare />
            {no ? 'Åpne innboksen' : 'Open inbox'}
            <FiArrowUpRight />
          </button>
        </div>
      </div>
      {error && (
        <div className="adminOverviewError" role="alert">
          {no
            ? 'Kunne ikke hente oversikten. Prøv å oppdatere.'
            : 'Could not load your overview. Try refreshing.'}
          <button onClick={refresh}>{no ? 'Prøv igjen' : 'Try again'}</button>
        </div>
      )}
      <div className="adminMetricGrid" aria-busy={loading}>
        {metrics.map(({ label, value, detail, icon: Icon, tab, tone }) => (
          <button
            className="adminMetric"
            key={tab}
            onClick={() => onNavigate(tab)}
          >
            <span className="adminMetricTop">
              <span>{label}</span>
              <span className={`adminMetricIcon ${tone}`}>
                <Icon />
              </span>
            </span>
            <strong>
              {tab !== 'widgets' && unavailable ? '—' : value}
              {tab === 'feedback' && average !== null && !unavailable && (
                <small>/ 5</small>
              )}
            </strong>
            <span className="adminMetricBottom">
              {tab !== 'widgets' && unavailable
                ? loading
                  ? no
                    ? 'Henter data …'
                    : 'Loading …'
                  : no
                    ? 'Data utilgjengelig'
                    : 'Data unavailable'
                : detail}
              <FiArrowUpRight />
            </span>
          </button>
        ))}
      </div>
      <div className="adminOverviewMiddle">
        <section className="adminOverviewCard adminActivityCard">
          <div className="adminCardHeading">
            <div>
              <span className="adminEyebrow">
                {no ? 'AKTIVITET' : 'ACTIVITY'}
              </span>
              <h2>{no ? 'Samtaler denne uken' : 'Conversations this week'}</h2>
            </div>
            <span className="adminPeriod">
              {no ? 'Siste 7 dager' : 'Last 7 days'}
            </span>
          </div>
          <div className="adminActivitySummary">
            <strong>
              {unavailable
                ? '—'
                : days.reduce((sum, day) => sum + day.count, 0)}
            </strong>
            <span>
              {no
                ? 'samtaler i valgt widget'
                : 'conversations in the selected widget'}
            </span>
          </div>
          <div
            className="adminActivityChart"
            role="img"
            aria-label={
              unavailable
                ? no
                  ? 'Aktivitetsdata utilgjengelig'
                  : 'Activity data unavailable'
                : days
                    .map(
                      (day) =>
                        `${day.date.toLocaleDateString(locale)}: ${day.count}`,
                    )
                    .join(', ')
            }
          >
            {days.map((day, index) => (
              <div
                className={`adminActivityDay ${index === 6 ? 'today' : ''}`}
                key={index}
                title={
                  unavailable
                    ? ''
                    : `${day.date.toLocaleDateString(locale)} · ${day.count}`
                }
              >
                <div className="adminActivityTrack">
                  <div
                    className="adminActivityBar"
                    style={{
                      height: `${unavailable ? 0 : (day.count / peak) * 100}%`,
                    }}
                  >
                    {day.count > 0 && !unavailable && <span>{day.count}</span>}
                  </div>
                </div>
                <span>
                  {day.date
                    .toLocaleDateString(locale, { weekday: 'short' })
                    .replace('.', '')}
                </span>
              </div>
            ))}
          </div>
          <div className="adminCardFooter">
            <span>
              <span className="adminLegendDot" />
              {no ? 'Registrerte samtaler' : 'Recorded conversations'}
            </span>
            <button
              className="adminTextButton"
              onClick={() => onNavigate('analytics')}
            >
              {no ? 'Se analyse' : 'View analytics'}
              <FiArrowRight />
            </button>
          </div>
        </section>
        <section className="adminFocusCard">
          <span className="adminFocusIcon">
            <FiCheckSquare />
          </span>
          <span className="adminEyebrow">{no ? 'NESTE STEG' : 'UP NEXT'}</span>
          <h2>
            {unavailable
              ? no
                ? 'Plass til god oppfølging.'
                : 'Room for thoughtful support.'
              : waiting.length
                ? no
                  ? `${waiting.length} samtaler trenger et menneske.`
                  : `${waiting.length} conversations need a human.`
                : no
                  ? 'Ingen kunder venter på svar.'
                  : 'No customers waiting for a reply.'}
          </h2>
          <p>
            {no
              ? 'En liten oppfølging kan gjøre en stor forskjell. Hold samtalen i gang fra innboksen.'
              : 'A thoughtful follow-up can make all the difference. Keep the conversation going from your inbox.'}
          </p>
          <button onClick={() => onNavigate('chats')}>
            {no ? 'Til samtalene' : 'Go to conversations'}
            <FiArrowUpRight />
          </button>
          <div className="adminFocusDecoration" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>
      </div>
      <div className="adminOverviewLower">
        <section className="adminOverviewCard">
          <div className="adminCardHeading">
            <div>
              <h2>{no ? 'Siste samtaler' : 'Recent conversations'}</h2>
              <p>
                {no
                  ? 'De siste henvendelsene til teamet.'
                  : 'The latest conversations with your team.'}
              </p>
            </div>
            <button
              className="adminTextButton"
              onClick={() => onNavigate('chats')}
            >
              {no ? 'Se alle' : 'View all'}
              <FiArrowRight />
            </button>
          </div>
          <div className="adminRecentList" aria-busy={loading}>
            {!error &&
              chats.slice(0, 4).map((chat) => (
                <button
                  className="adminRecentRow"
                  key={chat.id}
                  onClick={() => onNavigate('chats', chat.id)}
                >
                  <span className="adminContactAvatar">
                    {(chat.visitorName || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="adminRecentCopy">
                    <strong>
                      {chat.visitorName || (no ? 'Besøkende' : 'Visitor')}
                    </strong>
                    <span>
                      {chat.preview ||
                        (no ? 'Åpne samtalen' : 'Open conversation')}
                    </span>
                  </span>
                  <span className="adminRecentMeta">
                    <span className={`adminStatusPill ${chat.status}`}>
                      {statusLabel(chat.status)}
                    </span>
                    <time dateTime={new Date(chat.updatedAt).toISOString()}>
                      {new Date(chat.updatedAt).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </time>
                  </span>
                </button>
              ))}
            {(error || !chats.length) && (
              <div className="adminOverviewEmpty">
                <FiMessageSquare />
                <strong>
                  {loading
                    ? no
                      ? 'Henter samtaler …'
                      : 'Loading conversations …'
                    : error
                      ? no
                        ? 'Samtaler kunne ikke hentes'
                        : 'Could not load conversations'
                      : no
                        ? 'Her starter samtalene'
                        : 'Conversations start here'}
                </strong>
                <p>
                  {no
                    ? 'Kundehenvendelser fra widgeten din vises her.'
                    : 'Customer conversations from your widget will appear here.'}
                </p>
              </div>
            )}
          </div>
        </section>
        <section className="adminOverviewCard">
          <div className="adminCardHeading">
            <div>
              <h2>{no ? 'På arbeidslisten' : 'On your list'}</h2>
              <p>
                {no
                  ? 'Oppgaver som venter på oppfølging.'
                  : 'Tasks ready for a follow-up.'}
              </p>
            </div>
            <button
              className="adminTextButton"
              onClick={() => onNavigate('tasks')}
              aria-label={no ? 'Se alle oppgaver' : 'View all tasks'}
            >
              <FiArrowUpRight />
            </button>
          </div>
          <div className="adminOverviewTaskList">
            {!error &&
              unfinished.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  className="adminOverviewTask"
                  onClick={() => onNavigate('tasks', task.id)}
                >
                  <span className="adminTaskTick">
                    <FiClock />
                  </span>
                  <span>
                    <strong>{task.title}</strong>
                    <small>
                      {task.categoryName || (no ? 'Generelt' : 'General')}
                    </small>
                  </span>
                  <span
                    className={`adminPriorityDot ${task.priority}`}
                    title={task.priority}
                  />
                </button>
              ))}
            {(error || !unfinished.length) && (
              <div className="adminOverviewEmpty">
                <FiCheck />
                <strong>
                  {loading
                    ? no
                      ? 'Henter oppgaver …'
                      : 'Loading tasks …'
                    : error
                      ? no
                        ? 'Oppgaver kunne ikke hentes'
                        : 'Could not load tasks'
                      : no
                        ? 'Arbeidslisten er tom'
                        : 'Your list is clear'}
                </strong>
                <p>
                  {no
                    ? 'Lag en oppgave når noe trenger litt ekstra oppmerksomhet.'
                    : 'Create a task when something needs a little extra attention.'}
                </p>
              </div>
            )}
          </div>
          <button
            className="adminTaskListLink"
            onClick={() => onNavigate('tasks')}
          >
            {no ? 'Åpne oppgaver' : 'Open tasks'}
            <FiArrowRight />
          </button>
        </section>
      </div>
      <div className="adminQuickLinks">
        <button onClick={() => onNavigate('widgets')}>
          <FiLayers />
          <span>
            <strong>
              {no ? 'Gjør widgeten til din' : 'Make your widget yours'}
            </strong>
            <small>
              {no
                ? 'Design, innhold og AI-assistent'
                : 'Design, content and AI assistant'}
            </small>
          </span>
          <FiArrowUpRight />
        </button>
        <button onClick={() => onNavigate('users')}>
          <FiUsers />
          <span>
            <strong>
              {no ? 'Et godt team, samlet' : 'A great team, together'}
            </strong>
            <small>
              {no
                ? 'Administrer medlemmer og tilganger'
                : 'Manage members and access'}
            </small>
          </span>
          <FiArrowUpRight />
        </button>
        <button onClick={onStartTutorial}>
          <FiLayers />
          <span>
            <strong>
              {showTutorial
                ? no
                  ? 'Ny her? Vi viser deg rundt'
                  : 'New here? Let us show you around'
                : no
                  ? 'Bli kjent med Vintra'
                  : 'Get to know Vintra'}
            </strong>
            <small>
              {no
                ? 'En kort guide til arbeidsområdet'
                : 'A short guide to your workspace'}
            </small>
          </span>
          <FiArrowUpRight />
        </button>
      </div>
      <footer className="adminOverviewFooter">
        <span>Vintra · {business?.name}</span>
        <span>
          {updatedAt
            ? `${no ? 'Sist oppdatert' : 'Last updated'} ${updatedAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
            : no
              ? 'Oversikt for valgt widget'
              : 'Overview for selected widget'}
        </span>
      </footer>
    </div>
  )
}
