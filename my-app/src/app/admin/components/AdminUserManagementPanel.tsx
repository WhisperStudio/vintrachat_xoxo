'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiCopy, FiMail, FiShield, FiUserPlus, FiUsers } from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { createInvitation, getBusinessInvitations } from '@/lib/invitation.service'
import { getBusinessUsers, updateUserRole } from '@/lib/auth.service'
import { adminUsersI18n, useVintraLanguage } from '@/lib/i18n'
import { getDailyConversationCount, getPlanLabel, getPlanLimits, getTodayUsageKey } from '@/lib/subscription'
import type { BusinessInvitation, BusinessUser, UserRole } from '@/types/database'
import AdminDropdown from './AdminDropdown'
import './admin-components.css'

function roleLabel(role: UserRole, text: (typeof adminUsersI18n)[keyof typeof adminUsersI18n]) {
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

export default function AdminUserManagementPanel() {
  const { dbUser, business, refreshBusiness } = useAuth()
  const { language } = useVintraLanguage()
  const text = adminUsersI18n[language]
  const [users, setUsers] = useState<BusinessUser[]>([])
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Exclude<UserRole, 'user'>>('viewer')
  const [savingInvite, setSavingInvite] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

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
  const roleOptions: Array<{ value: Exclude<UserRole, 'user'>; label: string; description: string }> = [
    { value: 'admin', label: text.roles.admin.label, description: text.roles.admin.description },
    { value: 'manager', label: text.roles.manager.label, description: text.roles.manager.description },
    { value: 'support', label: text.roles.support.label, description: text.roles.support.description },
    { value: 'viewer', label: text.roles.viewer.label, description: text.roles.viewer.description },
  ]

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin')),
    [users]
  )

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

      setUsers(nextUsers as BusinessUser[])
      setInvitations(nextInvites as BusinessInvitation[])
      setLoading(false)
    }

    void loadData()
    const interval = window.setInterval(loadData, 5000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [dbUser?.businessId])

  async function handleInvite() {
    if (!dbUser?.businessId || !dbUser?.id || !inviteEmail.trim()) return

    setSavingInvite(true)
    setStatusMessage('')

    try {
      const result = await createInvitation(dbUser.businessId, inviteEmail.trim().toLowerCase(), inviteRole, dbUser.id)

      if (!result.success) {
        setStatusMessage(result.message || text.inviteFailed)
        return
      }

      setInviteEmail('')
      await Promise.all([
        refreshBusiness(),
        (async () => {
          const [nextUsers, nextInvites] = await Promise.all([
            getBusinessUsers(dbUser.businessId),
            getBusinessInvitations(dbUser.businessId),
          ])
          setUsers(nextUsers as BusinessUser[])
          setInvitations(nextInvites as BusinessInvitation[])
        })(),
      ])
      setStatusMessage(text.inviteCreated)
    } finally {
      setSavingInvite(false)
    }
  }

  async function handleRoleChange(userId: string, role: Exclude<UserRole, 'user'>) {
    if (!dbUser?.businessId) return

    setUpdatingUserId(userId)
    try {
      await updateUserRole(dbUser.businessId, userId, role)
      const nextUsers = await getBusinessUsers(dbUser.businessId)
      setUsers(nextUsers as BusinessUser[])
      if (userId === dbUser.id) {
        await refreshBusiness()
      }
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
      <div className="infoCard adminUsersPanel">
        <h1>{text.title}</h1>
        <p>{text.loading}</p>
      </div>
    )
  }

  return (
    <div className="infoCard adminUsersPanel">
      <div className="adminUsersHero">
        <div>
          <span className="adminUsersEyebrow">
            <FiUsers /> {text.eyebrow}
          </span>
          <h1>{text.title}</h1>
          <p>{text.body}</p>
        </div>
        <div className="adminUsersMetaCard">
          <strong>{business?.name || text.workspace}</strong>
          <span>{sortedUsers.length} {text.users}</span>
        </div>
      </div>

      <div className="adminUsersQuotaRow">
        <div className={`adminUsersQuotaCard ${dailyConversationLimitReached ? 'is-alert' : ''}`}>
          <span>{text.plan}</span>
          <strong>{getPlanLabel(plan)}</strong>
          <small>{planLimits.maxDailyConversations ? `${planLimits.maxDailyConversations} ${text.conversationsDay}` : text.unlimitedConversations}</small>
        </div>

        <div className={`adminUsersQuotaCard ${dailyConversationLimitReached ? 'is-alert' : ''}`}>
          <span>{text.today}</span>
          <strong>
            {todayConversationCount}
            {planLimits.maxDailyConversations ? ` / ${planLimits.maxDailyConversations}` : ''}
          </strong>
          <small>
            {dailyConversationLimitReached ? text.limitReachedToday : `${text.todaysUsage} - ${todayKey}`}
          </small>
        </div>

        <div className={`adminUsersQuotaCard ${memberLimitReached ? 'is-alert' : ''}`}>
          <span>{text.members}</span>
          <strong>
            {sortedUsers.length}
            {planLimits.maxTeamMembers ? ` / ${planLimits.maxTeamMembers}` : ''}
          </strong>
          <small>
            {planLimits.maxTeamMembers ? text.teamLimitActive : text.unlimitedTeamMembers}
          </small>
        </div>

        <div className="adminUsersQuotaCard">
          <span>{text.orbAccess}</span>
          <strong>{planLimits.orbAvailable ? text.enabled : text.locked}</strong>
          <small>{planLimits.extendedDesignOptions ? text.extendedUnlocked : text.extendedLocked}</small>
        </div>
      </div>

      <div className="adminUsersInviteBar">
        <label>
          <span>
            <FiMail /> {text.email}
          </span>
          <input
            type="email"
            placeholder="name@company.com"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
        </label>

        <label>
          <span>
            <FiShield /> {text.role}
          </span>
          <AdminDropdown
            value={inviteRole}
            options={roleOptions.map((role) => ({
              value: role.value,
              label: role.label,
              description: role.description,
            }))}
            onChange={(nextValue) => setInviteRole(nextValue as Exclude<UserRole, 'user'>)}
          />
        </label>

        <button
          className="primaryBtn adminUsersInviteButton"
          type="button"
          onClick={handleInvite}
          disabled={savingInvite || inviteLocked}
        >
          <FiUserPlus />
          {savingInvite ? text.inviting : inviteLocked ? text.memberLimitReached : text.inviteUser}
        </button>
      </div>

      <div className="adminUsersGrid">
        <section className="adminUsersSection">
          <div className="adminUsersSectionHeader">
            <h2>{text.members}</h2>
            <span>{sortedUsers.length}</span>
          </div>
          <div className="adminUsersList">
            {sortedUsers.map((user) => (
              <article key={user.id} className="adminUsersCard">
                <div className="adminUsersCardTop">
                  <div>
                    <strong>{user.displayName || user.email}</strong>
                    <span>{user.email}</span>
                  </div>
                  <span className={`adminUsersRole adminUsersRole-${user.role === 'user' ? 'viewer' : user.role}`}>
                    {roleLabel(user.role, text)}
                  </span>
                </div>

                <div className="adminUsersCardRow">
                  <span>{text.status}</span>
                  <strong>{user.status}</strong>
                </div>

                <div className="adminUsersCardRow">
                  <span>{text.joined}</span>
                  <strong>{formatDate(user.createdAt, text.unknown)}</strong>
                </div>

                <label className="adminUsersInlineSelect">
                  <span>{text.role}</span>
                  <AdminDropdown
                    value={user.role === 'user' ? 'viewer' : user.role}
                    disabled={updatingUserId === user.id}
                    options={roleOptions.map((role) => ({
                      value: role.value,
                      label: role.label,
                      description: role.description,
                    }))}
                    onChange={(nextValue) =>
                      handleRoleChange(user.id, nextValue as Exclude<UserRole, 'user'>)
                    }
                  />
                </label>
              </article>
            ))}
          </div>
        </section>

        <section className="adminUsersSection">
          <div className="adminUsersSectionHeader">
            <h2>{text.pendingInvites}</h2>
            <span>{invitations.length}</span>
          </div>
          <div className="adminUsersList">
            {invitations.length === 0 ? (
              <div className="adminUsersEmpty">
                <p>{text.noPendingInvites}</p>
              </div>
            ) : (
              invitations.map((invite) => (
                <article key={invite.id} className="adminUsersCard adminUsersCardInvite">
                  <div className="adminUsersCardTop">
                    <div>
                      <strong>{invite.email}</strong>
                      <span>{text.role}: {roleLabel(invite.role, text)}</span>
                    </div>
                    <button type="button" className="adminUsersCopyButton" onClick={() => copyInviteLink(invite)}>
                      <FiCopy />
                      {text.copyLink}
                    </button>
                  </div>

                  <div className="adminUsersCardRow">
                    <span>{text.expires}</span>
                    <strong>{formatDate(invite.expiresAt, text.unknown)}</strong>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {statusMessage ? <div className="adminUsersStatus">{statusMessage}</div> : null}
    </div>
  )
}
