'use client'
import { useStudioCopy } from '@/components/chat/studio-copy'
import './DesignGroups.css'
import type { WidgetMotion } from '@/lib/widget-motion'
import { getMessageSurfaceClasses, getSurfaceClasses, type SurfaceBorder } from '@/lib/surface-design'
import { createLauncherArtwork, type LauncherBorder, type LauncherShape } from '@/lib/launcher-design'


import { WIDGET_THEME_VARS } from '@/components/chat/widgetDesign'
import { OrbIcon } from '@/components/chat/OrbIcon'

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type CSSProperties,
} from 'react'
import { FaRegLightbulb } from 'react-icons/fa'
import {
  FiChevronDown,
  FiChevronRight,
  FiCpu,
  FiDroplet,
  FiImage,
  FiLayout,
  FiLifeBuoy,
  FiLock,
  FiArrowLeft,
  FiEdit3,
  FiMessageCircle,
  FiMessageSquare,
  FiPhone,
  FiPlus,
  FiSend,
  FiSliders,
  FiTrash2,
} from 'react-icons/fi'
import IconPickerBubble from '@/components/IconPickerBubble'
import { chatWidgetStyleI18n, useVintraLanguage } from '@/lib/i18n'
import { defaultConversationCards } from '@/lib/conversation-cards'
import { isPlanFeatureAvailable } from '@/lib/subscription'
import { renderWidgetIcon } from '@/lib/widget-icons'
import type { AssistantConversationCard, BubbleIconChoice, ChatWidgetInterfaceIcons, OrbStyleConfig } from '@/types/database'
import './StyleSelector.css'

type ColorTheme =
  | 'modern'
  | 'chilling'
  | 'corporate'
  | 'luxury'
  | 'pink-blast'
  | 'red-velvet'
  | 'deep-blue'
  | 'banana-bonanza'
type Plan = 'free' | 'pro' | 'business'
type Position = 'bottom-right' | 'bottom-left'
type BorderType = 'none' | 'solid' | 'rounded' | 'shadow'
type CornerStyle = 'rounded' | 'square'
type ShadowType = 'none' | 'light' | 'medium' | 'heavy'
type AnimationType = 'none' | 'bounce' | 'fade' | 'slide'
type SizeType = 'small' | 'medium' | 'large'
type MessageStyle = 'bubble' | 'flat' | 'card'
type InputStyle = 'flat' | 'rounded' | 'outlined'
type StarterCardsLayout = 'grid' | 'list' | 'stack'
type PreviewHoverTarget = 'bubble' | 'header' | 'body' | 'footer' | null

type LogoStyle = {
  zoom: number
  focusX: number
  focusY: number
}

type CustomBranding = {
  title?: string
  description?: string
  logo?: string
  logoStyle?: LogoStyle
}

type GlassRadioOption<T extends string> = {
  value: T
  label: string
  description?: string
  swatches?: string[]
}

interface StyleSelectorProps {
  bubbleStyle: {
    showStatus: boolean
    iconChoice: BubbleIconChoice
    borderType: LauncherBorder
    shape?: LauncherShape
    shadowType: ShadowType
    animationType: AnimationType
    sizeType: SizeType
    orbStyle?: OrbStyleConfig
  }
  headerStyle: {
    borderLine?: 'none' | 'solid' | 'dashed' | 'double' | 'wavy'
    showStatus: boolean
    showCloseButton: boolean
    borderType: BorderType
    cornerStyle?: CornerStyle
    showBorder?: boolean
    shadowType: ShadowType
    showAvatar: boolean
    showTitle: boolean
  }
  bodyStyle: {
    messageCornerStyle?: 'rounded' | 'square'
    messageBorderLine?: 'none' | 'solid' | 'dashed' | 'double' | 'wavy'
    borderLine?: 'none' | 'solid' | 'dashed' | 'double' | 'wavy'
    cornerStyle?: 'rounded' | 'square'
    borderType: BorderType
    shadowType: ShadowType
    messageStyle: MessageStyle
    showTimestamps: boolean
    showReadReceipts: boolean
    showConversationCards: boolean
    conversationCardsLayout: StarterCardsLayout
    conversationCardsStyle: 'modern' | 'minimal' | 'bubble' | 'image' | 'chips'
  }
  footerStyle: {
    borderLine?: 'none' | 'solid' | 'dashed' | 'double' | 'wavy'
    showSendButton: boolean
    borderType: BorderType
    cornerStyle?: CornerStyle
    showBorder?: boolean
    shadowType: ShadowType
    inputStyle: InputStyle
    showPlaceholder: boolean
  }
  appearance: {
    openAnimation?: 'none' | 'fade' | 'slide' | 'pop' | 'bounce'
    sentAnimation?: 'none' | 'fade' | 'slide' | 'pop' | 'bounce'
    receivedAnimation?: 'none' | 'fade' | 'slide' | 'pop' | 'bounce'
    glassLookEnabled: boolean
  }
  onBubbleStyleChange: (style: StyleSelectorProps['bubbleStyle']) => void
  onHeaderStyleChange: (style: StyleSelectorProps['headerStyle']) => void
  onBodyStyleChange: (style: StyleSelectorProps['bodyStyle']) => void
  onFooterStyleChange: (style: StyleSelectorProps['footerStyle']) => void
  onAppearanceChange: (appearance: StyleSelectorProps['appearance']) => void
  colorTheme: ColorTheme
  plan: Plan
  position: Position
  widgetIcons: ChatWidgetInterfaceIcons
  customBranding: CustomBranding
  settings: {
    autoOpen: boolean
    delayMs: number
  }
  conversationCardsEnabled: boolean
  conversationCardsLimit: number
  conversationCards: AssistantConversationCard[]
  onColorThemeChange: (theme: ColorTheme) => void
  onPositionChange: (position: Position) => void
  onWidgetIconsChange: (icons: ChatWidgetInterfaceIcons) => void
  onCustomBrandingChange: (branding: CustomBranding) => void
  onSettingsChange: (settings: any) => void
  onConversationCardsEnabledChange: (enabled: boolean) => void
  onConversationCardsLimitChange: (limit: number) => void
  onConversationCardsChange: (cards: AssistantConversationCard[]) => void
  onPreviewHoverChange?: (section: PreviewHoverTarget) => void
  openSections: {
    bubble: boolean
    header: boolean
    body: boolean
    footer: boolean
    colorTheme: boolean
    icons: boolean
    branding: boolean
    advanced: boolean
  }
  onToggleSection: (
    section: 'bubble' | 'header' | 'body' | 'footer' | 'colorTheme' | 'icons' | 'branding' | 'advanced'
  ) => void
}

const colorThemeInfo: Record<ColorTheme, { label: string; description: string; noLabel: string; noDescription: string }> = {
  modern: { label: 'Nordic blue', description: 'Calm blue, clear surfaces', noLabel: 'Nordisk blå', noDescription: 'Rolig blå med lyse flater' },
  chilling: { label: 'Forest', description: 'Welcoming, natural greens', noLabel: 'Skog', noDescription: 'Vennlige, naturlige grønntoner' },
  corporate: { label: 'Graphite', description: 'Quiet, neutral and precise', noLabel: 'Grafitt', noDescription: 'Diskret, nøytralt og tydelig' },
  luxury: { label: 'Plum', description: 'Deep purple, soft accents', noLabel: 'Plomme', noDescription: 'Dyp lilla med myke nyanser' },
  'pink-blast': { label: 'Rose', description: 'Warm rose with clear contrast', noLabel: 'Rose', noDescription: 'Varm rosa med tydelig kontrast' },
  'red-velvet': { label: 'Ruby', description: 'Rich reds, light backgrounds', noLabel: 'Rubin', noDescription: 'Dype rødtoner på lys bakgrunn' },
  'deep-blue': { label: 'Ocean', description: 'Distinctive, deep blue', noLabel: 'Hav', noDescription: 'Et tydelig uttrykk i dyp blå' },
  'banana-bonanza': { label: 'Amber', description: 'Warm gold and dark lettering', noLabel: 'Rav', noDescription: 'Varm gyllen farge med mørk tekst' },
}

const iconChoices: Array<{
  value: StyleSelectorProps['bubbleStyle']['iconChoice']
  label: string
  icon: ReactNode
}> = [
  { value: 'chat', label: 'Chat', icon: <FiMessageCircle /> },
  { value: 'phone', label: 'Phone', icon: <FiPhone /> },
  { value: 'cpu', label: 'Robot', icon: <FiCpu /> },
  { value: 'message', label: 'Message', icon: <FiMessageSquare /> },
  { value: 'support', label: 'Support', icon: <FiLifeBuoy /> },
  { value: 'orb', label: 'Orb', icon: <span className="iconChoiceOrbPreview" aria-hidden="true" /> },
]

const launcherIconChoiceMap: Partial<Record<BubbleIconChoice, string>> = {
  chat: 'FiMessageCircle',
  phone: 'FiPhone',
  cpu: 'FiCpu',
  message: 'FiMessageSquare',
  support: 'FiLifeBuoy',
}

