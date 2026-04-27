'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FiClock, FiFilter, FiMessageSquare, FiPlus, FiSettings, FiTag, FiUser } from 'react-icons/fi'
import AdminDropdown from './AdminDropdown'
import { useAuth } from '@/context/AuthContext'
import {
  addSupportTaskComment,
  createSupportTask,
  getSupportChats,
  getSupportTaskCategories,
  getSupportTasks,
  saveSupportTaskCategories,
  updateSupportTask,
} from '@/lib/chat.service'
import type {
  SupportChatMessage,
  SupportChatSession,
  SupportTask,
  SupportTaskCategory,
  SupportTaskPriority,
  SupportTaskStatus,
} from '@/types/database'
import './admin-components.css'

const taskPriorityLabels: Record<SupportTaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const taskStatusLabels: Record<SupportTaskStatus, string> = {
  open: 'Open',
  'in-progress': 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}

const taskPriorityOrder: SupportTaskPriority[] = ['critical', 'high', 'medium', 'low']

const taskPriorityAccents: Record<
  SupportTaskPriority,
  { color: string; soft: string }
> = {
  critical: { color: 'rgba(239, 68, 68, 1)', soft: 'rgba(239, 68, 68, 0.12)' },
  high: { color: 'rgba(249, 115, 22, 1)', soft: 'rgba(249, 115, 22, 0.12)' },
  medium: { color: 'rgba(59, 130, 246, 1)', soft: 'rgba(59, 130, 246, 0.12)' },
  low: { color: 'rgba(16, 185, 129, 1)', soft: 'rgba(16, 185, 129, 0.12)' },
}

const categoryAccentPalette = [
  { color: 'rgba(59, 130, 246, 1)', soft: 'rgba(59, 130, 246, 0.12)' },
  { color: 'rgba(16, 185, 129, 1)', soft: 'rgba(16, 185, 129, 0.12)' },
  { color: 'rgba(249, 115, 22, 1)', soft: 'rgba(249, 115, 22, 0.12)' },
  { color: 'rgba(236, 72, 153, 1)', soft: 'rgba(236, 72, 153, 0.12)' },
  { color: 'rgba(139, 92, 246, 1)', soft: 'rgba(139, 92, 246, 0.12)' },
  { color: 'rgba(14, 165, 233, 1)', soft: 'rgba(14, 165, 233, 0.12)' },
]

function accentForKey(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return categoryAccentPalette[hash % categoryAccentPalette.length]
}

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

function formatDate(value?: Date) {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleString()
}

