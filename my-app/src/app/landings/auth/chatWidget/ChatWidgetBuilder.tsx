'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiCheck,
  FiCpu,
  FiCreditCard,
  FiDroplet,
  FiLayout,
  FiLifeBuoy,
  FiMessageCircle,
  FiMessageSquare,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSend,
  FiSliders,
  FiMonitor,
  FiSmartphone,
} from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiArrowRight, FiMoon, FiSun } from 'react-icons/fi'
import { resolveAppThemePreference, writeAppThemePreference } from '@/lib/theme-preference'
import { useAuth } from '@/context/AuthContext'
import { createChatWidget, setActiveChatWidget, updateChatAssistantConfig, updateChatWidgetConfig } from '@/lib/auth.service'
import { defaultConversationCards, normalizeConversationCards } from '@/lib/conversation-cards'
import { chatWidgetBuilderExtraI18n, chatWidgetBuilderI18n, useVintraLanguage } from '@/lib/i18n'
import {
  getEffectiveBusinessPlan,
  getPlanLimits,
  isPlanFeatureAvailable,
  sanitizeBubbleStyleForPlan,
  sanitizeChatWidgetConfigForPlan,
} from '@/lib/subscription'
import type {
  AssistantConversationCard,
  BubbleIconChoice,
  ChatAssistantConfig,
  ChatWidgetConfig,
  ChatWidgetInterfaceIcons,
  OrbStyleConfig,
} from '@/types/database'
import './ChatWidget.css'
import '@/components/chat/StudioSettings.css'

import StudioKnowledgeSettings from '@/components/chat/StudioKnowledgeSettings'
import StudioFeatureSettings, { type StudioDecisions } from '@/components/chat/StudioFeatureSettings'
import { hasAssistantKnowledge, setupDecisionsComplete } from '@/lib/studio-onboarding.mjs'
import WidgetFlowSettings from '@/components/chat/WidgetFlowSettings'
import PersonalitySettings from '@/components/chat/PersonalitySettings'
import { CHAT_PERSONALITIES } from '@/lib/chat-personality'
import PlanSelector from './components/PlanSelector'
import StyleSelector from './components/StyleSelector'
import WidgetPreview from './components/WidgetPreview'

type Plan = 'free' | 'pro' | 'business'
type BillingCycle = 'monthly' | 'yearly'
type ColorTheme =
  | 'modern'
  | 'chilling'
  | 'corporate'
  | 'luxury'
  | 'pink-blast'
  | 'red-velvet'
  | 'deep-blue'
  | 'banana-bonanza'
type Position = 'bottom-right' | 'bottom-left'
type PreviewMode = 'desktop' | 'mobile'
type PreviewHighlightTarget = 'bubble' | 'header' | 'body' | 'footer'
type BuilderSectionKey = keyof typeof defaultOpenSections

const defaultOpenSections = {
  plan: false,
  bubble: true,
  header: false,
  body: false,
  footer: false,
  colorTheme: false,
  icons: false,
  branding: false,
  advanced: false,
  contact: false,
  reviews: false,
  tickets: false,
}

const defaultOrbStyle: OrbStyleConfig = {
  hoverEnabled: true,
  hoverGlyph: 'A',
  replyEnabled: false,
  replyGlyphs: '',
  inactiveEnabled: false,
  inactiveGlyphs: '',
  inactivityMinMinutes: 2,
  inactivityMaxMinutes: 4,
}

const createDefaultAssistantConfig = (): ChatAssistantConfig => ({
  enabled: true,
  provider: 'gemini',
  model: 'gemini-2.5-flash-lite',
  strictContextOnly: true,
  strictness: 'balanced',
  systemPrompt:
    'You are a helpful customer service assistant for the business. Use approved business information, keep answers concise, and be honest about uncertainty.',
  businessContext: '',
  businessProfile: {
    businessName: '',
    industry: '',
    shortDescription: '',
    toneOfVoice: 'professional, warm, helpful',
    language: 'English',
    multilingual: false,
    mainGoal: 'convert visitors into leads',
    fallbackContact: '',
  },
  knowledgeBase: {
    websiteUrls: [],
    uploadedDocuments: [],
    manualNotes: '',
    openingHours: '',
    contactInfo: '',
    addresses: '',
    keyFAQs: [],
  },
  integrations: {
    replyToQuestions: true,
    collectLeads: true,
    bookMeetings: false,
    routeToPages: true,
    createSupportTickets: false,
    fetchOrderStatus: false,
    handoffToHuman: true,
  },
  restrictions:
    'Do not invent policies, prices, opening hours, or legal guarantees. Only answer from the provided business context when possible.',
  supportTriggerKeywords: ['support', 'human', 'person', 'agent', 'contact', 'call me', 'ring me', 'email me'],
  humanSupportEnabled: true,
  handoffMessage:
    'I can help with that. I will flag this conversation for human follow-up so the team can contact you.',
  faqSuggestionsEnabled: true,
  faqSuggestions: [
    'What are your opening hours?',
    'How do I contact support?',
    'What services do you offer?',
  ],
  conversationCardsEnabled: true,
  conversationCardsLimit: 4,
  conversationCards: defaultConversationCards,
  widgetIcons: {
    avatarIcon: 'FiMessageCircle',
    heroIcon: 'FiMessageCircle',
    aiIcon: 'FiCpu',
    supportIcon: 'FiLifeBuoy',
    userIcon: 'FiUser',
  },
  startLanguage: 'English',
  replyInUserLanguage: true,
  responseStyle: 'Friendly, clear, and concise',
  extraInstructions: 'Always keep answers short unless the user asks for more detail.',
  forceSelectedModelOnly: false,
})

