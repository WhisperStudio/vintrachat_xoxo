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
import type {
  SupportChatMessage,
  SupportChatSession,
  SupportTaskCategory,
  SupportTaskPriority,
  SupportTaskStatus,
} from '@/types/database'
import AdminDropdown from './AdminDropdown'
import './admin-components.css'

function speakerLabel(role: SupportChatMessage['role']) {
  switch (role) {
    case 'assistant':
      return 'AI'
    case 'support':
      return 'Human Support'
    case 'system':
      return 'System'
    default:
      return 'Visitor'
  }
}

function formatMessageTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function AdminChatsPanel() {
  const { dbUser, business } = useAuth()
  const [chats, setChats] = useState<SupportChatSession[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
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

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || chats[0] || null,
    [chats, selectedChatId]
  )

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
        <h1>Chats</h1>
        <p>Loading support chats...</p>
      </div>
    )
  }

  if (chats.length === 0 || !selectedChat) {
    return (
      <div className="infoCard adminDataCard">
        <h1>Chats</h1>
        <p>
          No support chats have been saved yet. AI-only conversations are counted in
          analytics, but only human-support requests appear here.
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

    await runChatAction(() =>
      sendSupportReply(dbUser.businessId, selectedChat.id, text, selectedChat.countryCode)
    )
  }

  const openTaskComposer = (quick = false) => {
    if (!selectedChat || !dbUser?.businessId) return

    const firstUserMessage = selectedChat.messages.find((message) => message.role === 'user')
    const fallbackCategory = taskCategories[0]?.id || 'general'

    setTaskDraft({
      title: quick
        ? selectedChat.preview || firstUserMessage?.text || 'Support follow-up'
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
          <h1>Chats</h1>
          <div className="adminChatList">
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`adminChatListItem ${
                  chat.id === selectedChat.id ? 'adminChatListItemActive ' : ''
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
                <strong>{chat.preview || 'Support request'}</strong>
                <span>{new Date(chat.updatedAt).toLocaleString()}</span>
                <span>{chat.messageCount} messages</span>
                <span>Status: {chat.status}</span>
              </button>
            ))}
          </div>
          </div>
        <div className="adminChatTranscript">
          <div className="adminChatMeta">
            <strong>{selectedChat.pageTitle || 'Website visitor'}</strong>
            <span>{selectedChat.pageUrl || 'Unknown page'}</span>
            <span>{selectedChat.visitorName ? `Visitor: ${selectedChat.visitorName}` : 'Visitor: unnamed'}</span>
            <span>Status: {selectedChat.status}</span>
          </div>

          <div className="adminChatActions">
            {canReturnToAi ? (
              <button
                type="button"
                className="secondaryBtn"
                onClick={handleReturnToAi}
                disabled={actionBusy}
              >
                Return to AI
              </button>
            ) : null}
            {canReturnToHuman ? (
              <button
                type="button"
                className="secondaryBtn"
                onClick={handleAccept}
                disabled={actionBusy}
              >
                Return to human
              </button>
            ) : null}
            {selectedChat.status === 'open' ? (
              <button type="button" className="dangerBtn" onClick={handleClose} disabled={actionBusy}>
                Close chat
              </button>
            ) : null}
            {selectedChat.status === 'ai-active' ? (
              <button type="button" className="dangerBtn" onClick={handleClose} disabled={actionBusy}>
                Close chat
              </button>
            ) : null}
          </div>

          <div className={`adminChatTranscriptStack ${awaitingAcceptance ? 'adminChatTranscriptLocked' : ''}`}>
            <div className="adminChatMessages" ref={messagesRef}>
              {selectedChat.messages.map((message) => (
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
                  <strong>{speakerLabel(message.role)}</strong>
                  <p>{message.text}</p>
                  <span className="adminTranscriptTime">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
              ))}
            </div>

            {awaitingAcceptance ? (
              <div className="adminChatGate">
                <div className="adminChatGateCard">
                  <p>Waiting for you to accept this chat</p>
                  <button type="button" className="adminChatGateButton" onClick={handleAccept} disabled={actionBusy}>
                    Accept chat
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
                Create task
              </button>
              <button
                type="button"
                className="secondaryBtn adminToolBtn"
                onClick={() => openTaskComposer(true)}
                disabled={actionBusy || taskSaving}
              >
                <FiPlus />
                Quick task
              </button>
            </div>

            {taskComposerOpen ? (
              <div className="adminTaskComposer">
                <div className="adminTaskComposerGrid">
                  <label className="adminTaskField adminTaskFieldFull">
                    <span>Task title</span>
                    <input
                      type="text"
                      value={taskDraft.title}
                      onChange={(event) =>
                        setTaskDraft((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="e.g. Refund follow-up"
                    />
                  </label>

                  <label className="adminTaskField adminTaskFieldFull">
                    <span>Description</span>
                    <textarea
                      value={taskDraft.description}
                      onChange={(event) =>
                        setTaskDraft((prev) => ({ ...prev, description: event.target.value }))
                      }
                      rows={4}
                      placeholder="Describe the issue, context, and what needs to happen next."
                    />
                  </label>

                  <label className="adminTaskField">
                    <span>Category</span>
                    <AdminDropdown
                      value={taskDraft.categoryId}
                      options={taskCategories.map((category) => ({
                        value: category.id,
                        label: category.name,
                        description: category.default ? 'Default category' : 'Custom category',
                      }))}
                      onChange={(nextValue) =>
                        setTaskDraft((prev) => ({ ...prev, categoryId: nextValue }))
                      }
                    />
                  </label>

                  <label className="adminTaskField">
                    <span>Priority</span>
                    <AdminDropdown
                      value={taskDraft.priority}
                      options={[
                        { value: 'low', label: 'Low priority' },
                        { value: 'medium', label: 'Medium priority' },
                        { value: 'high', label: 'High priority' },
                        { value: 'critical', label: 'Critical priority' },
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
                    <span>Status</span>
                    <AdminDropdown
                      value={taskDraft.status}
                      options={[
                        { value: 'open', label: 'Open' },
                        { value: 'in-progress', label: 'In progress' },
                        { value: 'blocked', label: 'Blocked' },
                        { value: 'done', label: 'Done' },
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
                    Cancel
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
                    {taskSaving ? 'Saving...' : 'Save task'}
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
                  ? 'Write a human support reply...'
                  : 'Reply is locked while AI owns the chat.'
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
              <span>Send human reply</span>
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
