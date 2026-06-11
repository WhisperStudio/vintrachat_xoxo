'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { FiArrowLeft, FiClock, FiPlus, FiSearch, FiSend, FiShield, FiUsers, FiX } from 'react-icons/fi'
import { LuMessagesSquare } from "react-icons/lu";

import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import {
  acceptSupportChat,
  closeSupportChat,
  createSupportTask,
  getSupportChats,
  getSupportTaskCategories,
  returnSupportChatToAi,
  sendSupportReply,
} from '@/lib/chat.service'
import { adminChatsI18n, useVintraLanguage } from '@/lib/i18n'
import { renderWidgetIcon } from '@/lib/widget-icons'
import type {
  ChatWidgetInterfaceIcons,
  SupportChatMessage,
  SupportChatSession,
  SupportTaskCategory,
  SupportTaskPriority,
  SupportTaskStatus,
} from '@/types/database'
import AdminDropdown from './AdminDropdown'
import './admin-components.css'

type AdminChatsPanelProps = {
  selectedWidgetKey?: string
  onWidgetSelected?: (widgetKey: string) => void
}

type InboxFilter = 'all' | 'unread'
type InboxSort = 'newest' | 'oldest'

function speakerLabel(
  role: SupportChatMessage['role'],
  text: (typeof adminChatsI18n)[keyof typeof adminChatsI18n],
  visitorName?: string
) {
  switch (role) {
    case 'assistant':
      return text.speakers.ai
    case 'support':
      return text.speakers.support
    case 'system':
      return text.speakers.system
    default:
      return visitorName?.trim() || text.speakers.visitor
  }
}

function getMessageIconKey(role: SupportChatMessage['role'], widgetIcons?: ChatWidgetInterfaceIcons) {
  if (role === 'assistant') return widgetIcons?.aiIcon || widgetIcons?.heroIcon || ''
  if (role === 'support') return widgetIcons?.supportIcon || widgetIcons?.aiIcon || widgetIcons?.heroIcon || ''
  if (role === 'user') return widgetIcons?.userIcon || ''
  return ''
}

