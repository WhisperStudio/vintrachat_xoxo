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
  chatWidgetConfig?: ChatWidgetConfig
  chatAssistantConfig?: ChatAssistantConfig
  chatAnalytics?: ChatAnalytics
  chatWidgetEmbedSecret?: string
}

export async function getBusinessByWidgetKey(
  widgetKey: string
): Promise<WidgetBusinessRecord | null> {
  const snap = await adminDb
    .collection('businesses')
    .where('chatWidgetKey', '==', widgetKey)
    .limit(1)
    .get()

  if (snap.empty) {
    return null
  }

  const doc = snap.docs[0]
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
