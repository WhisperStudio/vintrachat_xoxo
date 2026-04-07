'use client'

import { FiChevronDown } from 'react-icons/fi'

type ColorTheme = 'modern' | 'chilling' | 'corporate' | 'luxury'
type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
type BorderType = 'none' | 'solid' | 'rounded' | 'shadow'
type ShadowType = 'none' | 'light' | 'medium' | 'heavy'
type AnimationType = 'none' | 'bounce' | 'fade' | 'slide'
type SizeType = 'small' | 'medium' | 'large'
type MessageStyle = 'bubble' | 'flat' | 'card'
type InputStyle = 'flat' | 'rounded' | 'outlined'

interface StyleSelectorProps {
  bubbleStyle: {
    showStatus: boolean
    showCloseButton: boolean
    borderType: BorderType
    shadowType: ShadowType
    animationType: AnimationType
    sizeType: SizeType
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
  position: Position
  customBranding: {
    title?: string
    description?: string
    logo?: string
  }
  settings: {
    autoOpen: boolean
    delayMs: number
  }
  onColorThemeChange: (theme: ColorTheme) => void
  onPositionChange: (position: Position) => void
  onCustomBrandingChange: (branding: any) => void
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
  return (
    <>
      <div className="group">
        <button type="button" className={`dropbtn ${openSections.bubble ? 'open' : ''}`} onClick={() => onToggleSection('bubble')}>
          <span className="label">🫧 Chat bubble design</span>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.bubble ? 'open' : ''}`}>
          <label className="option-card">
            <input
              type="checkbox"
              checked={bubbleStyle.showStatus}
              onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, showStatus: e.target.checked })}
            />
            <span className="option-title">Show status dot</span>
            <span className="option-desc">Show online/status dot on widget bubble</span>
          </label>

          <label className="option-card">
            <input
              type="checkbox"
              checked={bubbleStyle.showCloseButton}
              onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, showCloseButton: e.target.checked })}
            />
            <span className="option-title">Show close button</span>
            <span className="option-desc">Show close action on widget bubble</span>
          </label>

          <label className="option-card">
            <span className="option-title">Border type</span>
            <select value={bubbleStyle.borderType} onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, borderType: e.target.value as BorderType })}>
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="rounded">Rounded</option>
              <option value="shadow">Shadow</option>
            </select>
          </label>

          <label className="option-card">
            <span className="option-title">Shadow type</span>
            <select value={bubbleStyle.shadowType} onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, shadowType: e.target.value as ShadowType })}>
              <option value="none">None</option>
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="heavy">Heavy</option>
            </select>
          </label>

          <label className="option-card">
            <span className="option-title">Animation</span>
            <select value={bubbleStyle.animationType} onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, animationType: e.target.value as AnimationType })}>
              <option value="none">None</option>
              <option value="bounce">Bounce</option>
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
            </select>
          </label>

          <label className="option-card">
            <span className="option-title">Size</span>
            <select value={bubbleStyle.sizeType} onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, sizeType: e.target.value as SizeType })}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.header ? 'open' : ''}`} onClick={() => onToggleSection('header')}>
          <span className="label">🎩 Header design</span>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.header ? 'open' : ''}`}>
          <label className="option-card">
            <input
              type="checkbox"
              checked={headerStyle.showStatus}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showStatus: e.target.checked })}
            />
            <span className="option-title">Show status</span>
            <span className="option-desc">Show online indicator in header</span>
          </label>

          <label className="option-card">
            <input
              type="checkbox"
              checked={headerStyle.showCloseButton}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showCloseButton: e.target.checked })}
            />
            <span className="option-title">Show close button</span>
            <span className="option-desc">Show close button in header</span>
          </label>

          <label className="option-card">
            <input
              type="checkbox"
              checked={headerStyle.showAvatar}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showAvatar: e.target.checked })}
            />
            <span className="option-title">Show avatar</span>
            <span className="option-desc">Show avatar in header</span>
          </label>

          <label className="option-card">
            <input
              type="checkbox"
              checked={headerStyle.showTitle}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showTitle: e.target.checked })}
            />
            <span className="option-title">Show title</span>
            <span className="option-desc">Show widget title in header</span>
          </label>

          <label className="option-card">
            <span className="option-title">Border type</span>
            <select value={headerStyle.borderType} onChange={(e) => onHeaderStyleChange({ ...headerStyle, borderType: e.target.value as BorderType })}>
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="rounded">Rounded</option>
              <option value="shadow">Shadow</option>
            </select>
          </label>

          <label className="option-card">
            <span className="option-title">Shadow type</span>
            <select value={headerStyle.shadowType} onChange={(e) => onHeaderStyleChange({ ...headerStyle, shadowType: e.target.value as ShadowType })}>
              <option value="none">None</option>
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="heavy">Heavy</option>
            </select>
          </label>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.body ? 'open' : ''}`} onClick={() => onToggleSection('body')}>
          <span className="label">💬 Chat body design</span>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.body ? 'open' : ''}`}>
          <label className="option-card">
            <span className="option-title">Border type</span>
            <select value={bodyStyle.borderType} onChange={(e) => onBodyStyleChange({ ...bodyStyle, borderType: e.target.value as BorderType })}>
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="rounded">Rounded</option>
              <option value="shadow">Shadow</option>
            </select>
          </label>

          <label className="option-card">
            <span className="option-title">Shadow type</span>
            <select value={bodyStyle.shadowType} onChange={(e) => onBodyStyleChange({ ...bodyStyle, shadowType: e.target.value as ShadowType })}>
              <option value="none">None</option>
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="heavy">Heavy</option>
            </select>
          </label>

          <label className="option-card">
            <span className="option-title">Message style</span>
            <select value={bodyStyle.messageStyle} onChange={(e) => onBodyStyleChange({ ...bodyStyle, messageStyle: e.target.value as MessageStyle })}>
              <option value="bubble">Bubble</option>
              <option value="flat">Flat</option>
              <option value="card">Card</option>
            </select>
          </label>

          <label className="option-card">
            <input
              type="checkbox"
              checked={bodyStyle.showTimestamps}
              onChange={(e) => onBodyStyleChange({ ...bodyStyle, showTimestamps: e.target.checked })}
            />
            <span className="option-title">Show timestamps</span>
            <span className="option-desc">Show message timestamps</span>
          </label>

          <label className="option-card">
            <input
              type="checkbox"
              checked={bodyStyle.showReadReceipts}
              onChange={(e) => onBodyStyleChange({ ...bodyStyle, showReadReceipts: e.target.checked })}
            />
            <span className="option-title">Show read receipts</span>
            <span className="option-desc">Show read receipts on messages</span>
          </label>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.footer ? 'open' : ''}`} onClick={() => onToggleSection('footer')}>
          <span className="label">⌨️ Footer design</span>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.footer ? 'open' : ''}`}>
          <label className="option-card">
            <input
              type="checkbox"
              checked={footerStyle.showSendButton}
              onChange={(e) => onFooterStyleChange({ ...footerStyle, showSendButton: e.target.checked })}
            />
            <span className="option-title">Show send button</span>
            <span className="option-desc">Show send button in footer</span>
          </label>

          <label className="option-card">
            <span className="option-title">Border type</span>
            <select value={footerStyle.borderType} onChange={(e) => onFooterStyleChange({ ...footerStyle, borderType: e.target.value as BorderType })}>
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="rounded">Rounded</option>
              <option value="shadow">Shadow</option>
            </select>
          </label>

          <label className="option-card">
            <span className="option-title">Shadow type</span>
            <select value={footerStyle.shadowType} onChange={(e) => onFooterStyleChange({ ...footerStyle, shadowType: e.target.value as ShadowType })}>
              <option value="none">None</option>
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="heavy">Heavy</option>
            </select>
          </label>

          <label className="option-card">
            <span className="option-title">Input style</span>
            <select value={footerStyle.inputStyle} onChange={(e) => onFooterStyleChange({ ...footerStyle, inputStyle: e.target.value as InputStyle })}>
              <option value="flat">Flat</option>
              <option value="rounded">Rounded</option>
              <option value="outlined">Outlined</option>
            </select>
          </label>

          <label className="option-card">
            <input
              type="checkbox"
              checked={footerStyle.showPlaceholder}
              onChange={(e) => onFooterStyleChange({ ...footerStyle, showPlaceholder: e.target.checked })}
            />
            <span className="option-title">Show placeholder</span>
            <span className="option-desc">Show placeholder text in input</span>
          </label>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.colorTheme ? 'open' : ''}`} onClick={() => onToggleSection('colorTheme')}>
          <span className="label">🎨 Color theme</span>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.colorTheme ? 'open' : ''}`}>
          {Object.entries(colorThemeInfo).map(([theme, info]) => (
            <label key={theme} className={`option-card ${colorTheme === theme ? 'checked' : ''}`}>
              <input type="radio" name="colorTheme" checked={colorTheme === theme} onChange={() => onColorThemeChange(theme as ColorTheme)} />
              <span className="option-title">{info.label}</span>
              <span className="option-desc">{info.description}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.position ? 'open' : ''}`} onClick={() => onToggleSection('position')}>
          <span className="label">📍 Widget position</span>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.position ? 'open' : ''}`}>
          {[
            { value: 'bottom-right', label: 'Bottom right', desc: 'Bottom right of the screen' },
            { value: 'bottom-left', label: 'Bottom left', desc: 'Bottom left of the screen' },
            { value: 'top-right', label: 'Top right', desc: 'Top right of the screen' },
            { value: 'top-left', label: 'Top left', desc: 'Top left of the screen' },
          ].map((pos) => (
            <label key={pos.value} className={`option-card ${position === pos.value ? 'checked' : ''}`}>
              <input type="radio" name="position" checked={position === pos.value} onChange={() => onPositionChange(pos.value as Position)} />
              <span className="option-title">{pos.label}</span>
              <span className="option-desc">{pos.desc}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.branding ? 'open' : ''}`} onClick={() => onToggleSection('branding')}>
          <span className="label">Custom branding</span>
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

          <div className="branding-field">
            <label>Logo URL (optional)</label>
            <input
              type="text"
              value={customBranding.logo || ''}
              onChange={(e) => onCustomBrandingChange({ ...customBranding, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
      </div>

      <div className="group">
        <button type="button" className={`dropbtn ${openSections.advanced ? 'open' : ''}`} onClick={() => onToggleSection('advanced')}>
          <span className="label">Advanced settings</span>
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