'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import styled, { css, keyframes } from 'styled-components'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { getInvitationsForEmail } from '@/lib/invitation.service'
import { headerI18n, languageLabels, languageOptions, useVintraLanguage } from '@/lib/i18n'
import { isVintraAdminEmail } from '@/lib/vintra-admin'
import type { BusinessInvitation } from '@/types/database'
import GlobeSwitcher from "./langSwitch";
import {
  FiArrowRight,
  FiBriefcase,
  FiGlobe,
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

type HeaderTone = 'dark' | 'light'

const floatGlow = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.85; }
  50% { transform: translate3d(18px, -10px, 0) scale(1.05); opacity: 1; }
`

const activePulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.16); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
`

function parseCssColor(color: string) {
  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/i)
  if (!rgbaMatch) return null

  const parts = rgbaMatch[1]
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((part) => Number.isFinite(part))

  if (parts.length < 3) return null

  const [r, g, b, a = 1] = parts
  return { r, g, b, a }
}

function getRelativeLuminance(color: string) {
  const parsed = parseCssColor(color)
  if (!parsed || parsed.a <= 0.05) return null

  const channel = (value: number) => {
    const normalized = value / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }

  return 0.2126 * channel(parsed.r) + 0.7152 * channel(parsed.g) + 0.0722 * channel(parsed.b)
}

function getEffectiveBackgroundColor(element: Element | null) {
  let current: HTMLElement | null = element instanceof HTMLElement ? element : null

  while (current) {
    const backgroundColor = window.getComputedStyle(current).backgroundColor
    if (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      return backgroundColor
    }

    current = current.parentElement
  }

  return window.getComputedStyle(document.body).backgroundColor
}

function inferHeaderTone(element: Element | null): HeaderTone {
  const toneElement = element instanceof HTMLElement ? element.closest('[data-header-tone]') : null
  const explicitTone = toneElement?.getAttribute('data-header-tone')

  if (explicitTone === 'light' || explicitTone === 'dark') {
    return explicitTone
  }

  const backgroundColor = getEffectiveBackgroundColor(element)
  const luminance = getRelativeLuminance(backgroundColor)

  return luminance !== null && luminance < 0.48 ? 'light' : 'dark'
}

const StyledHeader = styled.header<{ $scrolled: boolean; $mobileHidden: boolean; $tone: HeaderTone }>`
  --vintra-header-text: ${({ $tone }) => ($tone === 'light' ? '#f8fafc' : '#0f172a')};
  --vintra-header-muted: ${({ $tone }) => ($tone === 'light' ? 'rgba(226, 232, 240, 0.82)' : '#64748b')};
  --vintra-header-panel-bg: ${({ $tone }) => ($tone === 'light' ? 'rgba(15, 23, 42, 0.58)' : 'rgba(255, 255, 255, 0.86)')};
  --vintra-header-panel-border: ${({ $tone }) => ($tone === 'light' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(203, 213, 225, 0.9)')};
  --vintra-header-panel-shadow: ${({ $tone }) => ($tone === 'light' ? '0 14px 36px rgba(15, 23, 42, 0.24)' : '0 8px 24px rgba(15, 23, 42, 0.06)')};
  --vintra-header-panel-inner: ${({ $tone }) =>
    $tone === 'light'
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(255, 255, 255, 0.05)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 255, 255, 0.1)'};
  --vintra-header-surface-soft: ${({ $tone }) => ($tone === 'light' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.88)')};
  --vintra-header-border-soft: ${({ $tone }) => ($tone === 'light' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(203, 213, 225, 0.95)')};
  --vintra-header-shadow-soft: ${({ $tone }) => ($tone === 'light' ? '0 8px 24px rgba(15, 23, 42, 0.18)' : '0 8px 24px rgba(15, 23, 42, 0.06)')};
  --vintra-header-button-bg: ${({ $tone }) => ($tone === 'light' ? 'rgba(15, 23, 42, 0.18)' : 'rgba(239, 68, 68, 0.14)')};
  --vintra-header-button-border: ${({ $tone }) => ($tone === 'light' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(239, 68, 68, 0.22)')};
  --vintra-header-button-color: ${({ $tone }) => ($tone === 'light' ? '#e2e8f0' : '#475569')};
  --vintra-header-nav-highlight: ${({ $tone }) =>
    $tone === 'light'
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(226, 232, 240, 0.1))'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(241, 245, 249, 0.78))'};
  position: sticky;
  top: 0;
  z-index: 80;
  width: 100%;
  padding: ${({ $scrolled }) => ($scrolled ? '14px 20px 0' : '20px 20px 0')};
  background: transparent;
  transition: padding 0.25s ease, transform 0.28s ease, opacity 0.22s ease;

  @media (max-width: 720px) {
    transform: ${({ $mobileHidden }) => ($mobileHidden ? 'translateY(-110%)' : 'translateY(0)')};
    opacity: ${({ $mobileHidden }) => ($mobileHidden ? 0 : 1)};
    pointer-events: ${({ $mobileHidden }) => ($mobileHidden ? 'none' : 'auto')};
  }

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
    grid-template-columns: auto auto;
    gap: 12px;
    padding: 10px 10px 12px;
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

  @media (max-width: 720px) {
    width: 44px;
    height: 36px;
  }
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

  @media (max-width: 720px) {
    display: none;
  }
`