const sectionIconFields = {
  bubble: [
    { field: 'launcherIcon' as const, label: 'Chat bubble', helper: 'Floating launch button when orb mode is not active.' },
  ],
  header: [
    { field: 'avatarIcon' as const, label: 'Avatar', helper: 'Header avatar when no logo is uploaded.' },
    { field: 'closeIcon' as const, label: 'Close', helper: 'Close button in the chat header.' },
    { field: 'backIcon' as const, label: 'Go back', helper: 'Back button inside starter-card option flows.' },
  ],
  body: [
    { field: 'heroIcon' as const, label: 'Hero', helper: 'Starter-card welcome icon and hero fallback.' },
    { field: 'aiIcon' as const, label: 'AI', helper: 'Assistant message and typing indicator icon.' },
    { field: 'supportIcon' as const, label: 'Support', helper: 'Human support message icon.' },
    { field: 'userIcon' as const, label: 'User', helper: 'Visitor message icon.' },
  ],
  footer: [
    { field: 'sendIcon' as const, label: 'Send', helper: 'Message composer send button.' },
  ],
}

function OptionDesc({ children }: { children: ReactNode }) {
  return (
    <span className="option-desc">
      <FaRegLightbulb className="option-desc-icon" aria-hidden="true" focusable="false" />
      <span className="option-desc-text">{children}</span>
    </span>
  )
}

function SectionLabel({
  icon,
  tone = 'neutral',
  children,
}: {
  icon: ReactNode
  tone?: 'neutral' | 'green' | 'gray' | 'colorful' | 'red'
  children: ReactNode
}) {
  return (
    <span className="label section-label">
      <span className={`section-label-icon section-label-icon--${tone}`} aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </span>
  )
}

