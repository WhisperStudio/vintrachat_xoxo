'use client'

import { useMemo, useState, useEffect } from 'react'
import { FiRefreshCw, FiSliders, FiSave } from 'react-icons/fi'
import './ChatWidget.css'
import Header from '@/components/header'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { updateChatWidgetConfig } from '@/lib/auth.service'

// Import components
import PlanSelector from '@/app/landings/auth/chatWidget/components/PlanSelector'
import StyleSelector from '@/app/landings/auth/chatWidget/components/StyleSelector'
import WidgetPreview from '@/app/landings/auth/chatWidget/components/WidgetPreview'
import PricingPanel from '@/app/landings/auth/chatWidget/components/PricingPanel'

type Plan = 'free' | 'pro' | 'business'
type BillingCycle = 'monthly' | 'yearly'
type ColorTheme = 'modern' | 'chilling' | 'corporate' | 'luxury'
type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

type InputsState = {
  plan: Plan
  billingCycle: BillingCycle
  colorTheme: ColorTheme
  position: Position
  
  // Design options
  bubbleStyle: {
    showStatus: boolean
    showCloseButton: boolean
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
  
  // Custom branding and settings
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

const planPrices: Record<Plan, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 29, yearly: 29 * 12 },
  business: { monthly: 59, yearly: 59 * 12 },
}

