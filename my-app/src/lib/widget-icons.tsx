import type { ComponentType, SVGProps } from 'react'
import {
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
  FiShield,
  FiTarget,
  FiUpload,
  FiUser,
  FiUserCheck,
  FiUserPlus,
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

export type WidgetIconKey = string

export type WidgetIconOption = {
  key: WidgetIconKey
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  keywords: string[]
}

export const WIDGET_ICON_OPTIONS: WidgetIconOption[] = [
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
  { key: 'FiCheckCircle', label: 'Check circle', icon: FiCheckCircle, keywords: ['done', 'ok', 'status'] },
  { key: 'FiArrowRight', label: 'Arrow right', icon: FiArrowRight, keywords: ['next', 'arrow', 'forward'] },
  { key: 'FiHelpCircle', label: 'Help', icon: FiHelpCircle, keywords: ['help', 'question', 'faq'] },
]

export const WIDGET_ICON_MAP = Object.fromEntries(
  WIDGET_ICON_OPTIONS.map((option) => [option.key, option.icon])
) as Record<WidgetIconKey, ComponentType<SVGProps<SVGSVGElement>>>

export function getWidgetIconOption(iconKey?: string | null) {
  if (!iconKey) return null
  return WIDGET_ICON_OPTIONS.find((option) => option.key === iconKey) || null
}

export function renderWidgetIcon(iconKey?: string | null, props?: SVGProps<SVGSVGElement>) {
  const Icon = iconKey ? WIDGET_ICON_MAP[iconKey] : null
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
