'use client'

import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

// Advanced config types
type ColorTheme = 'modern' | 'chilling' | 'corporate' | 'luxury'
type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

// Design option types
type BorderType = 'none' | 'solid' | 'rounded' | 'shadow'
type ShadowType = 'none' | 'light' | 'medium' | 'heavy'
type AnimationType = 'none' | 'bounce' | 'fade' | 'slide'
type SizeType = 'small' | 'medium' | 'large'
type MessageStyle = 'bubble' | 'flat' | 'card'
type InputStyle = 'flat' | 'rounded' | 'outlined'

interface StyleSelectorProps {
  // Design options with object types
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
  
  // Change handlers with object types
  onBubbleStyleChange: (style: StyleSelectorProps['bubbleStyle']) => void
  onHeaderStyleChange: (style: StyleSelectorProps['headerStyle']) => void
  onBodyStyleChange: (style: StyleSelectorProps['bodyStyle']) => void
  onFooterStyleChange: (style: StyleSelectorProps['footerStyle']) => void
  
  // Advanced configs
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
  onToggleSection: (section: 'bubble' | 'header' | 'body' | 'footer' | 'colorTheme' | 'position' | 'branding' | 'advanced') => void
}

const colorThemeInfo: Record<ColorTheme, { label: string; description: string; preview: string }> = {
  modern: { label: 'Modern', description: 'Clean and contemporary', preview: '#3B82F6' },
  chilling: { label: 'Chilling', description: 'Relaxed and friendly', preview: '#10B981' },
  corporate: { label: 'Corporate', description: 'Professional and serious', preview: '#6B7280' },
  luxury: { label: 'Luxury', description: 'Exclusive and elegant', preview: '#7C3AED' },
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
  
  // Advanced configs
  colorTheme,
  position,
  customBranding,
  settings,
  onColorThemeChange,
  onPositionChange,
  onCustomBrandingChange,
  onSettingsChange,
  
  openSections,
  onToggleSection
}: StyleSelectorProps) {
  return (
    <>
      {/* Chat Bubble Style */}
      <div className="group">
        <button
          type="button"
          className={`dropbtn ${openSections.bubble ? 'open' : ''}`}
          onClick={() => onToggleSection('bubble')}
        >
          <span className="label">🫧 Chat bubble design</span>
          <span className="dropbtn-icon">
            {openSections.bubble ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.bubble ? 'open' : ''}`}>
          <label className="option-card">
            <input
              type="checkbox"
              checked={bubbleStyle.showStatus}
              onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, showStatus: e.target.checked })}
            />
            <span className="option-title">💬 Vis status prikk</span>
            <span className="option-desc">Vis online/status prikk på boble</span>
          </label>
          <label className="option-card">
            <input
              type="checkbox"
              checked={bubbleStyle.showCloseButton}
              onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, showCloseButton: e.target.checked })}
            />
            <span className="option-title">❌ Vis lukk-knapp</span>
            <span className="option-desc">Vis lukk-knapp på boble</span>
          </label>
          <label className="option-card">
            <span className="option-title">🎨 Kant-type</span>
            <select 
              value={bubbleStyle.borderType}
              onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, borderType: e.target.value as BorderType })}
            >
              <option value="none">Ingen kant</option>
              <option value="solid">Solid kant</option>
              <option value="rounded">Avrundet kant</option>
              <option value="shadow">Skygge-kant</option>
            </select>
          </label>
          <label className="option-card">
            <span className="option-title">🌟 Skygge-type</span>
            <select 
              value={bubbleStyle.shadowType}
              onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, shadowType: e.target.value as ShadowType })}
            >
              <option value="none">Ingen skygge</option>
              <option value="light">Lys skygge</option>
              <option value="medium">Medium skygge</option>
              <option value="heavy">Mørk skygge</option>
            </select>
          </label>
          <label className="option-card">
            <span className="option-title">✨ Animasjon-type</span>
            <select 
              value={bubbleStyle.animationType}
              onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, animationType: e.target.value as AnimationType })}
            >
              <option value="none">Ingen animasjon</option>
              <option value="bounce">Sprettop animasjon</option>
              <option value="fade">Fade inn animasjon</option>
              <option value="slide">Skyld animasjon</option>
            </select>
          </label>
          <label className="option-card">
            <span className="option-title">📏 Størrelse</span>
            <select 
              value={bubbleStyle.sizeType}
              onChange={(e) => onBubbleStyleChange({ ...bubbleStyle, sizeType: e.target.value as SizeType })}
            >
              <option value="small">Liten</option>
              <option value="medium">Medium</option>
              <option value="large">Stor</option>
            </select>
          </label>
        </div>
      </div>

      {/* Header Design */}
      <div className="group">
        <button
          type="button"
          className={`dropbtn ${openSections.header ? 'open' : ''}`}
          onClick={() => onToggleSection('header')}
        >
          <span className="label">🎩 Header design</span>
          <span className="dropbtn-icon">
            {openSections.header ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.header ? 'open' : ''}`}>
          <label className="option-card">
            <input
              type="checkbox"
              checked={headerStyle.showStatus}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showStatus: e.target.checked })}
            />
            <span className="option-title">💬 Vis status</span>
            <span className="option-desc">Vis online/status i header</span>
          </label>
          <label className="option-card">
            <input
              type="checkbox"
              checked={headerStyle.showCloseButton}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showCloseButton: e.target.checked })}
            />
            <span className="option-title">❌ Vis lukk-knapp</span>
            <span className="option-desc">Vis lukk-knapp i header</span>
          </label>
          <label className="option-card">
            <input
              type="checkbox"
              checked={headerStyle.showAvatar}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showAvatar: e.target.checked })}
            />
            <span className="option-title">👤 Vis avatar</span>
            <span className="option-desc">Vis profilbilde i header</span>
          </label>
          <label className="option-card">
            <input
              type="checkbox"
              checked={headerStyle.showTitle}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, showTitle: e.target.checked })}
            />
            <span className="option-title">📝 Vis tittel</span>
            <span className="option-desc">Vis tittel i header</span>
          </label>
          <label className="option-card">
            <span className="option-title">🎨 Kant-type</span>
            <select 
              value={headerStyle.borderType}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, borderType: e.target.value as BorderType })}
            >
              <option value="none">Ingen kant</option>
              <option value="solid">Solid kant</option>
              <option value="rounded">Avrundet kant</option>
              <option value="shadow">Skygge-kant</option>
            </select>
          </label>
          <label className="option-card">
            <span className="option-title">🌟 Skygge-type</span>
            <select 
              value={headerStyle.shadowType}
              onChange={(e) => onHeaderStyleChange({ ...headerStyle, shadowType: e.target.value as ShadowType })}
            >
              <option value="none">Ingen skygge</option>
              <option value="light">Lys skygge</option>
              <option value="medium">Medium skygge</option>
              <option value="heavy">Mørk skygge</option>
            </select>
          </label>
        </div>
      </div>

      {/* Chat Body Design */}
      <div className="group">
        <button
          type="button"
          className={`dropbtn ${openSections.body ? 'open' : ''}`}
          onClick={() => onToggleSection('body')}
        >
          <span className="label">💬 Chat body design</span>
          <span className="dropbtn-icon">
            {openSections.body ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.body ? 'open' : ''}`}>
          <label className="option-card">
            <span className="option-title">🎨 Kant-type</span>
            <select 
              value={bodyStyle.borderType}
              onChange={(e) => onBodyStyleChange({ ...bodyStyle, borderType: e.target.value as BorderType })}
            >
              <option value="none">Ingen kant</option>
              <option value="solid">Solid kant</option>
              <option value="rounded">Avrundet kant</option>
              <option value="shadow">Skygge-kant</option>
            </select>
          </label>
          <label className="option-card">
            <span className="option-title">🌟 Skygge-type</span>
            <select 
              value={bodyStyle.shadowType}
              onChange={(e) => onBodyStyleChange({ ...bodyStyle, shadowType: e.target.value as ShadowType })}
            >
              <option value="none">Ingen skygge</option>
              <option value="light">Lys skygge</option>
              <option value="medium">Medium skygge</option>
              <option value="heavy">Mørk skygge</option>
            </select>
          </label>
          <label className="option-card">
            <span className="option-title">💭 Melding-style</span>
            <select 
              value={bodyStyle.messageStyle}
              onChange={(e) => onBodyStyleChange({ ...bodyStyle, messageStyle: e.target.value as MessageStyle })}
            >
              <option value="bubble">Boble-stil</option>
              <option value="flat">Flat stil</option>
              <option value="card">Kort-stil</option>
            </select>
          </label>
          <label className="option-card">
            <input
              type="checkbox"
              checked={bodyStyle.showTimestamps}
              onChange={(e) => onBodyStyleChange({ ...bodyStyle, showTimestamps: e.target.checked })}
            />
            <span className="option-title">⏰ Vis tidsstempel</span>
            <span className="option-desc">Vis tidspunkt for meldinger</span>
          </label>
          <label className="option-card">
            <input
              type="checkbox"
              checked={bodyStyle.showReadReceipts}
              onChange={(e) => onBodyStyleChange({ ...bodyStyle, showReadReceipts: e.target.checked })}
            />
            <span className="option-title">✅ Vis lesekvittering</span>
            <span className="option-desc">Vis lesekvittering for meldinger</span>
          </label>
        </div>
      </div>

      {/* Footer Design */}
      <div className="group">
        <button
          type="button"
          className={`dropbtn ${openSections.footer ? 'open' : ''}`}
          onClick={() => onToggleSection('footer')}
        >
          <span className="label">⌨️ Footer design</span>
          <span className="dropbtn-icon">
            {openSections.footer ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.footer ? 'open' : ''}`}>
          <label className="option-card">
            <input
              type="checkbox"
              checked={footerStyle.showSendButton}
              onChange={(e) => onFooterStyleChange({ ...footerStyle, showSendButton: e.target.checked })}
            />
            <span className="option-title">📤 Vis send-knapp</span>
            <span className="option-desc">Vis send-knapp i footer</span>
          </label>
          <label className="option-card">
            <span className="option-title">🎨 Kant-type</span>
            <select 
              value={footerStyle.borderType}
              onChange={(e) => onFooterStyleChange({ ...footerStyle, borderType: e.target.value as BorderType })}
            >
              <option value="none">Ingen kant</option>
              <option value="solid">Solid kant</option>
              <option value="rounded">Avrundet kant</option>
              <option value="shadow">Skygge-kant</option>
            </select>
          </label>
          <label className="option-card">
            <span className="option-title">🌟 Skygge-type</span>
            <select 
              value={footerStyle.shadowType}
              onChange={(e) => onFooterStyleChange({ ...footerStyle, shadowType: e.target.value as ShadowType })}
            >
              <option value="none">Ingen skygge</option>
              <option value="light">Lys skygge</option>
              <option value="medium">Medium skygge</option>
              <option value="heavy">Mørk skygge</option>
            </select>
          </label>
          <label className="option-card">
            <span className="option-title">📝 Input-style</span>
            <select 
              value={footerStyle.inputStyle}
              onChange={(e) => onFooterStyleChange({ ...footerStyle, inputStyle: e.target.value as InputStyle })}
            >
              <option value="flat">Flat stil</option>
              <option value="rounded">Avrundet stil</option>
              <option value="outlined">Kant-stil</option>
            </select>
          </label>
          <label className="option-card">
            <input
              type="checkbox"
              checked={footerStyle.showPlaceholder}
              onChange={(e) => onFooterStyleChange({ ...footerStyle, showPlaceholder: e.target.checked })}
            />
            <span className="option-title">📝 Vis plassholder</span>
            <span className="option-desc">Vis plassholdertekst i input</span>
          </label>
        </div>
      </div>

      {/* Color Theme */}
      <div className="group">
        <button
          type="button"
          className={`dropbtn ${openSections.colorTheme ? 'open' : ''}`}
          onClick={() => onToggleSection('colorTheme')}
        >
          <span className="label">🎨 Farge-tema</span>
          <span className="dropbtn-icon">
            {openSections.colorTheme ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.colorTheme ? 'open' : ''}`}>
          {Object.entries(colorThemeInfo).map(([theme, info]) => (
            <label
              key={theme}
              className={`option-card ${colorTheme === theme ? 'checked' : ''}`}
            >
              <input
                type="radio"
                name="colorTheme"
                checked={colorTheme === theme}
                onChange={() => onColorThemeChange(theme as ColorTheme)}
              />
              <span className="option-title">{info.label}</span>
              <span className="option-desc">{info.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Position */}
      <div className="group">
        <button
          type="button"
          className={`dropbtn ${openSections.position ? 'open' : ''}`}
          onClick={() => onToggleSection('position')}
        >
          <span className="label">📍 Widget-posisjon</span>
          <span className="dropbtn-icon">
            {openSections.position ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>

        <div className={`option-grid dropdown-content ${openSections.position ? 'open' : ''}`}>
          {[
            { value: 'bottom-right', label: 'Nede høyre', desc: 'Nede til høyre på skjermen' },
            { value: 'bottom-left', label: 'Nede venstre', desc: 'Nede til venstre på skjermen' },
            { value: 'top-right', label: 'Oppe høyre', desc: 'Oppe til høyre på skjermen' },
            { value: 'top-left', label: 'Oppe venstre', desc: 'Oppe til venstre på skjermen' }
          ].map((pos) => (
            <label
              key={pos.value}
              className={`option-card ${position === pos.value ? 'checked' : ''}`}
            >
              <input
                type="radio"
                name="position"
                checked={position === pos.value}
                onChange={() => onPositionChange(pos.value as Position)}
              />
              <span className="option-title">{pos.label}</span>
              <span className="option-desc">{pos.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Branding */}
      <div className="group">
        <button
          type="button"
          className={`dropbtn ${openSections.branding ? 'open' : ''}`}
          onClick={() => onToggleSection('branding')}
        >
          <span className="label">Custom Branding</span>
          <span className="dropbtn-icon">
            {openSections.branding ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>

        <div className={`branding-content dropdown-content ${openSections.branding ? 'open' : ''}`}>
          <div className="branding-field">
            <label>Widget Title</label>
            <input
              type="text"
              value={customBranding.title || ''}
              onChange={(e) => onCustomBrandingChange({ ...customBranding, title: e.target.value })}
              placeholder="Support Chat"
            />
          </div>
          <div className="branding-field">
            <label>Widget Description</label>
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

      {/* Advanced Settings */}
      <div className="group">
        <button
          type="button"
          className={`dropbtn ${openSections.advanced ? 'open' : ''}`}
          onClick={() => onToggleSection('advanced')}
        >
          <span className="label">Advanced Settings</span>
          <span className="dropbtn-icon">
            {openSections.advanced ? <FiChevronUp /> : <FiChevronDown />}
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
              onChange={(e) => onSettingsChange({ ...settings, delayMs: parseInt(e.target.value) })}
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