function mergeAssistantConfigDraft(config?: ChatAssistantConfig | null): ChatAssistantConfig {
  const defaults = createDefaultAssistantConfig()
  const defaultsBusinessProfile = defaults.businessProfile!
  const defaultsKnowledgeBase = defaults.knowledgeBase!
  const defaultsIntegrations = defaults.integrations!

  return {
    ...defaults,
    ...(config || {}),
    businessProfile: {
      businessName: config?.businessProfile?.businessName ?? defaultsBusinessProfile.businessName,
      industry: config?.businessProfile?.industry ?? defaultsBusinessProfile.industry,
      shortDescription: config?.businessProfile?.shortDescription ?? defaultsBusinessProfile.shortDescription,
      toneOfVoice: config?.businessProfile?.toneOfVoice ?? defaultsBusinessProfile.toneOfVoice,
      language: config?.businessProfile?.language ?? defaultsBusinessProfile.language,
      multilingual: config?.businessProfile?.multilingual ?? defaultsBusinessProfile.multilingual,
      mainGoal: config?.businessProfile?.mainGoal ?? defaultsBusinessProfile.mainGoal,
      fallbackContact: config?.businessProfile?.fallbackContact ?? defaultsBusinessProfile.fallbackContact,
    },
    knowledgeBase: {
      ...defaultsKnowledgeBase,
      ...(config?.knowledgeBase || {}),
      websiteUrls: config?.knowledgeBase?.websiteUrls ?? defaultsKnowledgeBase.websiteUrls,
      uploadedDocuments: config?.knowledgeBase?.uploadedDocuments ?? defaultsKnowledgeBase.uploadedDocuments,
      manualNotes: config?.knowledgeBase?.manualNotes ?? defaultsKnowledgeBase.manualNotes,
      openingHours: config?.knowledgeBase?.openingHours ?? defaultsKnowledgeBase.openingHours,
      contactInfo: config?.knowledgeBase?.contactInfo ?? defaultsKnowledgeBase.contactInfo,
      addresses: config?.knowledgeBase?.addresses ?? defaultsKnowledgeBase.addresses,
      keyFAQs: config?.knowledgeBase?.keyFAQs ?? defaultsKnowledgeBase.keyFAQs,
    },
    integrations: {
      replyToQuestions: config?.integrations?.replyToQuestions ?? defaultsIntegrations.replyToQuestions,
      collectLeads: config?.integrations?.collectLeads ?? defaultsIntegrations.collectLeads,
      bookMeetings: config?.integrations?.bookMeetings ?? defaultsIntegrations.bookMeetings,
      routeToPages: config?.integrations?.routeToPages ?? defaultsIntegrations.routeToPages,
      createSupportTickets: config?.integrations?.createSupportTickets ?? defaultsIntegrations.createSupportTickets,
      fetchOrderStatus: config?.integrations?.fetchOrderStatus ?? defaultsIntegrations.fetchOrderStatus,
      handoffToHuman: config?.integrations?.handoffToHuman ?? defaultsIntegrations.handoffToHuman,
    },
    widgetIcons: {
      ...defaults.widgetIcons,
      ...(config?.widgetIcons || {}),
    },
    supportTriggerKeywords: Array.isArray(config?.supportTriggerKeywords)
      ? config.supportTriggerKeywords
      : defaults.supportTriggerKeywords,
    faqSuggestions: Array.isArray(config?.faqSuggestions) ? config.faqSuggestions : defaults.faqSuggestions,
    conversationCards: normalizeConversationCards(config?.conversationCards || defaults.conversationCards),
    conversationCardsLimit: Number.isFinite(config?.conversationCardsLimit)
      ? Number(config?.conversationCardsLimit)
      : defaults.conversationCardsLimit,
    conversationCardsEnabled: config?.conversationCardsEnabled ?? defaults.conversationCardsEnabled,
  }
}

const launcherIconChoiceMap: Partial<Record<BubbleIconChoice, string>> = {
  chat: 'FiMessageCircle',
  phone: 'FiPhone',
  cpu: 'FiCpu',
  message: 'FiMessageSquare',
  support: 'FiLifeBuoy',
}

