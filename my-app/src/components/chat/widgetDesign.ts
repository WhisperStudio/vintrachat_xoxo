import type { CSSProperties } from 'react'

export type WidgetTheme = 'modern' | 'chilling' | 'corporate' | 'luxury'

export const WIDGET_THEME_CLASS: Record<WidgetTheme, string> = {
  modern: 'theme-modern',
  chilling: 'theme-chilling',
  corporate: 'theme-corporate',
  luxury: 'theme-luxury',
}

export const WIDGET_THEME_VARS: Record<WidgetTheme, Record<string, string>> = {
  modern: {
    '--chat-primary': '#3b82f6',
    '--chat-secondary': '#1e40af',
    '--chat-bg': '#ffffff',
    '--chat-text': '#1f2937',
    '--chat-border': '#e5e7eb',
  },
  chilling: {
    '--chat-primary': '#10b981',
    '--chat-secondary': '#047857',
    '--chat-bg': '#f0fdf4',
    '--chat-text': '#064e3b',
    '--chat-border': '#bbf7d0',
  },
  corporate: {
    '--chat-primary': '#6b7280',
    '--chat-secondary': '#374151',
    '--chat-bg': '#f9fafb',
    '--chat-text': '#111827',
    '--chat-border': '#d1d5db',
  },
  luxury: {
    '--chat-primary': '#7c3aed',
    '--chat-secondary': '#5b21b6',
    '--chat-bg': '#faf5ff',
    '--chat-text': '#4c1d95',
    '--chat-border': '#e9d5ff',
  },
}

export function getWidgetThemeClass(theme: WidgetTheme | string | undefined) {
  return WIDGET_THEME_CLASS[(theme as WidgetTheme) || 'modern'] || WIDGET_THEME_CLASS.modern
}

export function getWidgetThemeVars(theme: WidgetTheme | string | undefined) {
  return WIDGET_THEME_VARS[(theme as WidgetTheme) || 'modern'] || WIDGET_THEME_VARS.modern
}

export function getWidgetThemeStyle(theme: WidgetTheme | string | undefined): CSSProperties {
  return getWidgetThemeVars(theme) as CSSProperties
}

export function joinWidgetClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}
