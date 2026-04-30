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
  FiMapPin,
  FiLock,
  FiMessageCircle,
  FiMessageSquare,
  FiPhone,
  FiSend,
  FiSliders,
  FiLifeBuoy,
} from 'react-icons/fi'
import type { BubbleIconChoice, OrbStyleConfig } from '@/types/database'
import './StyleSelector.css'

type ColorTheme = 'modern' | 'chilling' | 'corporate' | 'luxury'
type Plan = 'free' | 'pro' | 'business'
type Position = 'bottom-right' | 'bottom-left' 
type BorderType = 'none' | 'solid' | 'rounded' | 'shadow'
type ShadowType = 'none' | 'light' | 'medium' | 'heavy'
type AnimationType = 'none' | 'bounce' | 'fade' | 'slide'
type SizeType = 'small' | 'medium' | 'large'
type MessageStyle = 'bubble' | 'flat' | 'card'
type InputStyle = 'flat' | 'rounded' | 'outlined'

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
  }
  footerStyle: {
    showSendButton: boolean
    borderType: BorderType
    shadowType: ShadowType
    inputStyle: InputStyle
    showPlaceholder: boolean
  }
  onBubbleStyleChange: (style: StyleSelectorProps['bubbleStyle']) => void
  onHeaderStyleChange: (style: StyleSelectorProps['headerStyle']) => void
  onBodyStyleChange: (style: StyleSelectorProps['bodyStyle']) => void
  onFooterStyleChange: (style: StyleSelectorProps['footerStyle']) => void
  colorTheme: ColorTheme
  plan: Plan
  position: Position
  customBranding: CustomBranding
  settings: {
    autoOpen: boolean
    delayMs: number
  }
  onColorThemeChange: (theme: ColorTheme) => void
  onPositionChange: (position: Position) => void
  onCustomBrandingChange: (branding: CustomBranding) => void
  onSettingsChange: (settings: any) => void
  openSections: {
    bubble: boolean
    header: boolean
    body: boolean
    footer: boolean
    colorTheme: boolean
    position: boolean
    branding: boolean
    advanced: boolean
  }
  onToggleSection: (
    section: 'bubble' | 'header' | 'body' | 'footer' | 'colorTheme' | 'position' | 'branding' | 'advanced'
  ) => void
}

const colorThemeInfo: Record<ColorTheme, { label: string; description: string }> = {
  modern: { label: 'Modern', description: 'Clean and contemporary' },
  chilling: { label: 'Chilling', description: 'Relaxed and friendly' },
  corporate: { label: 'Corporate', description: 'Professional and serious' },
  luxury: { label: 'Luxury', description: 'Exclusive and elegant' },
}

