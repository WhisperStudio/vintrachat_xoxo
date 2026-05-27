import { adminDb } from '@/lib/firebase-admin'
import type {
  ChatAnalytics,
  ChatAssistantConfig,
  ChatWidgetConfig,
} from '@/types/database'
import { getEffectiveBusinessPlan, sanitizeChatWidgetConfigForPlan } from '@/lib/subscription'

const launcherIconChoiceMap: Record<string, string> = {
  chat: 'FiMessageCircle',
  phone: 'FiPhone',
  cpu: 'FiCpu',
  message: 'FiMessageSquare',
  support: 'FiLifeBuoy',
}

function buildDefaultWidgetConfig(businessName = 'Chat Widget'): ChatWidgetConfig {
  return {
    plan: 'free',
    billingCycle: 'monthly',
    colorTheme: 'modern',
    appearance: {
      glassLookEnabled: false,
    },
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
    settings: {
      autoOpen: false,
      delayMs: 3000,
    },
    allowedDomains: [],
  }
}

function mergeWidgetConfig(
  config: Partial<ChatWidgetConfig> | undefined,
  businessName: string,
  enforcedPlan?: ChatWidgetConfig['plan']
): ChatWidgetConfig {
  const defaults = buildDefaultWidgetConfig(businessName)

  if (!config) return sanitizeChatWidgetConfigForPlan(defaults, enforcedPlan || defaults.plan)

  const mergedConfig: ChatWidgetConfig = {
    ...defaults,
    ...config,
    plan: enforcedPlan || config.plan || defaults.plan,
    allowedDomains: Array.isArray(config.allowedDomains)
      ? config.allowedDomains
      : defaults.allowedDomains,
    appearance: {
      ...defaults.appearance,
      ...(config.appearance || {}),
    },
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
    widgetIcons: {
      ...(defaults.widgetIcons || {}),
      ...(config.widgetIcons || {}),
      launcherIcon:
        config.widgetIcons?.launcherIcon ||
        launcherIconChoiceMap[String(config.bubbleStyle?.iconChoice || '')] ||
        defaults.widgetIcons?.launcherIcon,
    },
  }

  return sanitizeChatWidgetConfigForPlan(mergedConfig, enforcedPlan || mergedConfig.plan)
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
      const enforcedPlan = getEffectiveBusinessPlan(
        {
          chatWidgetConfig: businessData.chatWidgetConfig,
          chatWidgets: [{
            id: widgetDoc.id,
            widgetKey: String(widgetData.widgetKey || widgetDoc.id),
            name: String(widgetData.name || 'Chat Widget'),
            config: widgetData.config,
            isDefault: isDefaultWidget,
            createdAt: new Date(),
            updatedAt: new Date(),
          }],
          activeChatWidgetKey: String(businessData.activeChatWidgetKey || businessData.chatWidgetKey || ''),
        },
        widgetData.config
      )

        return {
          id: businessDoc.id,
          name: String(businessData.name || ''),
          chatWidgetKey: String(widgetData.widgetKey || widgetDoc.id),
          chatWidgetName: String(widgetData.name || 'Chat Widget'),
          chatWidgetConfig: mergeWidgetConfig(
            widgetData.config || businessData.chatWidgetConfig,
            String(businessData.name || widgetData.name || 'Chat Widget'),
            enforcedPlan
          ),
          chatAssistantConfig:
            widgetData.assistantConfig ||
            businessData.chatAssistantConfig ||
            undefined,
          chatAnalytics: businessData.chatAnalytics,
          chatWidgetEmbedSecret: businessData.chatWidgetEmbedSecret,
        }
    }

    const businessData = businessDoc.data() || {}
    if (String(businessData.chatWidgetKey || '') === widgetKey) {
      const enforcedPlan = getEffectiveBusinessPlan(
        { chatWidgetConfig: businessData.chatWidgetConfig },
        businessData.chatWidgetConfig
      )

      return {
        id: businessDoc.id,
        name: String(businessData.name || ''),
        chatWidgetKey: String(businessData.chatWidgetKey || widgetKey),
        chatWidgetConfig: mergeWidgetConfig(
          businessData.chatWidgetConfig,
          String(businessData.name || 'Chat Widget'),
          enforcedPlan
        ),
        chatAssistantConfig: businessData.chatAssistantConfig,
        chatAnalytics: businessData.chatAnalytics,
        chatWidgetEmbedSecret: businessData.chatWidgetEmbedSecret,
      }
    }
  }

  return null
}