export default function ChatWidgetBuilder() {
  const router = useRouter()
  const { isAuthenticated, dbUser, loading, business } = useAuth()
  
  const [inputs, setInputs] = useState<InputsState>({
    plan: 'pro',
    billingCycle: 'monthly',
    colorTheme: 'modern',
    position: 'bottom-right',
    
    // Design options with defaults
    bubbleStyle: {
      showStatus: true,
      showCloseButton: true,
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
    
    // Custom branding and settings
    customBranding: {
      title: 'Support Chat',
      description: 'We are here to help you!',
    },
    settings: {
      autoOpen: false,
      delayMs: 3000,
    },
  })

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

  const total = useMemo(() => planPrices[inputs.plan][inputs.billingCycle], [inputs.plan, inputs.billingCycle])

  // Save configuration to database
  const saveConfig = async () => {
    if (!dbUser?.businessId) return

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const result = await updateChatWidgetConfig(dbUser.businessId, {
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
      })
      
      if (result.success) {
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

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  // Load existing config from DB if available
  useEffect(() => {
    if (business?.chatWidgetConfig) {
      const config = business.chatWidgetConfig
      setInputs({
        plan: config.plan || 'pro',
        billingCycle: config.billingCycle || 'monthly',
        colorTheme: config.colorTheme || 'modern',
        position: config.position || 'bottom-right',
        bubbleStyle: config.bubbleStyle || {
          showStatus: true,
          showCloseButton: true,
          borderType: 'rounded',
          shadowType: 'medium',
          animationType: 'bounce',
          sizeType: 'medium',
        },
        headerStyle: config.headerStyle || {
          showStatus: true,
          showCloseButton: true,
          borderType: 'solid',
          shadowType: 'light',
          showAvatar: true,
          showTitle: true,
        },
        bodyStyle: config.bodyStyle || {
          borderType: 'none',
          shadowType: 'none',
          messageStyle: 'bubble',
          showTimestamps: true,
          showReadReceipts: false,
        },
        footerStyle: config.footerStyle || {
          showSendButton: true,
          borderType: 'solid',
          shadowType: 'light',
          inputStyle: 'rounded',
          showPlaceholder: true,
        },
        customBranding: config.customBranding || {
          title: 'Support Chat',
          description: 'We are here to help you!',
        },
        settings: config.settings || {
          autoOpen: false,
          delayMs: 3000,
        },
      })
    }
  }, [business])

  if (loading) return null
  if (!isAuthenticated) return null

  const updateInput = <K extends keyof InputsState>(key: K, value: InputsState[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => {
      // Close all sections first
      const allClosed = Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {} as typeof openSections)
      
      // Only open the clicked section
      return {
        ...allClosed,
        [section]: !prev[section]
      }
    })
  }

  const resetBuilder = () => {
    setInputs({
      plan: 'pro',
      billingCycle: 'monthly',
      colorTheme: 'modern',
      position: 'bottom-right',
      
      // Design options with defaults
      bubbleStyle: {
        showStatus: true,
        showCloseButton: true,
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
      
      // Custom branding and settings
      customBranding: {
        title: 'Support Chat',
        description: 'We are here to help you!',
      },
      settings: {
        autoOpen: false,
        delayMs: 3000,
      },
    })
  }

  return (
    <div className="chatbuilder-page">
      <Header />
      <main className="chatbuilder-content">
        <section className="chatbuilder-hero">
          <h1>Chat Widget Builder</h1>
          <p>
            Configure a simple chat widget preview. Choose a subscription and customize
            the chat bubble, header, body and footer styles.
          </p>

          <p style={{ marginTop: 10 }}>
            Status:{' '}
            <strong>
              {dbUser ? 'Koblet til database ✅' : 'Ingen databasekobling ❌'}
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
                </div>
                <button 
                  className="save-btn"
                  onClick={saveConfig}
                  disabled={isSaving}
                >
                  <FiSave />
                  {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Configuration'}
                </button>
                <button className="reset-btn" onClick={resetBuilder} type="button">
                  <FiRefreshCw /> Reset
                </button>
              </div>
            </div>

            {/* Plan Selector Component */}
            <PlanSelector
              plan={inputs.plan}
              billingCycle={inputs.billingCycle}
              onPlanChange={(plan) => updateInput('plan', plan)}
              onBillingCycleChange={(cycle) => updateInput('billingCycle', cycle)}
              isOpen={openSections.plan}
              onToggle={() => toggleSection('plan')}
            />

            {/* Style Selector Component */}
            <StyleSelector
              bubbleStyle={inputs.bubbleStyle}
              headerStyle={inputs.headerStyle}
              bodyStyle={inputs.bodyStyle}
              footerStyle={inputs.footerStyle}
              onBubbleStyleChange={(style) => updateInput('bubbleStyle', style)}
              onHeaderStyleChange={(style) => updateInput('headerStyle', style)}
              onBodyStyleChange={(style) => updateInput('bodyStyle', style)}
              onFooterStyleChange={(style) => updateInput('footerStyle', style)}
              
              // Advanced configs
              colorTheme={inputs.colorTheme}
              position={inputs.position}
              customBranding={inputs.customBranding}
              settings={inputs.settings}
              onColorThemeChange={(theme) => updateInput('colorTheme', theme)}
              onPositionChange={(pos) => updateInput('position', pos)}
              onCustomBrandingChange={(branding) => updateInput('customBranding', branding)}
              onSettingsChange={(settings) => updateInput('settings', settings)}
              
              openSections={openSections}
              onToggleSection={toggleSection}
            />
          </div>

          <div className="preview-panel">
            {/* Widget Preview Component */}
            <WidgetPreview
              bubbleStyle={inputs.bubbleStyle}
              headerStyle={inputs.headerStyle}
              bodyStyle={inputs.bodyStyle}
              footerStyle={inputs.footerStyle}
              position={inputs.position}
              colorTheme={inputs.colorTheme}
            />

            {/* Pricing Panel Component */}
            <PricingPanel
              total={total}
              billingCycle={inputs.billingCycle}
              plan={inputs.plan}
              bubbleStyle={inputs.bubbleStyle}
              headerStyle={inputs.headerStyle}
              bodyStyle={inputs.bodyStyle}
              footerStyle={inputs.footerStyle}
              showBreakdown={showBreakdown}
              onToggleBreakdown={() => setShowBreakdown(!showBreakdown)}
            />
          </div>
        </div>
      </main>
    </div>
  )
}