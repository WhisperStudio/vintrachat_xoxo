import type { ComponentType, SVGProps } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiGlobe,
  FiHelpCircle,
  FiLayers,
  FiLifeBuoy,
  FiMapPin,
  FiMessageCircle,
  FiMessageSquare,
  FiPhone,
  FiSearch,
  FiSend,
  FiShield,
  FiTarget,
  FiUpload,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiX,
  FiZap,
} from 'react-icons/fi'
import { BsRobot } from 'react-icons/bs'
import {
  FaHardHat,
  FaRobot,
  FaUserAstronaut,
  FaUserCheck,
  FaUserCog,
  FaUserGraduate,
  FaUserNurse,
  FaUserShield,
  FaUserMd,
  FaUserTie,
  FaUserSecret,
  FaLaptopCode,
} from 'react-icons/fa'

function ColorSparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="none" {...props}>
      <path
        d="M12 2.75 14.78 8.4 21 11.18l-6.22 2.77L12 19.6l-2.78-5.65L3 11.18 9.22 8.4 12 2.75Z"
        fill="#a855f7"
      />
      <path d="M12 2.75 14.78 8.4 12 11.18 9.22 8.4 12 2.75Z" fill="#f97316" opacity="0.96" />
      <path d="m12 11.18 6.22 2.77L12 19.6l-6.22-5.65L12 11.18Z" fill="#0ea5e9" opacity="0.96" />
      <circle cx="18.4" cy="5.2" r="1.4" fill="#facc15" />
    </svg>
  )
}

function ColorShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 3.25 19 5.9v5.6c0 4.13-2.72 7.85-7 9.25-4.28-1.4-7-5.12-7-9.25V5.9l7-2.65Z"
        fill="#2563eb"
      />
      <path d="M12 3.25 19 5.9v2.9L12 9.4 5 6.8V5.9l7-2.65Z" fill="#38bdf8" opacity="0.9" />
      <path d="M12 20.75c4.28-1.4 7-5.12 7-9.25v-.25L12 13.8l-7-2.55v.25c0 4.13 2.72 7.85 7 9.25Z" fill="#14b8a6" opacity="0.9" />
      <path
        d="m8.7 11.9 2.1 2.15 4.45-4.55"
        stroke="#ecfeff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ColorGlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" fill="#2563eb" />
      <path d="M12 3a9 9 0 0 1 7.8 4.5H4.2A9 9 0 0 1 12 3Z" fill="#60a5fa" opacity="0.92" />
      <path d="M4.2 16.5h15.6A9 9 0 0 1 12 21a9 9 0 0 1-7.8-4.5Z" fill="#1d4ed8" opacity="0.9" />
      <path d="M3.5 12h17" stroke="#dbeafe" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 3.5c2.3 2.4 3.7 5.4 3.7 8.5S14.3 18.1 12 20.5c-2.3-2.4-3.7-5.4-3.7-8.5S9.7 5.9 12 3.5Z" stroke="#dbeafe" strokeWidth="1.4" />
      <path d="M5.6 7.8c1.8.9 4.05 1.35 6.4 1.35 2.35 0 4.6-.45 6.4-1.35M5.6 16.2c1.8-.9 4.05-1.35 6.4-1.35 2.35 0 4.6.45 6.4 1.35" stroke="#dbeafe" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ColorChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 4.25c-4.56 0-8.25 2.96-8.25 6.62 0 2.04 1.16 3.86 2.98 5.08L5.9 19.75l4.24-2.1c.6.1 1.22.16 1.86.16 4.56 0 8.25-2.96 8.25-6.62S16.56 4.25 12 4.25Z"
        fill="#8b5cf6"
      />
      <path d="M12 4.25c-4.56 0-8.25 2.96-8.25 6.62 0 1.24.43 2.42 1.2 3.45h14.1c.77-1.03 1.2-2.21 1.2-3.45 0-3.66-3.69-6.62-8.25-6.62Z" fill="#ec4899" opacity="0.88" />
      <circle cx="8.5" cy="11.1" r="1.05" fill="#fff" />
      <circle cx="12" cy="11.1" r="1.05" fill="#fff" />
      <circle cx="15.5" cy="11.1" r="1.05" fill="#fff" />
    </svg>
  )
}

export type WidgetIconKey = string

export type WidgetIconOption = {
  key: WidgetIconKey
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  keywords: string[]
}

