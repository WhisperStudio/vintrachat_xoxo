import { adminDb } from '@/lib/firebase-admin'
import type {
  ChatAnalytics,
  ChatAssistantConfig,
  ChatWidgetConfig,
} from '@/types/database'

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

      return {
        id: businessDoc.id,
        name: String(businessData.name || ''),
        chatWidgetKey: String(widgetData.widgetKey || widgetDoc.id),
        chatWidgetName: String(widgetData.name || 'Chat Widget'),
        chatWidgetConfig: widgetData.config || businessData.chatWidgetConfig,
        chatAssistantConfig: businessData.chatAssistantConfig,
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
        chatWidgetConfig: businessData.chatWidgetConfig,
        chatAssistantConfig: businessData.chatAssistantConfig,
        chatAnalytics: businessData.chatAnalytics,
        chatWidgetEmbedSecret: businessData.chatWidgetEmbedSecret,
      }
    }
  }

  return null
}
