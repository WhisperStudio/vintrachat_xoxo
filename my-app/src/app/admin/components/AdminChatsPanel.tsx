'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FiSend, FiPlus, FiClock, FiTag } from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import {
  acceptSupportChat,
  createSupportTask,
  closeSupportChat,
  getSupportChats,
  getSupportTaskCategories,
  returnSupportChatToAi,
  sendSupportReply,
} from '@/lib/chat.service'
import { adminChatsI18n, useVintraLanguage } from '@/lib/i18n'
import type {
  SupportChatMessage,
  SupportChatSession,
  SupportTaskCategory,
  SupportTaskPriority,
  SupportTaskStatus,
} from '@/types/database'
import AdminDropdown from './AdminDropdown'
import './admin-components.css'

function speakerLabel(role: SupportChatMessage['role'], text: (typeof adminChatsI18n)[keyof typeof adminChatsI18n]) {
  switch (role) {
    case 'assistant':
      return text.speakers.ai
    case 'support':
      return text.speakers.support
    case 'system':
      return text.speakers.system
    default:
      return text.speakers.visitor
  }
}

function formatMessageTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function AdminChatsPanel({ selectedWidgetKey = '' }: { selectedWidgetKey?: string }) {
  const { dbUser, business } = useAuth()
  const { language } = useVintraLanguage()
  const text = adminChatsI18n[language]
  const humanSupportEnabled = business?.chatAssistantConfig?.humanSupportEnabled !== false
  const [chats, setChats] = useState<SupportChatSession[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [replySending, setReplySending] = useState(false)
  const [taskComposerOpen, setTaskComposerOpen] = useState(false)
  const [taskSaving, setTaskSaving] = useState(false)
  const [taskCategories, setTaskCategories] = useState<SupportTaskCategory[]>([])
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

  useEffect(() => {
    let mounted = true

    async function loadChats() {
      if (!dbUser?.businessId) return

      const data = await getSupportChats(dbUser.businessId)

      if (!mounted) return

      setChats(data)
      setSelectedChatId((prev) => {
        const nextId = prev && data.some((chat) => chat.id === prev) ? prev : data[0]?.id || null
        return nextId
      })
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

  const visibleChats = useMemo(
    () =>
      selectedWidgetKey
        ? chats.filter((chat) => chat.widgetKey === selectedWidgetKey)
        : chats,
    [chats, selectedWidgetKey]
  )
  const visibleSelectedChat = useMemo(
    () => visibleChats.find((chat) => chat.id === selectedChatId) || visibleChats[0] || null,
    [selectedChatId, visibleChats]
  )
  const selectedChat = visibleSelectedChat

  useLayoutEffect(() => {
    const el = messagesRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [selectedChat?.id, selectedChat?.messages.length, selectedChat?.status])

  useEffect(() => {
    setTaskComposerOpen(false)
  }, [selectedChat?.id])

  const refreshChats = async () => {
    if (!dbUser?.businessId) return
    const data = await getSupportChats(dbUser.businessId)
    setChats(data)
    setSelectedChatId((prev) => {
      const nextId = prev && data.some((chat) => chat.id === prev) ? prev : data[0]?.id || null
      return nextId
    })
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

  if (loading) {
    return (
      <div className="infoCard">
        <h1>{text.title}</h1>
        <p>{text.loading}</p>
      </div>
    )
  }

  if (chats.length === 0 || !selectedChat) {
    return (
      <div className="infoCard adminDataCard">
        <h1>{text.title}</h1>
        <p>
          {humanSupportEnabled
            ? selectedWidgetKey
              ? text.emptySelectedWidget
              : text.empty
            : text.humanSupportOff}
        </p>
      </div>
    )
  }

  const awaitingAcceptance = selectedChat.status === 'needs-human'
  const canHumanReply = selectedChat.status === 'open'
  const canReturnToAi = selectedChat.status === 'open'
  const canReturnToHuman = selectedChat.status === 'ai-active'

  const handleAccept = async () => {
    if (!dbUser?.businessId || !selectedChat) return
    await runChatAction(() => acceptSupportChat(dbUser.businessId, selectedChat.id))
  }

  const handleReturnToAi = async () => {
    if (!dbUser?.businessId || !selectedChat) return
    await runChatAction(() => returnSupportChatToAi(dbUser.businessId, selectedChat.id))
  }

  const handleClose = async () => {
    if (!dbUser?.businessId || !selectedChat) return
    await runChatAction(async () => {
      await closeSupportChat(dbUser.businessId, selectedChat.id)
      setReplyText('')
    })
  }

  const handleSendReply = async () => {
    if (!dbUser?.businessId || !selectedChat || selectedChat.status !== 'open' || !replyText.trim()) return

    const text = replyText.trim()
    setReplyText('')
    setReplySending(true)

    try {
      await runChatAction(() =>
        sendSupportReply(dbUser.businessId, selectedChat.id, text, selectedChat.countryCode)
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
    setTaskComposerOpen(true)
  }

  const handleSaveTask = async () => {
    if (!dbUser?.businessId || !selectedChat) return
    if (!taskDraft.title.trim() || !taskDraft.description.trim()) return

    const category = taskCategories.find((item) => item.id === taskDraft.categoryId) || taskCategories[0]

    if (!category) return

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
      setTaskComposerOpen(false)
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

  return (
    <div className="infoCard adminDataCard">
      <div className="adminChatsLayout">
        <div>
          <h1>{text.title}</h1>
          {selectedWidgetKey ? (
            <p className="adminDataHint">
              {text.showingWidget} <strong>{selectedWidgetKey}</strong>.
            </p>
          ) : null}
          {!humanSupportEnabled ? (
            <p className="adminDataHint">
              {text.humanSupportOff}
            </p>
          ) : null}
          <div className="adminChatList">
            {visibleChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`adminChatListItem ${
                  chat.id === visibleSelectedChat?.id ? 'adminChatListItemActive ' : ''
                }${chat.status === 'needs-human'
                  ? 'adminChatListItemWaiting '
                  : chat.status === 'open'
                    ? 'adminChatListItemOpen '
                    : chat.status === 'ai-active'
                      ? 'adminChatListItemAi '
                      : ''
                }`}
                onClick={() => setSelectedChatId(chat.id)}
              >
                <strong>{chat.preview || text.supportRequest}</strong>
                <span>{new Date(chat.updatedAt).toLocaleString()}</span>
                <span>{chat.messageCount} {text.messages}</span>
                <span>{text.status}: {chat.status}</span>
              </button>
            ))}
          </div>
          </div>
        <div className="adminChatTranscript">
          <div className="adminChatMeta">
            <strong>{visibleSelectedChat?.pageTitle || text.websiteVisitor}</strong>
            <span>{visibleSelectedChat?.pageUrl || text.unknownPage}</span>
            <span>{visibleSelectedChat?.visitorName ? `${text.visitor}: ${visibleSelectedChat.visitorName}` : `${text.visitor}: ${text.unnamed}`}</span>
            <span>{text.status}: {visibleSelectedChat?.status || text.unknown}</span>
          </div>

          <div className="adminChatActions">
            {visibleSelectedChat?.status === 'ai-active' ? (
              <button
                type="button"
                className="secondaryBtn"
                onClick={handleReturnToAi}
                disabled={actionBusy}
              >
                {text.returnToAi}
              </button>
            ) : null}
            {visibleSelectedChat?.status === 'open' ? (
              <button
                type="button"
                className="secondaryBtn"
                onClick={handleAccept}
                disabled={actionBusy}
              >
                {text.returnToHuman}
              </button>
            ) : null}
            {visibleSelectedChat?.status === 'open' ? (
              <button type="button" className="dangerBtn" onClick={handleClose} disabled={actionBusy}>
                {text.closeChat}
              </button>
            ) : null}
            {visibleSelectedChat?.status === 'ai-active' ? (
              <button type="button" className="dangerBtn" onClick={handleClose} disabled={actionBusy}>
                {text.closeChat}
              </button>
            ) : null}
          </div>

          <div className={`adminChatTranscriptStack ${awaitingAcceptance ? 'adminChatTranscriptLocked' : ''}`}>
            <div className="adminChatMessages" ref={messagesRef}>
              {visibleSelectedChat?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`adminTranscriptBubble ${
                    message.role === 'assistant'
                      ? 'adminTranscriptBubbleAssistant'
                      : message.role === 'support'
                        ? 'adminTranscriptBubbleSupport'
                        : message.role === 'system'
                          ? 'adminTranscriptBubbleSystem'
                          : 'adminTranscriptBubbleUser'
                  }`}
                >
                  <strong>{speakerLabel(message.role, text)}</strong>
                  <p>{message.text}</p>
                  <span className="adminTranscriptTime">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
              ))}
              {replySending ? (
                <div className="adminTranscriptBubble adminTranscriptBubbleTyping" aria-live="polite" aria-label="Support is typing">
                  <strong>{text.speakers.support}</strong>
                  <div className="adminTypingDots">
                    <span />
                    <span />
                    <span />
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
            <div className="adminChatToolsRow">
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

            {taskComposerOpen ? (
              <div className="adminTaskComposer">
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
                        setTaskDraft((prev) => ({ ...prev, description: event.target.value }))
                      }
                      rows={4}
                      placeholder={text.descriptionPlaceholder}
                    />
                  </label>

                  <label className="adminTaskField">
                    <span>{text.category}</span>
                    <AdminDropdown
                      value={taskDraft.categoryId}
                      options={taskCategories.map((category) => ({
                        value: category.id,
                        label: category.name,
                        description: category.default ? text.defaultCategory : text.customCategory,
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
                </div>

                <div className="adminTaskComposerActions">
                  <button
                    type="button"
                    className="secondaryBtn"
                    onClick={() => setTaskComposerOpen(false)}
                    disabled={taskSaving}
                  >
                    {text.cancel}
                  </button>
                  <button
                    type="button"
                    className="primaryBtn"
                    onClick={handleSaveTask}
                    disabled={
                      taskSaving ||
                      actionBusy ||
                      !taskDraft.title.trim() ||
                      !taskDraft.description.trim()
                    }
                  >
                    {taskSaving ? text.saving : text.saveTask}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="adminChatReplyBox">
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder={
                canHumanReply
                  ? text.replyPlaceholder
                  : text.replyLocked
              }
              rows={4}
              disabled={actionBusy || !canHumanReply}
            />
            <button
              type="button"
              className="primaryBtn adminSendButton"
              onClick={handleSendReply}
              disabled={actionBusy || !canHumanReply || !replyText.trim()}
            >
              <span>{text.sendHumanReply}</span>
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
