'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getSupportChats } from '@/lib/chat.service'
import type { SupportChatSession } from '@/types/database'

export default function AdminChatsPanel() {
  const { dbUser } = useAuth()
  const [chats, setChats] = useState<SupportChatSession[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadChats() {
      if (!dbUser?.businessId) return

      const data = await getSupportChats(dbUser.businessId)

      if (!mounted) return

      setChats(data)
      setSelectedChatId((prev) => prev || data[0]?.id || null)
      setLoading(false)
    }

    loadChats()

    return () => {
      mounted = false
    }
  }, [dbUser?.businessId])

  if (loading) {
    return (
      <div className="infoCard">
        <h1>Chats</h1>
        <p>Loading support chats...</p>
      </div>
    )
  }

  if (chats.length === 0) {
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

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || chats[0]

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
                chat.id === selectedChat.id ? 'adminChatListItemActive' : ''
              }`}
              onClick={() => setSelectedChatId(chat.id)}
            >
              <strong>{chat.preview || 'Support request'}</strong>
              <span>{new Date(chat.updatedAt).toLocaleString()}</span>
              <span>{chat.messageCount} messages</span>
            </button>
          ))}
        </div>

        <div className="adminChatTranscript">
          <div className="adminChatMeta">
            <strong>{selectedChat.pageTitle || 'Website visitor'}</strong>
            <span>{selectedChat.pageUrl || 'Unknown page'}</span>
            <span>Status: {selectedChat.status}</span>
          </div>

          <div className="adminChatMessages">
            {selectedChat.messages.map((message) => (
              <div
                key={message.id}
                className={`adminTranscriptBubble ${
                  message.role === 'assistant'
                    ? 'adminTranscriptBubbleAssistant'
                    : 'adminTranscriptBubbleUser'
                }`}
              >
                <strong>{message.role === 'assistant' ? 'AI' : 'Visitor'}</strong>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
