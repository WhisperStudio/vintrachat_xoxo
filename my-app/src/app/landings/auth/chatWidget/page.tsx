'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiCreditCard, FiRefreshCw, FiSave, FiSliders } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { updateChatWidgetConfig } from '@/lib/auth.service'
import './ChatWidget.css'

import PlanSelector from './components/PlanSelector'
import StyleSelector from './components/StyleSelector'
import WidgetPreview from './components/WidgetPreview'
import PricingPanel from './components/PricingPanel'

type Plan = 'free' | 'pro' | 'business'
type BillingCycle = 'monthly' | 'yearly'
type ColorTheme = 'modern' | 'chilling' | 'corporate' | 'luxury'
type Position = 'bottom-right' | 'bottom-left'

type InputsState = {
  plan: Plan
  billingCycle: BillingCycle
  colorTheme: ColorTheme
  position: Position
  bubbleStyle: {
    showStatus: boolean
    iconChoice: 'chat' | 'phone' | 'cpu' | 'message' | 'support'
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    animationType: 'none' | 'bounce' | 'fade' | 'slide'
    sizeType: 'small' | 'medium' | 'large'
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
  position: 'bottom-right',
  bubbleStyle: {
    showStatus: true,
    iconChoice: 'chat',
    borderType: 'rounded',
    shadowType: 'medium',
    animationType: 'bounce',
    sizeType: 'medium',
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
  },
  settings: {
    autoOpen: false,
    delayMs: 3000,
  },
}

const planPrices: Record<Plan, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 29, yearly: 29 * 12 },
  business: { monthly: 59, yearly: 59 * 12 },
}

