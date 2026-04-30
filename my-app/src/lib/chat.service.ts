import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  Business,
  BusinessFeedback,
  ChatAnalytics,
  ChatAnalyticsEvent,
  SupportChatMessage,
  SupportChatSession,
  SupportTaskComment,
  SupportTask,
  SupportTaskCategory,
  SupportTaskPriority,
  SupportTaskStatus,
} from '@/types/database'

const DEFAULT_SUPPORT_TASK_CATEGORIES: SupportTaskCategory[] = [
  'general',
  'security',
  'system',
  'billing',
  'account',
].map((name) => ({
  id: name,
  name: name.charAt(0).toUpperCase() + name.slice(1),
  default: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}))

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

function mapAnalyticsEvent(event: any): ChatAnalyticsEvent {
  return {
    id: String(event.id || crypto.randomUUID()),
    kind: event.kind || 'visitor-message',
    sessionId: String(event.sessionId || ''),
    countryCode: event.countryCode || undefined,
    createdAt: toDate(event.createdAt),
  }
}

function mapFeedbackEntry(entry: any): BusinessFeedback {
  const rawRating = Number(entry.rating || 0)
  return {
    id: String(entry.id || crypto.randomUUID()),
    businessId: String(entry.businessId || ''),
    sessionId: entry.sessionId || undefined,
    widgetKey: entry.widgetKey || undefined,
    visitorName: entry.visitorName || undefined,
    rating: Number.isFinite(rawRating) ? Math.max(1, Math.min(5, rawRating)) : 0,
    text: String(entry.text || ''),
    pageTitle: entry.pageTitle || undefined,
    pageUrl: entry.pageUrl || undefined,
    countryCode: entry.countryCode || undefined,
    source: entry.source === 'widget' ? 'widget' : 'widget',
    createdAt: toDate(entry.createdAt),
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

function createAnalyticsEvent(
  kind: ChatAnalyticsEvent['kind'],
  sessionId: string,
  countryCode?: string
): ChatAnalyticsEvent {
  return {
    id: crypto.randomUUID(),
    kind,
    sessionId,
    countryCode,
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
      visitorName: data.visitorName,
      countryCode: data.countryCode,
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
    countryCounts: analytics.countryCounts || {},
    timeline: Array.isArray(analytics.timeline) ? analytics.timeline.map(mapAnalyticsEvent) : [],
    lastChatAt: analytics.lastChatAt ? toDate(analytics.lastChatAt) : undefined,
  }
}

export async function acceptSupportChat(businessId: string, chatId: string) {
  const chatRef = doc(db, `businesses/${businessId}/supportChats/${chatId}`)
  const businessRef = doc(db, 'businesses', businessId)
  const systemMessage = createSupportMessage('system', 'The chat has been handed over to human support.')
  const analyticsEvent = createAnalyticsEvent('support-open', chatId)

  await updateDoc(chatRef, {
    status: 'open',
    updatedAt: serverTimestamp(),
    messageCount: increment(1),
    messages: arrayUnion(systemMessage),
  })

  await updateDoc(businessRef, {
    'chatAnalytics.timeline': arrayUnion(analyticsEvent),
    updatedAt: serverTimestamp(),
  })
}

export async function returnSupportChatToAi(businessId: string, chatId: string) {
  const chatRef = doc(db, `businesses/${businessId}/supportChats/${chatId}`)
  const businessRef = doc(db, 'businesses', businessId)
  const systemMessage = createSupportMessage(
    'system',
    'The chat has been returned to the AI assistant.'
  )
  const analyticsEvent = createAnalyticsEvent('support-returned', chatId)

  await updateDoc(chatRef, {
    status: 'ai-active',
    updatedAt: serverTimestamp(),
    messageCount: increment(1),
    messages: arrayUnion(systemMessage),
  })

  await updateDoc(businessRef, {
    'chatAnalytics.timeline': arrayUnion(analyticsEvent),
    updatedAt: serverTimestamp(),
  })
}

export async function sendSupportReply(
  businessId: string,
  chatId: string,
  text: string,
  countryCode?: string
) {
  const trimmed = text.trim()
  if (!trimmed) return

  const chatRef = doc(db, `businesses/${businessId}/supportChats/${chatId}`)
  const businessRef = doc(db, 'businesses', businessId)
  const supportMessage = createSupportMessage('support', trimmed)
  const analyticsEvent = createAnalyticsEvent('support-message', chatId, countryCode)

  await updateDoc(chatRef, {
    status: 'open',
    updatedAt: serverTimestamp(),
    messages: arrayUnion(supportMessage),
    messageCount: increment(1),
  })

  await updateDoc(businessRef, {
    'chatAnalytics.timeline': arrayUnion(analyticsEvent),
    'chatAnalytics.totalMessages': increment(1),
    updatedAt: serverTimestamp(),
  })
}

export async function closeSupportChat(businessId: string, chatId: string) {
  const chatRef = doc(db, `businesses/${businessId}/supportChats/${chatId}`)
  await deleteDoc(chatRef)
}

function mapTaskCategory(category: any): SupportTaskCategory {
  return {
    id: String(category.id || crypto.randomUUID()),
    name: String(category.name || 'General'),
    default: Boolean(category.default),
    createdAt: toDate(category.createdAt),
    updatedAt: toDate(category.updatedAt),
  }
}

function mapTask(task: any): SupportTask {
  return {
    id: task.id || crypto.randomUUID(),
    businessId: String(task.businessId || ''),
    chatId: task.chatId || task.sourceChatId || undefined,
    sessionId: task.sessionId || task.sourceChatId || undefined,
    visitorName: task.visitorName || undefined,
    title: String(task.title || ''),
    description: String(task.description || ''),
    categoryId: String(task.categoryId || 'general'),
    categoryName: String(task.categoryName || 'General'),
    priority: (task.priority || 'medium') as SupportTaskPriority,
    status: (task.status || 'open') as SupportTaskStatus,
    createdAt: toDate(task.createdAt),
    updatedAt: toDate(task.updatedAt),
    createdBy: task.createdBy || undefined,
    chatMessages: Array.isArray(task.chatMessages) ? task.chatMessages.map(mapSupportMessage) : [],
    chatPreview: task.chatPreview || undefined,
    chatPageTitle: task.chatPageTitle || undefined,
    chatPageUrl: task.chatPageUrl || undefined,
    chatCountryCode: task.chatCountryCode || undefined,
    comments: Array.isArray(task.comments)
      ? task.comments.map((comment: any) => ({
          id: String(comment.id || crypto.randomUUID()),
          text: String(comment.text || ''),
          createdAt: toDate(comment.createdAt),
          createdBy: String(comment.createdBy || ''),
          createdByName: comment.createdByName || undefined,
        }))
      : [],
  }
}

export async function getSupportTaskCategories(
  businessId: string
): Promise<SupportTaskCategory[]> {
  const businessRef = doc(db, 'businesses', businessId)
  const snap = await getDoc(businessRef)

  if (!snap.exists()) {
    return DEFAULT_SUPPORT_TASK_CATEGORIES
  }

  const data = snap.data() as Business
  const categories = Array.isArray(data.supportTaskCategories) ? data.supportTaskCategories : []

  if (categories.length === 0) {
    return DEFAULT_SUPPORT_TASK_CATEGORIES
  }

  return categories.map(mapTaskCategory)
}

export async function saveSupportTaskCategories(
  businessId: string,
  categories: Array<Pick<SupportTaskCategory, 'id' | 'name' | 'default'>>
) {
  const businessRef = doc(db, 'businesses', businessId)
  const payload = categories.map((category) => ({
    id: category.id || crypto.randomUUID(),
    name: category.name.trim() || 'General',
    default: Boolean(category.default),
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  await updateDoc(businessRef, {
    supportTaskCategories: payload,
    updatedAt: serverTimestamp(),
  })
}

export async function getSupportTasks(businessId: string): Promise<SupportTask[]> {
  const tasksRef = collection(db, `businesses/${businessId}/supportTasks`)
  const tasksQuery = query(tasksRef, orderBy('updatedAt', 'desc'))
  const snap = await getDocs(tasksQuery)

  return snap.docs.map((taskDoc) => mapTask({ id: taskDoc.id, ...taskDoc.data() }))
}

export async function createSupportTask(
  businessId: string,
  params: {
    chatId?: string
    sessionId?: string
    visitorName?: string
    chatMessages?: SupportChatMessage[]
    chatPreview?: string
    chatPageTitle?: string
    chatPageUrl?: string
    chatCountryCode?: string
    title: string
    description: string
    categoryId: string
    categoryName: string
    priority: SupportTaskPriority
    status: SupportTaskStatus
    createdBy?: string
  }
) {
  const taskRef = doc(collection(db, `businesses/${businessId}/supportTasks`))

  await setDoc(taskRef, {
    businessId,
    chatId: params.chatId || params.sessionId || null,
    sessionId: params.sessionId || params.chatId || null,
    visitorName: params.visitorName || null,
    chatMessages: Array.isArray(params.chatMessages) ? params.chatMessages : [],
    chatPreview: params.chatPreview || null,
    chatPageTitle: params.chatPageTitle || null,
    chatPageUrl: params.chatPageUrl || null,
    chatCountryCode: params.chatCountryCode || null,
    title: params.title.trim(),
    description: params.description.trim(),
    categoryId: params.categoryId,
    categoryName: params.categoryName,
    priority: params.priority,
    status: params.status,
    createdBy: params.createdBy || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return taskRef.id
}

export async function updateSupportTask(
  businessId: string,
  taskId: string,
  updates: Partial<{
    title: string
    description: string
    categoryId: string
    categoryName: string
    priority: SupportTaskPriority
    status: SupportTaskStatus
  }>
) {
  const taskRef = doc(db, `businesses/${businessId}/supportTasks/${taskId}`)
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function addSupportTaskComment(
  businessId: string,
  taskId: string,
  comment: {
    text: string
    createdBy: string
    createdByName?: string
  }
) {
  const taskRef = doc(db, `businesses/${businessId}/supportTasks/${taskId}`)
  const taskComment: SupportTaskComment = {
    id: crypto.randomUUID(),
    text: comment.text.trim(),
    createdAt: new Date(),
    createdBy: comment.createdBy,
    createdByName: comment.createdByName,
  }

  await updateDoc(taskRef, {
    comments: arrayUnion(taskComment),
    updatedAt: serverTimestamp(),
  })
}

export async function getBusinessFeedback(
  businessId: string
): Promise<BusinessFeedback[]> {
  const feedbackRef = collection(db, `businesses/${businessId}/feedback`)
  const feedbackQuery = query(feedbackRef, orderBy('createdAt', 'desc'))
  const snap = await getDocs(feedbackQuery)

  return snap.docs.map((feedbackDoc) =>
    mapFeedbackEntry({ id: feedbackDoc.id, ...feedbackDoc.data() })
  )
}
