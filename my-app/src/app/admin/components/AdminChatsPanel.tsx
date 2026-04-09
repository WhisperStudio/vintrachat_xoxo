'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  acceptSupportChat,
  closeSupportChat,
  getSupportChats,
  returnSupportChatToAi,
  sendSupportReply,
} from '@/lib/chat.service'
import type { SupportChatMessage, SupportChatSession } from '@/types/database'

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

export default function AdminChatsPanel() {
  const { dbUser } = useAuth()
  const [chats, setChats] = useState<SupportChatSession[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

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

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || chats[0] || null,
    [chats, selectedChatId]
  )

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

    await runChatAction(() => sendSupportReply(dbUser.businessId, selectedChat.id, text))
  }

  return (
    <div className="infoCard adminDataCard">
      <h1>Chats</h1>
      <p>These are the conversations that requested human support or contact.</p>

      <div className="adminChatsLayout">
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

        <div className="adminChatTranscript">
          <div className="adminChatMeta">
            <strong>{selectedChat.pageTitle || 'Website visitor'}</strong>
            <span>{selectedChat.pageUrl || 'Unknown page'}</span>
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
            <div className="adminChatMessages">
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
              className="primaryBtn"
              onClick={handleSendReply}
              disabled={actionBusy || !canHumanReply || !replyText.trim()}
            >
              Send human reply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
