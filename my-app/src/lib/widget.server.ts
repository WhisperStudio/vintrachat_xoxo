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
  const widgetSnap = await adminDb
    .collectionGroup('chatWidgets')
    .where('widgetKey', '==', widgetKey)
    .limit(1)
    .get()

  if (!widgetSnap.empty) {
    const widgetDoc = widgetSnap.docs[0]
    const widgetData = widgetDoc.data()
    const businessDoc = widgetDoc.ref.parent.parent

    if (businessDoc) {
      const businessSnap = await businessDoc.get()
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
  }

  const legacySnap = await adminDb
    .collection('businesses')
    .where('chatWidgetKey', '==', widgetKey)
    .limit(1)
    .get()

  if (legacySnap.empty) {
    return null
  }

  const doc = legacySnap.docs[0]
  const data = doc.data()

  return {
    id: doc.id,
    name: data.name,
    chatWidgetKey: data.chatWidgetKey,
    chatWidgetConfig: data.chatWidgetConfig,
    chatAssistantConfig: data.chatAssistantConfig,
    chatAnalytics: data.chatAnalytics,
    chatWidgetEmbedSecret: data.chatWidgetEmbedSecret,
  }
}
