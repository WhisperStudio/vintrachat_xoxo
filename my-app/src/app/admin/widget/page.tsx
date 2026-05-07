'use client'

import { useEffect, useRef, useState, type ReactNode, type SVGProps, type TextareaHTMLAttributes } from 'react'
import {
  FiBriefcase,
  FiChevronDown,
  FiCopy,
  FiCpu,
  FiGlobe,
  FiHelpCircle,
  FiMessageSquare,
  FiSearch,
  FiShield,
  FiZap,
} from 'react-icons/fi'
import WidgetPreview from '@/app/landings/auth/chatWidget/components/WidgetPreview'
import '@/app/landings/auth/chatWidget/ChatWidget.css'
import './WidgetAdmin.css'
import { useAuth } from '@/context/AuthContext'
import { createChatWidget, deleteChatWidget, setActiveChatWidget, updateChatAssistantConfig, updateChatWidgetConfig } from '@/lib/auth.service'
import { getPlanLimits } from '@/lib/subscription'
import { parseAllowedDomainsInput } from '@/lib/widget-security'
import type { ChatAssistantConfig, ChatWidgetConfig } from '@/types/database'

const defaultAssistantConfig: ChatAssistantConfig = {
  enabled: true,
  provider: 'gemini',
  model: 'gemini-2.5-flash-lite',
  strictContextOnly: true,
  systemPrompt:
    'You are the company website assistant. Be helpful, concise, and honest.',
  businessContext: '',
  restrictions:
    'Do not invent company policies, prices, or guarantees that are not in the configured context.',
  supportTriggerKeywords: ['support', 'human', 'agent', 'contact'],
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
  | 'systemPrompt'
  | 'businessContext'
  | 'extraInstructions'
  | 'faqSuggestions'
  | 'startLanguage'
  | 'restrictions'
  | 'handoffMessage'

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactNode

function CollapsibleAiField({
  id,
  title,
  description,
  icon: Icon,
  openField,
  setOpenField,
  children,
}: {
  id: AiFieldId
  title: string
  description?: string
  icon: IconComponent
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
            <span className="widget-admin-field-accordion__icon">
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
          <FiChevronDown />
        </button>
      </div>

      {isOpen ? <div className="widget-admin-field-accordion__body">{children}</div> : null}
    </label>
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

export default function WidgetAdminPanel() {
  const { business, dbUser, loading, refreshBusiness } = useAuth()
  const [config, setConfig] = useState<ChatWidgetConfig | null>(null)
  const [assistantConfig, setAssistantConfig] = useState<ChatAssistantConfig>(defaultAssistantConfig)
  const [openAiField, setOpenAiField] = useState<AiFieldId | null>('systemPrompt')
  const [languageSearch, setLanguageSearch] = useState('')
  const [selectedWidgetKey, setSelectedWidgetKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [lastConfigUpdate, setLastConfigUpdate] = useState<string | null>(null)
  const [allowedDomainsText, setAllowedDomainsText] = useState('')
  const [domainsSaving, setDomainsSaving] = useState(false)
  const [domainsStatus, setDomainsStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [assistantSaving, setAssistantSaving] = useState(false)
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [deleteWidgetChecked, setDeleteWidgetChecked] = useState(false)
  const [widgetActionStatus, setWidgetActionStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [newWidgetName, setNewWidgetName] = useState('')

  const widgetList = business?.chatWidgets || []
  const currentPlan = (config?.plan || business?.chatWidgetConfig?.plan || widgetList[0]?.config?.plan || 'free') as ChatWidgetConfig['plan']
  const widgetLimit = getPlanLimits(currentPlan).maxWidgets

  const applyWidgetConfig = (widgetConfig: ChatWidgetConfig | undefined) => {
    if (!widgetConfig) return
    setConfig(widgetConfig)
    setAllowedDomainsText(
      Array.isArray(widgetConfig.allowedDomains) ? widgetConfig.allowedDomains.join('\n') : ''
    )
    setLastConfigUpdate(JSON.stringify(widgetConfig))
  }

  useEffect(() => {
    const widget =
      widgetList.find((entry) => entry.widgetKey === selectedWidgetKey) ||
      widgetList.find((entry) => entry.widgetKey === business?.activeChatWidgetKey) ||
      widgetList[0]

    if (widget?.config) {
      setSelectedWidgetKey(widget.widgetKey)
      applyWidgetConfig(widget.config)
    } else if (business?.chatWidgetConfig) {
      setConfig(business.chatWidgetConfig as ChatWidgetConfig)
      setLastConfigUpdate(JSON.stringify(business.chatWidgetConfig))
      setAllowedDomainsText(
        Array.isArray(business.chatWidgetConfig.allowedDomains)
          ? business.chatWidgetConfig.allowedDomains.join('\n')
          : ''
      )
      setSelectedWidgetKey(business.activeChatWidgetKey || business.chatWidgetKey || '')
    }

    if (business?.chatAssistantConfig) {
      setAssistantConfig({
        ...defaultAssistantConfig,
        ...(business.chatAssistantConfig as ChatAssistantConfig),
      })
    }
  }, [business, widgetList, selectedWidgetKey])

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
    setDeleteWidgetChecked(false)
    applyWidgetConfig(nextWidget.config)
    await setActiveChatWidget(dbUser.businessId, nextWidgetKey)
    await refreshBusiness()
  }

  const handleCreateWidget = async () => {
    if (!dbUser?.businessId) return

    setWidgetActionStatus('idle')
    const result = await createChatWidget(
      dbUser.businessId,
      newWidgetName.trim() || undefined,
      selectedWidgetKey || business?.activeChatWidgetKey || business?.chatWidgetKey || undefined
    )

    if (!result.success || !result.widgetKey) {
      setWidgetActionStatus('error')
      return
    }

    setWidgetActionStatus('saved')
    setNewWidgetName('')
    setSelectedWidgetKey(result.widgetKey)
    await refreshBusiness()
    setTimeout(() => setWidgetActionStatus('idle'), 2000)
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
    setWidgetActionStatus('saved')
    await refreshBusiness()
    setTimeout(() => setWidgetActionStatus('idle'), 2000)
  }

  const saveAssistantConfig = async () => {
    if (!dbUser?.businessId) return

    setAssistantSaving(true)
    setAssistantStatus('idle')

    const result = await updateChatAssistantConfig(dbUser.businessId, assistantConfig)

    setAssistantSaving(false)
    setAssistantStatus(result.success ? 'saved' : 'error')

    if (result.success) {
      void refreshBusiness()
      setTimeout(() => setAssistantStatus('idle'), 2000)
    }
  }

  const saveAllowedDomains = async () => {
    if (!dbUser?.businessId) return

    setDomainsSaving(true)
    setDomainsStatus('idle')

    const parsedDomains = parseAllowedDomainsInput(allowedDomainsText)
    const nextConfig = {
      ...(config || {}),
      allowedDomains: parsedDomains,
    } as Partial<ChatWidgetConfig>
    const result = await updateChatWidgetConfig(dbUser.businessId, {
      ...nextConfig,
    }, selectedWidgetKey || undefined)

    setDomainsSaving(false)
    setDomainsStatus(result.success ? 'saved' : 'error')

    if (result.success) {
      setConfig((prev) => (prev ? { ...prev, allowedDomains: parsedDomains } : ({ ...nextConfig } as ChatWidgetConfig)))
      setAllowedDomainsText(parsedDomains.join('\n'))
      if (typeof window !== 'undefined') {
        const storageKey = `widget-config-${dbUser.businessId}`
        const nextConfigPayload = JSON.stringify(nextConfig)
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
              onClick={() => void handleCreateWidget()}
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
              type="text"
              value={newWidgetName}
              onChange={(event) => setNewWidgetName(event.target.value)}
              placeholder="Homepage widget, Support widget, Footer widget..."
            />
          </label>

          <label className="widget-admin-field">
            <span>Select widget</span>
            <select
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
              <FiCopy />
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
            <span className="widget-admin-section-label">AI settings</span>
            <button
              type="button"
              className="widget-admin-save-button"
              onClick={saveAssistantConfig}
              disabled={assistantSaving}
            >
              {assistantSaving
                ? 'Saving...'
                : assistantStatus === 'saved'
                  ? 'Saved!'
                  : 'Save AI settings'}
            </button>
          </div>

          <p className="widget-card-desc">
            Configure how the assistant answers, what context it may use, and when a chat should be flagged for human support.
          </p>

          <div className="widget-ai-grid widget-ai-grid--top">
            <label className="widget-ai-field widget-ai-toggle">
              <span><FiCpu /> Enable AI replies</span>
              <input
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
              <span><FiShield /> Strict context only</span>
              <input
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
              <span><FiGlobe /> Reply in user language</span>
              <input
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
              <span><FiHelpCircle /> FAQ suggestions</span>
              <input
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
              <span><FiBriefcase /> Provider</span>
              <input type="text" value={assistantConfig.provider} disabled />
            </label>

            <label className="widget-ai-field">
              <span><FiMessageSquare /> Model</span>
              <div className="widget-ai-readonly">
                <strong>{assistantConfig.model || 'gemini-2.5-flash-lite'}</strong>
                <span>Managed from Vintra Admin</span>
              </div>
            </label>
          </div>

          <div className="widget-admin-field-accordion-stack">
            <CollapsibleAiField
              id="startLanguage"
              title="Start language"
              description="Choose the first language the assistant should use."
              icon={FiGlobe}
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <label className="widget-ai-field widget-ai-field-full">
                <span>
                  <FiSearch />
                  Search language
                </span>
                <input
                  type="text"
                  value={languageSearch}
                  onChange={(event) => setLanguageSearch(event.target.value)}
                  placeholder="Search English, Norwegian, Spanish, Korean..."
                />
              </label>

              <div className="widget-language-grid">
                {filteredLanguageOptions.map((option) => {
                  const isActive = assistantConfig.startLanguage === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`widget-language-button ${isActive ? 'active' : ''}`}
                      onClick={() =>
                        setAssistantConfig((prev) => ({
                          ...prev,
                          startLanguage: option.value,
                        }))
                      }
                    >
                      <strong>{option.label}</strong>
                      <span>{isActive ? 'Selected' : 'Use this language'}</span>
                    </button>
                  )
                })}
              </div>

              <p className="field-note">
                When <strong>Reply in user language</strong> is on, this language is used for the first answer and then the assistant switches to the user's language.
              </p>
            </CollapsibleAiField>

            <CollapsibleAiField
              id="systemPrompt"
              title="System prompt"
              description="Guide for how the assistant should behave."
              icon={FiCpu}
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <AutoGrowTextarea
                value={assistantConfig.systemPrompt}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    systemPrompt: event.target.value,
                  }))
                }
                minRows={5}
              />
            </CollapsibleAiField>

            <CollapsibleAiField
              id="businessContext"
              title="Business context"
              description="Facts, services, and company details."
              icon={FiBriefcase}
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <AutoGrowTextarea
                value={assistantConfig.businessContext}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    businessContext: event.target.value,
                  }))
                }
                minRows={6}
                placeholder="Products, opening hours, services, refund policy, contact info, FAQs..."
              />
            </CollapsibleAiField>

            <CollapsibleAiField
              id="extraInstructions"
              title="Extra instructions"
              description="Optional style notes and guardrails."
              icon={FiZap}
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <AutoGrowTextarea
                value={assistantConfig.extraInstructions}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    extraInstructions: event.target.value,
                  }))
                }
                minRows={3}
                placeholder="Optional guardrails, style notes, or support routing instructions."
              />
            </CollapsibleAiField>

            <CollapsibleAiField
              id="faqSuggestions"
              title="FAQ suggestions"
              description="Suggested questions shown above the chat input."
              icon={FiHelpCircle}
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <AutoGrowTextarea
                value={assistantConfig.faqSuggestions.join('\n')}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    faqSuggestions: event.target.value
                      .split(/\n|,/) 
                      .map((entry) => entry.trim())
                      .filter(Boolean),
                  }))
                }
                minRows={4}
                placeholder={'What are your opening hours?\nHow do I contact support?\nWhat services do you offer?'}
              />
            </CollapsibleAiField>

            <CollapsibleAiField
              id="restrictions"
              title="Restrictions"
              description="Topics and rules the assistant should avoid."
              icon={FiShield}
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <AutoGrowTextarea
                value={assistantConfig.restrictions}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    restrictions: event.target.value,
                  }))
                }
                minRows={4}
                placeholder="Topics the AI should avoid or rules it must follow."
              />
            </CollapsibleAiField>

            <CollapsibleAiField
              id="handoffMessage"
              title="Human handoff message"
              description="What users see when support is handed off."
              icon={FiMessageSquare}
              openField={openAiField}
              setOpenField={setOpenAiField}
            >
              <AutoGrowTextarea
                value={assistantConfig.handoffMessage}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    handoffMessage: event.target.value,
                  }))
                }
                minRows={3}
              />
            </CollapsibleAiField>
          </div>
        </section>
      </div>
    </div>
  )
}