function GlassRadioRow<T extends string>({
  name,
  value,
  options,
  onChange,
  renderPreview,
}: {
  name: string
  value: T
  options: Array<GlassRadioOption<T>>
  onChange: (value: T) => void
  renderPreview?: (value: T) => ReactNode
}) {
  const rowRef = useRef<HTMLDivElement | null>(null)
  const [indicator, setIndicator] = useState({ left: 0, top: 0, width: 0, height: 0 })
  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    const update = () => {
      const active = row.querySelector<HTMLButtonElement>('[aria-checked="true"]')
      if (!active) return
      const next = { left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight }
      setIndicator(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(row)
    for (const button of row.querySelectorAll('button')) observer.observe(button)
    return () => observer.disconnect()
  }, [value, options])
  return (
    <div ref={rowRef} className={`glassRadioRow ${renderPreview ? 'glassRadioRow--visual' : ''}`} style={renderPreview ? { '--visual-options': Math.min(options.length, 4) } as CSSProperties : undefined} role="radiogroup" aria-label={name}>
      <span className="glassRadioIndicator" aria-hidden="true" style={{ transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`, width: indicator.width, height: indicator.height, opacity: indicator.width ? 1 : 0 }} />
      {options.map((option, index) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className={`glassRadioButton ${active ? 'active' : ''}`}
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(event) => {
              const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0
              if (!direction && event.key !== 'Home' && event.key !== 'End') return
              event.preventDefault()
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + direction + options.length) % options.length
              onChange(options[next].value)
              ;(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next])?.focus()
            }}
            onClick={() => onChange(option.value)}
          >
            {renderPreview && <span className="widget-option-preview" aria-hidden="true">{renderPreview(option.value)}</span>}
            <span>{option.label}</span>
            {option.swatches ? (
              <span className="glassRadioSwatches" aria-hidden="true">
                {option.swatches.map((swatch, swatchIndex) => (
                  <span key={`${option.value}-${swatchIndex}`} className="glassRadioSwatch" style={{ backgroundColor: swatch }} />
                ))}
              </span>
            ) : null}
            {option.description ? <span className="glassRadioDescription">{option.description}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

const defaultLogoStyle: LogoStyle = {
  zoom: 100,
  focusX: 50,
  focusY: 50,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function resolveCornerStyle(style: { borderType: BorderType; cornerStyle?: CornerStyle }) {
  if (style.cornerStyle) return style.cornerStyle
  return style.borderType === 'rounded' ? 'rounded' : 'square'
}

function resolveShowBorder(style: { borderType: BorderType; showBorder?: boolean }) {
  if (typeof style.showBorder === 'boolean') return style.showBorder
  return style.borderType === 'solid' || style.borderType === 'rounded'
}

function getLegacyBorderType(showBorder: boolean, cornerStyle: CornerStyle): BorderType {
  if (!showBorder) return 'none'
  return cornerStyle === 'rounded' ? 'rounded' : 'solid'
}

function normalizeLogoStyle(style?: Partial<LogoStyle>) {
  return {
    zoom: clamp(Number(style?.zoom || 100), 80, 180),
    focusX: clamp(Number(style?.focusX || 50), 0, 100),
    focusY: clamp(Number(style?.focusY || 50), 0, 100),
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read the image file'))
    reader.readAsDataURL(file)
  })
}

function LogoUploadEditor({
  branding,
  onChange,
}: {
  branding: CustomBranding
  onChange: (branding: CustomBranding) => void
}) {
  const copy = useStudioCopy()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDraggingFocus, setIsDraggingFocus] = useState(false)
  const [error, setError] = useState('')

  const logoStyle = normalizeLogoStyle({
    ...defaultLogoStyle,
    ...(branding.logoStyle || {}),
  })

  const updateBranding = (patch: Partial<CustomBranding>) => {
    onChange({
      ...branding,
      ...patch,
    })
  }

  const updateLogoStyle = (patch: Partial<LogoStyle>) => {
    updateBranding({
      logoStyle: {
        ...normalizeLogoStyle(logoStyle),
        zoom: clamp(Number(patch.zoom ?? logoStyle.zoom), 80, 180),
        focusX: clamp(Number(patch.focusX ?? logoStyle.focusX), 0, 100),
        focusY: clamp(Number(patch.focusY ?? logoStyle.focusY), 0, 100),
      },
    })
  }

  const setLogoFromFile = async (file?: File | null) => {
    if (!file) return

    if (file.type !== 'image/png') {
      setError('Last opp en PNG-fil.')
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      updateBranding({
        logo: dataUrl,
        logoStyle: defaultLogoStyle,
      })
      setError('')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload the image')
    }
  }

  const applyFocusFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return

    updateLogoStyle({
      focusX: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      focusY: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    })
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    await setLogoFromFile(event.dataTransfer.files?.[0])
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await setLogoFromFile(event.target.files?.[0])
    event.target.value = ''
  }

  return (
    <div className="logoEditor">
      <input ref={fileInputRef} type="file" accept="image/png" onChange={handleFileChange} className="logoEditorInput" aria-label="Last opp logo (PNG)" />

      <div
        className={`logoEditorDropzone ${isDragOver ? 'is-dragging' : ''} ${branding.logo ? 'has-image' : 'empty'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        {branding.logo ? (
          <div
            ref={previewRef}
            className={`logoEditorPreview ${isDraggingFocus ? 'is-dragging' : ''}`}
            onPointerDown={(event) => {
              event.preventDefault()
              setIsDraggingFocus(true)
              applyFocusFromPointer(event)
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (isDraggingFocus) applyFocusFromPointer(event)
            }}
            onPointerUp={(event) => {
              setIsDraggingFocus(false)
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
              }
            }}
            onPointerCancel={() => setIsDraggingFocus(false)}
            onPointerLeave={() => setIsDraggingFocus(false)}
          >
            <div
              className="logoEditorImage"
              aria-hidden="true"
              style={{
                backgroundImage: `url(${branding.logo})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${logoStyle.zoom}% ${logoStyle.zoom}%`,
                backgroundPosition: `${logoStyle.focusX}% ${logoStyle.focusY}%`,
              }}
            />
            <div className="logoEditorHint">{copy("Drag inside the circle to reposition")}</div>
          </div>
        ) : (
          <div className="logoEditorPlaceholder">
            <FiImage className="logoEditorPlaceholderIcon" />
            <strong>{copy("Drop a PNG logo here")}</strong>
            <span>{copy("or click to choose a file")}</span>
          </div>
        )}
      </div>

      <div className="logoEditorControls">
        <label className="branding-field">
          <span>Zoom</span>
          <input type="range" min="80" max="180" step="1" value={logoStyle.zoom} onChange={(event) => updateLogoStyle({ zoom: Number(event.target.value) })} disabled={!branding.logo} />
        </label>

        <div className="logoEditorGrid">
          <label className="branding-field">
            <span>{copy("Horizontal position")}</span>
            <input type="range" min="0" max="100" step="1" value={logoStyle.focusX} onChange={(event) => updateLogoStyle({ focusX: Number(event.target.value) })} disabled={!branding.logo} />
          </label>

          <label className="branding-field">
            <span>{copy("Vertical position")}</span>
            <input type="range" min="0" max="100" step="1" value={logoStyle.focusY} onChange={(event) => updateLogoStyle({ focusY: Number(event.target.value) })} disabled={!branding.logo} />
          </label>
        </div>

        <div className="logoEditorActions">
          <button type="button" className="logoEditorAction" onClick={() => updateBranding({ logo: undefined })} disabled={!branding.logo}>{copy("Remove logo")}</button>
          <button type="button" className="logoEditorAction secondary" onClick={() => updateLogoStyle(defaultLogoStyle)} disabled={!branding.logo}>{copy("Reset crop")}</button>
        </div>

        <p className="logoEditorMeta">{copy("PNG only. Drop a file, then drag within the circle or adjust the sliders.")}</p>
        {error ? <p className="logoEditorError">{error}</p> : null}
      </div>
    </div>
  )
}

function StarterCardEditor({
  card,
  index,
  disabled,
  style,
  onChange,
  onRemove,
}: {
  card: AssistantConversationCard
  index: number
  disabled: boolean
  style: StyleSelectorProps['bodyStyle']['conversationCardsStyle']
  onChange: (nextCard: AssistantConversationCard) => void
  onRemove: () => void
}) {
  const { language } = useVintraLanguage()
  const copy = useStudioCopy()
  const [activeField, setActiveField] = useState<'icon' | 'title' | 'description' | 'image' | null>(null)

  const updateOption = (optionIndex: number, patch: Partial<AssistantConversationCard['options'][number]>) => {
    onChange({
      ...card,
      options: card.options.map((option, index) => (index === optionIndex ? { ...option, ...patch } : option)),
    })
  }

  const addOption = () => {
    onChange({
      ...card,
      options: [
        ...card.options,
        {
          label: `${language === 'no' ? 'Valg' : 'Option'} ${card.options.length + 1}`,
          prompt: copy("How can you help me?"),
          description: '',
        },
      ],
    })
  }

  return (
    <article className={`starterCardEditor ${disabled ? 'is-disabled' : ''}`}>
      <div className="starterCardEditor__header">
        <div>
          <span className="starterCardEditor__eyebrow">{language === 'no' ? 'Kort' : 'Card'} {index + 1}</span>
          <strong>{card.title || `${language === 'no' ? 'Kort' : 'Card'} ${index + 1}`}</strong>
        </div>
        <button type="button" className="starterCardEditor__remove" onClick={onRemove} disabled={disabled}>
          <FiTrash2 aria-hidden="true" />{copy("Remove")}</button>
      </div>

      <div className={`starterCardVisual starterCardVisual--${style}`}>
        <button type="button" className="starterCardVisual__field starterCardVisual__icon" onClick={() => setActiveField(activeField === 'icon' ? null : 'icon')} disabled={disabled || style === 'image'} aria-label={copy("Edit card icon")}>
          {renderWidgetIcon(card.icon, { 'aria-hidden': true }) || <FiMessageCircle aria-hidden="true" />}
          <span className="starterCardVisual__edit"><FiEdit3 aria-hidden="true" /></span>
        </button>
        <div className="starterCardVisual__copy">
          <button type="button" className="starterCardVisual__field starterCardVisual__title" onClick={() => setActiveField(activeField === 'title' ? null : 'title')} disabled={disabled}>
            <span>{card.title || copy("Untitled card")}</span><FiEdit3 aria-hidden="true" />
          </button>
          <button type="button" className="starterCardVisual__field starterCardVisual__description" onClick={() => setActiveField(activeField === 'description' ? null : 'description')} disabled={disabled}>
            <span>{card.description || copy("Add a short description")}</span><FiEdit3 aria-hidden="true" />
          </button>
        </div>
      </div>

      {activeField === 'title' ? (
        <label className="starterCardInlineEditor">
          <span>{copy("Edit title")}</span>
          <input autoFocus type="text" value={card.title} disabled={disabled} onChange={(event) => onChange({ ...card, title: event.target.value })} placeholder={copy("Opening hours")} />
        </label>
      ) : null}

      {activeField === 'description' ? (
        <label className="starterCardInlineEditor">
          <span>{copy("Edit description")}</span>
          <input autoFocus type="text" value={card.description} disabled={disabled} onChange={(event) => onChange({ ...card, description: event.target.value })} placeholder={copy("Help visitors choose the right topic.")} />
        </label>
      ) : null}

      {activeField === 'icon' ? (
        <IconPickerBubble
          label={copy("Card icon")}
          value={card.icon || ''}
          onChange={(nextValue) => onChange({ ...card, icon: nextValue })}
          helperText={copy("Shown on the starter card unless the card is image-first.")}
          disabled={disabled || style === 'image'}
        />
      ) : null}

      <button type="button" className="starterCardImageToggle" onClick={() => setActiveField(activeField === 'image' ? null : 'image')} disabled={disabled}>
        <FiImage aria-hidden="true" /> {card.image ? copy("Edit card image") : copy("Add card image")} <FiChevronDown aria-hidden="true" />
      </button>
      {activeField === 'image' ? (
        <label className="starterCardInlineEditor">
          <span>{copy("Image URL")}</span>
          <input autoFocus type="url" value={card.image || ''} disabled={disabled} onChange={(event) => onChange({ ...card, image: event.target.value })} placeholder="https://..." />
        </label>
      ) : null}

      <div className="starterOptionsEditor">
        <div className="starterOptionsEditor__header">
          <div><strong>{copy("Options")}</strong><span>{card.options.length} {language === 'no' ? 'valg under dette kortet' : 'options under this card'}</span></div>
          <button type="button" onClick={addOption} disabled={disabled}><FiPlus aria-hidden="true" />{copy("Add option")}</button>
        </div>
        <div className="starterOptionsEditor__list">
          {card.options.map((option, optionIndex) => (
            <div className="starterOptionRow" key={`${card.id}-option-${optionIndex}`}>
              <span className="starterOptionRow__branch" aria-hidden="true" />
              <div className="starterOptionRow__fields">
                <label><span><FiEdit3 aria-hidden="true" />{copy("Label")}</span><input value={option.label} disabled={disabled} onChange={(event) => updateOption(optionIndex, { label: event.target.value })} /></label>
                <label><span><FiSend aria-hidden="true" />{copy("Message sent")}</span><input value={option.prompt} disabled={disabled} onChange={(event) => updateOption(optionIndex, { prompt: event.target.value })} /></label>
                <label className="starterOptionRow__description"><span><FiMessageSquare aria-hidden="true" />{copy("Description")}</span><input value={option.description || ''} disabled={disabled} onChange={(event) => updateOption(optionIndex, { description: event.target.value || undefined })} placeholder={copy("Optional")} /></label>
              </div>
              <button type="button" className="starterOptionRow__remove" onClick={() => onChange({ ...card, options: card.options.filter((_, currentIndex) => currentIndex !== optionIndex) })} disabled={disabled} aria-label={`${language === 'no' ? 'Fjern valg' : 'Remove option'} ${optionIndex + 1}`}><FiTrash2 aria-hidden="true" /></button>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function StyleSelector({
  bubbleStyle,
  headerStyle,
  bodyStyle,
  footerStyle,
  appearance,
  onBubbleStyleChange,
  onHeaderStyleChange,
  onBodyStyleChange,
  onFooterStyleChange,
  onAppearanceChange,
  colorTheme,
  plan,
  position,
  widgetIcons,
  customBranding,
  settings,
  conversationCardsEnabled,
  conversationCardsLimit,
  conversationCards,
  onColorThemeChange,
  onPositionChange,
  onWidgetIconsChange,
  onCustomBrandingChange,
  onSettingsChange,
  onConversationCardsEnabledChange,
  onConversationCardsLimitChange,
  onConversationCardsChange,
  onPreviewHoverChange,
  openSections,
  onToggleSection,
}: StyleSelectorProps) {
  const { language } = useVintraLanguage()
  const copy = useStudioCopy()
  const text = chatWidgetStyleI18n[language]
  const renderLauncherPreview = (kind: 'border' | 'shape' | 'shadow' | 'animation' | 'size', value: string) => {
    // Use the real launcher's CSS so samples also follow future export changes.
    const classes = [
      'widget-icon',
      `border-${kind === 'border' ? value : kind === 'shadow' ? 'none' : bubbleStyle.borderType}`,
      kind === 'border' ? '' : `shadow-${kind === 'shadow' ? value : bubbleStyle.shadowType}`,
      `size-${kind === 'size' ? value : 'medium'}`,
      `animation-${kind === 'animation' ? value : 'none'}`,
    ].filter(Boolean).join(' ')
    const fallback = { chat: 'FiMessageCircle', phone: 'FiPhone', cpu: 'FiCpu', message: 'FiMessageSquare', support: 'FiLifeBuoy', orb: '' }[bubbleStyle.iconChoice]
    return (
      <span className="widget-option-demo widget-option-demo--launcher vintra-widget" data-preview-kind={kind} data-preview-value={value} style={WIDGET_THEME_VARS[colorTheme] as CSSProperties}>
        <span className={`${classes} launcher-custom`}><span dangerouslySetInnerHTML={{ __html: createLauncherArtwork(kind === 'border' ? value : bubbleStyle.borderType, kind === 'shape' ? value : bubbleStyle.shape) }} />
          <span className="widget-icon-inner">{bubbleStyle.iconChoice === 'orb' ? <OrbIcon /> : renderWidgetIcon(widgetIcons.launcherIcon || fallback, { 'aria-hidden': true }) || <FiMessageCircle />}</span>
        </span>
        <span className="widget-option-target-caption">{kind === 'animation' ? (value === 'none' ? (language === 'no' ? 'Stille' : 'Still') : value === 'bounce' ? '\u2195' : value === 'slide' ? '\u2192' : (language === 'no' ? 'Ton inn' : 'Fade in')) : kind === 'shadow' ? (language === 'no' ? 'Skygge under' : 'Shadow below') : kind === 'shape' ? (language === 'no' ? 'Ytre form' : 'Outer shape') : kind === 'size' ? (language === 'no' ? 'Knappest\u00f8rrelse' : 'Button size') : (language === 'no' ? 'Kant rundt' : 'Outline') }</span>
      </span>
    )
  }
  const motionOptions = [
    { value: 'none', label: text.options.none }, { value: 'fade', label: language === 'no' ? 'Ton inn' : 'Fade in' },
    { value: 'slide', label: language === 'no' ? 'Gli inn' : 'Slide in' }, { value: 'pop', label: language === 'no' ? 'Zoom inn' : 'Pop in' },
    { value: 'bounce', label: language === 'no' ? 'Sprett' : 'Bounce' },
  ]
  const renderMotionControl = (field: 'openAnimation' | 'sentAnimation' | 'receivedAnimation') => (
    <div className="option-card option-card--radio">
      <span className="option-title">{field === 'openAnimation' ? (language === 'no' ? 'N\u00e5r chatten \u00e5pnes' : 'When the chat opens') : field === 'sentAnimation' ? (language === 'no' ? 'N\u00e5r en melding sendes' : 'When a message is sent') : (language === 'no' ? 'N\u00e5r et svar mottas' : 'When a reply arrives')}</span>
      <OptionDesc>{language === 'no' ? 'Hold over et valg eller bruk tastaturet for \u00e5 se bevegelsen. Test ogs\u00e5 i chatten til h\u00f8yre.' : 'Hover or focus an option to preview the movement. You can also try it in the chat preview.'}</OptionDesc>
      <GlassRadioRow name={field} value={appearance[field] || 'none'} options={motionOptions} onChange={(value) => onAppearanceChange({ ...appearance, [field]: value as WidgetMotion })} renderPreview={(value) => (
        <span className={'motion-demo motion-demo--' + field + ' motion-demo--' + value}>
          <span className="motion-demo-stage"><span className="motion-demo-target">{field === 'openAnimation' ? <><span className="motion-demo-header" /><span className="motion-demo-line" /><span className="motion-demo-line" /></> : <><i /><i /></>}</span></span>
          <span className="widget-option-target-caption">{field === 'openAnimation' ? (language === 'no' ? 'Chatvindu' : 'Chat window') : field === 'sentAnimation' ? (language === 'no' ? 'Din melding' : 'Your message') : (language === 'no' ? 'Svar fra boten' : 'Bot reply')}</span>
        </span>
      )} />
    </div>
  )
  const surfaceBorders = [{ value: 'none', label: text.options.none }, { value: 'solid', label: language === 'no' ? 'Enkel linje' : 'Single line' }, { value: 'dashed', label: language === 'no' ? 'Stiplet' : 'Dashed' }, { value: 'double', label: language === 'no' ? 'Dobbel linje' : 'Double line' }, { value: 'wavy', label: language === 'no' ? 'B\u00f8lget' : 'Wavy' }]
  const surfaceValue = (style: Parameters<typeof getSurfaceClasses>[0]) => getSurfaceClasses(style).split(' ')[0].replace('surface-edge-', '')
  const renderChatSurfacePreview = (section: 'header' | 'body' | 'footer', kind: 'corner' | 'border' | 'shadow' | 'message' | 'message-corner' | 'message-border' | 'input', value: string) => {
    const headerCorners = section === 'header' && kind === 'corner' ? value : resolveCornerStyle(headerStyle)
    const headerBorder = section === 'header' && kind === 'border' ? value === 'on' : resolveShowBorder(headerStyle)
    const headerShadow = section === 'header' && kind === 'shadow' ? value : 'none'
    const footerCorners = section === 'footer' && kind === 'corner' ? value : resolveCornerStyle(footerStyle)
    const footerBorder = section === 'footer' && kind === 'border' ? value === 'on' : resolveShowBorder(footerStyle)
    const footerShadow = section === 'footer' && kind === 'shadow' ? value : 'none'
    return (
      <span className="widget-option-demo widget-option-demo--surface vintra-widget" style={WIDGET_THEME_VARS[colorTheme] as CSSProperties}>
        <span className={`widget-option-chat widget-option-chat--${section}`} data-preview-kind={kind}>
          <span className={`widget-option-chat-header ${getSurfaceClasses({ ...headerStyle, borderLine: section === 'header' && kind === 'border' ? value as SurfaceBorder : 'none', cornerStyle: headerCorners })} header-corners-${headerCorners} header-border-${headerBorder ? 'on' : 'off'} header-shadow-${headerShadow}`}>
            <FiMessageCircle />{section === 'header' ? <span className="widget-option-chat-title">{customBranding.title || 'Support Chat'}</span> : <span className="widget-option-chat-heading" />}<span>×</span>
          </span>
          <span className={`widget-option-chat-messages ${getSurfaceClasses({ ...bodyStyle, borderLine: section === 'body' && kind === 'border' ? value as SurfaceBorder : 'none', cornerStyle: section === 'body' && kind === 'corner' ? value : bodyStyle.cornerStyle })} ${section === 'body' && kind === 'shadow' ? `shadow-${value}` : ''}`}>
            <span className={`widget-option-message ${getMessageSurfaceClasses({ ...bodyStyle, messageCornerStyle: kind === 'message-corner' ? value : bodyStyle.messageCornerStyle, messageBorderLine: kind === 'message-border' ? value as SurfaceBorder : bodyStyle.messageBorderLine })} widget-option-message--${kind === 'message' ? value : bodyStyle.messageStyle}`}><i /><i /></span>
            <span className={`widget-option-message ${getMessageSurfaceClasses({ ...bodyStyle, messageCornerStyle: kind === 'message-corner' ? value : bodyStyle.messageCornerStyle, messageBorderLine: kind === 'message-border' ? value as SurfaceBorder : bodyStyle.messageBorderLine })} widget-option-message--user`}><i /></span>
          </span>
          <span className={`widget-option-chat-footer ${getSurfaceClasses({ ...footerStyle, borderLine: section === 'footer' && kind === 'border' ? value as SurfaceBorder : 'none', cornerStyle: footerCorners })} footer-corners-${footerCorners} footer-border-${footerBorder ? 'on' : 'off'} footer-shadow-${footerShadow}`}>
            <span className={`widget-option-composer widget-option-composer--${kind === 'input' ? value : footerStyle.inputStyle}`} /><FiSend />
          </span>
        </span>
        <span className="widget-option-target-caption">{({ 'message-corner': language === 'no' ? 'Bobleform' : 'Bubble shape', 'message-border': language === 'no' ? 'Boblekant' : 'Bubble border', border: language === 'no' ? 'Kant' : 'Border', corner: language === 'no' ? 'Form' : 'Shape', shadow: language === 'no' ? 'Skygge' : 'Shadow', message: language === 'no' ? 'Meldingsstil' : 'Message style', input: language === 'no' ? 'Skrivefelt' : 'Input' }[kind])} ? {section === 'header' ? (language === 'no' ? 'Chat-toppen' : 'Chat header') : section === 'body' ? (language === 'no' ? 'Meldinger' : 'Messages') : (language === 'no' ? 'Skrivefeltet' : 'Composer')}</span>
      </span>
    )
  }
  const iconChoiceRef = useRef<HTMLDivElement | null>(null)
  const iconChoiceButtonRefs = useRef<Partial<Record<StyleSelectorProps['bubbleStyle']['iconChoice'], HTMLButtonElement | null>>>({})
  const [iconIndicator, setIconIndicator] = useState<{
    left: number
    top: number
    width: number
    height: number
    opacity: number
  } | null>(null)
  const [selectedStarterCardId, setSelectedStarterCardId] = useState<string | null>(null)

  const activeIconChoice = useMemo(() => bubbleStyle.iconChoice, [bubbleStyle.iconChoice])
  const customInterfaceIconsAvailable = isPlanFeatureAvailable(plan, 'customInterfaceIcons')
  const orbLauncherAvailable = isPlanFeatureAvailable(plan, 'orbLauncher')
  const glassLookAvailable = isPlanFeatureAvailable(plan, 'glassLook')
  const headerCornerStyle = resolveCornerStyle(headerStyle)
  const headerShowBorder = resolveShowBorder(headerStyle)
  const footerCornerStyle = resolveCornerStyle(footerStyle)
  const footerShowBorder = resolveShowBorder(footerStyle)
  const orbStyle = bubbleStyle.orbStyle || {
    hoverEnabled: true,
    hoverGlyph: 'A',
    replyEnabled: false,
    replyGlyphs: '',
    inactiveEnabled: false,
    inactiveGlyphs: '',
    inactivityMinMinutes: 2,
    inactivityMaxMinutes: 4,
  }

  const inactivityMinMinutes = Number.isFinite(orbStyle.inactivityMinMinutes) ? orbStyle.inactivityMinMinutes : 2
  const inactivityMaxMinutes = Number.isFinite(orbStyle.inactivityMaxMinutes) ? orbStyle.inactivityMaxMinutes : 4

  const updateOrbStyle = (patch: Partial<OrbStyleConfig>) => {
    onBubbleStyleChange({
      ...bubbleStyle,
      orbStyle: {
        ...orbStyle,
        ...patch,
      },
    })
  }

  const updateWidgetIcon = (field: keyof ChatWidgetInterfaceIcons, value: string) => {
    onWidgetIconsChange({
      ...widgetIcons,
      [field]: value,
    })
  }

  const updateConversationCard = (index: number, nextCard: AssistantConversationCard) => {
    onConversationCardsChange(conversationCards.map((card, cardIndex) => (cardIndex === index ? nextCard : card)))
  }

  const addConversationCard = () => {
    const id = crypto.randomUUID()
    onConversationCardsChange([
      ...conversationCards,
      {
        id,
        title: `${language === 'no' ? 'Startkort' : 'Starter card'} ${conversationCards.length + 1}`,
        description: copy("Help visitors choose the right topic quickly."),
        icon: 'FiMessageCircle',
        options: [
          {
            label: copy("Example question"),
            prompt: copy("How can you help me?"),
            description: copy("Replace this with a real next step."),
          },
        ],
      },
    ])
    setSelectedStarterCardId(id)
  }

  const handleToggleCardKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, onToggle: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const container = iconChoiceRef.current
      const activeButton = iconChoiceButtonRefs.current[activeIconChoice]

      if (!container || !activeButton) {
        setIconIndicator(null)
        return
      }

      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setIconIndicator({
        left: buttonRect.left - containerRect.left,
        top: buttonRect.top - containerRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
        opacity: 1,
      })
    }

    updateIndicator()
    const resizeObserver = new ResizeObserver(updateIndicator)
    if (iconChoiceRef.current) resizeObserver.observe(iconChoiceRef.current)
    const activeButton = iconChoiceButtonRefs.current[activeIconChoice]
    if (activeButton) resizeObserver.observe(activeButton)

    window.addEventListener('resize', updateIndicator)
    return () => {
      window.removeEventListener('resize', updateIndicator)
      resizeObserver.disconnect()
    }
  }, [activeIconChoice])

  const sectionHoverProps = (section: PreviewHoverTarget) => ({
    onMouseEnter: () => onPreviewHoverChange?.(section),
    onMouseLeave: () => onPreviewHoverChange?.(null),
  })

  return (
    <>
      <div className="group">
        <button type="button" className={`dropbtn ${openSections.bubble ? 'open' : ''}`} onClick={() => onToggleSection('bubble')} {...sectionHoverProps('bubble')}>
          <SectionLabel icon={<FiMessageCircle />} tone="gray">{text.sections.chatButton}</SectionLabel>
          <span className="dropbtn-icon"><FiChevronDown /></span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.bubble ? 'open' : ''}`}>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiLayout aria-hidden="true" /></span><div><h3>{language === 'no' ? "Chatknappens utseende" : "Surface and appearance"}</h3><p>{language === 'no' ? "Form, kant og visuelle detaljer." : "Shape, borders and visual details."}</p></div></div>
<div className="option-card option-card--radio">
            <span className="option-title">{text.labels.borderType}</span>
            <GlassRadioRow name="bubble-border-type" renderPreview={(value) => renderLauncherPreview('border', value)} value={['rounded', 'shadow'].includes(bubbleStyle.borderType) ? (bubbleStyle.borderType === 'rounded' ? 'solid' : 'none') : bubbleStyle.borderType} options={[{ value: 'none', label: text.options.none }, { value: 'solid', label: language === 'no' ? 'Enkel linje' : 'Single line' }, { value: 'dashed', label: language === 'no' ? 'Stiplet' : 'Dashed' }, { value: 'wavy', label: language === 'no' ? 'Bølget' : 'Wavy' }, { value: 'double', label: language === 'no' ? 'Dobbel linje' : 'Double line' }]} onChange={(nextValue) => onBubbleStyleChange({ ...bubbleStyle, shape: bubbleStyle.shape || (bubbleStyle.borderType === 'solid' ? 'rounded-square' : 'circle'), borderType: nextValue as LauncherBorder })} />
          </div>
<div className="option-card option-card--radio">
            <span className="option-title">{language === 'no' ? 'Form' : 'Shape'}</span>
            <GlassRadioRow name="bubble-shape" renderPreview={(value) => renderLauncherPreview('shape', value)} value={bubbleStyle.shape || (bubbleStyle.borderType === 'solid' ? 'rounded-square' : 'circle')} options={[{ value: 'circle', label: language === 'no' ? 'Sirkel' : 'Circle' }, { value: 'rounded-square', label: language === 'no' ? 'Avrundet firkant' : 'Rounded square' }, { value: 'square', label: language === 'no' ? 'Firkant' : 'Square' }, { value: 'triangle', label: language === 'no' ? 'Trekant' : 'Triangle' }, { value: 'diamond', label: language === 'no' ? 'Rombe' : 'Diamond' }]} onChange={(value) => onBubbleStyleChange({ ...bubbleStyle, shape: value as LauncherShape })} />
          </div>
<div className="option-card option-card--radio">
            <span className="option-title">{text.labels.shadowType}</span>
            <GlassRadioRow name="bubble-shadow-type" renderPreview={(value) => renderLauncherPreview('shadow', value)} value={bubbleStyle.shadowType} options={[{ value: 'none', label: text.options.none }, { value: 'light', label: text.options.light }, { value: 'medium', label: text.options.medium }, { value: 'heavy', label: text.options.heavy }]} onChange={(nextValue) => onBubbleStyleChange({ ...bubbleStyle, shadowType: nextValue as ShadowType })} />
          </div>
<div className="option-card option-card--radio">
            <span className="option-title">{text.labels.animation}</span>
            <GlassRadioRow name="bubble-animation-type" renderPreview={(value) => renderLauncherPreview('animation', value)} value={bubbleStyle.animationType} options={[{ value: 'none', label: text.options.none }, { value: 'bounce', label: text.options.bounce }, { value: 'fade', label: text.options.fade }, { value: 'slide', label: text.options.slide }]} onChange={(nextValue) => onBubbleStyleChange({ ...bubbleStyle, animationType: nextValue as AnimationType })} />
          </div>
<div className="option-card option-card--radio">
            <span className="option-title">{text.labels.size}</span>
            <GlassRadioRow name="bubble-size-type" renderPreview={(value) => renderLauncherPreview('size', value)} value={bubbleStyle.sizeType} options={[{ value: 'small', label: text.options.small }, { value: 'medium', label: text.options.medium }, { value: 'large', label: text.options.large }]} onChange={(nextValue) => onBubbleStyleChange({ ...bubbleStyle, sizeType: nextValue as SizeType })} />
          </div>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiImage aria-hidden="true" /></span><div><h3>{language === 'no' ? "Ikoner" : "Icons"}</h3><p>{language === 'no' ? "Velg symbolene som forklarer funksjonene." : "Choose the symbols for each function."}</p></div></div>
<div className="option-card option-card--radio option-card--wide">
            <span className="option-title">{text.labels.launcherMode}</span>
            <OptionDesc>{text.labels.launcherModeDesc}</OptionDesc>
            <div className="iconChoiceGroup" ref={iconChoiceRef} role="radiogroup" aria-label={copy("Launcher mode")}>
              {iconIndicator ? (
                <span className="iconChoiceIndicator" style={{ transform: `translate3d(${iconIndicator.left}px, ${iconIndicator.top}px, 0)`, width: `${iconIndicator.width}px`, height: `${iconIndicator.height}px`, opacity: iconIndicator.opacity }} />
              ) : null}
              {iconChoices.map((choice) => {
                const locked = choice.value === 'orb' && !orbLauncherAvailable
                const active = bubbleStyle.iconChoice === choice.value && !locked
                return (
                  <button
                    key={choice.value}
                    ref={(node) => {
                      iconChoiceButtonRefs.current[choice.value] = node
                    }}
                    type="button"
                    className={`iconChoiceButton ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}
                    role="radio"
                    aria-checked={active}
                    disabled={locked}
                    aria-disabled={locked}
                    title={locked ? copy("Available on Pro and Enterprise plans") : undefined}
                    onClick={() => {
                      if (locked) return
                      onBubbleStyleChange({ ...bubbleStyle, iconChoice: choice.value })
                      if (choice.value !== 'orb') updateWidgetIcon('launcherIcon', launcherIconChoiceMap[choice.value] || 'FiMessageCircle')
                    }}
                  >
                    <span className="iconChoiceIcon">{choice.icon}</span>
                    <span>{choice.label}</span>
                    {locked ? <span className="iconChoiceLock"><FiLock />Pro</span> : null}
                  </button>
                )
              })}
            </div>
          </div>
