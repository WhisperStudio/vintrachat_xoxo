'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type SVGProps,
  type TextareaHTMLAttributes,
} from 'react'
import {
  FiBriefcase,
  FiChevronDown,
  FiCopy,
  FiCpu,
  FiGlobe,
  FiHelpCircle,
  FiLoader,
  FiMessageSquare,
  FiSearch,
  FiShield,
  FiZap,
  FiClock,
  FiLayers,
  FiMapPin,
  FiTarget,
  FiUpload,
} from 'react-icons/fi'
import WidgetPreview from '@/app/landings/auth/chatWidget/components/WidgetPreview'
import '@/app/landings/auth/chatWidget/ChatWidget.css'
import './WidgetAdmin.css'
import { useAuth } from '@/context/AuthContext'
import { createChatWidget, deleteChatWidget, setActiveChatWidget, updateChatAssistantConfig, updateChatWidgetConfig } from '@/lib/auth.service'
import type { WebsiteAutofillResult } from '@/lib/website-context-scanner'
import { getPlanLimits } from '@/lib/subscription'
import { parseAllowedDomainsInput } from '@/lib/widget-security'
import type {
  AssistantBusinessProfile,
  AssistantIntegrationSettings,
  AssistantKnowledgeBase,
  AssistantStrictness,
  ChatAssistantConfig,
  ChatWidgetConfig,
} from '@/types/database'

const defaultAssistantConfig: ChatAssistantConfig = {
  enabled: true,
  provider: 'gemini',
  model: 'gemini-2.5-flash-lite',
  strictContextOnly: true,
  strictness: 'balanced',
  systemPrompt:
    'You are a helpful customer service assistant. Use approved business information first, stay honest, and do not invent facts.',
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
    'Do not invent company policies, prices, or guarantees that are not in the configured context.',
  supportTriggerKeywords: ['support', 'human', 'agent', 'contact'],
  humanSupportEnabled: true,
  handoffMessage:
    'I will flag this conversation for human follow-up so the team can contact you.',
  faqSuggestionsEnabled: true,
  faqSuggestions: [
    'What are your opening hours?',
    'How do I contact support?',
    'What services do you offer?',
  ],
  startLanguage: 'English',
  replyInUserLanguage: true,
  responseStyle: 'Friendly, clear, and concise',
  extraInstructions: 'Always keep answers short unless the user asks for more detail.',
  forceSelectedModelOnly: false,
}

const createDefaultWidgetConfig = (businessName: string): ChatWidgetConfig => ({
  plan: 'free',
  billingCycle: 'monthly',
  colorTheme: 'modern',
  position: 'bottom-right',
  bubbleStyle: {
    showStatus: true,
    iconChoice: 'chat',
    borderType: 'rounded',
    shadowType: 'medium',
    animationType: 'fade',
    sizeType: 'medium',
    orbStyle: {
      hoverEnabled: true,
      hoverGlyph: 'A',
      replyEnabled: false,
      replyGlyphs: '',
      inactiveEnabled: false,
      inactiveGlyphs: '',
      inactivityMinMinutes: 2,
      inactivityMaxMinutes: 4,
    },
  },
  headerStyle: {
    showStatus: true,
    showCloseButton: true,
    borderType: 'rounded',
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
  },
  footerStyle: {
    showSendButton: true,
    borderType: 'none',
    shadowType: 'none',
    inputStyle: 'rounded',
    showPlaceholder: true,
  },
  customBranding: {
    title: businessName || 'Support Chat',
    description: 'Usually replies in a few minutes',
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
  allowedDomains: [],
})

const mergeWidgetConfig = (
  config: Partial<ChatWidgetConfig> | undefined,
  businessName: string
): ChatWidgetConfig => {
  const defaults = createDefaultWidgetConfig(businessName)

  if (!config) return defaults

  return {
    ...defaults,
    ...config,
    allowedDomains: parseAllowedDomainsInput(config.allowedDomains ?? defaults.allowedDomains),
    bubbleStyle: {
      ...defaults.bubbleStyle,
      ...(config.bubbleStyle || {}),
      orbStyle: {
        hoverEnabled: config.bubbleStyle?.orbStyle?.hoverEnabled ?? defaults.bubbleStyle.orbStyle!.hoverEnabled,
        hoverGlyph: config.bubbleStyle?.orbStyle?.hoverGlyph ?? defaults.bubbleStyle.orbStyle!.hoverGlyph,
        replyEnabled: config.bubbleStyle?.orbStyle?.replyEnabled ?? defaults.bubbleStyle.orbStyle!.replyEnabled,
        replyGlyphs: config.bubbleStyle?.orbStyle?.replyGlyphs ?? defaults.bubbleStyle.orbStyle!.replyGlyphs,
        inactiveEnabled: config.bubbleStyle?.orbStyle?.inactiveEnabled ?? defaults.bubbleStyle.orbStyle!.inactiveEnabled,
        inactiveGlyphs: config.bubbleStyle?.orbStyle?.inactiveGlyphs ?? defaults.bubbleStyle.orbStyle!.inactiveGlyphs,
        inactivityMinMinutes:
          config.bubbleStyle?.orbStyle?.inactivityMinMinutes ?? defaults.bubbleStyle.orbStyle!.inactivityMinMinutes,
        inactivityMaxMinutes:
          config.bubbleStyle?.orbStyle?.inactivityMaxMinutes ?? defaults.bubbleStyle.orbStyle!.inactivityMaxMinutes,
      },
    },
    headerStyle: {
      ...defaults.headerStyle,
      ...(config.headerStyle || {}),
    },
    bodyStyle: {
      ...defaults.bodyStyle,
      ...(config.bodyStyle || {}),
    },
    footerStyle: {
      ...defaults.footerStyle,
      ...(config.footerStyle || {}),
    },
    customBranding: {
      ...defaults.customBranding,
      ...(config.customBranding || {}),
      logoStyle: {
        zoom: config.customBranding?.logoStyle?.zoom ?? defaults.customBranding.logoStyle!.zoom,
        focusX: config.customBranding?.logoStyle?.focusX ?? defaults.customBranding.logoStyle!.focusX,
        focusY: config.customBranding?.logoStyle?.focusY ?? defaults.customBranding.logoStyle!.focusY,
      },
    },
    settings: {
      ...defaults.settings,
      ...(config.settings || {}),
    },
  }
}

const allowedDomainSeed = ['chat.vintrastudio.com', 'http://localhost:3000/']

type LanguageOption = {
  value: string
  label: string
  aliases: string[]
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'English', label: 'English', aliases: ['english', 'eng'] },
  { value: 'Norwegian', label: 'Norwegian', aliases: ['norsk', 'norwegian', 'bokmål', 'bokmal', 'nynorsk'] },
  { value: 'Swedish', label: 'Swedish', aliases: ['svensk', 'swedish'] },
  { value: 'Danish', label: 'Danish', aliases: ['dansk', 'danish'] },
  { value: 'Finnish', label: 'Finnish', aliases: ['finsk', 'finnish'] },
  { value: 'Icelandic', label: 'Icelandic', aliases: ['islandsk', 'icelandic'] },
  { value: 'German', label: 'German', aliases: ['tysk', 'german'] },
  { value: 'Polish', label: 'Polish', aliases: ['polsk', 'polish'] },
  { value: 'French', label: 'French', aliases: ['fransk', 'french'] },
  { value: 'Dutch (Belgium)', label: 'Dutch (Belgium)', aliases: ['belgisk', 'belgian', 'flemish', 'dutch belgium'] },
  { value: 'Spanish', label: 'Spanish', aliases: ['spansk', 'spanish'] },
  { value: 'Portuguese', label: 'Portuguese', aliases: ['portugisisk', 'portuguese'] },
  { value: 'Greek', label: 'Greek', aliases: ['gresk', 'greek'] },
  { value: 'Italian', label: 'Italian', aliases: ['italiensk', 'italian'] },
  { value: 'Japanese', label: 'Japanese', aliases: ['japansk', 'japanese'] },
  { value: 'Chinese', label: 'Chinese', aliases: ['kinesisk', 'chinese'] },
  { value: 'Korean (South Korea)', label: 'Korean (South Korea)', aliases: ['sør-koreansk', 'south korean', 'korean'] },
  { value: 'Ukrainian', label: 'Ukrainian', aliases: ['ukrainsk', 'ukrainian'] },
  { value: 'Turkish', label: 'Turkish', aliases: ['tyrkisk', 'turkish'] },
  { value: 'Arabic', label: 'Arabic', aliases: ['arabisk', 'arabic'] },
  { value: 'Urdu', label: 'Urdu', aliases: ['urdu'] },
  { value: 'Spanish (Mexico)', label: 'Spanish (Mexico)', aliases: ['mexikansk', 'mexican', 'mexico'] },
]

function getLanguageMatches(query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return LANGUAGE_OPTIONS

  return LANGUAGE_OPTIONS
    .map((option) => {
      const haystack = [option.label, ...option.aliases].join(' ').toLowerCase()
      let score = 10

      if (option.label.toLowerCase() === normalizedQuery) score = 0
      else if (option.label.toLowerCase().startsWith(normalizedQuery)) score = 1
      else if (option.aliases.some((alias) => alias.toLowerCase() === normalizedQuery)) score = 1
      else if (haystack.includes(normalizedQuery)) score = 2

      return { option, score }
    })
    .filter(({ score }) => score < 10)
    .sort((left, right) => left.score - right.score || left.option.label.localeCompare(right.option.label))
    .map(({ option }) => option)
}

type AiFieldId =
  | 'profile'
  | 'knowledge'
  | 'actions'
  | 'rules'

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactNode

function getRootWebsiteUrl(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const withProtocol =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    return parsed.origin
  } catch {
    return ''
  }
}

function getFirstAllowedWebsiteUrl(domainsText: string) {
  const domains = parseAllowedDomainsInput(domainsText)
  for (const domain of domains) {
    const root = getRootWebsiteUrl(domain)
    if (root) return root
  }

  return ''
}

function CollapsibleAiField({
  id,
  title,
  description,
  icon: Icon,
  accent = 'violet',
  openField,
  setOpenField,
  children,
}: {
  id: AiFieldId
  title: string
  description?: string
  icon: IconComponent
  accent?: 'violet' | 'green' | 'amber' | 'rose'
  openField: AiFieldId | null
  setOpenField: (field: AiFieldId | null) => void
  children: ReactNode
}) {
  const isOpen = openField === id

  return (
    <label className={`widget-ai-field widget-ai-field-full widget-admin-field-accordion ${isOpen ? 'open' : ''}`}>
      <div className="widget-admin-field-accordion__header">
        <div className="widget-admin-field-accordion__titleWrap">
          <span className="widget-admin-field-accordion__title">
            <span className={`widget-admin-field-accordion__icon widget-admin-field-accordion__icon--${accent}`}>
              <Icon />
            </span>
            <span>
              {title}
              {description ? <small>{description}</small> : null}
            </span>
          </span>
        </div>

        <button
          type="button"
          className={`widget-admin-field-accordion__chevron ${isOpen ? 'open' : ''}`}
          onClick={() => setOpenField(isOpen ? null : id)}
          aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
        >
          <FiChevronDown style={{ color: '#64748b' }} />
        </button>
      </div>

      {isOpen ? <div className="widget-admin-field-accordion__body">{children}</div> : null}
    </label>
  )
}

const FIELD_ICON_COLORS: Record<'violet' | 'green' | 'amber' | 'orange' | 'blue' | 'rose', string> = {
  violet: '#7c3aed',
  green: '#16a34a',
  amber: '#f59e0b',
  orange: '#ea580c',
  blue: '#2563eb',
  rose: '#e11d48',
}

