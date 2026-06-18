'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import {
  FiBriefcase,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiGitBranch,
  FiMail,
  FiShield,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { getBusinessUsers, updateUserRole } from '@/lib/auth.service'
import { createInvitation, getBusinessInvitations } from '@/lib/invitation.service'
import { adminUsersI18n, useVintraLanguage } from '@/lib/i18n'
import {
  getDailyConversationCount,
  getPlanLabel,
  getPlanLimits,
  getTodayUsageKey,
} from '@/lib/subscription'
import type { BusinessInvitation, BusinessUser, UserRole } from '@/types/database'
import AdminDropdown from './AdminDropdown'

declare global {
  interface Window {
    google?: any
  }
}

type OrgRole = Exclude<UserRole, 'user'>

type OrgUser = BusinessUser & {
  managerId?: string | null
}

type RoleTheme = {
  color: string
  soft: string
  border: string
  text: string
}

type OrgChartNode = {
  id: string
  parentId: string
  type: 'root' | 'user' | 'invite' | 'cluster'
  userId?: string
  parentKey?: string
  role?: OrgRole
  html: string
  tooltip: string
}

const ROOT_NODE_ID = 'root'
const COLLAPSE_LIMIT = 4

const ROLE_THEMES: Record<OrgRole, RoleTheme> = {
  admin: {
    color: '#ef4444',
    soft: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.28)',
    text: '#991b1b',
  },
  manager: {
    color: '#8b5cf6',
    soft: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.28)',
    text: '#6d28d9',
  },
  support: {
    color: '#22c55e',
    soft: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.28)',
    text: '#15803d',
  },
  viewer: {
    color: '#3b82f6',
    soft: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.28)',
    text: '#1d4ed8',
  },
}

function normalizeRole(role: UserRole): OrgRole {
  return role === 'user' ? 'viewer' : role
}

function roleWeight(role: UserRole) {
  switch (normalizeRole(role)) {
    case 'admin':
      return 4
    case 'manager':
      return 3
    case 'support':
      return 2
    case 'viewer':
    default:
      return 1
  }
}

function roleLabel(
  role: UserRole,
  text: (typeof adminUsersI18n)[keyof typeof adminUsersI18n]
) {
  switch (role) {
    case 'admin':
      return text.roles.admin.label
    case 'manager':
      return text.roles.manager.label
    case 'support':
      return text.roles.support.label
    case 'viewer':
    case 'user':
    default:
      return text.roles.viewer.label
  }
}

function formatDate(value: Date | undefined, unknownLabel: string) {
  if (!value) return unknownLabel
  return new Date(value).toLocaleString()
}

function buildInviteLink(invite: BusinessInvitation) {
  if (typeof window === 'undefined') return ''
  const url = new URL('/invite', window.location.origin)
  url.searchParams.set('token', invite.id)
  url.searchParams.set('business', invite.businessId)
  return url.toString()
}

function getUserInitials(user: BusinessUser) {
  const source = user.displayName || user.email || '?'

  if (source.includes('@')) {
    return source.slice(0, 2).toUpperCase()
  }

  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getUserName(user: BusinessUser) {
  return user.displayName || user.email || 'Unknown user'
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getLeadLabel(role: OrgRole) {
  switch (role) {
    case 'admin':
      return 'Workspace lead'
    case 'manager':
      return 'Team lead'
    case 'support':
      return 'Support lead'
    case 'viewer':
    default:
      return 'Group lead'
  }
}

function loadGoogleCharts() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.charts) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-orgchart="true"]')
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
    script.dataset.googleOrgchart = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Charts failed to load'))
    document.head.appendChild(script)
  })
}

function createUserNodeHtml({
  user,
  subtitle,
  role,
  isLead,
}: {
  user: OrgUser
  subtitle: string
  role: OrgRole
  isLead: boolean
}) {
  const theme = ROLE_THEMES[role]

  return `
    <div class="vintra-org-node" style="border-color:${theme.border};background:linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96));box-shadow:0 14px 28px rgba(15,23,42,0.08);">
      <div class="vintra-org-node-accent" style="background:${theme.color};"></div>
      <div class="vintra-org-node-head">
        <div class="vintra-org-node-avatar" style="background:${theme.color};">${escapeHtml(getUserInitials(user))}</div>
        <div class="vintra-org-node-copy">
          <strong>${escapeHtml(getUserName(user))}</strong>
          <span>${escapeHtml(user.email)}</span>
        </div>
      </div>
      <div class="vintra-org-node-meta">
        <em style="color:${theme.text};background:${theme.soft};">${escapeHtml(
          isLead ? getLeadLabel(role) : roleLabel(user.role, adminUsersI18n.en)
        )}</em>
        <small>${escapeHtml(subtitle)}</small>
      </div>
    </div>
  `
}

