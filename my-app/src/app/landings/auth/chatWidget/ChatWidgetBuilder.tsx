'use client'

import TourLauncher from '@/components/TourLauncher'
import Header from '@/components/header'
import VintraHost from '@/svgs/VintraHost'
import LoadingAnimation from '@/components/LoadingAnimation'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiCheck,
  FiCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiEye,
  FiMinimize2,
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

import { createStudioTourProgress, canContinueStudioTour, recordStudioTourAction, getStudioTourSaveAdvance, isStudioTourChoiceAllowed } from '@/lib/studio-tour.mjs'
import StudioTourAnchor from '@/components/chat/StudioTourAnchor'
import StudioModuleList from '@/components/chat/StudioModuleList'
import StudioModuleEditor from '@/components/chat/StudioModuleEditor'
import StudioModuleIcon from '@/components/chat/StudioModuleIcon'
import StudioFocusPage from '@/components/chat/StudioFocusPage'
import useStudioPage from '@/components/chat/useStudioPage'
import ConfirmStudioAction from '@/components/chat/ConfirmStudioAction'
import { addStudioModule, createFreshStudioAssistant, getActiveStudioModules, getPendingStudioDesign, getStudioModuleState, getStudioModuleStatus, removeStudioModule, markStudioDesignReviewed, MANDATORY_STUDIO_MODULES, STUDIO_MODULES } from '@/lib/studio-modules.mjs'
import { cleanImportedKnowledge } from '@/lib/website-knowledge.mjs'
import { hasAssistantKnowledge } from '@/lib/studio-onboarding.mjs'
import { createStudioSnapshot, getStudioReadiness } from '@/lib/studio-state.mjs'
import StudioPreviewPanel from '@/components/chat/StudioPreviewPanel'
import WidgetFlowSettings from '@/components/chat/WidgetFlowSettings'
import { CHAT_PERSONALITIES } from '@/lib/chat-personality'
import PlanSelector from './components/PlanSelector'
import StyleSelector from './components/StyleSelector'
import WidgetPreview from './components/WidgetPreview'
import '@/components/chat/StudioWorkspace.css'

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

const createDefaultAssistantConfig = (): ChatAssistantConfig => (createFreshStudioAssistant({
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
}) as ChatAssistantConfig)

