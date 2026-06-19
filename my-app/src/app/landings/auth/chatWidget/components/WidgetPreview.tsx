'use client'

import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type SVGProps } from 'react'
import { FiArrowLeft, FiCheckCircle, FiChevronRight, FiCpu, FiLifeBuoy, FiMessageCircle, FiMessageSquare, FiPhone, FiSend } from 'react-icons/fi'
import GlassOrbAvatar from '../../../../../svgs/GlassOrbAvatar'
import { getWidgetThemeClass, getWidgetThemeStyle, joinWidgetClasses } from '@/components/chat/widgetDesign'
import { normalizeConversationCards } from '@/lib/conversation-cards'
import { renderWidgetIcon } from '@/lib/widget-icons'
import { chatWidgetPricingI18n, useVintraLanguage } from '@/lib/i18n'
import FeedbackFormOverlay from '@/components/chat/FeedbackFormOverlay'
import WebGLLiquidGlassSendButton from './glass/WebGLLiquidGlassSendButton'
import './WidgetPreview.css'
import type { AssistantConversationCard, AssistantWidgetIcons, ChatWidgetInterfaceIcons, BubbleIconChoice, OrbStyleConfig } from '@/types/database'

const OrbAvatar = GlassOrbAvatar as ComponentType<
  SVGProps<SVGSVGElement> & { glyph?: string; orbMode?: 'spin' | 'hover' | 'reply' | 'inactive' }
>

interface WidgetPreviewProps {
  total?: number
  billingCycle?: 'monthly' | 'yearly'
  plan?: 'free' | 'pro' | 'business'
  bubbleStyle: {
    showStatus: boolean
    iconChoice: BubbleIconChoice
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    animationType: 'none' | 'bounce' | 'fade' | 'slide'
    sizeType: 'small' | 'medium' | 'large'
    orbStyle?: OrbStyleConfig
  }
  headerStyle: {
    showStatus: boolean
    showCloseButton: boolean
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    showAvatar: boolean
    showTitle: boolean
  }
  bodyStyle: {
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    messageStyle: 'bubble' | 'flat' | 'card'
    showTimestamps: boolean
    showReadReceipts: boolean
    showConversationCards: boolean
    conversationCardsLayout: 'grid' | 'list' | 'stack'
    conversationCardsStyle: 'modern' | 'minimal' | 'bubble' | 'image' | 'chips'
  }
  footerStyle: {
    showSendButton: boolean
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    inputStyle: 'flat' | 'rounded' | 'outlined'
    showPlaceholder: boolean
  }
  settings?: {
    tasksEnabled?: boolean
    reviewsEnabled?: boolean
  }
  position: 'bottom-right' | 'bottom-left'
  colorTheme:
    | 'modern'
    | 'chilling'
    | 'corporate'
    | 'luxury'
    | 'pink-blast'
    | 'red-velvet'
    | 'deep-blue'
    | 'banana-bonanza'
  appearance?: {
    glassLookEnabled?: boolean
  }
  customBranding: {
    title?: string
    description?: string
    logo?: string
    logoStyle?: {
      zoom: number
      focusX: number
      focusY: number
    }
  }
  assistantIcons?: AssistantWidgetIcons & ChatWidgetInterfaceIcons
  initialOpen?: boolean
  variant?: 'default' | 'embedded'
  previewMode?: 'desktop' | 'mobile'
  enablePreviewChat?: boolean
  previewReply?: string
  keyboardOffset?: number
  faqSuggestionsEnabled?: boolean
  faqSuggestions?: string[]
  conversationCardsEnabled?: boolean
  conversationCards?: AssistantConversationCard[]
  conversationCardsLimit?: number
  messagesOverride?: Message[]
  inputValueOverride?: string
  onInputValueChange?: (value: string) => void
  onSendMessage?: (message?: string) => void
  openOverride?: boolean
  onToggleOpen?: (open: boolean) => void
  errorMessage?: string | null
  statusText?: string
  disableInput?: boolean
  bubbleActivityState?: 'idle' | 'replying'
  supportTypingIndicator?: boolean
  humanHandoffOverlay?: {
    open: boolean
    name: string
    email: string
    phone: string
    submitting?: boolean
    onNameChange: (value: string) => void
    onEmailChange: (value: string) => void
    onPhoneChange: (value: string) => void
    onSubmit: () => void
    onClose: () => void
  }
  feedbackOverlay?: {
    open: boolean
    title?: string
    description?: string
    rating: number
    text: string
    submitting?: boolean
    onRatingChange: (rating: number) => void
    onTextChange: (text: string) => void
    onSubmit: () => void
    onClose: () => void
  }
}