function createInviteNodeHtml(invite: BusinessInvitation, text: string) {
  return `
    <div class="vintra-org-node vintra-org-node-pending">
      <div class="vintra-org-node-accent vintra-org-node-accent-pending"></div>
      <div class="vintra-org-node-head">
        <div class="vintra-org-node-avatar vintra-org-node-avatar-pending">...</div>
        <div class="vintra-org-node-copy">
          <strong>${escapeHtml(invite.email)}</strong>
          <span>${escapeHtml(text)}</span>
        </div>
      </div>
    </div>
  `
}

function createClusterNodeHtml(title: string, count: number) {
  return `
    <div class="vintra-org-node vintra-org-node-cluster">
      <div class="vintra-org-node-accent vintra-org-node-accent-cluster"></div>
      <div class="vintra-org-node-copy">
        <strong>${escapeHtml(title)}</strong>
        <span>${count} hidden people</span>
      </div>
    </div>
  `
}

function createRootNodeHtml(name: string) {
  return `
    <div class="vintra-org-root">
      <strong>${escapeHtml(name)}</strong>
      <span>Organization map</span>
    </div>
  `
}

export default function AdminUserManagementPanel() {
  const { dbUser, business, refreshBusiness } = useAuth()
  const { language } = useVintraLanguage()
  const text = adminUsersI18n[language]
  const chartRef = useRef<HTMLDivElement | null>(null)

  const [users, setUsers] = useState<OrgUser[]>([])
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('viewer')
  const [savingInvite, setSavingInvite] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [managerMap, setManagerMap] = useState<Record<string, string | null>>({})
  const [invitePanelOpen, setInvitePanelOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const plan = business?.chatWidgetConfig?.plan || 'free'
  const planLimits = getPlanLimits(plan)
  const todayKey = getTodayUsageKey()
  const todayConversationCount = getDailyConversationCount(business?.chatAnalytics, new Date())

  const dailyConversationLimitReached =
    planLimits.maxDailyConversations !== null &&
    todayConversationCount >= planLimits.maxDailyConversations

  const memberLimitReached =
    planLimits.maxTeamMembers !== null && users.length >= planLimits.maxTeamMembers

  const inviteLocked = memberLimitReached

  const roleOptions: Array<{
    value: OrgRole
    label: string
    description: string
  }> = [
    {
      value: 'admin',
      label: text.roles.admin.label,
      description: text.roles.admin.description,
    },
    {
      value: 'manager',
      label: text.roles.manager.label,
      description: text.roles.manager.description,
    },
    {
      value: 'support',
      label: text.roles.support.label,
      description: text.roles.support.description,
    },
    {
      value: 'viewer',
      label: text.roles.viewer.label,
      description: text.roles.viewer.description,
    },
  ]

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const roleDiff = roleWeight(b.role) - roleWeight(a.role)
      if (roleDiff !== 0) return roleDiff

      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return aTime - bTime
    })
  }, [users])

  const usersWithManagers = useMemo(() => {
    return sortedUsers.map((user) => ({
      ...user,
      managerId: managerMap[user.id] ?? user.managerId ?? null,
    }))
  }, [managerMap, sortedUsers])

  const roleLeadIds = useMemo(() => {
    const leads: Partial<Record<OrgRole, string>> = {}

    for (const role of ['admin', 'manager', 'support', 'viewer'] as OrgRole[]) {
      const firstUser = usersWithManagers.find((user) => normalizeRole(user.role) === role)
      if (firstUser) {
        leads[role] = firstUser.id
      }
    }

    return leads
  }, [usersWithManagers])

  const selectedUser = useMemo(() => {
    return usersWithManagers.find((user) => user.id === selectedUserId) || usersWithManagers[0] || null
  }, [selectedUserId, usersWithManagers])

  const selectedManager = useMemo(() => {
    if (!selectedUser?.managerId) return null
    return usersWithManagers.find((user) => user.id === selectedUser.managerId) || null
  }, [selectedUser, usersWithManagers])

  const possibleManagers = useMemo(() => {
    if (!selectedUser) return []
    return usersWithManagers.filter((user) => user.id !== selectedUser.id)
  }, [selectedUser, usersWithManagers])

  function getFallbackParentId(role: OrgRole, nodeId: string) {
    if (role === 'admin') {
      const adminLeadId = roleLeadIds.admin
      return adminLeadId && adminLeadId !== nodeId ? adminLeadId : ROOT_NODE_ID
    }

    if (role === 'manager') {
      const managerLeadId = roleLeadIds.manager
      if (managerLeadId && managerLeadId !== nodeId) return managerLeadId
      return roleLeadIds.admin || ROOT_NODE_ID
    }

    if (role === 'support') {
      const supportLeadId = roleLeadIds.support
      if (supportLeadId && supportLeadId !== nodeId) return supportLeadId
      return roleLeadIds.manager || roleLeadIds.admin || ROOT_NODE_ID
    }

    const viewerLeadId = roleLeadIds.viewer
    if (viewerLeadId && viewerLeadId !== nodeId) return viewerLeadId
    return roleLeadIds.manager || roleLeadIds.admin || ROOT_NODE_ID
  }

  const collapsibleGroups = useMemo(() => {
    const childrenByParent = new Map<string, number>()

    for (const user of usersWithManagers) {
      const role = normalizeRole(user.role)
      const parentId = user.managerId || getFallbackParentId(role, user.id)
      childrenByParent.set(parentId, (childrenByParent.get(parentId) || 0) + 1)
    }

    const groups = Array.from(childrenByParent.entries())
      .filter(([, count]) => count > COLLAPSE_LIMIT)
      .map(([parentId, count]) => {
        const parentUser = usersWithManagers.find((user) => user.id === parentId) || null
        return {
          key: parentId,
          count,
          label: parentUser ? getUserName(parentUser) : business?.name || 'Workspace',
        }
      })

    return groups
  }, [business?.name, usersWithManagers])

  const chartNodes = useMemo<OrgChartNode[]>(() => {
    const baseNodes: OrgChartNode[] = [
      {
        id: ROOT_NODE_ID,
        parentId: '',
        type: 'root',
        html: createRootNodeHtml(business?.name || text.workspace),
        tooltip: business?.name || text.workspace,
      },
    ]

    const childNodes: OrgChartNode[] = usersWithManagers.map((user) => {
      const role = normalizeRole(user.role)
      const isLead = roleLeadIds[role] === user.id
      const subtitle = user.managerId
        ? 'Reports inside the team'
        : isLead
          ? 'Leads this role group'
          : 'Part of the workspace tree'

      return {
        id: user.id,
        parentId: user.managerId || getFallbackParentId(role, user.id),
        type: 'user',
        userId: user.id,
        role,
        html: createUserNodeHtml({
          user,
          subtitle,
          role,
          isLead,
        }),
        tooltip: `${getUserName(user)} - ${roleLabel(user.role, text)}`,
      }
    })

    const inviteNodes: OrgChartNode[] = invitations
      .filter((invite) => invite.status === 'pending')
      .map((invite) => {
        const role = normalizeRole(invite.role)
        return {
          id: `invite:${invite.id}`,
          parentId: getFallbackParentId(role, `invite:${invite.id}`),
          type: 'invite',
          role,
          html: createInviteNodeHtml(invite, `Pending ${roleLabel(invite.role, text).toLowerCase()} invite`),
          tooltip: `${invite.email} - pending invite`,
        }
      })

    const rawChildren = [...childNodes, ...inviteNodes]
    const childrenByParent = new Map<string, OrgChartNode[]>()

    rawChildren.forEach((node) => {
      const key = node.parentId || ROOT_NODE_ID
      const current = childrenByParent.get(key) || []
      current.push(node)
      childrenByParent.set(key, current)
    })

    const clusteredChildren: OrgChartNode[] = []

    childrenByParent.forEach((nodes, parentId) => {
      const sortedNodes = [...nodes].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'user' ? -1 : 1
        return a.tooltip.localeCompare(b.tooltip)
      })

      if (sortedNodes.length <= COLLAPSE_LIMIT || expandedGroups[parentId]) {
        clusteredChildren.push(...sortedNodes)
        return
      }

      const visible = sortedNodes.slice(0, COLLAPSE_LIMIT - 1)
      const hidden = sortedNodes.slice(COLLAPSE_LIMIT - 1)
      const parentUser = usersWithManagers.find((user) => user.id === parentId) || null
      const clusterId = `cluster:${parentId}`

      clusteredChildren.push(...visible)
      clusteredChildren.push({
        id: clusterId,
        parentId,
        parentKey: parentId,
        type: 'cluster',
        html: createClusterNodeHtml(
          parentUser ? `${getUserName(parentUser)} team` : `${business?.name || 'Workspace'} team`,
          hidden.length
        ),
        tooltip: 'Click to expand this grouped branch',
      })
    })

    return [...baseNodes, ...clusteredChildren]
  }, [business?.name, expandedGroups, invitations, roleLeadIds, text, usersWithManagers])

  useEffect(() => {
    let mounted = true

    async function loadData() {
      if (!dbUser?.businessId) return

      await refreshBusiness()

      const [nextUsers, nextInvites] = await Promise.all([
        getBusinessUsers(dbUser.businessId),
        getBusinessInvitations(dbUser.businessId),
      ])

      if (!mounted) return

      setUsers(nextUsers as OrgUser[])
      setInvitations(nextInvites as BusinessInvitation[])
      setLoading(false)
    }

    void loadData()
    const interval = window.setInterval(loadData, 5000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [dbUser?.businessId, refreshBusiness])

  useEffect(() => {
    if (!dbUser?.businessId || typeof window === 'undefined') return

    const rawValue = window.localStorage.getItem(`vintra-user-managers-${dbUser.businessId}`)

    if (!rawValue) return

    try {
      setManagerMap(JSON.parse(rawValue) as Record<string, string | null>)
    } catch {
      setManagerMap({})
    }
  }, [dbUser?.businessId])

  useEffect(() => {
    if (!selectedUserId && usersWithManagers.length > 0) {
      setSelectedUserId(usersWithManagers[0].id)
    }
  }, [selectedUserId, usersWithManagers])

  useEffect(() => {
    let mounted = true
    let selectionListener: any

    async function drawChart() {
      if (!chartRef.current) return

      await loadGoogleCharts()
      if (!mounted || !window.google?.charts) return

      await new Promise<void>((resolve) => {
        window.google.charts.load('current', { packages: ['orgchart'] })
        window.google.charts.setOnLoadCallback(() => resolve())
      })

      if (!mounted || !chartRef.current || !window.google?.visualization) return

      const data = new window.google.visualization.DataTable()
      data.addColumn('string', 'Name')
      data.addColumn('string', 'Manager')
      data.addColumn('string', 'ToolTip')

      const rows = chartNodes.map((node) => [
        { v: node.id, f: node.html },
        node.parentId,
        node.tooltip,
      ])

      data.addRows(rows)

      const chart = new window.google.visualization.OrgChart(chartRef.current)
      selectionListener = window.google.visualization.events.addListener(chart, 'select', () => {
        const selection = chart.getSelection()
        if (!selection.length) return

        const row = selection[0]?.row
        if (typeof row !== 'number') return

        const node = chartNodes[row]
        if (!node) return

        if (node.type === 'user' && node.userId) {
          setSelectedUserId(node.userId)
          return
        }

        if (node.type === 'cluster' && node.parentKey) {
          setExpandedGroups((current) => ({
            ...current,
            [node.parentKey!]: true,
          }))
          return
        }

        if (node.type === 'invite') {
          setInvitePanelOpen(true)
        }
      })

      chart.draw(data, {
        allowHtml: true,
        allowCollapse: false,
        size: 'medium',
      })
    }

    void drawChart()

    return () => {
      mounted = false
      if (selectionListener && window.google?.visualization?.events) {
        window.google.visualization.events.removeListener(selectionListener)
      }
    }
  }, [chartNodes])

  function persistManagerMap(nextMap: Record<string, string | null>) {
    setManagerMap(nextMap)

    if (!dbUser?.businessId || typeof window === 'undefined') return
    window.localStorage.setItem(`vintra-user-managers-${dbUser.businessId}`, JSON.stringify(nextMap))
  }

  function wouldCreateCycle(userId: string, nextManagerId: string | null) {
    if (!nextManagerId) return false
    let cursor: string | null = nextManagerId
    const visited = new Set<string>()

    while (cursor) {
      if (cursor === userId) return true
      if (visited.has(cursor)) return false

      visited.add(cursor)
      cursor =
        managerMap[cursor] ??
        usersWithManagers.find((user) => user.id === cursor)?.managerId ??
        null
    }

    return false
  }

  function handleManagerChange(userId: string, managerId: string) {
    const nextManagerId = managerId === 'none' ? null : managerId

    if (wouldCreateCycle(userId, nextManagerId)) {
      setStatusMessage('This would create a loop in the organization map.')
      return
    }

    persistManagerMap({
      ...managerMap,
      [userId]: nextManagerId,
    })

    setStatusMessage('Reporting line updated locally.')
  }

  async function handleInvite() {
    if (!dbUser?.businessId || !dbUser?.id || !inviteEmail.trim()) return

    setSavingInvite(true)
    setStatusMessage('')

    try {
      const result = await createInvitation(
        dbUser.businessId,
        inviteEmail.trim().toLowerCase(),
        inviteRole,
        dbUser.id
      )

      if (!result.success) {
        setStatusMessage(result.message || text.inviteFailed)
        return
      }

      setInviteEmail('')
      setInvitePanelOpen(true)

      const [nextUsers, nextInvites] = await Promise.all([
        getBusinessUsers(dbUser.businessId),
        getBusinessInvitations(dbUser.businessId),
      ])

      setUsers(nextUsers as OrgUser[])
      setInvitations(nextInvites as BusinessInvitation[])
      await refreshBusiness()
      setStatusMessage(text.inviteCreated)
    } finally {
      setSavingInvite(false)
    }
  }

  async function handleRoleChange(userId: string, role: OrgRole) {
    if (!dbUser?.businessId) return

    setUpdatingUserId(userId)

    try {
      await updateUserRole(dbUser.businessId, userId, role)
      const nextUsers = await getBusinessUsers(dbUser.businessId)
      setUsers(nextUsers as OrgUser[])

      if (userId === dbUser.id) {
        await refreshBusiness()
      }

      setStatusMessage('Role updated.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function copyInviteLink(invite: BusinessInvitation) {
    const link = buildInviteLink(invite)
    if (!link) return
    await navigator.clipboard.writeText(link)
    setStatusMessage(text.inviteCopied)
  }

  if (loading) {
    return (
      <PageShell>
        <OrgChartGlobalStyle />
        <PageHero>
          <PageTitleBlock>
            <PageEyebrow>
              <FiUsers />
              Workspace users
            </PageEyebrow>
            <PageTitle>{text.title}</PageTitle>
            <PageDescription>{text.loading}</PageDescription>
          </PageTitleBlock>
        </PageHero>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <OrgChartGlobalStyle />

      <PageHero>
        <PageTitleBlock>
          <PageEyebrow>
            <FiUsers />
            Workspace users
          </PageEyebrow>
          <PageTitle>Brukere</PageTitle>
          <PageDescription>
            Administrer brukere, roller, ventende invitasjoner og hele organisasjonskartet fra ett sted.
          </PageDescription>
        </PageTitleBlock>

        <WorkspaceCard>
          <span>Workspace</span>
          <strong>{business?.name || text.workspace}</strong>
          <small>
            {usersWithManagers.length} {text.users}
          </small>
        </WorkspaceCard>
      </PageHero>

      <StatsGrid>
        <StatCard $alert={false}>
          <span>{text.plan}</span>
          <strong>{getPlanLabel(plan)}</strong>
          <small>
            {planLimits.maxDailyConversations
              ? `${planLimits.maxDailyConversations} ${text.conversationsDay}`
              : text.unlimitedConversations}
          </small>
        </StatCard>

        <StatCard $alert={dailyConversationLimitReached}>
          <span>{text.today}</span>
          <strong>
            {todayConversationCount}
            {planLimits.maxDailyConversations ? ` / ${planLimits.maxDailyConversations}` : ''}
          </strong>
          <small>{dailyConversationLimitReached ? text.limitReachedToday : todayKey}</small>
        </StatCard>

        <StatCard $alert={memberLimitReached}>
          <span>{text.members}</span>
          <strong>
            {usersWithManagers.length}
            {planLimits.maxTeamMembers ? ` / ${planLimits.maxTeamMembers}` : ''}
          </strong>
          <small>
            {planLimits.maxTeamMembers ? text.teamLimitActive : text.unlimitedTeamMembers}
          </small>
        </StatCard>

        <StatCard $alert={false}>
          <span>{text.orbAccess}</span>
          <strong>{planLimits.orbAvailable ? text.enabled : text.locked}</strong>
          <small>
            {planLimits.extendedDesignOptions ? text.extendedUnlocked : text.extendedLocked}
          </small>
        </StatCard>
      </StatsGrid>

      <InviteShell>
        <InviteToggle
          type="button"
          onClick={() => setInvitePanelOpen((current) => !current)}
          aria-expanded={invitePanelOpen}
        >
          <InviteToggleCopy>
            <MiniEyebrow>
              <FiUserPlus />
              Invite flow
            </MiniEyebrow>
            <strong>Legg til ny bruker</strong>
            <span>
              Trykk her for a utvide invitasjonsskjemaet og se alle som fortsatt ikke har svart.
            </span>
          </InviteToggleCopy>
          <InviteToggleMeta>
            <PendingPill>{invitations.filter((invite) => invite.status === 'pending').length} pending</PendingPill>
            {invitePanelOpen ? <FiChevronUp /> : <FiChevronDown />}
          </InviteToggleMeta>
        </InviteToggle>

        {invitePanelOpen ? (
          <InvitePanelBody>
            <InviteForm>
              <Field>
                <span>
                  <FiMail />
                  {text.email}
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                />
              </Field>

              <Field>
                <span>
                  <FiShield />
                  {text.role}
                </span>
                <AdminDropdown
                  value={inviteRole}
                  options={roleOptions.map((role) => ({
                    value: role.value,
                    label: role.label,
                    description: role.description,
                  }))}
                  onChange={(nextValue) => setInviteRole(nextValue as OrgRole)}
                />
              </Field>

              <InviteButton
                type="button"
                onClick={handleInvite}
                disabled={savingInvite || inviteLocked}
              >
                <FiUserPlus />
                {savingInvite
                  ? text.inviting
                  : inviteLocked
                    ? text.memberLimitReached
                    : text.inviteUser}
              </InviteButton>
            </InviteForm>

            <PendingInlineList>
              {invitations.filter((invite) => invite.status === 'pending').length ? (
                invitations
                  .filter((invite) => invite.status === 'pending')
                  .map((invite) => (
                    <PendingInlineCard key={invite.id}>
                      <div>
                        <strong>{invite.email}</strong>
                        <span>{roleLabel(invite.role, text)}</span>
                        <small>{formatDate(invite.expiresAt, text.unknown)}</small>
                      </div>

                      <CopyButton type="button" onClick={() => copyInviteLink(invite)}>
                        <FiCopy />
                        {text.copyLink}
                      </CopyButton>
                    </PendingInlineCard>
                  ))
              ) : (
                <EmptyState>No pending invites right now.</EmptyState>
              )}
            </PendingInlineList>
          </InvitePanelBody>
        ) : null}
      </InviteShell>

      <MainLayout>
        <ChartCard>
          <ChartHeader>
            <div>
              <MiniEyebrow>
                <FiGitBranch />
                Organization roadmap
              </MiniEyebrow>
              <h2>Organisasjonskart</h2>
              <p>
                Admin er markert i rodt, support i gront, og invitasjoner som ikke er besvart vises nedtonet i kartet.
              </p>
            </div>

            <LegendRow>
              <LegendItem $role="admin">Admin</LegendItem>
              <LegendItem $role="manager">Manager</LegendItem>
              <LegendItem $role="support">Support</LegendItem>
              <LegendItem $role="viewer">Viewer</LegendItem>
            </LegendRow>
          </ChartHeader>

          {collapsibleGroups.length ? (
            <ClusterToolbar>
              {collapsibleGroups.map((group) => (
                <ClusterButton
                  key={group.key}
                  type="button"
                  onClick={() =>
                    setExpandedGroups((current) => ({
                      ...current,
                      [group.key]: !current[group.key],
                    }))
                  }
                >
                  {expandedGroups[group.key] ? 'Skjul gruppe' : 'Utvid gruppe'}: {group.label} ({group.count})
                </ClusterButton>
              ))}
            </ClusterToolbar>
          ) : null}

          <ChartFrame>
            <div ref={chartRef} />
          </ChartFrame>
        </ChartCard>

        <InspectorCard>
          {selectedUser ? (
            <>
              <InspectorTop>
                <InspectorAvatar $role={normalizeRole(selectedUser.role)}>
                  {getUserInitials(selectedUser)}
                </InspectorAvatar>

                <div>
                  <MiniEyebrow>
                    <FiUserCheck />
                    Selected user
                  </MiniEyebrow>
                  <h2>{getUserName(selectedUser)}</h2>
                  <p>{selectedUser.email}</p>
                </div>
              </InspectorTop>

              <InspectorRows>
                <InspectorRow>
                  <span>{text.status}</span>
                  <strong>{selectedUser.status}</strong>
                </InspectorRow>

                <InspectorRow>
                  <span>{text.joined}</span>
                  <strong>{formatDate(selectedUser.createdAt, text.unknown)}</strong>
                </InspectorRow>

                <InspectorRow>
                  <span>{text.role}</span>
                  <strong>{roleLabel(selectedUser.role, text)}</strong>
                </InspectorRow>

                <InspectorRow>
                  <span>Reports to</span>
                  <strong>{selectedManager ? getUserName(selectedManager) : 'No leader selected'}</strong>
                </InspectorRow>
              </InspectorRows>

              <InspectorField>
                <span>
                  <FiShield />
                  Change role
                </span>

                <AdminDropdown
                  value={normalizeRole(selectedUser.role)}
                  disabled={updatingUserId === selectedUser.id}
                  options={roleOptions.map((role) => ({
                    value: role.value,
                    label: role.label,
                    description: role.description,
                  }))}
                  onChange={(nextValue) => handleRoleChange(selectedUser.id, nextValue as OrgRole)}
                />
              </InspectorField>

              <InspectorField>
                <span>
                  <FiBriefcase />
                  Assign leader
                </span>

                <NativeSelect
                  value={selectedUser.managerId || 'none'}
                  onChange={(event) => handleManagerChange(selectedUser.id, event.target.value)}
                >
                  <option value="none">No leader</option>

                  {possibleManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {getUserName(manager)} - {roleLabel(manager.role, text)}
                    </option>
                  ))}
                </NativeSelect>

                <FieldHint>
                  This leader relation is saved locally for now. If you later want it permanent, we can store
                  `managerId` on the user in the database too.
                </FieldHint>
              </InspectorField>

              <PendingSection>
                <PendingSectionHeader>
                  <h3>{text.pendingInvites}</h3>
                  <span>{invitations.filter((invite) => invite.status === 'pending').length}</span>
                </PendingSectionHeader>

                <PendingSectionList>
                  {invitations.filter((invite) => invite.status === 'pending').length ? (
                    invitations
                      .filter((invite) => invite.status === 'pending')
                      .map((invite) => (
                        <PendingInviteCard key={invite.id}>
                          <div>
                            <strong>{invite.email}</strong>
                            <span>
                              {text.role}: {roleLabel(invite.role, text)}
                            </span>
                            <small>
                              {text.expires}: {formatDate(invite.expiresAt, text.unknown)}
                            </small>
                          </div>

                          <CopyButton type="button" onClick={() => copyInviteLink(invite)}>
                            <FiCopy />
                            {text.copyLink}
                          </CopyButton>
                        </PendingInviteCard>
                      ))
                  ) : (
                    <EmptyState>{text.noPendingInvites}</EmptyState>
                  )}
                </PendingSectionList>
              </PendingSection>
            </>
          ) : (
            <EmptyState>No user selected.</EmptyState>
          )}
        </InspectorCard>
      </MainLayout>

      {statusMessage ? <StatusMessage>{statusMessage}</StatusMessage> : null}
    </PageShell>
  )
}

const OrgChartGlobalStyle = createGlobalStyle`
  .google-visualization-orgchart-table {
    border-collapse: separate !important;
  }

  .google-visualization-orgchart-node,
  .google-visualization-orgchart-node-medium {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 8px !important;
  }

  .google-visualization-orgchart-lineleft,
  .google-visualization-orgchart-lineright,
  .google-visualization-orgchart-linebottom {
    border-color: rgba(148, 163, 184, 0.34) !important;
  }

  .vintra-org-root {
    min-width: 220px;
    padding: 16px 18px;
    border-radius: 22px;
    background: linear-gradient(135deg, #020617, #1e293b);
    color: #ffffff;
    text-align: left;
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.22);
  }

  .vintra-org-root strong,
  .vintra-org-root span {
    display: block;
  }

  .vintra-org-root strong {
    font-size: 1rem;
    font-weight: 900;
  }

  .vintra-org-root span {
    margin-top: 4px;
    color: rgba(255, 255, 255, 0.74);
    font-size: 0.8rem;
    font-weight: 700;
  }

  .vintra-org-node {
    position: relative;
    min-width: 230px;
    padding: 14px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 22px;
    overflow: hidden;
    text-align: left;
  }

  .vintra-org-node-pending {
    border-color: rgba(148, 163, 184, 0.22);
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.96));
    box-shadow: none;
    opacity: 0.76;
  }

  .vintra-org-node-cluster {
    border-style: dashed;
    border-color: rgba(148, 163, 184, 0.34);
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.84));
    cursor: pointer;
  }

  .vintra-org-node-accent {
    position: absolute;
    inset: 0 auto 0 0;
    width: 6px;
  }

  .vintra-org-node-accent-pending {
    background: #94a3b8;
  }

  .vintra-org-node-accent-cluster {
    background: #64748b;
  }

  .vintra-org-node-head {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
  }

  .vintra-org-node-avatar {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .vintra-org-node-avatar-pending {
    background: #94a3b8;
  }

  .vintra-org-node-copy {
    min-width: 0;
  }

  .vintra-org-node-copy strong,
  .vintra-org-node-copy span,
  .vintra-org-node-copy small {
    display: block;
  }

  .vintra-org-node-copy strong {
    color: #0f172a;
    font-size: 0.94rem;
    font-weight: 900;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vintra-org-node-copy span {
    margin-top: 4px;
    color: #64748b;
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vintra-org-node-meta {
    display: grid;
    gap: 7px;
    margin-top: 12px;
  }

  .vintra-org-node-meta em {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 0.76rem;
    font-style: normal;
    font-weight: 900;
  }

  .vintra-org-node-meta small {
    color: #94a3b8;
    font-size: 0.76rem;
    font-weight: 700;
  }
`

const PageShell = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 24px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);

  @media (max-width: 720px) {
    padding: 16px;
    border-radius: 24px;
  }
`

const PageHero = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;

  @media (max-width: 860px) {
    flex-direction: column;
  }
`

const PageTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const PageEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  width: fit-content;
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`

const PageTitle = styled.h1`
  margin: 0;
  color: #020617;
  font-size: clamp(2.1rem, 4vw, 4.2rem);
  line-height: 0.95;
  letter-spacing: -0.055em;
`

const PageDescription = styled.p`
  max-width: 760px;
  margin: 0;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.6;
`

const WorkspaceCard = styled.div`
  min-width: 220px;
  padding: 16px 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);

  span,
  small {
    display: block;
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 700;
  }

  strong {
    display: block;
    margin: 5px 0;
    color: #0f172a;
    font-size: 1.05rem;
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`

const StatCard = styled.div<{ $alert: boolean }>`
  padding: 16px;
  border: 1px solid
    ${({ $alert }) =>
      $alert ? 'rgba(239, 68, 68, 0.28)' : 'rgba(148, 163, 184, 0.16)'};
  border-radius: 20px;
  background: ${({ $alert }) =>
    $alert
      ? 'linear-gradient(180deg, rgba(254, 242, 242, 0.94), rgba(255, 255, 255, 0.94))'
      : 'rgba(255, 255, 255, 0.75)'};

  span,
  small {
    display: block;
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 700;
  }

  strong {
    display: block;
    margin: 5px 0;
    color: #0f172a;
    font-size: 1.15rem;
  }
`

const InviteShell = styled.section`
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
`

const InviteToggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
`

const InviteToggleCopy = styled.div`
  display: grid;
  gap: 6px;

  strong {
    color: #0f172a;
    font-size: 1.15rem;
  }

  span {
    color: #64748b;
    line-height: 1.5;
  }
`

const InviteToggleMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #475569;
  font-size: 1.1rem;
`

const PendingPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  color: #475569;
  font-size: 0.82rem;
  font-weight: 900;
`

const InvitePanelBody = styled.div`
  display: grid;
  gap: 16px;
  padding: 0 20px 20px;
`

const MiniEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`

const InviteForm = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 0.46fr) auto;
  gap: 10px;
  align-items: end;
  padding: 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;

  > span {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: #475569;
    font-size: 0.86rem;
    font-weight: 800;
  }

  input {
    width: 100%;
    min-height: 50px;
    padding: 0 16px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.96);
    color: #0f172a;
    outline: none;
  }

  input:focus {
    border-color: rgba(37, 99, 235, 0.32);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
  }
`

const InviteButton = styled.button`
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0 18px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #020617, #1e293b);
  color: #fff;
  font-weight: 850;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18);

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`

const PendingInlineList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
`

const PendingInlineCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 18px;
  background: rgba(241, 245, 249, 0.74);
  opacity: 0.84;

  strong,
  span,
  small {
    display: block;
  }

  strong {
    color: #334155;
    font-size: 0.92rem;
  }

  span,
  small {
    margin-top: 4px;
    color: #64748b;
    font-size: 0.82rem;
  }
`

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.7fr);
  gap: 18px;
  align-items: start;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`

const ChartCard = styled.section`
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.07), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
`

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;

  h2 {
    margin: 0.4rem 0 0;
    color: #020617;
    font-size: 1.65rem;
    letter-spacing: -0.03em;
  }

  p {
    max-width: 680px;
    margin: 0.4rem 0 0;
    color: #64748b;
    line-height: 1.55;
  }

  @media (max-width: 860px) {
    flex-direction: column;
  }
`

const LegendRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`

const LegendItem = styled.span<{ $role: OrgRole }>`
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid ${({ $role }) => ROLE_THEMES[$role].border};
  background: ${({ $role }) => ROLE_THEMES[$role].soft};
  color: ${({ $role }) => ROLE_THEMES[$role].text};
  font-size: 0.78rem;
  font-weight: 900;
`

const ClusterToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`

const ClusterButton = styled.button`
  min-height: 34px;
  padding: 0 12px;
  border: 1px dashed rgba(148, 163, 184, 0.38);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.86);
  color: #475569;
  font-size: 0.82rem;
  font-weight: 850;
  cursor: pointer;
`

const ChartFrame = styled.div`
  margin-top: 18px;
  overflow: auto;
  padding-bottom: 8px;

  > div {
    min-width: 780px;
  }
`

const InspectorCard = styled.aside`
  position: sticky;
  top: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(15, 23, 42, 0.05), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);

  @media (max-width: 1180px) {
    position: static;
  }
`

const InspectorTop = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;

  h2 {
    margin: 0.35rem 0 0;
    color: #0f172a;
    font-size: 1.35rem;
    overflow-wrap: anywhere;
  }

  p {
    margin: 0.35rem 0 0;
    color: #64748b;
    overflow-wrap: anywhere;
  }
