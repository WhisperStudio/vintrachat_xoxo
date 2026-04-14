'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import styled from 'styled-components'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { getInvitationsForEmail } from '@/lib/invitation.service'
import type { BusinessInvitation } from '@/types/database'

const StyledHeader = styled.header`
  width: 100%;
  padding: 18px 28px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 20;
`

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`

const Brand = styled(Link)`
  text-decoration: none;
  color: #111827;
  font-size: 1.6rem;
  font-weight: 800;
`

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const InviteNavWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`

const InviteDot = styled.span`
  position: absolute;
  left: -8px;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translateY(-50%);
  border-radius: 999px;
  background: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
`

const NavLink = styled(Link)`
  text-decoration: none;
  color: #374151;
  padding: 8px 12px;
  border-radius: 10px;
  transition: 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const GhostButton = styled.button`
  padding: 9px 14px;
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    border-color: #86efac;
    background: #f9fafb;
  }
`

const PrimaryButton = styled.button`
  padding: 9px 14px;
  background: #111827;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    background: #1f2937;
  }
`

const UserText = styled.span`
  color: #6b7280;
  font-size: 0.95rem;
`

export default function Header() {
  const { isAuthenticated, firebaseUser, dbUser, logout } = useAuth()
  const router = useRouter()
  const [pendingInvites, setPendingInvites] = useState<BusinessInvitation[]>([])
  const showInvitationCenter = !!firebaseUser && !dbUser
  const showGuestLinks = !firebaseUser || showInvitationCenter

  useEffect(() => {
    let mounted = true

    async function loadInvites() {
      if (!showInvitationCenter || !firebaseUser?.email) {
        setPendingInvites([])
        return
      }

      const invites = await getInvitationsForEmail(firebaseUser.email)
      if (mounted) setPendingInvites(invites)
    }

    void loadInvites()
    const interval = window.setInterval(loadInvites, 10000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [firebaseUser?.email, showInvitationCenter])

  const handleLogout = async () => {
    await logout()
    router.push('/landings/main')
  }

  return (
    <StyledHeader>
      <Left>
        <Brand href="/landings/main">
          V.O.T.E
        </Brand>

        <Nav>
          {showGuestLinks ? (
            <>
              <NavLink href="/landings/guest/websites">Websites</NavLink>
              <NavLink href="/landings/auth/chatWidget">Chat Widget</NavLink>
              {showInvitationCenter ? (
                <InviteNavWrap>
                  {pendingInvites.length > 0 ? <InviteDot /> : null}
                  <NavLink href="/invite">
                    Invitations{pendingInvites.length > 0 ? ` (${pendingInvites.length})` : ''}
                  </NavLink>
                </InviteNavWrap>
              ) : null}
            </>
          ) : (
            <>
              <NavLink href="/landings/user">Dashboard</NavLink>
              <NavLink href="/landings/auth/websites">My Websites</NavLink>
              <NavLink href="/landings/auth/chatWidget">My Chat Widgets</NavLink>
              <NavLink href="/admin">Admin Panel</NavLink>
            </>
          )}
        </Nav>
      </Left>

      <Right>
        {!firebaseUser ? (
          <>
            <Link href="/auth/login">
              <GhostButton type="button">Log In</GhostButton>
            </Link>
            <Link href="/auth/signup">
              <PrimaryButton type="button">Sign Up</PrimaryButton>
            </Link>
          </>
        ) : showInvitationCenter ? (
          <>
            <Link href="/invite">
              <GhostButton type="button">Join a business</GhostButton>
            </Link>
            <Link href="/auth/signup">
              <PrimaryButton type="button">Make a business account</PrimaryButton>
            </Link>
            <GhostButton type="button" onClick={handleLogout}>
              Log Out
            </GhostButton>
          </>
        ) : (
          <>
            <UserText>Hei, {dbUser?.displayName || dbUser?.email}</UserText>
            <GhostButton type="button" onClick={handleLogout}>
              Log Out
            </GhostButton>
          </>
        )}
      </Right>
    </StyledHeader>
  )
}