type InputsState = {
  plan: Plan
  billingCycle: BillingCycle
  colorTheme: ColorTheme
  appearance: {
    openAnimation?: 'none' | 'fade' | 'slide' | 'pop' | 'bounce'
    sentAnimation?: 'none' | 'fade' | 'slide' | 'pop' | 'bounce'
    receivedAnimation?: 'none' | 'fade' | 'slide' | 'pop' | 'bounce'
    glassLookEnabled: boolean
  }
  position: Position
  widgetIcons: ChatWidgetInterfaceIcons
  bubbleStyle: {
    showStatus: boolean
    iconChoice: BubbleIconChoice
    borderType: 'none' | 'solid' | 'rounded' | 'shadow' | 'dashed' | 'double' | 'wavy'
    shape?: 'circle' | 'rounded-square' | 'square' | 'triangle' | 'diamond'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    animationType: 'none' | 'bounce' | 'fade' | 'slide'
    sizeType: 'small' | 'medium' | 'large'
    orbStyle?: OrbStyleConfig
  }
  headerStyle: {
    borderLine?: 'none' | 'solid' | 'dashed' | 'double' | 'wavy'
    showStatus: boolean
    showCloseButton: boolean
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    cornerStyle?: 'rounded' | 'square'
    showBorder?: boolean
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    showAvatar: boolean
    showTitle: boolean
  }
  bodyStyle: {
    messageCornerStyle?: 'rounded' | 'square'
    messageBorderLine?: 'none' | 'solid' | 'dashed' | 'double' | 'wavy'
    borderLine?: 'none' | 'solid' | 'dashed' | 'double' | 'wavy'
    cornerStyle?: 'rounded' | 'square'
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
    borderLine?: 'none' | 'solid' | 'dashed' | 'double' | 'wavy'
    showSendButton: boolean
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    cornerStyle?: 'rounded' | 'square'
    showBorder?: boolean
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    inputStyle: 'flat' | 'rounded' | 'outlined'
    showPlaceholder: boolean
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
  settings: ChatWidgetConfig['settings']
  conversationCardsEnabled: boolean
  conversationCardsLimit: number
  conversationCards: AssistantConversationCard[]
}

const defaultInputs: InputsState = {
  plan: 'pro',
  billingCycle: 'monthly',
  colorTheme: 'modern',
  appearance: {
    glassLookEnabled: false,
  },
  position: 'bottom-right',
  widgetIcons: {
    launcherIcon: 'FiMessageCircle',
    avatarIcon: 'FiMessageCircle',
    heroIcon: 'FiMessageCircle',
    closeIcon: 'FiX',
    backIcon: 'FiArrowLeft',
    sendIcon: 'FiSend',
    aiIcon: 'FiCpu',
    supportIcon: 'FiLifeBuoy',
    userIcon: 'FiUser',
  },
  bubbleStyle: {
    showStatus: true,
    iconChoice: 'chat',
    borderType: 'rounded',
    shadowType: 'medium',
    animationType: 'none',
    sizeType: 'medium',
    orbStyle: defaultOrbStyle,
  },
  headerStyle: {
    showStatus: true,
    showCloseButton: true,
    borderType: 'none',
    cornerStyle: 'rounded',
    showBorder: false,
    shadowType: 'light',
    showAvatar: true,
    showTitle: true,
  },
  bodyStyle: {
    borderType: 'none',
    shadowType: 'none',
    messageStyle: 'bubble',
    showTimestamps: true,
    showReadReceipts: false,
    showConversationCards: true,
    conversationCardsLayout: 'grid',
    conversationCardsStyle: 'modern',
  },
  footerStyle: {
    showSendButton: true,
    borderType: 'none',
    cornerStyle: 'rounded',
    showBorder: false,
    shadowType: 'light',
    inputStyle: 'rounded',
    showPlaceholder: true,
  },
  customBranding: {
    title: 'Support Chat',
    description: 'We are here to help you!',
    logoStyle: {
      zoom: 100,
      focusX: 50,
      focusY: 50,
    },
  },
  settings: {
    autoOpen: false,
    delayMs: 3000,
  },
  conversationCardsEnabled: true,
  conversationCardsLimit: defaultConversationCards.length,
  conversationCards: defaultConversationCards,
}

export default function ChatWidgetBuilder({ embedded = false, widgetKey, onWidgetSelected, setupMode = false, onSetupComplete }: { embedded?: boolean; widgetKey?: string; onWidgetSelected?: (key: string) => void; setupMode?: boolean; onSetupComplete?: () => Promise<void> }) {
  const router = useRouter()
  const { isAuthenticated, firebaseUser, dbUser, business, loading, error: accountError, refreshBusiness, refreshCurrentUser } = useAuth()
  const signedIn = Boolean(firebaseUser)
  const { language, setLanguage } = useVintraLanguage()
  const no = language === 'no'
  const t = chatWidgetBuilderI18n[language]
  const builderExtraText = chatWidgetBuilderExtraI18n[language]

  const [workspaceMode, setWorkspaceMode] = useState<'knowledge' | 'personality' | 'features' | 'design'>('knowledge')
  const [decisions, setDecisions] = useState<StudioDecisions>({})
  const [setupError, setSetupError] = useState('')
  const [inputs, setInputs] = useState<InputsState>(defaultInputs)
  const [assistantConfigDraft, setAssistantConfigDraft] = useState<ChatAssistantConfig>(createDefaultAssistantConfig())
  const [hasLoadedDbConfig, setHasLoadedDbConfig] = useState(false)
  const [previewScenario, setPreviewScenario] = useState<'welcome' | 'conversation'>('welcome')
  const [previewSession, setPreviewSession] = useState(0)
  const [presetNotice, setPresetNotice] = useState('')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [selectedWidgetKey, setSelectedWidgetKey] = useState('')
  const [previewHighlightTarget, setPreviewHighlightTarget] = useState<PreviewHighlightTarget | null>(null)
  const [previewFlashTarget, setPreviewFlashTarget] = useState<PreviewHighlightTarget | null>(null)
  const builderPanelRef = useRef<HTMLDivElement | null>(null)
  const previewFlashTimeoutRef = useRef<number | null>(null)

  const [openSections, setOpenSections] = useState(defaultOpenSections)

  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingWidget, setIsCreatingWidget] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [resetAnimating, setResetAnimating] = useState(false)

  const widgetList = business?.chatWidgets || []
  const selectedWidget = useMemo(() => {
    if (!widgetList.length) return null
    return (
      widgetList.find((widget) => widget.widgetKey === selectedWidgetKey) ||
      widgetList.find((widget) => widget.widgetKey === business?.activeChatWidgetKey) ||
      widgetList[0] ||
      null
    )
  }, [business?.activeChatWidgetKey, selectedWidgetKey, widgetList])
  const databasePlan = useMemo(
    () => getEffectiveBusinessPlan(business, selectedWidget?.config),
    [business, selectedWidget?.config]
  )
  const widgetLimit = getPlanLimits(databasePlan).maxWidgets
  const canCreateWidget = widgetLimit === null || widgetList.length < widgetLimit

  const applyWidgetConfig = (config: ChatWidgetConfig | undefined, assistantConfig?: ChatAssistantConfig | null) => {
    if (!config) return
    const mergedAssistantConfig = mergeAssistantConfigDraft(assistantConfig || business?.chatAssistantConfig || null)

    const effectivePlan = getEffectiveBusinessPlan(business, config)
    const bubbleStyle = sanitizeBubbleStyleForPlan(config.bubbleStyle || defaultInputs.bubbleStyle, effectivePlan)
    const configIcons = config.widgetIcons || {}
    const migratedIcons: ChatWidgetInterfaceIcons = {
      ...defaultInputs.widgetIcons,
      ...configIcons,
    }
    const legacyAssistantIcons = business?.chatAssistantConfig?.widgetIcons || {}

    ;(['avatarIcon', 'heroIcon', 'aiIcon', 'supportIcon', 'userIcon'] as const).forEach((field) => {
      const legacyValue = legacyAssistantIcons[field]
      if (!legacyValue) return
      const currentValue = configIcons[field]
      if (!currentValue || currentValue === defaultInputs.widgetIcons[field]) {
        migratedIcons[field] = legacyValue
      }
    })

    setInputs({
      plan: effectivePlan,
      billingCycle: config.billingCycle || defaultInputs.billingCycle,
      colorTheme: config.colorTheme || defaultInputs.colorTheme,
      appearance: {
        ...defaultInputs.appearance,
        ...(config.appearance || {}),
        glassLookEnabled: isPlanFeatureAvailable(effectivePlan, 'glassLook')
          ? Boolean(config.appearance?.glassLookEnabled)
          : false,
      },
      position: config.position || defaultInputs.position,
      widgetIcons: {
        ...migratedIcons,
        launcherIcon:
          config.widgetIcons?.launcherIcon ||
          launcherIconChoiceMap[bubbleStyle.iconChoice] ||
          defaultInputs.widgetIcons.launcherIcon,
      },
      bubbleStyle: {
        ...defaultInputs.bubbleStyle,
        ...bubbleStyle,
        orbStyle: {
          ...defaultOrbStyle,
          ...(bubbleStyle.orbStyle || {}),
        },
      },
      headerStyle: {
        ...defaultInputs.headerStyle,
        ...(config.headerStyle || {}),
      },
      bodyStyle: {
        ...defaultInputs.bodyStyle,
        ...(config.bodyStyle || {}),
      },
      footerStyle: {
        ...defaultInputs.footerStyle,
        ...(config.footerStyle || {}),
      },
      customBranding: {
        ...defaultInputs.customBranding,
        ...(config.customBranding || {}),
        logoStyle: {
          zoom: config.customBranding?.logoStyle?.zoom ?? defaultInputs.customBranding.logoStyle!.zoom,
          focusX: config.customBranding?.logoStyle?.focusX ?? defaultInputs.customBranding.logoStyle!.focusX,
          focusY: config.customBranding?.logoStyle?.focusY ?? defaultInputs.customBranding.logoStyle!.focusY,
        },
      },
      settings: config.settings || defaultInputs.settings,
      conversationCardsEnabled: mergedAssistantConfig.conversationCardsEnabled,
      conversationCardsLimit: mergedAssistantConfig.conversationCardsLimit,
      conversationCards: normalizeConversationCards(mergedAssistantConfig.conversationCards),
    })
    setAssistantConfigDraft(mergedAssistantConfig)
  }

  useEffect(() => {
    if (!isAuthenticated || hasLoadedDbConfig) return

    const widget = selectedWidget
    const config = widget?.config || business?.chatWidgetConfig
    if (!config) return
    applyWidgetConfig(config, widget?.assistantConfig || business?.chatAssistantConfig || null)

    setSelectedWidgetKey(widget?.widgetKey || business?.activeChatWidgetKey || business?.chatWidgetKey || '')

    setHasLoadedDbConfig(true)
  }, [isAuthenticated, business, hasLoadedDbConfig, selectedWidget])

  useEffect(() => {
    if (!hasLoadedDbConfig) return

    setInputs((prev) => ({
      ...prev,
      plan: databasePlan,
      appearance: {
        ...prev.appearance,
        glassLookEnabled: isPlanFeatureAvailable(databasePlan, 'glassLook')
          ? prev.appearance.glassLookEnabled
          : false,
      },
      bubbleStyle: sanitizeBubbleStyleForPlan(prev.bubbleStyle, databasePlan),
    }))
  }, [databasePlan, hasLoadedDbConfig])

  const applyDesignPreset = (preset: 'nordic' | 'minimal' | 'welcoming' | 'boutique' | 'playful') => {
    setInputs((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, glassLookEnabled: false },
      colorTheme: preset === 'minimal' ? 'corporate' : preset === 'welcoming' ? 'chilling' : preset === 'boutique' ? 'luxury' : preset === 'playful' ? 'pink-blast' : 'modern',
      bubbleStyle: { ...prev.bubbleStyle, borderType: 'rounded', shadowType: 'light', animationType: 'none', sizeType: 'medium' },
      headerStyle: { ...prev.headerStyle, cornerStyle: 'rounded', borderType: 'none', showBorder: false, shadowType: 'none' },
      bodyStyle: { ...prev.bodyStyle, borderType: 'none', shadowType: 'none', messageStyle: preset === 'minimal' ? 'flat' : preset === 'boutique' ? 'card' : 'bubble', conversationCardsLayout: preset === 'minimal' ? 'list' : 'grid', conversationCardsStyle: preset === 'minimal' ? 'minimal' : preset === 'playful' ? 'bubble' : 'modern' },
      footerStyle: { ...prev.footerStyle, cornerStyle: 'rounded', borderType: 'none', showBorder: false, shadowType: 'none', inputStyle: preset === 'minimal' ? 'flat' : 'rounded' },
    }))
    setSaveStatus('idle')
    setPresetNotice(no ? 'Stilen er valgt. Tilpass detaljene og lagre når du er klar.' : 'Style applied. Adjust the details and save when you’re ready.')
  }

  const updateInput = <K extends keyof InputsState>(key: K, value: InputsState[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
    setSaveStatus('idle')
  }

  useEffect(() => {
    return () => {
      if (previewFlashTimeoutRef.current) {
        window.clearTimeout(previewFlashTimeoutRef.current)
      }
    }
  }, [])

  const flashPreviewSection = (section: BuilderSectionKey) => {
    if (section !== 'bubble' && section !== 'header' && section !== 'body' && section !== 'footer') return

    setPreviewFlashTarget(section)
    if (previewFlashTimeoutRef.current) {
      window.clearTimeout(previewFlashTimeoutRef.current)
    }
    previewFlashTimeoutRef.current = window.setTimeout(() => {
      setPreviewFlashTarget(null)
      previewFlashTimeoutRef.current = null
    }, 450)
  }

  const updateFlowSettings = (settings: ChatWidgetConfig['settings']) => {
    updateInput('settings', settings)
    if (settings.ticket?.mode && settings.ticket.mode !== inputs.settings.ticket?.mode) {
      setAssistantConfigDraft(previous => ({ ...previous, humanSupportEnabled: settings.ticket?.mode !== 'off' }))
    }
  }
  const toggleSection = (section: BuilderSectionKey) => {
    // A click should not leave the hover outline behind after the pointer moves
    // into the newly opened section.
    setPreviewHighlightTarget(null)
    setOpenSections((prev) => {
      const closed = Object.keys(prev).reduce((acc, key) => {
        acc[key as keyof typeof prev] = false
        return acc
      }, {} as typeof prev)

      return {
        ...closed,
        [section]: true,
      }
    })

    flashPreviewSection(section)
  }

  const builderSections = [
    { key: 'contact', label: no ? 'Kontaktinfo' : 'Contact info', eyebrow: no ? 'SKJEMA' : 'FORM', icon: FiPhone },
    { key: 'reviews', label: no ? 'Anmeldelser' : 'Reviews', eyebrow: no ? 'TILBAKEMELDING' : 'FEEDBACK', icon: FiCheck },
    { key: 'tickets', label: 'Tickets / support', eyebrow: no ? 'OPPFØLGING' : 'FOLLOW-UP', icon: FiLifeBuoy },
    { key: 'bubble', label: builderExtraText.sidebar.chatButton, eyebrow: builderExtraText.sidebar.launcher, icon: FiMessageCircle },
    { key: 'header', label: builderExtraText.sidebar.chatTopBar, eyebrow: builderExtraText.sidebar.header, icon: FiLayout },
    { key: 'body', label: builderExtraText.sidebar.chatMessages, eyebrow: builderExtraText.sidebar.messages, icon: FiMessageSquare },
    { key: 'footer', label: builderExtraText.sidebar.messageBox, eyebrow: builderExtraText.sidebar.input, icon: FiSend },
    { key: 'colorTheme', label: builderExtraText.sidebar.colors, eyebrow: builderExtraText.sidebar.theme, icon: FiDroplet },
  ] as const

  useEffect(() => {
    if (!widgetKey) return
    const widget = widgetList.find(entry => entry.widgetKey === widgetKey)
    if (widget) {
      setSelectedWidgetKey(widgetKey)
      applyWidgetConfig(widget.config, widget.assistantConfig || business?.chatAssistantConfig || null)
    }
  }, [widgetKey, business])

  const resetBuilder = () => {
    const config = selectedWidget?.config || business?.chatWidgetConfig
    if (config) {
      applyWidgetConfig(config, selectedWidget?.assistantConfig || business?.chatAssistantConfig || null)
    } else {
      setInputs(defaultInputs)
      setAssistantConfigDraft(createDefaultAssistantConfig())
    }
    setSaveStatus('idle')
  }

  const handleReset = () => {
    setResetAnimating(true)
    resetBuilder()
  }

  const handleSelectWidget = async (nextWidgetKey: string) => {
    if (!dbUser?.businessId || !nextWidgetKey || nextWidgetKey === selectedWidgetKey) {
      setSelectedWidgetKey(nextWidgetKey)
      return
    }

    const widget = widgetList.find((entry) => entry.widgetKey === nextWidgetKey)
    if (!widget) return

    setSelectedWidgetKey(nextWidgetKey)
    onWidgetSelected?.(nextWidgetKey)
    applyWidgetConfig(widget.config, widget.assistantConfig || business?.chatAssistantConfig || null)

    await setActiveChatWidget(dbUser.businessId, nextWidgetKey)
    await refreshBusiness()
  }

  const handleCreateWidget = async () => {
    if (!isAuthenticated || !dbUser?.businessId || isCreatingWidget || !canCreateWidget) {
      return
    }

    setIsCreatingWidget(true)
    setSaveStatus('idle')

    try {
      const nextName = `${t.newWidgetDefaultName} ${widgetList.length + 1}`
      const result = await createChatWidget(
        dbUser.businessId,
        nextName,
        selectedWidgetKey || selectedWidget?.widgetKey || business?.activeChatWidgetKey || business?.chatWidgetKey || undefined
      )

      if (!result.success || !result.widgetKey) {
        setSaveStatus('error')
        return
      }

      await setActiveChatWidget(dbUser.businessId, result.widgetKey)
      setSelectedWidgetKey(result.widgetKey)
      if (result.widgetKey) onWidgetSelected?.(result.widgetKey)
      await refreshBusiness()
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 1800)
    } catch (error) {
      console.error('Failed to create chat widget:', error)
      setSaveStatus('error')
    } finally {
      setIsCreatingWidget(false)
    }
  }

  const saveConfig = async () => {
    setSetupError('')
    if (setupMode && !setupDecisionsComplete(decisions)) {
      setSetupError(no ? 'Velg AI, kontaktinfo, support, tickets og anmeldelser før du fullfører.' : 'Choose AI, contact sharing, support, tickets and reviews before finishing.')
      setWorkspaceMode('features')
      return
    }
    if (setupMode && assistantConfigDraft.enabled && !hasAssistantKnowledge(assistantConfigDraft)) {
      setSetupError(no ? 'Legg inn bedriftsinformasjon før du slår på AI-svar.' : 'Add business information before enabling AI replies.')
      setWorkspaceMode('knowledge')
      return
    }
    if (!isAuthenticated || !dbUser?.businessId) {
      router.push('/auth/login')
      return
    }

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const newConfig = {
        plan: databasePlan,
        billingCycle: inputs.billingCycle,
        colorTheme: inputs.colorTheme,
        appearance: inputs.appearance,
        position: inputs.position,
        widgetIcons: inputs.widgetIcons,
        bubbleStyle: sanitizeBubbleStyleForPlan(inputs.bubbleStyle, databasePlan),
        headerStyle: inputs.headerStyle,
        bodyStyle: inputs.bodyStyle,
        footerStyle: inputs.footerStyle,
        customBranding: inputs.customBranding,
        settings: inputs.settings,
      }
      const planSafeConfig = sanitizeChatWidgetConfigForPlan(newConfig, databasePlan)
      const nextAssistantConfig: ChatAssistantConfig = {
        ...assistantConfigDraft,
        conversationCardsEnabled: inputs.conversationCardsEnabled,
        conversationCardsLimit: inputs.conversationCardsLimit,
        conversationCards: normalizeConversationCards(inputs.conversationCards),
        widgetIcons: {
          ...(assistantConfigDraft.widgetIcons || {}),
          avatarIcon: inputs.widgetIcons.avatarIcon || '',
          heroIcon: inputs.widgetIcons.heroIcon || '',
          aiIcon: inputs.widgetIcons.aiIcon || '',
          supportIcon: inputs.widgetIcons.supportIcon || '',
          userIcon: inputs.widgetIcons.userIcon || '',
        },
      }

      const [result, assistantResult] = await Promise.all([
        updateChatWidgetConfig(dbUser.businessId, planSafeConfig, selectedWidgetKey || undefined),
        updateChatAssistantConfig(dbUser.businessId, nextAssistantConfig, selectedWidgetKey || undefined),
      ])

      if (result.success && assistantResult.success) {
        setAssistantConfigDraft(nextAssistantConfig)
        await refreshBusiness()

        // Send localStorage event for real-time updates in admin panel
        if (typeof window !== 'undefined') {
          const storageKey = `widget-config-${dbUser.businessId}`
          const payload = JSON.stringify(planSafeConfig)
          localStorage.setItem(storageKey, payload)

          window.dispatchEvent(
            new CustomEvent('vintra-widget-config-updated', {
              detail: {
                businessId: dbUser.businessId,
                config: planSafeConfig,
                serializedConfig: payload,
              },
            })
          )
        }

        if (setupMode) await onSetupComplete?.()
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Failed to save widget config:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const activeSection = builderSections.find((section) => openSections[section.key]) || builderSections[0]
  const sectionDescriptions = {
    contact: no ? 'Tilpass kontaktinformasjonen kunden sender til teamet.' : 'Configure the contact details visitors send to the team.',
    reviews: no ? 'La kunden gi en frivillig anmeldelse etter samtalen.' : 'Let visitors leave an optional review after their conversation.',
    tickets: no ? 'Bestem hvordan kunden får hjelp og sender inn oppgaver.' : 'Choose how visitors get help and submit requests.',
    bubble: no ? 'Velg hvordan kundene åpner chatten på nettsiden din.' : 'Choose how customers open the chat on your website.',
    header: no ? 'Gi samtalen en tydelig avsender og et personlig uttrykk.' : 'Give every conversation a clear identity and a personal touch.',
    body: no ? 'Tilpass meldinger og snarveier som hjelper kundene videre.' : 'Customize messages and shortcuts that help customers find their way.',
    footer: no ? 'Gjør det enkelt og behagelig å skrive en melding.' : 'Make sending a message feel simple and natural.',
    colorTheme: no ? 'Finn fargene som passer bedriften din.' : 'Find the colors that feel right for your business.',
    advanced: no ? 'Bestem hvor og når chatten skal vises.' : 'Choose where and when your chat appears.',
    plan: no ? 'Se hva som er inkludert i de ulike abonnementene.' : 'Explore what’s included in each plan.',
  }

  if (loading) return <main className="chatbuilder-page builder-loading" role="status">{no ? 'Laster arbeidsområdet…' : 'Loading your workspace…'}</main>

  return (
    <div className={embedded ? "chatbuilder-page workspaceEmbeddedBuilder" : "chatbuilder-page"}>
      {!embedded && <header className="studioHeader">
        <Link href="/" className="studioBrand"><img src="/image/logo.png" width="32" height="32" alt="" /><strong>Vintra</strong><span>Widget studio</span></Link>
        <div className="studioHeaderTools">
          <select aria-label={no ? 'Språk' : 'Language'} value={language} onChange={(event) => setLanguage(event.target.value as 'no' | 'en')}><option value="no">Norsk</option><option value="en">English</option></select>
          <button type="button" className="studioTheme" aria-label={no ? 'Bytt lys og mørk modus' : 'Switch light and dark mode'} onClick={() => writeAppThemePreference(resolveAppThemePreference() === 'dark' ? 'light' : 'dark')}><FiMoon className="studioMoon" aria-hidden="true" /><FiSun className="studioSun" aria-hidden="true" /></button>
          <Link href={signedIn ? '/admin' : '/auth/login'} className="studioAccountLink">{signedIn ? (no ? 'Til oversikten' : 'Dashboard') : (no ? 'Logg inn' : 'Sign in')}<FiArrowRight aria-hidden="true" /></Link>
        </div>
      </header>}
      <main className="chatbuilder-content">
        {signedIn && (accountError || !dbUser || !business) && (
          <div className="studioAccountNotice" role="alert">
            <strong>{no ? 'Du er logget inn, men arbeidsområdet kunne ikke lastes.' : 'You are signed in, but your workspace could not be loaded.'}</strong>
            <p>{accountError || (no ? 'Kontoen mangler et tilgjengelig arbeidsområde. Kontroller tilgangen din.' : 'Your account has no available workspace. Check your access.')}</p>
            <button type="button" onClick={() => void refreshCurrentUser()}>{no ? 'Prøv igjen' : 'Try again'}</button>
          </div>
        )}
        {!embedded && <section className="chatbuilder-hero">
          <div className="studioIntro">
            {!embedded && <Link className="studioBackLink" href={isAuthenticated ? '/admin' : '/'}><FiArrowLeft aria-hidden="true" />{isAuthenticated ? (no ? 'Arbeidsområdet ditt' : 'Your workspace') : (no ? 'Til forsiden' : 'Back to home')}</Link>}
            <h1>{no ? 'Din merkevare. Din chat.' : 'Your brand. Your chat.'}</h1>
            <p>{no ? 'Skap en chatopplevelse som føles som en del av bedriften din. Tilpass detaljene og se resultatet underveis.' : 'Create a chat experience that feels like part of your business. Refine the details and see your changes as you go.'}</p>
          </div>

          {signedIn ? (
          <div className="chatbuilder-widget-switcher">
            <label htmlFor="builder-widget-select">{t.activeWidget}</label>
            <div className="chatbuilder-widget-switcher-row">
              <select
                id="builder-widget-select"
                value={selectedWidgetKey || business?.activeChatWidgetKey || business?.chatWidgetKey || ''}
                onChange={(event) => void handleSelectWidget(event.target.value)}
                disabled={!widgetList.length}
              >
                {widgetList.length ? (
                  widgetList.map((widget) => (
                    <option key={widget.widgetKey} value={widget.widgetKey}>
                      {widget.name}
                      {widget.isDefault ? ` (${t.defaultWidget})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="">{t.noWidgets}</option>
                )}
              </select>
              <button
                type="button"
                className="chatbuilder-widget-create-btn"
                onClick={() => void handleCreateWidget()}
                disabled={!isAuthenticated || isCreatingWidget || !canCreateWidget}
                title={!canCreateWidget ? t.widgetLimitReached : undefined}
              >
                <FiPlus aria-hidden="true" />
                <span>{isCreatingWidget ? t.creatingWidget : t.addWidget}</span>
              </button>
            </div>
            <span className="chatbuilder-widget-switcher-hint">
              {!canCreateWidget
                ? t.widgetLimitReached
                : widgetList.length > 1
                ? t.editingWidgets(widgetList.length)
                : inputs.plan === 'free'
                  ? t.freeSingleWidget
                  : t.paidMultipleWidgets}
            </span>
          </div>
          ) : (
            <div className="studioGuestNote"><span className="studioEyebrow">{no ? 'PRØV DEG FREM' : 'MAKE IT YOURS'}</span><strong>{no ? 'Finn uttrykket som passer deg.' : 'Find the look that feels like you.'}</strong><p>{no ? 'Du kan utforske editoren uten konto. Logg inn for å lagre chatwidgeten til bedriften din.' : 'Explore the editor without an account. Sign in to save your widget to your workspace.'}</p><Link href="/auth/login">{no ? 'Logg inn for å lagre' : 'Sign in to save'}<FiArrowRight aria-hidden="true" /></Link></div>
          )}
        </section>}




        <div className="chatbuilder-grid">
          <div className="builder-panel glass" ref={builderPanelRef}>
            <div className="panel-header">
              <h2 className="section-title">
                <FiSliders /> {t.configureWidget}
              </h2>

              <div className="panel-actions">


                {signedIn ? (
                  <button
                    className={`save-btn ${isSaving ? 'save-btn--saving' : ''} ${saveStatus === 'success' ? 'save-btn--success' : ''} ${saveStatus === 'error' ? 'save-btn--error' : ''}`}
                    onClick={saveConfig}
                    disabled={isSaving || !isAuthenticated || !business}
                    type="button"
                  >
                    <span className={`save-btn-icon ${isSaving ? 'is-saving' : ''} ${saveStatus === 'success' ? 'is-success' : ''}`}>
                      {isSaving ? (
                        <FiRefreshCw />
                      ) : saveStatus === 'success' ? (
                        <FiCheck />
                      ) : (
                        <FiSave />
                      )}
                    </span>
                    <span>{isSaving ? t.saving : saveStatus === 'success' ? t.savedButton : saveStatus === 'error' ? t.saveFailed : t.saveConfiguration}</span>
                  </button>
                ) : <Link href="/auth/login" className="save-btn">{no ? 'Logg inn for å lagre' : 'Sign in to save'}<FiArrowRight aria-hidden="true" /></Link>}

                <button className="reset-btn" onClick={handleReset} type="button">
                  <span
                    className={`reset-btn-icon ${resetAnimating ? 'reset-btn-icon--spin' : ''}`}
                    onAnimationEnd={() => setResetAnimating(false)}
                  >
                    <FiRefreshCw />
                  </span>
                  <span>{t.reset}</span>
                </button>
              </div>
            </div>

            {setupMode && <div className="studioSetupIntro"><span className="studioEyebrow">{no ? 'KOM I GANG' : 'GET STARTED'}</span><h2>{no ? 'Sett opp din første assistent' : 'Set up your first assistant'}</h2><p>{no ? 'Fire steg. Du kontrollerer innholdet og velger funksjonene. Etter lagring viser vi deg rundt i administrasjonen.' : 'Four steps. Review the information and choose your features. After saving, we will show you around the dashboard.'}</p></div>}
            <nav className="studioWorkspaceTabs" aria-label={no ? 'Oppsett av assistenten' : 'Assistant setup'}>
              {([{ id: 'knowledge', no: 'Bedriften', en: 'Business', icon: FiMonitor }, { id: 'personality', no: 'Svarstil', en: 'Response style', icon: FiMessageCircle }, { id: 'features', no: 'Funksjoner', en: 'Features', icon: FiSliders }, { id: 'design', no: 'Design', en: 'Design', icon: FiDroplet }] as const).map((step, index) => <button type="button" key={step.id} aria-current={workspaceMode === step.id ? 'step' : undefined} onClick={() => setWorkspaceMode(step.id)}><span className="studioStepNumber">{index + 1}</span><step.icon aria-hidden="true" /><strong>{no ? step.no : step.en}</strong></button>)}
            </nav>
            {setupError && <p className="studioSetupError" role="alert">{setupError}</p>}
            {workspaceMode === 'knowledge' && <div className="studioRules"><StudioKnowledgeSettings key={selectedWidgetKey || 'draft'} value={assistantConfigDraft} no={no} onChange={value => { setAssistantConfigDraft(value); setSaveStatus('idle') }} /></div>}
            {workspaceMode === 'personality' && <div className="studioRules"><PersonalitySettings value={assistantConfigDraft} no={no} onChange={value => { setAssistantConfigDraft(value); setSaveStatus('idle') }} /></div>}
            {workspaceMode === 'features' && <div className="studioRules"><StudioFeatureSettings assistant={assistantConfigDraft} settings={inputs.settings} no={no} setup={setupMode} decisions={decisions} onDecision={setDecisions} onAssistantChange={setAssistantConfigDraft} onSettingsChange={updateFlowSettings} /></div>}
            {workspaceMode === 'design' && <>        <section className="studioPresets" aria-label={no ? 'Ferdige designstiler' : 'Design presets'}>
          <div className="studioPresetIntro"><span className="studioEyebrow">{no ? 'ET GODT UTGANGSPUNKT' : 'A GOOD STARTING POINT'}</span><h2>{no ? 'Finn din stil.' : 'Find your style.'}</h2><p>{no ? 'Velg et samlet uttrykk. Behold navn, innhold og logo.' : 'Start with a coordinated look. Keep your name, content and logo.'}</p></div>
          <div className="studioPresetChoices">
            {([
              { id: 'nordic', title: no ? 'Nordisk' : 'Nordic', description: no ? 'Rolig blå. Myke former.' : 'Calm blue. Soft edges.', color: '#285f86' },
              { id: 'minimal', title: no ? 'Minimal' : 'Minimal', description: no ? 'Grafitt. Rent og diskret.' : 'Graphite. Clean and understated.', color: '#4b5563' },
              { id: 'welcoming', title: no ? 'Varm & vennlig' : 'Warm & friendly', description: no ? 'Skoggrønn. Åpent og personlig.' : 'Forest green. Open and personal.', color: '#047857' },
              { id: 'boutique', title: 'Boutique', description: no ? 'Lilla. Elegant med meldingskort.' : 'Violet. Elegant message cards.', color: '#6d28d9' },
              { id: 'playful', title: no ? 'Leken' : 'Playful', description: no ? 'Rosa. Myke samtalebobler.' : 'Rose. Soft conversation bubbles.', color: '#a9296b' },
            ] as const).map((preset) => <button type="button" className="studioPreset" key={preset.id} onClick={() => applyDesignPreset(preset.id)}><span className="studioPresetSample" style={{ '--preset-color': preset.color } as React.CSSProperties} aria-hidden="true"><i /><i /><i /></span><span><strong>{preset.title}</strong><small>{preset.description}</small></span><FiArrowRight aria-hidden="true" /></button>)}
          </div>
          {presetNotice && <p className="studioPresetNotice" role="status">{presetNotice}</p>}
        </section><div className="builder-layout">
              <nav className="builder-sidebar" aria-label={no ? 'Widgetinnstillinger' : 'Widget settings'}>
                {builderSections.map((section) => {
                  const SectionIcon = section.icon
                  const active = openSections[section.key]

                  return (
                    <button
                      key={section.key}
                      type="button"
                      className={`builder-sidebar-button ${active ? 'active' : ''}`.trim()}
                      onClick={() => toggleSection(section.key)}
                      onMouseEnter={() => {
                        if (section.key === 'bubble' || section.key === 'header' || section.key === 'body' || section.key === 'footer') {
                          setPreviewHighlightTarget(section.key)
                        }
                      }}
                      onMouseLeave={() => setPreviewHighlightTarget(null)}
                      onFocus={() => {
                        if (section.key === 'bubble' || section.key === 'header' || section.key === 'body' || section.key === 'footer') setPreviewHighlightTarget(section.key)
                      }}
                      onBlur={() => setPreviewHighlightTarget(null)}
                      aria-pressed={active}
                      aria-controls="studio-settings"
                    >
                      <span className="builder-sidebar-button__icon" aria-hidden="true">
                        <SectionIcon />
                      </span>
                      <span className="builder-sidebar-button__copy">
                        <small>{section.eyebrow}</small>
                        <strong>{section.label}</strong>
                      </span>
                    </button>
                  )
                })}
              </nav>

              <section className="builder-content-panel" id="studio-settings" aria-labelledby="studio-section-title">
                <div className="studioSectionIntro"><span className="studioEyebrow">{activeSection.eyebrow}</span><h2 id="studio-section-title">{activeSection.label}</h2><p>{sectionDescriptions[activeSection.key]}</p></div>
                {(activeSection.key === 'contact' || activeSection.key === 'reviews' || activeSection.key === 'tickets') && <WidgetFlowSettings settings={inputs.settings} section={activeSection.key} mode="design" no={no} onChange={updateFlowSettings} />}
                {activeSection.key === 'header' && <label className="widgetFlowToggle"><span>{no ? 'Vis anmeldelsesknapp (krever at anmeldelser er aktivert i Regler)' : 'Show review button (enable reviews in Rules first)'}</span><input type="checkbox" checked={inputs.settings.reviewPage?.showHeaderButton === true} onChange={e => updateInput('settings', { ...inputs.settings, reviewPage: { ...inputs.settings.reviewPage, showHeaderButton: e.target.checked } })} /></label>}
                <PlanSelector
                  plan={inputs.plan}
                  billingCycle={inputs.billingCycle}
                  lockedPlan={databasePlan}
                  onPlanChange={(plan) => updateInput('plan', plan)}
                  onBillingCycleChange={(cycle) => updateInput('billingCycle', cycle)}
                  isOpen={openSections.plan}
                  onToggle={() => toggleSection('plan')}
                />

                <StyleSelector
                  bubbleStyle={inputs.bubbleStyle}
                  plan={databasePlan}
                  headerStyle={inputs.headerStyle}
                  bodyStyle={inputs.bodyStyle}
                  footerStyle={inputs.footerStyle}
                  onBubbleStyleChange={(style) => updateInput('bubbleStyle', style)}
                  onHeaderStyleChange={(style) => updateInput('headerStyle', style)}
                  onBodyStyleChange={(style) => updateInput('bodyStyle', style)}
                  onFooterStyleChange={(style) => updateInput('footerStyle', style)}
                  colorTheme={inputs.colorTheme}
                  appearance={inputs.appearance}
                  position={inputs.position}
                  widgetIcons={inputs.widgetIcons}
                  customBranding={inputs.customBranding}
                  settings={inputs.settings}
                  conversationCardsEnabled={inputs.conversationCardsEnabled}
                  conversationCardsLimit={inputs.conversationCardsLimit}
                  conversationCards={inputs.conversationCards}
                  onColorThemeChange={(theme) => updateInput('colorTheme', theme)}
                  onAppearanceChange={(appearance) => updateInput('appearance', appearance)}
                  onPositionChange={(position) => updateInput('position', position)}
                  onWidgetIconsChange={(widgetIcons) => updateInput('widgetIcons', widgetIcons)}
                  onCustomBrandingChange={(branding) => updateInput('customBranding', branding)}
                  onSettingsChange={(settings) => updateInput('settings', settings)}
                  onConversationCardsEnabledChange={(enabled) => updateInput('conversationCardsEnabled', enabled)}
                  onConversationCardsLimitChange={(limit) => updateInput('conversationCardsLimit', limit)}
                  onConversationCardsChange={(cards) => updateInput('conversationCards', cards)}
                  onPreviewHoverChange={setPreviewHighlightTarget}
                  openSections={openSections}
                  onToggleSection={toggleSection}
                />
              </section>
            </div></>}
            {setupMode && <div className="studioSetupActions">
              <button type="button" disabled={workspaceMode === 'knowledge' || isSaving} onClick={() => setWorkspaceMode(({ personality: 'knowledge', features: 'personality', design: 'features', knowledge: 'knowledge' } as const)[workspaceMode])}>{no ? 'Tilbake' : 'Back'}</button>
              {workspaceMode !== 'design' ? <button type="button" onClick={() => setWorkspaceMode(({ knowledge: 'personality', personality: 'features', features: 'design', design: 'design' } as const)[workspaceMode])}>{no ? 'Neste steg' : 'Next step'}</button> : <button type="button" disabled={isSaving} onClick={() => void saveConfig()}>{isSaving ? (no ? 'Lagrer...' : 'Saving...') : (no ? 'Lagre og start omvisning' : 'Save and start tour')}</button>}
            </div>}
            <div className="studioEditorNote" role="status">{saveStatus === 'error' ? t.saveFailed : saveStatus === 'success' ? t.savedButton : (no ? 'Forhåndsvisningen oppdateres mens du jobber. Lagre når du er fornøyd.' : 'Your preview updates as you work. Save when you’re happy with it.')}</div>
          </div>

          <section className="preview-panel" id="studio-preview" aria-label={no ? 'Forhåndsvisning av chatwidget' : 'Chat widget preview'}>
            <div className="studioPreviewHeader"><span className="studioEyebrow">{no ? 'FORHÅNDSVISNING' : 'PREVIEW'}</span>
            <div className="previewModeSwitcher" role="group" aria-label={t.previewDevice}>
                  <button
                    type="button"
                    className={previewMode === 'desktop' ? 'active' : ''}
                    onClick={() => setPreviewMode('desktop')}
                    aria-pressed={previewMode === 'desktop'}
                  >
                    <FiMonitor />
                    <span>{t.desktop}</span>
                  </button>
                  <button
                    type="button"
                    className={previewMode === 'mobile' ? 'active' : ''}
                    onClick={() => setPreviewMode('mobile')}
                    aria-pressed={previewMode === 'mobile'}
                  >
                    <FiSmartphone />
                    <span>{t.mobile}</span>
                  </button>
                </div>
            </div>
            <p className="studioPreviewNote">{no ? 'Test designet her. Meldinger i forhåndsvisningen blir ikke sendt til bedriften.' : 'Try your design here. Preview messages are not sent to your business.'}</p>
            <div className="studioPreviewScenes" role="group" aria-label={no ? 'Visning i chatten' : 'Chat scene'}>
              <button type="button" aria-pressed={previewScenario === 'welcome'} onClick={() => { setPreviewScenario('welcome'); setPreviewSession((value) => value + 1) }}>{no ? 'Velkomst' : 'Welcome'}</button>
              <button type="button" aria-pressed={previewScenario === 'conversation'} onClick={() => { setPreviewScenario('conversation'); setPreviewSession((value) => value + 1) }}>{no ? 'Samtale' : 'Conversation'}</button>
              <button type="button" className="studioPreviewRestart" onClick={() => setPreviewSession((value) => value + 1)} aria-label={no ? 'Start forhåndsvisningen på nytt' : 'Restart preview'} title={no ? 'Start på nytt' : 'Restart'}><FiRefreshCw aria-hidden="true" /></button>
            </div>
            <WidgetPreview
              key={`${previewScenario}-${previewSession}-${CHAT_PERSONALITIES.find((item) => item.style === assistantConfigDraft.responseStyle)?.id || 'custom'}`}
              previewScenario={previewScenario}
              supportEnabled={assistantConfigDraft.humanSupportEnabled}
              designPage={workspaceMode === 'design' && (activeSection.key === 'contact' || activeSection.key === 'reviews' || activeSection.key === 'tickets') ? activeSection.key : undefined}
              billingCycle={inputs.billingCycle}
              plan={databasePlan}
              bubbleStyle={inputs.bubbleStyle}
              headerStyle={inputs.headerStyle}
              bodyStyle={inputs.bodyStyle}
              footerStyle={inputs.footerStyle}
              settings={inputs.settings}
              position={inputs.position}
              colorTheme={inputs.colorTheme}
              appearance={inputs.appearance}
              customBranding={inputs.customBranding}
              assistantIcons={inputs.widgetIcons}
              initialOpen={true}
              enablePreviewChat={true}
              showConditionalFeaturePreview={false}
              previewReply={(() => { const personality = CHAT_PERSONALITIES.find((item) => item.style === assistantConfigDraft.responseStyle); return personality ? (no ? personality.sampleNo : personality.sampleEn) : (no ? 'Dette er et eksempelsvar. Egen svarstil brukes av AI-en etter lagring.' : 'This is a sample reply. The AI uses your custom response style after saving.') })()}
              previewMode={previewMode}
              conversationCardsEnabled={inputs.conversationCardsEnabled}
              conversationCardsLimit={inputs.conversationCardsLimit}
              conversationCards={inputs.conversationCards}
              highlightedSection={previewHighlightTarget}
              flashSection={previewFlashTarget}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