`

const InspectorAvatar = styled.div<{ $role: OrgRole }>`
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 22px;
  background: ${({ $role }) => `linear-gradient(135deg, ${ROLE_THEMES[$role].color}, #0f172a)`};
  color: #fff;
  font-weight: 950;
  letter-spacing: 0.08em;
  box-shadow: ${({ $role }) => `0 14px 28px ${ROLE_THEMES[$role].color}33`};
`

const InspectorRows = styled.div`
  display: grid;
  gap: 10px;
`

const InspectorRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.74);

  span {
    color: #64748b;
    font-size: 0.86rem;
    font-weight: 800;
  }

  strong {
    color: #0f172a;
    font-size: 0.88rem;
    text-align: right;
    overflow-wrap: anywhere;
  }
`

const InspectorField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;

  > span {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: #475569;
    font-size: 0.88rem;
    font-weight: 900;
  }
`

const NativeSelect = styled.select`
  width: 100%;
  min-height: 50px;
  padding: 0 42px 0 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95)),
    url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  color: #0f172a;
  font-weight: 800;
  outline: none;
  appearance: none;

  &:focus {
    border-color: rgba(37, 99, 235, 0.32);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
  }
`

const FieldHint = styled.small`
  color: #94a3b8;
  font-size: 0.78rem;
  line-height: 1.45;