export const WIDGET_ICON_OPTIONS: WidgetIconOption[] = [
  { key: 'ColorChatIcon', label: 'Color chat', icon: ColorChatIcon, keywords: ['chat', 'message', 'color', 'bubble', 'pink'] },
  { key: 'ColorSparkIcon', label: 'Color spark', icon: ColorSparkIcon, keywords: ['spark', 'magic', 'ai', 'color', 'gradient'] },
  { key: 'ColorShieldIcon', label: 'Color shield', icon: ColorShieldIcon, keywords: ['shield', 'security', 'safe', 'color', 'verified'] },
  { key: 'ColorGlobeIcon', label: 'Color globe', icon: ColorGlobeIcon, keywords: ['globe', 'world', 'language', 'color', 'earth'] },
  { key: 'FiMessageCircle', label: 'Message circle', icon: FiMessageCircle, keywords: ['chat', 'message', 'bubble', 'support'] },
  { key: 'FiMessageSquare', label: 'Message square', icon: FiMessageSquare, keywords: ['chat', 'message', 'bubble'] },
  { key: 'FiUser', label: 'User', icon: FiUser, keywords: ['user', 'avatar', 'person'] },
  { key: 'FaUserTie', label: 'Business person', icon: FaUserTie, keywords: ['person', 'business', 'professional', 'office'] },
  { key: 'FaUserGraduate', label: 'Graduate', icon: FaUserGraduate, keywords: ['student', 'graduate', 'education', 'person'] },
  { key: 'FaUserMd', label: 'Doctor', icon: FaUserMd, keywords: ['doctor', 'medical', 'health', 'person'] },
  { key: 'FaUserNurse', label: 'Nurse', icon: FaUserNurse, keywords: ['nurse', 'medical', 'health', 'person'] },
  { key: 'FaUserAstronaut', label: 'Astronaut', icon: FaUserAstronaut, keywords: ['astronaut', 'space', 'person'] },
  { key: 'FaUserCog', label: 'Operator', icon: FaUserCog, keywords: ['operator', 'settings', 'support', 'person'] },
  { key: 'FaUserShield', label: 'Security person', icon: FaUserShield, keywords: ['security', 'shield', 'guard', 'person'] },
  { key: 'FaUserSecret', label: 'Agent', icon: FaUserSecret, keywords: ['secret', 'agent', 'spy', 'person'] },
  { key: 'FaHardHat', label: 'Worker', icon: FaHardHat, keywords: ['worker', 'construction', 'job', 'person'] },
  { key: 'FaLaptopCode', label: 'Developer', icon: FaLaptopCode, keywords: ['developer', 'code', 'tech', 'person'] },
  { key: 'FiUserPlus', label: 'User plus', icon: FiUserPlus, keywords: ['invite', 'new user', 'add'] },
  { key: 'FiUserCheck', label: 'User check', icon: FiUserCheck, keywords: ['verified', 'approved', 'user'] },
  { key: 'FaUserCheck', label: 'Approved person', icon: FaUserCheck, keywords: ['approved', 'verified', 'person'] },
  { key: 'FiLifeBuoy', label: 'Support', icon: FiLifeBuoy, keywords: ['support', 'help', 'agent', 'human'] },
  { key: 'FaRobot', label: 'Robot', icon: FaRobot, keywords: ['robot', 'bot', 'ai', 'assistant'] },
  { key: 'BsRobot', label: 'Robot outline', icon: BsRobot, keywords: ['robot', 'bot', 'ai', 'assistant'] },
  { key: 'FiCpu', label: 'AI', icon: FiCpu, keywords: ['ai', 'bot', 'assistant', 'machine'] },
  { key: 'FiBriefcase', label: 'Briefcase', icon: FiBriefcase, keywords: ['business', 'company', 'work'] },
  { key: 'FiGlobe', label: 'Globe', icon: FiGlobe, keywords: ['language', 'world', 'global'] },
  { key: 'FiSearch', label: 'Search', icon: FiSearch, keywords: ['search', 'find', 'filter'] },
  { key: 'FiShield', label: 'Shield', icon: FiShield, keywords: ['security', 'rules', 'guard'] },
  { key: 'FiZap', label: 'Zap', icon: FiZap, keywords: ['fast', 'quick', 'spark'] },
  { key: 'FiLayers', label: 'Layers', icon: FiLayers, keywords: ['cards', 'stack', 'content'] },
  { key: 'FiClock', label: 'Clock', icon: FiClock, keywords: ['time', 'hours', 'schedule'] },
  { key: 'FiMapPin', label: 'Map pin', icon: FiMapPin, keywords: ['location', 'address', 'map'] },
  { key: 'FiTarget', label: 'Target', icon: FiTarget, keywords: ['goal', 'target', 'conversion'] },
  { key: 'FiUpload', label: 'Upload', icon: FiUpload, keywords: ['upload', 'file', 'document'] },
  { key: 'FiPhone', label: 'Phone', icon: FiPhone, keywords: ['call', 'phone', 'contact'] },
  { key: 'FiSend', label: 'Send', icon: FiSend, keywords: ['send', 'paper plane', 'submit', 'message'] },
  { key: 'FiCheckCircle', label: 'Check circle', icon: FiCheckCircle, keywords: ['done', 'ok', 'status'] },
  { key: 'FiArrowLeft', label: 'Arrow left', icon: FiArrowLeft, keywords: ['back', 'arrow', 'return', 'previous'] },
  { key: 'FiArrowRight', label: 'Arrow right', icon: FiArrowRight, keywords: ['next', 'arrow', 'forward'] },
  { key: 'FiX', label: 'Close', icon: FiX, keywords: ['close', 'x', 'dismiss', 'cancel'] },
  { key: 'FiHelpCircle', label: 'Help', icon: FiHelpCircle, keywords: ['help', 'question', 'faq'] },
]

