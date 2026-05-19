import { adminDb } from '@/lib/firebase-admin'
import type {
  ChatAnalytics,
  ChatAssistantConfig,
  ChatWidgetConfig,
} from '@/types/database'

function buildDefaultWidgetConfig(businessName = 'Chat Widget'): ChatWidgetConfig {
  return {
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
      showConversationCards: true,
      conversationCardsLayout: 'grid',
      conversationCardsStyle: 'modern',
    },
    footerStyle: {
      showSendButton: true,
      borderType: 'none',
      shadowType: 'none',
      inputStyle: 'rounded',
      showPlaceholder: true,
    },
    customBranding: {
      title: businessName,
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
}

function mergeWidgetConfig(
  config: Partial<ChatWidgetConfig> | undefined,
  businessName: string
): ChatWidgetConfig {
  const defaults = buildDefaultWidgetConfig(businessName)

  if (!config) return defaults

  return {
    ...defaults,
    ...config,
    allowedDomains: Array.isArray(config.allowedDomains)
      ? config.allowedDomains
      : defaults.allowedDomains,
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

export interface WidgetBusinessRecord {
  id: string
  name: string
  chatWidgetKey: string
  chatWidgetName?: string
  chatWidgetConfig?: ChatWidgetConfig
  chatAssistantConfig?: ChatAssistantConfig
  chatAnalytics?: ChatAnalytics
  chatWidgetEmbedSecret?: string
}

export async function getBusinessByWidgetKey(
  widgetKey: string
): Promise<WidgetBusinessRecord | null> {
  const businessesSnap = await adminDb.collection('businesses').get()

  for (const businessDoc of businessesSnap.docs) {
    const widgetDoc = await businessDoc.ref.collection('chatWidgets').doc(widgetKey).get()

    if (widgetDoc.exists) {
      const widgetData = widgetDoc.data() || {}
      const businessSnap = await businessDoc.ref.get()
      const businessData = businessSnap.data() || {}
      const isDefaultWidget = Boolean(widgetData.isDefault)

        return {
          id: businessDoc.id,
          name: String(businessData.name || ''),
          chatWidgetKey: String(widgetData.widgetKey || widgetDoc.id),
          chatWidgetName: String(widgetData.name || 'Chat Widget'),
          chatWidgetConfig: mergeWidgetConfig(
            widgetData.config || businessData.chatWidgetConfig,
            String(businessData.name || widgetData.name || 'Chat Widget')
          ),
          chatAssistantConfig:
            widgetData.assistantConfig ||
            (isDefaultWidget ? businessData.chatAssistantConfig : undefined),
        chatAnalytics: businessData.chatAnalytics,
        chatWidgetEmbedSecret: businessData.chatWidgetEmbedSecret,
      }
    }

    const businessData = businessDoc.data() || {}
    if (String(businessData.chatWidgetKey || '') === widgetKey) {
      return {
        id: businessDoc.id,
        name: String(businessData.name || ''),
        chatWidgetKey: String(businessData.chatWidgetKey || widgetKey),
        chatWidgetConfig: mergeWidgetConfig(
          businessData.chatWidgetConfig,
          String(businessData.name || 'Chat Widget')
        ),
        chatAssistantConfig: businessData.chatAssistantConfig,
        chatAnalytics: businessData.chatAnalytics,
        chatWidgetEmbedSecret: businessData.chatWidgetEmbedSecret,
      }
    }
  }

  return null
}