`

const PendingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
`

const PendingSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 1rem;
  }

  span {
    min-width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: rgba(37, 99, 235, 0.1);
    color: #1d4ed8;
    font-size: 0.8rem;
    font-weight: 950;
  }
`

const PendingSectionList = styled.div`
  display: grid;
  gap: 10px;
  max-height: 360px;
  overflow: auto;
  padding-right: 4px;
`

const PendingInviteCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 18px;
  background: rgba(241, 245, 249, 0.82);
  opacity: 0.82;

  strong,
  span,
  small {
    display: block;
    overflow-wrap: anywhere;
  }

  strong {
    color: #334155;
    font-size: 0.92rem;
  }

  span {
    margin-top: 4px;
    color: #64748b;
    font-size: 0.84rem;
  }

  small {
    margin-top: 4px;
    color: #94a3b8;
    font-size: 0.78rem;
  }
`

const CopyButton = styled.button`
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  background: #fff;
  color: #475569;
  font-weight: 850;
  cursor: pointer;

  &:hover {
    color: #0f172a;
    border-color: rgba(37, 99, 235, 0.24);
  }
`

const EmptyState = styled.div`
  padding: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.72);
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 800;
`

const StatusMessage = styled.div`
  padding: 13px 16px;
  border-radius: 16px;
  border: 1px solid rgba(34, 197, 94, 0.22);
  background: rgba(240, 253, 244, 0.9);
  color: #15803d;
  font-size: 0.9rem;
  font-weight: 850;
`