const iconChoices: Array<{
  value: StyleSelectorProps['bubbleStyle']['iconChoice']
  label: string
  icon: ReactNode
  minPlan?: Exclude<Plan, 'free'>
}> = [
  { value: 'chat', label: 'Chat', icon: <FiMessageCircle /> },
  { value: 'phone', label: 'Phone', icon: <FiPhone /> },
  { value: 'cpu', label: 'Robot', icon: <FiCpu /> },
  { value: 'message', label: 'Message', icon: <FiMessageSquare /> },
  { value: 'support', label: 'Support', icon: <FiLifeBuoy /> },
  {
    value: 'orb',
    label: 'Orb',
    icon: <span className="iconChoiceOrbPreview" aria-hidden="true" />,
    minPlan: 'pro',
  },
]

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
  const [indicator, setIndicator] = useState<{ left: number; width: number; opacity: number } | null>(null)

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
        width: activeButton.offsetWidth,
        opacity: 1,
      })
    }

    const raf1 = window.requestAnimationFrame(() => {
      const raf2 = window.requestAnimationFrame(updateIndicator)
      cleanup.push(() => window.cancelAnimationFrame(raf2))
    })

    cleanup.push(() => window.cancelAnimationFrame(raf1))
    const resizeObserver = new ResizeObserver(updateIndicator)

    if (rowRef.current) {
      resizeObserver.observe(rowRef.current)
    }

    const activeButton = buttonRefs.current[value]
    if (activeButton) {
      resizeObserver.observe(activeButton)
    }

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
            transform: `translateX(${indicator.left}px)`,
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
                  <span
                    key={`${option.value}-${swatch}`}
                    className="glassRadioSwatch"
                    style={{ backgroundColor: swatch }}
                  />
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

    const nextFocusX = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
    const nextFocusY = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)

    updateLogoStyle({
      focusX: nextFocusX,
      focusY: nextFocusY,
    })
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files?.[0]
    await setLogoFromFile(file)
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await setLogoFromFile(event.target.files?.[0])
    event.target.value = ''
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="logoEditor">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        onChange={handleFileChange}
        className="logoEditorInput"
      />

      <div
        className={`logoEditorDropzone ${isDragOver ? 'is-dragging' : ''} ${branding.logo ? 'has-image' : 'empty'}`}
        onClick={openFilePicker}
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
            openFilePicker()
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
              if (!isDraggingFocus) return
              applyFocusFromPointer(event)
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
            <div className="logoEditorHint">
              Drag inside the circle to reposition
            </div>
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
          <input
            type="range"
            min="80"
            max="180"
            step="1"
            value={logoStyle.zoom}
            onChange={(event) => updateLogoStyle({ zoom: Number(event.target.value) })}
            disabled={!branding.logo}
          />
        </label>

        <div className="logoEditorGrid">
          <label className="branding-field">
            <span>Horizontal position</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={logoStyle.focusX}
              onChange={(event) => updateLogoStyle({ focusX: Number(event.target.value) })}
              disabled={!branding.logo}
            />
          </label>

          <label className="branding-field">
            <span>Vertical position</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={logoStyle.focusY}
              onChange={(event) => updateLogoStyle({ focusY: Number(event.target.value) })}
              disabled={!branding.logo}
            />
          </label>
        </div>

        <div className="logoEditorActions">
          <button
            type="button"
            className="logoEditorAction"
            onClick={() => updateBranding({ logo: undefined })}
            disabled={!branding.logo}
          >
            Remove logo
          </button>
          <button
            type="button"
            className="logoEditorAction secondary"
            onClick={() => updateLogoStyle(defaultLogoStyle)}
            disabled={!branding.logo}
          >
            Reset crop
          </button>
        </div>

        <p className="logoEditorMeta">
          PNG only. Drop a file, then drag within the circle or adjust the sliders.
        </p>

        {error ? <p className="logoEditorError">{error}</p> : null}
      </div>
    </div>
  )
}