function FieldIcon({
  icon: Icon,
  accent,
}: {
  icon: IconComponent
  accent: keyof typeof FIELD_ICON_COLORS
}) {
  const color = FIELD_ICON_COLORS[accent]

  return (
    <span
      className={`widget-admin-field-label-icon widget-admin-field-label-icon--${accent}`}
      style={{ color, stroke: color, fill: 'none' }}
      aria-hidden="true"
    >
      <Icon style={{ color: 'inherit', stroke: 'currentColor', fill: 'none' }} />
    </span>
  )
}

function AutoGrowTextarea({
  minRows = 3,
  className = '',
  onInput,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const resizeTextarea = () => {
    const element = textareaRef.current
    if (!element) return

    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }

  useEffect(() => {
    resizeTextarea()
  }, [props.value, minRows])

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={minRows}
      className={`widget-admin-autogrow ${className}`.trim()}
      onInput={(event) => {
        resizeTextarea()
        onInput?.(event)
      }}
    />
  )
}

const STRICTNESS_OPTIONS: Array<{
  value: AssistantStrictness
  label: string
  description: string
}> = [
  {
    value: 'sales',
    label: 'Sales mode',
    description: 'Loose, proactive, and good for landing pages.',
  },
  {
    value: 'balanced',
    label: 'Balanced mode',
    description: 'Safe default for most businesses.',
  },
  {
    value: 'support',
    label: 'Support/legal mode',
    description: 'Very strict, no guessing, ideal for regulated info.',
  },
]

const WIZARD_STEPS = [
  { id: 'business', label: '1. Bedriftsinfo', icon: FiBriefcase, accent: 'violet' },
  { id: 'sources', label: '2. Kilder', icon: FiLayers, accent: 'green' },
  { id: 'actions', label: '3. Handling', icon: FiTarget, accent: 'amber' },
  { id: 'rules', label: '4. Regler', icon: FiShield, accent: 'rose' },
] as const

const MAIN_GOAL_OPTIONS = [
  { label: 'Answer questions', value: 'answer questions' },
  { label: 'Collect bookings', value: 'collect bookings' },
  { label: 'Take load off support', value: 'take the load off support' },
  { label: 'Convert leads', value: 'convert visitors into leads' },
  { label: 'Drive sales', value: 'drive sales' },
  { label: 'Route visitors', value: 'route visitors to the right page' },
  { label: 'Showcase work', value: 'showcase work' },
  { label: 'Inform visitors', value: 'inform visitors' },
  { label: 'Book consultations', value: 'book consultations' },
] as const

const TONE_OPTIONS = [
  { label: 'Professional', value: 'professional' },
  { label: 'Warm', value: 'warm' },
  { label: 'Selling', value: 'selling' },
  { label: 'Short', value: 'short' },
  { label: 'Playful', value: 'playful' },
] as const