function formatClock(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function sameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function getDayDifference(left: Date, right: Date) {
  const leftStart = new Date(left.getFullYear(), left.getMonth(), left.getDate())
  const rightStart = new Date(right.getFullYear(), right.getMonth(), right.getDate())
  return Math.round((rightStart.getTime() - leftStart.getTime()) / (1000 * 60 * 60 * 24))
}

function formatInboxStamp(date: Date, locale: string, text: (typeof adminChatsI18n)[keyof typeof adminChatsI18n]) {
  const now = new Date()

  if (sameCalendarDay(date, now)) {
    return formatClock(date, locale)
  }

  const diffDays = getDayDifference(date, now)
  if (diffDays === 1) return text.yesterday
  if (diffDays < 7) {
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
  }

  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(date)
}

function getChatTitle(chat: SupportChatSession, text: (typeof adminChatsI18n)[keyof typeof adminChatsI18n]) {
  return chat.visitorName?.trim() || chat.pageTitle?.trim() || text.unnamed
}

function getChatPreview(chat: SupportChatSession, text: (typeof adminChatsI18n)[keyof typeof adminChatsI18n]) {
  return chat.preview?.trim() || chat.messages.find((message) => message.role === 'user')?.text?.trim() || text.supportRequest
}

function getInitials(label: string) {
  const clean = label.trim()
  if (!clean) return '??'

  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export default function AdminChatsPanel({
  selectedWidgetKey = '',
  onWidgetSelected,
}: AdminChatsPanelProps) {
  const { dbUser, business, refreshBusiness } = useAuth()
  const { language } = useVintraLanguage()
  const text = adminChatsI18n[language]
  const humanSupportEnabled = business?.chatAssistantConfig?.humanSupportEnabled !== false
  const [chats, setChats] = useState<SupportChatSession[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [replySending, setReplySending] = useState(false)
  const [taskComposerMode, setTaskComposerMode] = useState<'quick' | 'full' | null>(null)
  const [taskSaving, setTaskSaving] = useState(false)
  const [taskCategories, setTaskCategories] = useState<SupportTaskCategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<InboxFilter>('all')
  const [sortMode, setSortMode] = useState<InboxSort>('newest')
  const [chatListPage, setChatListPage] = useState(0)
  const [readAtMap, setReadAtMap] = useState<Record<string, number>>({})
  const [enablingHumanSupport, setEnablingHumanSupport] = useState(false)
  const [taskDraft, setTaskDraft] = useState<{
    title: string
    description: string
    categoryId: string
    priority: SupportTaskPriority
    status: SupportTaskStatus
  }>({
    title: '',
    description: '',
    categoryId: 'general',
    priority: 'medium',
    status: 'open',
  })
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const typingTimerRef = useRef<number | null>(null)
  const readStorageKey = dbUser?.businessId ? `vintra-admin-chat-read:${dbUser.businessId}` : ''
  const taskComposerOpen = taskComposerMode !== null
  const isQuickTaskComposer = taskComposerMode === 'quick'

  useEffect(() => {
    let mounted = true

    async function loadChats() {
      if (!dbUser?.businessId) return

      const data = await getSupportChats(dbUser.businessId)

      if (!mounted) return

      setChats(data)
      setLoading(false)
    }

    void loadChats()
    const interval = window.setInterval(loadChats, 3000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [dbUser?.businessId])

  useEffect(() => {
    let mounted = true

    async function loadCategories() {
      if (!dbUser?.businessId) return

      const categories =
        business?.supportTaskCategories?.length
          ? business.supportTaskCategories
          : await getSupportTaskCategories(dbUser.businessId)

      if (!mounted) return

      setTaskCategories(categories)
      setTaskDraft((prev) => ({
        ...prev,
        categoryId: prev.categoryId || categories[0]?.id || 'general',
      }))
    }

    void loadCategories()

    return () => {
      mounted = false
    }
  }, [business?.supportTaskCategories, dbUser?.businessId])

  useEffect(() => {
    if (!readStorageKey || typeof window === 'undefined') return

    try {
      const parsed = JSON.parse(window.localStorage.getItem(readStorageKey) || '{}') as Record<string, number>
      setReadAtMap(parsed && typeof parsed === 'object' ? parsed : {})
    } catch {
      setReadAtMap({})
    }
  }, [readStorageKey])

  useEffect(() => {
    if (!readStorageKey || typeof window === 'undefined') return
    window.localStorage.setItem(readStorageKey, JSON.stringify(readAtMap))
  }, [readAtMap, readStorageKey])

  const widgetOptions = useMemo(() => {
    const options = [
      { value: '', label: text.allWidgets },
      ...(business?.chatWidgets || []).map((widget) => ({
        value: widget.widgetKey,
        label: widget.name,
        description: widget.isDefault ? text.defaultWidget : text.customWidget,
      })),
    ]

    return options
  }, [business?.chatWidgets, text.allWidgets, text.customWidget, text.defaultWidget])

  const selectedWidgetLabel =
    widgetOptions.find((option) => option.value === selectedWidgetKey)?.label || text.allWidgets

  const chatsForWidget = useMemo(
    () => (selectedWidgetKey ? chats.filter((chat) => chat.widgetKey === selectedWidgetKey) : chats),
    [chats, selectedWidgetKey]
  )

  const filteredChats = useMemo(() => {
    const query = normalize(searchQuery)

    return chatsForWidget
      .filter((chat) => {
        if (!query) return true

        const haystack = [
          chat.visitorName,
          chat.pageTitle,
          chat.pageUrl,
          chat.preview,
          chat.sessionId,
          chat.widgetKey,
          ...chat.messages.map((message) => message.text),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(query)
      })
      .filter((chat) => {
        if (filterMode !== 'unread') return true
        return (readAtMap[chat.id] || 0) < new Date(chat.updatedAt).getTime()
      })
      .sort((left, right) =>
        sortMode === 'newest'
          ? new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
          : new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()
      )
  }, [chatsForWidget, filterMode, readAtMap, searchQuery, sortMode])

  const visibleChatIdsKey = useMemo(
    () => filteredChats.map((chat) => chat.id).join('|'),
    [filteredChats]
  )

  const chatsPerPage = 8
  const totalChatPages = Math.max(1, Math.ceil(filteredChats.length / chatsPerPage))
  const paginatedChats = useMemo(() => {
    const start = chatListPage * chatsPerPage
    return filteredChats.slice(start, start + chatsPerPage)
  }, [chatListPage, filteredChats])

  const selectedChat = useMemo(
    () => filteredChats.find((chat) => chat.id === selectedChatId) || null,
    [filteredChats, selectedChatId]
  )

  const clearSupportTyping = async () => {
    if (!dbUser?.businessId || !selectedChat?.id) return

    await updateDoc(doc(db, `businesses/${dbUser.businessId}/supportChats/${selectedChat.id}`), {
      supportTypingAt: deleteField(),
      supportTypingBy: deleteField(),
    })
  }

  useEffect(() => {
    if (!filteredChats.length) {
      setSelectedChatId(null)
      return
    }

    setSelectedChatId((prev) => {
      if (!prev) return null
      return filteredChats.some((chat) => chat.id === prev) ? prev : null
    })
  }, [visibleChatIdsKey])

  useEffect(() => {
    setChatListPage((prev) => {
      if (!filteredChats.length) return 0
      return Math.min(prev, totalChatPages - 1)
    })
  }, [filteredChats.length, totalChatPages])

  useEffect(() => {
    if (!selectedChat) return

    const updatedAt = new Date(selectedChat.updatedAt).getTime()
    setReadAtMap((prev) => {
      if ((prev[selectedChat.id] || 0) >= updatedAt) return prev
      return { ...prev, [selectedChat.id]: updatedAt }
    })
  }, [selectedChat?.id, selectedChat?.updatedAt])

  useLayoutEffect(() => {
    const el = messagesRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [selectedChat?.id, selectedChat?.messages.length, selectedChat?.status])

  useEffect(() => {
    closeTaskComposer()
  }, [selectedChat?.id])

  useEffect(() => {
    if (!taskComposerOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTaskComposer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [taskComposerOpen])

  useEffect(() => {
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
    }

    if (!dbUser?.businessId || !selectedChat?.id || selectedChat.status !== 'open') {
      void clearSupportTyping()
      return
    }

    const trimmed = replyText.trim()
    if (!trimmed) {
      void clearSupportTyping()
      return
    }

    typingTimerRef.current = window.setTimeout(() => {
      void updateDoc(doc(db, `businesses/${dbUser.businessId}/supportChats/${selectedChat.id}`), {
        supportTypingAt: serverTimestamp(),
        supportTypingBy: dbUser.id,
      })
    }, 500)

    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }
    }
  }, [dbUser?.businessId, dbUser?.id, replyText, selectedChat?.id, selectedChat?.status])

  const unreadCount = useMemo(
    () => chatsForWidget.filter((chat) => (readAtMap[chat.id] || 0) < new Date(chat.updatedAt).getTime()).length,
    [chatsForWidget, readAtMap]
  )

  const selectedChatWidgetIcons = useMemo(() => {
    if (!selectedChat?.widgetKey) return undefined
    return business?.chatWidgets?.find((widget) => widget.widgetKey === selectedChat.widgetKey)?.config?.widgetIcons
  }, [business?.chatWidgets, selectedChat?.widgetKey])

  const refreshChats = async () => {
    if (!dbUser?.businessId) return
    const data = await getSupportChats(dbUser.businessId)
    setChats(data)
  }

  const runChatAction = async (action: () => Promise<void>) => {
    setActionBusy(true)
    try {
      await action()
      await refreshChats()
    } finally {
      setActionBusy(false)
    }
  }

  const handleWidgetChange = (nextValue: string) => {
    onWidgetSelected?.(nextValue)
  }

  const handleEnableHumanSupport = async () => {
    if (!business?.id) return

    setEnablingHumanSupport(true)
    try {
      await updateDoc(doc(db, 'businesses', business.id), {
        'chatAssistantConfig.humanSupportEnabled': true,
        updatedAt: serverTimestamp(),
      })
      await refreshBusiness()
    } finally {
      setEnablingHumanSupport(false)
    }
  }

  const stopSupportTyping = async () => {
    try {
      await clearSupportTyping()
    } catch (err) {
      console.error('Failed to clear support typing state:', err)
    }
  }

  const handleSelectChat = (chat: SupportChatSession) => {
    setSelectedChatId(chat.id)
    setReadAtMap((prev) => {
      const updatedAt = new Date(chat.updatedAt).getTime()
      if ((prev[chat.id] || 0) >= updatedAt) return prev
      return { ...prev, [chat.id]: updatedAt }
    })
  }

  const handleAccept = async () => {
    if (!dbUser?.businessId || !selectedChat) return
    await stopSupportTyping()
    await runChatAction(() => acceptSupportChat(dbUser.businessId, selectedChat.id))
  }

  const handleReturnToAi = async () => {
    if (!dbUser?.businessId || !selectedChat) return
    await stopSupportTyping()
    await runChatAction(() => returnSupportChatToAi(dbUser.businessId, selectedChat.id))
  }

  const handleClose = async () => {
    if (!dbUser?.businessId || !selectedChat) return
    await stopSupportTyping()
    await runChatAction(async () => {
      await closeSupportChat(dbUser.businessId, selectedChat.id)
      setReplyText('')
    })
  }

  const handleSendReply = async () => {
    if (!dbUser?.businessId || !selectedChat || selectedChat.status !== 'open' || !replyText.trim()) return

    const nextReply = replyText.trim()
    setReplyText('')
    setReplySending(true)

    try {
      await stopSupportTyping()
      await runChatAction(() =>
        sendSupportReply(dbUser.businessId, selectedChat.id, nextReply, selectedChat.countryCode)
      )
    } finally {
      setReplySending(false)
    }
  }

  const openTaskComposer = (quick = false) => {
    if (!selectedChat || !dbUser?.businessId) return

    const firstUserMessage = selectedChat.messages.find((message) => message.role === 'user')
    const fallbackCategory = taskCategories[0]?.id || 'general'

    setTaskDraft({
      title: quick
        ? selectedChat.preview || firstUserMessage?.text || text.fallbackTaskTitle
        : selectedChat.preview || '',
      description: quick
        ? firstUserMessage?.text || selectedChat.preview || ''
        : selectedChat.preview || '',
      categoryId: fallbackCategory,
      priority: 'medium',
      status: 'open',
    })
    setTaskComposerMode(quick ? 'quick' : 'full')
  }

  const closeTaskComposer = () => {
    setTaskComposerMode(null)
  }

  const getTaskCategory = () => taskCategories.find((item) => item.id === taskDraft.categoryId) || taskCategories[0] || {
    id: 'general',
    name: 'General',
    default: true,
  }

  const handleSaveQuickTask = async () => {
    if (!dbUser?.businessId || !selectedChat) return
    const category = getTaskCategory()
    const firstUserMessage = selectedChat.messages.find((message) => message.role === 'user')
    const title = taskDraft.title.trim() || selectedChat.preview || firstUserMessage?.text || text.fallbackTaskTitle
    const description = taskDraft.description.trim() || firstUserMessage?.text || selectedChat.preview || title

    if (!title.trim() || !description.trim()) return

    setTaskSaving(true)
    try {
      await createSupportTask(dbUser.businessId, {
        widgetKey: selectedChat.widgetKey,
        chatId: selectedChat.id,
        sessionId: selectedChat.sessionId,
        visitorName: selectedChat.visitorName,
        title,
        description,
        categoryId: category.id,
        categoryName: category.name,
        priority: 'medium',
        status: 'open',
        createdBy: dbUser.id,
      })
      closeTaskComposer()
      setTaskDraft({
        title: '',
        description: '',
        categoryId: taskCategories[0]?.id || 'general',
        priority: 'medium',
        status: 'open',
      })
    } finally {
      setTaskSaving(false)
    }
  }

  const handleSaveFullTask = async () => {
    if (!dbUser?.businessId || !selectedChat) return
    if (!taskDraft.title.trim() || !taskDraft.description.trim()) return

    const category = getTaskCategory()

    setTaskSaving(true)
    try {
      await createSupportTask(dbUser.businessId, {
        widgetKey: selectedChat.widgetKey,
        chatId: selectedChat.id,
        sessionId: selectedChat.sessionId,
        visitorName: selectedChat.visitorName,
        chatMessages: selectedChat.messages,
        chatPreview: selectedChat.preview,
        chatPageTitle: selectedChat.pageTitle,
        chatPageUrl: selectedChat.pageUrl,
        chatCountryCode: selectedChat.countryCode,
        title: taskDraft.title.trim(),
        description: taskDraft.description.trim(),
        categoryId: category.id,
        categoryName: category.name,
        priority: taskDraft.priority,
        status: taskDraft.status,
        createdBy: dbUser.id,
      })
      closeTaskComposer()
      setTaskDraft({
        title: '',
        description: '',
        categoryId: taskCategories[0]?.id || 'general',
        priority: 'medium',
        status: 'open',
      })
    } finally {
      setTaskSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="infoCard adminChatsPanel">
        <h1>{text.title}</h1>
        <p>{text.loading}</p>
      </div>
    )
  }

  if (!humanSupportEnabled) {
    return (
      <div className="infoCard adminChatsPanel adminChatsPanelDisabled">
        <span className="adminChatsPanelDisabledEyebrow">
          <FiShield />
          {text.humanSupportOffTitle}
        </span>
        <h1>{text.humanSupportOffTitle}</h1>
        <p>{text.humanSupportOff}</p>
        <button
          type="button"
          className="primaryBtn"
          onClick={() => void handleEnableHumanSupport()}
          disabled={enablingHumanSupport}
        >
          {enablingHumanSupport ? text.loading : text.enableHumanSupport}
        </button>
      </div>
    )
  }

  const awaitingAcceptance = selectedChat?.status === 'needs-human'
  const visitorTypingAt = selectedChat?.visitorTypingAt ? new Date(selectedChat.visitorTypingAt).getTime() : 0
  const showVisitorTyping =
    Boolean(selectedChat) &&
    selectedChat?.status !== 'closed' &&
    visitorTypingAt > 0 &&
    Date.now() - visitorTypingAt < 4500
  const canHumanReply = selectedChat?.status === 'open'
  const canReturnToAi = selectedChat?.status === 'open'
  const canReturnToHuman = selectedChat?.status === 'ai-active'
  const isFilteredEmpty = filteredChats.length === 0
  const backLabel = language === 'no' ? 'Tilbake til chatter' : 'Back to chats'

  return (
    <div className="infoCard adminChatsPanel">
      <div className={`adminChatsLayout ${selectedChat ? 'adminChatsLayoutChatOpen' : 'adminChatsLayoutListOnly'}`}>
        <aside className="adminChatsInbox">
          <div className="adminChatsTitleBlock">
            <span className="adminChatsEyebrow">
              <FiUsers />
              {text.inbox}
              <span className="adminChatsUnreadPill">
                {unreadCount} {text.unread}
              </span>
            </span>

            <AdminDropdown
              value={selectedWidgetKey}
              options={widgetOptions}
              onChange={handleWidgetChange}
              placeholder={text.allWidgets}
            />
          </div>
          <div className="middleinbox">
            {selectedChat ? (
              <div className="adminChatsSelectedHeader">
                <div className="adminChatsSelectedHeaderTop">
                  <button
                    type="button"
                    className="adminChatsBackButton"
                    onClick={() => setSelectedChatId(null)}
                    aria-label={backLabel}
                  >
                    <FiArrowLeft />
                  </button>

                  <div className="adminChatActions adminChatActionsHeader">
                    {(selectedChat.status === 'open' || selectedChat.status === 'ai-active') ? (
                      <button
                        type="button"
                        className="dangerBtn"
                        onClick={handleClose}
                        disabled={actionBusy}
                      >
                        {text.closeChat}
                      </button>
                    ) : null}
                    {canReturnToAi ? (
                      <button
                        type="button"
                        className="secondaryBtn"
                        onClick={handleReturnToAi}
                        disabled={actionBusy}
                      >
                        {text.returnToAi}
                      </button>
                    ) : null}
                    {awaitingAcceptance ? (
                      <button
                        type="button"
                        className="secondaryBtn"
                        onClick={handleAccept}
                        disabled={actionBusy}
                      >
                        {text.acceptChat}
                      </button>
                    ) : null}
                    {canReturnToHuman ? (
                      <button
                        type="button"
                        className="secondaryBtn"
                        onClick={handleAccept}
                        disabled={actionBusy}
                      >
                        {text.returnToHuman}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="adminChatsSelectedHeaderMain">
                  <div className="adminChatsSelectedHeaderCopy">
                    <div className="adminChatMetaTop">
                      <span className="adminChatsAvatar" aria-hidden="true">
                        {getInitials(getChatTitle(selectedChat, text))}
                      </span>
                      <div className="adminChatMetaIdentity">
                        <strong>{getChatTitle(selectedChat, text)}</strong>
                      </div>
                    </div>

                    <div className="adminChatMetaDetails">
                      <span><FiClock /> {formatInboxStamp(new Date(selectedChat.updatedAt), language === 'no' ? 'no-NO' : 'en-US', text)}</span>
                      <span><LuMessagesSquare /> {selectedChat.messageCount}</span>
                    </div>

                    <div className="adminChatToolsRow adminChatToolsRowHeader">
                      <button
                        type="button"
                        className="secondaryBtn adminToolBtn"
                        onClick={() => openTaskComposer(false)}
                        disabled={actionBusy || taskSaving}
                      >
                        <FiPlus />
                        {text.createTask}
                      </button>
                      <button
                        type="button"
                        className="secondaryBtn adminToolBtn"
                        onClick={() => openTaskComposer(true)}
                        disabled={actionBusy || taskSaving}
                      >
                        <FiPlus />
                        {text.quickTask}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {!selectedChat ? (
              <>
                <div className="adminChatsToolbar">
                  <div className="adminChatsToolbarActions">
                    <button
                      type="button"
                      className={filterMode === 'all' ? 'adminChatsFilterButton active' : 'adminChatsFilterButton'}
                      onClick={() => {
                        setFilterMode('all')
                        setChatListPage(0)
                      }}
                    >
                      {text.all}
                    </button>
                    <button
                      type="button"
                      className={filterMode === 'unread' ? 'adminChatsFilterButton active' : 'adminChatsFilterButton'}
                      onClick={() => {
                        setFilterMode('unread')
                        setChatListPage(0)
                      }}
                    >
                      {text.unread}
                    </button>
                    <button
                      type="button"
                      className="adminChatsFilterButton adminChatsSortButton"
                      onClick={() => {
                        setSortMode((current) => (current === 'newest' ? 'oldest' : 'newest'))
                        setChatListPage(0)
                      }}
                    >
                      <FiClock />
                      {sortMode === 'newest' ? text.newestFirst : text.oldestFirst}
                    </button>
                    <label className="adminChatsSearch">
                      <FiSearch />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => {
                          setSearchQuery(event.target.value)
                          setChatListPage(0)
                        }}
                        placeholder={text.searchPlaceholder}
                      />
                    </label>
                  </div>
                </div>
                <div className="adminChatsListHeader">
                  <span>
                    {filteredChats.length} {text.messages}
                  </span>
                </div>
              </>
            ) : null}
            {!selectedChat && isFilteredEmpty ? (
              <div className="adminChatsEmptyState">
                <h2>{text.emptyFiltered}</h2>
                <p>
                  {selectedWidgetKey ? text.emptySelectedWidget : text.empty}
                </p>
              </div>
            ) : !selectedChat ? (
              <div className="adminChatsListWrap">
                <div className="adminChatsList">
                  {paginatedChats.map((chat) => {
                  const title = getChatTitle(chat, text)
                  const preview = getChatPreview(chat, text)
                  const isUnread = (readAtMap[chat.id] || 0) < new Date(chat.updatedAt).getTime()
                  const stamp = formatInboxStamp(new Date(chat.updatedAt), language === 'no' ? 'no-NO' : 'en-US', text)
                  const initials = getInitials(title)

                  return (
                    <button
                      key={chat.id}
                      type="button"
                      className={`adminChatsListItem ${chat.id === selectedChatId ? 'active' : ''}`}
                      onClick={() => handleSelectChat(chat)}
                    >
                      <span className="adminChatsAvatar" aria-hidden="true">
                        {initials}
                      </span>

                      <div className="adminChatsListCopy">
                        <div className="adminChatsListTopRow">
                          <strong>{title}</strong>
                          <div className="adminChatsListMeta">
                            <span className="adminChatsListStamp">
                              <FiClock />
                              {stamp}
                            </span>

                          </div>
                        </div>
                        <p>{preview}</p>

                      </div>

                      {isUnread ? <span className="adminChatsUnreadDot" aria-label={text.unread} /> : null}
                    </button>
                  )
                  })}
                </div>

                {totalChatPages > 1 ? (
                  <div className="adminChatsPagination">
                    <button
                      type="button"
                      className="adminChatsPageButton"
                      onClick={() => setChatListPage((current) => Math.max(0, current - 1))}
                      disabled={chatListPage === 0}
                    >
                      <FiArrowLeft />
                    </button>
                    <span className="adminChatsPageStatus">
                      {chatListPage + 1}/{totalChatPages}
                    </span>
                    <button
                      type="button"
                      className="adminChatsPageButton"
                      onClick={() => setChatListPage((current) => Math.min(totalChatPages - 1, current + 1))}
                      disabled={chatListPage >= totalChatPages - 1}
                    >
                      <FiArrowLeft className="adminChatsPageButtonNextIcon" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>

        <section className={`adminChatsTranscript ${selectedChat ? 'adminChatsTranscriptOpen' : 'adminChatsTranscriptHidden'}`}>
          {selectedChat ? (
            <>
              {taskComposerOpen ? (
                    <div
                      className="adminTaskComposerOverlay"
                      role="presentation"
                      onClick={closeTaskComposer}
                    >
                      <div
                        className={`adminTaskComposerSheet ${isQuickTaskComposer ? 'adminTaskComposerSheetQuick' : 'adminTaskComposerSheetFull'}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-task-composer-title"
                        aria-describedby="admin-task-composer-description"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="adminTaskComposerHeader">
                          <div>
                            <span className="adminTaskComposerEyebrow">
                              {isQuickTaskComposer ? text.quickTask : text.createTask}
                            </span>
                            <h2 id="admin-task-composer-title">
                              {isQuickTaskComposer ? text.quickTask : text.createTask}
                            </h2>
                            <p id="admin-task-composer-description">
                              {isQuickTaskComposer
                                ? text.quickTaskHint
                                : text.createTaskHint}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="adminTaskComposerClose"
                            onClick={closeTaskComposer}
                            aria-label={text.cancel}
                          >
                            <FiX />
                          </button>
                        </div>

                        <div className="adminTaskComposerBody">
                          <div className="adminTaskComposerGrid">
                            <label className="adminTaskField adminTaskFieldFull">
                              <span>{text.taskTitle}</span>
                              <input
                                type="text"
                                value={taskDraft.title}
                                onChange={(event) =>
                                  setTaskDraft((prev) => ({ ...prev, title: event.target.value }))
                                }
                                placeholder={text.taskTitlePlaceholder}
                              />
                            </label>

                            <label className="adminTaskField adminTaskFieldFull">
                              <span>{text.description}</span>
                              <textarea
                                value={taskDraft.description}
                                onChange={(event) =>
                                  setTaskDraft((prev) => ({
                                    ...prev,
                                    description: event.target.value,
                                  }))
                                }
                                rows={isQuickTaskComposer ? 3 : 4}
                                placeholder={text.descriptionPlaceholder}
                              />
                            </label>

                            {isQuickTaskComposer ? (
                              <p className="adminTaskComposerHint">
                                {text.quickTaskDefaultHint} <strong>{getTaskCategory().name}</strong>.
                              </p>
                            ) : (
                              <>
                                <label className="adminTaskField">
                                  <span>{text.category}</span>
                                  <AdminDropdown
                                    value={taskDraft.categoryId}
                                    options={taskCategories.map((category) => ({
                                      value: category.id,
                                      label: category.name,
                                      description: category.default
                                        ? text.defaultCategory
                                        : text.customCategory,
                                    }))}
                                    onChange={(nextValue) =>
                                      setTaskDraft((prev) => ({ ...prev, categoryId: nextValue }))
                                    }
                                  />
                                </label>

                                <label className="adminTaskField">
                                  <span>{text.priority}</span>
                                  <AdminDropdown
                                    value={taskDraft.priority}
                                    options={[
                                      { value: 'low', label: text.priorities.low },
                                      { value: 'medium', label: text.priorities.medium },
                                      { value: 'high', label: text.priorities.high },
                                      { value: 'critical', label: text.priorities.critical },
                                    ]}
                                    onChange={(nextValue) =>
                                      setTaskDraft((prev) => ({
                                        ...prev,
                                        priority: nextValue as SupportTaskPriority,
                                      }))
                                    }
                                  />
                                </label>

                                <label className="adminTaskField">
                                  <span>{text.statusLabel}</span>
                                  <AdminDropdown
                                    value={taskDraft.status}
                                    options={[
                                      { value: 'open', label: text.statuses.open },
                                      { value: 'in-progress', label: text.statuses.inProgress },
                                      { value: 'blocked', label: text.statuses.blocked },
                                      { value: 'done', label: text.statuses.done },
                                    ]}
                                    onChange={(nextValue) =>
                                      setTaskDraft((prev) => ({
                                        ...prev,
                                        status: nextValue as SupportTaskStatus,
                                      }))
                                    }
                                  />
                                </label>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="adminTaskComposerActions">
                          <button type="button" className="secondaryBtn" onClick={closeTaskComposer}>
                            {text.cancel}
                          </button>
                          <button
                            type="button"
                            className="primaryBtn"
                            onClick={() => void (isQuickTaskComposer ? handleSaveQuickTask() : handleSaveFullTask())}
                            disabled={taskSaving}
                          >
                            {taskSaving
                              ? text.saving
                              : isQuickTaskComposer
                                ? text.saveQuickTask
                                : text.saveTask}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}



              <div className={`adminChatTranscriptStack ${awaitingAcceptance ? 'adminChatTranscriptLocked' : ''}`}>
                <div className="adminChatMessages" ref={messagesRef}>
                  {selectedChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`adminTranscriptMessage ${
                        message.role === 'system'
                          ? 'adminTranscriptMessageCenter'
                          : message.role === 'user'
                            ? 'adminTranscriptMessageRight'
                            : 'adminTranscriptMessageLeft'
                      }`}
                    >
                      <div
                        className={`adminTranscriptBubble ${message.role === 'assistant'
                          ? 'adminTranscriptBubbleAssistant'
                          : message.role === 'support'
                            ? 'adminTranscriptBubbleSupport'
                            : message.role === 'system'
                              ? 'adminTranscriptBubbleSystem'
                              : 'adminTranscriptBubbleUser'
                          } ${message.role === 'user' ? 'adminTranscriptBubbleRight' : 'adminTranscriptBubbleLeft'}`}
                      >
                        <strong>{speakerLabel(message.role, text, selectedChat.visitorName)}</strong>
                        <p>{message.text}</p>
                        <div className={`adminTranscriptBubbleTimeRow ${message.role === 'user' ? 'adminTranscriptBubbleTimeRowRight' : 'adminTranscriptBubbleTimeRowLeft'}`}>
                          <span className="adminTranscriptTime">{formatClock(message.createdAt, language === 'no' ? 'no-NO' : 'en-US')}</span>
                        </div>
                      </div>

                      {message.role !== 'system' ? (
                        <div className={`adminTranscriptMetaRow ${message.role === 'user' ? 'adminTranscriptMetaRowRight' : 'adminTranscriptMetaRowLeft'}`}>
                          {message.role === 'user' ? (
                            <span className="adminTranscriptRoleIcon" aria-hidden="true">
                              {renderWidgetIcon(getMessageIconKey(message.role, selectedChatWidgetIcons), { 'aria-hidden': true })}
                            </span>
                          ) : null}
                          {message.role !== 'user' ? (
                            <span className="adminTranscriptRoleIcon" aria-hidden="true">
                              {renderWidgetIcon(getMessageIconKey(message.role, selectedChatWidgetIcons), { 'aria-hidden': true })}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {replySending ? (
                    <div
                      className="adminTranscriptMessage adminTranscriptMessageLeft"
                      aria-live="polite"
                      aria-label="Support is typing"
                    >
                      <div className="adminTranscriptBubble adminTranscriptBubbleTyping adminTranscriptBubbleLeft">
                        <strong>{text.speakers.support}</strong>
                        <div className="adminTypingDots">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                      <div className="adminTranscriptMetaRow adminTranscriptMetaRowLeft">
                        <span className="adminTranscriptRoleIcon" aria-hidden="true">
                          {renderWidgetIcon(getMessageIconKey('support', selectedChatWidgetIcons), { 'aria-hidden': true })}
                        </span>
                      </div>
                    </div>
                  ) : null}
                  {showVisitorTyping ? (
                    <div
                      className="adminTranscriptMessage adminTranscriptMessageRight"
                      aria-live="polite"
                      aria-label="Visitor is typing"
                    >
                      <div className="adminTranscriptBubble adminTranscriptBubbleTyping adminTranscriptBubbleVisitorTyping adminTranscriptBubbleRight">
                        <strong>{selectedChat.visitorName?.trim() || text.speakers.visitor}</strong>
                        <div className="adminTypingDots">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                      <div className="adminTranscriptMetaRow adminTranscriptMetaRowRight">
                        <span className="adminTranscriptRoleIcon" aria-hidden="true">
                          {renderWidgetIcon(getMessageIconKey('user', selectedChatWidgetIcons), { 'aria-hidden': true })}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {awaitingAcceptance ? (
                  <div className="adminChatGate">
                    <div className="adminChatGateCard">
                      <p>{text.waitingAccept}</p>
                      <button type="button" className="adminChatGateButton" onClick={handleAccept} disabled={actionBusy}>
                        {text.acceptChat}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="adminChatTools">


                <div className="adminChatReplyBox">
                  <textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder={selectedChat.status === 'open' ? text.replyPlaceholder : text.replyLocked}
                    disabled={!canHumanReply || actionBusy}
                    rows={4}
                  />
                  <button
                    type="button"
                    className="primaryBtn adminSendButton"
                    onClick={handleSendReply}
                    disabled={!canHumanReply || actionBusy || replySending || !replyText.trim()}
                  >
                    <FiSend />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="adminChatsEmptyState adminChatsTranscriptEmpty">
              <h2>{text.emptyFiltered}</h2>
              <p>
                {text.emptySelectedWidget}
              </p>
            </div>
          )}
        </section>
      </div>

    </div>
  )
}
