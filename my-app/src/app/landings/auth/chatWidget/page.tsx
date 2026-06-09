'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiCheck,
  FiCreditCard,
  FiDroplet,
  FiImage,
  FiLayout,
  FiMessageCircle,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSend,
  FiSliders,
  FiMonitor,
  FiSmartphone,
} from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createChatWidget, setActiveChatWidget, updateChatWidgetConfig } from '@/lib/auth.service'
import { defaultConversationCards } from '@/lib/conversation-cards'
import { chatWidgetBuilderExtraI18n, chatWidgetBuilderI18n, useVintraLanguage } from '@/lib/i18n'
import {
  getEffectiveBusinessPlan,
  getPlanLimits,
  isPlanFeatureAvailable,
  sanitizeBubbleStyleForPlan,
  sanitizeChatWidgetConfigForPlan,
} from '@/lib/subscription'
import type { BubbleIconChoice, ChatWidgetConfig, ChatWidgetInterfaceIcons, OrbStyleConfig } from '@/types/database'
import './ChatWidget.css'

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
    glassLookEnabled: boolean
  }
  position: Position
  widgetIcons: ChatWidgetInterfaceIcons
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
  settings: {
    autoOpen: boolean
    delayMs: number
  }
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
    animationType: 'bounce',
    sizeType: 'medium',
    orbStyle: defaultOrbStyle,
  },
  headerStyle: {
    showStatus: true,
    showCloseButton: true,
    borderType: 'solid',
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
    borderType: 'solid',
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
}