function splitCommaValues(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function toggleCommaValue(value: string, nextValue: string) {
  const values = splitCommaValues(value)
  const normalizedNextValue = nextValue.trim()
  const exists = values.some((entry) => entry.toLowerCase() === normalizedNextValue.toLowerCase())

  if (exists) {
    return values.filter((entry) => entry.toLowerCase() !== normalizedNextValue.toLowerCase()).join(', ')
  }

  return [...values, normalizedNextValue].join(', ')
}

function createEmptyBusinessProfile(): AssistantBusinessProfile {
  return {
    businessName: '',
    industry: '',
    shortDescription: '',
    toneOfVoice: 'professional, warm, helpful',
    language: 'English',
    multilingual: false,
    mainGoal: '',
    fallbackContact: '',
  }
}

function createEmptyKnowledgeBase(): AssistantKnowledgeBase {
  return {
    websiteUrls: [],
    uploadedDocuments: [],
    manualNotes: '',
    openingHours: '',
    contactInfo: '',
    addresses: '',
    keyFAQs: [],
  }
}

function createEmptyIntegrations(): AssistantIntegrationSettings {
  return {
    replyToQuestions: true,
    collectLeads: true,
    bookMeetings: false,
    routeToPages: true,
    createSupportTickets: false,
    fetchOrderStatus: false,
    handoffToHuman: true,
  }
}

export default function WidgetAdminPanel({
  selectedWidgetKey: externalSelectedWidgetKey,
  onWidgetSelected,
}: {
  selectedWidgetKey?: string
  onWidgetSelected?: (widgetKey: string) => void
} = {}) {
  const { business, dbUser, loading, refreshBusiness } = useAuth()
  const [config, setConfig] = useState<ChatWidgetConfig | null>(null)
  const [assistantConfig, setAssistantConfig] = useState<ChatAssistantConfig>(defaultAssistantConfig)
  const [openAiField, setOpenAiField] = useState<AiFieldId | null>('profile')
  const [languageSearch, setLanguageSearch] = useState('')
  const [selectedWidgetKey, setSelectedWidgetKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [lastConfigUpdate, setLastConfigUpdate] = useState<string | null>(null)
  const [allowedDomainsText, setAllowedDomainsText] = useState('')
  const [domainsSaving, setDomainsSaving] = useState(false)
  const [domainsStatus, setDomainsStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [assistantSaving, setAssistantSaving] = useState(false)
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPurpose, setWizardPurpose] = useState<'settings' | 'new-widget'>('settings')
  const [wizardStep, setWizardStep] = useState(0)
  const [wizardAutofillStatus, setWizardAutofillStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [wizardAutofillOpen, setWizardAutofillOpen] = useState(false)
  const [wizardAutofillUrl, setWizardAutofillUrl] = useState('')
  const [wizardAutofillHints, setWizardAutofillHints] = useState<WebsiteAutofillResult['missingFields']>({})
  const wizardScrollRef = useRef<HTMLDivElement | null>(null)
  const wizardScrollContentRef = useRef<HTMLDivElement | null>(null)
  const [wizardScrollThumb, setWizardScrollThumb] = useState({
    top: 0,
    height: 0,
    visible: false,
  })
  const [wizardAutoFilled, setWizardAutoFilled] = useState({
    businessProfile: false,
    knowledgeBase: false,
    integrations: false,
    strictness: false,
  })
  const [deleteWidgetChecked, setDeleteWidgetChecked] = useState(false)
  const [widgetActionStatus, setWidgetActionStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [newWidgetName, setNewWidgetName] = useState('')
  const [autoContextOpen, setAutoContextOpen] = useState(false)
  const [autoContextUrl, setAutoContextUrl] = useState('')
  const [autoContextUrlIsSeeded, setAutoContextUrlIsSeeded] = useState(false)
  const [autoContextUrlWasEdited, setAutoContextUrlWasEdited] = useState(false)
  const [autoContextStatus, setAutoContextStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [autoContextOverwriteConfirmed, setAutoContextOverwriteConfirmed] = useState(false)
  const [autoContextGeneratedSnapshot, setAutoContextGeneratedSnapshot] = useState<{
    businessContext: string
    faqSuggestionsText: string
  } | null>(null)
  const [autoContextDirtyFields, setAutoContextDirtyFields] = useState<{
    businessContext: boolean
    faqSuggestions: boolean
  }>({
    businessContext: false,
    faqSuggestions: false,
  })

  const widgetList = business?.chatWidgets || []
  const currentPlan = (config?.plan || business?.chatWidgetConfig?.plan || widgetList[0]?.config?.plan || 'free') as ChatWidgetConfig['plan']
  const widgetLimit = getPlanLimits(currentPlan).maxWidgets

  const applyWidgetConfig = (widgetConfig: ChatWidgetConfig | undefined) => {
    if (!widgetConfig) return
    const mergedConfig = mergeWidgetConfig(widgetConfig, business?.name || '')
    setConfig(mergedConfig)
    setAllowedDomainsText(
      Array.isArray(mergedConfig.allowedDomains) ? mergedConfig.allowedDomains.join('\n') : ''
    )
    setLastConfigUpdate(JSON.stringify(mergedConfig))
  }

  const applyWidgetAssistantConfig = (widget?: (typeof widgetList)[number] | null) => {
    const legacyBusinessConfig =
      !widget || widget.isDefault
        ? (business?.chatAssistantConfig as ChatAssistantConfig | undefined)
        : undefined

    setAssistantConfig({
      ...defaultAssistantConfig,
      ...(legacyBusinessConfig || {}),
      ...(widget?.assistantConfig || {}),
    })
  }

  const setAssistantField = <K extends keyof ChatAssistantConfig>(field: K, value: ChatAssistantConfig[K]) => {
    setAssistantConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const setBusinessProfileField = <K extends keyof AssistantBusinessProfile>(
    field: K,
    value: AssistantBusinessProfile[K]
  ) => {
    setAssistantConfig((prev) => ({
      ...prev,
      businessProfile: {
        ...createEmptyBusinessProfile(),
        ...(prev.businessProfile || {}),
        [field]: value,
      },
    }))
  }

  const setKnowledgeBaseField = <K extends keyof AssistantKnowledgeBase>(
    field: K,
    value: AssistantKnowledgeBase[K]
  ) => {
    setAssistantConfig((prev) => ({
      ...prev,
      knowledgeBase: {
        ...createEmptyKnowledgeBase(),
        ...(prev.knowledgeBase || {}),
        [field]: value,
      },
    }))
  }

  const setIntegrationField = <K extends keyof AssistantIntegrationSettings>(
    field: K,
    value: AssistantIntegrationSettings[K]
  ) => {
    setAssistantConfig((prev) => ({
      ...prev,
      integrations: {
        ...createEmptyIntegrations(),
        ...(prev.integrations || {}),
        [field]: value,
      },
    }))
  }

  const setAutoContextField = (field: 'businessContext' | 'faqSuggestions', nextValue: string) => {
    if (autoContextGeneratedSnapshot) {
      const generatedValue =
        field === 'businessContext'
          ? autoContextGeneratedSnapshot.businessContext
          : autoContextGeneratedSnapshot.faqSuggestionsText

      if (!autoContextDirtyFields[field] && nextValue !== generatedValue) {
        setAutoContextDirtyFields((prev) => ({
          ...prev,
          [field]: true,
        }))
      }
    }

    if (field === 'businessContext') {
      setAssistantField('businessContext', nextValue)
    } else {
      setAssistantField(
        'faqSuggestions',
        nextValue
          .split(/\n|,/) 
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    }
  }

  const buildAssistantConfigFromAutofill = (
    autofill: WebsiteAutofillResult,
    nextBusinessContext: string,
    nextFaqSuggestions: string[]
  ): ChatAssistantConfig => {
    const nextProfile = {
      businessName: autofill.businessProfile.businessName || '',
      industry: autofill.businessProfile.industry || '',
      shortDescription: autofill.businessProfile.shortDescription || '',
      toneOfVoice: autofill.businessProfile.toneOfVoice || '',
      language: autofill.businessProfile.language || '',
      multilingual: Boolean(autofill.businessProfile.multilingual),
      mainGoal: autofill.businessProfile.mainGoal || '',
      fallbackContact: autofill.businessProfile.fallbackContact || '',
    }

    const nextKnowledgeBase = {
      websiteUrls: autofill.knowledgeBase.websiteUrls || [],
      uploadedDocuments: assistantConfig.knowledgeBase?.uploadedDocuments || [],
      manualNotes: nextBusinessContext || '',
      openingHours: autofill.knowledgeBase.openingHours || '',
      contactInfo: autofill.knowledgeBase.contactInfo || '',
      addresses: autofill.knowledgeBase.addresses || '',
      keyFAQs: nextFaqSuggestions,
    }

    return {
      ...assistantConfig,
      businessProfile: nextProfile,
      knowledgeBase: nextKnowledgeBase,
      businessContext: nextBusinessContext,
      faqSuggestions: nextFaqSuggestions,
      replyInUserLanguage:
        autofill.businessProfile.language === 'Norwegian'
          ? false
          : assistantConfig.replyInUserLanguage,
      startLanguage: autofill.businessProfile.language || assistantConfig.startLanguage,
    }
  }

  const autoContextHasExistingContent = (() => {
    const currentProfile = assistantConfig.businessProfile || defaultAssistantConfig.businessProfile!
    const defaultProfile = defaultAssistantConfig.businessProfile!
    const currentKnowledgeBase = assistantConfig.knowledgeBase || defaultAssistantConfig.knowledgeBase!
    const defaultKnowledgeBase = defaultAssistantConfig.knowledgeBase!

    return (
      currentProfile.businessName.trim() !== defaultProfile.businessName.trim() ||
      currentProfile.industry.trim() !== defaultProfile.industry.trim() ||
      currentProfile.shortDescription.trim() !== defaultProfile.shortDescription.trim() ||
      currentProfile.toneOfVoice.trim() !== defaultProfile.toneOfVoice.trim() ||
      currentProfile.language.trim() !== defaultProfile.language.trim() ||
      currentProfile.multilingual !== defaultProfile.multilingual ||
      currentProfile.mainGoal.trim() !== defaultProfile.mainGoal.trim() ||
      currentProfile.fallbackContact.trim() !== defaultProfile.fallbackContact.trim() ||
      currentKnowledgeBase.websiteUrls.join('\n').trim() !== defaultKnowledgeBase.websiteUrls.join('\n').trim() ||
      currentKnowledgeBase.manualNotes.trim() !== defaultKnowledgeBase.manualNotes.trim() ||
      currentKnowledgeBase.openingHours.trim() !== defaultKnowledgeBase.openingHours.trim() ||
      currentKnowledgeBase.contactInfo.trim() !== defaultKnowledgeBase.contactInfo.trim() ||
      currentKnowledgeBase.addresses.trim() !== defaultKnowledgeBase.addresses.trim() ||
      currentKnowledgeBase.keyFAQs.join('\n').trim() !== defaultKnowledgeBase.keyFAQs.join('\n').trim() ||
      assistantConfig.businessContext.trim() !== defaultAssistantConfig.businessContext.trim() ||
      assistantConfig.faqSuggestions.join('\n').trim() !== defaultAssistantConfig.faqSuggestions.join('\n').trim() ||
      assistantConfig.startLanguage.trim() !== defaultAssistantConfig.startLanguage.trim() ||
      assistantConfig.replyInUserLanguage !== defaultAssistantConfig.replyInUserLanguage
    )
  })()
  const autoContextNeedsOverwriteConfirmation = autoContextOpen && autoContextHasExistingContent

  const persistAssistantConfig = async (nextConfig: ChatAssistantConfig) => {
    if (!dbUser?.businessId) return { success: false }

    const targetWidgetKey = selectedWidgetKey || business?.activeChatWidgetKey || business?.chatWidgetKey || ''
    const result = await updateChatAssistantConfig(dbUser.businessId, nextConfig, targetWidgetKey)

    if (result.success) {
      void refreshBusiness()
    }

    return result
  }

  const applyWizardAutofillResult = (autofill: WebsiteAutofillResult) => {
    const nextAssistantConfig = buildAssistantConfigFromAutofill(
      autofill,
      assistantConfig.businessContext || '',
      assistantConfig.faqSuggestions || []
    )

    setAssistantConfig(nextAssistantConfig)
    setWizardAutofillHints(autofill.missingFields)
    setWizardAutoFilled({
      businessProfile: true,
      knowledgeBase: true,
      integrations: true,
      strictness: true,
    })

    setAutoContextGeneratedSnapshot({
      businessContext: nextAssistantConfig.businessContext || '',
      faqSuggestionsText: (nextAssistantConfig.faqSuggestions || []).join('\n'),
    })
    setAutoContextDirtyFields({
      businessContext: false,
      faqSuggestions: false,
    })
  }

  useEffect(() => {
    const preferredWidgetKey =
      externalSelectedWidgetKey ||
      selectedWidgetKey ||
      business?.activeChatWidgetKey ||
      business?.chatWidgetKey ||
      ''

    if (externalSelectedWidgetKey && selectedWidgetKey !== externalSelectedWidgetKey) {
      setSelectedWidgetKey(externalSelectedWidgetKey)
    }

    const widget =
      widgetList.find((entry) => entry.widgetKey === preferredWidgetKey) ||
      widgetList.find((entry) => entry.widgetKey === business?.activeChatWidgetKey) ||
      widgetList[0] ||
      null

    if (widget) {
      setSelectedWidgetKey(widget.widgetKey)
      applyWidgetConfig(widget.config)
      applyWidgetAssistantConfig(widget)
      return
    }

    if (business?.chatWidgetConfig) {
      const mergedBusinessConfig = mergeWidgetConfig(business.chatWidgetConfig as ChatWidgetConfig, business.name || '')
      setConfig(mergedBusinessConfig)
      setLastConfigUpdate(JSON.stringify(mergedBusinessConfig))
      setAllowedDomainsText(
        Array.isArray(mergedBusinessConfig.allowedDomains)
          ? mergedBusinessConfig.allowedDomains.join('\n')
          : ''
      )
      setSelectedWidgetKey(preferredWidgetKey)
      applyWidgetAssistantConfig(null)
    }
  }, [business, widgetList, selectedWidgetKey, externalSelectedWidgetKey])

  useEffect(() => {
    if (!wizardOpen) return

    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
    }
  }, [wizardOpen])

  useEffect(() => {
    if (!autoContextOpen) return
    if (autoContextUrlWasEdited) return
    if (autoContextUrlIsSeeded && autoContextUrl) return

    const nextSeed = getFirstAllowedWebsiteUrl(allowedDomainsText)
    if (!nextSeed) return

    setAutoContextUrl(nextSeed)
    setAutoContextUrlIsSeeded(true)
  }, [allowedDomainsText, autoContextOpen, autoContextUrl, autoContextUrlIsSeeded, autoContextUrlWasEdited])

  useEffect(() => {
    if (!autoContextOpen) {
      setAutoContextOverwriteConfirmed(false)
      return
    }

    setAutoContextOverwriteConfirmed(false)
  }, [autoContextOpen, autoContextHasExistingContent])

  useEffect(() => {
    if (!dbUser?.businessId) return

    const applyConfigUpdate = (serializedConfig: string | null) => {
      if (!serializedConfig || serializedConfig === lastConfigUpdate) return

      try {
        const nextConfig = JSON.parse(serializedConfig) as ChatWidgetConfig
        setConfig(nextConfig)
        setAllowedDomainsText(
          Array.isArray(nextConfig.allowedDomains) ? nextConfig.allowedDomains.join('\n') : ''
        )
        setLastConfigUpdate(serializedConfig)
      } catch (error) {
        console.error('Failed to parse widget config update:', error)
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== `widget-config-${dbUser.businessId}`) return
      applyConfigUpdate(event.newValue)
    }

    const handleCustomConfigUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{
        businessId?: string
        serializedConfig?: string
      }>).detail

      if (detail?.businessId !== dbUser.businessId) return
      applyConfigUpdate(detail.serializedConfig || null)
    }

    const handleWindowFocus = () => {
      void refreshBusiness()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('vintra-widget-config-updated', handleCustomConfigUpdate as EventListener)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(
        'vintra-widget-config-updated',
        handleCustomConfigUpdate as EventListener
      )
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [dbUser?.businessId, lastConfigUpdate, refreshBusiness])

  const handleCopy = async () => {
    if (!activeWidgetKey) return

    await navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleWidgetChange = async (nextWidgetKey: string) => {
    if (!dbUser?.businessId || !nextWidgetKey) return
    const nextWidget = widgetList.find((widget) => widget.widgetKey === nextWidgetKey)
    if (!nextWidget) return

    setSelectedWidgetKey(nextWidgetKey)
    onWidgetSelected?.(nextWidgetKey)
    setDeleteWidgetChecked(false)
    setAutoContextGeneratedSnapshot(null)
    setAutoContextDirtyFields({
      businessContext: false,
      faqSuggestions: false,
    })
    setWizardStep(0)
    setWizardAutofillStatus('idle')
    setWizardAutofillOpen(false)
    setWizardAutofillUrl('')
    setWizardAutofillHints({})
    setWizardAutoFilled({
      businessProfile: false,
      knowledgeBase: false,
      integrations: false,
      strictness: false,
    })
    setAutoContextOpen(false)
    setAutoContextUrl('')
    setAutoContextUrlIsSeeded(false)
    setAutoContextUrlWasEdited(false)
    setAutoContextStatus('idle')
    setAutoContextOverwriteConfirmed(false)
    applyWidgetConfig(nextWidget.config)
    applyWidgetAssistantConfig(nextWidget)
    await setActiveChatWidget(dbUser.businessId, nextWidgetKey)
    await refreshBusiness()
  }

  const handleCreateWidget = async () => {
    if (!dbUser?.businessId) return

    setWidgetActionStatus('idle')
    const result = await createChatWidget(
      dbUser.businessId,
      newWidgetName.trim() || undefined,
      selectedWidgetKey || business?.activeChatWidgetKey || business?.chatWidgetKey || undefined,
      assistantConfig
    )

    if (!result.success || !result.widgetKey) {
      setWidgetActionStatus('error')
      return
    }

    setWidgetActionStatus('saved')
    setNewWidgetName('')
    setSelectedWidgetKey(result.widgetKey)
    onWidgetSelected?.(result.widgetKey)
    await refreshBusiness()
    setWizardOpen(false)
    setTimeout(() => setWidgetActionStatus('idle'), 2000)
  }

  const handleWizardFinish = async () => {
    if (wizardPurpose === 'new-widget') {
      await handleCreateWidget()
      return
    }

    await saveAssistantConfig()
    setWizardOpen(false)
  }

  const handleDeleteWidget = async () => {
    if (!dbUser?.businessId || !selectedWidgetKey || !deleteWidgetChecked) return

    setWidgetActionStatus('idle')
    const result = await deleteChatWidget(dbUser.businessId, selectedWidgetKey)

    if (!result.success) {
      setWidgetActionStatus('error')
      return
    }

    setDeleteWidgetChecked(false)
    setSelectedWidgetKey('')
    setConfig(null)
    setAllowedDomainsText('')
    setLastConfigUpdate(null)
    onWidgetSelected?.('')
    setAutoContextOpen(false)
    setAutoContextUrl('')
    setAutoContextUrlIsSeeded(false)
    setAutoContextUrlWasEdited(false)
    setAutoContextStatus('idle')
    setAutoContextOverwriteConfirmed(false)
    setAutoContextGeneratedSnapshot(null)
    setAutoContextDirtyFields({
      businessContext: false,
      faqSuggestions: false,
    })
    setWizardStep(0)
    setWizardAutofillStatus('idle')
    setWizardAutofillOpen(false)
    setWizardAutofillUrl('')
    setWizardAutofillHints({})
    setWizardAutoFilled({
      businessProfile: false,
      knowledgeBase: false,
      integrations: false,
      strictness: false,
    })
    setWidgetActionStatus('saved')
    await refreshBusiness()
    setTimeout(() => setWidgetActionStatus('idle'), 2000)
  }

  const saveAssistantConfig = async () => {
    if (!dbUser?.businessId) return

    setAssistantSaving(true)
    setAssistantStatus('idle')

    const result = await persistAssistantConfig(assistantConfig)

    setAssistantSaving(false)
    setAssistantStatus(result.success ? 'saved' : 'error')

    if (result.success) {
      void refreshBusiness()
      setTimeout(() => setAssistantStatus('idle'), 2000)
    }
  }

  const handleAutoContextStart = async () => {
    const trimmedUrl = autoContextUrl.trim()
    if (!trimmedUrl || autoContextStatus === 'running') return
    if (autoContextNeedsOverwriteConfirmation && !autoContextOverwriteConfirmed) return

    setAutoContextStatus('running')

    try {
      const response = await fetch('/api/scan-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trimmedUrl }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success || !data?.result) {
        throw new Error(data?.error || 'Website scan failed')
      }

      const nextBusinessContext = String(data.result.businessContext || '')
      const nextFaqSuggestions = Array.isArray(data.result.faqSuggestions)
        ? data.result.faqSuggestions.map((entry: string) => String(entry).trim()).filter(Boolean)
        : []
      const autofill = data.result.autofill as WebsiteAutofillResult | undefined

      const nextAssistantConfig = autofill
        ? buildAssistantConfigFromAutofill(autofill, nextBusinessContext, nextFaqSuggestions)
        : {
            ...assistantConfig,
            businessContext: nextBusinessContext,
            faqSuggestions: nextFaqSuggestions,
          }

      setAssistantConfig(nextAssistantConfig)
      setAutoContextGeneratedSnapshot({
        businessContext: nextBusinessContext,
        faqSuggestionsText: nextFaqSuggestions.join('\n'),
      })
      setAutoContextDirtyFields({
        businessContext: false,
        faqSuggestions: false,
      })
      setOpenAiField('knowledge')

      const saveResult = await persistAssistantConfig(nextAssistantConfig)

      if (!saveResult.success) {
        throw new Error('Failed to save auto context')
      }

      setAutoContextStatus('done')
      setAutoContextOverwriteConfirmed(false)
    } catch (error) {
      console.error('Auto context scan failed:', error)
      setAutoContextStatus('error')
      return
    }
  }

  const handleWizardAutofill = async () => {
    if (!dbUser?.businessId || wizardAutofillStatus === 'running') return

    const trimmedUrl = wizardAutofillUrl.trim() || getFirstAllowedWebsiteUrl(allowedDomainsText)
    if (!trimmedUrl) {
      setWizardAutofillStatus('error')
      return
    }

    setWizardAutofillStatus('running')

    try {
      const response = await fetch('/api/scan-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trimmedUrl }),
      })

      const data = await response.json()
      if (!response.ok || !data?.success || !data?.result) {
        throw new Error(data?.error || 'Website scan failed')
      }

      const nextBusinessContext = String(data.result.businessContext || '')
      const nextFaqSuggestions = Array.isArray(data.result.faqSuggestions)
        ? data.result.faqSuggestions.map((entry: string) => String(entry).trim()).filter(Boolean)
        : []
      const autofill = data.result.autofill as WebsiteAutofillResult | undefined

      if (autofill) {
        applyWizardAutofillResult({
          ...autofill,
          knowledgeBase: {
            ...autofill.knowledgeBase,
            websiteUrls: autofill.knowledgeBase.websiteUrls?.length
              ? autofill.knowledgeBase.websiteUrls
              : [trimmedUrl],
          },
        })
      }

      setAssistantConfig((prev) => ({
        ...prev,
        businessContext: nextBusinessContext || prev.businessContext,
        faqSuggestions: nextFaqSuggestions.length ? nextFaqSuggestions : prev.faqSuggestions,
        knowledgeBase: {
          ...(prev.knowledgeBase || createEmptyKnowledgeBase()),
          websiteUrls:
            autofill?.knowledgeBase.websiteUrls?.length
              ? autofill.knowledgeBase.websiteUrls
              : prev.knowledgeBase?.websiteUrls || [trimmedUrl],
          manualNotes: nextBusinessContext || prev.knowledgeBase?.manualNotes || '',
          keyFAQs: nextFaqSuggestions.length ? nextFaqSuggestions : prev.knowledgeBase?.keyFAQs || [],
        },
      }))

      setWizardAutofillStatus('done')
      setWizardStep((prev) => Math.min(prev, WIZARD_STEPS.length - 1))
      setWizardAutofillOpen(false)
      setWizardAutofillUrl(trimmedUrl)
    } catch (error) {
      console.error('Wizard autofill failed:', error)
      setWizardAutofillStatus('error')
      return
    }
  }

  const handleKnowledgeFileUpload = async (files: FileList | null) => {
    if (!files?.length) return

    const uploads = await Promise.all(
      Array.from(files).map(async (file) => {
        const readableTextFile =
          file.type.startsWith('text/') ||
          /\.(txt|md|csv|json|log|html?|xml)$/i.test(file.name)

        if (readableTextFile) {
          try {
            const text = await file.text()
            return {
              name: file.name,
              type: file.type || 'text/plain',
              status: 'ready' as const,
              text: text.slice(0, 15000),
            }
          } catch {
            return {
              name: file.name,
              type: file.type || 'text/plain',
              status: 'error' as const,
            }
          }
        }

        return {
          name: file.name,
          type: file.type || 'application/octet-stream',
          status: 'pending' as const,
        }
      })
    )

    setKnowledgeBaseField('uploadedDocuments', [...knowledgeBase.uploadedDocuments, ...uploads])
  }

  const autoContextSeedUrl = getFirstAllowedWebsiteUrl(allowedDomainsText)
  const autoContextButtonLabel =
    autoContextStatus === 'running'
      ? ''
      : autoContextOpen
        ? autoContextStatus === 'done'
          ? 'Run again'
          : 'Start auto context'
        : 'Auto context'
  const autoContextButtonDisabled =
    autoContextStatus === 'running' ||
    (autoContextOpen && autoContextHasExistingContent && !autoContextOverwriteConfirmed) ||
    (autoContextOpen && !autoContextUrl.trim())
  const autoContextShouldShowSeedNote =
    autoContextOpen &&
    autoContextUrlIsSeeded &&
    !!autoContextSeedUrl &&
    autoContextUrl.trim() === autoContextSeedUrl &&
    autoContextGeneratedSnapshot === null

  const saveAllowedDomains = async () => {
    if (!dbUser?.businessId) return

    const targetWidgetKey = selectedWidgetKey || business?.activeChatWidgetKey || business?.chatWidgetKey || ''
    if (!targetWidgetKey) {
      setDomainsStatus('error')
      return
    }

    setDomainsSaving(true)
    setDomainsStatus('idle')

    const parsedDomains = parseAllowedDomainsInput(allowedDomainsText)
    const mergedConfig = {
      ...(config || {}),
      allowedDomains: parsedDomains,
    } as ChatWidgetConfig
    const result = await updateChatWidgetConfig(
      dbUser.businessId,
      mergedConfig,
      targetWidgetKey
    )

    setDomainsSaving(false)
    setDomainsStatus(result.success ? 'saved' : 'error')

    if (result.success) {
      setSelectedWidgetKey(targetWidgetKey)
      setConfig(mergedConfig)
      setAllowedDomainsText(parsedDomains.join('\n'))
      if (typeof window !== 'undefined') {
        const storageKey = `widget-config-${dbUser.businessId}`
        const nextConfigPayload = JSON.stringify(mergedConfig)
        localStorage.setItem(storageKey, nextConfigPayload)
        window.dispatchEvent(
          new CustomEvent('vintra-widget-config-updated', {
            detail: {
              businessId: dbUser.businessId,
              serializedConfig: nextConfigPayload,
            },
          })
        )
      }
      void refreshBusiness()
      setTimeout(() => setDomainsStatus('idle'), 2000)
    } else {
      console.error('Failed to save allowed domains:', result.message)
    }
  }

  if (loading) {
    return (
      <div className="widget-admin-loading">
        <div className="widget-admin-spinner" />
        <p>Laster widget-oppsett...</p>
      </div>
    )
  }

  if (!dbUser || !business) {
    return (
      <div className="widget-admin-empty">
        <h2>Ingen tilgang</h2>
        <p>Du må være logget inn for å se widgetpanelet.</p>
      </div>
    )
  }

  const activeConfig: ChatWidgetConfig = config || {
    plan: 'free',
    billingCycle: 'monthly',
    colorTheme: 'modern',
    position: 'bottom-right',
    bubbleStyle: {
      showStatus: true,
      iconChoice: 'chat',
      borderType: 'rounded',
      shadowType: 'medium',
      animationType: 'fade',
      sizeType: 'medium',
    },
    headerStyle: {
      showStatus: true,
      showCloseButton: true,
      borderType: 'rounded',
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
    },
    footerStyle: {
      showSendButton: true,
      borderType: 'none',
      shadowType: 'none',
      inputStyle: 'rounded',
      showPlaceholder: true,
    },
    customBranding: {
      title: business.name || 'Support Chat',
      description: 'Usually replies in a few minutes',
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
    allowedDomains: [],
  }
  const activeWidgetKey = selectedWidgetKey || business.activeChatWidgetKey || business.chatWidgetKey || ''
  const activeWidgetName =
    widgetList.find((widget) => widget.widgetKey === activeWidgetKey)?.name || 'Widget'
  const embedCode = `<!-- VintraSolutions Chat Widget -->
<script src="https://chat.vintrastudio.com/widget/${activeWidgetKey}.js"></script>
<!-- End VintraSolutions Chat Widget -->`
  const filteredLanguageOptions = getLanguageMatches(languageSearch)
  const businessContextGenerated =
    !!autoContextGeneratedSnapshot &&
    !autoContextDirtyFields.businessContext &&
    assistantConfig.businessContext === autoContextGeneratedSnapshot.businessContext
  const faqSuggestionsGenerated =
    !!autoContextGeneratedSnapshot &&
    !autoContextDirtyFields.faqSuggestions &&
    assistantConfig.faqSuggestions.join('\n') === autoContextGeneratedSnapshot.faqSuggestionsText
  const humanSupportEnabled = assistantConfig.humanSupportEnabled !== false
  const businessProfile = assistantConfig.businessProfile || createEmptyBusinessProfile()
  const knowledgeBase = assistantConfig.knowledgeBase || createEmptyKnowledgeBase()
  const integrations = assistantConfig.integrations || createEmptyIntegrations()
  const strictness = assistantConfig.strictness || 'balanced'

  const getAutofillFieldClass = (generated: boolean, missing?: string) => {
    if (missing) return 'widget-ai-generated-context widget-ai-generated-context--missing'
    return generated ? 'widget-ai-generated-context' : ''
  }

  const getAutofillPlaceholder = (missing: string | undefined, fallback: string) =>
    missing || fallback

  const syncWizardScrollThumb = useCallback(() => {
    const scrollEl = wizardScrollRef.current
    if (!scrollEl) return

    const { scrollTop, scrollHeight, clientHeight } = scrollEl
    const visible = scrollHeight > clientHeight + 4

    if (!visible) {
      setWizardScrollThumb({ top: 0, height: 0, visible: false })
      return
    }

    const trackHeight = clientHeight
    const thumbHeight = Math.max(44, (clientHeight / scrollHeight) * trackHeight)
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight)
    const maxScrollTop = Math.max(1, scrollHeight - clientHeight)
    const top = (scrollTop / maxScrollTop) * maxThumbTop

    setWizardScrollThumb({
      top,
      height: thumbHeight,
      visible: true,
    })
  }, [])

  const handleWizardTrackMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const scrollEl = wizardScrollRef.current
    const trackEl = event.currentTarget
    if (!scrollEl) return

    const rect = trackEl.getBoundingClientRect()
    const clickPosition = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    const thumbHalf = Math.max(22, wizardScrollThumb.height / 2)
    const targetTop = clickPosition - thumbHalf
    const maxThumbTop = Math.max(0, rect.height - wizardScrollThumb.height)
    const maxScrollTop = Math.max(1, scrollEl.scrollHeight - scrollEl.clientHeight)
    const nextScrollTop = (Math.max(0, Math.min(maxThumbTop, targetTop)) / Math.max(1, maxThumbTop)) * maxScrollTop

    scrollEl.scrollTo({ top: nextScrollTop, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!wizardOpen) return

    const update = () => syncWizardScrollThumb()

    const scrollEl = wizardScrollRef.current
    const contentEl = wizardScrollContentRef.current

    update()

    scrollEl?.addEventListener('scroll', update, { passive: true })

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => update())
      : null

    if (scrollEl) observer?.observe(scrollEl)
    if (contentEl) observer?.observe(contentEl)

    window.addEventListener('resize', update)

    return () => {
      scrollEl?.removeEventListener('scroll', update)
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [wizardOpen, syncWizardScrollThumb])

  useEffect(() => {
    if (wizardStep > 0) {
      setWizardAutofillOpen(false)
    }
  }, [wizardStep])

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.body.classList.toggle('widget-admin-wizard-open', wizardOpen)

    return () => {
      document.body.classList.remove('widget-admin-wizard-open')
    }
  }, [wizardOpen])

  return (
    <div className="widget-admin-shell">
    <div className="widget-admin-top">
      <div>
        <h1>Chat Widget Administration</h1>
        <p>Se live preview, widgetdetaljer og embed-kode for nettsiden din.</p>
      </div>

        <div className="widget-admin-badge">
          <span className="widget-admin-badge-dot" />
          Live configuration
        </div>
      </div>

      {wizardOpen ? (
        <div className="widget-admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="widget-admin-modal-frame">
          <section className="widget-admin-card widget-admin-onboarding widget-admin-onboarding--modal">
            <div className="widget-admin-modal-header">
              <div className="widget-admin-modal-header__actions">
              <button
                type="button"
                className="widget-admin-danger-button widget-admin-modal-close"
                onClick={() => setWizardOpen(false)}
              >
                Close
              </button>
              <div className="widget-admin-modal-header__copy">
                <h3>Build the assistant context in layers</h3>
                <p className="widget-card-desc">
                  Start with the business profile, then add sources, actions, and rules. The fields stay editable, but the assistant gets a much cleaner context stack.
                </p>
              </div>
              <button
                type="button"
                className="widget-admin-save-button widget-admin-save-button--wizard"
                onClick={() => void handleWizardFinish()}
                disabled={wizardStep < WIZARD_STEPS.length - 1 || assistantSaving}
              >
                {assistantSaving ? 'Saving...' : 'Save'}
              </button>
              </div>
              <div className="widget-admin-wizard-stepper" aria-label="Business onboarding steps">
          {WIZARD_STEPS.map((step, index) => {
            const StepIcon = step.icon
            const active = wizardStep === index
            const done = wizardStep > index

            return (
              <div
                key={step.id}
                className={`widget-admin-wizard-step ${active ? 'active' : ''} ${done ? 'done' : ''}`.trim()}
              >
                <span className={`widget-admin-wizard-step__icon widget-admin-wizard-step__icon--${step.accent}`}>
                  <StepIcon />
                </span>
                <span className="widget-admin-wizard-step__copy">
                  <strong>{step.label}</strong>
                  <small>{index === 0 ? 'Profile' : index === 1 ? 'Sources' : index === 2 ? 'Actions' : 'Rules'}</small>
                </span>
              </div>
            )
          })}
            </div>
            </div>

            <div className="widget-admin-wizard-body">
              <div className="widget-admin-wizard-scroll" ref={wizardScrollRef}>
                <div className="widget-admin-wizard-scroll__content" ref={wizardScrollContentRef}>
                  {wizardStep === 0 ? (
                    <div className="widget-admin-wizard-autofill">
                      {!wizardAutofillOpen ? (
                        <button
                          type="button"
                          className="widget-admin-auto-context-button widget-admin-wizard-autofill__button"
                          onClick={() => {
                            setWizardAutofillOpen(true)
                            if (!wizardAutofillUrl.trim()) {
                              setWizardAutofillUrl(getFirstAllowedWebsiteUrl(allowedDomainsText))
                            }
                          }}
                        >
                          Auto-fill from URL
                        </button>
                      ) : (
                        <div className="widget-admin-wizard-autofill__panel">
                          <div className="widget-admin-wizard-autofill__left">
                            <span className="widget-admin-wizard-autofill__title">
                              <FiGlobe />
                              Website domain
                            </span>
                            <p className="widget-admin-wizard-autofill__meta">
                              We scan the domain, the homepage, and matching subpages. Missing info stays empty and is marked in red for manual fill.
                            </p>
                            <div className="widget-admin-wizard-autofill__input">
                              <label className="widget-ai-field">
                                <span>Domain or URL</span>
                                <input
                                  type="url"
                                  value={wizardAutofillUrl}
                                  onChange={(event) => setWizardAutofillUrl(event.target.value)}
                                  placeholder="https://yourcompany.com"
                                />
                              </label>
                              <p className="field-note">
                                If a page, email, phone, language, or goal is not found, we leave it blank instead of guessing.
                              </p>
                            </div>
                          </div>

                          <div className="widget-admin-wizard-autofill__right">
                            <p className="widget-admin-wizard-autofill__meta">
                              The scanner will collect matching URLs, contact info, opening hours, language cues, tone cues, and a short summary.
                            </p>
                            <button
                              type="button"
                              className="widget-admin-auto-context-button widget-admin-wizard-autofill__button"
                              onClick={() => void handleWizardAutofill()}
                              disabled={wizardAutofillStatus === 'running' || !wizardAutofillUrl.trim()}
                            >
                              {wizardAutofillStatus === 'running' ? 'Scanning...' : 'Start scan'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

              {wizardStep === 0 ? (
              <div className="widget-admin-wizard-panel">
            <div className="widget-ai-grid">
              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiBriefcase} accent="violet" /> Business name</span>
                <input
                  className={getAutofillFieldClass(wizardAutoFilled.businessProfile, wizardAutofillHints.businessName)}
                  type="text"
                  value={businessProfile.businessName}
                  onChange={(event) => setBusinessProfileField('businessName', event.target.value)}
                  placeholder={getAutofillPlaceholder(wizardAutofillHints.businessName, business.name || 'Your business name')}
                />
              </label>

              <label className="widget-ai-field">
                <span><FieldIcon icon={FiBriefcase} accent="blue" /> Industry</span>
                <input
                  className={getAutofillFieldClass(wizardAutoFilled.businessProfile, wizardAutofillHints.industry)}
                  type="text"
                  value={businessProfile.industry}
                  onChange={(event) => setBusinessProfileField('industry', event.target.value)}
                  placeholder={getAutofillPlaceholder(wizardAutofillHints.industry, 'Web design, salon, restaurant, support...')}
                />
              </label>

              <label className="widget-ai-field">
                <span><FieldIcon icon={FiMessageSquare} accent="rose" /> Fallback contact</span>
                <input
                  className={wizardAutoFilled.businessProfile ? 'widget-ai-generated-context' : ''}
                  type="text"
                  value={businessProfile.fallbackContact}
                  onChange={(event) => setBusinessProfileField('fallbackContact', event.target.value)}
                  placeholder="support@company.com"
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiZap} accent="amber" /> Short description</span>
                <AutoGrowTextarea
                  className={wizardAutoFilled.businessProfile ? 'widget-ai-generated-context' : ''}
                  value={businessProfile.shortDescription}
                  onChange={(event) => setBusinessProfileField('shortDescription', event.target.value)}
                  minRows={3}
                  placeholder="A short description of what the business does and why customers should care."
                />
              </label>

              <div className="widget-admin-tone-group widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiCpu} accent="violet" /> Tone of voice</span>
                <div className="widget-admin-tone-pills">
                  {TONE_OPTIONS.map((tone) => {
                    const active = splitCommaValues(businessProfile.toneOfVoice || '').some(
                      (entry) => entry.toLowerCase() === tone.value
                    )
                    return (
                      <button
                        key={tone.value}
                        type="button"
                        className={`widget-admin-tone-pill ${active ? 'active' : ''}`}
                        onClick={() =>
                          setBusinessProfileField(
                            'toneOfVoice',
                            toggleCommaValue(businessProfile.toneOfVoice || '', tone.value)
                          )
                        }
                      >
                        {tone.label}
                      </button>
                    )
                  })}
                </div>
                {wizardAutofillHints.toneOfVoice ? (
                  <p className="field-note widget-auto-context-note">{wizardAutofillHints.toneOfVoice}</p>
                ) : null}
              </div>

              <div className="widget-admin-language-group widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiGlobe} accent="green" /> Language</span>
                <div className="widget-admin-language-pills">
                  {[
                    { label: 'Norsk', startLanguage: 'Norwegian', replyInUserLanguage: false, multilingual: false },
                    { label: 'English', startLanguage: 'English', replyInUserLanguage: false, multilingual: false },
                    { label: 'Multilingual', startLanguage: 'English', replyInUserLanguage: true, multilingual: true },
                  ].map((option) => {
                    const active =
                      assistantConfig.startLanguage === option.startLanguage &&
                      assistantConfig.replyInUserLanguage === option.replyInUserLanguage

                    return (
                      <button
                        key={option.label}
                        type="button"
                        className={`widget-admin-language-pill ${active ? 'active' : ''}`}
                        onClick={() => {
                          setAssistantConfig((prev) => ({
                            ...prev,
                            startLanguage: option.startLanguage,
                            replyInUserLanguage: option.replyInUserLanguage,
                            businessProfile: {
                              ...(prev.businessProfile || createEmptyBusinessProfile()),
                              language: option.startLanguage,
                              multilingual: option.multilingual,
                            },
                          }))
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                {wizardAutofillHints.language ? (
                  <p className="field-note widget-auto-context-note">{wizardAutofillHints.language}</p>
                ) : null}
                <p className="field-note">
                  Norsk setter start language til norsk. Multilingual keeps reply-in-user-language on so the bot can answer in the visitor's language.
                </p>
              </div>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiTarget} accent="orange" /> Main goal</span>
                <div className="widget-admin-action-grid widget-admin-main-goal-grid">
                  {MAIN_GOAL_OPTIONS.map((option) => {
                    const active = splitCommaValues(businessProfile.mainGoal || '').some(
                      (entry) => entry.toLowerCase() === option.value
                    )

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`widget-admin-action-chip ${active ? 'active' : ''}`}
                        onClick={() =>
                          setBusinessProfileField(
                            'mainGoal',
                            toggleCommaValue(businessProfile.mainGoal || '', option.value)
                          )
                        }
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                <input
                  className={getAutofillFieldClass(wizardAutoFilled.businessProfile, wizardAutofillHints.mainGoal)}
                  type="text"
                  value={businessProfile.mainGoal}
                  onChange={(event) => setBusinessProfileField('mainGoal', event.target.value)}
                  placeholder={getAutofillPlaceholder(
                    wizardAutofillHints.mainGoal,
                    'Convert visitors into leads, collect bookings, take load off support...'
                  )}
                />
              </label>
            </div>
          </div>
              ) : null}

        {wizardStep === 1 ? (
          <div className="widget-admin-wizard-panel">
            <div className="widget-ai-grid">
              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiGlobe} accent="green" /> Website URLs</span>
                <AutoGrowTextarea
                  className={getAutofillFieldClass(wizardAutoFilled.knowledgeBase, wizardAutofillHints.websiteUrls)}
                  value={knowledgeBase.websiteUrls.join('\n')}
                  onChange={(event) =>
                    setKnowledgeBaseField(
                      'websiteUrls',
                      event.target.value
                        .split(/\n|,/) 
                        .map((entry) => entry.trim())
                        .filter(Boolean)
                    )
                  }
                  minRows={3}
                  placeholder={getAutofillPlaceholder(
                    wizardAutofillHints.websiteUrls,
                    'https://example.com\nhttps://example.com/pricing'
                  )}
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiUpload} accent="amber" /> Upload documents</span>
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.csv,.json,.html,.htm,.xml,.pdf,.doc,.docx"
                  onChange={(event) => void handleKnowledgeFileUpload(event.target.files)}
                />
                <p className="field-note">
                  Text-based files can be read immediately. PDFs and Word documents are stored as uploaded sources and can be connected to document extraction next.
                </p>
              </label>

              <div className="widget-admin-document-list widget-ai-field widget-ai-field-full">
                {knowledgeBase.uploadedDocuments.length ? (
                  knowledgeBase.uploadedDocuments.map((doc) => (
                    <div key={`${doc.name}-${doc.type}`} className="widget-admin-document-pill">
                      <strong>{doc.name}</strong>
                      <span>{doc.status || 'pending'}</span>
                    </div>
                  ))
                ) : (
                  <p className="field-note">No documents uploaded yet.</p>
                )}
              </div>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiClock} accent="violet" /> Opening hours</span>
                <input
                  className={getAutofillFieldClass(wizardAutoFilled.knowledgeBase, wizardAutofillHints.openingHours)}
                  type="text"
                  value={knowledgeBase.openingHours}
                  onChange={(event) => setKnowledgeBaseField('openingHours', event.target.value)}
                  placeholder={getAutofillPlaceholder(wizardAutofillHints.openingHours, 'Mon-Fri 09:00-16:00')}
                />
              </label>

              <label className="widget-ai-field">
                <span><FieldIcon icon={FiMessageSquare} accent="rose" /> Contact info</span>
                <input
                  className={getAutofillFieldClass(wizardAutoFilled.knowledgeBase, wizardAutofillHints.contactInfo)}
                  type="text"
                  value={knowledgeBase.contactInfo}
                  onChange={(event) => setKnowledgeBaseField('contactInfo', event.target.value)}
                  placeholder={getAutofillPlaceholder(wizardAutofillHints.contactInfo, 'Phone, email, chat or WhatsApp')}
                />
              </label>

              <label className="widget-ai-field">
                <span><FieldIcon icon={FiMapPin} accent="blue" /> Addresses</span>
                <input
                  className={getAutofillFieldClass(wizardAutoFilled.knowledgeBase, wizardAutofillHints.addresses)}
                  type="text"
                  value={knowledgeBase.addresses}
                  onChange={(event) => setKnowledgeBaseField('addresses', event.target.value)}
                  placeholder={getAutofillPlaceholder(wizardAutofillHints.addresses, 'Oslo, Norway / multiple locations')}
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiShield} accent="green" /> Manual notes</span>
                <AutoGrowTextarea
                  className={wizardAutoFilled.knowledgeBase ? 'widget-ai-generated-context' : ''}
                  value={knowledgeBase.manualNotes}
                  onChange={(event) => setKnowledgeBaseField('manualNotes', event.target.value)}
                  minRows={4}
                  placeholder="Write in any facts, policies, product notes, or operational details the bot should know."
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiHelpCircle} accent="amber" /> Key FAQ questions</span>
                <AutoGrowTextarea
                  className={wizardAutoFilled.knowledgeBase ? 'widget-ai-generated-context' : ''}
                  value={knowledgeBase.keyFAQs.join('\n')}
                  onChange={(event) =>
                    setKnowledgeBaseField(
                      'keyFAQs',
                      event.target.value
                        .split(/\n|,/) 
                        .map((entry) => entry.trim())
                        .filter(Boolean)
                    )
                  }
                  minRows={4}
                  placeholder={'What are your opening hours?\nHow do I contact support?\nWhat services do you offer?'}
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiLayers} accent="violet" /> Compiled context summary</span>
                <AutoGrowTextarea
                  className={wizardAutoFilled.knowledgeBase || businessContextGenerated ? 'widget-ai-generated-context' : ''}
                  value={assistantConfig.businessContext}
                  onChange={(event) => setAutoContextField('businessContext', event.target.value)}
                  minRows={5}
                  placeholder="A short summary the assistant can use as a second context layer."
                />
              </label>
            </div>
          </div>
        ) : null}

        {wizardStep === 2 ? (
          <div className="widget-admin-wizard-panel">
            <div className="widget-ai-grid">
              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiTarget} accent="orange" /> What should the chatbot do?</span>
                <div className="widget-admin-action-grid">
                  {[
                    ['replyToQuestions', 'Svare på spørsmål'],
                    ['collectLeads', 'Samle leads'],
                    ['bookMeetings', 'Booke møter'],
                    ['routeToPages', 'Sende til riktig side'],
                    ['createSupportTickets', 'Opprette support ticket'],
                    ['fetchOrderStatus', 'Hente ordrestatus'],
                    ['handoffToHuman', 'Videresende til menneske'],
                  ].map(([key, label]) => {
                    const field = key as keyof AssistantIntegrationSettings
                    const active = integrations[field]
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`widget-admin-action-chip ${active ? 'active' : ''}`}
                        onClick={() => setIntegrationField(field, !active)}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiMessageSquare} accent="blue" /> FAQ suggestions</span>
                <AutoGrowTextarea
                  className={faqSuggestionsGenerated ? 'widget-ai-generated-context' : ''}
                  value={assistantConfig.faqSuggestions.join('\n')}
                  onChange={(event) => setAutoContextField('faqSuggestions', event.target.value)}
                  minRows={4}
                  placeholder={'What are your opening hours?\nHow do I contact support?\nWhat services do you offer?'}
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiBriefcase} accent="rose" /> Human handoff message</span>
                <AutoGrowTextarea
                  value={assistantConfig.handoffMessage}
                  className={humanSupportEnabled ? '' : 'widget-ai-generated-context widget-ai-generated-context--disabled'}
                  disabled={!humanSupportEnabled}
                  onChange={(event) =>
                    setAssistantConfig((prev) => ({
                      ...prev,
                      handoffMessage: event.target.value,
                    }))
                  }
                  minRows={3}
                />
              </label>
            </div>
          </div>
        ) : null}

        {wizardStep === 3 ? (
          <div className="widget-admin-wizard-panel">
            <div className="widget-ai-grid">
              <div className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiShield} accent="amber" /> Strictness</span>
                <div className="widget-admin-strictness-grid">
                  {STRICTNESS_OPTIONS.map((option) => {
                    const active = strictness === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`widget-admin-strictness-card ${active ? 'active' : ''}`}
                        onClick={() =>
                          setAssistantConfig((prev) => ({
                            ...prev,
                            strictness: option.value,
                          }))
                        }
                      >
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiShield} accent="rose" /> Global system prompt</span>
                <AutoGrowTextarea
                  value={assistantConfig.systemPrompt}
                  onChange={(event) =>
                    setAssistantConfig((prev) => ({
                      ...prev,
                      systemPrompt: event.target.value,
                    }))
                  }
                  minRows={4}
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiShield} accent="amber" /> Rules and guardrails</span>
                <AutoGrowTextarea
                  value={assistantConfig.restrictions}
                  onChange={(event) =>
                    setAssistantConfig((prev) => ({
                      ...prev,
                      restrictions: event.target.value,
                    }))
                  }
                  minRows={4}
                  placeholder="What the bot may not do, what it should avoid, and when it should say 'I don't know'."
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiZap} accent="amber" /> Extra instructions</span>
                <AutoGrowTextarea
                  value={assistantConfig.extraInstructions}
                  onChange={(event) =>
                    setAssistantConfig((prev) => ({
                      ...prev,
                      extraInstructions: event.target.value,
                    }))
                  }
                  minRows={3}
                  placeholder="Optional style notes, support routing, or extra constraints."
                />
              </label>
            </div>
          </div>
        ) : null}

                </div>
              </div>
              <div
                className="widget-admin-wizard-scrollbar"
                onMouseDown={handleWizardTrackMouseDown}
                aria-hidden="true"
              >
                <div className="widget-admin-wizard-scrollbar__track">
                  <div
                    className="widget-admin-wizard-scrollbar__thumb"
                    style={{
                      transform: `translateY(${wizardScrollThumb.top}px)`,
                      height: `${wizardScrollThumb.height}px`,
                      opacity: wizardScrollThumb.visible ? 1 : 0,
                    }}
                  />
                </div>
              </div>
            </div>

        <div className="widget-admin-wizard-footer">
          {wizardStep > 0 ? (
            <button
              type="button"
              className="widget-admin-action-button widget-admin-action-button--back"
              onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}
            >
              Back
            </button>
          ) : (
            <span className="widget-admin-wizard-footer__spacer" aria-hidden="true" />
          )}
          <div className="widget-admin-wizard-footer__hint">
            <FieldIcon icon={FiLayers} accent="violet" />
            <span>
              {wizardStep < WIZARD_STEPS.length - 1
                ? 'Hver step bygger opp context bedre. Fortsett når du er klar.'
                : 'På slutten lagres alt til businessen og widgeten sammen.'}
            </span>
          </div>
          {wizardStep < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              className="widget-admin-save-button"
              onClick={() => setWizardStep((prev) => prev + 1)}
              disabled={assistantSaving}
            >
              Next step
            </button>
          ) : null}
        </div>
          </section>
          </div>
        </div>
      ) : null}

      <section className="widget-admin-card widget-admin-widget-manager">
        <div className="widget-admin-widget-manager__header">
          <div>
            <h3>Chat widgets</h3>
            <p>
              {widgetList.length
                ? `${widgetList.length} widget${widgetList.length === 1 ? '' : 's'} saved for this business.`
                : 'No widgets yet.'}
            </p>
          </div>
          <div className="widget-admin-widget-manager__actions">
            <button
              type="button"
              className="widget-admin-action-button"
              onClick={() => {
                setWizardStep(0)
                setWizardPurpose('new-widget')
                setWizardOpen(true)
              }}
              disabled={!dbUser?.businessId || (widgetLimit !== null && widgetList.length >= widgetLimit)}
            >
              Add widget
            </button>
            {widgetActionStatus === 'saved' && <span className="widget-admin-status saved">Saved</span>}
            {widgetActionStatus === 'error' && <span className="widget-admin-status error">Action failed</span>}
          </div>
        </div>

        <div className="widget-admin-widget-manager__body">
          <label className="widget-admin-field">
            <span>New widget name</span>
            <input
              id="new-widget-name"
              name="new-widget-name"
              type="text"
              value={newWidgetName}
              onChange={(event) => setNewWidgetName(event.target.value)}
              placeholder="Homepage widget, Support widget, Footer widget..."
            />
          </label>

          <label className="widget-admin-field">
            <span>Select widget</span>
            <select
              id="select-widget"
              name="select-widget"
              value={activeWidgetKey}
              onChange={(event) => void handleWidgetChange(event.target.value)}
              disabled={!widgetList.length}
            >
              {widgetList.map((widget) => (
                <option key={widget.widgetKey} value={widget.widgetKey}>
                  {widget.name}
                  {widget.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </label>

          {widgetList.length > 0 && (
            <div className="widget-admin-widget-list">
              {widgetList.map((widget) => {
                const isActive = widget.widgetKey === activeWidgetKey
                return (
                  <button
                    key={widget.widgetKey}
                    type="button"
                    className={`widget-admin-widget-card ${isActive ? 'active' : ''}`}
                    onClick={() => void handleWidgetChange(widget.widgetKey)}
                  >
                    <strong>{widget.name}</strong>
                    <span>{widget.widgetKey}</span>
                    <small>{widget.isDefault ? 'Default widget' : 'Custom widget'}</small>
                  </button>
                )
              })}
            </div>
          )}

          <div className="widget-admin-widget-manager__summary">
            <div>
              <strong>{activeWidgetName}</strong>
              <span>Current widget</span>
            </div>
            <div>
              <strong>{(config?.plan || 'free').toUpperCase()}</strong>
              <span>Plan</span>
            </div>
            <div>
              <strong>{activeWidgetKey}</strong>
              <span>Widget key</span>
            </div>
          </div>

          <div className="widget-admin-delete-box">
            <label className="widget-admin-check">
              <input
                type="checkbox"
                checked={deleteWidgetChecked}
                onChange={(event) => setDeleteWidgetChecked(event.target.checked)}
              />
              <span>I understand this permanently deletes the selected widget.</span>
            </label>
            <button
              type="button"
              className="widget-admin-danger-button"
              onClick={() => void handleDeleteWidget()}
              disabled={!deleteWidgetChecked || !selectedWidgetKey}
            >
              Delete widget
            </button>
          </div>
          <p className="widget-admin-widget-manager__note">
            {currentPlan === 'free'
              ? 'Free plan users can keep one widget.'
              : `Unlimited widgets available on ${currentPlan === 'business' ? 'Enterprise' : 'Pro'}.`}
          </p>
        </div>
      </section>

      <div className="widget-admin-grid">
        <section className="widget-admin-card widget-admin-preview">
          <div className="widget-card-header">
            <div className="widget-preview-heading">
              <h3>Live Preview</h3>
              <span className="widget-preview-tag">Interactive</span>
            </div>
            <div className="widget-preview-key">
              <span>Widget key</span>
              <code>{activeWidgetKey}</code>
            </div>
          </div>

          <div className={`widget-preview-stage theme-${activeConfig.colorTheme}`}>
            <WidgetPreview
              bubbleStyle={activeConfig.bubbleStyle}
              headerStyle={activeConfig.headerStyle}
              bodyStyle={activeConfig.bodyStyle}
              footerStyle={activeConfig.footerStyle}
              position={activeConfig.position}
              colorTheme={activeConfig.colorTheme}
              customBranding={activeConfig.customBranding}
              initialOpen={true}
              variant="embedded"
              enablePreviewChat={true}
              previewReply="hi, this is only a test"
              faqSuggestionsEnabled={assistantConfig.faqSuggestionsEnabled}
              faqSuggestions={assistantConfig.faqSuggestions}
              />
            </div>
          </section>

        <section className="widget-admin-card widget-admin-code">
          <div className="widget-card-header">
            <h3>Selected Widget Script</h3>
            <button type="button" className="widget-admin-save-button" onClick={handleCopy}>
              <FieldIcon icon={FiCopy} accent="blue" />
              {copied ? 'Copied!' : 'Copy script'}
            </button>
          </div>

          <p className="widget-card-desc">
            Copy the script for the currently selected widget. Use this on
            https://chat.vintrastudio.com for production.
          </p>

          <div className="widget-code-block">
            <code>{embedCode}</code>
          </div>
        </section>

        <section className="widget-admin-card widget-admin-security">
          <div className="widget-card-header widget-card-header--compact">
            <span className="widget-admin-section-label">Domain allowlist</span>
            <button type="button" className="widget-admin-save-button" onClick={saveAllowedDomains} disabled={domainsSaving}>
              {domainsSaving ? 'Saving...' : domainsStatus === 'saved' ? 'Saved!' : 'Save domains'}
            </button>
          </div>

          <p className="widget-card-desc">
            Add one allowed domain or full origin per line. If this list is empty, external sites are blocked.
          </p>

          <div className="widget-ai-grid">
            <label className="widget-ai-field widget-ai-field-full">
              <span>Allowed domains</span>
              <AutoGrowTextarea
                id="allowed-domains"
                name="allowed-domains"
                value={allowedDomainsText}
                onChange={(event) => setAllowedDomainsText(event.target.value)}
                minRows={5}
                placeholder={allowedDomainSeed.join('\n')}
              />
              <p className="field-note">
                Press Enter for a new line. You can paste full URLs like{' '}
                <code>{allowedDomainSeed[1]}</code>, or plain domains like{' '}
                <code>{allowedDomainSeed[0]}</code>.
              </p>
            </label>
          </div>
        </section>

        <section className="widget-admin-card widget-admin-ai">
          <div className="widget-card-header widget-card-header--compact">
            <div className="widget-admin-ai-header">
              <button
                type="button"
                className={`widget-admin-auto-context-button ${autoContextStatus === 'running' ? 'widget-admin-auto-context-button--compact' : ''}`.trim()}
                onClick={() => {
                  if (!autoContextOpen) {
                    setAutoContextOpen(true)
                    if (!autoContextUrl.trim() && autoContextSeedUrl) {
                      setAutoContextUrl(autoContextSeedUrl)
                      setAutoContextUrlIsSeeded(true)
                      setAutoContextUrlWasEdited(false)
                    }
                    return
                  }

                  void handleAutoContextStart()
                }}
                disabled={autoContextStatus === 'running' || autoContextStatus === 'done' || (autoContextOpen && !autoContextUrl.trim())}
                aria-busy={autoContextStatus === 'running'}
              >
                {autoContextStatus === 'running' ? (
                  <span className="widget-admin-auto-context-button__spinner" aria-hidden="true">
                    <FiLoader style={{ color: '#7c3aed' }} />
                  </span>
                ) : (
                  <span>{autoContextButtonLabel}</span>
                )}
              </button>
              <span className="widget-admin-section-label">AI settings</span>
            </div>
            <button
              type="button"
              className="widget-admin-save-button"
              onClick={saveAssistantConfig}
              disabled={assistantSaving || autoContextStatus === 'running'}
            >
              {assistantSaving
                ? 'Saving...'
                : assistantStatus === 'saved'
                  ? 'Saved!'
                  : 'Save AI settings'}
            </button>
          </div>

          <p className="widget-card-desc">
            Configure the assistant through the same layered context stack as onboarding. Each step expands into editable fields.
          </p>

          {autoContextOpen ? (
            <div className="widget-auto-context-panel">
              <label className="widget-ai-field widget-ai-field-full">
                <span>Website URL</span>
                <input
                  id="auto-context-url"
                  name="auto-context-url"
                  type="url"
                  value={autoContextUrl}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setAutoContextUrl(nextValue)

                    if (autoContextUrlIsSeeded && autoContextSeedUrl && nextValue !== autoContextSeedUrl) {
                      setAutoContextUrlIsSeeded(false)
                      setAutoContextUrlWasEdited(true)
                    }

                    if (!nextValue.trim()) {
                      setAutoContextUrlWasEdited(true)
                    }
                  }}
                  placeholder="https://example.com"
                />
                {autoContextShouldShowSeedNote ? (
                  <p className="field-note widget-auto-context-note">
                    is this url correct to your website?
                  </p>
                ) : (
                  <p className="field-note widget-auto-context-note">
                    {autoContextSeedUrl
                      ? 'We found a root website URL from your allowed domains. If it looks right, start auto context.'
                      : 'Enter your website root URL and start auto context to scan the site.'}
                  </p>
                )}
              </label>

              {autoContextHasExistingContent ? (
                <div className="widget-auto-context-overwrite">
                  <label className="widget-ai-field widget-ai-toggle">
                    <span><FieldIcon icon={FiShield} accent="amber" /> Existing fields will be replaced</span>
                    <input
                      type="checkbox"
                      checked={autoContextOverwriteConfirmed}
                      onChange={(event) => setAutoContextOverwriteConfirmed(event.target.checked)}
                    />
                  </label>
                  <p className="field-note widget-auto-context-note">
                    Auto context will overwrite the compiled context summary and FAQ suggestions that are already in the AI settings. Check this box before scanning again.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="widget-ai-grid widget-ai-grid--top">
            <label className="widget-ai-field widget-ai-toggle">
              <span><FieldIcon icon={FiCpu} accent="violet" /> Enable AI replies</span>
              <input
                id="assistant-enabled"
                name="assistant-enabled"
                type="checkbox"
                checked={assistantConfig.enabled}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    enabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="widget-ai-field widget-ai-toggle">
              <span><FieldIcon icon={FiShield} accent="amber" /> Strict context only</span>
              <input
                id="assistant-strict-context"
                name="assistant-strict-context"
                type="checkbox"
                checked={assistantConfig.strictContextOnly}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    strictContextOnly: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="widget-ai-field widget-ai-toggle">
              <span><FieldIcon icon={FiGlobe} accent="green" /> Reply in user language</span>
              <input
                id="assistant-reply-user-language"
                name="assistant-reply-user-language"
                type="checkbox"
                checked={assistantConfig.replyInUserLanguage}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    replyInUserLanguage: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="widget-ai-field widget-ai-toggle">
              <span><FieldIcon icon={FiMessageSquare} accent="rose" /> Human support</span>
              <input
                id="assistant-human-support"
                name="assistant-human-support"
                type="checkbox"
                checked={humanSupportEnabled}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    humanSupportEnabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="widget-ai-field widget-ai-toggle">
              <span><FieldIcon icon={FiHelpCircle} accent="blue" /> FAQ suggestions</span>
              <input
                id="assistant-faq-suggestions"
                name="assistant-faq-suggestions"
                type="checkbox"
                checked={assistantConfig.faqSuggestionsEnabled}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    faqSuggestionsEnabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="widget-ai-field">
              <span><FieldIcon icon={FiBriefcase} accent="violet" /> Provider</span>
              <input type="text" value={assistantConfig.provider} disabled />
            </label>

            <label className="widget-ai-field">
              <span><FieldIcon icon={FiMessageSquare} accent="rose" /> Model</span>
              <div className="widget-ai-readonly">
                <strong>{assistantConfig.model || 'gemini-2.5-flash-lite'}</strong>
                <span>Managed from Vintra Admin</span>
              </div>
            </label>
          </div>

          <div className="widget-admin-field-accordion-stack">
            <CollapsibleAiField
              id="profile"
              title="1. Bedriftsinfo"
              description="Name, language, tone and the business goal."
              icon={FiBriefcase}
              accent="violet"
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiBriefcase} accent="violet" /> Name</span>
                <input
                  className={wizardAutoFilled.businessProfile ? 'widget-ai-generated-context' : ''}
                  type="text"
                  value={businessProfile.businessName}
                  onChange={(event) => setBusinessProfileField('businessName', event.target.value)}
                  placeholder={business.name || 'Your business name'}
                />
              </label>

              <div className="widget-ai-grid">
                <label className="widget-ai-field">
                  <span><FieldIcon icon={FiBriefcase} accent="blue" /> Industry</span>
                  <input
                    className={getAutofillFieldClass(wizardAutoFilled.businessProfile, wizardAutofillHints.industry)}
                    type="text"
                    value={businessProfile.industry}
                    onChange={(event) => setBusinessProfileField('industry', event.target.value)}
                    placeholder={getAutofillPlaceholder(wizardAutofillHints.industry, 'Web design, salon, restaurant, support...')}
                  />
                </label>

                <label className="widget-ai-field">
                  <span><FieldIcon icon={FiMessageSquare} accent="rose" /> Fallback contact</span>
                  <input
                    className={getAutofillFieldClass(wizardAutoFilled.businessProfile, wizardAutofillHints.fallbackContact)}
                    type="text"
                    value={businessProfile.fallbackContact}
                    onChange={(event) => setBusinessProfileField('fallbackContact', event.target.value)}
                    placeholder={getAutofillPlaceholder(wizardAutofillHints.fallbackContact, 'support@company.com')}
                  />
                </label>
              </div>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiZap} accent="amber" /> Short description</span>
                <AutoGrowTextarea
                  className={getAutofillFieldClass(wizardAutoFilled.businessProfile, wizardAutofillHints.shortDescription)}
                  value={businessProfile.shortDescription}
                  onChange={(event) => setBusinessProfileField('shortDescription', event.target.value)}
                  minRows={3}
                  placeholder={getAutofillPlaceholder(
                    wizardAutofillHints.shortDescription,
                    'A short description of what the business does and why customers should care.'
                  )}
                />
              </label>

              <div className="widget-admin-tone-group widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiCpu} accent="violet" /> Tone of voice</span>
                <div className="widget-admin-tone-pills">
                  {TONE_OPTIONS.map((tone) => {
                    const active = splitCommaValues(businessProfile.toneOfVoice || '').some(
                      (entry) => entry.toLowerCase() === tone.value
                    )
                    return (
                      <button
                        key={tone.value}
                        type="button"
                        className={`widget-admin-tone-pill ${active ? 'active' : ''}`}
                        onClick={() =>
                          setBusinessProfileField(
                            'toneOfVoice',
                            toggleCommaValue(businessProfile.toneOfVoice || '', tone.value)
                          )
                        }
                      >
                        {tone.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="widget-admin-language-group widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiGlobe} accent="green" /> Language</span>
                <div className="widget-admin-language-pills">
                  {[
                    { label: 'Norsk', startLanguage: 'Norwegian', replyInUserLanguage: false, multilingual: false },
                    { label: 'English', startLanguage: 'English', replyInUserLanguage: false, multilingual: false },
                    { label: 'Multilingual', startLanguage: 'English', replyInUserLanguage: true, multilingual: true },
                  ].map((option) => {
                    const active =
                      assistantConfig.startLanguage === option.startLanguage &&
                      assistantConfig.replyInUserLanguage === option.replyInUserLanguage

                    return (
                      <button
                        key={option.label}
                        type="button"
                        className={`widget-admin-language-pill ${active ? 'active' : ''}`}
                        onClick={() => {
                          setAssistantConfig((prev) => ({
                            ...prev,
                            startLanguage: option.startLanguage,
                            replyInUserLanguage: option.replyInUserLanguage,
                            businessProfile: {
                              ...(prev.businessProfile || createEmptyBusinessProfile()),
                              language: option.startLanguage,
                              multilingual: option.multilingual,
                            },
                          }))
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                <p className="field-note">
                  Norsk sets the start language to Norwegian. Multilingual keeps reply-in-user-language on so the assistant can answer in the visitor&apos;s language.
                </p>
              </div>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiTarget} accent="orange" /> Main goal</span>
                <div className="widget-admin-action-grid widget-admin-main-goal-grid">
                  {MAIN_GOAL_OPTIONS.map((option) => {
                    const active = splitCommaValues(businessProfile.mainGoal || '').some(
                      (entry) => entry.toLowerCase() === option.value
                    )

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`widget-admin-action-chip ${active ? 'active' : ''}`}
                        onClick={() =>
                          setBusinessProfileField(
                            'mainGoal',
                            toggleCommaValue(businessProfile.mainGoal || '', option.value)
                          )
                        }
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                <input
                  className={getAutofillFieldClass(wizardAutoFilled.businessProfile, wizardAutofillHints.mainGoal)}
                  type="text"
                  value={businessProfile.mainGoal}
                  onChange={(event) => setBusinessProfileField('mainGoal', event.target.value)}
                  placeholder={getAutofillPlaceholder(
                    wizardAutofillHints.mainGoal,
                    'Convert visitors into leads, collect bookings, take load off support...'
                  )}
                />
              </label>
            </CollapsibleAiField>

            <CollapsibleAiField
              id="knowledge"
              title="2. Kilder"
              description="Website URLs, uploads, notes and reference facts."
              icon={FiLayers}
              accent="green"
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiGlobe} accent="green" /> Website URLs</span>
                <AutoGrowTextarea
                  className={wizardAutoFilled.knowledgeBase ? 'widget-ai-generated-context' : ''}
                  value={knowledgeBase.websiteUrls.join('\n')}
                  onChange={(event) =>
                    setKnowledgeBaseField(
                      'websiteUrls',
                      event.target.value
                        .split(/\n|,/) 
                        .map((entry) => entry.trim())
                        .filter(Boolean)
                    )
                  }
                  minRows={3}
                  placeholder={'https://example.com\nhttps://example.com/pricing'}
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiUpload} accent="amber" /> Upload documents</span>
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.csv,.json,.html,.htm,.xml,.pdf,.doc,.docx"
                  onChange={(event) => void handleKnowledgeFileUpload(event.target.files)}
                />
                <p className="field-note">
                  Text-based files can be read immediately. PDFs and Word documents are stored as uploaded sources and can be connected to document extraction next.
                </p>
              </label>

              <div className="widget-admin-document-list widget-ai-field widget-ai-field-full">
                {knowledgeBase.uploadedDocuments.length ? (
                  knowledgeBase.uploadedDocuments.map((doc) => (
                    <div key={`${doc.name}-${doc.type}`} className="widget-admin-document-pill">
                      <strong>{doc.name}</strong>
                      <span>{doc.status || 'pending'}</span>
                    </div>
                  ))
                ) : (
                  <p className="field-note">No documents uploaded yet.</p>
                )}
              </div>

              <div className="widget-ai-grid">
                <label className="widget-ai-field">
                  <span><FieldIcon icon={FiClock} accent="violet" /> Opening hours</span>
                  <input
                    className={getAutofillFieldClass(wizardAutoFilled.knowledgeBase, wizardAutofillHints.openingHours)}
                    type="text"
                    value={knowledgeBase.openingHours}
                    onChange={(event) => setKnowledgeBaseField('openingHours', event.target.value)}
                    placeholder={getAutofillPlaceholder(wizardAutofillHints.openingHours, 'Mon-Fri 09:00-16:00')}
                  />
                </label>

                <label className="widget-ai-field">
                  <span><FieldIcon icon={FiMessageSquare} accent="rose" /> Contact info</span>
                  <input
                    className={getAutofillFieldClass(wizardAutoFilled.knowledgeBase, wizardAutofillHints.contactInfo)}
                    type="text"
                    value={knowledgeBase.contactInfo}
                    onChange={(event) => setKnowledgeBaseField('contactInfo', event.target.value)}
                    placeholder={getAutofillPlaceholder(wizardAutofillHints.contactInfo, 'Phone, email, chat or WhatsApp')}
                  />
                </label>

                <label className="widget-ai-field widget-ai-field-full">
                  <span><FieldIcon icon={FiMapPin} accent="blue" /> Addresses</span>
                  <input
                    className={getAutofillFieldClass(wizardAutoFilled.knowledgeBase, wizardAutofillHints.addresses)}
                    type="text"
                    value={knowledgeBase.addresses}
                    onChange={(event) => setKnowledgeBaseField('addresses', event.target.value)}
                    placeholder={getAutofillPlaceholder(wizardAutofillHints.addresses, 'Oslo, Norway / multiple locations')}
                  />
                </label>
              </div>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiShield} accent="green" /> Manual notes</span>
                <AutoGrowTextarea
                  className={wizardAutoFilled.knowledgeBase ? 'widget-ai-generated-context' : ''}
                  value={knowledgeBase.manualNotes}
                  onChange={(event) => setKnowledgeBaseField('manualNotes', event.target.value)}
                  minRows={4}
                  placeholder="Write in any facts, policies, product notes, or operational details the bot should know."
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiHelpCircle} accent="amber" /> Key FAQ questions</span>
                <AutoGrowTextarea
                  className={wizardAutoFilled.knowledgeBase ? 'widget-ai-generated-context' : ''}
                  value={knowledgeBase.keyFAQs.join('\n')}
                  onChange={(event) =>
                    setKnowledgeBaseField(
                      'keyFAQs',
                      event.target.value
                        .split(/\n|,/) 
                        .map((entry) => entry.trim())
                        .filter(Boolean)
                    )
                  }
                  minRows={4}
                  placeholder={'What are your opening hours?\nHow do I contact support?\nWhat services do you offer?'}
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiLayers} accent="violet" /> Compiled context summary</span>
                <AutoGrowTextarea
                  className={wizardAutoFilled.knowledgeBase || businessContextGenerated ? 'widget-ai-generated-context' : ''}
                  value={assistantConfig.businessContext}
                  onChange={(event) => setAutoContextField('businessContext', event.target.value)}
                  minRows={5}
                  placeholder="A short summary the assistant can use as a second context layer."
                />
              </label>
            </CollapsibleAiField>

            <CollapsibleAiField
              id="actions"
              title="3. Hva den skal gjøre"
              description="What the assistant should do for visitors."
              icon={FiTarget}
              accent="amber"
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <div className="widget-admin-action-grid">
                {[
                  ['replyToQuestions', 'Svare på spørsmål'],
                  ['collectLeads', 'Samle leads'],
                  ['bookMeetings', 'Booke møter'],
                  ['routeToPages', 'Sende til riktig side'],
                  ['createSupportTickets', 'Opprette support ticket'],
                  ['fetchOrderStatus', 'Hente ordrestatus'],
                  ['handoffToHuman', 'Videresende til menneske'],
                ].map(([key, label]) => {
                  const field = key as keyof AssistantIntegrationSettings
                  const active = integrations[field]
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`widget-admin-action-chip ${active ? 'active' : ''}`}
                      onClick={() => setIntegrationField(field, !active)}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiMessageSquare} accent="blue" /> FAQ suggestions</span>
                <AutoGrowTextarea
                  className={faqSuggestionsGenerated ? 'widget-ai-generated-context' : ''}
                  value={assistantConfig.faqSuggestions.join('\n')}
                  onChange={(event) => setAutoContextField('faqSuggestions', event.target.value)}
                  minRows={4}
                  placeholder={'What are your opening hours?\nHow do I contact support?\nWhat services do you offer?'}
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiBriefcase} accent="rose" /> Human handoff message</span>
                <AutoGrowTextarea
                  value={assistantConfig.handoffMessage}
                  className={humanSupportEnabled ? '' : 'widget-ai-generated-context widget-ai-generated-context--disabled'}
                  disabled={!humanSupportEnabled}
                  onChange={(event) =>
                    setAssistantConfig((prev) => ({
                      ...prev,
                      handoffMessage: event.target.value,
                    }))
                  }
                  minRows={3}
                />
                {!humanSupportEnabled ? (
                  <p className="field-note">
                    Human handoff is turned off. Turn it on to use this message and to see chats and tasks created from human support requests.
                  </p>
                ) : null}
              </label>
            </CollapsibleAiField>

            <CollapsibleAiField
              id="rules"
              title="4. Regler"
              description="Strictness, response behavior and guardrails."
              icon={FiShield}
              accent="rose"
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <div className="widget-admin-strictness-grid">
                {STRICTNESS_OPTIONS.map((option) => {
                  const active = strictness === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`widget-admin-strictness-card ${active ? 'active' : ''}`}
                      onClick={() =>
                        setAssistantConfig((prev) => ({
                          ...prev,
                          strictness: option.value,
                        }))
                      }
                    >
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </button>
                  )
                })}
              </div>

              <div className="widget-admin-tone-group widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiCpu} accent="violet" /> Behavior</span>
                <div className="widget-admin-tone-pills">
                  {[
                    { value: 'Friendly, clear, and concise', label: 'Jovial' },
                    { value: 'Professional, clear, and concise', label: 'Professional' },
                    { value: 'Warm, helpful, and concise', label: 'Warm' },
                    { value: 'Short, direct, and practical', label: 'Short' },
                    { value: 'Lively, playful, and helpful', label: 'Playful' },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className={`widget-admin-tone-pill ${assistantConfig.responseStyle === option.value ? 'active' : ''}`}
                      onClick={() =>
                        setAssistantConfig((prev) => ({
                          ...prev,
                          responseStyle: option.value,
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiShield} accent="amber" /> Restrictions</span>
                <AutoGrowTextarea
                  value={assistantConfig.restrictions}
                  onChange={(event) =>
                    setAssistantConfig((prev) => ({
                      ...prev,
                      restrictions: event.target.value,
                    }))
                  }
                  minRows={4}
                  placeholder="What the bot may not do, what it should avoid, and when it should say 'I don't know'."
                />
              </label>

              <label className="widget-ai-field widget-ai-field-full">
                <span><FieldIcon icon={FiZap} accent="amber" /> Extra instructions</span>
                <AutoGrowTextarea
                  value={assistantConfig.extraInstructions}
                  onChange={(event) =>
                    setAssistantConfig((prev) => ({
                      ...prev,
                      extraInstructions: event.target.value,
                    }))
                  }
                  minRows={3}
                  placeholder="Optional style notes, support routing, or extra constraints."
                />
              </label>
            </CollapsibleAiField>
          </div>
        </section>
      </div>
    </div>
  )
}
