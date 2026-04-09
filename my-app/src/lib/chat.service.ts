import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  Business,
  ChatAnalytics,
  SupportChatMessage,
  SupportChatSession,
} from '@/types/database'

function toDate(value: any): Date {
  if (!value) return new Date()
  if (typeof value?.toDate === 'function') return value.toDate()
  return new Date(value)
}

function mapSupportMessage(message: any): SupportChatMessage {
  return {
    id: message.id || crypto.randomUUID(),
    role:
      message.role === 'assistant' ||
      message.role === 'support' ||
      message.role === 'system'
        ? message.role
        : 'user',
    text: message.text || '',
    createdAt: toDate(message.createdAt),
  }
}

function createSupportMessage(
  role: SupportChatMessage['role'],
  text: string
): Omit<SupportChatMessage, 'createdAt'> & { createdAt: Date } {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    createdAt: new Date(),
  }
}

export async function getSupportChats(businessId: string): Promise<SupportChatSession[]> {
  const chatsRef = collection(db, `businesses/${businessId}/supportChats`)
  const chatsQuery = query(chatsRef, orderBy('updatedAt', 'desc'))
  const snap = await getDocs(chatsQuery)

  return snap.docs.map((chatDoc) => {
    const data = chatDoc.data()

    return {
      id: chatDoc.id,
      businessId,
      widgetKey: data.widgetKey || '',
      sessionId: data.sessionId || chatDoc.id,
      status: data.status || 'needs-human',
      source: 'widget',
      preview: data.preview || '',
      pageTitle: data.pageTitle,
      pageUrl: data.pageUrl,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      supportRequestedAt: data.supportRequestedAt ? toDate(data.supportRequestedAt) : undefined,
      messageCount: Number(data.messageCount || 0),
      messages: Array.isArray(data.messages) ? data.messages.map(mapSupportMessage) : [],
    } as SupportChatSession
  })
}

export async function getBusinessChatAnalytics(
  businessId: string
): Promise<ChatAnalytics | null> {
  const businessRef = doc(db, 'businesses', businessId)
  const snap = await getDoc(businessRef)

  if (!snap.exists()) {
    return null
  }

  const data = snap.data() as Business
  const analytics = data.chatAnalytics

  if (!analytics) {
    return null
  }

  return {
    ...analytics,
    lastChatAt: analytics.lastChatAt ? toDate(analytics.lastChatAt) : undefined,
  }
}

export async function acceptSupportChat(businessId: string, chatId: string) {
  const chatRef = doc(db, `businesses/${businessId}/supportChats/${chatId}`)
  const systemMessage = createSupportMessage('system', 'The chat has been handed over to human support.')

  await updateDoc(chatRef, {
    status: 'open',
    updatedAt: serverTimestamp(),
    messageCount: increment(1),
    messages: arrayUnion(systemMessage),
  })
}

export async function returnSupportChatToAi(businessId: string, chatId: string) {
  const chatRef = doc(db, `businesses/${businessId}/supportChats/${chatId}`)
  const systemMessage = createSupportMessage(
    'system',
    'The chat has been returned to the AI assistant.'
  )

  await updateDoc(chatRef, {
    status: 'ai-active',
    updatedAt: serverTimestamp(),
    messageCount: increment(1),
    messages: arrayUnion(systemMessage),
  })
}

export async function sendSupportReply(
  businessId: string,
  chatId: string,
  text: string
) {
  const trimmed = text.trim()
  if (!trimmed) return

  const chatRef = doc(db, `businesses/${businessId}/supportChats/${chatId}`)
  const supportMessage = createSupportMessage('support', trimmed)

  await updateDoc(chatRef, {
    status: 'open',
    updatedAt: serverTimestamp(),
    messages: arrayUnion(supportMessage),
    messageCount: increment(1),
  })
}

export async function closeSupportChat(businessId: string, chatId: string) {
  const chatRef = doc(db, `businesses/${businessId}/supportChats/${chatId}`)
  await deleteDoc(chatRef)
}
