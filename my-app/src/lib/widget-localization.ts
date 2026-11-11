import type { WidgetLanguage, WidgetLocalization } from '@/types/database'

export const WIDGET_LANGUAGES: Record<WidgetLanguage, string> = {
  no: 'Norsk', en: 'English', sv: 'Svenska', da: 'Dansk', de: 'Deutsch', fi: 'Suomi', is: 'Íslenska',
}
export function normalizeLocalization(value?: Partial<WidgetLocalization> | null): WidgetLocalization {
  const defaultLanguage = value?.defaultLanguage && Object.hasOwn(WIDGET_LANGUAGES, value.defaultLanguage) ? value.defaultLanguage : 'no'
  const allowedLanguages = [...new Set([defaultLanguage, ...(Array.isArray(value?.allowedLanguages) ? value.allowedLanguages : [])])]
    .filter((code): code is WidgetLanguage => Object.hasOwn(WIDGET_LANGUAGES, code))
  return { enabled: value?.enabled === true, defaultLanguage, allowedLanguages }
}

// Only visible copy is collected. Never send business knowledge, conversations or visitor data for UI translation.
export function collectWidgetCopy(value: unknown): string[] {
  const strings: string[] = []
  const fields = new Set(['title', 'description', 'label', 'prompt', 'text', 'handoffMessage', 'contactTitle', 'contactDescription', 'reviewTitle', 'reviewDescription', 'tasksTitle', 'tasksDescription', 'welcomeMessage', 'placeholder'])
  function visit(node: unknown, key = '') {
    if (typeof node === 'string' && (fields.has(key) || key === 'faqSuggestions') && node.trim()) strings.push(node)
    else if (Array.isArray(node)) node.forEach(item => visit(item, key))
    else if (node && typeof node === 'object') Object.entries(node).forEach(([name, item]) => visit(item, name))
  }
  visit(value)
  return [...new Set(strings)]
}