export default function ChatWidgetBuilderPage() {
  const router = useRouter()
  const { isAuthenticated, dbUser, business, loading, refreshBusiness } = useAuth()
  const { language } = useVintraLanguage()
  const t = chatWidgetBuilderI18n[language]
  const builderExtraText = chatWidgetBuilderExtraI18n[language]

  const [inputs, setInputs] = useState<InputsState>(defaultInputs)
  const [hasLoadedDbConfig, setHasLoadedDbConfig] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [selectedWidgetKey, setSelectedWidgetKey] = useState('')
  const builderPanelRef = useRef<HTMLDivElement | null>(null)

  const [openSections, setOpenSections] = useState({
    plan: true,
    bubble: false,
    header: false,
    body: false,
    footer: false,
    colorTheme: false,
    icons: false,
    branding: false,
    advanced: false,
  })

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
  const total = useMemo(
    () => builderExtraText.prices[databasePlan][inputs.billingCycle],
    [builderExtraText.prices, databasePlan, inputs.billingCycle]
  )
  const widgetLimit = getPlanLimits(databasePlan).maxWidgets
  const canCreateWidget = widgetLimit === null || widgetList.length < widgetLimit

  const applyWidgetConfig = (config: ChatWidgetConfig | undefined) => {
    if (!config) return

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
      headerStyle: config.headerStyle || defaultInputs.headerStyle,
      bodyStyle: {
        ...defaultInputs.bodyStyle,
        ...(config.bodyStyle || {}),
      },
      footerStyle: config.footerStyle || defaultInputs.footerStyle,
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
    })
  }

  useEffect(() => {
    if (!isAuthenticated || hasLoadedDbConfig) return

    const widget = selectedWidget
    const config = widget?.config || business?.chatWidgetConfig
    if (!config) return
    applyWidgetConfig(config)

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

  useEffect(() => {
    const syncHeaderCollapse = () => {
      const headerHeight = document.querySelector<HTMLElement>('header')?.offsetHeight ?? 96
      const panelTop = builderPanelRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      const shouldReleaseHeader = panelTop <= headerHeight + 8

      if (shouldReleaseHeader) {
        document.body.dataset.chatbuilderHeaderReleased = 'true'
      } else {
        delete document.body.dataset.chatbuilderHeaderReleased
      }
    }

    syncHeaderCollapse()
    window.addEventListener('scroll', syncHeaderCollapse, { passive: true })
    window.addEventListener('resize', syncHeaderCollapse)

    return () => {
      window.removeEventListener('scroll', syncHeaderCollapse)
      window.removeEventListener('resize', syncHeaderCollapse)
      delete document.body.dataset.chatbuilderHeaderReleased
    }
  }, [])

  const updateInput = <K extends keyof InputsState>(key: K, value: InputsState[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSection = (section: keyof typeof openSections) => {
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
  }

  const builderSections = [
    { key: 'plan', label: builderExtraText.sidebar.subscription, eyebrow: builderExtraText.sidebar.plan, icon: FiCreditCard },
    { key: 'bubble', label: builderExtraText.sidebar.chatButton, eyebrow: builderExtraText.sidebar.launcher, icon: FiMessageCircle },
    { key: 'header', label: builderExtraText.sidebar.chatTopBar, eyebrow: builderExtraText.sidebar.header, icon: FiLayout },
    { key: 'body', label: builderExtraText.sidebar.chatMessages, eyebrow: builderExtraText.sidebar.messages, icon: FiMessageSquare },
    { key: 'footer', label: builderExtraText.sidebar.messageBox, eyebrow: builderExtraText.sidebar.input, icon: FiSend },
    { key: 'colorTheme', label: builderExtraText.sidebar.colors, eyebrow: builderExtraText.sidebar.theme, icon: FiDroplet },
    { key: 'icons', label: builderExtraText.sidebar.icons, eyebrow: builderExtraText.sidebar.design, icon: FiMessageCircle },
    { key: 'branding', label: builderExtraText.sidebar.branding, eyebrow: builderExtraText.sidebar.brand, icon: FiImage },
    { key: 'advanced', label: builderExtraText.sidebar.behavior, eyebrow: builderExtraText.sidebar.rules, icon: FiSliders },
  ] as const

  const resetBuilder = () => {
    setInputs(defaultInputs)
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
    applyWidgetConfig(widget.config)

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

      const result = await updateChatWidgetConfig(dbUser.businessId, planSafeConfig, selectedWidgetKey || undefined)

      if (result.success) {
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

  if (loading) return null

  return (
    <div className="chatbuilder-page">
      <main className="chatbuilder-content">
        <section className="chatbuilder-hero">
          <h1>{t.heroTitle}</h1>
          <p>
            {t.heroBody}{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16a34a' }}>
              <FiCreditCard aria-hidden="true" />
              <span>{t.subscription}</span>
            </span>{' '}
            {t.heroBodyEnd}
          </p>

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

        </section>

        <div className="chatbuilder-grid">
          <div className="builder-panel glass" ref={builderPanelRef}>
            <div className="panel-header">
              <h2 className="section-title">
                <FiSliders /> {t.configureWidget}
              </h2>

              <div className="panel-actions">
                <div className="previewModeSwitcher" role="tablist" aria-label={t.previewDevice}>
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

                {isAuthenticated ? (
                  <button
                    className={`save-btn ${isSaving ? 'save-btn--saving' : ''} ${saveStatus === 'success' ? 'save-btn--success' : ''} ${saveStatus === 'error' ? 'save-btn--error' : ''}`}
                    onClick={saveConfig}
                    disabled={isSaving}
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
                ) : null}

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

            <div className="builder-layout">
              <nav className="builder-sidebar" aria-label="Widget builder sections">
                {builderSections.map((section) => {
                  const SectionIcon = section.icon
                  const active = openSections[section.key]

                  return (
                    <button
                      key={section.key}
                      type="button"
                      className={`builder-sidebar-button ${active ? 'active' : ''}`.trim()}
                      onClick={() => toggleSection(section.key)}
                      aria-current={active ? 'page' : undefined}
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

              <div className="builder-content-panel">
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
                  onColorThemeChange={(theme) => updateInput('colorTheme', theme)}
                  onAppearanceChange={(appearance) => updateInput('appearance', appearance)}
                  onPositionChange={(position) => updateInput('position', position)}
                  onWidgetIconsChange={(widgetIcons) => updateInput('widgetIcons', widgetIcons)}
                  onCustomBrandingChange={(branding) => updateInput('customBranding', branding)}
                  onSettingsChange={(settings) => updateInput('settings', settings)}
                  openSections={openSections}
                  onToggleSection={toggleSection}
                />
              </div>
            </div>
          </div>

          <div className="preview-panel">
            <WidgetPreview
              total={total}
              billingCycle={inputs.billingCycle}
              plan={databasePlan}
              bubbleStyle={inputs.bubbleStyle}
              headerStyle={inputs.headerStyle}
              bodyStyle={inputs.bodyStyle}
              footerStyle={inputs.footerStyle}
              position={inputs.position}
              colorTheme={inputs.colorTheme}
              appearance={inputs.appearance}
              customBranding={inputs.customBranding}
              assistantIcons={inputs.widgetIcons}
              enablePreviewChat={true}
              previewReply={t.previewReply}
              previewMode={previewMode}
              conversationCardsEnabled={true}
              conversationCardsLimit={defaultConversationCards.length}
              conversationCards={defaultConversationCards}
            />
          </div>
        </div>
      </main>
      <div className="chatbuilder-screen-guard" aria-hidden="true">
        <div className="chatbuilder-screen-guard__card">
          <div className="chatbuilder-screen-guard__emoji" aria-hidden="true">
            🙂
          </div>
          <h2>{t.desktopOnlyTitle}</h2>
          <p>{t.desktopOnlyBody}</p>
        </div>
      </div>
    </div>
  )
}