export default function ChatWidgetBuilderPage() {
  const router = useRouter()
  const { isAuthenticated, dbUser, business, loading, refreshBusiness } = useAuth()

  const [inputs, setInputs] = useState<InputsState>(defaultInputs)
  const [hasLoadedDbConfig, setHasLoadedDbConfig] = useState(false)

  const [openSections, setOpenSections] = useState({
    plan: false,
    bubble: false,
    header: false,
    body: false,
    footer: false,
    colorTheme: false,
    position: false,
    branding: false,
    advanced: false,
  })

  const [showBreakdown, setShowBreakdown] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [resetAnimating, setResetAnimating] = useState(false)

  const total = useMemo(
    () => planPrices[inputs.plan][inputs.billingCycle],
    [inputs.plan, inputs.billingCycle]
  )

  useEffect(() => {
    if (!isAuthenticated || !business?.chatWidgetConfig || hasLoadedDbConfig) return

    const config = business.chatWidgetConfig

    setInputs({
      plan: config.plan || defaultInputs.plan,
      billingCycle: config.billingCycle || defaultInputs.billingCycle,
      colorTheme: config.colorTheme || defaultInputs.colorTheme,
      position: config.position || defaultInputs.position,
      bubbleStyle: config.bubbleStyle || defaultInputs.bubbleStyle,
      headerStyle: config.headerStyle || defaultInputs.headerStyle,
      bodyStyle: config.bodyStyle || defaultInputs.bodyStyle,
      footerStyle: config.footerStyle || defaultInputs.footerStyle,
      customBranding: config.customBranding || defaultInputs.customBranding,
      settings: config.settings || defaultInputs.settings,
    })

    setHasLoadedDbConfig(true)
  }, [isAuthenticated, business, hasLoadedDbConfig])

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
        [section]: !prev[section],
      }
    })
  }

  const resetBuilder = () => {
    setInputs(defaultInputs)
    setSaveStatus('idle')
  }

  const handleReset = () => {
    setResetAnimating(true)
    resetBuilder()
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
        plan: inputs.plan,
        billingCycle: inputs.billingCycle,
        colorTheme: inputs.colorTheme,
        position: inputs.position,
        bubbleStyle: inputs.bubbleStyle,
        headerStyle: inputs.headerStyle,
        bodyStyle: inputs.bodyStyle,
        footerStyle: inputs.footerStyle,
        customBranding: inputs.customBranding,
        settings: inputs.settings,
      }

      const result = await updateChatWidgetConfig(dbUser.businessId, newConfig)

      if (result.success) {
        await refreshBusiness()

        // Send localStorage event for real-time updates in admin panel
        if (typeof window !== 'undefined') {
          const storageKey = `widget-config-${dbUser.businessId}`
          const payload = JSON.stringify(newConfig)
          localStorage.setItem(storageKey, payload)

          window.dispatchEvent(
            new CustomEvent('vintra-widget-config-updated', {
              detail: {
                businessId: dbUser.businessId,
                config: newConfig,
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
          <h1>Chat Widget Builder</h1>
          <p>
            Configure a simple chat widget preview. Choose a{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16a34a' }}>
              <FiCreditCard aria-hidden="true" />
              <span>subscription</span>
            </span>{' '}
            and customize the chat bubble, header, body and footer styles.
          </p>

          <p style={{ marginTop: 10 }}>
            Status:{' '}
            <strong>
              {isAuthenticated && dbUser ? 'Koblet til database ✅' : 'Preview mode for guests 👀'}
            </strong>
          </p>
        </section>

        <div className="chatbuilder-grid">
          <div className="builder-panel glass">
            <div className="panel-header">
              <h2 className="section-title">
                <FiSliders /> Configure widget
              </h2>

              <div className="panel-actions">
                {isAuthenticated && (
                  <div className="auto-save-indicator">
                    {isSaving && (
                      <span className="saving-status">
                        <FiRefreshCw className="spinning" /> Saving...
                      </span>
                    )}
                    {saveStatus === 'success' && (
                      <span className="saved-status">
                        <FiSave /> Saved
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="error-status">Save failed</span>
                    )}
                  </div>
                )}

                {isAuthenticated ? (
                  <button
                    className={`save-btn ${isSaving ? 'save-btn--saving' : ''} ${saveStatus === 'success' ? 'save-btn--success' : ''}`}
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
                    <span>{isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Configuration'}</span>
                  </button>
                ) : null}

                <button className="reset-btn" onClick={handleReset} type="button">
                  <span
                    className={`reset-btn-icon ${resetAnimating ? 'reset-btn-icon--spin' : ''}`}
                    onAnimationEnd={() => setResetAnimating(false)}
                  >
                    <FiRefreshCw />
                  </span>
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <PlanSelector
              plan={inputs.plan}
              billingCycle={inputs.billingCycle}
              onPlanChange={(plan) => updateInput('plan', plan)}
              onBillingCycleChange={(cycle) => updateInput('billingCycle', cycle)}
              isOpen={openSections.plan}
              onToggle={() => toggleSection('plan')}
            />

            <StyleSelector
              bubbleStyle={inputs.bubbleStyle}
              headerStyle={inputs.headerStyle}
              bodyStyle={inputs.bodyStyle}
              footerStyle={inputs.footerStyle}
              onBubbleStyleChange={(style) => updateInput('bubbleStyle', style)}
              onHeaderStyleChange={(style) => updateInput('headerStyle', style)}
              onBodyStyleChange={(style) => updateInput('bodyStyle', style)}
              onFooterStyleChange={(style) => updateInput('footerStyle', style)}
              colorTheme={inputs.colorTheme}
              position={inputs.position}
              customBranding={inputs.customBranding}
              settings={inputs.settings}
              onColorThemeChange={(theme) => updateInput('colorTheme', theme)}
              onPositionChange={(position) => updateInput('position', position)}
              onCustomBrandingChange={(branding) => updateInput('customBranding', branding)}
              onSettingsChange={(settings) => updateInput('settings', settings)}
              openSections={openSections}
              onToggleSection={toggleSection}
            />
          </div>

          <div className="preview-panel">
            <WidgetPreview
              bubbleStyle={inputs.bubbleStyle}
              headerStyle={inputs.headerStyle}
              bodyStyle={inputs.bodyStyle}
              footerStyle={inputs.footerStyle}
              position={inputs.position}
              colorTheme={inputs.colorTheme}
              customBranding={inputs.customBranding}
              enablePreviewChat={true}
              previewReply="hi, this is only a test"
            />

            <PricingPanel
              total={total}
              billingCycle={inputs.billingCycle}
              plan={inputs.plan}
              bubbleStyle={inputs.bubbleStyle}
              headerStyle={inputs.headerStyle}
              bodyStyle={inputs.bodyStyle}
              footerStyle={inputs.footerStyle}
              showBreakdown={showBreakdown}
              onToggleBreakdown={() => setShowBreakdown((prev) => !prev)}
              isAuthenticated={isAuthenticated}
              onContinue={() => router.push('/auth/login')}
              onSave={saveConfig}
              isSaving={isSaving}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