export default function StyleSelector({
  bubbleStyle,
  headerStyle,
  bodyStyle,
  footerStyle,
  onBubbleStyleChange,
  onHeaderStyleChange,
  onBodyStyleChange,
  onFooterStyleChange,
  colorTheme,
  plan,
  position,
  customBranding,
  settings,
  onColorThemeChange,
  onPositionChange,
  onCustomBrandingChange,
  onSettingsChange,
  openSections,
  onToggleSection,
}: StyleSelectorProps) {
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

  const inactivityMinMinutes = Number.isFinite(orbStyle.inactivityMinMinutes)
    ? orbStyle.inactivityMinMinutes
    : 2
  const inactivityMaxMinutes = Number.isFinite(orbStyle.inactivityMaxMinutes)
    ? orbStyle.inactivityMaxMinutes
    : 4

  const updateOrbStyle = (patch: Partial<OrbStyleConfig>) => {
    onBubbleStyleChange({
      ...bubbleStyle,
      orbStyle: {
        ...orbStyle,
        ...patch,
      },
    })
  }

  const handleToggleCardKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    onToggle: () => void,
  ) => {
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

    if (iconChoiceRef.current) {
      resizeObserver.observe(iconChoiceRef.current)
    }

    const activeButton = iconChoiceButtonRefs.current[activeIconChoice]
    if (activeButton) {
      resizeObserver.observe(activeButton)
    }

    window.addEventListener('resize', updateIndicator)
    return () => {
      window.removeEventListener('resize', updateIndicator)
      resizeObserver.disconnect()
    }
  }, [activeIconChoice])

  return (
    <>
      <div className="group">
        <button type="button" className={`dropbtn ${openSections.bubble ? 'open' : ''}`} onClick={() => onToggleSection('bubble')}>
          <SectionLabel icon={<FiMessageCircle />} tone="gray">Chat button</SectionLabel>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.bubble ? 'open' : ''}`}>
          <div
            className={`option-card ${bubbleStyle.showStatus ? 'checked' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={bubbleStyle.showStatus}
            onClick={() => onBubbleStyleChange({ ...bubbleStyle, showStatus: !bubbleStyle.showStatus })}
            onKeyDown={(event) =>
              handleToggleCardKeyDown(event, () =>
                onBubbleStyleChange({ ...bubbleStyle, showStatus: !bubbleStyle.showStatus })
              )
            }
          >
            <span className="option-title">Show status dot</span>
            <OptionDesc>Show online/status dot on widget bubble</OptionDesc>
          </div>

          <div className="option-card">
            <span className="option-title">Icon choice</span>
            <div className="iconChoiceGroup " ref={iconChoiceRef} role="radiogroup" aria-label="Icon choice">
              {iconIndicator ? (
                <span
                  className="iconChoiceIndicator"
                  style={{
                    transform: `translate3d(${iconIndicator.left}px, ${iconIndicator.top}px, 0)`,
                    width: `${iconIndicator.width}px`,
                    height: `${iconIndicator.height}px`,
                    opacity: iconIndicator.opacity,
                  }}
                />
              ) : null}
              {iconChoices.map((choice) => {
                const locked = choice.minPlan === 'pro' && plan === 'free'
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
                    onClick={() =>
                      !locked && onBubbleStyleChange({ ...bubbleStyle, iconChoice: choice.value })
                    }
                  >
                    <span className="iconChoiceIcon">{choice.icon}</span>
                    <span>{choice.label}</span>
                    {locked && (
                      <span className="iconChoiceLock">
                        <FiLock />
                        Pro
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Border type</span>
            <GlassRadioRow
              name="bubble-border-type"
              value={bubbleStyle.borderType}
              options={[
                { value: 'none', label: 'None' },
                { value: 'solid', label: 'Solid' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'shadow', label: 'Shadow' },
              ]}
              onChange={(nextValue) =>
                onBubbleStyleChange({ ...bubbleStyle, borderType: nextValue as BorderType })
              }
            />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Shadow type</span>
            <GlassRadioRow
              name="bubble-shadow-type"
              value={bubbleStyle.shadowType}
              options={[
                { value: 'none', label: 'None' },
                { value: 'light', label: 'Light' },
                { value: 'medium', label: 'Medium' },
                { value: 'heavy', label: 'Heavy' },
              ]}
              onChange={(nextValue) =>
                onBubbleStyleChange({ ...bubbleStyle, shadowType: nextValue as ShadowType })
              }
            />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Animation</span>
            <GlassRadioRow
              name="bubble-animation-type"
              value={bubbleStyle.animationType}
              options={[
                { value: 'none', label: 'None' },
                { value: 'bounce', label: 'Bounce' },
                { value: 'fade', label: 'Fade' },
                { value: 'slide', label: 'Slide' },
              ]}
              onChange={(nextValue) =>
                onBubbleStyleChange({ ...bubbleStyle, animationType: nextValue as AnimationType })
              }
            />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Size</span>
            <GlassRadioRow
              name="bubble-size-type"
              value={bubbleStyle.sizeType}
              options={[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ]}
              onChange={(nextValue) =>
                onBubbleStyleChange({ ...bubbleStyle, sizeType: nextValue as SizeType })
              }
            />
          </div>

          {bubbleStyle.iconChoice === 'orb' && (
            <div className="option-card option-card--orb option-card--radio">
              <span className="option-title">Orb behavior</span>
              <OptionDesc>Set one hover letter, up to three reply letters, and up to five idle letters.</OptionDesc>

              <div className="orbSettingsGrid">
                <label className="orbField orbField--checkbox">
                  <span>Show hover symbol</span>
                  <input
                    type="checkbox"
                    checked={orbStyle.hoverEnabled}
                    onChange={(event) => updateOrbStyle({ hoverEnabled: event.target.checked })}
                  />
                </label>

                <label className="orbField">
                  <span>Hover letter</span>
                  <input
                    type="text"
                    maxLength={1}
                    value={orbStyle.hoverGlyph}
                    onChange={(event) =>
                      updateOrbStyle({ hoverGlyph: event.target.value.slice(0, 1).toUpperCase() })
                    }
                    placeholder="A"
                    disabled={!orbStyle.hoverEnabled}
                  />
                </label>

                <label className="orbField orbField--checkbox">
                  <span>Show reply symbol</span>
                  <input
                    type="checkbox"
                    checked={orbStyle.replyEnabled}
                    onChange={(event) => updateOrbStyle({ replyEnabled: event.target.checked })}
                  />
                </label>

                <label className="orbField">
                  <span>Reply letters</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={orbStyle.replyGlyphs}
                    onChange={(event) =>
                      updateOrbStyle({ replyGlyphs: event.target.value.slice(0, 3).toUpperCase() })
                    }
                    placeholder="ABC"
                    disabled={!orbStyle.replyEnabled}
                  />
                </label>

                <label className="orbField orbField--checkbox">
                  <span>Show inactive symbol</span>
                  <input
                    type="checkbox"
                    checked={orbStyle.inactiveEnabled}
                    onChange={(event) => updateOrbStyle({ inactiveEnabled: event.target.checked })}
                  />
                </label>

                <label className="orbField">
                  <span>Inactive letters</span>
                  <input
                    type="text"
                    maxLength={5}
                    value={orbStyle.inactiveGlyphs}
                    onChange={(event) =>
                      updateOrbStyle({ inactiveGlyphs: event.target.value.slice(0, 5).toUpperCase() })
                    }
                    placeholder="ABCDE"
                    disabled={!orbStyle.inactiveEnabled}
                  />
                </label>

                <label className="orbField orbField--number">
                  <span>Inactive min (min)</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    step={1}
                    value={inactivityMinMinutes}
                    onChange={(event) =>
                      updateOrbStyle({
                        inactivityMinMinutes: Math.max(1, Math.min(60, Number(event.target.value) || 1)),
                      })
                    }
                    placeholder="2"
                  />
                </label>

                <label className="orbField orbField--number">
                  <span>Inactive max (min)</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    step={1}
                    value={inactivityMaxMinutes}
                    onChange={(event) =>
                      updateOrbStyle({
                        inactivityMaxMinutes: Math.max(1, Math.min(120, Number(event.target.value) || 1)),
                      })
                    }
                    placeholder="4"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.header ? 'open' : ''}`} onClick={() => onToggleSection('header')}>
          <SectionLabel icon={<FiLayout />} tone="gray">Chat top bar</SectionLabel>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.header ? 'open' : ''}`}>
          <div
            className={`option-card ${headerStyle.showStatus ? 'checked' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={headerStyle.showStatus}
            onClick={() => onHeaderStyleChange({ ...headerStyle, showStatus: !headerStyle.showStatus })}
            onKeyDown={(event) =>
              handleToggleCardKeyDown(event, () =>
                onHeaderStyleChange({ ...headerStyle, showStatus: !headerStyle.showStatus })
              )
            }
          >
            <span className="option-title">Show status</span>
            <OptionDesc>Show online indicator in header</OptionDesc>
          </div>

          <div
            className={`option-card ${headerStyle.showCloseButton ? 'checked' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={headerStyle.showCloseButton}
            onClick={() => onHeaderStyleChange({ ...headerStyle, showCloseButton: !headerStyle.showCloseButton })}
            onKeyDown={(event) =>
              handleToggleCardKeyDown(event, () =>
                onHeaderStyleChange({ ...headerStyle, showCloseButton: !headerStyle.showCloseButton })
              )
            }
          >
            <span className="option-title">Show close button</span>
            <OptionDesc>Show close button in header</OptionDesc>
          </div>

          <div
            className={`option-card ${headerStyle.showAvatar ? 'checked' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={headerStyle.showAvatar}
            onClick={() => onHeaderStyleChange({ ...headerStyle, showAvatar: !headerStyle.showAvatar })}
            onKeyDown={(event) =>
              handleToggleCardKeyDown(event, () =>
                onHeaderStyleChange({ ...headerStyle, showAvatar: !headerStyle.showAvatar })
              )
            }
          >
            <span className="option-title">Show avatar</span>
            <OptionDesc>Show avatar in header</OptionDesc>
          </div>

          <div
            className={`option-card ${headerStyle.showTitle ? 'checked' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={headerStyle.showTitle}
            onClick={() => onHeaderStyleChange({ ...headerStyle, showTitle: !headerStyle.showTitle })}
            onKeyDown={(event) =>
              handleToggleCardKeyDown(event, () =>
                onHeaderStyleChange({ ...headerStyle, showTitle: !headerStyle.showTitle })
              )
            }
          >
            <span className="option-title">Show title</span>
            <OptionDesc>Show widget title in header</OptionDesc>
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Border type</span>
            <GlassRadioRow
              name="header-border-type"
              value={headerStyle.borderType}
              options={[
                { value: 'none', label: 'None' },
                { value: 'solid', label: 'Solid' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'shadow', label: 'Shadow' },
              ]}
              onChange={(nextValue) =>
                onHeaderStyleChange({ ...headerStyle, borderType: nextValue as BorderType })
              }
            />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Shadow type</span>
            <GlassRadioRow
              name="header-shadow-type"
              value={headerStyle.shadowType}
              options={[
                { value: 'none', label: 'None' },
                { value: 'light', label: 'Light' },
                { value: 'medium', label: 'Medium' },
                { value: 'heavy', label: 'Heavy' },
              ]}
              onChange={(nextValue) =>
                onHeaderStyleChange({ ...headerStyle, shadowType: nextValue as ShadowType })
              }
            />
          </div>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.body ? 'open' : ''}`} onClick={() => onToggleSection('body')}>
          <SectionLabel icon={<FiMessageSquare />} tone="gray">Chat messages</SectionLabel>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.body ? 'open' : ''}`}>
          <div className="option-card option-card--radio">
            <span className="option-title">Border type</span>
            <GlassRadioRow
              name="body-border-type"
              value={bodyStyle.borderType}
              options={[
                { value: 'none', label: 'None' },
                { value: 'solid', label: 'Solid' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'shadow', label: 'Shadow' },
              ]}
              onChange={(nextValue) =>
                onBodyStyleChange({ ...bodyStyle, borderType: nextValue as BorderType })
              }
            />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Shadow type</span>
            <GlassRadioRow
              name="body-shadow-type"
              value={bodyStyle.shadowType}
              options={[
                { value: 'none', label: 'None' },
                { value: 'light', label: 'Light' },
                { value: 'medium', label: 'Medium' },
                { value: 'heavy', label: 'Heavy' },
              ]}
              onChange={(nextValue) =>
                onBodyStyleChange({ ...bodyStyle, shadowType: nextValue as ShadowType })
              }
            />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Message style</span>
            <GlassRadioRow
              name="body-message-style"
              value={bodyStyle.messageStyle}
              options={[
                { value: 'bubble', label: 'Bubble' },
                { value: 'flat', label: 'Flat' },
                { value: 'card', label: 'Card' },
              ]}
              onChange={(nextValue) =>
                onBodyStyleChange({ ...bodyStyle, messageStyle: nextValue as MessageStyle })
              }
            />
          </div>

          <div
            className={`option-card ${bodyStyle.showTimestamps ? 'checked' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={bodyStyle.showTimestamps}
            onClick={() => onBodyStyleChange({ ...bodyStyle, showTimestamps: !bodyStyle.showTimestamps })}
            onKeyDown={(event) =>
              handleToggleCardKeyDown(event, () =>
                onBodyStyleChange({ ...bodyStyle, showTimestamps: !bodyStyle.showTimestamps })
              )
            }
          >
            <span className="option-title">Show timestamps</span>
            <OptionDesc>Show message timestamps</OptionDesc>
          </div>

          <div
            className={`option-card ${bodyStyle.showReadReceipts ? 'checked' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={bodyStyle.showReadReceipts}
            onClick={() => onBodyStyleChange({ ...bodyStyle, showReadReceipts: !bodyStyle.showReadReceipts })}
            onKeyDown={(event) =>
              handleToggleCardKeyDown(event, () =>
                onBodyStyleChange({ ...bodyStyle, showReadReceipts: !bodyStyle.showReadReceipts })
              )
            }
          >
            <span className="option-title">Show read receipts</span>
            <OptionDesc>Show read receipts on messages</OptionDesc>
          </div>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.footer ? 'open' : ''}`} onClick={() => onToggleSection('footer')}>
          <SectionLabel icon={<FiSend />} tone="gray">Message box</SectionLabel>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.footer ? 'open' : ''}`}>
          <div
            className={`option-card ${footerStyle.showSendButton ? 'checked' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={footerStyle.showSendButton}
            onClick={() => onFooterStyleChange({ ...footerStyle, showSendButton: !footerStyle.showSendButton })}
            onKeyDown={(event) =>
              handleToggleCardKeyDown(event, () =>
                onFooterStyleChange({ ...footerStyle, showSendButton: !footerStyle.showSendButton })
              )
            }
          >
            <span className="option-title">Show send button</span>
            <OptionDesc>Show send button in footer</OptionDesc>
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Border type</span>
            <GlassRadioRow
              name="footer-border-type"
              value={footerStyle.borderType}
              options={[
                { value: 'none', label: 'None' },
                { value: 'solid', label: 'Solid' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'shadow', label: 'Shadow' },
              ]}
              onChange={(nextValue) =>
                onFooterStyleChange({ ...footerStyle, borderType: nextValue as BorderType })
              }
            />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Shadow type</span>
            <GlassRadioRow
              name="footer-shadow-type"
              value={footerStyle.shadowType}
              options={[
                { value: 'none', label: 'None' },
                { value: 'light', label: 'Light' },
                { value: 'medium', label: 'Medium' },
                { value: 'heavy', label: 'Heavy' },
              ]}
              onChange={(nextValue) =>
                onFooterStyleChange({ ...footerStyle, shadowType: nextValue as ShadowType })
              }
            />
          </div>

          <div className="option-card option-card--radio">
            <span className="option-title">Input style</span>
            <GlassRadioRow
              name="footer-input-style"
              value={footerStyle.inputStyle}
              options={[
                { value: 'flat', label: 'Flat' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'outlined', label: 'Outlined' },
              ]}
              onChange={(nextValue) =>
                onFooterStyleChange({ ...footerStyle, inputStyle: nextValue as InputStyle })
              }
            />
          </div>

          <div
            className={`option-card ${footerStyle.showPlaceholder ? 'checked' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={footerStyle.showPlaceholder}
            onClick={() => onFooterStyleChange({ ...footerStyle, showPlaceholder: !footerStyle.showPlaceholder })}
            onKeyDown={(event) =>
              handleToggleCardKeyDown(event, () =>
                onFooterStyleChange({ ...footerStyle, showPlaceholder: !footerStyle.showPlaceholder })
              )
            }
          >
            <span className="option-title">Show placeholder</span>
            <OptionDesc>Show placeholder text in input field</OptionDesc>
          </div>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.colorTheme ? 'open' : ''}`} onClick={() => onToggleSection('colorTheme')}>
          <SectionLabel icon={<FiDroplet />} tone="colorful">Colors</SectionLabel>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.colorTheme ? 'open' : ''}`}>
          <div className="option-card option-card--radio">
            <span className="option-title">Theme</span>
            <GlassRadioRow
              name="color-theme"
              value={colorTheme}
              options={Object.entries(colorThemeInfo).map(([theme, info]) => ({
                value: theme as ColorTheme,
                label: info.label,
                description: info.description,
                swatches:
                  theme === 'modern'
                    ? ['#3b82f6', '#1e40af', '#ffffff', '#e5e7eb']
                    : theme === 'chilling'
                      ? ['#10b981', '#047857', '#f0fdf4', '#bbf7d0']
                      : theme === 'corporate'
                        ? ['#6b7280', '#374151', '#f9fafb', '#d1d5db']
                        : ['#7c3aed', '#5b21b6', '#faf5ff', '#e9d5ff'],
              }))}
              onChange={(nextValue) => onColorThemeChange(nextValue as ColorTheme)}
            />
          </div>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.position ? 'open' : ''}`} onClick={() => onToggleSection('position')}>
          <SectionLabel icon={<FiMapPin />} tone="red">Screen position</SectionLabel>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.position ? 'open' : ''}`}>
          <div className="option-card">
            <span className="option-title">Position</span>
            <GlassRadioRow
              name="widget-position"
              value={position}
              options={[
                { value: 'bottom-right', label: 'Bottom right', description: 'Bottom right of the screen' },
                { value: 'bottom-left', label: 'Bottom left', description: 'Bottom left of the screen' },
              ]}
              onChange={(nextValue) => onPositionChange(nextValue as Position)}
            />
          </div>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.branding ? 'open' : ''}`} onClick={() => onToggleSection('branding')}>
          <SectionLabel icon={<FiImage />} tone="neutral">Your branding</SectionLabel>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`branding-content dropdown-content ${openSections.branding ? 'open' : ''}`}>
          <div className="branding-field">
            <label>Widget title</label>
            <input
              type="text"
              value={customBranding.title || ''}
              onChange={(e) => onCustomBrandingChange({ ...customBranding, title: e.target.value })}
              placeholder="Support Chat"
            />
          </div>

          <div className="branding-field">
            <label>Widget description</label>
            <input
              type="text"
              value={customBranding.description || ''}
              onChange={(e) => onCustomBrandingChange({ ...customBranding, description: e.target.value })}
              placeholder="We are here to help you!"
            />
          </div>

          <div className="branding-field branding-field--logo">
            <label>Logo upload</label>
            <LogoUploadEditor branding={customBranding} onChange={onCustomBrandingChange} />
          </div>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.advanced ? 'open' : ''}`} onClick={() => onToggleSection('advanced')}>
          <SectionLabel icon={<FiSliders />} tone="neutral">Widget behavior</SectionLabel>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`advanced-content dropdown-content ${openSections.advanced ? 'open' : ''}`}>
          <div className="advanced-field">
            <label>
              <input
                type="checkbox"
                checked={settings.autoOpen || false}
                onChange={(e) => onSettingsChange({ ...settings, autoOpen: e.target.checked })}
              />
              Auto-open widget
            </label>
          </div>

          <div className="advanced-field">
            <label>Delay before auto-open (milliseconds)</label>
            <input
              type="number"
              value={settings.delayMs || 3000}
              onChange={(e) => onSettingsChange({ ...settings, delayMs: parseInt(e.target.value || '0', 10) })}
              min="0"
              max="10000"
              step="500"
            />
          </div>
        </div>
      </div>
    </>
  )
}