interface Message {
  id: string
  text: string
  isBot: boolean
  role?: 'assistant' | 'user' | 'support' | 'system'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function countChars(text: string) {
  return Array.from(String(text || '')).length
}

function truncateToChars(text: string, maxChars: number) {
  return Array.from(String(text || '')).slice(0, maxChars).join('')
}

function normalizeLogoStyle(raw?: { zoom: number; focusX: number; focusY: number }) {
  return {
    zoom: clamp(Number(raw?.zoom || 100), 80, 180),
    focusX: clamp(Number(raw?.focusX || 50), 0, 100),
    focusY: clamp(Number(raw?.focusY || 50), 0, 100),
  }
}

export default function WidgetPreview({
  total,
  billingCycle,
  plan,
  bubbleStyle,
  headerStyle,
  bodyStyle,
  footerStyle,
  settings,
  position,
  colorTheme,
  appearance,
  customBranding,
  assistantIcons,
  initialOpen = false,
  variant = 'default',
  previewMode = 'desktop',
  enablePreviewChat = false,
  previewReply = 'hi, this is only a test',
  keyboardOffset = 0,
  faqSuggestionsEnabled = false,
  faqSuggestions = [],
  messagesOverride,
  inputValueOverride,
  onInputValueChange,
  onSendMessage,
  openOverride,
  onToggleOpen,
  errorMessage = null,
  statusText = 'Online',
  disableInput = false,
  bubbleActivityState = 'idle',
  supportTypingIndicator = false,
  humanHandoffOverlay,
  feedbackOverlay,
  conversationCardsEnabled = false,
  conversationCards = [],
  conversationCardsLimit = 4,
}: WidgetPreviewProps) {
  const { language } = useVintraLanguage()
  const pricingText = chatWidgetPricingI18n[language]
  const safeTotal = typeof total === 'number' ? total : 0
  const formattedTotal =
    language === 'no'
      ? `${new Intl.NumberFormat('nb-NO').format(safeTotal)} kr`
      : `$${safeTotal}`
  const billingPeriod = billingCycle === 'yearly' ? pricingText.year : pricingText.month
  const [internalIsChatOpen, setInternalIsChatOpen] = useState(initialOpen)
  const [internalIsReplying, setInternalIsReplying] = useState(false)
  const [internalIsOrbHovered, setInternalIsOrbHovered] = useState(false)
  const [orbInactiveActive, setOrbInactiveActive] = useState(false)
  const [orbActivityNonce, setOrbActivityNonce] = useState(0)
  const orbInactivityTimerRef = useRef<number | null>(null)
  const orbInactiveHoldTimerRef = useRef<number | null>(null)
  const chatBodyRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [internalMessages, setInternalMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      text: 'Hey! Welcome to our website. How can we help you today?',
      isBot: true,
      role: 'assistant',
    },
  ])
  const [internalInputValue, setInternalInputValue] = useState('')
  const [internalFeedbackOpen, setInternalFeedbackOpen] = useState(false)
  const [internalFeedbackRating, setInternalFeedbackRating] = useState(5)
  const [internalFeedbackText, setInternalFeedbackText] = useState('')
  const [internalFeedbackSubmitting, setInternalFeedbackSubmitting] = useState(false)
  const [internalErrorMessage, setInternalErrorMessage] = useState<string | null>(null)
  const [faqSuggestionNonce, setFaqSuggestionNonce] = useState(0)
  const [faqSuggestionsDismissed, setFaqSuggestionsDismissed] = useState(false)
  const [isComposerFocused, setIsComposerFocused] = useState(false)
  const [activeConversationCardId, setActiveConversationCardId] = useState<string | null>(null)
  const [activePortalPanel, setActivePortalPanel] = useState<'chats' | 'tasks' | 'review'>('chats')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const effectiveAssistantIcons = {
    launcherIcon: assistantIcons?.launcherIcon ?? '',
    avatarIcon: assistantIcons?.avatarIcon ?? 'FiMessageCircle',
    heroIcon: assistantIcons?.heroIcon ?? 'FiMessageCircle',
    closeIcon: assistantIcons?.closeIcon ?? 'FiX',
    backIcon: assistantIcons?.backIcon ?? 'FiArrowLeft',
    sendIcon: assistantIcons?.sendIcon ?? 'FiSend',
    aiIcon: assistantIcons?.aiIcon ?? 'FiCpu',
    supportIcon: assistantIcons?.supportIcon ?? 'FiLifeBuoy',
    userIcon: assistantIcons?.userIcon ?? 'FiUser',
  }

  const isChatOpen = openOverride ?? internalIsChatOpen
  const messages = messagesOverride ?? internalMessages
  const inputValue = inputValueOverride ?? internalInputValue
  const isReplying = bubbleActivityState === 'replying' || internalIsReplying
  const showTypingIndicator = isReplying
  const showSupportTypingIndicator = supportTypingIndicator
  const feedbackKeywords = ['feedback', 'review', 'rating', 'star', 'stars', 'vurdering', 'anmeldelse', 'tilbakemelding']
  const taskKeywords = ['task', 'ticket', 'issue', 'case', 'problem', 'lag oppgave', 'opprett ticket', 'opprett sak']
  const internalRequestedFeedback = (text: string) =>
    feedbackKeywords.some((keyword) => text.toLowerCase().includes(keyword))
  const internalRequestedTask = (text: string) =>
    taskKeywords.some((keyword) => text.toLowerCase().includes(keyword))
  const showTasksTab = settings?.tasksEnabled === true
  const showReviewTab = settings?.reviewsEnabled === true
  const showPortalTabs = showTasksTab || showReviewTab
  const activeFaqSuggestions = useMemo(() => {
    if (!faqSuggestionsEnabled) return []

    const cleaned = faqSuggestions
      .map((item) => item.trim())
      .filter(Boolean)

    if (!cleaned.length) return []

    const unique = Array.from(new Set(cleaned))
    const seeded = unique.map((item) => ({ item, sort: Math.random() }))
    seeded.sort((a, b) => a.sort - b.sort)
    return seeded.slice(0, 3).map((entry) => entry.item)
  }, [faqSuggestions, faqSuggestionsEnabled, faqSuggestionNonce])
  const activeFeedbackOverlay = feedbackOverlay || {
    open: internalFeedbackOpen,
    rating: internalFeedbackRating,
    text: internalFeedbackText,
    submitting: internalFeedbackSubmitting,
    onRatingChange: setInternalFeedbackRating,
    onTextChange: setInternalFeedbackText,
    onSubmit: () => {
      setInternalFeedbackSubmitting(true)
      window.setTimeout(() => {
        setInternalFeedbackSubmitting(false)
        setInternalFeedbackOpen(false)
        setInternalFeedbackText('')
        setInternalFeedbackRating(5)
      }, 450)
    },
    onClose: () => {
      setInternalFeedbackOpen(false)
      setInternalFeedbackText('')
      setInternalFeedbackRating(5)
    },
  }
  const activeHumanHandoffOverlay = humanHandoffOverlay || {
    open: false,
    name: '',
    email: '',
    phone: '',
    submitting: false,
    onNameChange: () => {},
    onEmailChange: () => {},
    onPhoneChange: () => {},
    onSubmit: () => {},
    onClose: () => {},
  }
  const showFaqSuggestions =
    isChatOpen && faqSuggestionsEnabled && !faqSuggestionsDismissed && messages.length <= 1 && activeFaqSuggestions.length > 0
  const hasUserMessage = messages.some((message) => !message.isBot)
  const showStarterCards =
    bodyStyle.showConversationCards &&
    isChatOpen &&
    !hasUserMessage &&
    countChars(String(inputValue ?? '').trim()) === 0
  const showComposerSuggestions = showFaqSuggestions && countChars(String(inputValue ?? '').trim()) === 0 && !showStarterCards
  const visibleErrorMessage = errorMessage || internalErrorMessage
  const hasTypedMessage = countChars(String(inputValue ?? '').trim()) > 0
  const starterCards = useMemo<AssistantConversationCard[]>(() => {
    if (!bodyStyle.showConversationCards) return []

    const normalized = conversationCardsEnabled ? normalizeConversationCards(conversationCards) : []
    const limited = normalized.slice(0, Math.max(1, Number(conversationCardsLimit || 4)))
    if (limited.length > 0) return limited

    return [
      {
        id: 'preview-only',
        title: 'This is only a preview',
        description: 'Set cards in AI settings to show real starter cards.',
        options: [
          { label: 'Open AI settings', prompt: 'Open AI settings' },
          { label: 'Add cards', prompt: 'Add starter cards to the AI settings' },
        ],
      },
    ]
  }, [conversationCardsLimit, bodyStyle.showConversationCards, conversationCards, conversationCardsEnabled])
  const starterCardsPerPage =
    bodyStyle.conversationCardsStyle === 'minimal' && starterCards.length > 4
      ? 8
      : bodyStyle.conversationCardsStyle === 'chips'
        ? 6
        : bodyStyle.conversationCardsStyle === 'bubble'
          ? 4
          : bodyStyle.conversationCardsStyle === 'image'
            ? 3
            : 4
  const starterCardPages = useMemo<AssistantConversationCard[][]>(() => {
    if (!starterCards.length) return []
    const pages: AssistantConversationCard[][] = []
    for (let index = 0; index < starterCards.length; index += starterCardsPerPage) {
      pages.push(starterCards.slice(index, index + starterCardsPerPage))
    }
    return pages
  }, [starterCards, starterCardsPerPage])
  const [starterCardPageIndex, setStarterCardPageIndex] = useState(0)
  const currentStarterCardPage = starterCardPages[Math.min(starterCardPageIndex, Math.max(0, starterCardPages.length - 1))] || []
  const activeConversationCard =
    starterCards.find((card) => card.id === activeConversationCardId) || null
  const showStarterCardList = showStarterCards && Boolean(activeConversationCard)
  const isMinimalCards = bodyStyle.conversationCardsStyle === 'minimal'
  const isImageCards = bodyStyle.conversationCardsStyle === 'image'
  const isChipsCards = bodyStyle.conversationCardsStyle === 'chips'
  const useDenseStarterGrid = isMinimalCards && starterCards.length > 4
  const renderStarterCardIcon = (icon?: string) => {
    if (!icon) return null
    return renderWidgetIcon(icon, { 'aria-hidden': true }) || icon
  }
  const getMessageRole = (message: Message) => message.role || (message.isBot ? 'assistant' : 'user')
  const getMessageClassName = (message: Message) => {
    const role = getMessageRole(message)
    if (role === 'support') return 'message-support'
    if (role === 'system') return 'message-system'
    return message.isBot ? 'message-bot' : 'message-user'
  }
  const getMessageIconKey = (message: Message) => {
    const role = getMessageRole(message)
    if (role === 'assistant') return effectiveAssistantIcons.aiIcon || effectiveAssistantIcons.heroIcon || ''
    if (role === 'support') return effectiveAssistantIcons.supportIcon || effectiveAssistantIcons.aiIcon || effectiveAssistantIcons.heroIcon || ''
    if (role === 'user') return effectiveAssistantIcons.userIcon || ''
    return ''
  }

  useEffect(() => {
    if (!showStarterCards) {
      setActiveConversationCardId(null)
      setStarterCardPageIndex(0)
      return
    }

    const nextActive =
      activeConversationCardId && starterCards.some((card) => card.id === activeConversationCardId)
        ? activeConversationCardId
        : null

    if (nextActive !== activeConversationCardId) {
      setActiveConversationCardId(nextActive)
    }
  }, [activeConversationCardId, currentStarterCardPage, showStarterCards, starterCards])

  const setIsChatOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    const nextValue = typeof value === 'function' ? value(isChatOpen) : value

    if (onToggleOpen) {
      onToggleOpen(nextValue)
      return
    }

    setInternalIsChatOpen(nextValue)
  }

  const setInputValue = (value: string) => {
    const nextValue = truncateToChars(value, 300)
    setInternalErrorMessage(null)
    if (onInputValueChange) {
      onInputValueChange(nextValue)
      setOrbInactiveActive(false)
      setOrbActivityNonce((current) => current + 1)
      return
    }

    setInternalInputValue(nextValue)
    setOrbInactiveActive(false)
    setOrbActivityNonce((current) => current + 1)
  }

  useEffect(() => {
    if (isChatOpen) {
      setOrbInactiveActive(false)
      setOrbActivityNonce((current) => current + 1)
      setFaqSuggestionNonce((current) => current + 1)
    }
  }, [isChatOpen])

  useEffect(() => {
    if (!showPortalTabs && activePortalPanel !== 'chats') {
      setActivePortalPanel('chats')
      return
    }
    if (activePortalPanel === 'tasks' && !showTasksTab) {
      setActivePortalPanel('chats')
      return
    }
    if (activePortalPanel === 'review' && !showReviewTab) {
      setActivePortalPanel('chats')
    }
  }, [activePortalPanel, showPortalTabs, showReviewTab, showTasksTab])

  useEffect(() => {
    if (!isChatOpen) return
    const node = chatBodyRef.current
    if (!node) return
    window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight
    })
  }, [messages, isChatOpen, showComposerSuggestions, keyboardOffset])

  useEffect(() => {
    if (!isChatOpen || activePortalPanel !== 'chats') return
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: 'end' })
    })
  }, [activePortalPanel, isChatOpen, messages, showComposerSuggestions, showSupportTypingIndicator, showTypingIndicator])

  useEffect(() => {
    const node = inputRef.current
    if (!node) return
    const baseHeight = 52

    if (!isComposerFocused) {
      node.style.height = `${baseHeight}px`
      return
    }

    node.style.height = 'auto'
    node.style.height = `${Math.max(baseHeight, node.scrollHeight)}px`
  }, [inputValue, isComposerFocused])

  const handleSend = (messageOverride?: string) => {
    const nextText = String(messageOverride ?? inputValue ?? '').trim()
    if (!nextText) return

    if (countChars(nextText) > 300) {
      setInternalErrorMessage('Message is too long. Max 300 characters.')
      return
    }

    setFaqSuggestionsDismissed(true)

    if (!onSendMessage && internalRequestedFeedback(nextText)) {
      if (showReviewTab) {
        setActivePortalPanel('review')
      }
      setInternalMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: nextText,
          isBot: false,
          role: 'user',
        },
        {
          id: crypto.randomUUID(),
          text: 'Absolutely. I opened a quick feedback form for you.',
          isBot: true,
          role: 'assistant',
        },
      ])
      setInputValue('')
      setInternalErrorMessage(null)
      setInternalFeedbackOpen(true)
      return
    }

    if (!onSendMessage && internalRequestedTask(nextText) && showTasksTab) {
      setInternalMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: nextText,
          isBot: false,
          role: 'user',
        },
        {
          id: crypto.randomUUID(),
          text: 'Absolutely. I opened a quick ticket form for you.',
          isBot: true,
          role: 'assistant',
        },
      ])
      setActivePortalPanel('tasks')
      setInputValue('')
      setInternalErrorMessage(null)
      return
    }

    if (onSendMessage) {
      setInternalErrorMessage(null)
      setOrbInactiveActive(false)
      setOrbActivityNonce((current) => current + 1)
      onSendMessage(nextText)
      return
    }

    setInternalIsReplying(true)
    setOrbInactiveActive(false)
    setOrbActivityNonce((current) => current + 1)

    window.setTimeout(() => {
      if (enablePreviewChat) {
          setInternalMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              text: nextText,
              isBot: false,
              role: 'user',
            },
            {
              id: crypto.randomUUID(),
              text: previewReply,
              isBot: true,
              role: 'assistant',
            },
          ])
      }

      setInputValue('')
      setInternalErrorMessage(null)
      setInternalIsReplying(false)
    }, enablePreviewChat ? 850 : 180)
  }

  const themeClass = joinWidgetClasses(
    getWidgetThemeClass(colorTheme),
    appearance?.glassLookEnabled ? 'theme-glass-look' : ''
  )
  const useLiquidGlassControls = Boolean(appearance?.glassLookEnabled)
  const themeVars = getWidgetThemeStyle(colorTheme)
  const bubbleClasses = joinWidgetClasses(
    `border-${bubbleStyle.borderType}`,
    `shadow-${bubbleStyle.shadowType}`,
    `animation-${bubbleStyle.animationType}`,
    `size-${bubbleStyle.sizeType}`
  )

  const bodyClasses = joinWidgetClasses(
    'chat-body',
    `border-${bodyStyle.borderType}`,
    `shadow-${bodyStyle.shadowType}`,
    `messages-${bodyStyle.messageStyle}`
  )

  const footerClasses = joinWidgetClasses(
    'chat-footer',
    `border-${footerStyle.borderType}`,
    `shadow-${footerStyle.shadowType}`,
    `input-${footerStyle.inputStyle}`
  )
  const title = customBranding.title || 'Support Chat'
  const description = customBranding.description || 'Usually replies in a few minutes'
  const logoStyle = normalizeLogoStyle(customBranding.logoStyle)
  const orbSettings = bubbleStyle.orbStyle || {
    hoverEnabled: true,
    hoverGlyph: 'A',
    replyEnabled: false,
    replyGlyphs: '',
    inactiveEnabled: false,
    inactiveGlyphs: '',
    inactivityMinMinutes: 2,
    inactivityMaxMinutes: 4,
  }
  const inactivityMinMinutes = Math.max(
    1,
    Math.min(orbSettings.inactivityMinMinutes || 2, orbSettings.inactivityMaxMinutes || 4)
  )
  const inactivityMaxMinutes = Math.max(
    inactivityMinMinutes,
    Math.max(orbSettings.inactivityMaxMinutes || 4, inactivityMinMinutes)
  )
  const orbPhase =
    bubbleStyle.iconChoice !== 'orb'
      ? 'none'
      : isReplying && orbSettings.replyEnabled
          ? 'reply'
          : orbInactiveActive && orbSettings.inactiveEnabled
            ? 'inactive'
            : internalIsOrbHovered && orbSettings.hoverEnabled
              ? 'hover'
            : 'spin'

  useEffect(() => {
    if (bubbleStyle.iconChoice !== 'orb' || !orbSettings.hoverEnabled) {
      setInternalIsOrbHovered(false)
    }
  }, [bubbleStyle.iconChoice, orbSettings.hoverEnabled])

  useEffect(() => {
    if (!isChatOpen) {
      setIsComposerFocused(false)
    }
  }, [isChatOpen])

  useEffect(() => {
    if (bubbleStyle.iconChoice !== 'orb' || !orbSettings.inactiveEnabled) {
      setOrbInactiveActive(false)
      return
    }

    if (isReplying) {
      setOrbInactiveActive(false)
      return
    }

    if (orbInactiveActive) {
      if (orbInactiveHoldTimerRef.current) {
        window.clearTimeout(orbInactiveHoldTimerRef.current)
      }

      orbInactiveHoldTimerRef.current = window.setTimeout(() => {
        setOrbInactiveActive(false)
        setOrbActivityNonce((current) => current + 1)
      }, 20_000)

      return () => {
        if (orbInactiveHoldTimerRef.current) {
          window.clearTimeout(orbInactiveHoldTimerRef.current)
          orbInactiveHoldTimerRef.current = null
        }
      }
    }

    if (orbInactivityTimerRef.current) {
      window.clearTimeout(orbInactivityTimerRef.current)
    }

    const minMs = inactivityMinMinutes * 60_000
    const maxMs = inactivityMaxMinutes * 60_000
    const delayMs = minMs >= maxMs ? minMs : minMs + Math.random() * (maxMs - minMs)

    orbInactivityTimerRef.current = window.setTimeout(() => {
      setOrbInactiveActive(true)
    }, delayMs)

    return () => {
      if (orbInactivityTimerRef.current) {
        window.clearTimeout(orbInactivityTimerRef.current)
        orbInactivityTimerRef.current = null
      }
    }
  }, [
    bubbleStyle.iconChoice,
    orbSettings.inactiveEnabled,
    orbSettings.inactivityMinMinutes,
    orbSettings.inactivityMaxMinutes,
    inactivityMinMinutes,
    inactivityMaxMinutes,
    isReplying,
    orbInactiveActive,
    orbActivityNonce,
  ])

  const previewContent = (
    <div
      className={`widget-viewport ${variant === 'embedded' ? 'widget-viewport-embedded' : ''} position-${position} preview-${previewMode}`}
      style={
        {
          '--widget-keyboard-offset': `${Math.max(0, keyboardOffset)}px`,
        } as CSSProperties
      }
    >
      <div className={`floating-chat-preview ${themeClass}`} style={themeVars as CSSProperties}>
        <div className="widgetcontainer">
          <div className={`chat-widget ${isChatOpen ? 'open' : ''} ${showStarterCards ? 'chat-widget--starter' : ''}`} hidden={!isChatOpen} aria-hidden={!isChatOpen}>
            <div
              className="chat-widget-interaction-surface"
              onPointerDownCapture={(event) => {
                const target = event.target as HTMLElement | null
                if (!target) return
                if (target.closest('.chat-footer')) {
                  setIsComposerFocused(true)
                  return
                }
                if (target.closest('.widget-starter-cards') || target.closest('.widget-starter-options')) {
                  return
                }
                if (target.closest('.widget-faq-suggestions')) {
                  return
                }
                setIsComposerFocused(false)
              }}
            >
            <div className="chat-header">
              <div className="chat-header-left">
                {showStarterCardList ? (
                  <button type="button" className="chat-header-back" onClick={() => setActiveConversationCardId(null)} aria-label="Go back">
                    {renderWidgetIcon(effectiveAssistantIcons.backIcon, { 'aria-hidden': true }) || <FiArrowLeft aria-hidden="true" />}
                  </button>
                ) : null}

                {showStarterCardList ? (
                  <>
                    {headerStyle.showAvatar && (customBranding.logo || effectiveAssistantIcons.avatarIcon) ? (
                      <div className={`avatar ${customBranding.logo ? 'avatar--image' : ''}`}>
                        {customBranding.logo ? (
                          <div
                            className="avatar-image"
                            aria-hidden="true"
                            style={{
                              backgroundImage: `url(${customBranding.logo})`,
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: `${logoStyle.zoom}% ${logoStyle.zoom}%`,
                              backgroundPosition: `${logoStyle.focusX}% ${logoStyle.focusY}%`,
                            }}
                          />
                        ) : (
                          renderWidgetIcon(effectiveAssistantIcons.avatarIcon, { 'aria-hidden': true })
                        )}
                      </div>
                    ) : null}

                    <div className="chat-header-copy">
                      {headerStyle.showTitle && <h3>{title}</h3>}
                      <p>{description}</p>
                    </div>
                  </>
                ) : (
                  <>
                    {headerStyle.showAvatar && (customBranding.logo || effectiveAssistantIcons.avatarIcon) ? (
                      <div className={`avatar ${customBranding.logo ? 'avatar--image' : ''}`}>
                        {customBranding.logo ? (
                          <div
                            className="avatar-image"
                            aria-hidden="true"
                            style={{
                              backgroundImage: `url(${customBranding.logo})`,
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: `${logoStyle.zoom}% ${logoStyle.zoom}%`,
                              backgroundPosition: `${logoStyle.focusX}% ${logoStyle.focusY}%`,
                            }}
                          />
                        ) : (
                          renderWidgetIcon(effectiveAssistantIcons.avatarIcon, { 'aria-hidden': true })
                        )}
                      </div>
                    ) : null}

                    <div className="chat-header-copy">
                      {headerStyle.showTitle && <h3>{title}</h3>}
                      <p>{description}</p>
                    </div>

                    {headerStyle.showStatus && <span className="header-status-dot" aria-hidden="true" />}
                  </>
                )}
              </div>

              <div className="chat-header-actions">
                {headerStyle.showStatus && (
                  <span className="status-pill">
                    <FiCheckCircle /> {statusText}
                  </span>
                )}

                {headerStyle.showCloseButton && isChatOpen && (
                  useLiquidGlassControls ? (
                    <WebGLLiquidGlassSendButton
                      type="button"
                      className="close-btn"
                      radius="50%"
                      width={40}
                      height={40}
                      onClick={() => setIsChatOpen(false)}
                      aria-label="Close chat"
                    >
                      {renderWidgetIcon(effectiveAssistantIcons.closeIcon, { 'aria-hidden': true }) || 'x'}
                    </WebGLLiquidGlassSendButton>
                  ) : (
                    <button type="button" className="close-btn" onClick={() => setIsChatOpen(false)} aria-label="Close chat">
                      {renderWidgetIcon(effectiveAssistantIcons.closeIcon, { 'aria-hidden': true }) || 'x'}
                    </button>
                  )
                )}
              </div>
            </div>

              <div className={bodyClasses} ref={chatBodyRef}>
              {showPortalTabs ? (
                <div className="widget-panel-tabs" role="tablist" aria-label="Widget pages">
                  <button
                    type="button"
                    className={`widget-panel-tab ${activePortalPanel === 'chats' ? 'is-active' : ''}`}
                    onClick={() => setActivePortalPanel('chats')}
                    role="tab"
                    aria-selected={activePortalPanel === 'chats'}
                  >
                    Chats
                  </button>
                  {showTasksTab ? (
                    <button
                      type="button"
                      className={`widget-panel-tab ${activePortalPanel === 'tasks' ? 'is-active' : ''}`}
                      onClick={() => setActivePortalPanel('tasks')}
                      role="tab"
                      aria-selected={activePortalPanel === 'tasks'}
                    >
                      Ticket
                    </button>
                  ) : null}
                  {showReviewTab ? (
                    <button
                      type="button"
                      className={`widget-panel-tab ${activePortalPanel === 'review' ? 'is-active' : ''}`}
                      onClick={() => setActivePortalPanel('review')}
                      role="tab"
                      aria-selected={activePortalPanel === 'review'}
                    >
                      Review
                    </button>
                  ) : null}
                </div>
              ) : null}
              <div className={`widget-body-content ${showPortalTabs ? 'widget-body-content--with-panel-tabs' : ''}`}>
              {activePortalPanel === 'tasks' && showTasksTab ? (
                <div className="widget-panel-page widget-panel-page--tasks">
                  <div className="widget-panel-page__hero">
                    <strong>Create a ticket</strong>
                    <p>Send a ticket directly to the support team and track it here.</p>
                  </div>
                  <label className="widget-feedback-field">
                    <span>Title</span>
                    <input type="text" className="widget-task-input" placeholder="What do you need help with?" />
                  </label>
                  <label className="widget-feedback-field">
                    <span>Description</span>
                    <textarea rows={5} className="widget-task-textarea" placeholder="Describe the issue and what you want us to do next." />
                  </label>
                  <div className="widget-feedback-actions">
                    <button type="button" className="widget-feedback-primary" disabled>
                      Create ticket
                    </button>
                  </div>
                  <div className="widget-task-list">
                    <article className="widget-task-card">
                      <div className="widget-task-card__top">
                        <strong>Refund follow-up</strong>
                        <span className="widget-task-badge widget-task-badge--in-progress">in-progress</span>
                      </div>
                      <p>Follow up with the customer and confirm the refund window.</p>
                      <div className="widget-task-card__meta">
                        <span>Support</span>
                        <span>10:26 AM</span>
                      </div>
                    </article>
                  </div>
                </div>
              ) : activePortalPanel === 'review' && showReviewTab ? (
                <div className="widget-panel-page widget-panel-page--review">
                  <div className="widget-panel-page__hero">
                    <strong>Leave a review</strong>
                    <p>Tell us how the chat went and give us a star rating.</p>
                  </div>
                  <button
                    type="button"
                    className="widget-feedback-primary"
                    onClick={() => activeFeedbackOverlay.onSubmit()}
                    disabled={Boolean(activeFeedbackOverlay.submitting)}
                  >
                    {activeFeedbackOverlay.submitting ? 'Sending...' : 'Open review form'}
                  </button>
                </div>
              ) : showStarterCards && !showStarterCardList ? (
                <div className={`widget-starter-cards widget-starter-cards--${bodyStyle.conversationCardsLayout} widget-starter-cards--${bodyStyle.conversationCardsStyle} ${useDenseStarterGrid ? 'widget-starter-cards--dense' : ''}`.trim()}>
                  <div className={`widget-starter-cards__hero widget-starter-cards__hero--${bodyStyle.conversationCardsStyle}`}>
                    {effectiveAssistantIcons.heroIcon ? (
                      <div className="widget-starter-cards__hero-icon" aria-hidden="true">
                        {renderWidgetIcon(effectiveAssistantIcons.heroIcon, { 'aria-hidden': true })}
                      </div>
                    ) : null}
                    <div className="widget-starter-cards__hero-copy">
                      <strong>Hei! 👋</strong>
                      <p>{isMinimalCards ? 'Hva kan jeg hjelpe deg med?' : 'Hva kan jeg hjelpe deg med i dag?'}</p>
                    </div>
                  </div>

                  {starterCardPages.length > 1 ? (
                    <div className="widget-starter-cards__dots" aria-label="Starter card pages">
                      {starterCardPages.map((_, pageIndex) => (
                        <button
                          key={pageIndex}
                          type="button"
                          className={pageIndex === starterCardPageIndex ? 'is-active' : ''}
                          onClick={() => setStarterCardPageIndex(pageIndex)}
                          aria-pressed={pageIndex === starterCardPageIndex}
                          aria-label={`Show page ${pageIndex + 1}`}
                        />
                      ))}
                    </div>
                  ) : null}

                  <div className={`widget-starter-cards__grid widget-starter-cards__grid--${bodyStyle.conversationCardsStyle}`}>
                    {currentStarterCardPage.map((card) => {
                      const hasImage = isImageCards && Boolean(card.image)
                      return (
                        <button
                          key={card.id}
                          type="button"
                          className={`widget-starter-card widget-starter-card--${bodyStyle.conversationCardsStyle}`}
                          onClick={() => {
                            setActiveConversationCardId(card.id)
                          }}
                        >
                          {hasImage ? (
                            <span className="widget-starter-card__image-wrap">
                              <span className="widget-starter-card__image" style={{ backgroundImage: `url(${card.image})` }} />
                              <span className="widget-starter-card__image-overlay" aria-hidden="true" />
                              <span className="widget-starter-card__copy widget-starter-card__copy--image">
                                {card.icon ? <span className="widget-starter-card__icon">{renderStarterCardIcon(card.icon)}</span> : null}
                                <span className="widget-starter-card__title">{card.title}</span>
                                <span className="widget-starter-card__description">{card.description}</span>
                              </span>
                            </span>
                          ) : isChipsCards ? (
                            <span className="widget-starter-card__copy widget-starter-card__copy--chips">
                              {card.icon ? <span className="widget-starter-card__icon">{renderStarterCardIcon(card.icon)}</span> : null}
                              <span className="widget-starter-card__title">{card.title}</span>
                            </span>
                          ) : (
                            <>
                              {card.icon ? <span className="widget-starter-card__icon">{renderStarterCardIcon(card.icon)}</span> : null}
                              <span className="widget-starter-card__copy">
                                <span className="widget-starter-card__title">{card.title}</span>
                                <span className="widget-starter-card__description">{card.description}</span>
                              </span>
                              {isMinimalCards ? <FiChevronRight className="widget-starter-card__chevron" aria-hidden="true" /> : null}
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : showStarterCardList && activeConversationCard ? (
                <div className="widget-starter-options widget-starter-options--panel" aria-label="Suggested next steps">
                  <div className="widget-starter-options__title">
                    <strong>{activeConversationCard.title}</strong>
                    <p>{activeConversationCard.description}</p>
                  </div>
                  {activeConversationCard.options.map((option) => (
                    <button
                      key={`${activeConversationCard.id}-${option.label}`}
                      type="button"
                      className="widget-starter-option"
                      onClick={() => {
                        setFaqSuggestionsDismissed(true)
                        setActiveConversationCardId(null)
                        if (onSendMessage) {
                          onSendMessage(option.prompt)
                          return
                        }
                        void handleSend(option.prompt)
                      }}
                      >
                      <span className="widget-starter-option__text">
                        <span className="widget-starter-option__label">{option.label}</span>
                        {option.description ? (
                          <span className="widget-starter-option__description">{option.description}</span>
                        ) : null}
                      </span>
                      <FiChevronRight className="widget-starter-option__arrow" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message message-${getMessageRole(msg)} message--${getMessageRole(msg)} ${getMessageClassName(msg)}`}
                    >
                      <div className="message-content">{msg.text}</div>
                      {(bodyStyle.showTimestamps || (bodyStyle.showReadReceipts && !msg.isBot)) && (
                        <div className="message-meta">
                          {bodyStyle.showTimestamps && (
                            <span className="timestamp">
                              {new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                          {bodyStyle.showReadReceipts && !msg.isBot && (
                            <span className="read-receipt">Read</span>
                          )}
                        </div>
                      )}
                      {getMessageIconKey(msg) ? (
                        <span className="message-role-icon" aria-hidden="true">
                          {renderWidgetIcon(getMessageIconKey(msg), { 'aria-hidden': true })}
                        </span>
                      ) : null}
                    </div>
                  ))}
                  {showComposerSuggestions && (
                    <div className="widget-faq-suggestions" aria-label="Suggested questions">
                      {activeFaqSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="widget-faq-chip"
                          onClick={() => {
                            setFaqSuggestionsDismissed(true)
                            void handleSend(suggestion)
                          }}
                          disabled={disableInput}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  {showTypingIndicator && (
                    <div className="message message-bot message-typing" aria-live="polite" aria-label="Assistant is typing">
                      {effectiveAssistantIcons.aiIcon || effectiveAssistantIcons.heroIcon ? (
                        <span className="message-role-icon" aria-hidden="true">
                          {renderWidgetIcon(effectiveAssistantIcons.aiIcon || effectiveAssistantIcons.heroIcon, { 'aria-hidden': true })}
                        </span>
                      ) : null}
                      <div className="typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                  {showSupportTypingIndicator ? (
                    <div className="message message-support message-typing" aria-live="polite" aria-label="Support is typing">
                      {effectiveAssistantIcons.supportIcon ? (
                        <span className="message-role-icon" aria-hidden="true">
                          {renderWidgetIcon(effectiveAssistantIcons.supportIcon, { 'aria-hidden': true })}
                        </span>
                      ) : null}
                      <div className="typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} aria-hidden="true" />
                </>
              )}
              </div>
              </div>

            {activeHumanHandoffOverlay.open ? (
              <div className="widget-handoff-overlay" role="dialog" aria-modal="true" aria-label="Human support request">
                <div className="widget-handoff-card">
                  <div className="widget-handoff-header">
                    <div>
                      <h4>Connect with human support</h4>
                      <p>Fill in your name, email and phone number so we can follow up.</p>
                    </div>
                    <button type="button" className="widget-handoff-close" onClick={activeHumanHandoffOverlay.onClose} aria-label="Close human handoff form">
                      <FiArrowLeft aria-hidden="true" />
                    </button>
                  </div>
                  <div className="widget-handoff-grid">
                    <label className="widget-handoff-field">
                      <span>Name</span>
                      <input
                        type="text"
                        value={activeHumanHandoffOverlay.name}
                        onChange={(event) => activeHumanHandoffOverlay.onNameChange(event.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </label>
                    <label className="widget-handoff-field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={activeHumanHandoffOverlay.email}
                        onChange={(event) => activeHumanHandoffOverlay.onEmailChange(event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </label>
                    <label className="widget-handoff-field">
                      <span>Phone</span>
                      <input
                        type="tel"
                        value={activeHumanHandoffOverlay.phone}
                        onChange={(event) => activeHumanHandoffOverlay.onPhoneChange(event.target.value)}
                        placeholder="+47 123 45 678"
                        autoComplete="tel"
                      />
                    </label>
                  </div>
                  <div className="widget-handoff-actions">
                    <button
                      type="button"
                      className="widget-handoff-submit"
                      onClick={activeHumanHandoffOverlay.onSubmit}
                      disabled={!String(activeHumanHandoffOverlay.name || '').trim() || Boolean(activeHumanHandoffOverlay.submitting)}
                    >
                      {activeHumanHandoffOverlay.submitting ? 'Sending...' : 'Send request'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={footerClasses}>
              <div className="chat-footer-row">
                <textarea
                  id="widget-message-input"
                  name="widget-message-input"
                  ref={inputRef}
                  placeholder={
                    footerStyle.showPlaceholder
                      ? showStarterCards
                        ? 'Write a message...'
                        : 'Write a message...'
                      : ''
                  }
                  value={inputValue}
                  onFocus={() => setIsComposerFocused(true)}
                  onBlur={() => setIsComposerFocused(false)}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={disableInput}
                  rows={1}
                />

                {footerStyle.showSendButton && (
                  useLiquidGlassControls ? (
                    <WebGLLiquidGlassSendButton
                      type="button"
                      radius={14}
                      width={52}
                      height={52}
                      onClick={() => handleSend()}
                      disabled={disableInput}
                      aria-label="Send message"
                    >
                      {renderWidgetIcon(effectiveAssistantIcons.sendIcon, { 'aria-hidden': true }) || <FiSend />}
                    </WebGLLiquidGlassSendButton>
                  ) : (
                    <button type="button" onClick={() => handleSend()} disabled={disableInput} aria-label="Send message">
                      {renderWidgetIcon(effectiveAssistantIcons.sendIcon, { 'aria-hidden': true }) || <FiSend />}
                    </button>
                  )
                )}
              </div>
              </div>
            )}

            {visibleErrorMessage && <div className="widget-inline-error">{visibleErrorMessage}</div>}
            <FeedbackFormOverlay
              open={Boolean(activeFeedbackOverlay.open)}
              title={feedbackOverlay?.title}
              description={feedbackOverlay?.description}
              rating={activeFeedbackOverlay.rating || 0}
              text={activeFeedbackOverlay.text || ''}
              submitting={activeFeedbackOverlay.submitting}
              onRatingChange={activeFeedbackOverlay.onRatingChange}
              onTextChange={activeFeedbackOverlay.onTextChange}
              onSubmit={activeFeedbackOverlay.onSubmit}
              onClose={activeFeedbackOverlay.onClose}
            />
            </div>
          </div>

          <div
            className={`widget-icon ${bubbleClasses} ${bubbleStyle.iconChoice === 'orb' ? 'widget-icon--orb' : ''} ${bubbleStyle.iconChoice === 'orb' && orbPhase === 'reply' ? 'widget-icon--orb-replying' : ''} ${bubbleStyle.iconChoice === 'orb' && orbPhase === 'inactive' ? 'widget-icon--orb-idle' : ''}`}
            onPointerEnter={() => {
              if (bubbleStyle.iconChoice === 'orb' && orbSettings.hoverEnabled) {
                setInternalIsOrbHovered(true)
              }
            }}
            onPointerLeave={() => {
              if (bubbleStyle.iconChoice === 'orb' && orbSettings.hoverEnabled) {
                setInternalIsOrbHovered(false)
              }
            }}
            onClick={() => setIsChatOpen((prev) => !prev)}
            role="button"
            tabIndex={0}
          >
            <span className="widget-icon-inner" aria-hidden="true">
              {bubbleStyle.iconChoice !== 'orb' && effectiveAssistantIcons.launcherIcon ? (
                renderWidgetIcon(effectiveAssistantIcons.launcherIcon, { 'aria-hidden': true })
              ) : null}
              {!effectiveAssistantIcons.launcherIcon && bubbleStyle.iconChoice === 'chat' && <FiMessageCircle />}
              {!effectiveAssistantIcons.launcherIcon && bubbleStyle.iconChoice === 'phone' && <FiPhone />}
              {!effectiveAssistantIcons.launcherIcon && bubbleStyle.iconChoice === 'cpu' && <FiCpu />}
              {!effectiveAssistantIcons.launcherIcon && bubbleStyle.iconChoice === 'message' && <FiMessageSquare />}
              {!effectiveAssistantIcons.launcherIcon && bubbleStyle.iconChoice === 'support' && <FiLifeBuoy />}
              {bubbleStyle.iconChoice === 'orb' && (
                <OrbAvatar
                  className="widget-orb-avatar"
                  aria-hidden="true"
                  glyph={orbSettings.hoverEnabled ? orbSettings.hoverGlyph || '' : ''}
                  orbMode={orbPhase === 'spin' || orbPhase === 'none' ? 'spin' : orbPhase}
                />
              )}
              {bubbleStyle.showStatus && <span className="status-dot" />}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  if (variant === 'embedded') {
    return previewContent
  }

  return (
    <div className={`widget-preview-shell preview-shell-${previewMode}`}>
      {previewMode === 'mobile' ? (
        <div className="widget-preview-device-frame">
          <div className="widget-preview-device-shell">{previewContent}</div>
        </div>
      ) : (
        previewContent
      )}
      {typeof total === 'number' ? (
        <div className="widget-preview-total">
          <p className="widget-preview-total-label">{pricingText.subscriptionTotal}</p>
          <h3 className="widget-preview-total-price">
            {formattedTotal}
            <span>/{billingPeriod}</span>
          </h3>
          <div className="widget-preview-total-meta">
            <span>{plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : pricingText.plan}</span>
            <span>{billingCycle === 'yearly' ? pricingText.year : pricingText.month}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
