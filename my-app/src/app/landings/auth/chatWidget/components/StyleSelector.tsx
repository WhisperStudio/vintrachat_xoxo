'use client'

import { FiChevronDown } from 'react-icons/fi'
import './StyleSelector.css'

type ColorTheme = 'modern' | 'chilling' | 'corporate' | 'luxury'
type Position = 'bottom-right' | 'bottom-left' 
type BorderType = 'none' | 'solid' | 'rounded' | 'shadow'
type ShadowType = 'none' | 'light' | 'medium' | 'heavy'
type AnimationType = 'none' | 'bounce' | 'fade' | 'slide'
type SizeType = 'small' | 'medium' | 'large'
type MessageStyle = 'bubble' | 'flat' | 'card'
type InputStyle = 'flat' | 'rounded' | 'outlined'

interface StyleSelectorProps {
  bubbleStyle: {
    showStatus: boolean
    iconChoice: 'chat' | 'phone' | 'cpu' | 'message' | 'support'
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
          <label className={`option-card ${bubbleStyle.showStatus ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={bubbleStyle.showStatus}
              onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, showStatus: e.target.checked })}
            />
            <span className="option-title">Show status dot</span>
            <span className="option-desc">Show online/status dot on widget bubble</span>
          </label>

          <label className={`option-card ${bubbleStyle.iconChoice !== 'chat' ? 'checked' : ''}`}>
            <span className="option-title">Icon choice</span>
            <select value={bubbleStyle.iconChoice} onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, iconChoice: e.target.value as 'chat' | 'phone' | 'cpu' | 'message' | 'support' })}>
              <option value="chat">Chat bubble</option>
              <option value="phone">Phone</option>
              <option value="cpu">Robot/CPU</option>
              <option value="message">Message</option>
              <option value="support">Support</option>
            </select>
          </label>

          <label className="option-card">
            <span className="option-title">Border type</span>
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-border-type"
                  checked={bubbleStyle.borderType === 'none'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, borderType: 'none' })}
                />
                <span>None</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-border-type"
                  checked={bubbleStyle.borderType === 'solid'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, borderType: 'solid' })}
                />
                <span>Solid</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-border-type"
                  checked={bubbleStyle.borderType === 'rounded'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, borderType: 'rounded' })}
                />
                <span>Rounded</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-border-type"
                  checked={bubbleStyle.borderType === 'shadow'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, borderType: 'shadow' })}
                />
                <span>Shadow</span>
              </label>
            </div>
          </label>

          <label className="option-card">
            <span className="option-title">Shadow type</span>
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-shadow-type"
                  checked={bubbleStyle.shadowType === 'none'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, shadowType: 'none' })}
                />
                <span>None</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-shadow-type"
                  checked={bubbleStyle.shadowType === 'light'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, shadowType: 'light' })}
                />
                <span>Light</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-shadow-type"
                  checked={bubbleStyle.shadowType === 'medium'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, shadowType: 'medium' })}
                />
                <span>Medium</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-shadow-type"
                  checked={bubbleStyle.shadowType === 'heavy'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, shadowType: 'heavy' })}
                />
                <span>Heavy</span>
              </label>
            </div>
          </label>

          <label className="option-card">
            <span className="option-title">Animation</span>
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-animation-type"
                  checked={bubbleStyle.animationType === 'none'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, animationType: 'none' })}
                />
                <span>None</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-animation-type"
                  checked={bubbleStyle.animationType === 'bounce'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, animationType: 'bounce' })}
                />
                <span>Bounce</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-animation-type"
                  checked={bubbleStyle.animationType === 'fade'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, animationType: 'fade' })}
                />
                <span>Fade</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-animation-type"
                  checked={bubbleStyle.animationType === 'slide'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, animationType: 'slide' })}
                />
                <span>Slide</span>
              </label>
            </div>
          </label>

          <label className="option-card">
            <span className="option-title">Size</span>
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-size-type"
                  checked={bubbleStyle.sizeType === 'small'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, sizeType: 'small' })}
                />
                <span>Small</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-size-type"
                  checked={bubbleStyle.sizeType === 'medium'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, sizeType: 'medium' })}
                />
                <span>Medium</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bubble-size-type"
                  checked={bubbleStyle.sizeType === 'large'}
                  onChange={() => onBubbleStyleChange({ ...bubbleStyle, sizeType: 'large' })}
                />
                <span>Large</span>
              </label>
            </div>
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
          <label className={`option-card ${headerStyle.showStatus ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={headerStyle.showStatus}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showStatus: e.target.checked })}
            />
            <span className="option-title">Show status</span>
            <span className="option-desc">Show online indicator in header</span>
          </label>