<div className="sectionIconGrid">
            {sectionIconFields.bubble.map((item) => (
              <IconPickerBubble
                key={item.field}
                label={copy(item.label)}
                value={widgetIcons[item.field] || ''}
                onChange={(nextValue) => updateWidgetIcon(item.field, nextValue)}
                helperText={bubbleStyle.iconChoice === 'orb' ? copy("Orb mode uses the orb visual instead of the launcher icon.") : customInterfaceIconsAvailable ? copy(item.helper) : copy("Available on Pro and Enterprise plans.")}
                disabled={!customInterfaceIconsAvailable || bubbleStyle.iconChoice === 'orb'}
              />
            ))}
          </div>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiPlus aria-hidden="true" /></span><div><h3>{language === 'no' ? "Tillegg" : "Extras"}</h3><p>{language === 'no' ? "Ekstra innhold og funksjoner." : "Additional content and features."}</p></div></div>
<div className={`option-card ${bubbleStyle.showStatus ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={bubbleStyle.showStatus} onClick={() => onBubbleStyleChange({ ...bubbleStyle, showStatus: !bubbleStyle.showStatus })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onBubbleStyleChange({ ...bubbleStyle, showStatus: !bubbleStyle.showStatus }))}>
            <span className="option-title">{text.labels.showStatusDot}</span>
            <OptionDesc>{text.labels.showStatusDotDesc}</OptionDesc>
          </div>
{bubbleStyle.iconChoice === 'orb' ? (
            <div className="option-card option-card--orb option-card--radio option-card--wide">
              <span className="option-title">{copy("Orb behavior")}</span>
              <OptionDesc>{copy("Set one hover letter, up to three reply letters, and up to five idle letters.")}</OptionDesc>
              <div className="orbSettingsGrid">
                <label className="orbField orbField--checkbox"><span>{copy("Show hover symbol")}</span><input type="checkbox" checked={orbStyle.hoverEnabled} onChange={(event) => updateOrbStyle({ hoverEnabled: event.target.checked })} /></label>
                <label className="orbField"><span>{copy("Hover letter")}</span><input type="text" maxLength={1} value={orbStyle.hoverGlyph} onChange={(event) => updateOrbStyle({ hoverGlyph: event.target.value.slice(0, 1).toUpperCase() })} placeholder="A" disabled={!orbStyle.hoverEnabled} /></label>
                <label className="orbField orbField--checkbox"><span>{copy("Show reply symbol")}</span><input type="checkbox" checked={orbStyle.replyEnabled} onChange={(event) => updateOrbStyle({ replyEnabled: event.target.checked })} /></label>
                <label className="orbField"><span>{copy("Reply letters")}</span><input type="text" maxLength={3} value={orbStyle.replyGlyphs} onChange={(event) => updateOrbStyle({ replyGlyphs: event.target.value.slice(0, 3).toUpperCase() })} placeholder="ABC" disabled={!orbStyle.replyEnabled} /></label>
                <label className="orbField orbField--checkbox"><span>{copy("Show inactive symbol")}</span><input type="checkbox" checked={orbStyle.inactiveEnabled} onChange={(event) => updateOrbStyle({ inactiveEnabled: event.target.checked })} /></label>
                <label className="orbField"><span>{copy("Inactive letters")}</span><input type="text" maxLength={5} value={orbStyle.inactiveGlyphs} onChange={(event) => updateOrbStyle({ inactiveGlyphs: event.target.value.slice(0, 5).toUpperCase() })} placeholder="ABCDE" disabled={!orbStyle.inactiveEnabled} /></label>
                <label className="orbField orbField--number"><span>{copy("Inactive min (min)")}</span><input type="number" min={1} max={60} step={1} value={inactivityMinMinutes} onChange={(event) => updateOrbStyle({ inactivityMinMinutes: Math.max(1, Math.min(60, Number(event.target.value) || 1)) })} placeholder="2" /></label>
                <label className="orbField orbField--number"><span>{copy("Inactive max (min)")}</span><input type="number" min={1} max={120} step={1} value={inactivityMaxMinutes} onChange={(event) => updateOrbStyle({ inactivityMaxMinutes: Math.max(1, Math.min(120, Number(event.target.value) || 1)) })} placeholder="4" /></label>
              </div>
            </div>
          ) : null}
</div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.header ? 'open' : ''}`} onClick={() => onToggleSection('header')} {...sectionHoverProps('header')}>
          <SectionLabel icon={<FiLayout />} tone="gray">{text.sections.chatTopBar}</SectionLabel>
          <span className="dropbtn-icon"><FiChevronDown /></span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.header ? 'open' : ''}`}>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiLayout aria-hidden="true" /></span><div><h3>{language === 'no' ? "Toppfeltets ramme" : "Surface and appearance"}</h3><p>{language === 'no' ? "Form, kant og visuelle detaljer." : "Shape, borders and visual details."}</p></div></div>
{renderMotionControl('openAnimation')}
<div className="option-card option-card--radio"><span className="option-title">{language === 'no' ? 'Form' : 'Shape'}</span><GlassRadioRow name="header-corner-style" renderPreview={(value) => renderChatSurfacePreview('header', 'corner', value)} value={headerCornerStyle} options={[{ value: 'rounded', label: text.options.rounded }, { value: 'square', label: text.options.square }]} onChange={(nextValue) => onHeaderStyleChange({ ...headerStyle, cornerStyle: nextValue as CornerStyle, borderType: headerStyle.borderType })} /></div>
<div className="option-card option-card--radio"><span className="option-title">{text.labels.borderType}</span><GlassRadioRow name="header-border-type" renderPreview={(value) => renderChatSurfacePreview('header', 'border', value)} value={surfaceValue(headerStyle)} options={surfaceBorders} onChange={(value) => onHeaderStyleChange({ ...headerStyle, borderLine: value as SurfaceBorder })} /></div>
<div className="option-card option-card--radio"><span className="option-title">{text.labels.shadowType}</span><GlassRadioRow name="header-shadow-type" renderPreview={(value) => renderChatSurfacePreview('header', 'shadow', value)} value={headerStyle.shadowType} options={[{ value: 'none', label: text.options.none }, { value: 'light', label: text.options.light }, { value: 'medium', label: text.options.medium }, { value: 'heavy', label: text.options.heavy }]} onChange={(nextValue) => onHeaderStyleChange({ ...headerStyle, shadowType: nextValue as ShadowType })} /></div>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiMessageSquare aria-hidden="true" /></span><div><h3>{language === 'no' ? "Innhold i toppfeltet" : "Content and controls"}</h3><p>{language === 'no' ? "Velg hva som skal vises i dette området." : "Choose what appears in this area."}</p></div></div>
<div className={`option-card ${headerStyle.showStatus ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={headerStyle.showStatus} onClick={() => onHeaderStyleChange({ ...headerStyle, showStatus: !headerStyle.showStatus })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onHeaderStyleChange({ ...headerStyle, showStatus: !headerStyle.showStatus }))}><span className="option-title">{text.labels.showStatus}</span><OptionDesc>{text.labels.showStatusDesc}</OptionDesc></div>
<div className={`option-card ${headerStyle.showCloseButton ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={headerStyle.showCloseButton} onClick={() => onHeaderStyleChange({ ...headerStyle, showCloseButton: !headerStyle.showCloseButton })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onHeaderStyleChange({ ...headerStyle, showCloseButton: !headerStyle.showCloseButton }))}><span className="option-title">{text.labels.showCloseButton}</span><OptionDesc>{text.labels.showCloseButtonDesc}</OptionDesc></div>
<div className={`option-card ${headerStyle.showAvatar ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={headerStyle.showAvatar} onClick={() => onHeaderStyleChange({ ...headerStyle, showAvatar: !headerStyle.showAvatar })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onHeaderStyleChange({ ...headerStyle, showAvatar: !headerStyle.showAvatar }))}><span className="option-title">{text.labels.showAvatar}</span><OptionDesc>{text.labels.showAvatarDesc}</OptionDesc></div>
<div className={`option-card ${headerStyle.showTitle ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={headerStyle.showTitle} onClick={() => onHeaderStyleChange({ ...headerStyle, showTitle: !headerStyle.showTitle })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onHeaderStyleChange({ ...headerStyle, showTitle: !headerStyle.showTitle }))}><span className="option-title">{text.labels.showTitle}</span><OptionDesc>{text.labels.showTitleDesc}</OptionDesc></div>
<label className="branding-field"><span>{language === 'no' ? 'Navn i chatten' : 'Chat name'}</span><input type="text" value={customBranding.title || ''} onChange={(event) => onCustomBrandingChange({ ...customBranding, title: event.target.value })} placeholder="Support Chat" /></label>
<label className="branding-field"><span>{language === 'no' ? 'Kort velkomsttekst' : 'Short welcome message'}</span><input type="text" value={customBranding.description || ''} onChange={(event) => onCustomBrandingChange({ ...customBranding, description: event.target.value })} placeholder="We are here to help you!" /></label>
<div className="branding-field branding-field--logo"><span>{language === 'no' ? 'Bedriftens logo' : 'Company logo'}</span><LogoUploadEditor branding={customBranding} onChange={onCustomBrandingChange} /></div>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiImage aria-hidden="true" /></span><div><h3>{language === 'no' ? "Ikoner" : "Icons"}</h3><p>{language === 'no' ? "Velg symbolene som forklarer funksjonene." : "Choose the symbols for each function."}</p></div></div>
<div className="sectionIconGrid">
            {sectionIconFields.header.map((item) => (
              <IconPickerBubble
                key={item.field}
                label={copy(item.label)}
                value={widgetIcons[item.field] || ''}
                onChange={(nextValue) => updateWidgetIcon(item.field, nextValue)}
                helperText={customInterfaceIconsAvailable ? copy(item.helper) : copy("Available on Pro and Enterprise plans.")}
                disabled={!customInterfaceIconsAvailable}
              />
            ))}
          </div>
</div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.body ? 'open' : ''}`} onClick={() => onToggleSection('body')} {...sectionHoverProps('body')}>
          <SectionLabel icon={<FiMessageSquare />} tone="gray">{text.sections.chatMessages}</SectionLabel>
          <span className="dropbtn-icon"><FiChevronDown /></span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.body ? 'open' : ''}`}>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiLayout aria-hidden="true" /></span><div><h3>{language === 'no' ? "Meldingsområdet" : "Surface and appearance"}</h3><p>{language === 'no' ? "Form, kant og visuelle detaljer." : "Shape, borders and visual details."}</p></div></div>
<div className="option-card option-card--radio"><span className="option-title">{text.labels.borderType}</span><GlassRadioRow name="body-border-type" renderPreview={(value) => renderChatSurfacePreview('body', 'border', value)} value={surfaceValue(bodyStyle)} options={surfaceBorders} onChange={(value) => onBodyStyleChange({ ...bodyStyle, borderLine: value as SurfaceBorder })} /></div>
<div className="option-card option-card--radio"><span className="option-title">{text.labels.shadowType}</span><GlassRadioRow name="body-shadow-type" renderPreview={(value) => renderChatSurfacePreview('body', 'shadow', value)} value={bodyStyle.shadowType} options={[{ value: 'none', label: text.options.none }, { value: 'light', label: text.options.light }, { value: 'medium', label: text.options.medium }, { value: 'heavy', label: text.options.heavy }]} onChange={(nextValue) => onBodyStyleChange({ ...bodyStyle, shadowType: nextValue as ShadowType })} /></div>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiMessageSquare aria-hidden="true" /></span><div><h3>{language === 'no' ? "Chatmeldingene" : "Chat messages"}</h3><p>{language === 'no' ? "Stil, form, kant og animasjon for meldingene." : "Message style, shape, border and animation."}</p></div></div>
<div className="option-card option-card--radio"><span className="option-title">{language === 'no' ? 'Form p\u00e5 meldingsbobler' : 'Message bubble shape'}</span><GlassRadioRow name="message-corner-style" renderPreview={(value) => renderChatSurfacePreview('body', 'message-corner', value)} value={bodyStyle.messageCornerStyle || (bodyStyle.messageStyle === 'flat' ? 'square' : 'rounded')} options={[{ value: 'rounded', label: text.options.rounded }, { value: 'square', label: text.options.square }]} onChange={(value) => onBodyStyleChange({ ...bodyStyle, messageCornerStyle: value as CornerStyle })} /></div>
<div className="option-card option-card--radio"><span className="option-title">{language === 'no' ? 'Kant p\u00e5 meldingsbobler' : 'Message bubble border'}</span><GlassRadioRow name="message-border-type" renderPreview={(value) => renderChatSurfacePreview('body', 'message-border', value)} value={bodyStyle.messageBorderLine || 'none'} options={surfaceBorders} onChange={(value) => onBodyStyleChange({ ...bodyStyle, messageBorderLine: value as SurfaceBorder })} /></div>
<div className="option-card option-card--radio"><span className="option-title">{text.labels.messageStyle}</span><GlassRadioRow name="body-message-style" renderPreview={(value) => renderChatSurfacePreview('body', 'message', value)} value={bodyStyle.messageStyle} options={[{ value: 'bubble', label: text.options.bubble }, { value: 'flat', label: text.options.flat }, { value: 'card', label: text.options.card }]} onChange={(nextValue) => onBodyStyleChange({ ...bodyStyle, messageStyle: nextValue as MessageStyle })} /></div>
{renderMotionControl('sentAnimation')}
{renderMotionControl('receivedAnimation')}
<div className={`option-card ${bodyStyle.showTimestamps ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={bodyStyle.showTimestamps} onClick={() => onBodyStyleChange({ ...bodyStyle, showTimestamps: !bodyStyle.showTimestamps })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onBodyStyleChange({ ...bodyStyle, showTimestamps: !bodyStyle.showTimestamps }))}><span className="option-title">{text.labels.showTimestamps}</span><OptionDesc>{text.labels.showTimestampsDesc}</OptionDesc></div>
<div className={`option-card ${bodyStyle.showReadReceipts ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={bodyStyle.showReadReceipts} onClick={() => onBodyStyleChange({ ...bodyStyle, showReadReceipts: !bodyStyle.showReadReceipts })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onBodyStyleChange({ ...bodyStyle, showReadReceipts: !bodyStyle.showReadReceipts }))}><span className="option-title">{text.labels.showReadReceipts}</span><OptionDesc>{text.labels.showReadReceiptsDesc}</OptionDesc></div>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiImage aria-hidden="true" /></span><div><h3>{language === 'no' ? "Ikoner" : "Icons"}</h3><p>{language === 'no' ? "Velg symbolene som forklarer funksjonene." : "Choose the symbols for each function."}</p></div></div>
<div className="sectionIconGrid">
            {sectionIconFields.body.map((item) => (
              <IconPickerBubble
                key={item.field}
                label={copy(item.label)}
                value={widgetIcons[item.field] || ''}
                onChange={(nextValue) => updateWidgetIcon(item.field, nextValue)}
                helperText={customInterfaceIconsAvailable ? copy(item.helper) : copy("Available on Pro and Enterprise plans.")}
                disabled={!customInterfaceIconsAvailable}
              />
            ))}
          </div>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiPlus aria-hidden="true" /></span><div><h3>{language === 'no' ? "Tillegg" : "Extras"}</h3><p>{language === 'no' ? "Ekstra innhold og funksjoner." : "Additional content and features."}</p></div></div>
<div className={`option-card ${bodyStyle.showConversationCards ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={bodyStyle.showConversationCards} onClick={() => onBodyStyleChange({ ...bodyStyle, showConversationCards: !bodyStyle.showConversationCards })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onBodyStyleChange({ ...bodyStyle, showConversationCards: !bodyStyle.showConversationCards }))}><span className="option-title">{text.labels.showStarterCards}</span><OptionDesc>{text.labels.showStarterCardsDesc}</OptionDesc></div>
{bodyStyle.showConversationCards ? <div className="option-card option-card--radio"><span className="option-title">{text.labels.cardStyle}</span><GlassRadioRow name="body-conversation-cards-style" value={bodyStyle.conversationCardsStyle} options={[{ value: 'modern', label: text.options.modern }, { value: 'minimal', label: text.options.minimal }, { value: 'bubble', label: text.options.bubbleGlow }, { value: 'image', label: text.options.imageBased }, { value: 'chips', label: text.options.quickChips }]} onChange={(nextValue) => onBodyStyleChange({ ...bodyStyle, conversationCardsStyle: nextValue as StyleSelectorProps['bodyStyle']['conversationCardsStyle'] })} /></div> : null}
{bodyStyle.showConversationCards ? (
            <div className="starterCardsPanel">
              <div className="starterCardsPanel__header">
                <div>
                  <strong>{language === 'no' ? 'Startkort' : 'Starter cards'}</strong>
                  <p>{language === 'no' ? 'Hjelp kundene videre med nyttige snarveier.' : 'Help customers find their way with useful shortcuts.'}</p>
                </div>
                <label className="starterCardsPanel__toggle">
                  <input type="checkbox" checked={conversationCardsEnabled} onChange={(event) => onConversationCardsEnabledChange(event.target.checked)} />
                  <span>{language === 'no' ? 'Aktivert' : 'Enabled'}</span>
                </label>
              </div>

              {selectedStarterCardId && conversationCards.some((card) => card.id === selectedStarterCardId) ? (
                <div className="starterCardsPanel__detail">
                  <button type="button" className="starterCardsPanel__back" onClick={() => setSelectedStarterCardId(null)}>
                    <FiArrowLeft aria-hidden="true" /> {language === 'no' ? 'Tilbake til kortene' : 'Back to cards'}
                  </button>
                  {conversationCards.map((card, index) => card.id === selectedStarterCardId ? (
                    <StarterCardEditor
                      key={card.id}
                      card={card}
                      index={index}
                      disabled={!conversationCardsEnabled}
                      style={bodyStyle.conversationCardsStyle}
                      onChange={(nextCard) => updateConversationCard(index, nextCard)}
                      onRemove={() => {
                        onConversationCardsChange(conversationCards.filter((_, cardIndex) => cardIndex !== index))
                        setSelectedStarterCardId(null)
                      }}
                    />
                  ) : null)}
                </div>
              ) : (
                <>
                  <div className="starterCardsPanel__controls">
                    <label className="branding-field">
                      <span>{language === 'no' ? 'Antall synlige kort' : 'Cards shown'}</span>
                      <input type="number" min="1" max="12" value={conversationCardsLimit} disabled={!conversationCardsEnabled} onChange={(event) => onConversationCardsLimitChange(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} />
                    </label>
                    <div className="starterCardsPanel__actions">
                      <button type="button" className="starterCardsPanel__action" onClick={addConversationCard} disabled={!conversationCardsEnabled}><FiPlus aria-hidden="true" /> {language === 'no' ? 'Legg til kort' : 'Add card'}</button>
                      <button type="button" className="starterCardsPanel__action secondary" onClick={() => { onConversationCardsChange(defaultConversationCards); setSelectedStarterCardId(null) }} disabled={!conversationCardsEnabled}>{language === 'no' ? 'Nullstill' : 'Reset'}</button>
                    </div>
                  </div>

                  <div className="starterCardsTree" role="group" aria-label={language === 'no' ? 'Startkort' : 'Starter cards'}>
                    {conversationCards.map((card, index) => (
                      <button key={card.id} type="button" className="starterCardsTree__card" onClick={() => setSelectedStarterCardId(card.id)} disabled={!conversationCardsEnabled}>
                        <span className="starterCardsTree__line" aria-hidden="true" />
                        <span className="starterCardsTree__icon">{renderWidgetIcon(card.icon, { 'aria-hidden': true }) || <FiMessageCircle aria-hidden="true" />}</span>
                        <span className="starterCardsTree__copy">
                          <span className="starterCardsTree__eyebrow">{language === 'no' ? 'Kort' : 'Card'} {index + 1}</span>
                          <strong>{card.title || `${language === 'no' ? 'Kort uten tittel' : 'Untitled card'} ${index + 1}`}</strong>
                          <span>{card.description || copy("No description yet")}</span>
                        </span>
                        <span className="starterCardsTree__meta">{card.options.length} {language === 'no' ? 'valg' : 'options'}</span>
                        <FiChevronRight className="starterCardsTree__chevron" aria-hidden="true" />
                      </button>
                    ))}
                    <button type="button" className="starterCardsTree__add" onClick={addConversationCard} disabled={!conversationCardsEnabled}><FiPlus aria-hidden="true" /> {language === 'no' ? 'Legg til et kort' : 'Add another card'}</button>
                  </div>
                </>
              )}
            </div>
          ) : null}
</div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.footer ? 'open' : ''}`} onClick={() => onToggleSection('footer')} {...sectionHoverProps('footer')}>
          <SectionLabel icon={<FiSend />} tone="gray">{text.sections.messageBox}</SectionLabel>
          <span className="dropbtn-icon"><FiChevronDown /></span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.footer ? 'open' : ''}`}>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiLayout aria-hidden="true" /></span><div><h3>{language === 'no' ? "Skrivefeltets ramme" : "Surface and appearance"}</h3><p>{language === 'no' ? "Form, kant og visuelle detaljer." : "Shape, borders and visual details."}</p></div></div>
