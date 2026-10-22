'use client'

import { CSSProperties, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  FiArrowRight,
  FiCopy,
  FiDollarSign,
  FiRefreshCw,
  FiSliders,
  FiChevronDown,
  FiChevronUp,
  FiDatabase,
  FiShield,
  FiGlobe,
  FiCheck,
  FiMinus,
  FiPlus,
  FiX,
} from 'react-icons/fi'
import { FaCcVisa, FaCcMastercard, FaPaypal } from 'react-icons/fa'
import Header from '@/components/header'
import { 
  DesignLevelSelector,
  ColorThemeSelector,
  AddonSelector,
  ConfigurationSelector,
  ExtraFeaturesSelector,
  ComplexitySettings
} from './components'
import type { 
  Country, 
  PreviewMode, 
  DesignLevel, 
  PreviewBackgroundEffect, 
  ColorTheme, 
  ActiveFeature,
  InputsState 
} from './types'
import './WebPage.css'

// ... (rest of the existing code from original page.tsx, but with component imports and usage)

export default function GuestWebsites() {
  const t = translations

  const [country, setCountry] = useState<Country>('NO')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('website')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState<ActiveFeature>('home')
  const [previewBackgroundEffect, setPreviewBackgroundEffect] =
    useState<PreviewBackgroundEffect>('default')

  const [inputs, setInputs] = useState<InputsState>({
    pages: 5,
    design: 'premium',
    colorTheme: 'modern',
    ecommerce: false,
    ecommerceLevel: 5,
    seo: true,
    carePlan: false,
    admin: false,
    adminLevel: 5,
    database: false,
    databaseLevel: 5,
    ai: false,
    gallery: false,
    galleryLevel: 5,
    viewer3D: false,
    viewer3DLevel: 5,
    customDesign: false,
    contactForm: false,
    blog: false,
    booking: false,
  })

  const [openSections, setOpenSections] = useState({
    design: true,
    colors: true,
    addons: false,
    configuration: false,
    extraFeatures: false,
    complexity: false,
  })

  // ... (rest of the existing logic)

  return (
    <>
      <Header />

      <div className="page-wrapper">
        <main className="content">
          <section className="hero">
            <h2 className="hero-title">{t.heroTitle}</h2>
            <h3 className="hero-sub">{t.heroSubtitle}</h3>
            <p className="hero-meta">{t.heroMeta}</p>
          </section>

          <div className="grid">
            <div className="panel glass">
              <h2 className="section-title">
                <FiSliders /> {t.configureProject}
              </h2>

              <div className="group">
                <label className="label">
                  {t.pageCount}
                  <span className="value">{inputs.pages}</span>
                </label>
                <input
                  className="slider"
                  type="range"
                  min="1"
                  max="20"
                  value={inputs.pages}
                  onChange={(e) => updateInput('pages', parseInt(e.target.value, 10))}
                />
              </div>

              <DesignLevelSelector
                designLevel={inputs.design}
                isOpen={openSections.design}
                onToggle={() => toggleSection('design')}
                onDesignLevelChange={(level) => updateInput('design', level)}
              />

              <ColorThemeSelector
                colorTheme={inputs.colorTheme}
                isOpen={openSections.colors}
                onToggle={() => toggleSection('colors')}
                onColorThemeChange={(theme) => updateInput('colorTheme', theme)}
              />

              <AddonSelector
                inputs={{
                  ecommerce: inputs.ecommerce,
                  seo: inputs.seo,
                  carePlan: inputs.carePlan
                }}
                isOpen={openSections.addons}
                onToggle={() => toggleSection('addons')}
                onInputChange={(key, value) => updateInput(key, value)}
              />

              <ConfigurationSelector
                inputs={{
                  admin: inputs.admin,
                  database: inputs.database,
                  ai: inputs.ai,
                  ecommerce: inputs.ecommerce
                }}
                isOpen={openSections.configuration}
                onToggle={() => toggleSection('configuration')}
                onInputChange={(key, value) => updateInput(key, value)}
              />

              <ExtraFeaturesSelector
                inputs={{
                  gallery: inputs.gallery,
                  viewer3D: inputs.viewer3D,
                  customDesign: inputs.customDesign,
                  contactForm: inputs.contactForm,
                  blog: inputs.blog,
                  booking: inputs.booking
                }}
                isOpen={openSections.extraFeatures}
                onToggle={() => toggleSection('extraFeatures')}
                onInputChange={(key, value) => updateInput(key, value)}
              />

              {(inputs.ecommerce ||
                inputs.admin ||
                (inputs.database && !inputs.ecommerce) ||
                inputs.gallery ||
                inputs.viewer3D) && (
                <ComplexitySettings
                  inputs={{
                    ecommerce: inputs.ecommerce,
                    ecommerceLevel: inputs.ecommerceLevel,
                    admin: inputs.admin,
                    adminLevel: inputs.adminLevel,
                    database: inputs.database,
                    databaseLevel: inputs.databaseLevel,
                    gallery: inputs.gallery,
                    galleryLevel: inputs.galleryLevel,
                    viewer3D: inputs.viewer3D,
                    viewer3DLevel: inputs.viewer3DLevel
                  }}
                  isOpen={openSections.complexity}
                  onToggle={() => toggleSection('complexity')}
                  onInputChange={(key, value) => updateInput(key, value)}
                  formatCurrency={formatCurrency}
                  dyn={dyn}
                  priceMap={priceMap}
                />
              )}

              <p className="disclaimer">ℹ️ {t.priceDisclaimer}</p>
            </div>

            {/* ... (rest of the preview and pricing panel) */}
          </div>
        </main>
      </div>
    </>
  )
}
