'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import styled, { css, keyframes } from 'styled-components'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { getInvitationsForEmail } from '@/lib/invitation.service'
import type { BusinessInvitation } from '@/types/database'
import {
  FiArrowRight,
  FiBriefcase,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiPlusCircle,
  FiUserPlus,
  FiX,
} from 'react-icons/fi'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
}

const floatGlow = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.85; }
  50% { transform: translate3d(18px, -10px, 0) scale(1.05); opacity: 1; }
`

const activePulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.16); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
`

const StyledHeader = styled.header<{ $scrolled: boolean }>`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  padding: ${({ $scrolled }) => ($scrolled ? '14px 20px 0' : '20px 20px 0')};
  background: transparent;
  transition: padding 0.25s ease;

  @media (max-width: 720px) {
    padding: 12px 12px 0;
  }
`

const HeaderFrame = styled.div`
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
`

const HeaderInner = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 16px 18px;

  @media (max-width: 1100px) {
    grid-template-columns: auto auto;
  }

  @media (max-width: 720px) {
    padding: 12px;
  }
`

const LeftSide = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
`

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  min-width: 0;
`

const BrandBadge = styled.div`
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #2563eb 100%);
  color: #f8fafc;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 1.15rem;
  font-style: italic;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow:
    0 16px 28px rgba(37, 99, 235, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 14px;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.18), transparent 45%);
  }
`

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const BrandTitle = styled.span`
  color: #0f172a;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 1.34rem;
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`

const BrandTag = styled.span`
  color: #7c8aa0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-top: 7px;

  @media (max-width: 720px) {
    display: none;
  }
`

const CenterZone = styled.div`
  display: flex;
  justify-content: center;
  min-width: 0;

  @media (max-width: 1100px) {
    display: none;
  }
`

const DesktopNav = styled.nav`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.78);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 10px 24px rgba(15, 23, 42, 0.05);
`

const activeNavStyles = css`
  color: #0f172a;
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 12px 26px rgba(15, 23, 42, 0.08),
    inset 0 0 0 1px rgba(59, 130, 246, 0.14);

  &::after {
    opacity: 1;
    transform: scaleX(1);
  }
`

const NavLink = styled(Link)<{ $active?: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 15px;
  border-radius: 16px;
  color: #475569;
  font-size: 0.93rem;
  font-weight: 800;
  transition:
    transform 0.2s ease,
    color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 6px;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, #38bdf8, #2563eb);
    opacity: 0;
    transform: scaleX(0.5);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  ${({ $active }) => $active && activeNavStyles}

  &:hover {
    color: #0f172a;
    background: rgba(255, 255, 255, 0.82);
    transform: translateY(-1px);
  }
`

const NavBadge = styled.span`
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
  font-size: 0.7rem;
  font-weight: 900;
  animation: ${activePulse} 2.2s ease-in-out infinite;
`

const RightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  justify-self: end;

  @media (max-width: 1100px) {
    display: none;
  }
`

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const BaseButtonStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 16px;
  font-size: 0.92rem;
  font-weight: 800;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
`

const SecondaryAction = styled(Link)`
  ${BaseButtonStyles}
  color: #0f172a;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(203, 213, 225, 0.95);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);

  &:hover {
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  }
`

const PrimaryAction = styled(Link)`
  ${BaseButtonStyles}
  color: #f8fafc;
  background: linear-gradient(135deg, #111827 0%, #1d4ed8 100%);
  border: 1px solid transparent;
  box-shadow: 0 16px 28px rgba(29, 78, 216, 0.22);

  &:hover {
    box-shadow: 0 18px 30px rgba(29, 78, 216, 0.28);
  }
`

const ActionButton = styled.button`
  ${BaseButtonStyles}
  color: #0f172a;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(203, 213, 225, 0.95);
  cursor: pointer;

  &:hover {
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  }
`

const MobileToggle = styled.button`
  display: none;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  border-radius: 16px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);

  @media (max-width: 1100px) {
    display: inline-flex;
  }
`

const MobilePanel = styled.div<{ $open: boolean }>`
  position: relative;
  z-index: 1;
  display: ${({ $open }) => ($open ? 'grid' : 'none')};
  gap: 12px;
  padding: 0 14px 14px;

  @media (min-width: 1101px) {
    display: none;
  }

  @media (max-width: 720px) {
    padding: 0 12px 12px;
  }
`

const MobileNav = styled.nav`
  display: grid;
  gap: 8px;
`

const MobileNavLink = styled(NavLink)`
  width: 100%;
  justify-content: space-between;
`

const MobileActionStack = styled.div`
  display: grid;
  gap: 10px;
`