<div className="option-card option-card--radio"><span className="option-title">{language === 'no' ? 'Form' : 'Shape'}</span><GlassRadioRow name="footer-corner-style" renderPreview={(value) => renderChatSurfacePreview('footer', 'corner', value)} value={footerCornerStyle} options={[{ value: 'rounded', label: text.options.rounded }, { value: 'square', label: text.options.square }]} onChange={(nextValue) => onFooterStyleChange({ ...footerStyle, cornerStyle: nextValue as CornerStyle, borderType: footerStyle.borderType })} /></div>
<div className="option-card option-card--radio"><span className="option-title">{text.labels.borderType}</span><GlassRadioRow name="footer-border-type" renderPreview={(value) => renderChatSurfacePreview('footer', 'border', value)} value={surfaceValue(footerStyle)} options={surfaceBorders} onChange={(value) => onFooterStyleChange({ ...footerStyle, borderLine: value as SurfaceBorder })} /></div>
<div className="option-card option-card--radio"><span className="option-title">{text.labels.shadowType}</span><GlassRadioRow name="footer-shadow-type" renderPreview={(value) => renderChatSurfacePreview('footer', 'shadow', value)} value={footerStyle.shadowType} options={[{ value: 'none', label: text.options.none }, { value: 'light', label: text.options.light }, { value: 'medium', label: text.options.medium }, { value: 'heavy', label: text.options.heavy }]} onChange={(nextValue) => onFooterStyleChange({ ...footerStyle, shadowType: nextValue as ShadowType })} /></div>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiMessageSquare aria-hidden="true" /></span><div><h3>{language === 'no' ? "Innhold og skrivefelt" : "Content and controls"}</h3><p>{language === 'no' ? "Velg hva som skal vises i dette området." : "Choose what appears in this area."}</p></div></div>
<div className={`option-card ${footerStyle.showSendButton ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={footerStyle.showSendButton} onClick={() => onFooterStyleChange({ ...footerStyle, showSendButton: !footerStyle.showSendButton })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onFooterStyleChange({ ...footerStyle, showSendButton: !footerStyle.showSendButton }))}><span className="option-title">{text.labels.showSendButton}</span><OptionDesc>{text.labels.showSendButtonDesc}</OptionDesc></div>
<div className="option-card option-card--radio"><span className="option-title">{text.labels.inputStyle}</span><GlassRadioRow name="footer-input-style" renderPreview={(value) => renderChatSurfacePreview('footer', 'input', value)} value={footerStyle.inputStyle} options={[{ value: 'flat', label: text.options.flat }, { value: 'rounded', label: text.options.rounded }, { value: 'outlined', label: text.options.outlined }]} onChange={(nextValue) => onFooterStyleChange({ ...footerStyle, inputStyle: nextValue as InputStyle })} /></div>
<div className={`option-card ${footerStyle.showPlaceholder ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={footerStyle.showPlaceholder} onClick={() => onFooterStyleChange({ ...footerStyle, showPlaceholder: !footerStyle.showPlaceholder })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onFooterStyleChange({ ...footerStyle, showPlaceholder: !footerStyle.showPlaceholder }))}><span className="option-title">{text.labels.showPlaceholder}</span><OptionDesc>{text.labels.showPlaceholderDesc}</OptionDesc></div>
<div className="designGroupHeading"><span className="designGroupHeading__icon"><FiImage aria-hidden="true" /></span><div><h3>{language === 'no' ? "Ikoner" : "Icons"}</h3><p>{language === 'no' ? "Velg symbolene som forklarer funksjonene." : "Choose the symbols for each function."}</p></div></div>
<div className="sectionIconGrid">
            {sectionIconFields.footer.map((item) => (
              <IconPickerBubble
                key={item.field}
                label={copy(item.label)}
                value={widgetIcons[item.field] || ''}
                onChange={(nextValue) => updateWidgetIcon(item.field, nextValue)}
                helperText={customInterfaceIconsAvailable ? copy(item.helper) : copy("Available on Pro and Enterprise plans.")}
                disabled={!customInterfaceIconsAvailable}
              />
            ))}
          </div>
</div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.colorTheme ? 'open' : ''}`} onClick={() => onToggleSection('colorTheme')}>
          <SectionLabel icon={<FiDroplet />} tone="colorful">{text.sections.colors}</SectionLabel>
          <span className="dropbtn-icon"><FiChevronDown /></span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.colorTheme ? 'open' : ''}`}>
          <div className="option-card option-card--radio">
            <span className="option-title">{text.labels.theme}</span>
            <GlassRadioRow
              name="color-theme"
              value={colorTheme}
              options={Object.entries(colorThemeInfo).map(([theme, info]) => ({ value: theme as ColorTheme, label: language === 'no' ? info.noLabel : info.label, description: language === 'no' ? info.noDescription : info.description, swatches: ['--chat-primary', '--chat-secondary', '--chat-bg', '--chat-bot-bg'].map((key) => WIDGET_THEME_VARS[theme as ColorTheme][key]) }))}
              onChange={(nextValue) => onColorThemeChange(nextValue as ColorTheme)}
            />
          </div>

          <div className={`option-card ${appearance.glassLookEnabled ? 'checked' : ''} ${!glassLookAvailable ? 'option-card--locked' : ''}`} role="button" tabIndex={glassLookAvailable ? 0 : -1} aria-pressed={appearance.glassLookEnabled} aria-disabled={!glassLookAvailable} onClick={() => { if (!glassLookAvailable) return; onAppearanceChange({ ...appearance, glassLookEnabled: !appearance.glassLookEnabled }) }} onKeyDown={(event) => handleToggleCardKeyDown(event, () => { if (!glassLookAvailable) return; onAppearanceChange({ ...appearance, glassLookEnabled: !appearance.glassLookEnabled }) })}>
            <span className="option-title">{text.labels.glassLook}</span>
            <OptionDesc>{glassLookAvailable ? text.labels.glassLookDesc : text.labels.glassLookLocked}</OptionDesc>
          </div>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.advanced ? 'open' : ''}`} onClick={() => onToggleSection('advanced')}>
          <SectionLabel icon={<FiSliders />} tone="neutral">{text.sections.behavior}</SectionLabel>
          <span className="dropbtn-icon"><FiChevronDown /></span>
        </button>

        <div className={`advanced-content dropdown-content ${openSections.advanced ? 'open' : ''}`}>
          <div className="advanced-field advanced-field--position">
            <label>{text.labels.screenPosition}</label>
            <GlassRadioRow name="widget-position" value={position} options={[{ value: 'bottom-right', label: text.options.bottomRight, description: text.options.bottomRight }, { value: 'bottom-left', label: text.options.bottomLeft, description: text.options.bottomLeft }]} onChange={(nextValue) => onPositionChange(nextValue as Position)} />
          </div>

          <div className="advanced-field">
            <label>
              <input type="checkbox" checked={settings.autoOpen || false} onChange={(event) => onSettingsChange({ ...settings, autoOpen: event.target.checked })} />
              {text.labels.autoOpen}
            </label>
          </div>

          <div className="advanced-field">
            <label htmlFor="studio-auto-open-delay">{text.labels.autoOpenDelay}</label>
            <input id="studio-auto-open-delay" type="number" value={settings.delayMs || 3000} onChange={(event) => onSettingsChange({ ...settings, delayMs: parseInt(event.target.value || '0', 10) })} min="0" max="10000" step="500" />
          </div>
        </div>
      </div>
    </>
  )
}