const BrandTitle = styled.span`
  color: var(--vintra-header-text);
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 1.34rem;
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`

const BrandTag = styled.span`
  color: var(--vintra-header-muted);
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
  background: var(--vintra-header-panel-bg);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid var(--vintra-header-panel-border);
  box-shadow: var(--vintra-header-panel-shadow);
  box-shadow: var(--vintra-header-panel-shadow), var(--vintra-header-panel-inner);
  overflow: hidden;

  @media (max-width: 1100px) {
    gap: 6px;
    padding: 7px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.48), transparent);
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
      rgba(255, 255, 255, 0.48),
      transparent,
      rgba(255, 255, 255, 0.18)
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
  background: var(--vintra-header-nav-highlight);
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
  color: var(--vintra-header-text);

`

const NavLink = styled(Link)<{ $active?: boolean }>`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 15px;
  border-radius: 16px;
  color: var(--vintra-header-muted);
  font-size: clamp(0.78rem, 0.72rem + 0.22vw, 0.93rem);
  font-weight: 800;
  transition:
    transform 0.2s ease,
    color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
  white-space: nowrap;

  @media (max-width: 1100px) {
    gap: 8px;
    padding: 10px 13px;
  }

  @media (max-width: 720px) {
    gap: 7px;
    padding: 9px 12px;
    font-size: 0.82rem;
  }

  ${({ $active }) => $active && activeNavStyles}

  &:hover {
    color: var(--vintra-header-text);
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

  @media (max-width: 1200px) {
    gap: 8px;
  }
`

const LanguageSwitcher = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border-radius: 15px;
  background: var(--vintra-header-surface-soft);
  border: 1px solid var(--vintra-header-border-soft);
  box-shadow: var(--vintra-header-shadow-soft);
`


const BaseButtonStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  background: var(--button-bg, var(--vintra-header-surface-soft));
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid var(--button-border, var(--vintra-header-border-soft));
  box-shadow:
    var(--button-shadow, var(--vintra-header-shadow-soft)),
    inset 0 1px 0 rgba(255, 255, 255, 0.32),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08);
  font-size: clamp(0.78rem, 0.72rem + 0.22vw, 0.92rem);
  font-weight: 800;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
  white-space: nowrap;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.48), transparent);
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
      rgba(255, 255, 255, 0.48),
      transparent,
      rgba(255, 255, 255, 0.18)
    );
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-1px);
  }

  @media (max-width: 1200px) {
    gap: 8px;
    padding: 10px 14px;
  }

  @media (max-width: 720px) {
    gap: 7px;
    padding: 9px 12px;
    font-size: 0.82rem;
  }
`

const SecondaryAction = styled(Link)`
  ${BaseButtonStyles}
  --button-bg: var(--vintra-header-surface-soft);
  --button-border: var(--vintra-header-border-soft);
  --button-shadow: var(--vintra-header-shadow-soft);
  color: var(--vintra-header-text);

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
  --button-bg: var(--vintra-header-button-bg);
  --button-border: var(--vintra-header-button-border);
  --button-shadow: var(--vintra-header-shadow-soft);
  color: var(--vintra-header-button-color);
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
  border: 1px solid var(--vintra-header-border-soft);
  background: var(--vintra-header-surface-soft);
  color: var(--vintra-header-text);
  cursor: pointer;
  box-shadow: var(--vintra-header-shadow-soft);

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
  background: var(--vintra-header-panel-bg);
  border: 1px solid var(--vintra-header-panel-border);
  box-shadow: var(--vintra-header-panel-shadow), var(--vintra-header-panel-inner);
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
  font-size: clamp(0.82rem, 0.8rem + 0.3vw, 0.92rem);
`