export default function Header() {
  const { firebaseUser, dbUser, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [pendingInvites, setPendingInvites] = useState<BusinessInvitation[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const showInvitationCenter = !!firebaseUser && !dbUser
  const showGuestLinks = !firebaseUser || showInvitationCenter

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

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

  const navItems = useMemo<NavItem[]>(() => {
    if (showGuestLinks) {
      return [
        { href: '/landings/guest/websites', label: 'Websites', icon: <FiLayers /> },
        { href: '/landings/auth/chatWidget', label: 'Chat Widget', icon: <FiMessageSquare /> },
        ...(showInvitationCenter
          ? [
              {
                href: '/invite',
                label: 'Invitations',
                icon: <FiUserPlus />,
                badge: pendingInvites.length > 0 ? String(pendingInvites.length) : undefined,
              },
            ]
          : []),
      ]
    }

    return [
      { href: '/landings/user', label: 'Dashboard', icon: <FiGrid /> },
      { href: '/landings/auth/websites', label: 'My Websites', icon: <FiLayers /> },
      { href: '/landings/auth/chatWidget', label: 'My Chat Widgets', icon: <FiMessageSquare /> },
      { href: '/admin', label: 'Admin Panel', icon: <FiBriefcase /> },
    ]
  }, [pendingInvites.length, showGuestLinks, showInvitationCenter])

  const isActivePath = (href: string) => {
    if (!pathname) return false
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <StyledHeader $scrolled={isScrolled}>
      <HeaderFrame>
        <HeaderInner>
          <LeftSide>
            <Brand href="/landings/main" aria-label="Go to home">
              <BrandBadge aria-hidden="true">V</BrandBadge>
              <BrandText>
                <BrandTitle>VINTRA</BrandTitle>
                <BrandTag>Nordic Digital Studio</BrandTag>
              </BrandText>
            </Brand>
          </LeftSide>

          <CenterZone>
            <DesktopNav aria-label="Primary">
              {navItems.map((item) => (
                <NavLink key={item.href} href={item.href} $active={isActivePath(item.href)}>
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge ? <NavBadge>{item.badge}</NavBadge> : null}
                </NavLink>
              ))}
            </DesktopNav>
          </CenterZone>

          <RightSide>
            <ActionRow>
              {!firebaseUser ? (
                <>
                  <SecondaryAction href="/auth/login">Log In</SecondaryAction>
                  <PrimaryAction href="/auth/signup">
                    <FiArrowRight />
                    <span>Start Free</span>
                  </PrimaryAction>
                </>
              ) : showInvitationCenter ? (
                <>
                  <SecondaryAction href="/invite">
                    <FiUserPlus />
                    <span>Invitations</span>
                  </SecondaryAction>
                  <PrimaryAction href="/auth/signup">
                    <FiPlusCircle />
                    <span>Create Business</span>
                  </PrimaryAction>
                  <ActionButton type="button" onClick={handleLogout}>
                    <FiLogOut />
                    <span>Log Out</span>
                  </ActionButton>
                </>
              ) : (
                <ActionButton type="button" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Log Out</span>
                </ActionButton>
              )}
            </ActionRow>
          </RightSide>

          <MobileToggle
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </MobileToggle>
        </HeaderInner>

        <MobilePanel $open={isMenuOpen}>
          <MobileNav aria-label="Mobile primary">
            {navItems.map((item) => (
              <MobileNavLink key={item.href} href={item.href} $active={isActivePath(item.href)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge ? <NavBadge>{item.badge}</NavBadge> : null}
              </MobileNavLink>
            ))}
          </MobileNav>

          <MobileActionStack>
            {!firebaseUser ? (
              <>
                <SecondaryAction href="/auth/login">Log In</SecondaryAction>
                <PrimaryAction href="/auth/signup">
                  <FiArrowRight />
                  <span>Start Free</span>
                </PrimaryAction>
              </>
            ) : showInvitationCenter ? (
              <>
                <SecondaryAction href="/invite">
                  <FiUserPlus />
                  <span>Invitations</span>
                </SecondaryAction>
                <PrimaryAction href="/auth/signup">
                  <FiPlusCircle />
                  <span>Create Business</span>
                </PrimaryAction>
                <ActionButton type="button" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Log Out</span>
                </ActionButton>
              </>
            ) : (
              <ActionButton type="button" onClick={handleLogout}>
                <FiLogOut />
                <span>Log Out</span>
              </ActionButton>
            )}
          </MobileActionStack>
        </MobilePanel>
      </HeaderFrame>
    </StyledHeader>
  )
}
