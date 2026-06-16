'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChatWidgetRecord } from '@/types/database'

const ACTIVE_WIDGET_EVENT = 'vintra-active-widget-change'

function getStorageKey(businessId: string) {
  return `vintra-active-widget:${businessId}`
}

function readStoredWidgetKey(businessId: string) {
  if (typeof window === 'undefined' || !businessId) return ''
  return window.localStorage.getItem(getStorageKey(businessId)) || ''
}

export function setStoredActiveWidgetKey(businessId: string, widgetKey: string) {
  if (typeof window === 'undefined' || !businessId) return

  const storageKey = getStorageKey(businessId)

  if (widgetKey) {
    window.localStorage.setItem(storageKey, widgetKey)
  } else {
    window.localStorage.removeItem(storageKey)
  }

  window.dispatchEvent(
    new CustomEvent(ACTIVE_WIDGET_EVENT, {
      detail: {
        businessId,
        widgetKey,
      },
    })
  )
}

export function useActiveWidgetSelection(
  businessId: string | undefined,
  widgets: ChatWidgetRecord[],
  fallbackKey = ''
) {
  const [selectedWidgetKey, setSelectedWidgetKeyState] = useState('')

  const resolvedWidgetKey = useMemo(() => {
    const validKey =
      selectedWidgetKey && widgets.some((widget) => widget.widgetKey === selectedWidgetKey)
        ? selectedWidgetKey
        : ''

    if (validKey) return validKey

    const storedKey = businessId ? readStoredWidgetKey(businessId) : ''
    if (storedKey && widgets.some((widget) => widget.widgetKey === storedKey)) {
      return storedKey
    }

    if (fallbackKey && widgets.some((widget) => widget.widgetKey === fallbackKey)) {
      return fallbackKey
    }

    return widgets[0]?.widgetKey || ''
  }, [businessId, fallbackKey, selectedWidgetKey, widgets])

  useEffect(() => {
    if (!businessId) {
      setSelectedWidgetKeyState('')
      return
    }

    const syncFromStorage = () => {
      const storedKey = readStoredWidgetKey(businessId)

      if (storedKey && widgets.some((widget) => widget.widgetKey === storedKey)) {
        setSelectedWidgetKeyState(storedKey)
        return
      }

      if (fallbackKey && widgets.some((widget) => widget.widgetKey === fallbackKey)) {
        setSelectedWidgetKeyState(fallbackKey)
        return
      }

      setSelectedWidgetKeyState(widgets[0]?.widgetKey || '')
    }

    syncFromStorage()

    const syncFromEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ businessId: string; widgetKey: string }>).detail

      if (!detail || detail.businessId !== businessId) return
      setSelectedWidgetKeyState(detail.widgetKey || '')
    }

    window.addEventListener('storage', syncFromStorage)
    window.addEventListener(ACTIVE_WIDGET_EVENT, syncFromEvent)

    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener(ACTIVE_WIDGET_EVENT, syncFromEvent)
    }
  }, [businessId, fallbackKey, widgets])

  useEffect(() => {
    if (!businessId || !resolvedWidgetKey) return
    setStoredActiveWidgetKey(businessId, resolvedWidgetKey)
  }, [businessId, resolvedWidgetKey])

  const setSelectedWidgetKey = (widgetKey: string) => {
    if (!businessId) {
      setSelectedWidgetKeyState(widgetKey)
      return
    }

    setSelectedWidgetKeyState(widgetKey)
    setStoredActiveWidgetKey(businessId, widgetKey)
  }

  return {
    selectedWidgetKey: resolvedWidgetKey,
    setSelectedWidgetKey,
  }
}