function mergeAssistantConfigDraft(config?: ChatAssistantConfig | null): ChatAssistantConfig {
  const defaults = createDefaultAssistantConfig()
  const defaultsBusinessProfile = defaults.businessProfile!
  const defaultsKnowledgeBase = defaults.knowledgeBase!
  const defaultsIntegrations = defaults.integrations!

  return {
    ...defaults,
    ...(config || {}),
    ...(config && !config.studio ? { studio: undefined } : {}),
    ...(config && config.setupCompleted === undefined ? { setupCompleted: undefined } : {}),
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
      pricing: /\|\s*(?:Page|Source):/i.test(config?.knowledgeBase?.pricing || '') ? cleanImportedKnowledge(config?.knowledgeBase?.pricing) : config?.knowledgeBase?.pricing || '',
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
  conversationCardsEnabled: false,
  conversationCardsLimit: defaultConversationCards.length,
  conversationCards: [],
}

export default function ChatWidgetBuilder({ embedded = false, widgetKey, onWidgetSelected, setupMode = false, onSetupComplete }: { embedded?: boolean; widgetKey?: string; onWidgetSelected?: (key: string) => void; setupMode?: boolean; onSetupComplete?: () => Promise<void> }) {
  const router = useRouter()
  const { isAuthenticated, firebaseUser, dbUser, business, loading, error: accountError, refreshBusiness, refreshCurrentUser } = useAuth()
  const signedIn = Boolean(firebaseUser)
  const { language, setLanguage } = useVintraLanguage()
  const no = language === 'no'
  const t = chatWidgetBuilderI18n[language]
  const builderExtraText = chatWidgetBuilderExtraI18n[language]

  const [tourStep, setTourStep] = useState<number | null>(null)
  const [tourProgress, setTourProgress] = useState<{ completed: number[]; moduleId: string | null; designChanged: boolean }>(createStudioTourProgress)
  const [pendingTourAdvance, setPendingTourAdvance] = useState<number | null>(null)
  const guestTour = !signedIn && !embedded && tourStep !== null
  useEffect(() => {
    if (loading || signedIn || embedded) return
    try { if (localStorage.getItem('vintra:studio-tour:v1') !== 'seen') setTourStep(0) }
    catch { setTourStep(0) }
  }, [loading, signedIn, embedded])
  const finishTour = () => {
    try { localStorage.setItem('vintra:studio-tour:v1', 'seen') } catch { /* Storage is optional. */ }
    setTourStep(null)
  }
  const [workspaceMode, setWorkspaceMode] = useState<'knowledge' | 'personality' | 'features' | 'design'>('features')
  const [setupFinished, setSetupFinished] = useState(false)
  const [knowledgeReviewed, setKnowledgeReviewed] = useState(false)
  const [setupError, setSetupError] = useState('')
  const { page: studioPage, open: navigateStudioPage, back: backFromStudioPage } = useStudioPage()
  const editingModule = studioPage?.kind === 'module' ? studioPage.id : null
  useEffect(() => {
    if (pendingTourAdvance === null || studioPage) return
    const next = pendingTourAdvance
    setPendingTourAdvance(null)
    if (!guestTour) return
    setTourStep(next)
    setWorkspaceMode(next >= 5 ? 'design' : next === 4 ? 'personality' : 'knowledge')
  }, [pendingTourAdvance, studioPage, guestTour])
  const recordTourAction = (action: string, id?: string) => {
    if (!guestTour) return
    setTourProgress(previous => recordStudioTourAction(previous, tourStep, action, id))
  }
  const [inputs, setInputs] = useState<InputsState>(defaultInputs)
  const [assistantConfigDraft, setAssistantConfigDraft] = useState<ChatAssistantConfig>(createDefaultAssistantConfig())
  const isSetup = !setupFinished && (setupMode || assistantConfigDraft.setupCompleted === false)
  const [hasLoadedDbConfig, setHasLoadedDbConfig] = useState(false)
  const [previewScenario, setPreviewScenario] = useState<'welcome' | 'conversation' | 'start-card' | 'tickets' | 'contact' | 'reviews'>('welcome')
  const [previewSession, setPreviewSession] = useState(0)
  useEffect(() => {
    if (signedIn) return
    const resetRestoredPage = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      setInputs(defaultInputs)
      setAssistantConfigDraft(createDefaultAssistantConfig())
      setPreviewSession(value => value + 1)
      setPreviewScenario('welcome')
      setWorkspaceMode('features')
    }
    window.addEventListener('pageshow', resetRestoredPage)
    return () => window.removeEventListener('pageshow', resetRestoredPage)
  }, [signedIn])
  const [presetNotice, setPresetNotice] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const [compactPreview, setCompactPreview] = useState(false)
  const loadedWidgetKeyRef = useRef('')
  const [savedSnapshot, setSavedSnapshot] = useState(() => createStudioSnapshot(defaultInputs, createDefaultAssistantConfig()))
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [selectedWidgetKey, setSelectedWidgetKey] = useState('')
  const [hoveredDesignSection, setHoveredDesignSection] = useState<BuilderSectionKey | null>(null)
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
  useEffect(() => {
    setSetupFinished(false)
    setKnowledgeReviewed(false)
    setWorkspaceMode('features')
  }, [selectedWidgetKey])

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

    const nextInputs: InputsState = {
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
    }
    setInputs(nextInputs)
    setAssistantConfigDraft(mergedAssistantConfig)
    setSavedSnapshot(createStudioSnapshot(nextInputs, mergedAssistantConfig))
    setSelectedPreset(null)
  }

  useEffect(() => {
    if (!isAuthenticated || hasLoadedDbConfig) return

    const widget = selectedWidget
    const config = widget?.config || business?.chatWidgetConfig
    if (!config) return
    applyWidgetConfig(config, widget?.assistantConfig || business?.chatAssistantConfig || null)
    try {
      const raw = sessionStorage.getItem('vintra:studio-login-draft')
      sessionStorage.removeItem('vintra:studio-login-draft')
      if (raw) {
        const draft = JSON.parse(raw)
        if (Date.now() - draft.createdAt < 30 * 60 * 1000 && draft.inputs && draft.assistant) {
          setInputs({ ...draft.inputs, plan: databasePlan })
          setAssistantConfigDraft(mergeAssistantConfigDraft(draft.assistant))
        }
      }
    } catch { /* Ignore invalid temporary drafts. */ }

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
    recordTourAction('change-design')
    setSelectedPreset(preset)
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
    if (['bubbleStyle', 'headerStyle', 'bodyStyle', 'footerStyle', 'colorTheme', 'appearance', 'customBranding', 'position', 'widgetIcons'].includes(key)) recordTourAction('change-design')
    setInputs((prev) => ({ ...prev, [key]: value }))
    if (['bubbleStyle', 'headerStyle', 'bodyStyle', 'footerStyle', 'colorTheme', 'appearance'].includes(key)) setSelectedPreset(null)
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
    if (guestTour && section !== 'bubble') return
    setHoveredDesignSection(null)
    navigateStudioPage('design', section, selectedWidgetKey)
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
    { key: 'bubble', label: builderExtraText.sidebar.chatButton, eyebrow: builderExtraText.sidebar.launcher, icon: FiMessageCircle, group: 'appearance' },
    { key: 'colorTheme', label: builderExtraText.sidebar.colors, eyebrow: builderExtraText.sidebar.theme, icon: FiDroplet, group: 'appearance' },
    { key: 'header', label: builderExtraText.sidebar.chatTopBar, eyebrow: builderExtraText.sidebar.header, icon: FiLayout, group: 'appearance' },
    { key: 'body', label: builderExtraText.sidebar.chatMessages, eyebrow: builderExtraText.sidebar.messages, icon: FiMessageSquare, group: 'content' },
    { key: 'footer', label: builderExtraText.sidebar.messageBox, eyebrow: builderExtraText.sidebar.input, icon: FiSend, group: 'content' },
    { key: 'contact', label: no ? 'Kontaktskjema' : 'Contact form', eyebrow: no ? 'SKJEMA' : 'FORM', icon: FiPhone, group: 'content' },
    { key: 'reviews', label: no ? 'Anmeldelser' : 'Reviews', eyebrow: no ? 'TILBAKEMELDING' : 'FEEDBACK', icon: FiCheck, group: 'content' },
    { key: 'tickets', label: 'Tickets / support', eyebrow: no ? 'OPPFØLGING' : 'FOLLOW-UP', icon: FiLifeBuoy, group: 'content' },
    { key: 'advanced', label: no ? 'Flere innstillinger' : 'More settings', eyebrow: no ? 'TILPASNING' : 'CUSTOMIZATION', icon: FiSliders, group: 'custom' },
    { key: 'plan', label: no ? 'Abonnement' : 'Plan', eyebrow: no ? 'TILGANG' : 'ACCESS', icon: FiCreditCard, group: 'custom' },
  ] as const

  const visibleBuilderSections = builderSections.filter(section =>
    section.key === 'reviews' ? getActiveStudioModules(assistantConfigDraft, inputs.settings).includes('reviews') :
      section.key === 'contact' || section.key === 'tickets' ? getActiveStudioModules(assistantConfigDraft, inputs.settings).includes('support') : true
  )

  useEffect(() => {
    if (!widgetKey || loadedWidgetKeyRef.current === widgetKey) return
    const widget = widgetList.find(entry => entry.widgetKey === widgetKey)
    if (widget) {
      loadedWidgetKeyRef.current = widgetKey
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
      setAssistantConfigDraft(previous => ({ ...previous, setupCompleted: false }))
      if (result.widgetKey) onWidgetSelected?.(result.widgetKey)
      await refreshBusiness()
      setHasLoadedDbConfig(false)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 1800)
    } catch (error) {
      console.error('Failed to create chat widget:', error)
      setSaveStatus('error')
    } finally {
      setIsCreatingWidget(false)
    }
  }

  const goToStep = (step: 'features' | 'knowledge' | 'personality' | 'design') => {
    setSetupError('')
    setWorkspaceMode(step)
    if (step === 'design') navigateStudioPage('design', 'overview', selectedWidgetKey)
  }

  const continueWithAccount = () => {
    try { sessionStorage.setItem('vintra:studio-login-draft', JSON.stringify({ inputs, assistant: assistantConfigDraft, createdAt: Date.now() })) } catch { /* Sign-in remains available without storage. */ }
    router.push('/auth/login?from=widget-studio')
  }
  const saveConfig = async (options?: { assistant?: ChatAssistantConfig; inputs?: InputsState; finalize?: boolean }) => {
    const draftAssistant = options?.assistant || assistantConfigDraft
    const draftInputs = options?.inputs || inputs
    const finalize = options?.finalize !== false
    if (!isAuthenticated) { continueWithAccount(); return false }
    setSetupError('')
    if (finalize && draftAssistant.studio?.version === 1) {
      const missing = MANDATORY_STUDIO_MODULES.find(id => getStudioModuleStatus(id, draftAssistant, draftInputs.settings, { editing: true }).required.length)
      if (missing) {
        setSetupError(no ? 'Fyll ut de påkrevde feltene før du fullfører. Du kan fortsatt lagre hver modul separat.' : 'Complete required fields before finishing. Individual modules can still be saved.')
        setWorkspaceMode((STUDIO_MODULES.find(item => item.id === missing)?.category || 'knowledge') as 'features' | 'knowledge' | 'personality')
        navigateStudioPage('module', missing, selectedWidgetKey)
        return false
      }
    }
    if (isSetup && finalize && !draftAssistant.studio && draftAssistant.enabled && !hasAssistantKnowledge(draftAssistant)) {
      setSetupError(no ? 'Legg inn bedriftsinformasjon før du slår på AI-svar.' : 'Add business information before enabling AI replies.')
      setWorkspaceMode('knowledge')
      return false
    }
    if (isSetup && finalize && !draftAssistant.studio && draftAssistant.enabled && !knowledgeReviewed) {
      setSetupError(no ? 'Kontroller bedriftsinformasjonen og bekreft gjennomgangen før du aktiverer AI-svar.' : 'Review and confirm your business information before enabling AI replies.')
      setWorkspaceMode('knowledge')
      return false
    }
    if (!isAuthenticated || !dbUser?.businessId) {
      router.push('/auth/login')
      return false
    }

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const newConfig = {
        plan: databasePlan,
        billingCycle: draftInputs.billingCycle,
        colorTheme: draftInputs.colorTheme,
        appearance: draftInputs.appearance,
        position: draftInputs.position,
        widgetIcons: draftInputs.widgetIcons,
        bubbleStyle: sanitizeBubbleStyleForPlan(draftInputs.bubbleStyle, databasePlan),
        headerStyle: draftInputs.headerStyle,
        bodyStyle: draftInputs.bodyStyle,
        footerStyle: draftInputs.footerStyle,
        customBranding: draftInputs.customBranding,
        settings: draftInputs.settings,
      }
      const planSafeConfig = sanitizeChatWidgetConfigForPlan(newConfig, databasePlan)
      const nextAssistantConfig: ChatAssistantConfig = {
        ...draftAssistant,
        setupCompleted: isSetup && finalize ? true : draftAssistant.setupCompleted,
        conversationCardsEnabled: draftInputs.conversationCardsEnabled,
        conversationCardsLimit: draftInputs.conversationCardsLimit,
        conversationCards: normalizeConversationCards(draftInputs.conversationCards),
        widgetIcons: {
          ...(draftAssistant.widgetIcons || {}),
          avatarIcon: draftInputs.widgetIcons.avatarIcon || '',
          heroIcon: draftInputs.widgetIcons.heroIcon || '',
          aiIcon: draftInputs.widgetIcons.aiIcon || '',
          supportIcon: draftInputs.widgetIcons.supportIcon || '',
          userIcon: draftInputs.widgetIcons.userIcon || '',
        },
      }

      const result = await updateChatWidgetConfig(dbUser.businessId, planSafeConfig, selectedWidgetKey || undefined)
      const assistantResult = result.success
        ? await updateChatAssistantConfig(dbUser.businessId, nextAssistantConfig, selectedWidgetKey || undefined)
        : { success: false }

      if (result.success && assistantResult.success) {
        setAssistantConfigDraft(nextAssistantConfig)
        setSavedSnapshot(createStudioSnapshot(draftInputs, nextAssistantConfig))
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

        if (isSetup && finalize) { setSetupFinished(true); if (setupMode) await onSetupComplete?.() }
        setSaveStatus('success')
        return true

      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Failed to save widget config:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
    return false
  }

  const openModule = (id: string) => { if (guestTour && !isStudioTourChoiceAllowed(STUDIO_MODULES.find(item => item.id === id)?.category, id)) return; if (guestTour && tourStep === 1 && id === 'support') { recordTourAction('add-module', id); setTourStep(2) } else recordTourAction('open-module', id); setSetupError(''); navigateStudioPage('module', id, selectedWidgetKey) }
  const addModule = (id: string) => {
    if (guestTour && id !== 'support') return
    recordTourAction('add-module', id)
    if (guestTour && tourStep === 1 && !tourProgress.completed.includes(1)) setTourStep(2)
    setAssistantConfigDraft(previous => addStudioModule(previous, inputs.settings, id) as ChatAssistantConfig); setSaveStatus('idle'); navigateStudioPage('module', id, selectedWidgetKey) }
  const closeModule = () => {
    const id = editingModule
    backFromStudioPage()
    requestAnimationFrame(() => builderPanelRef.current?.querySelector<HTMLButtonElement>('[data-module="' + id + '"]')?.focus())
  }
  const saveModule = async (assistant: ChatAssistantConfig, settings: ChatWidgetConfig['settings']) => {
    const nextInputs = { ...inputs, settings, conversationCards: assistant.conversationCards, conversationCardsEnabled: assistant.conversationCardsEnabled, conversationCardsLimit: assistant.conversationCardsLimit }
    if (!signedIn) {
      setAssistantConfigDraft(assistant); setInputs(nextInputs); setSaveStatus('idle')
      if (guestTour && editingModule && assistant.studio?.configured.includes(editingModule)) {
        recordTourAction('save-module', editingModule)
        const next = getStudioTourSaveAdvance(tourStep, editingModule)
        if (next !== null) setPendingTourAdvance(next)
      }
      return true
    }
    const saved = await saveConfig({ assistant, inputs: nextInputs, finalize: false })
    if (saved) setInputs(nextInputs)
    return saved
  }
  const saveDesignDraft = async () => {
    if (signedIn && !await saveConfig({ finalize: false })) return
    if (guestTour && tourStep === 5 && tourProgress.designChanged && studioPage?.id === 'bubble') {
      recordTourAction('save-design', 'bubble')
      setPendingTourAdvance(6)
    }
    backFromStudioPage()
  }
  const activeModules = getActiveStudioModules(assistantConfigDraft, inputs.settings)
  const pendingDesign = getPendingStudioDesign(assistantConfigDraft, inputs.settings)
  const selectedModule = STUDIO_MODULES.find(item => item.id === editingModule && activeModules.includes(item.id))
  const hasUnsavedChanges = createStudioSnapshot(inputs, assistantConfigDraft) !== savedSnapshot
  const readiness = getStudioReadiness({ ...assistantConfigDraft, studio: getStudioModuleState(assistantConfigDraft, inputs.settings) }, { isSetup, knowledgeReviewed, settings: inputs.settings })
  const readyCount = Object.values(readiness).filter(status => status === 'ready' || status === 'optional' || status === 'warning').length
  const statusText = (status: string) => status === 'missing' ? (no ? 'Mangler oppsett' : 'Setup needed') : status === 'warning' ? (no ? 'Kan brukes – valgfrie felt eller standardvalg bør ses over' : 'Usable – review optional fields or defaults') : status === 'review' ? (no ? 'Må kontrolleres' : 'Review needed') : status === 'optional' ? (no ? 'Valgfritt' : 'Optional') : (no ? 'Klar' : 'Ready')
  const savingText = isSaving ? (no ? 'Lagrer…' : 'Saving…') : saveStatus === 'error' ? (no ? 'Lagring feilet – prøv igjen' : 'Save failed – try again') : hasUnsavedChanges ? (no ? 'Ulagrede endringer' : 'Unsaved changes') : saveStatus === 'success' ? (no ? 'Alle endringer er lagret' : 'All changes saved') : (no ? 'Ingen ulagrede endringer' : 'No unsaved changes')
  useEffect(() => {
    if (!hasUnsavedChanges || !signedIn) return
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [hasUnsavedChanges, signedIn])
  const activeSection = visibleBuilderSections.find((section) => studioPage?.kind === 'design' && studioPage.id !== 'overview' && studioPage.id !== 'presets' ? section.key === studioPage.id : openSections[section.key]) || visibleBuilderSections[0]
  useEffect(() => {
    if (studioPage?.kind !== 'design' || studioPage.id === 'overview' || studioPage.id === 'presets' || !pendingDesign.some(item => item.design === activeSection.key)) return
    setAssistantConfigDraft(previous => markStudioDesignReviewed(previous, inputs.settings, activeSection.key) as ChatAssistantConfig)
    setSaveStatus('idle')
  }, [studioPage?.kind, studioPage?.id, activeSection.key, assistantConfigDraft.studio, inputs.settings])
  const displayedOpenSections = { ...defaultOpenSections, bubble: false, [activeSection.key]: true }
  useEffect(() => {
    if ((previewScenario === 'start-card' && !assistantConfigDraft.startCard?.enabled)
      || ((previewScenario === 'tickets' || previewScenario === 'contact') && !assistantConfigDraft.humanSupportEnabled && !(studioPage?.kind === 'design' && activeModules.includes('support')))
      || (previewScenario === 'reviews' && !inputs.settings.reviewsEnabled && !(studioPage?.kind === 'design' && activeModules.includes('reviews')))) setPreviewScenario('welcome')
  }, [previewScenario, assistantConfigDraft.startCard?.enabled, assistantConfigDraft.humanSupportEnabled, inputs.settings.reviewsEnabled, studioPage?.kind, activeModules.join(',')])
  const previewDesignSection = hoveredDesignSection || (studioPage?.kind === 'design' && studioPage.id !== 'overview' && studioPage.id !== 'presets' ? activeSection.key : null)
  useEffect(() => {
    if (!previewDesignSection) return
    if (previewDesignSection === 'contact' || previewDesignSection === 'reviews' || previewDesignSection === 'tickets') setPreviewScenario(previewDesignSection)
    else setPreviewScenario(previewDesignSection === 'body' || previewDesignSection === 'footer' ? 'conversation' : 'welcome')
  }, [previewDesignSection])
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

  const designPresets = (<section className="studioPresets" aria-label={no ? 'Ferdige designstiler' : 'Design presets'}>
          <div className="studioPresetIntro"><span className="studioEyebrow">{no ? 'ET GODT UTGANGSPUNKT' : 'A GOOD STARTING POINT'}</span><h2>{no ? 'Finn din stil.' : 'Find your style.'}</h2><p>{no ? 'Velg et samlet uttrykk. Behold navn, innhold og logo.' : 'Start with a coordinated look. Keep your name, content and logo.'}</p></div>
          <div className="studioPresetChoices">
            {([
              { id: 'nordic', title: no ? 'Nordisk' : 'Nordic', description: no ? 'Rolig blå. Myke former.' : 'Calm blue. Soft edges.', color: '#285f86' },
              { id: 'minimal', title: no ? 'Minimal' : 'Minimal', description: no ? 'Grafitt. Rent og diskret.' : 'Graphite. Clean and understated.', color: '#4b5563' },
              { id: 'welcoming', title: no ? 'Varm & vennlig' : 'Warm & friendly', description: no ? 'Skoggrønn. Åpent og personlig.' : 'Forest green. Open and personal.', color: '#047857' },
              { id: 'boutique', title: 'Boutique', description: no ? 'Lilla. Elegant med meldingskort.' : 'Violet. Elegant message cards.', color: '#6d28d9' },
              { id: 'playful', title: no ? 'Leken' : 'Playful', description: no ? 'Rosa. Myke samtalebobler.' : 'Rose. Soft conversation bubbles.', color: '#a9296b' },
            ] as const).map((preset) => <button type="button" className="studioPreset" aria-pressed={selectedPreset === preset.id} key={preset.id} onClick={() => applyDesignPreset(preset.id)}><span className="studioPresetSample" style={{ '--preset-color': preset.color } as React.CSSProperties} aria-hidden="true"><i /><i /><i /></span><span><strong>{preset.title}</strong><small>{preset.description}</small></span><FiArrowRight aria-hidden="true" /></button>)}
          </div>
          {presetNotice && <p className="studioPresetNotice" role="status">{presetNotice}</p>}
        </section>)
  const designControls = (<section className="builder-content-panel" id="studio-settings" aria-labelledby="studio-section-title">
                <div className="studioSectionIntro"><span className="studioEyebrow">{activeSection.eyebrow}</span><h2 id="studio-section-title">{activeSection.label}</h2><p>{sectionDescriptions[activeSection.key]}</p></div>
                {(activeSection.key === 'contact' || activeSection.key === 'reviews' || activeSection.key === 'tickets') && <WidgetFlowSettings settings={inputs.settings} section={activeSection.key} mode="design" no={no} onChange={updateFlowSettings} />}
                {activeSection.key === 'header' && inputs.settings.reviewsEnabled && <label className="widgetFlowToggle"><span>{no ? 'Vis anmeldelsesknapp i chat-toppen' : 'Show review button in the chat header'}</span><input type="checkbox" checked={inputs.settings.reviewPage?.showHeaderButton === true} onChange={e => updateInput('settings', { ...inputs.settings, reviewPage: { ...inputs.settings.reviewPage, showHeaderButton: e.target.checked } })} /></label>}
                <fieldset className="studioTutorialPlan" disabled={guestTour}><PlanSelector
                  plan={inputs.plan}
                  billingCycle={inputs.billingCycle}
                  lockedPlan={databasePlan}
                  onPlanChange={(plan) => updateInput('plan', plan)}
                  onBillingCycleChange={(cycle) => updateInput('billingCycle', cycle)}
                  isOpen={displayedOpenSections.plan}
                  onToggle={() => toggleSection('plan')}
                /></fieldset>

                <StyleSelector
                  tutorialOnlyBubble={guestTour}
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
                  conversationCardsEnabled={activeModules.includes('cards') && assistantConfigDraft.conversationCardsEnabled}
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
                  openSections={displayedOpenSections}
                  onToggleSection={toggleSection}
                />
              </section>)
  const studioPreview = (<StudioPreviewPanel open={mobilePreviewOpen} onClose={() => setMobilePreviewOpen(false)} no={no} compact={compactPreview}>
            <div className="studioPreviewHeader"><span className="studioEyebrow">{no ? 'FORHÅNDSVISNING' : 'PREVIEW'}</span><button type="button" className="studioPreviewCompactButton" aria-pressed={compactPreview} onClick={() => setCompactPreview(value => !value)} title={no ? 'Kompakt forhåndsvisning' : 'Compact preview'}><FiMinimize2 aria-hidden="true" /><span>{no ? 'Kompakt' : 'Compact'}</span></button>
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
              {assistantConfigDraft.startCard?.enabled && <button type="button" aria-pressed={previewScenario === 'start-card'} onClick={() => { setPreviewScenario('start-card'); setPreviewSession(value => value + 1) }}>{no ? 'Startkort' : 'Welcome card'}</button>}
              <button type="button" aria-pressed={previewScenario === 'welcome'} onClick={() => { setPreviewScenario('welcome'); setPreviewSession((value) => value + 1) }}>{no ? 'Velkomst' : 'Welcome'}</button>
              <button type="button" aria-pressed={previewScenario === 'conversation'} onClick={() => { setPreviewScenario('conversation'); setPreviewSession((value) => value + 1) }}>{no ? 'Chat' : 'Chat'}</button>
              {(['tickets', 'contact', 'reviews'] as const).map((scene, index) => (scene === 'reviews' ? inputs.settings.reviewsEnabled : assistantConfigDraft.humanSupportEnabled) && <button key={scene} type="button" aria-pressed={previewScenario === scene} onClick={() => { setPreviewScenario(scene); setPreviewSession(value => value + 1) }}>{(no ? ['Tickets / support', 'Kontaktinfo', 'Anmeldelser'] : ['Tickets / support', 'Contact info', 'Reviews'])[index]}</button>) }
              <button type="button" className="studioPreviewRestart" onClick={() => setPreviewSession((value) => value + 1)} aria-label={no ? 'Start forhåndsvisningen på nytt' : 'Restart preview'} title={no ? 'Start på nytt' : 'Restart'}><FiRefreshCw aria-hidden="true" /></button>
            </div>
            <WidgetPreview
              containedPreview
              previewTranslationEnabled={signedIn}
              faqSuggestionsEnabled={assistantConfigDraft.faqSuggestionsEnabled}
              faqSuggestions={assistantConfigDraft.faqSuggestions}
              key={`${previewScenario}-${previewSession}-${CHAT_PERSONALITIES.find((item) => item.style === assistantConfigDraft.responseStyle)?.id || 'custom'}`}
              localization={assistantConfigDraft.localization || { enabled: false, defaultLanguage: 'no', allowedLanguages: ['no'] }}
              startCard={previewScenario === 'start-card' ? { ...assistantConfigDraft.startCard, enabled: true, text: assistantConfigDraft.startCard?.text || (no ? 'Hei! Kan vi hjelpe deg med noe?' : 'Hi! Can we help you with anything?') } : assistantConfigDraft.startCard}
              previewScenario={previewScenario}
              supportEnabled={assistantConfigDraft.humanSupportEnabled || (workspaceMode === 'design' && activeModules.includes('support'))}
              designPage={previewScenario === 'contact' || previewScenario === 'reviews' || previewScenario === 'tickets' ? previewScenario : undefined}
              billingCycle={inputs.billingCycle}
              plan={databasePlan}
              bubbleStyle={inputs.bubbleStyle}
              headerStyle={inputs.headerStyle}
              bodyStyle={inputs.bodyStyle}
              footerStyle={inputs.footerStyle}
              settings={workspaceMode === 'design' ? { ...inputs.settings, reviewsEnabled: inputs.settings.reviewsEnabled || activeModules.includes('reviews'), tasksEnabled: inputs.settings.tasksEnabled || activeModules.includes('support') } : inputs.settings}
              position={inputs.position}
              colorTheme={inputs.colorTheme}
              appearance={inputs.appearance}
              customBranding={inputs.customBranding}
              assistantIcons={inputs.widgetIcons}
              initialOpen={previewScenario !== 'start-card'}
              enablePreviewChat={true}
              showConditionalFeaturePreview={false}
              previewReply={(() => { const personality = CHAT_PERSONALITIES.find((item) => item.style === assistantConfigDraft.responseStyle); return personality ? (no ? personality.sampleNo : personality.sampleEn) : (no ? 'Dette er et eksempelsvar. Egen svarstil brukes av AI-en etter lagring.' : 'This is a sample reply. The AI uses your custom response style after saving.') })()}
              previewMode={previewMode}
              conversationCardsEnabled={activeModules.includes('cards') && assistantConfigDraft.conversationCardsEnabled}
              conversationCardsLimit={inputs.conversationCardsLimit}
              conversationCards={inputs.conversationCards}
              highlightedSection={previewHighlightTarget || (previewDesignSection && ['bubble', 'header', 'body', 'footer', 'contact', 'reviews', 'tickets'].includes(previewDesignSection) ? (['contact', 'reviews', 'tickets'].includes(previewDesignSection) ? 'body' : previewDesignSection) as PreviewHighlightTarget : null)}
              flashSection={previewFlashTarget}
            />
          </StudioPreviewPanel>)
  const designIndex = <div className="studioDesignIndex"><div className="studioModuleListIntro"><div><span className="studioEyebrow">DESIGN</span><h1>{no ? 'Velg delen du vil tilpasse' : 'Choose what to customize'}</h1><p>{no ? 'Hvert område åpnes på en egen side. Velg én del og fokuser på den.' : 'Each area opens on its own page. Choose one part and focus on it.'}</p></div></div>
    {pendingDesign.length > 0 && <p className="studioModuleWarning">{no ? 'Nye deler trenger en designsjekk: ' : 'New modules need a design review: '}{pendingDesign.map(item => no ? item.no : item.en).join(', ')}</p>}
    <div className="studioModuleRows"><button type="button" className="studioModuleRow" data-design="presets" disabled={guestTour} onClick={() => navigateStudioPage('design', 'presets', selectedWidgetKey)}><StudioModuleIcon id="presets" /><span className="studioModuleRowCopy"><strong>{no ? 'Ferdige designstiler' : 'Design presets'}</strong><span>{no ? 'Velg et samlet uttrykk for chatten.' : 'Choose a coordinated look for your chat.'}</span></span><FiArrowRight aria-hidden="true" /></button>
    {visibleBuilderSections.map(section => <button type="button" className="studioModuleRow" data-design={section.key} key={section.key} disabled={guestTour && !isStudioTourChoiceAllowed('design', section.key)} onMouseEnter={() => setHoveredDesignSection(section.key)} onMouseLeave={() => setHoveredDesignSection(null)} onFocus={() => setPreviewHighlightTarget(['bubble', 'header', 'body', 'footer'].includes(section.key) ? section.key as PreviewHighlightTarget : null)} onBlur={() => setHoveredDesignSection(null)} onClick={() => toggleSection(section.key)}><StudioModuleIcon id={section.key === 'contact' ? 'designContact' : section.key} /><span className="studioModuleRowCopy"><strong>{section.label}</strong><span>{sectionDescriptions[section.key]}</span>{pendingDesign.some(item => item.design === section.key) && <small className="studioModuleRowStatus studioModuleRowStatus--warning"><FiAlertTriangle aria-hidden="true" />{no ? 'Nytt design – ikke gjennomgått' : 'New design – not reviewed'}</small>}</span><FiArrowRight aria-hidden="true" /></button>)}</div></div>
  const tourCopy = no ? [
  [
    "Hei! Skal vi lage en chat?",
    "Jeg viser deg rundt på et lite minutt. Funksjoner først, finstasen til slutt!"
  ],
  [
    "Små moduler, mange muligheter",
    "Trykk «Legg til» og velg Menneskelig support. De andre modulene hviler mens vi tar denne lille runden."
  ],
  [
    "Åpne. Tilpass. Behold.",
    "Her velger du når kunden kan be om et menneske, og hva chatten skal svare. Prøv innstillingene og trykk «Lagre i utkast». Jeg tar deg automatisk videre!"
  ],
  [
    "La meg bli kjent med bedriften",
    "Åpne Min bedrift og legg inn hvem dere er og hva dere tilbyr. Lagre utkastet når du er klar, så viser jeg deg svarstilen."
  ],
  [
    "Litt personlighet gjør susen!",
    "Åpne Svarstil og regler. Velg hvordan assistenten skal svare, og lagre utkastet. Etterpå pynter vi chatknappen!"
  ],
  [
    "Tid for finstasen!",
    "Åpne Chatknapp, endre en detalj og se den i forhåndsvisningen. Trykk «Lagre i utkast» for å fullføre. Resten av designet kan du utforske etterpå."
  ],
  [
    "Din tur! Jeg heier på deg.",
    "Test i vei! Oppsett og samtale nullstilles når du forlater testsiden. Velg «Logg inn for å lagre» for å ta utkastet med videre, og lagre etter innlogging."
  ]
] : [
    ['Hi! Shall we build a chat?', 'Let me show you around in a minute. Features first, a little style at the end!'],
    ['Small modules, big possibilities', 'Click Add and choose Human support. The other modules are paused while we take this short tour.'],
    ['Open. Customize. Keep.', 'Choose when a customer can ask for a human and what the chat should say. Try the settings and save the draft. I will take you to the next step automatically!'],
    ['Teach me about your business', 'Open My business, add who you are and what you offer, then save the draft. Next up: response style.'],
    ['A little personality!', 'Open Response style and rules, choose the tone and save the draft. Then we will customize the chat button!'],
    ['Time to dress up!', 'Open Chat button, change a detail and watch the preview. Save the draft to finish. Explore the rest of the design after the tour.'],
    ['Your turn!', 'Leaving resets the setup and conversation. Choose Sign in to save to carry your draft into your account, then save after signing in.'],
  ]
  if (activeModules.includes('support')) tourCopy[1][1] = no
    ? 'Menneskelig support er allerede lagt til. Trykk på modulen for å prøve innstillingene.'
    : 'Human support is already added. Open the module to try its settings.'
  const moveTour = (step: number) => {
    const url = new URL(window.location.href)
    url.searchParams.delete('studioPage')
    window.history.replaceState(window.history.state, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    setTourStep(step)
    setWorkspaceMode(step >= 5 ? 'design' : step === 4 ? 'personality' : step === 3 ? 'knowledge' : 'features')
    if (step === 2 && tourProgress.moduleId && activeModules.includes(tourProgress.moduleId)) navigateStudioPage('module', tourProgress.moduleId)
  }
  const tourTargets = [
    '.studioWorkspaceTabs button[aria-controls="studio-category-features"]',
    activeModules.includes('support') ? '[data-module="support"]' : '#studio-category-features .studioModuleAdd[aria-expanded="false"], #studio-category-features .studioModuleCatalog button[data-module-option="support"]',
    tourProgress.moduleId ? '[data-module="' + tourProgress.moduleId + '"]' : '#studio-category-features .studioModuleAdd',
    '[data-module="company"]',
    '[data-module="personality"]',
    '[data-design="bubble"]',
    '.studioSaveBar > .save-btn',
  ]
  const tourTarget = studioPage?.kind === 'module' ? '.studioModuleDialogBody .studioModuleFields input:not([type="file"]), .studioModuleDialogBody .studioModuleFields textarea, .studioModuleDialogBody .studioModuleFields select, .studioModuleDialogFooter .save-btn'
    : studioPage?.kind === 'design' && studioPage.id !== 'overview' ? (tourProgress.designChanged ? '.studioFocusedDesignFooter .save-btn' : studioPage.id === 'presets' ? '.studioPreset' : '.studioFocusedDesign button[role="radio"]:not(:disabled), .studioFocusedDesign input:not(:disabled):not([type="file"]), .studioFocusedDesign select:not(:disabled)')
    : tourTargets[tourStep ?? 0]
  const tourPanel = guestTour && <StudioTourAnchor selector={tourTarget} inline><aside className="studioTour" aria-label={no ? 'Omvisning med Vintra' : 'Vintra guided tour'} onKeyDown={event => { if (event.key === 'Escape') finishTour() }}>
    <VintraHost expression={tourStep === 6 ? 'celebrating' : tourStep === 0 ? 'curious' : tourStep === 3 ? 'attentive' : 'explaining'} />
    <div className="studioTourCopy" aria-live="polite"><small>VINTRA &middot; {(tourStep ?? 0) + 1}/{tourCopy.length}</small><h2>{tourCopy[tourStep ?? 0][0]}</h2><p>{tourCopy[tourStep ?? 0][1]}</p>
    <div className="studioTourProgress" aria-hidden="true">{tourCopy.map((_, index) => <i key={index} data-complete={index <= (tourStep ?? 0)} />)}</div>
    <div className="studioTourActions"><button type="button" onClick={finishTour}>{no ? 'Hopp over' : 'Skip tour'}</button>{tourStep! > 0 && <button type="button" onClick={() => moveTour(tourStep! - 1)}>{no ? 'Forrige' : 'Previous'}</button>}{canContinueStudioTour(tourStep, tourProgress) && <button type="button" className="save-btn" onClick={() => tourStep === 6 ? finishTour() : moveTour(tourStep! + 1)}>{tourStep === 6 ? (no ? 'La meg prøve!' : 'Let me try!') : tourStep === 0 ? (no ? 'Vis meg rundt' : 'Show me around') : (no ? 'Neste' : 'Next')}</button>}</div></div>
  </aside></StudioTourAnchor>
  if (loading) return <main className="chatbuilder-page builder-loading"><LoadingAnimation label={no ? 'Laster arbeidsområdet…' : 'Loading your workspace…'} /></main>
  if (studioPage) {
    const title = studioPage.kind === 'module' ? (selectedModule ? (no ? selectedModule.no : selectedModule.en) : (no ? 'Modulen er ikke lagt til' : 'Module not added')) : studioPage.id === 'overview' ? 'Design' : studioPage.id === 'presets' ? (no ? 'Ferdige designstiler' : 'Design presets') : activeSection.label
    return <StudioFocusPage title={title} no={no} onBack={backFromStudioPage} backDisabled={isSaving} aside={studioPage.kind === 'design' ? <><button type="button" className="studioMobilePreviewButton" onClick={() => setMobilePreviewOpen(true)} aria-haspopup="dialog"><FiEye aria-hidden="true" />{no ? 'Vis chatten' : 'Show chat'}</button>{studioPreview}</> : undefined}>
      {tourPanel}
      {studioPage.kind === 'module' ? selectedModule ? <StudioModuleEditor key={selectedModule.id + selectedWidgetKey} module={selectedModule} assistant={assistantConfigDraft} settings={inputs.settings} no={no} saving={isSaving} onClose={closeModule} onSave={saveModule} /> : <p>{no ? 'Legg til modulen fra oversikten før du konfigurerer den.' : 'Add this module from the overview before configuring it.'}</p> : studioPage.id === 'overview' ? designIndex : <div className="studioFocusedDesign">{studioPage.id === 'presets' ? designPresets : designControls}<footer className="studioFocusedDesignFooter"><span role="status">{savingText}</span><button className="save-btn" type="button" disabled={isSaving} onClick={() => void saveDesignDraft()}>{isSaving ? (no ? 'Lagrer…' : 'Saving…') : signedIn ? (no ? 'Lagre design' : 'Save design') : (no ? 'Lagre i utkast' : 'Save to draft')}</button></footer></div>}
    </StudioFocusPage>
  }

  return (
    <>
      {!embedded && !signedIn && <Header />}
    <div className={embedded ? "chatbuilder-page workspaceEmbeddedBuilder" : "chatbuilder-page"}>
      {!embedded && signedIn && <header className="studioHeader">
        <Link href="/" className="studioBrand"><img src="/image/logo.png" width="32" height="32" alt="" /><strong>Vintra</strong><span>Widget studio</span></Link>
        <div className="studioHeaderTools">
          <select aria-label={no ? 'Språk' : 'Language'} value={language} onChange={(event) => setLanguage(event.target.value as 'no' | 'en')}><option value="no">Norsk</option><option value="en">English</option></select>
          <button type="button" className="studioTheme" aria-label={no ? 'Bytt lys og mørk modus' : 'Switch light and dark mode'} onClick={() => writeAppThemePreference(resolveAppThemePreference() === 'dark' ? 'light' : 'dark')}><FiMoon className="studioMoon" aria-hidden="true" /><FiSun className="studioSun" aria-hidden="true" /></button>
          <Link href={signedIn ? '/admin' : '/auth/login'} className="studioAccountLink">{signedIn ? (no ? 'Til oversikten' : 'Dashboard') : (no ? 'Logg inn' : 'Sign in')}<FiArrowRight aria-hidden="true" /></Link>
        </div>
      </header>}
      <main className={'chatbuilder-content' + (!signedIn && !embedded ? ' studioGuestContent' : '')} onClickCapture={event => {
        if (!signedIn && (event.target as HTMLElement).closest('a[href="/auth/login"]')) { event.preventDefault(); event.stopPropagation(); continueWithAccount() }
      }}>
        {tourPanel}
        {!signedIn && !embedded && !guestTour && <TourLauncher no={no} onClick={() => moveTour(0)} />}
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
                disabled={!widgetList.length || isSaving || isCreatingWidget}
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
                disabled={!isAuthenticated || isCreatingWidget || isSaving || !canCreateWidget}
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
                <FiSliders /> <span>{t.configureWidget}<small className="studioHeaderStatus">{savingText}</small></span>
              </h2>

              <div className="panel-actions">


                {signedIn ? (
                  <button
                    className={`save-btn ${isSaving ? 'save-btn--saving' : ''} ${saveStatus === 'success' ? 'save-btn--success' : ''} ${saveStatus === 'error' ? 'save-btn--error' : ''}`}
                    onClick={() => void saveConfig()}
                    disabled={isSaving || isCreatingWidget || !isAuthenticated || !business}
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

                <ConfirmStudioAction className="reset-btn" onConfirm={handleReset} no={no} confirmLabel={no ? 'Nullstill' : 'Reset'} message={no ? 'Er du sikker på at du vil forkaste endringene og hente sist lagrede oppsett?' : 'Discard your changes and restore the last saved setup?'} disabled={isSaving || isCreatingWidget} type="button">
                  <span
                    className={`reset-btn-icon ${resetAnimating ? 'reset-btn-icon--spin' : ''}`}
                    onAnimationEnd={() => setResetAnimating(false)}
                  >
                    <FiRefreshCw />
                  </span>
                  <span>{t.reset}</span>
                </ConfirmStudioAction>
              </div>
            </div>

            {isSetup && <div className="studioSetupIntro"><strong>{no ? 'Gjør chatten til deres egen' : 'Make this chat your own'}</strong><p>{no ? 'Velg funksjoner, fyll inn bedriftens kunnskap og tilpass uttrykket. Hopp fritt mellom områdene. Alt kan endres senere.' : 'Choose features, add business knowledge and customize the look. Move freely between areas. Everything can be changed later.'}</p></div>}
            <div className="studioReadiness"><span>{no ? 'Oppsettoversikt' : 'Setup overview'}</span><span>{readyCount}/4 {no ? 'områder klare' : 'areas ready'}</span><div role="progressbar" aria-label={no ? 'Oppsettoversikt' : 'Setup overview'} aria-valuenow={readyCount} aria-valuemin={0} aria-valuemax={4}><i style={{ width: (readyCount / 4 * 100) + '%' }} /></div></div>
            <nav className="studioWorkspaceTabs" aria-label={no ? 'Oppsett av assistenten' : 'Assistant setup'}>
              {([
                { id: 'features', no: 'Funksjoner', en: 'Features', hintNo: 'Chat, språk og support', hintEn: 'Chat, languages and support', icon: FiSliders },
                { id: 'knowledge', no: 'Bedriften', en: 'Business', hintNo: 'Kunnskap og kilder', hintEn: 'Knowledge and sources', icon: FiMonitor },
                { id: 'personality', no: 'Svarstil', en: 'Response style', hintNo: 'Personlighet og grenser', hintEn: 'Personality and boundaries', icon: FiMessageCircle },
                { id: 'design', no: 'Design', en: 'Design', hintNo: 'Utseende og innhold', hintEn: 'Appearance and content', icon: FiDroplet },
              ] as const).map(item => <button type="button" key={item.id} disabled={guestTour && item.id !== workspaceMode} aria-current={workspaceMode === item.id ? 'page' : undefined} aria-controls={'studio-category-' + item.id} onClick={() => goToStep(item.id)}><item.icon aria-hidden="true" /><span className="studioNavCopy"><strong>{no ? item.no : item.en}</strong><small>{no ? item.hintNo : item.hintEn}</small></span><span className={'studioNavStatus studioNavStatus--' + readiness[item.id]} title={statusText(readiness[item.id])}>{readiness[item.id] === 'ready' ? <FiCheck aria-hidden="true" /> : readiness[item.id] === 'optional' ? <FiCircle aria-hidden="true" /> : readiness[item.id] === 'missing' ? <FiAlertCircle aria-hidden="true" /> : <FiAlertTriangle aria-hidden="true" />}<span className="studioSrOnly">{statusText(readiness[item.id])}</span></span></button>)}
            </nav>
            {setupError && <p className="studioSetupError" role="alert">{setupError}</p>}
            <fieldset className="studioEditingSurface" disabled={isSaving} aria-label={no ? 'Widgetinnstillinger' : 'Widget settings'}>
            {(['features', 'knowledge', 'personality'] as const).map(category => <div className="studioCategory studioRules" id={'studio-category-' + category} key={category} hidden={workspaceMode !== category}><StudioModuleList category={category} tutorialModule={guestTour ? category === 'features' ? 'support' : category === 'knowledge' ? 'company' : 'personality' : undefined} assistant={assistantConfigDraft} settings={inputs.settings} no={no} onOpen={openModule} onAdd={addModule} onRemove={async id => { const next = removeStudioModule(assistantConfigDraft, inputs.settings, id); return saveModule(next.assistant as ChatAssistantConfig, next.settings) }} /></div>)}
            <div className="studioCategory studioRules" id="studio-category-design" hidden={workspaceMode !== 'design'}>{designIndex}</div>
            </fieldset>
            <div className="studioSaveBar"><span className={'studioSaveStatus' + (hasUnsavedChanges ? ' isDirty' : '')} role="status">{!hasUnsavedChanges && saveStatus === 'success' ? <FiCheck aria-hidden="true" /> : <FiCircle aria-hidden="true" />}{savingText}</span><button type="button" className="save-btn" disabled={isSaving || isCreatingWidget || (signedIn && (!isAuthenticated || !business))} onClick={() => void saveConfig()}>{isSaving ? (no ? 'Lagrer…' : 'Saving…') : !signedIn ? (no ? 'Logg inn for å lagre' : 'Sign in to save') : isSetup ? (no ? 'Lagre og fullfør' : 'Save and finish') : (no ? 'Lagre endringer' : 'Save changes')}</button></div>
            <button type="button" className="studioMobilePreviewButton" aria-haspopup="dialog" aria-controls="studio-preview" onClick={() => setMobilePreviewOpen(true)}><FiEye aria-hidden="true" />{no ? 'Åpne forhåndsvisning' : 'Open preview'}</button>

          </div>

          {studioPreview}
        </div>
      </main>
    </div>
    </>
  )
}
