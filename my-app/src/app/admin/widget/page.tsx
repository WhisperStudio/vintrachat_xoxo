'use client'

import { useEffect, useState } from 'react'
import { FiCopy, FiCode, FiLayout, FiCreditCard, FiMapPin } from 'react-icons/fi'
import WidgetPreview from '@/app/landings/auth/chatWidget/components/WidgetPreview'
import './WidgetAdmin.css'
import { useAuth } from '@/context/AuthContext'
import { updateChatAssistantConfig } from '@/lib/auth.service'
import type { ChatAssistantConfig, ChatWidgetConfig } from '@/types/database'

const defaultAssistantConfig: ChatAssistantConfig = {
  enabled: true,
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  strictContextOnly: true,
  systemPrompt:
    'You are the company website assistant. Be helpful, concise, and honest.',
  businessContext: '',
  restrictions:
    'Do not invent company policies, prices, or guarantees that are not in the configured context.',
  supportTriggerKeywords: ['support', 'human', 'agent', 'contact'],
  handoffMessage:
    'I will flag this conversation for human follow-up so the team can contact you.',
}

export default function WidgetAdminPanel() {
  const { business, dbUser, loading } = useAuth()
  const [config, setConfig] = useState<ChatWidgetConfig | null>(null)
  const [assistantConfig, setAssistantConfig] =
    useState<ChatAssistantConfig>(defaultAssistantConfig)
  const [copied, setCopied] = useState(false)
  const [assistantSaving, setAssistantSaving] = useState(false)
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (business?.chatWidgetConfig) {
      setConfig(business.chatWidgetConfig as ChatWidgetConfig)
    }
    if (business?.chatAssistantConfig) {
      setAssistantConfig({
        ...defaultAssistantConfig,
        ...business.chatAssistantConfig,
      })
    }
  }, [business])

  const handleCopy = async () => {
    if (!business?.chatWidgetKey) return

    const code = `<!-- Chat Widget -->
<script src="${process.env.NEXT_PUBLIC_APP_URL}/widget/${business.chatWidgetKey}.js"></script>
<!-- End Chat Widget -->`

    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const saveAssistantConfig = async () => {
    if (!dbUser?.businessId) return

    setAssistantSaving(true)
    setAssistantStatus('idle')

    const result = await updateChatAssistantConfig(dbUser.businessId, assistantConfig)

    setAssistantSaving(false)
    setAssistantStatus(result.success ? 'saved' : 'error')

    if (result.success) {
      setTimeout(() => setAssistantStatus('idle'), 2000)
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

  if (!config) {
    return (
      <div className="widget-admin-empty">
        <h2>Ingen widget-konfigurasjon</h2>
        <p>Du har ikke satt opp en widget ennå.</p>
      </div>
    )
  }

  const embedCode = `<!-- Chat Widget -->
<script src="${process.env.NEXT_PUBLIC_APP_URL}/widget/${business.chatWidgetKey}.js"></script>
<!-- End Chat Widget -->`

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

      <div className="widget-admin-grid">
        <section className="widget-admin-card widget-admin-overview">
          <h3>Widget Overview</h3>

          <div className="widget-stat-grid">
            <div className="widget-stat">
              <div className="widget-stat-icon">
                <FiCreditCard />
              </div>
              <div>
                <strong>{config.plan}</strong>
                <span>Plan</span>
              </div>
            </div>

            <div className="widget-stat">
              <div className="widget-stat-icon">
                <FiLayout />
              </div>
              <div>
                <strong>{config.colorTheme}</strong>
                <span>Theme</span>
              </div>
            </div>

            <div className="widget-stat">
              <div className="widget-stat-icon">
                <FiMapPin />
              </div>
              <div>
                <strong>{config.position}</strong>
                <span>Position</span>
              </div>
            </div>

            <div className="widget-stat">
              <div className="widget-stat-icon">
                <FiCode />
              </div>
              <div>
                <strong>{config.billingCycle}</strong>
                <span>Billing cycle</span>
              </div>
            </div>
          </div>

          <div className="widget-key-box">
            <span className="widget-key-label">Widget key</span>
            <code>{business.chatWidgetKey}</code>
          </div>
        </section>

        <section className="widget-admin-card widget-admin-preview">
          <div className="widget-card-header">
            <h3>Live Preview</h3>
            <span className="widget-preview-tag">Interactive</span>
          </div>

          <div className="widget-preview-stage">
            <WidgetPreview
              bubbleStyle={config.bubbleStyle}
              headerStyle={config.headerStyle}
              bodyStyle={config.bodyStyle}
              footerStyle={config.footerStyle}
              position={config.position}
              colorTheme={config.colorTheme}
              customBranding={config.customBranding}
              initialOpen={true}
              variant="embedded"
              enablePreviewChat={true}
              previewReply="hi, this is only a test"
            />
          </div>
        </section>

        <section className="widget-admin-card widget-admin-code">
          <div className="widget-card-header">
            <h3>Embed Code</h3>
            <button type="button" className="copy-btn" onClick={handleCopy}>
              <FiCopy />
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>

          <p className="widget-card-desc">
            Lim inn denne koden på nettsiden din for å laste inn widgeten.
          </p>

          <div className="widget-code-block">
            <code>{embedCode}</code>
          </div>
        </section>

        <section className="widget-admin-card widget-admin-branding">
          <h3>Branding</h3>

          <div className="widget-detail-list">
            <div className="widget-detail-row">
              <span>Tittel</span>
              <strong>{config.customBranding?.title || 'Support Chat'}</strong>
            </div>
            <div className="widget-detail-row">
              <span>Beskrivelse</span>
              <strong>
                {config.customBranding?.description || 'Usually replies in a few minutes'}
              </strong>
            </div>
            <div className="widget-detail-row">
              <span>Auto-open</span>
              <strong>{config.settings?.autoOpen ? 'Enabled' : 'Disabled'}</strong>
            </div>
            <div className="widget-detail-row">
              <span>Delay</span>
              <strong>{config.settings?.delayMs || 3000} ms</strong>
            </div>
          </div>
        </section>

        <section className="widget-admin-card widget-admin-ai">
          <div className="widget-card-header">
            <h3>AI Assistant</h3>
            <button
              type="button"
              className="copy-btn"
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
            Configure how the assistant answers, what context it may use, and when a
            chat should be flagged for human support.
          </p>

          <div className="widget-ai-grid">
            <label className="widget-ai-field widget-ai-toggle">
              <span>Enable AI replies</span>
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
              <span>Strict context only</span>
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

            <label className="widget-ai-field">
              <span>Provider</span>
              <input type="text" value={assistantConfig.provider} disabled />
            </label>

            <label className="widget-ai-field">
              <span>Gemini model</span>
              <input
                type="text"
                value={assistantConfig.model}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    model: event.target.value,
                  }))
                }
                placeholder="gemini-2.0-flash"
              />
            </label>

            <label className="widget-ai-field widget-ai-field-full">
              <span>System prompt</span>
              <textarea
                value={assistantConfig.systemPrompt}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    systemPrompt: event.target.value,
                  }))
                }
                rows={4}
              />
            </label>

            <label className="widget-ai-field widget-ai-field-full">
              <span>Business context</span>
              <textarea
                value={assistantConfig.businessContext}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    businessContext: event.target.value,
                  }))
                }
                rows={6}
                placeholder="Products, opening hours, services, refund policy, contact info, FAQs..."
              />
            </label>

            <label className="widget-ai-field widget-ai-field-full">
              <span>Restrictions</span>
              <textarea
                value={assistantConfig.restrictions}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    restrictions: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Topics the AI should avoid or rules it must follow."
              />
            </label>

            <label className="widget-ai-field widget-ai-field-full">
              <span>Support trigger keywords</span>
              <input
                type="text"
                value={assistantConfig.supportTriggerKeywords.join(', ')}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    supportTriggerKeywords: event.target.value
                      .split(',')
                      .map((value) => value.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="support, human, contact, call me"
              />
            </label>

            <label className="widget-ai-field widget-ai-field-full">
              <span>Human handoff message</span>
              <textarea
                value={assistantConfig.handoffMessage}
                onChange={(event) =>
                  setAssistantConfig((prev) => ({
                    ...prev,
                    handoffMessage: event.target.value,
                  }))
                }
                rows={3}
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}
