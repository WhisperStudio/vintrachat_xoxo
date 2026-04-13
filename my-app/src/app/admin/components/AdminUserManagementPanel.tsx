'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiCopy, FiMail, FiShield, FiUserPlus, FiUsers } from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { createInvitation, getBusinessInvitations } from '@/lib/invitation.service'
import { getBusinessUsers, updateUserRole } from '@/lib/auth.service'
import type { BusinessInvitation, BusinessUser, UserRole } from '@/types/database'
import './admin-components.css'

const roleOptions: Array<{ value: Exclude<UserRole, 'user'>; label: string; description: string }> = [
  { value: 'admin', label: 'Admin', description: 'Full access to the workspace' },
  { value: 'manager', label: 'Manager', description: 'Can manage support and analytics' },
  { value: 'support', label: 'Support', description: 'Chats, tasks, and support flow' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only overview access' },
]

function roleLabel(role: UserRole) {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'manager':
      return 'Manager'
    case 'support':
      return 'Support'
    case 'viewer':
    case 'user':
    default:
      return 'Viewer'
  }
}

function formatDate(value?: Date) {
  if (!value) return 'Unknown'
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
  const [users, setUsers] = useState<BusinessUser[]>([])
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Exclude<UserRole, 'user'>>('viewer')
  const [savingInvite, setSavingInvite] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin')),
    [users]
  )

  useEffect(() => {
    let mounted = true

    async function loadData() {
      if (!dbUser?.businessId) return

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
        setStatusMessage('Could not create invitation')
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
      setStatusMessage('Invitation created')
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
    setStatusMessage('Invite link copied')
  }

  if (loading) {
    return (
      <div className="infoCard adminUsersPanel">
        <h1>User Management</h1>
        <p>Loading team members...</p>
      </div>
    )
  }

  return (
    <div className="infoCard adminUsersPanel">
      <div className="adminUsersHero">
        <div>
          <span className="adminUsersEyebrow">
            <FiUsers /> Team access
          </span>
          <h1>User Management</h1>
          <p>Invite people by email, assign roles, and control what each person can access.</p>
        </div>
        <div className="adminUsersMetaCard">
          <strong>{business?.name || 'Workspace'}</strong>
          <span>{sortedUsers.length} users</span>
        </div>
      </div>

      <div className="adminUsersInviteBar">
        <label>
          <span>
            <FiMail /> Email
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
            <FiShield /> Role
          </span>
          <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Exclude<UserRole, 'user'>)}>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>

        <button className="primaryBtn adminUsersInviteButton" type="button" onClick={handleInvite} disabled={savingInvite}>
          <FiUserPlus />
          {savingInvite ? 'Inviting...' : 'Invite user'}
        </button>
      </div>

      <div className="adminUsersGrid">
        <section className="adminUsersSection">
          <div className="adminUsersSectionHeader">
            <h2>Members</h2>
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
                    {roleLabel(user.role)}
                  </span>
                </div>

                <div className="adminUsersCardRow">
                  <span>Status</span>
                  <strong>{user.status}</strong>
                </div>

                <div className="adminUsersCardRow">
                  <span>Joined</span>
                  <strong>{formatDate(user.createdAt)}</strong>
                </div>

                <label className="adminUsersInlineSelect">
                  <span>Role</span>
                  <select
                    value={user.role === 'user' ? 'viewer' : user.role}
                    disabled={updatingUserId === user.id}
                    onChange={(event) => handleRoleChange(user.id, event.target.value as Exclude<UserRole, 'user'>)}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>
        </section>

        <section className="adminUsersSection">
          <div className="adminUsersSectionHeader">
            <h2>Pending invites</h2>
            <span>{invitations.length}</span>
          </div>
          <div className="adminUsersList">
            {invitations.length === 0 ? (
              <div className="adminUsersEmpty">
                <p>No pending invitations yet.</p>
              </div>
            ) : (
              invitations.map((invite) => (
                <article key={invite.id} className="adminUsersCard adminUsersCardInvite">
                  <div className="adminUsersCardTop">
                    <div>
                      <strong>{invite.email}</strong>
                      <span>Role: {roleLabel(invite.role)}</span>
                    </div>
                    <button type="button" className="adminUsersCopyButton" onClick={() => copyInviteLink(invite)}>
                      <FiCopy />
                      Copy link
                    </button>
                  </div>

                  <div className="adminUsersCardRow">
                    <span>Expires</span>
                    <strong>{formatDate(invite.expiresAt)}</strong>
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
