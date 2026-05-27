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

function glassVars(primaryRgb: string, secondaryRgb: string, surfaceRgb: string, highlightRgb = '255, 255, 255') {
  return {
    '--chat-glass-primary-rgb': primaryRgb,
    '--chat-glass-secondary-rgb': secondaryRgb,
    '--chat-glass-surface-rgb': surfaceRgb,
    '--chat-glass-highlight-rgb': highlightRgb,
  }
}

export const WIDGET_THEME_VARS: Record<WidgetTheme, Record<string, string>> = {
  modern: {
    '--chat-primary': '#2563eb',
    '--chat-secondary': '#1e3a8a',
    '--chat-bg': '#ffffff',
    '--chat-bot-bg': '#eef2ff',
    '--chat-text': '#1f2937',
    '--chat-border': '#e5e7eb',
    '--chat-on-primary': '#ffffff',
    '--chat-on-secondary': '#ffffff',
    '--chat-on-bot': '#1f2937',
    '--chat-on-support': '#14532d',
    '--chat-on-system': '#991b1b',
    '--chat-header-action-bg': 'rgba(255, 255, 255, 0.18)',
    '--chat-header-action-border': 'rgba(255, 255, 255, 0.14)',
    '--chat-header-action-text': '#ffffff',
    '--chat-icon-shadow': 'rgba(59, 130, 246, 0.3)',
    '--chat-send-shadow': 'rgba(59, 130, 246, 0.24)',
    ...glassVars('37, 99, 235', '30, 58, 138', '238, 242, 255'),
  },
  chilling: {
    '--chat-primary': '#047857',
    '--chat-secondary': '#065f46',
    '--chat-bg': '#f0fdf4',
    '--chat-bot-bg': '#c5ffe2',
    '--chat-text': '#064e3b',
    '--chat-border': '#bbf7d0',
    '--chat-on-primary': '#ffffff',
    '--chat-on-secondary': '#ffffff',
    '--chat-on-bot': '#064e3b',
    '--chat-on-support': '#14532d',
    '--chat-on-system': '#991b1b',
    '--chat-header-action-bg': 'rgba(255, 255, 255, 0.18)',
    '--chat-header-action-border': 'rgba(255, 255, 255, 0.14)',
    '--chat-header-action-text': '#ffffff',
    '--chat-icon-shadow': 'rgba(16, 185, 129, 0.28)',
    '--chat-send-shadow': 'rgba(16, 185, 129, 0.22)',
    ...glassVars('4, 120, 87', '6, 95, 70', '197, 255, 226'),
  },
  corporate: {
    '--chat-primary': '#4b5563',
    '--chat-secondary': '#1f2937',
    '--chat-bg': '#f9fafb',
    '--chat-bot-bg': '#efefef',
    '--chat-text': '#111827',
    '--chat-border': '#d1d5db',
    '--chat-on-primary': '#ffffff',
    '--chat-on-secondary': '#ffffff',
    '--chat-on-bot': '#111827',
    '--chat-on-support': '#14532d',
    '--chat-on-system': '#991b1b',
    '--chat-header-action-bg': 'rgba(255, 255, 255, 0.18)',
    '--chat-header-action-border': 'rgba(255, 255, 255, 0.14)',
    '--chat-header-action-text': '#ffffff',
    '--chat-icon-shadow': 'rgba(107, 114, 128, 0.26)',
    '--chat-send-shadow': 'rgba(107, 114, 128, 0.2)',
    ...glassVars('75, 85, 99', '31, 41, 55', '239, 239, 239'),
  },
  luxury: {
    '--chat-primary': '#6d28d9',
    '--chat-secondary': '#4c1d95',
    '--chat-bg': '#faf5ff',
    '--chat-bot-bg': '#d8e4fb',
    '--chat-text': '#4c1d95',
    '--chat-border': '#e9d5ff',
    '--chat-on-primary': '#ffffff',
    '--chat-on-secondary': '#ffffff',
    '--chat-on-bot': '#4c1d95',
    '--chat-on-support': '#14532d',
    '--chat-on-system': '#991b1b',
    '--chat-header-action-bg': 'rgba(255, 255, 255, 0.18)',
    '--chat-header-action-border': 'rgba(255, 255, 255, 0.14)',
    '--chat-header-action-text': '#ffffff',
    '--chat-icon-shadow': 'rgba(124, 58, 237, 0.3)',
    '--chat-send-shadow': 'rgba(124, 58, 237, 0.22)',
    ...glassVars('109, 40, 217', '76, 29, 149', '216, 228, 251'),
  },
  'pink-blast': {
    '--chat-primary': '#f472b6',
    '--chat-secondary': '#f472b6',
    '--chat-bg': '#fff1f7',
    '--chat-bot-bg': '#ffdeee',
    '--chat-text': '#660b2f',
    '--chat-border': '#fbcfe8',
    '--chat-on-primary': '#ffffff',
    '--chat-on-secondary': '#ffffff',
    '--chat-on-bot': '#660b2f',
    '--chat-on-support': '#14532d',
    '--chat-on-system': '#991b1b',
    '--chat-header-action-bg': 'rgba(255, 255, 255, 0.18)',
    '--chat-header-action-border': 'rgba(255, 255, 255, 0.14)',
    '--chat-header-action-text': '#ffffff',
    '--chat-icon-shadow': 'rgba(244, 114, 182, 0.28)',
    '--chat-send-shadow': 'rgba(244, 114, 182, 0.22)',
    ...glassVars('244, 114, 182', '244, 114, 182', '255, 222, 238'),
  },
  'red-velvet': {
    '--chat-primary': '#d50101',
    '--chat-secondary': '#b91c1c',
    '--chat-bg': '#fff5f5',
    '--chat-bot-bg': '#fee2e2',
    '--chat-text': '#7f1d1d',
    '--chat-border': '#fecaca',
    '--chat-on-primary': '#ffffff',
    '--chat-on-secondary': '#ffffff',
    '--chat-on-bot': '#7f1d1d',
    '--chat-on-support': '#14532d',
    '--chat-on-system': '#991b1b',
    '--chat-header-action-bg': 'rgba(255, 255, 255, 0.18)',
    '--chat-header-action-border': 'rgba(255, 255, 255, 0.14)',
    '--chat-header-action-text': '#ffffff',
    '--chat-icon-shadow': 'rgba(185, 28, 28, 0.28)',
    '--chat-send-shadow': 'rgba(185, 28, 28, 0.22)',
    ...glassVars('213, 1, 1', '185, 28, 28', '254, 226, 226'),
  },
  'deep-blue': {
    '--chat-primary': '#002fcf',
    '--chat-secondary': '#001a75',
    '--chat-bg': '#eef4ff',
    '--chat-bot-bg': '#dbe8ff',
    '--chat-text': '#071a56',
    '--chat-border': '#b8ccff',
    '--chat-on-primary': '#ffffff',
    '--chat-on-secondary': '#ffffff',
    '--chat-on-bot': '#071a56',
    '--chat-on-support': '#14532d',
    '--chat-on-system': '#991b1b',
    '--chat-header-action-bg': 'rgba(255, 255, 255, 0.18)',
    '--chat-header-action-border': 'rgba(255, 255, 255, 0.14)',
    '--chat-header-action-text': '#ffffff',
    '--chat-icon-shadow': 'rgba(0, 47, 207, 0.3)',
    '--chat-send-shadow': 'rgba(0, 47, 207, 0.24)',
    ...glassVars('0, 47, 207', '0, 26, 117', '219, 232, 255'),
  },
  'banana-bonanza': {
    '--chat-primary': '#f59e0b',
    '--chat-secondary': '#92400e',
    '--chat-bg': '#fff8dc',
    '--chat-bot-bg': '#fff0a8',
    '--chat-text': '#713f12',
    '--chat-border': '#fde68a',
    '--chat-on-primary': '#3b2a10',
    '--chat-on-secondary': '#fffaf0',
    '--chat-on-bot': '#713f12',
    '--chat-on-support': '#14532d',
    '--chat-on-system': '#991b1b',
    '--chat-header-action-bg': 'rgba(255, 250, 240, 0.66)',
    '--chat-header-action-border': 'rgba(59, 42, 16, 0.12)',
    '--chat-header-action-text': '#3b2a10',
    '--chat-icon-shadow': 'rgba(245, 158, 11, 0.28)',
    '--chat-send-shadow': 'rgba(194, 65, 12, 0.22)',
    ...glassVars('245, 158, 11', '146, 64, 14', '255, 240, 168', '255, 250, 240'),
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