          <label className={`option-card ${headerStyle.showCloseButton ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={headerStyle.showCloseButton}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showCloseButton: e.target.checked })}
            />
            <span className="option-title">Show close button</span>
            <span className="option-desc">Show close button in header</span>
          </label>

          <label className={`option-card ${headerStyle.showAvatar ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={headerStyle.showAvatar}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showAvatar: e.target.checked })}
            />
            <span className="option-title">Show avatar</span>
            <span className="option-desc">Show avatar in header</span>
          </label>

          <label className={`option-card ${headerStyle.showTitle ? 'checked' : ''}`}>
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
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="header-border-type"
                  checked={headerStyle.borderType === 'none'}
                  onChange={() => onHeaderStyleChange({ ...headerStyle, borderType: 'none' })}
                />
                <span>None</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="header-border-type"
                  checked={headerStyle.borderType === 'solid'}
                  onChange={() => onHeaderStyleChange({ ...headerStyle, borderType: 'solid' })}
                />
                <span>Solid</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="header-border-type"
                  checked={headerStyle.borderType === 'rounded'}
                  onChange={() => onHeaderStyleChange({ ...headerStyle, borderType: 'rounded' })}
                />
                <span>Rounded</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="header-border-type"
                  checked={headerStyle.borderType === 'shadow'}
                  onChange={() => onHeaderStyleChange({ ...headerStyle, borderType: 'shadow' })}
                />
                <span>Shadow</span>
              </label>
            </div>
          </label>

          <label className="option-card">
            <span className="option-title">Shadow type</span>
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="header-shadow-type"
                  checked={headerStyle.shadowType === 'none'}
                  onChange={() => onHeaderStyleChange({ ...headerStyle, shadowType: 'none' })}
                />
                <span>None</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="header-shadow-type"
                  checked={headerStyle.shadowType === 'light'}
                  onChange={() => onHeaderStyleChange({ ...headerStyle, shadowType: 'light' })}
                />
                <span>Light</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="header-shadow-type"
                  checked={headerStyle.shadowType === 'medium'}
                  onChange={() => onHeaderStyleChange({ ...headerStyle, shadowType: 'medium' })}
                />
                <span>Medium</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="header-shadow-type"
                  checked={headerStyle.shadowType === 'heavy'}
                  onChange={() => onHeaderStyleChange({ ...headerStyle, shadowType: 'heavy' })}
                />
                <span>Heavy</span>
              </label>
            </div>
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
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-border-type"
                  checked={bodyStyle.borderType === 'none'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, borderType: 'none' })}
                />
                <span>None</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-border-type"
                  checked={bodyStyle.borderType === 'solid'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, borderType: 'solid' })}
                />
                <span>Solid</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-border-type"
                  checked={bodyStyle.borderType === 'rounded'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, borderType: 'rounded' })}
                />
                <span>Rounded</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-border-type"
                  checked={bodyStyle.borderType === 'shadow'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, borderType: 'shadow' })}
                />
                <span>Shadow</span>
              </label>
            </div>
          </label>

          <label className="option-card">
            <span className="option-title">Shadow type</span>
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-shadow-type"
                  checked={bodyStyle.shadowType === 'none'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, shadowType: 'none' })}
                />
                <span>None</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-shadow-type"
                  checked={bodyStyle.shadowType === 'light'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, shadowType: 'light' })}
                />
                <span>Light</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-shadow-type"
                  checked={bodyStyle.shadowType === 'medium'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, shadowType: 'medium' })}
                />
                <span>Medium</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-shadow-type"
                  checked={bodyStyle.shadowType === 'heavy'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, shadowType: 'heavy' })}
                />
                <span>Heavy</span>
              </label>
            </div>
          </label>

          <label className="option-card">
            <span className="option-title">Message style</span>
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-message-style"
                  checked={bodyStyle.messageStyle === 'bubble'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, messageStyle: 'bubble' })}
                />
                <span>Bubble</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-message-style"
                  checked={bodyStyle.messageStyle === 'flat'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, messageStyle: 'flat' })}
                />
                <span>Flat</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="body-message-style"
                  checked={bodyStyle.messageStyle === 'card'}
                  onChange={() => onBodyStyleChange({ ...bodyStyle, messageStyle: 'card' })}
                />
                <span>Card</span>
              </label>
            </div>
          </label>

          <label className={`option-card ${bodyStyle.showTimestamps ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={bodyStyle.showTimestamps}
              onChange={(e) => onBodyStyleChange({ ...bodyStyle, showTimestamps: e.target.checked })}
            />
            <span className="option-title">Show timestamps</span>
            <span className="option-desc">Show message timestamps</span>
          </label>

          <label className={`option-card ${bodyStyle.showReadReceipts ? 'checked' : ''}`}>
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
          <label className={`option-card ${footerStyle.showSendButton ? 'checked' : ''}`}>
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
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-border-type"
                  checked={footerStyle.borderType === 'none'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, borderType: 'none' })}
                />
                <span>None</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-border-type"
                  checked={footerStyle.borderType === 'solid'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, borderType: 'solid' })}
                />
                <span>Solid</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-border-type"
                  checked={footerStyle.borderType === 'rounded'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, borderType: 'rounded' })}
                />
                <span>Rounded</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-border-type"
                  checked={footerStyle.borderType === 'shadow'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, borderType: 'shadow' })}
                />
                <span>Shadow</span>
              </label>
            </div>
          </label>

          <label className="option-card">
            <span className="option-title">Shadow type</span>
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-shadow-type"
                  checked={footerStyle.shadowType === 'none'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, shadowType: 'none' })}
                />
                <span>None</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-shadow-type"
                  checked={footerStyle.shadowType === 'light'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, shadowType: 'light' })}
                />
                <span>Light</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-shadow-type"
                  checked={footerStyle.shadowType === 'medium'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, shadowType: 'medium' })}
                />
                <span>Medium</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-shadow-type"
                  checked={footerStyle.shadowType === 'heavy'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, shadowType: 'heavy' })}
                />
                <span>Heavy</span>
              </label>
            </div>
          </label>

          <label className="option-card">
            <span className="option-title">Input style</span>
            <div className="option-row">
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-input-style"
                  checked={footerStyle.inputStyle === 'flat'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, inputStyle: 'flat' })}
                />
                <span>Flat</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-input-style"
                  checked={footerStyle.inputStyle === 'rounded'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, inputStyle: 'rounded' })}
                />
                <span>Rounded</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="footer-input-style"
                  checked={footerStyle.inputStyle === 'outlined'}
                  onChange={() => onFooterStyleChange({ ...footerStyle, inputStyle: 'outlined' })}
                />
                <span>Outlined</span>
              </label>
            </div>
          </label>

          <label className={`option-card ${footerStyle.showPlaceholder ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={footerStyle.showPlaceholder}
              onChange={(e) => onFooterStyleChange({ ...footerStyle, showPlaceholder: e.target.checked })}
            />
            <span className="option-title">Show placeholder</span>
            <span className="option-desc">Show placeholder text in input field</span>
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