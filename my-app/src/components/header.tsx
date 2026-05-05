'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import styled, { css, keyframes } from 'styled-components'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { getInvitationsForEmail } from '@/lib/invitation.service'
import { isVintraAdminEmail } from '@/lib/vintra-admin'
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
  z-index: 80;
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

const BrandIcon = styled.img`
  width: 58px;
  height: 46px;
  border-radius: 0;
  object-fit: contain;
  display: block;
  background: transparent;
  box-shadow: none;
`

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  min-width: 0;
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
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.8),
      transparent,
      rgba(255, 255, 255, 0.3)
    );
    pointer-events: none;
  }
`

const DesktopNavIndicator = styled.span`
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 0px;
  width: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(241, 245, 249, 0.78));
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 10px 22px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  transition:
    transform 0.26s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.26s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.22s ease;
  pointer-events: none;
  z-index: 0;
`

const activeNavStyles = css`
  color: #0f172a;

`

const NavLink = styled(Link)<{ $active?: boolean }>`
  position: relative;
  z-index: 1;
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

 

  ${({ $active }) => $active && activeNavStyles}

  &:hover {
    color: #0f172a;
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
  position: relative;
  overflow: hidden;
  background: var(--button-bg, rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid var(--button-border, rgba(255, 255, 255, 0.3));
  box-shadow:
    var(--button-shadow, 0 8px 32px rgba(0, 0, 0, 0.1)),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(255, 255, 255, 0.1);
  font-size: 0.92rem;
  font-weight: 800;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.8),
      transparent,
      rgba(255, 255, 255, 0.3)
    );
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-1px);
  }
`

const SecondaryAction = styled(Link)`
  ${BaseButtonStyles}
  --button-bg: rgba(255, 255, 255, 0.88);
  --button-border: rgba(203, 213, 225, 0.95);
  --button-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  color: #0f172a;

  &:hover {
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  }
`

const PrimaryAction = styled(Link)`
  ${BaseButtonStyles}
  --button-bg: linear-gradient(135deg, #111827 0%, #1d4ed8 100%);
  --button-border: transparent;
  --button-shadow: 0 16px 28px rgba(29, 78, 216, 0.22);
  color: #f8fafc;

  &:hover {
    box-shadow: 0 18px 30px rgba(29, 78, 216, 0.28);
  }
`

const ActionButton = styled.button`
  ${BaseButtonStyles}
  --button-bg: rgba(239, 68, 68, 0.14);
  --button-border: rgba(239, 68, 68, 0.22);
  --button-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  color: #475569;
  cursor: pointer;

  &:hover {
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
    color: #d21b1b;
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
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 1;
  display: ${({ $open }) => ($open ? 'grid' : 'none')};
  gap: 12px;
  padding: 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.8),
      transparent,
      rgba(255, 255, 255, 0.3)
    );
    pointer-events: none;
  }

  @media (min-width: 1101px) {
    display: none;
  }

  @media (max-width: 720px) {
    padding: 12px;
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
  const desktopNavRef = useRef<HTMLElement | null>(null)
  const navButtonRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [navIndicator, setNavIndicator] = useState<{ left: number; width: number; opacity: number } | null>(null)

  const showVintraAdmin = isVintraAdminEmail(firebaseUser?.email)
  const showInvitationCenter = !!firebaseUser && !dbUser && !showVintraAdmin
  const showGuestLinks = (!firebaseUser || showInvitationCenter) && !showVintraAdmin

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

    const authenticatedItems: NavItem[] = [
      { href: '/landings/user', label: 'Dashboard', icon: <FiGrid /> },
      { href: '/landings/auth/websites', label: 'My Websites', icon: <FiLayers /> },
      { href: '/landings/auth/chatWidget', label: 'My Chat Widgets', icon: <FiMessageSquare /> },
      { href: '/admin', label: 'Admin Panel', icon: <FiBriefcase /> },
    ]

    return showVintraAdmin
      ? [...authenticatedItems, { href: '/vintra-admin', label: 'Vintra Admin', icon: <FiBriefcase /> }]
      : authenticatedItems
  }, [pendingInvites.length, showGuestLinks, showInvitationCenter, showVintraAdmin])

  const isActivePath = (href: string) => {
    if (!pathname) return false
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const navEl = desktopNavRef.current
      const activeItem = navItems.find((item) => isActivePath(item.href))
      const activeButton = activeItem ? navButtonRefs.current[activeItem.href] : null

      if (!navEl || !activeButton) {
        setNavIndicator(null)
        return
      }

      const navRect = navEl.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setNavIndicator({
        left: buttonRect.left - navRect.left,
        width: buttonRect.width,
        opacity: 1,
      })
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [navItems, pathname])

  return (
    <StyledHeader $scrolled={isScrolled}>
      <HeaderFrame>
        <HeaderInner>
          <LeftSide>
            <Brand href="/landings/main" aria-label="Go to home">
              <BrandIcon src="/image/logo.png" alt="" aria-hidden="true" />
              <BrandText>
                <BrandTitle>VINTRA</BrandTitle>
                <BrandTag>Nordic Digital Studio</BrandTag>
              </BrandText>
            </Brand>
          </LeftSide>

          <CenterZone>
            <DesktopNav aria-label="Primary" ref={desktopNavRef} data-vintra-main-nav>
              {navIndicator ? (
                <DesktopNavIndicator
                  style={{
                    transform: `translateX(${navIndicator.left}px)`,
                    width: `${navIndicator.width}px`,
                    opacity: navIndicator.opacity,
                  }}
                />
              ) : null}
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  ref={(node) => {
                    navButtonRefs.current[item.href] = node
                  }}
                  $active={isActivePath(item.href)}
                >
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
                <>
                  <ActionButton type="button" onClick={handleLogout}>
                    <FiLogOut />
                    <span>Log Out</span>
                  </ActionButton>
                </>
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
              <>
               
                <ActionButton type="button" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Log Out</span>
                </ActionButton>
              </>
            )}
          </MobileActionStack>
        </MobilePanel>
      </HeaderFrame>
    </StyledHeader>
  )
}