function formatMessageTime(value?: Date) {
  if (!value) return ''
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function AdminTasksPanel() {
  const { dbUser, business } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<SupportTask[]>([])
  const [chats, setChats] = useState<SupportChatSession[]>([])
  const [categories, setCategories] = useState<SupportTaskCategory[]>([])
  const [savingCategories, setSavingCategories] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [taskCreatorOpen, setTaskCreatorOpen] = useState(false)
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false)
  const [creatorBusy, setCreatorBusy] = useState(false)
  const [commentSaving, setCommentSaving] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [filters, setFilters] = useState<{
    status: SupportTaskStatus | 'all'
    priority: SupportTaskPriority | 'all'
    categoryId: string | 'all'
    sortBy: 'newest' | 'oldest'
  }>({
    status: 'all',
    priority: 'all',
    categoryId: 'all',
    sortBy: 'newest',
  })
  const [creatorDraft, setCreatorDraft] = useState({
    title: '',
    description: '',
    categoryId: 'general',
    priority: 'medium' as SupportTaskPriority,
    status: 'open' as SupportTaskStatus,
  })

  const detailScrollRef = useRef<HTMLDivElement | null>(null)
  const historyScrollRef = useRef<HTMLDivElement | null>(null)

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories]
  )

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null,
    [selectedTaskId, tasks]
  )

  const selectedChat = useMemo(() => {
    if (!selectedTask) return null
    return (
      chats.find((chat) => chat.id === selectedTask.chatId || chat.sessionId === selectedTask.sessionId) ||
      null
    )
  }, [chats, selectedTask])

  const taskChatMessages = selectedTask?.chatMessages?.length
    ? selectedTask.chatMessages
    : selectedChat?.messages || []

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
        description: category.default ? 'Default category' : 'Custom category',
        accent: accentForKey(category.id).color,
        accentSoft: accentForKey(category.id).soft,
      })),
    [categories]
  )

  const filteredTasks = useMemo(() => {
    const nextTasks = tasks.filter((task) => {
      if (filters.status !== 'all' && task.status !== filters.status) return false
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false
      if (filters.categoryId !== 'all' && task.categoryId !== filters.categoryId) return false
      return true
    })

    return nextTasks.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return filters.sortBy === 'newest' ? bTime - aTime : aTime - bTime
    })
  }, [filters.categoryId, filters.priority, filters.sortBy, filters.status, tasks])

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!dbUser?.businessId) return

      const [nextCategories, nextTasks, nextChats] = await Promise.all([
        business?.supportTaskCategories?.length
          ? Promise.resolve(business.supportTaskCategories)
          : getSupportTaskCategories(dbUser.businessId),
        getSupportTasks(dbUser.businessId),
        getSupportChats(dbUser.businessId),
      ])

      if (!mounted) return

      setCategories(nextCategories ?? [])
      setTasks(nextTasks)
      setChats(nextChats)
      setSelectedTaskId((prev) => {
        if (prev && nextTasks.some((task) => task.id === prev)) return prev
        return nextTasks[0]?.id || null
      })
      setCreatorDraft((prev) => ({
        ...prev,
        categoryId: prev.categoryId || nextCategories[0]?.id || 'general',
      }))
      setLoading(false)
    }

    void load()

    const interval = window.setInterval(() => {
      void load()
    }, 3000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [business?.supportTaskCategories, dbUser?.businessId])

  useLayoutEffect(() => {
    const el = detailScrollRef.current
    if (!el) return
    el.scrollTop = 0
  }, [selectedTask?.id])

  useLayoutEffect(() => {
    const el = historyScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [selectedChat?.id, selectedChat?.messages.length])

  useEffect(() => {
    setTaskCreatorOpen(false)
    setCategoryEditorOpen(false)
    setCommentText('')
  }, [selectedTask?.id])

  const refresh = async () => {
    if (!dbUser?.businessId) return
    const [nextCategories, nextTasks, nextChats] = await Promise.all([
      getSupportTaskCategories(dbUser.businessId),
      getSupportTasks(dbUser.businessId),
      getSupportChats(dbUser.businessId),
    ])
    setCategories(nextCategories)
    setTasks(nextTasks)
    setChats(nextChats)
    setSelectedTaskId((prev) => {
      if (prev && nextTasks.some((task) => task.id === prev)) return prev
      return nextTasks[0]?.id || null
    })
  }

  const addCategory = async () => {
    if (!dbUser?.businessId) return
    const trimmed = newCategoryName.trim()
    if (!trimmed) return

    setSavingCategories(true)
    try {
      const nextCategories = [
        ...categories,
        {
          id: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: trimmed,
          default: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      await saveSupportTaskCategories(
        dbUser.businessId,
        nextCategories.map((category) => ({
          id: category.id,
          name: category.name,
          default: category.default,
        }))
      )
      setNewCategoryName('')
      await refresh()
    } finally {
      setSavingCategories(false)
    }
  }

  const removeCategory = async (categoryId: string) => {
    if (!dbUser?.businessId) return

    setSavingCategories(true)
    try {
      const nextCategories = categories.filter((category) => category.id !== categoryId)
      await saveSupportTaskCategories(
        dbUser.businessId,
        nextCategories.map((category) => ({
          id: category.id,
          name: category.name,
          default: category.default,
        }))
      )
      await refresh()
    } finally {
      setSavingCategories(false)
    }
  }

  const saveTask = async () => {
    if (!dbUser?.businessId) return
    const category = categoriesById.get(creatorDraft.categoryId) || categories[0]
    if (!category) return

    setCreatorBusy(true)
    try {
      await createSupportTask(dbUser.businessId, {
        title: creatorDraft.title,
        description: creatorDraft.description,
        categoryId: category.id,
        categoryName: category.name,
        priority: creatorDraft.priority,
        status: creatorDraft.status,
        createdBy: dbUser.id,
      })
      setCreatorDraft({
        title: '',
        description: '',
        categoryId: categories[0]?.id || 'general',
        priority: 'medium',
        status: 'open',
      })
      setTaskCreatorOpen(false)
      await refresh()
    } finally {
      setCreatorBusy(false)
    }
  }

  const updateTaskField = async (
    taskId: string,
    field: 'priority' | 'status' | 'categoryId',
    value: SupportTaskPriority | SupportTaskStatus | string
  ) => {
    if (!dbUser?.businessId) return
    const targetCategory =
      field === 'categoryId' ? categoriesById.get(String(value)) || categories[0] : undefined

    await updateSupportTask(dbUser.businessId, taskId, {
      [field]: value,
      ...(targetCategory
        ? {
            categoryName: targetCategory.name,
          }
        : {}),
    } as Partial<{
      priority: SupportTaskPriority
      status: SupportTaskStatus
      categoryId: string
      categoryName: string
    }>)
    await refresh()
  }

  const addComment = async () => {
    if (!dbUser?.businessId || !selectedTask || !commentText.trim()) return

    setCommentSaving(true)
    try {
      await addSupportTaskComment(dbUser.businessId, selectedTask.id, {
        text: commentText,
        createdBy: dbUser.id,
        createdByName: dbUser.displayName || dbUser.email || 'Support',
      })
      setCommentText('')
      await refresh()
    } finally {
      setCommentSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="infoCard adminDataCard">
        <h1>Tasks</h1>
        <p>Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="infoCard adminDataCard adminTasksPanel">
      <div className="adminSectionHeader adminTasksHeader">
        <div>
          <h1>Tasks</h1>
          <p>Track follow-ups from chats, sort by urgency, and keep support work organized.</p>
        </div>

        <div className="adminTasksHeaderActions">
          <button
            type="button"
            className="secondaryBtn adminToolBtn"
            onClick={() => setCategoryEditorOpen((prev) => !prev)}
          >
            <FiSettings />
            Categories
          </button>
          <button
            type="button"
            className="primaryBtn adminToolBtn"
            onClick={() => setTaskCreatorOpen((prev) => !prev)}
          >
            <FiPlus />
            {taskCreatorOpen ? 'Close task form' : 'New task'}
          </button>
          <button
            type="button"
            className="secondaryBtn adminToolBtn"
            onClick={() =>
              setFilters({
                status: 'all',
                priority: 'all',
                categoryId: 'all',
                sortBy: 'newest',
              })
            }
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="adminTaskFilterBar">
        <label className="adminTaskFilter">
          <span>
            <FiFilter /> Status
          </span>
          <AdminDropdown
            value={filters.status}
            placeholder="All statuses"
            options={[
              { value: 'all', label: 'All statuses' },
              ...Object.entries(taskStatusLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
            onChange={(nextValue) =>
              setFilters((prev) => ({
                ...prev,
                status: nextValue as SupportTaskStatus | 'all',
              }))
            }
          />
        </label>

        <label className="adminTaskFilter">
          <span>
            <FiFilter /> Priority
          </span>
          <AdminDropdown
            value={filters.priority}
            placeholder="All priorities"
            options={[
              { value: 'all', label: 'All priorities' },
              ...taskPriorityOrder.map((value) => ({
                value,
                label: taskPriorityLabels[value],
                accent: taskPriorityAccents[value].color,
                accentSoft: taskPriorityAccents[value].soft,
              })),
            ]}
            onChange={(nextValue) =>
              setFilters((prev) => ({
                ...prev,
                priority: nextValue as SupportTaskPriority | 'all',
              }))
            }
          />
        </label>

        <label className="adminTaskFilter">
          <span>
            <FiFilter /> Category
          </span>
          <AdminDropdown
            value={filters.categoryId}
            placeholder="All categories"
            options={[
              { value: 'all', label: 'All categories' },
              ...categoryOptions,
            ]}
            onChange={(nextValue) =>
              setFilters((prev) => ({
                ...prev,
                categoryId: nextValue,
              }))
            }
          />
        </label>

        <label className="adminTaskFilter">
          <span>
            <FiClock /> Sort by
          </span>
          <AdminDropdown
            value={filters.sortBy}
            placeholder="Newest first"
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
            ]}
            onChange={(nextValue) =>
              setFilters((prev) => ({
                ...prev,
                sortBy: nextValue as 'newest' | 'oldest',
              }))
            }
            />
        </label>
      </div>

      {taskCreatorOpen ? (
        <div className="adminTaskComposer">
          <div className="adminTaskComposerGrid">
            <label className="adminTaskField adminTaskFieldFull">
              <span>Task title</span>
              <input
                type="text"
                value={creatorDraft.title}
                onChange={(event) =>
                  setCreatorDraft((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Follow up on refund request"
              />
            </label>

            <label className="adminTaskField adminTaskFieldFull">
              <span>Description</span>
              <textarea
                value={creatorDraft.description}
                onChange={(event) =>
                  setCreatorDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={4}
                placeholder="Describe the issue, context, and the next step."
              />
            </label>

            <label className="adminTaskField">
              <span>Category</span>
              <AdminDropdown
                value={creatorDraft.categoryId}
                options={categoryOptions}
                onChange={(nextValue) =>
                  setCreatorDraft((prev) => ({ ...prev, categoryId: nextValue }))
                }
              />
            </label>

            <label className="adminTaskField">
              <span>Priority</span>
              <AdminDropdown
                value={creatorDraft.priority}
                options={taskPriorityOrder.map((value) => ({
                  value,
                  label: `${taskPriorityLabels[value]} priority`,
                  accent: taskPriorityAccents[value].color,
                  accentSoft: taskPriorityAccents[value].soft,
                }))}
                onChange={(nextValue) =>
                  setCreatorDraft((prev) => ({
                    ...prev,
                    priority: nextValue as SupportTaskPriority,
                  }))
                }
              />
            </label>

            <label className="adminTaskField">
              <span>Status</span>
              <AdminDropdown
                value={creatorDraft.status}
                options={Object.entries(taskStatusLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(nextValue) =>
                  setCreatorDraft((prev) => ({
                    ...prev,
                    status: nextValue as SupportTaskStatus,
                  }))
                }
              />
            </label>
          </div>

          <div className="adminTaskComposerActions">
            <button type="button" className="secondaryBtn" onClick={() => setTaskCreatorOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="primaryBtn"
              onClick={saveTask}
              disabled={
                creatorBusy ||
                !creatorDraft.title.trim() ||
                !creatorDraft.description.trim() ||
                !categories.length
              }
            >
              {creatorBusy ? 'Saving...' : 'Save task'}
            </button>
          </div>
        </div>
      ) : null}

      {categoryEditorOpen ? (
        <section className="adminCategoryPanel">
          <div className="adminSectionHeader compact">
            <div>
              <h2>Categories</h2>
              <p>Manage the default categories and add your own business-specific ones.</p>
            </div>
          </div>

          <div className="adminCategoryAddRow">
            <input
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Add new category"
            />
            <button
              type="button"
              className="secondaryBtn"
              onClick={addCategory}
              disabled={savingCategories}
            >
              Add
            </button>
          </div>

          <div className="adminCategoryPills">
            {categories.map((category) => (
              <div key={category.id} className="adminCategoryPill">
                <div>
                  <strong>{category.name}</strong>
                  {category.default ? <span>Default</span> : <span>Custom</span>}
                </div>
                <button
                  type="button"
                  className="ghostBtn"
                  onClick={() => removeCategory(category.id)}
                  disabled={savingCategories}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="adminTasksWorkspace">
        <section className="adminTaskList">
          {filteredTasks.length === 0 ? (
            <p>No tasks match the current filters.</p>
          ) : (
            filteredTasks.map((task) => {
              const isSelected = task.id === selectedTask?.id

              return (
                <button
                  key={task.id}
                  type="button"
                  className={`adminTaskCard adminTaskCardButton adminTaskCardStatus-${task.status} adminTaskCardPriority-${task.priority} ${isSelected ? 'adminTaskCardActive' : ''}`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="adminTaskCardTop">
                    <div>
                      <h3>{task.title}</h3>
                      <p className="adminTaskCardMetaLine">
                        <FiUser />
                        <span>{task.visitorName || 'Unnamed visitor'}</span>
                      </p>
                    </div>
                    <div className="adminTaskMeta">
                      <span className={`taskPriority taskPriority-${task.priority}`}>
                        {taskPriorityLabels[task.priority]} priority
                      </span>
                    </div>
                  </div>

                  <div className="adminTaskCardChips">
                    <span className={`taskStatus taskStatus-${task.status}`}>
                      {taskStatusLabels[task.status]}
                    </span>
                    <span className="taskCategoryChip">{task.categoryName}</span>
                  </div>

                  <p className="adminTaskCardPreview">{task.description}</p>
                  <div className="adminTaskCardFooter">
                    <span>{formatDate(task.createdAt)}</span>
                    <span>{task.comments?.length || 0} notes</span>
                  </div>
                </button>
              )
            })
          )}
        </section>

        {selectedTask ? (
          <section
            className={`adminTaskDetail adminTaskDetailStatus-${selectedTask.status}`}
            ref={detailScrollRef}
          >
            <div className="adminTaskDetailHeader">
              <div>
                <h2>{selectedTask.title}</h2>
                <p className="adminTaskDetailNote">{selectedTask.description}</p>
              </div>
              <div className="adminTaskDetailBadges">
                <span className={`taskPriority taskPriority-${selectedTask.priority}`}>
                  {taskPriorityLabels[selectedTask.priority]} priority
                </span>
                <span className={`taskStatus taskStatus-${selectedTask.status}`}>
                  {taskStatusLabels[selectedTask.status]}
                </span>
              </div>
            </div>

              <div className="adminTaskDetailMeta">
              <div>
                <span>
                  <FiClock /> Created
                </span>
                <strong>{formatDate(selectedTask.createdAt)}</strong>
              </div>
              <div>
                <span>
                  <FiUser /> Visitor
                </span>
                <strong>{selectedTask.visitorName || 'Unnamed visitor'}</strong>
              </div>
              <div>
                <span>
                  <FiTag /> Category
                </span>
                <strong>{selectedTask.categoryName}</strong>
              </div>
            </div>

            <div className="adminTaskDetailControls">
              <label className="adminTaskFilter">
                <span>Priority</span>
              <AdminDropdown
                value={selectedTask.priority}
                options={taskPriorityOrder.map((value) => ({
                  value,
                  label: taskPriorityLabels[value],
                  accent: taskPriorityAccents[value].color,
                  accentSoft: taskPriorityAccents[value].soft,
                }))}
                onChange={(nextValue) =>
                  void updateTaskField(
                      selectedTask.id,
                      'priority',
                      nextValue as SupportTaskPriority
                    )
                  }
                />
              </label>

              <label className="adminTaskFilter">
                <span>Status</span>
                <AdminDropdown
                  value={selectedTask.status}
                  options={Object.entries(taskStatusLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  onChange={(nextValue) =>
                    void updateTaskField(
                      selectedTask.id,
                      'status',
                      nextValue as SupportTaskStatus
                    )
                  }
                />
              </label>

              <label className="adminTaskFilter">
                <span>Category</span>
                <AdminDropdown
                  value={selectedTask.categoryId}
                  options={categoryOptions}
                  onChange={(nextValue) =>
                    void updateTaskField(selectedTask.id, 'categoryId', nextValue)
                  }
                />
              </label>
            </div>

            <details className="adminTaskFold">
              <summary>
                <span>
                  <FiMessageSquare /> Linked chat history
                </span>
                <span>{taskChatMessages.length ? `${taskChatMessages.length} messages` : 'No saved chat snapshot'}</span>
              </summary>
              <div className="adminTaskFoldBody">
                {taskChatMessages.length ? (
                  <div className="adminTaskHistoryList" ref={historyScrollRef}>
                    {taskChatMessages.map((message) => (
                      <article
                        key={message.id}
                        className={`adminTaskHistoryItem adminTaskHistoryItem-${message.role}`}
                      >
                        <strong>{speakerLabel(message.role)}</strong>
                        <p>{message.text}</p>
                        <span>{formatMessageTime(message.createdAt)}</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="adminTaskEmptyState">This task does not have a saved chat snapshot.</p>
                )}
              </div>
            </details>

            <details className="adminTaskFold">
              <summary>
                <span>Comments</span>
                <span>{selectedTask.comments?.length || 0} notes</span>
              </summary>
              <div className="adminTaskFoldBody">
                <div className="adminTaskCommentsList">
                {selectedTask.comments?.length ? (
                  selectedTask.comments.map((comment) => (
                    <article key={comment.id} className="adminTaskCommentItem">
                      <div>
                        <strong>{comment.createdByName || 'Support'}</strong>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p>{comment.text}</p>
                    </article>
                  ))
                  ) : (
                    <p className="adminTaskEmptyState">No comments yet.</p>
                  )}
                </div>

                <div className="adminTaskCommentComposer">
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Add a follow-up note or internal comment..."
                    rows={3}
                  />
                  <button
                    type="button"
                    className="primaryBtn adminSendButton"
                    onClick={addComment}
                    disabled={commentSaving || !commentText.trim()}
                  >
                    <span>{commentSaving ? 'Saving comment...' : 'Add comment'}</span>
                    <FiPlus />
                  </button>
                </div>
              </div>
            </details>
          </section>
        ) : (
          <section className="adminTaskDetail adminTaskDetailEmpty">
            <h2>No task selected</h2>
            <p>Pick a task from the list to view the chat history and update the work item.</p>
          </section>
        )}
      </div>
    </div>
  )
}
