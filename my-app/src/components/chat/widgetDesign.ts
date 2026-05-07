import type { CSSProperties } from 'react'

export type WidgetTheme =
  | 'modern'
  | 'chilling'
  | 'corporate'
  | 'luxury'
  | 'pink-blast'
  | 'red-velvet'
  | 'deep-blue'
  | 'banana-bonanza'

export const WIDGET_THEME_CLASS: Record<WidgetTheme, string> = {
  modern: 'theme-modern',
  chilling: 'theme-chilling',
  corporate: 'theme-corporate',
  luxury: 'theme-luxury',
  'pink-blast': 'theme-pink-blast',
  'red-velvet': 'theme-red-velvet',
  'deep-blue': 'theme-deep-blue',
  'banana-bonanza': 'theme-banana-bonanza',
}

export const WIDGET_THEME_VARS: Record<WidgetTheme, Record<string, string>> = {
  modern: {
    '--chat-primary': '#3b82f6',
    '--chat-secondary': '#1e40af',
    '--chat-bg': '#ffffff',
    '--chat-bot-bg': '#eef2ff',
    '--chat-text': '#1f2937',
    '--chat-border': '#e5e7eb',
  },
  chilling: {
    '--chat-primary': '#10b981',
    '--chat-secondary': '#047857',
    '--chat-bg': '#f0fdf4',
    '--chat-bot-bg': '#c5ffe2',
    '--chat-text': '#064e3b',
    '--chat-border': '#bbf7d0',
  },
  corporate: {
    '--chat-primary': '#6b7280',
    '--chat-secondary': '#374151',
    '--chat-bg': '#f9fafb',
    '--chat-bot-bg': '#efefef',
    '--chat-text': '#111827',
    '--chat-border': '#d1d5db',
  },
  luxury: {
    '--chat-primary': '#7c3aed',
    '--chat-secondary': '#5b21b6',
    '--chat-bg': '#faf5ff',
    '--chat-bot-bg': '#d8e4fb',
    '--chat-text': '#4c1d95',
    '--chat-border': '#e9d5ff',
  },
  'pink-blast': {
    '--chat-primary': '#f472b6',
    '--chat-secondary': '#be185d',
    '--chat-bg': '#fff1f7',
    '--chat-bot-bg': '#ffe0ef',
    '--chat-text': '#831843',
    '--chat-border': '#fbcfe8',
  },
  'red-velvet': {
    '--chat-primary': '#b91c1c',
    '--chat-secondary': '#7f1d1d',
    '--chat-bg': '#fff5f5',
    '--chat-bot-bg': '#fee2e2',
    '--chat-text': '#7f1d1d',
    '--chat-border': '#fecaca',
  },
  'deep-blue': {
    '--chat-primary': '#002fcf',
    '--chat-secondary': '#001a75',
    '--chat-bg': '#eef4ff',
    '--chat-bot-bg': '#dbe8ff',
    '--chat-text': '#071a56',
    '--chat-border': '#b8ccff',
  },
  'banana-bonanza': {
    '--chat-primary': '#f59e0b',
    '--chat-secondary': '#c2410c',
    '--chat-bg': '#fff8dc',
    '--chat-bot-bg': '#fff0a8',
    '--chat-text': '#713f12',
    '--chat-border': '#fde68a',
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