export const WIDGET_ICON_MAP = Object.fromEntries(
  WIDGET_ICON_OPTIONS.map((option) => [option.key, option.icon])
) as Record<WidgetIconKey, ComponentType<SVGProps<SVGSVGElement>>>

export const WIDGET_ICON_ALIAS_MAP: Record<string, WidgetIconKey> = {
  ai: 'FiCpu',
  back: 'FiArrowLeft',
  arrow: 'FiArrowRight',
  'arrow-left': 'FiArrowLeft',
  'arrow-right': 'FiArrowRight',
  bot: 'FaRobot',
  briefcase: 'FiBriefcase',
  business: 'FiBriefcase',
  cards: 'FiLayers',
  chat: 'FiMessageCircle',
  'color-chat': 'ColorChatIcon',
  'color-spark': 'ColorSparkIcon',
  'color-shield': 'ColorShieldIcon',
  'color-globe': 'ColorGlobeIcon',
  check: 'FiCheckCircle',
  close: 'FiX',
  clock: 'FiClock',
  cpu: 'FiCpu',
  globe: 'FiGlobe',
  help: 'FiHelpCircle',
  layers: 'FiLayers',
  location: 'FiMapPin',
  map: 'FiMapPin',
  message: 'FiMessageSquare',
  phone: 'FiPhone',
  robot: 'FaRobot',
  search: 'FiSearch',
  send: 'FiSend',
  shield: 'FiShield',
  support: 'FiLifeBuoy',
  target: 'FiTarget',
  upload: 'FiUpload',
  user: 'FiUser',
  x: 'FiX',
  zap: 'FiZap',
}

export function normalizeWidgetIconKey(iconKey?: string | null) {
  if (!iconKey) return ''
  const trimmed = iconKey.trim()
  if (!trimmed) return ''
  if (WIDGET_ICON_MAP[trimmed]) return trimmed

  const lowered = trimmed.toLowerCase()
  if (WIDGET_ICON_ALIAS_MAP[lowered]) return WIDGET_ICON_ALIAS_MAP[lowered]

  const exactCaseMatch = WIDGET_ICON_OPTIONS.find((option) => option.key.toLowerCase() === lowered)
  return exactCaseMatch?.key || trimmed
}

export function getWidgetIconOption(iconKey?: string | null) {
  const normalizedKey = normalizeWidgetIconKey(iconKey)
  if (!normalizedKey) return null
  return WIDGET_ICON_OPTIONS.find((option) => option.key === normalizedKey) || null
}

export function renderWidgetIcon(iconKey?: string | null, props?: SVGProps<SVGSVGElement>) {
  const Icon = iconKey ? WIDGET_ICON_MAP[normalizeWidgetIconKey(iconKey)] : null
  if (!Icon) return null
  return <Icon {...props} />
}

export function searchWidgetIcons(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return WIDGET_ICON_OPTIONS

  return WIDGET_ICON_OPTIONS.filter((option) => {
    const haystack = [option.key, option.label, ...option.keywords].join(' ').toLowerCase()
    return haystack.includes(normalized)
  })
}
