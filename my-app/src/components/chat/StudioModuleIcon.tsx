import type { CSSProperties } from 'react'
import { FiBriefcase, FiCalendar, FiCreditCard, FiDollarSign, FiDroplet, FiEdit3, FiFeather, FiFileText, FiGlobe, FiGrid, FiHeadphones, FiHelpCircle, FiLayout, FiMapPin, FiMessageCircle, FiMessageSquare, FiPhone, FiSettings, FiShield, FiSliders, FiStar, FiUser, FiZap } from 'react-icons/fi'

const artwork = {
  company: [FiBriefcase, '#39738e'], chat: [FiSliders, '#3d70bb'], personality: [FiFeather, '#7759a7'], pricing: [FiDollarSign, '#2a7f70'], terms: [FiShield, '#93623d'],
  locations: [FiMapPin, '#b35b57'], documents: [FiFileText, '#6c77a9'], languages: [FiGlobe, '#357d8b'], welcome: [FiMessageCircle, '#37816e'], suggestions: [FiHelpCircle, '#8562ad'],
  cards: [FiGrid, '#596eb1'], support: [FiHeadphones, '#4b5eaa'], contact: [FiPhone, '#388a85'], reviews: [FiStar, '#a47932'], booking: [FiCalendar, '#8f5d9e'], actions: [FiZap, '#397cac'],
  bubble: [FiMessageCircle, '#37816e'], colorTheme: [FiDroplet, '#936bb4'], header: [FiLayout, '#477db0'], body: [FiMessageSquare, '#6470ae'], footer: [FiEdit3, '#39847f'],
  designContact: [FiUser, '#477d95'], tickets: [FiHeadphones, '#4b5eaa'], advanced: [FiSettings, '#6d7d91'], plan: [FiCreditCard, '#3b8172'], presets: [FiDroplet, '#936bb4'],
} as const

export default function StudioModuleIcon({ id, small = false }: { id: string; small?: boolean }) {
  const [Icon, color] = artwork[id as keyof typeof artwork] || artwork.advanced
  return <span className={'studioModuleArtwork' + (small ? ' studioModuleArtworkSmall' : '')} style={{ '--module-accent': color } as CSSProperties} aria-hidden="true"><Icon /></span>
}
