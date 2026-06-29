'use client'

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
} from 'react'
import { FaRegLightbulb } from 'react-icons/fa'
import {
  FiChevronDown,
  FiCpu,
  FiDroplet,
  FiImage,
  FiLayout,
  FiLifeBuoy,
  FiLock,
  FiMessageCircle,
  FiMessageSquare,
  FiPhone,
  FiSend,
  FiSliders,
} from 'react-icons/fi'
import IconPickerBubble from '@/components/IconPickerBubble'
import { chatWidgetStyleI18n, useVintraLanguage } from '@/lib/i18n'
import { defaultConversationCards } from '@/lib/conversation-cards'
import { isPlanFeatureAvailable } from '@/lib/subscription'
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
    borderType: BorderType
    shadowType: ShadowType
    animationType: AnimationType
    sizeType: SizeType
    orbStyle?: OrbStyleConfig
  }
  headerStyle: {
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
    showSendButton: boolean
    borderType: BorderType
    cornerStyle?: CornerStyle
    showBorder?: boolean
    shadowType: ShadowType
    inputStyle: InputStyle
    showPlaceholder: boolean
  }
  appearance: {
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

const colorThemeInfo: Record<ColorTheme, { label: string; description: string }> = {
  modern: { label: 'Modern', description: 'Clean and contemporary' },
  chilling: { label: 'Chilling', description: 'Relaxed and friendly' },
  corporate: { label: 'Corporate', description: 'Professional and serious' },
  luxury: { label: 'Luxury', description: 'Exclusive and elegant' },
  'pink-blast': { label: 'Pink Blast', description: 'Creamy rose and playful' },
  'red-velvet': { label: 'Red Velvet', description: 'Calm red and soft' },
  'deep-blue': { label: 'Deep Blue', description: 'Strong blue and focused' },
  'banana-bonanza': { label: 'Banana Bonanza', description: 'Yellow-orange and bright' },
}

const colorThemeSwatches: Record<ColorTheme, string[]> = {
  modern: ['#3b82f6', '#1e40af', '#ffffff', '#eef2ff'],
  chilling: ['#10b981', '#047857', '#f0fdf4', '#c5ffe2'],
  corporate: ['#6b7280', '#374151', '#f9fafb', '#efefef'],
  luxury: ['#7c3aed', '#5b21b6', '#faf5ff', '#d8e4fb'],
  'pink-blast': ['#f472b6', '#be185d', '#fff1f7', '#ffe0ef'],
  'red-velvet': ['#b91c1c', '#7f1d1d', '#fff5f5', '#fee2e2'],
  'deep-blue': ['#002fcf', '#001a75', '#eef4ff', '#dbe8ff'],
  'banana-bonanza': ['#f59e0b', '#c2410c', '#fff8dc', '#fff0a8'],
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
}: {
  name: string
  value: T
  options: Array<GlassRadioOption<T>>
  onChange: (value: T) => void
}) {
  const rowRef = useRef<HTMLDivElement | null>(null)
  const buttonRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({})
  const [indicator, setIndicator] = useState<{ left: number; top: number; width: number; height: number; opacity: number } | null>(null)

  useLayoutEffect(() => {
    const cleanup: Array<() => void> = []

    const updateIndicator = () => {
      const container = rowRef.current
      const activeButton = buttonRefs.current[value]

      if (!container || !activeButton) {
        setIndicator(null)
        return
      }

      setIndicator({
        left: activeButton.offsetLeft,
        top: activeButton.offsetTop,
        width: activeButton.offsetWidth,
        height: activeButton.offsetHeight,
        opacity: 1,
      })
    }

    const raf1 = window.requestAnimationFrame(() => {
      const raf2 = window.requestAnimationFrame(updateIndicator)
      cleanup.push(() => window.cancelAnimationFrame(raf2))
    })

    cleanup.push(() => window.cancelAnimationFrame(raf1))
    const resizeObserver = new ResizeObserver(updateIndicator)

    if (rowRef.current) resizeObserver.observe(rowRef.current)
    const activeButton = buttonRefs.current[value]
    if (activeButton) resizeObserver.observe(activeButton)

    window.addEventListener('resize', updateIndicator)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateIndicator)
      cleanup.forEach((fn) => fn())
    }
  }, [value, options.length])

  return (
    <div className="glassRadioRow" ref={rowRef} role="radiogroup" aria-label={name}>
      {indicator ? (
        <span
          className="glassRadioIndicator"
          style={{
            transform: `translate(${indicator.left}px, 0)`,
            top: `${indicator.top}px`,
            height: `${indicator.height}px`,
            width: `${indicator.width}px`,
            opacity: indicator.opacity,
          }}
        />
      ) : null}
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => {
              buttonRefs.current[option.value] = node
            }}
            type="button"
            className={`glassRadioButton ${active ? 'active' : ''}`}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {option.swatches ? (
              <span className="glassRadioSwatches" aria-hidden="true">
                {option.swatches.map((swatch) => (
                  <span key={`${option.value}-${swatch}`} className="glassRadioSwatch" style={{ backgroundColor: swatch }} />
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
      <input ref={fileInputRef} type="file" accept="image/png" onChange={handleFileChange} className="logoEditorInput" />

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
            <div className="logoEditorHint">Drag inside the circle to reposition</div>
          </div>
        ) : (
          <div className="logoEditorPlaceholder">
            <FiImage className="logoEditorPlaceholderIcon" />
            <strong>Drop a PNG logo here</strong>
            <span>or click to choose a file</span>
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
            <span>Horizontal position</span>
            <input type="range" min="0" max="100" step="1" value={logoStyle.focusX} onChange={(event) => updateLogoStyle({ focusX: Number(event.target.value) })} disabled={!branding.logo} />
          </label>

          <label className="branding-field">
            <span>Vertical position</span>
            <input type="range" min="0" max="100" step="1" value={logoStyle.focusY} onChange={(event) => updateLogoStyle({ focusY: Number(event.target.value) })} disabled={!branding.logo} />
          </label>
        </div>

        <div className="logoEditorActions">
          <button type="button" className="logoEditorAction" onClick={() => updateBranding({ logo: undefined })} disabled={!branding.logo}>
            Remove logo
          </button>
          <button type="button" className="logoEditorAction secondary" onClick={() => updateLogoStyle(defaultLogoStyle)} disabled={!branding.logo}>
            Reset crop
          </button>
        </div>

        <p className="logoEditorMeta">PNG only. Drop a file, then drag within the circle or adjust the sliders.</p>
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
  return (
    <article className={`starterCardEditor ${disabled ? 'is-disabled' : ''}`}>
      <div className="starterCardEditor__header">
        <strong>{card.title || `Card ${index + 1}`}</strong>
        <button type="button" className="starterCardEditor__remove" onClick={onRemove} disabled={disabled}>
          Remove
        </button>
      </div>

      <div className="starterCardEditor__grid">
        <label className="branding-field">
          <span>Card title</span>
          <input type="text" value={card.title} disabled={disabled} onChange={(event) => onChange({ ...card, title: event.target.value })} placeholder="Opening hours" />
        </label>

        <label className="branding-field">
          <span>Description</span>
          <input type="text" value={card.description} disabled={disabled} onChange={(event) => onChange({ ...card, description: event.target.value })} placeholder="Help visitors choose the right topic." />
        </label>
      </div>

      <div className="starterCardEditor__grid">
        <IconPickerBubble
          label="Card icon"
          value={card.icon || ''}
          onChange={(nextValue) => onChange({ ...card, icon: nextValue })}
          helperText="Shown on the starter card unless the card is image-first."
          disabled={disabled || style === 'image'}
        />

        <label className="branding-field">
          <span>Image URL</span>
          <input type="url" value={card.image || ''} disabled={disabled} onChange={(event) => onChange({ ...card, image: event.target.value })} placeholder="https://..." />
        </label>
      </div>

      <label className="branding-field">
        <span>Options</span>
        <textarea
          className="starterCardEditor__textarea"
          rows={4}
          disabled={disabled}
          value={card.options.map((option) => [option.label, option.prompt, option.description].filter(Boolean).join(' | ')).join('\n')}
          onChange={(event) => {
            const nextOptions = event.target.value
              .split(/\n/)
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, optionIndex) => {
                const [label = '', prompt = '', description = ''] = line.split('|').map((part) => part.trim())
                return {
                  label: label || prompt || `Option ${optionIndex + 1}`,
                  prompt: prompt || label || `Option ${optionIndex + 1}`,
                  description: description || undefined,
                }
              })

            onChange({
              ...card,
              options: nextOptions.length
                ? nextOptions
                : [
                    {
                      label: 'Example question',
                      prompt: 'How can you help me?',
                      description: 'Add one option per line using label | prompt | description.',
                    },
                  ],
            })
          }}
          placeholder={'Opening hours | What are your opening hours? | Show when you are open.\nPrices | What are your prices?'}
        />
      </label>
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
  const text = chatWidgetStyleI18n[language]
  const iconChoiceRef = useRef<HTMLDivElement | null>(null)
  const iconChoiceButtonRefs = useRef<Partial<Record<StyleSelectorProps['bubbleStyle']['iconChoice'], HTMLButtonElement | null>>>({})
  const [iconIndicator, setIconIndicator] = useState<{
    left: number
    top: number
    width: number
    height: number
    opacity: number
  } | null>(null)

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
    onConversationCardsChange([
      ...conversationCards,
      {
        id: crypto.randomUUID(),
        title: `Starter card ${conversationCards.length + 1}`,
        description: 'Help visitors choose the right topic quickly.',
        icon: 'FiMessageCircle',
        options: [
          {
            label: 'Example question',
            prompt: 'How can you help me?',
            description: 'Replace this with a real next step.',
          },
        ],
      },
    ])
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
          <div className={`option-card ${bubbleStyle.showStatus ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={bubbleStyle.showStatus} onClick={() => onBubbleStyleChange({ ...bubbleStyle, showStatus: !bubbleStyle.showStatus })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onBubbleStyleChange({ ...bubbleStyle, showStatus: !bubbleStyle.showStatus }))}>
            <span className="option-title">{text.labels.showStatusDot}</span>
            <OptionDesc>{text.labels.showStatusDotDesc}</OptionDesc>
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">{text.labels.borderType}</span>
            <GlassRadioRow name="bubble-border-type" value={bubbleStyle.borderType} options={[{ value: 'none', label: text.options.none }, { value: 'solid', label: text.options.solid }, { value: 'rounded', label: text.options.rounded }, { value: 'shadow', label: text.options.shadow }]} onChange={(nextValue) => onBubbleStyleChange({ ...bubbleStyle, borderType: nextValue as BorderType })} />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">{text.labels.shadowType}</span>
            <GlassRadioRow name="bubble-shadow-type" value={bubbleStyle.shadowType} options={[{ value: 'none', label: text.options.none }, { value: 'light', label: text.options.light }, { value: 'medium', label: text.options.medium }, { value: 'heavy', label: text.options.heavy }]} onChange={(nextValue) => onBubbleStyleChange({ ...bubbleStyle, shadowType: nextValue as ShadowType })} />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">{text.labels.animation}</span>
            <GlassRadioRow name="bubble-animation-type" value={bubbleStyle.animationType} options={[{ value: 'none', label: text.options.none }, { value: 'bounce', label: text.options.bounce }, { value: 'fade', label: text.options.fade }, { value: 'slide', label: text.options.slide }]} onChange={(nextValue) => onBubbleStyleChange({ ...bubbleStyle, animationType: nextValue as AnimationType })} />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">{text.labels.size}</span>
            <GlassRadioRow name="bubble-size-type" value={bubbleStyle.sizeType} options={[{ value: 'small', label: text.options.small }, { value: 'medium', label: text.options.medium }, { value: 'large', label: text.options.large }]} onChange={(nextValue) => onBubbleStyleChange({ ...bubbleStyle, sizeType: nextValue as SizeType })} />
          </div>

          <div className="option-card option-card--radio option-card--wide">
            <span className="option-title">{text.labels.launcherMode}</span>
            <OptionDesc>{text.labels.launcherModeDesc}</OptionDesc>
            <div className="iconChoiceGroup" ref={iconChoiceRef} role="radiogroup" aria-label="Launcher mode">
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
                    title={locked ? 'Available on Pro and Enterprise plans' : undefined}
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
                label={item.label}
                value={widgetIcons[item.field] || ''}
                onChange={(nextValue) => updateWidgetIcon(item.field, nextValue)}
                helperText={bubbleStyle.iconChoice === 'orb' ? 'Orb mode uses the orb visual instead of the launcher icon.' : customInterfaceIconsAvailable ? item.helper : 'Available on Pro and Enterprise plans.'}
                disabled={!customInterfaceIconsAvailable || bubbleStyle.iconChoice === 'orb'}
              />
            ))}
          </div>

          {bubbleStyle.iconChoice === 'orb' ? (
            <div className="option-card option-card--orb option-card--radio option-card--wide">
              <span className="option-title">Orb behavior</span>
              <OptionDesc>Set one hover letter, up to three reply letters, and up to five idle letters.</OptionDesc>
              <div className="orbSettingsGrid">
                <label className="orbField orbField--checkbox"><span>Show hover symbol</span><input type="checkbox" checked={orbStyle.hoverEnabled} onChange={(event) => updateOrbStyle({ hoverEnabled: event.target.checked })} /></label>
                <label className="orbField"><span>Hover letter</span><input type="text" maxLength={1} value={orbStyle.hoverGlyph} onChange={(event) => updateOrbStyle({ hoverGlyph: event.target.value.slice(0, 1).toUpperCase() })} placeholder="A" disabled={!orbStyle.hoverEnabled} /></label>
                <label className="orbField orbField--checkbox"><span>Show reply symbol</span><input type="checkbox" checked={orbStyle.replyEnabled} onChange={(event) => updateOrbStyle({ replyEnabled: event.target.checked })} /></label>
                <label className="orbField"><span>Reply letters</span><input type="text" maxLength={3} value={orbStyle.replyGlyphs} onChange={(event) => updateOrbStyle({ replyGlyphs: event.target.value.slice(0, 3).toUpperCase() })} placeholder="ABC" disabled={!orbStyle.replyEnabled} /></label>
                <label className="orbField orbField--checkbox"><span>Show inactive symbol</span><input type="checkbox" checked={orbStyle.inactiveEnabled} onChange={(event) => updateOrbStyle({ inactiveEnabled: event.target.checked })} /></label>
                <label className="orbField"><span>Inactive letters</span><input type="text" maxLength={5} value={orbStyle.inactiveGlyphs} onChange={(event) => updateOrbStyle({ inactiveGlyphs: event.target.value.slice(0, 5).toUpperCase() })} placeholder="ABCDE" disabled={!orbStyle.inactiveEnabled} /></label>
                <label className="orbField orbField--number"><span>Inactive min (min)</span><input type="number" min={1} max={60} step={1} value={inactivityMinMinutes} onChange={(event) => updateOrbStyle({ inactivityMinMinutes: Math.max(1, Math.min(60, Number(event.target.value) || 1)) })} placeholder="2" /></label>
                <label className="orbField orbField--number"><span>Inactive max (min)</span><input type="number" min={1} max={120} step={1} value={inactivityMaxMinutes} onChange={(event) => updateOrbStyle({ inactivityMaxMinutes: Math.max(1, Math.min(120, Number(event.target.value) || 1)) })} placeholder="4" /></label>
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
          <div className={`option-card ${headerStyle.showStatus ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={headerStyle.showStatus} onClick={() => onHeaderStyleChange({ ...headerStyle, showStatus: !headerStyle.showStatus })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onHeaderStyleChange({ ...headerStyle, showStatus: !headerStyle.showStatus }))}><span className="option-title">{text.labels.showStatus}</span><OptionDesc>{text.labels.showStatusDesc}</OptionDesc></div>
          <div className={`option-card ${headerStyle.showCloseButton ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={headerStyle.showCloseButton} onClick={() => onHeaderStyleChange({ ...headerStyle, showCloseButton: !headerStyle.showCloseButton })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onHeaderStyleChange({ ...headerStyle, showCloseButton: !headerStyle.showCloseButton }))}><span className="option-title">{text.labels.showCloseButton}</span><OptionDesc>{text.labels.showCloseButtonDesc}</OptionDesc></div>
          <div className={`option-card ${headerStyle.showAvatar ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={headerStyle.showAvatar} onClick={() => onHeaderStyleChange({ ...headerStyle, showAvatar: !headerStyle.showAvatar })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onHeaderStyleChange({ ...headerStyle, showAvatar: !headerStyle.showAvatar }))}><span className="option-title">{text.labels.showAvatar}</span><OptionDesc>{text.labels.showAvatarDesc}</OptionDesc></div>
          <div className={`option-card ${headerStyle.showTitle ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={headerStyle.showTitle} onClick={() => onHeaderStyleChange({ ...headerStyle, showTitle: !headerStyle.showTitle })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onHeaderStyleChange({ ...headerStyle, showTitle: !headerStyle.showTitle }))}><span className="option-title">{text.labels.showTitle}</span><OptionDesc>{text.labels.showTitleDesc}</OptionDesc></div>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.cornerStyle}</span><GlassRadioRow name="header-corner-style" value={headerCornerStyle} options={[{ value: 'rounded', label: text.options.rounded }, { value: 'square', label: text.options.square }]} onChange={(nextValue) => onHeaderStyleChange({ ...headerStyle, cornerStyle: nextValue as CornerStyle, borderType: getLegacyBorderType(headerShowBorder, nextValue as CornerStyle) })} /></div>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.showBorder}</span><GlassRadioRow name="header-show-border" value={headerShowBorder ? 'on' : 'off'} options={[{ value: 'on', label: text.options.on }, { value: 'off', label: text.options.off }]} onChange={(nextValue) => { const nextShowBorder = nextValue === 'on'; onHeaderStyleChange({ ...headerStyle, showBorder: nextShowBorder, borderType: getLegacyBorderType(nextShowBorder, headerCornerStyle) }) }} /></div>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.shadowType}</span><GlassRadioRow name="header-shadow-type" value={headerStyle.shadowType} options={[{ value: 'none', label: text.options.none }, { value: 'light', label: text.options.light }, { value: 'medium', label: text.options.medium }, { value: 'heavy', label: text.options.heavy }]} onChange={(nextValue) => onHeaderStyleChange({ ...headerStyle, shadowType: nextValue as ShadowType })} /></div>

          <div className="sectionIconGrid">
            {sectionIconFields.header.map((item) => (
              <IconPickerBubble
                key={item.field}
                label={item.label}
                value={widgetIcons[item.field] || ''}
                onChange={(nextValue) => updateWidgetIcon(item.field, nextValue)}
                helperText={customInterfaceIconsAvailable ? item.helper : 'Available on Pro and Enterprise plans.'}
                disabled={!customInterfaceIconsAvailable}
              />
            ))}
          </div>

          <label className="branding-field"><span>Widget title</span><input type="text" value={customBranding.title || ''} onChange={(event) => onCustomBrandingChange({ ...customBranding, title: event.target.value })} placeholder="Support Chat" /></label>
          <label className="branding-field"><span>Widget description</span><input type="text" value={customBranding.description || ''} onChange={(event) => onCustomBrandingChange({ ...customBranding, description: event.target.value })} placeholder="We are here to help you!" /></label>
          <div className="branding-field branding-field--logo"><label>Logo upload</label><LogoUploadEditor branding={customBranding} onChange={onCustomBrandingChange} /></div>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.body ? 'open' : ''}`} onClick={() => onToggleSection('body')} {...sectionHoverProps('body')}>
          <SectionLabel icon={<FiMessageSquare />} tone="gray">{text.sections.chatMessages}</SectionLabel>
          <span className="dropbtn-icon"><FiChevronDown /></span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.body ? 'open' : ''}`}>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.borderType}</span><GlassRadioRow name="body-border-type" value={bodyStyle.borderType} options={[{ value: 'none', label: text.options.none }, { value: 'solid', label: text.options.solid }, { value: 'rounded', label: text.options.rounded }, { value: 'shadow', label: text.options.shadow }]} onChange={(nextValue) => onBodyStyleChange({ ...bodyStyle, borderType: nextValue as BorderType })} /></div>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.shadowType}</span><GlassRadioRow name="body-shadow-type" value={bodyStyle.shadowType} options={[{ value: 'none', label: text.options.none }, { value: 'light', label: text.options.light }, { value: 'medium', label: text.options.medium }, { value: 'heavy', label: text.options.heavy }]} onChange={(nextValue) => onBodyStyleChange({ ...bodyStyle, shadowType: nextValue as ShadowType })} /></div>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.messageStyle}</span><GlassRadioRow name="body-message-style" value={bodyStyle.messageStyle} options={[{ value: 'bubble', label: text.options.bubble }, { value: 'flat', label: text.options.flat }, { value: 'card', label: text.options.card }]} onChange={(nextValue) => onBodyStyleChange({ ...bodyStyle, messageStyle: nextValue as MessageStyle })} /></div>
          <div className={`option-card ${bodyStyle.showTimestamps ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={bodyStyle.showTimestamps} onClick={() => onBodyStyleChange({ ...bodyStyle, showTimestamps: !bodyStyle.showTimestamps })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onBodyStyleChange({ ...bodyStyle, showTimestamps: !bodyStyle.showTimestamps }))}><span className="option-title">{text.labels.showTimestamps}</span><OptionDesc>{text.labels.showTimestampsDesc}</OptionDesc></div>
          <div className={`option-card ${bodyStyle.showReadReceipts ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={bodyStyle.showReadReceipts} onClick={() => onBodyStyleChange({ ...bodyStyle, showReadReceipts: !bodyStyle.showReadReceipts })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onBodyStyleChange({ ...bodyStyle, showReadReceipts: !bodyStyle.showReadReceipts }))}><span className="option-title">{text.labels.showReadReceipts}</span><OptionDesc>{text.labels.showReadReceiptsDesc}</OptionDesc></div>
          <div className={`option-card ${bodyStyle.showConversationCards ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={bodyStyle.showConversationCards} onClick={() => onBodyStyleChange({ ...bodyStyle, showConversationCards: !bodyStyle.showConversationCards })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onBodyStyleChange({ ...bodyStyle, showConversationCards: !bodyStyle.showConversationCards }))}><span className="option-title">{text.labels.showStarterCards}</span><OptionDesc>{text.labels.showStarterCardsDesc}</OptionDesc></div>
          {bodyStyle.showConversationCards ? <div className="option-card option-card--radio"><span className="option-title">{text.labels.cardStyle}</span><GlassRadioRow name="body-conversation-cards-style" value={bodyStyle.conversationCardsStyle} options={[{ value: 'modern', label: text.options.modern }, { value: 'minimal', label: text.options.minimal }, { value: 'bubble', label: text.options.bubbleGlow }, { value: 'image', label: text.options.imageBased }, { value: 'chips', label: text.options.quickChips }]} onChange={(nextValue) => onBodyStyleChange({ ...bodyStyle, conversationCardsStyle: nextValue as StyleSelectorProps['bodyStyle']['conversationCardsStyle'] })} /></div> : null}

          <div className="sectionIconGrid">
            {sectionIconFields.body.map((item) => (
              <IconPickerBubble
                key={item.field}
                label={item.label}
                value={widgetIcons[item.field] || ''}
                onChange={(nextValue) => updateWidgetIcon(item.field, nextValue)}
                helperText={customInterfaceIconsAvailable ? item.helper : 'Available on Pro and Enterprise plans.'}
                disabled={!customInterfaceIconsAvailable}
              />
            ))}
          </div>

          {bodyStyle.showConversationCards ? (
            <div className="starterCardsPanel">
              <div className="starterCardsPanel__header">
                <div>
                  <strong>Starter cards</strong>
                  <p>Edit the actual cards shown in the widget preview and export.</p>
                </div>
                <label className="starterCardsPanel__toggle">
                  <input type="checkbox" checked={conversationCardsEnabled} onChange={(event) => onConversationCardsEnabledChange(event.target.checked)} />
                  <span>Enabled</span>
                </label>
              </div>

              <div className="starterCardsPanel__controls">
                <label className="branding-field">
                  <span>Cards shown</span>
                  <input type="number" min="1" max="12" value={conversationCardsLimit} disabled={!conversationCardsEnabled} onChange={(event) => onConversationCardsLimitChange(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} />
                </label>
                <div className="starterCardsPanel__actions">
                  <button type="button" className="starterCardsPanel__action" onClick={addConversationCard} disabled={!conversationCardsEnabled}>Add card</button>
                  <button type="button" className="starterCardsPanel__action secondary" onClick={() => onConversationCardsChange(defaultConversationCards)} disabled={!conversationCardsEnabled}>Reset</button>
                </div>
              </div>

              <div className="starterCardsPanel__list">
                {conversationCards.map((card, index) => (
                  <StarterCardEditor
                    key={card.id}
                    card={card}
                    index={index}
                    disabled={!conversationCardsEnabled}
                    style={bodyStyle.conversationCardsStyle}
                    onChange={(nextCard) => updateConversationCard(index, nextCard)}
                    onRemove={() => onConversationCardsChange(conversationCards.filter((_, cardIndex) => cardIndex !== index))}
                  />
                ))}
              </div>
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
          <div className={`option-card ${footerStyle.showSendButton ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={footerStyle.showSendButton} onClick={() => onFooterStyleChange({ ...footerStyle, showSendButton: !footerStyle.showSendButton })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onFooterStyleChange({ ...footerStyle, showSendButton: !footerStyle.showSendButton }))}><span className="option-title">{text.labels.showSendButton}</span><OptionDesc>{text.labels.showSendButtonDesc}</OptionDesc></div>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.cornerStyle}</span><GlassRadioRow name="footer-corner-style" value={footerCornerStyle} options={[{ value: 'rounded', label: text.options.rounded }, { value: 'square', label: text.options.square }]} onChange={(nextValue) => onFooterStyleChange({ ...footerStyle, cornerStyle: nextValue as CornerStyle, borderType: getLegacyBorderType(footerShowBorder, nextValue as CornerStyle) })} /></div>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.showBorder}</span><GlassRadioRow name="footer-show-border" value={footerShowBorder ? 'on' : 'off'} options={[{ value: 'on', label: text.options.on }, { value: 'off', label: text.options.off }]} onChange={(nextValue) => { const nextShowBorder = nextValue === 'on'; onFooterStyleChange({ ...footerStyle, showBorder: nextShowBorder, borderType: getLegacyBorderType(nextShowBorder, footerCornerStyle) }) }} /></div>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.shadowType}</span><GlassRadioRow name="footer-shadow-type" value={footerStyle.shadowType} options={[{ value: 'none', label: text.options.none }, { value: 'light', label: text.options.light }, { value: 'medium', label: text.options.medium }, { value: 'heavy', label: text.options.heavy }]} onChange={(nextValue) => onFooterStyleChange({ ...footerStyle, shadowType: nextValue as ShadowType })} /></div>
          <div className="option-card option-card--radio"><span className="option-title">{text.labels.inputStyle}</span><GlassRadioRow name="footer-input-style" value={footerStyle.inputStyle} options={[{ value: 'flat', label: text.options.flat }, { value: 'rounded', label: text.options.rounded }, { value: 'outlined', label: text.options.outlined }]} onChange={(nextValue) => onFooterStyleChange({ ...footerStyle, inputStyle: nextValue as InputStyle })} /></div>
          <div className={`option-card ${footerStyle.showPlaceholder ? 'checked' : ''}`} role="button" tabIndex={0} aria-pressed={footerStyle.showPlaceholder} onClick={() => onFooterStyleChange({ ...footerStyle, showPlaceholder: !footerStyle.showPlaceholder })} onKeyDown={(event) => handleToggleCardKeyDown(event, () => onFooterStyleChange({ ...footerStyle, showPlaceholder: !footerStyle.showPlaceholder }))}><span className="option-title">{text.labels.showPlaceholder}</span><OptionDesc>{text.labels.showPlaceholderDesc}</OptionDesc></div>

          <div className="sectionIconGrid">
            {sectionIconFields.footer.map((item) => (
              <IconPickerBubble
                key={item.field}
                label={item.label}
                value={widgetIcons[item.field] || ''}
                onChange={(nextValue) => updateWidgetIcon(item.field, nextValue)}
                helperText={customInterfaceIconsAvailable ? item.helper : 'Available on Pro and Enterprise plans.'}
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
              options={Object.entries(colorThemeInfo).map(([theme, info]) => ({ value: theme as ColorTheme, label: info.label, description: info.description, swatches: colorThemeSwatches[theme as ColorTheme] }))}
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
            <label>{text.labels.autoOpenDelay}</label>
            <input type="number" value={settings.delayMs || 3000} onChange={(event) => onSettingsChange({ ...settings, delayMs: parseInt(event.target.value || '0', 10) })} min="0" max="10000" step="500" />
          </div>
        </div>
      </div>
    </>
  )
}