const MobileActionStack = styled.div`
  display: grid;
  gap: 10px;
`

const MobileLanguageSwitch = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 16px;
  background: var(--vintra-header-surface-soft);
  border: 1px solid var(--vintra-header-border-soft);
  box-shadow: var(--vintra-header-shadow-soft);
`

const MobileLanguageButton = styled.button<{ $active?: boolean }>`
  min-width: 42px;
  height: 34px;
  border: 0;
  border-radius: 11px;
  background: ${({ $active }) => ($active ? '#0f172a' : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : 'var(--vintra-header-text)')};
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    color: ${({ $active }) => ($active ? '#ffffff' : 'var(--vintra-header-text)')};
  }
`

const LanguageSwitch = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 16px;
  background: var(--vintra-header-surface-soft);
  border: 1px solid var(--vintra-header-border-soft);
  box-shadow: var(--vintra-header-shadow-soft);
`

const LanguageButton = styled.button<{ $active?: boolean }>`
  min-width: 42px;
  height: 34px;
  border: 0;
  border-radius: 11px;
  background: ${({ $active }) => ($active ? '#0f172a' : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : 'var(--vintra-header-text)')};
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    color: ${({ $active }) => ($active ? '#ffffff' : 'var(--vintra-header-text)')};
  }
`

export default function Header() {
  const { firebaseUser, dbUser, logout } = useAuth()
  const { language, setLanguage } = useVintraLanguage()
  const text = headerI18n[language]
  const router = useRouter()
  const pathname = usePathname()
  const [pendingInvites, setPendingInvites] = useState<BusinessInvitation[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileHidden, setIsMobileHidden] = useState(false)
  const [headerTone, setHeaderTone] = useState<HeaderTone>('dark')
  const headerRef = useRef<HTMLElement | null>(null)
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
    if (typeof window === 'undefined') return

    let animationFrame = 0

    const updateTone = () => {
      animationFrame = 0
      const headerEl = headerRef.current
      if (!headerEl) return

      const headerRect = headerEl.getBoundingClientRect()
      const sampleX = Math.min(window.innerWidth - 1, Math.max(1, Math.round(window.innerWidth / 2)))
      const sampleY = Math.min(window.innerHeight - 1, Math.max(1, Math.round(headerRect.height * 0.58)))
      const stack = document.elementsFromPoint(sampleX, sampleY)
      const source = stack.find((element) => element instanceof HTMLElement && !headerEl.contains(element)) || null

      const nextTone = inferHeaderTone(source)
      setHeaderTone((currentTone) => (currentTone === nextTone ? currentTone : nextTone))
    }

    const scheduleToneUpdate = () => {
      if (animationFrame) return
      animationFrame = window.requestAnimationFrame(updateTone)
    }

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleToneUpdate) : null

    scheduleToneUpdate()
    window.addEventListener('scroll', scheduleToneUpdate, { passive: true })
    window.addEventListener('resize', scheduleToneUpdate)
    resizeObserver?.observe(document.documentElement)
    if (headerRef.current) {
      resizeObserver?.observe(headerRef.current)
    }

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
      window.removeEventListener('scroll', scheduleToneUpdate)
      window.removeEventListener('resize', scheduleToneUpdate)
      resizeObserver?.disconnect()
    }
  }, [pathname])

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 720px)')
    let lastScrollY = window.scrollY

    const syncMobileHeader = () => {
      const currentScrollY = window.scrollY
      const isMobile = mobileQuery.matches

      if (!isMobile) {
        setIsMobileHidden(false)
        document.body.style.removeProperty('--vintra-mobile-main-header-offset')
        lastScrollY = currentScrollY
        return
      }

      const isAtTop = currentScrollY < 18
      const scrollingDown = currentScrollY > lastScrollY
      const nextHidden = !isAtTop && scrollingDown

      setIsMobileHidden(nextHidden)
      document.body.style.setProperty('--vintra-mobile-main-header-offset', nextHidden ? '0px' : '72px')
      lastScrollY = currentScrollY
    }

    syncMobileHeader()
    window.addEventListener('scroll', syncMobileHeader, { passive: true })
    window.addEventListener('resize', syncMobileHeader)
    mobileQuery.addEventListener?.('change', syncMobileHeader)

    return () => {
      window.removeEventListener('scroll', syncMobileHeader)
      window.removeEventListener('resize', syncMobileHeader)
      mobileQuery.removeEventListener?.('change', syncMobileHeader)
      document.body.style.removeProperty('--vintra-mobile-main-header-offset')
    }
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
        { href: '/landings/guest/websites', label: text.nav.websites, icon: <FiLayers /> },
        { href: '/landings/auth/chatWidget', label: text.nav.chatWidget, icon: <FiMessageSquare /> },
        ...(showInvitationCenter
          ? [
              {
                href: '/invite',
                label: text.nav.invitations,
                icon: <FiUserPlus />,
                badge: pendingInvites.length > 0 ? String(pendingInvites.length) : undefined,
              },
            ]
          : []),
      ]
    }

    const authenticatedItems: NavItem[] = [
      { href: '/landings/user', label: text.nav.dashboard, icon: <FiGrid /> },
      { href: '/landings/auth/websites', label: text.nav.myWebsites, icon: <FiLayers /> },
      { href: '/landings/auth/chatWidget', label: text.nav.myChatWidgets, icon: <FiMessageSquare /> },
      { href: '/admin', label: text.nav.adminPanel, icon: <FiBriefcase /> },
    ]

    return showVintraAdmin
      ? [...authenticatedItems, { href: '/vintra-admin', label: text.nav.vintraAdmin, icon: <FiBriefcase /> }]
      : authenticatedItems
  }, [pendingInvites.length, showGuestLinks, showInvitationCenter, showVintraAdmin, text])

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
    <StyledHeader ref={headerRef} $scrolled={isScrolled} $mobileHidden={isMobileHidden} $tone={headerTone}>
      <HeaderFrame>
        <HeaderInner>
          <LeftSide>
            <Brand href="/landings/main" aria-label={text.brandAria}>
              <BrandIcon src="/image/logo.png" alt="" aria-hidden="true" />
              <BrandText>
                <BrandTitle>VINTRA</BrandTitle>
                <BrandTag>{text.brandTag}</BrandTag>
              </BrandText>
            </Brand>
          </LeftSide>

          <CenterZone>
            <DesktopNav aria-label={text.primaryNav} ref={desktopNavRef} data-vintra-main-nav>
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
              <GlobeSwitcher size={62} />

              {!firebaseUser ? (
                <>
                  <SecondaryAction href="/auth/login">{text.actions.login}</SecondaryAction>
                  <PrimaryAction href="/auth/signup">
                    <FiArrowRight />
                    <span>{text.actions.startFree}</span>
                  </PrimaryAction>
                </>
              ) : showInvitationCenter ? (
                <>
                  <SecondaryAction href="/invite">
                    <FiUserPlus />
                    <span>{text.nav.invitations}</span>
                  </SecondaryAction>
                  <PrimaryAction href="/auth/signup">
                    <FiPlusCircle />
                    <span>{text.actions.createBusiness}</span>
                  </PrimaryAction>
                  <ActionButton type="button" onClick={handleLogout}>
                    <FiLogOut />
                    <span>{text.actions.logout}</span>
                  </ActionButton>
                </>
              ) : (
                <>
                  <ActionButton type="button" onClick={handleLogout}>
                    <FiLogOut />
                    <span>{text.actions.logout}</span>
                  </ActionButton>
                </>
              )}
            </ActionRow>
          </RightSide>

          <MobileToggle
            type="button"
            aria-label={isMenuOpen ? text.closeMenu : text.openMenu}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </MobileToggle>
        </HeaderInner>

        <MobilePanel $open={isMenuOpen}>
          <MobileNav aria-label={text.mobilePrimaryNav}>
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
            <GlobeSwitcher />

            {!firebaseUser ? (
              <>
                <SecondaryAction href="/auth/login">{text.actions.login}</SecondaryAction>
                <PrimaryAction href="/auth/signup">
                  <FiArrowRight />
                  <span>{text.actions.startFree}</span>
                </PrimaryAction>
              </>
            ) : showInvitationCenter ? (
              <>
                <SecondaryAction href="/invite">
                  <FiUserPlus />
                  <span>{text.nav.invitations}</span>
                </SecondaryAction>
                <PrimaryAction href="/auth/signup">
                  <FiPlusCircle />
                  <span>{text.actions.createBusiness}</span>
                </PrimaryAction>
                <ActionButton type="button" onClick={handleLogout}>
                  <FiLogOut />
                  <span>{text.actions.logout}</span>
                </ActionButton>
              </>
            ) : (
              <>
               
                <ActionButton type="button" onClick={handleLogout}>
                  <FiLogOut />
                  <span>{text.actions.logout}</span>
                </ActionButton>
              </>
            )}
          </MobileActionStack>
        </MobilePanel>
      </HeaderFrame>
    </StyledHeader>
  )
}
