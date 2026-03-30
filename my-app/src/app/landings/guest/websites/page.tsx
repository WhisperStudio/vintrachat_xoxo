'use client'

import { CSSProperties, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  FiArrowRight,
  FiCopy,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiSliders,
  FiZap,
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
import './WebPage.css'

type Country = 'NO' | 'SE' | 'DK' | 'FI' | 'DE' | 'FR' | 'UK' | 'US'
type PreviewMode = 'website' | 'admin'
type DesignLevel = 'standard' | 'premium' | 'elite'
type PreviewBackgroundEffect = 'default' | 'stars' | 'wave'
type ColorTheme = 'modern' | 'chilling' | 'corporate' | 'luxury'
type ActiveFeature =
  | 'home'
  | 'ecommerce'
  | 'gallery'
  | 'viewer3D'
  | 'customDesign'
  | 'contactForm'
  | 'blog'
  | 'booking'
  | 'page'

type InputsState = {
  pages: number
  design: DesignLevel
  colorTheme: ColorTheme
  ecommerce: boolean
  ecommerceLevel: number
  seo: boolean
  carePlan: boolean
  admin: boolean
  adminLevel: number
  database: boolean
  databaseLevel: number
  ai: boolean
  gallery: boolean
  galleryLevel: number
  viewer3D: boolean
  viewer3DLevel: number
  customDesign: boolean
  contactForm: boolean
  blog: boolean
  booking: boolean
}

type Translation = {
  heroTitle: string
  heroSubtitle: string
  heroMeta: string
  configureProject: string
  pageCount: string
  designComplexity: string
  colorStyle: string
  addons: string
  configuration: string
  extraFeatures: string
  ecommerceTitle: string
  ecommerceDesc: string
  seoTitle: string
  seoDesc: string
  careTitle: string
  careDesc: string
  adminTitle: string
  adminDesc: string
  databaseTitle: string
  databaseDesc: string
  databaseDescRequired: string
  databaseComplexity: string
  aiTitle: string
  aiDesc: string
  galleryTitle: string
  galleryDesc: string
  galleryComplexity: string
  viewer3DTitle: string
  viewer3DDesc: string
  viewer3DComplexity: string
  customDesignTitle: string
  customDesignDesc: string
  contactFormTitle: string
  contactFormDesc: string
  blogTitle: string
  blogDesc: string
  bookingTitle: string
  bookingDesc: string
  ecommerceComplexity: string
  adminComplexity: string
  basic: string
  advanced: string
  priceDisclaimer: string
  estimateNote: string
  estimateTitle: string
  estimatedCost: string
  estimatedWaitTime: string
  monthlyLabel: string
  perMonth: string
  weeks: string
  startProject: string
  copy: string
  reset: string
  costBreakdown: string
  selectCountry: string
  priceBeforeVat: string
  vat: string
  totalInclVat: string
  exVat: string
  website: string
  adminPanel: string
  loginForAccess: string
}

type BreakdownItem = {
  name: string
  cost: number
}

type Breakdown = {
  oneTimeCost: number
  monthlyCost: number
  weeks: number
  items: BreakdownItem[]
  vatAmount: number
  totalWithVat: number
  vatRate: number
}

type ThemePalette = {
  name: string
  description: string
  colors: [string, string, string, string]
  surface: string
  softSurface: string
  text: string
  muted: string
  gradient: string
  button: string
  buttonText: string
  border: string
  glow: string
}

type Product = {
  id: number
  name: string
  price: number
  priceLabel: string
  c1: string
  c2: string
}

type CartItem = {
  id: number
  name: string
  price: number
  image: string
  qty: number
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
  }).format(amount)

const themePalettes: Record<ColorTheme, ThemePalette> = {
  modern: {
    name: 'Modern',
    description: 'Strong, clean, vibrant colors for modern digital brands.',
    colors: ['#2563eb', '#7c3aed', '#ec4899', '#f8fafc'],
    surface: '#f8fbff',
    softSurface: '#eef4ff',
    text: '#14213d',
    muted: '#5b6b84',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 58%, #ec4899 100%)',
    button: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    buttonText: '#ffffff',
    border: 'rgba(37, 99, 235, 0.16)',
    glow: 'rgba(124, 58, 237, 0.22)',
  },
  chilling: {
    name: 'Chilling',
    description: 'Pastel and relaxing colors for softer, calmer websites.',
    colors: ['#8ecae6', '#b8c0ff', '#ffc8dd', '#fdfcfb'],
    surface: '#fcfcff',
    softSurface: '#f6f5ff',
    text: '#243447',
    muted: '#6b7a90',
    gradient: 'linear-gradient(135deg, #8ecae6 0%, #b8c0ff 55%, #ffc8dd 100%)',
    button: 'linear-gradient(135deg, #8ecae6, #b8c0ff)',
    buttonText: '#1f2937',
    border: 'rgba(184, 192, 255, 0.22)',
    glow: 'rgba(255, 200, 221, 0.24)',
  },
  corporate: {
    name: 'Corporate',
    description: 'Professional and trustworthy tones for real business websites.',
    colors: ['#0f172a', '#1d4ed8', '#0f766e', '#f8fafc'],
    surface: '#f7fafc',
    softSurface: '#eef3f8',
    text: '#0f172a',
    muted: '#475569',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #0f766e 100%)',
    button: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
    buttonText: '#ffffff',
    border: 'rgba(15, 23, 42, 0.14)',
    glow: 'rgba(29, 78, 216, 0.2)',
  },
  luxury: {
    name: 'Luxury',
    description: 'Elegant premium tones for high-end brands and showcase pages.',
    colors: ['#111827', '#7c2d12', '#d4af37', '#f9f6ef'],
    surface: '#fffdf7',
    softSurface: '#f7f2e7',
    text: '#1f2937',
    muted: '#6b7280',
    gradient: 'linear-gradient(135deg, #111827 0%, #7c2d12 45%, #d4af37 100%)',
    button: 'linear-gradient(135deg, #111827, #d4af37)',
    buttonText: '#ffffff',
    border: 'rgba(212, 175, 55, 0.22)',
    glow: 'rgba(212, 175, 55, 0.22)',
  },
}

const demoProducts: Product[] = [
  { id: 1, name: 'Product One', price: 799, priceLabel: 'NOK 799', c1: '#ddd6fe', c2: '#e0e7ff' },
  { id: 2, name: 'Product Two', price: 899, priceLabel: 'NOK 899', c1: '#fce7f3', c2: '#fbcfe8' },
  { id: 3, name: 'Product Three', price: 699, priceLabel: 'NOK 699', c1: '#dbeafe', c2: '#bfdbfe' },
]

const translations: Translation = {
  heroTitle: 'From idea to launch.',
  heroSubtitle: 'Configure a custom, fast and user-friendly website with us.',
  heroMeta: 'Try and make a mockup of your idea with estimated pricing, visual preview and flexible feature options.',
  configureProject: 'Configure your project',
  pageCount: 'Number of pages',
  designComplexity: 'Design level',
  colorStyle: 'Color style',
  addons: 'Add-ons',
  configuration: 'Core configuration',
  extraFeatures: 'Extra features',
  ecommerceTitle: 'E-commerce',
  ecommerceDesc: 'Sell products or services online.',
  seoTitle: 'SEO & Analytics',
  seoDesc: 'Get found on Google and track performance.',
  careTitle: 'Care & Maintenance',
  careDesc: 'Monthly updates and support.',
  adminTitle: 'Admin Panel',
  adminDesc: 'Manage content, data and users.',
  databaseTitle: 'Database',
  databaseDesc: 'Store and manage dynamic data.',
  databaseDescRequired: 'Required for e-commerce.',
  databaseComplexity: 'Database complexity',
  aiTitle: 'AI Assistant',
  aiDesc: 'Smart chatbot and simple automation.',
  galleryTitle: 'Gallery',
  galleryDesc: 'Image gallery with categories and zoom.',
  galleryComplexity: 'Gallery complexity',
  viewer3DTitle: '3D Viewer',
  viewer3DDesc: 'Interactive 3D product or model preview.',
  viewer3DComplexity: '3D viewer complexity',
  customDesignTitle: 'Custom Design',
  customDesignDesc: 'Tailored visuals and creative layout ideas.',
  contactFormTitle: 'Contact Form',
  contactFormDesc: 'Professional lead and contact form.',
  blogTitle: 'Blog',
  blogDesc: 'CMS-powered blog section.',
  bookingTitle: 'Booking System',
  bookingDesc: 'Appointments and calendar booking.',
  ecommerceComplexity: 'E-commerce complexity',
  adminComplexity: 'Admin panel complexity',
  basic: 'Basic',
  advanced: 'Advanced',
  priceDisclaimer:
    'Prices may vary based on scope and project complexity. This calculator is meant as a realistic estimate.',
  estimateNote: 'This is an estimated price',
  estimateTitle: 'Your price estimate',
  estimatedCost: 'Estimated cost',
  estimatedWaitTime: 'Estimated timeline',
  monthlyLabel: 'Monthly cost',
  perMonth: '/mo',
  weeks: 'weeks',
  startProject: 'Start project',
  copy: 'Copy',
  reset: 'Reset',
  costBreakdown: 'Cost breakdown',
  selectCountry: 'Select country for VAT calculation:',
  priceBeforeVat: 'Price before VAT:',
  vat: 'VAT',
  totalInclVat: 'Total incl. VAT:',
  exVat: 'ex. VAT',
  website: 'Website',
  adminPanel: 'Admin Panel',
  loginForAccess: 'Log in for full access',
}

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

  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const addToCart = (product: Product) => {
    setCartOpen(true)
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)

      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: `linear-gradient(135deg, ${product.c1}, ${product.c2})`,
          qty: 1,
        },
      ]
    })
  }

  const increaseQty = (id: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    )
  }

  const decreaseQty = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    )
  }

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const vatRates: Record<Country, number> = {
    NO: 25,
    SE: 25,
    DK: 25,
    FI: 24,
    DE: 19,
    FR: 20,
    UK: 20,
    US: 0,
  }

  const vatRate = vatRates[country] || 25

  const priceMap = {
    base: 2200,
    perPage: 1300,
    design: { standard: 1, premium: 1.3, elite: 2.0 } as Record<DesignLevel, number>,
    ecommerce: { min: 2300, max: 9999 },
    seo: 4500,
    carePlan: 1000,
    admin: { min: 2500, max: 9999 },
    database: { min: 2000, max: 9999 },
    ai: 6500,
    gallery: { min: 1500, max: 5500 },
    viewer3D: { min: 3000, max: 12000 },
    customDesign: 8500,
    contactForm: 800,
    blog: 3500,
    booking: 4500,
  }

  const dyn = (min: number, max: number, level: number): number =>
    Math.round(min + ((max - min) * (level - 1)) / 9)

  const breakdown = useMemo<Breakdown>(() => {
    const dMul = priceMap.design[inputs.design] || 1
    let oneTime = priceMap.base + inputs.pages * priceMap.perPage * dMul

    const ecommerceCost = inputs.ecommerce
      ? dyn(priceMap.ecommerce.min, priceMap.ecommerce.max, inputs.ecommerceLevel)
      : 0
    const adminCost = inputs.admin
      ? dyn(priceMap.admin.min, priceMap.admin.max, inputs.adminLevel)
      : 0
    const databaseCost = inputs.database
      ? dyn(priceMap.database.min, priceMap.database.max, inputs.databaseLevel)
      : 0
    const galleryCost = inputs.gallery
      ? dyn(priceMap.gallery.min, priceMap.gallery.max, inputs.galleryLevel)
      : 0
    const viewerCost = inputs.viewer3D
      ? dyn(priceMap.viewer3D.min, priceMap.viewer3D.max, inputs.viewer3DLevel)
      : 0

    if (inputs.ecommerce) oneTime += ecommerceCost
    if (inputs.seo) oneTime += priceMap.seo
    if (inputs.admin) oneTime += adminCost
    if (inputs.database) oneTime += databaseCost
    if (inputs.ai) oneTime += priceMap.ai
    if (inputs.gallery) oneTime += galleryCost
    if (inputs.viewer3D) oneTime += viewerCost
    if (inputs.customDesign) oneTime += priceMap.customDesign
    if (inputs.contactForm) oneTime += priceMap.contactForm
    if (inputs.blog) oneTime += priceMap.blog
    if (inputs.booking) oneTime += priceMap.booking

    const monthly = inputs.carePlan ? priceMap.carePlan : 0

    const weeks = Math.round(
      2 +
        inputs.pages / 4 +
        (inputs.ecommerce ? 3 : 0) +
        (inputs.seo ? 1 : 0) +
        (inputs.admin ? 2 : 0) +
        (inputs.database ? 1 : 0) +
        (inputs.ai ? 2 : 0) +
        (inputs.gallery ? 1 : 0) +
        (inputs.viewer3D ? 2 : 0) +
        (inputs.customDesign ? 3 : 0) +
        (inputs.blog ? 2 : 0) +
        (inputs.booking ? 1 : 0)
    )

    const items: BreakdownItem[] = [
      { name: 'Base package', cost: priceMap.base },
      {
        name: `${inputs.pages} pages (${inputs.design})`,
        cost: inputs.pages * priceMap.perPage * dMul,
      },
    ]

    if (inputs.ecommerce) items.push({ name: 'E-commerce', cost: ecommerceCost })
    if (inputs.seo) items.push({ name: 'SEO & Analytics', cost: priceMap.seo })
    if (inputs.admin) items.push({ name: 'Admin Panel', cost: adminCost })
    if (inputs.database) items.push({ name: 'Database', cost: databaseCost })
    if (inputs.ai) items.push({ name: 'AI Assistant', cost: priceMap.ai })
    if (inputs.gallery) items.push({ name: 'Gallery', cost: galleryCost })
    if (inputs.viewer3D) items.push({ name: '3D Viewer', cost: viewerCost })
    if (inputs.customDesign) items.push({ name: 'Custom Design', cost: priceMap.customDesign })
    if (inputs.contactForm) items.push({ name: 'Contact Form', cost: priceMap.contactForm })
    if (inputs.blog) items.push({ name: 'Blog', cost: priceMap.blog })
    if (inputs.booking) items.push({ name: 'Booking System', cost: priceMap.booking })

    const vatAmount = oneTime * (vatRate / 100)

    return {
      oneTimeCost: oneTime,
      monthlyCost: monthly,
      weeks,
      items,
      vatAmount,
      totalWithVat: oneTime + vatAmount,
      vatRate,
    }
  }, [inputs, vatRate])

  const updateInput = <K extends keyof InputsState>(key: K, value: InputsState[K]) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value }

      if (key === 'ecommerce' && value === true) {
        next.database = true
        setActiveFeature('ecommerce')
      }

      if (key === 'database' && value === false && prev.ecommerce) {
        next.ecommerce = false
      }

      if (key === 'gallery' && value === true) setActiveFeature('gallery')
      if (key === 'viewer3D' && value === true) setActiveFeature('viewer3D')
      if (key === 'customDesign' && value === true) setActiveFeature('customDesign')
      if (key === 'contactForm' && value === true) setActiveFeature('contactForm')
      if (key === 'blog' && value === true) setActiveFeature('blog')
      if (key === 'booking' && value === true) setActiveFeature('booking')

      return next
    })
  }

  const selectedPalette = themePalettes[inputs.colorTheme]

  const previewStyle = useMemo(
    (): CSSProperties =>
      ({
        '--preview-surface': selectedPalette.surface,
        '--preview-soft-surface': selectedPalette.softSurface,
        '--preview-text': selectedPalette.text,
        '--preview-muted': selectedPalette.muted,
        '--preview-gradient': selectedPalette.gradient,
        '--preview-button': selectedPalette.button,
        '--preview-button-text': selectedPalette.buttonText,
        '--preview-border': selectedPalette.border,
        '--preview-glow': selectedPalette.glow,
      }) as CSSProperties,
    [selectedPalette]
  )

  const copyEstimate = async () => {
    const text = `Website estimate
-----------------------------
One-time cost: ${formatCurrency(breakdown.oneTimeCost)} ex. VAT
Total incl. VAT: ${formatCurrency(breakdown.totalWithVat)}
Monthly cost: ${formatCurrency(breakdown.monthlyCost)}/mo
Estimated timeline: ~${breakdown.weeks} weeks

Configuration:
- Pages: ${inputs.pages}
- Design level: ${inputs.design}
- Color style: ${inputs.colorTheme}
- E-commerce: ${inputs.ecommerce ? 'Yes' : 'No'}
- SEO & Analytics: ${inputs.seo ? 'Yes' : 'No'}
- Admin Panel: ${inputs.admin ? 'Yes' : 'No'}
- Database: ${inputs.database ? 'Yes' : 'No'}
- AI Assistant: ${inputs.ai ? 'Yes' : 'No'}
- Care & Maintenance: ${inputs.carePlan ? 'Yes' : 'No'}`

    try {
      await navigator.clipboard.writeText(text.trim())
      alert('Estimate copied to clipboard.')
    } catch {
      alert('Could not copy right now.')
    }
  }

  const resetCalculator = () => {
    setInputs({
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
    setShowBreakdown(false)
    setPreviewMode('website')
    setMenuOpen(false)
    setActiveFeature('home')
    setOpenSections({
      design: true,
      colors: true,
      addons: false,
      configuration: false,
      extraFeatures: false,
      complexity: false,
    })
    setPreviewBackgroundEffect('default')
  }

  const designDescriptions: Record<DesignLevel, string> = {
    standard: 'Simple and clean. Minimal effects and straightforward layout.',
    premium: 'Balanced and polished. Better shadows, nicer spacing and moderate animation.',
    elite: 'High-end presentation. Rich layout, stronger animation and premium visual energy.',
  }

  const tDesignClass = `design-${inputs.design}`
  const bgEffectClass =
    previewBackgroundEffect !== 'default' ? `bg-${previewBackgroundEffect}` : ''

  const featureNav = [
    inputs.ecommerce ? { id: 'ecommerce' as ActiveFeature, label: 'Store' } : null,
    inputs.gallery ? { id: 'gallery' as ActiveFeature, label: 'Gallery' } : null,
    inputs.viewer3D ? { id: 'viewer3D' as ActiveFeature, label: '3D View' } : null,
    inputs.customDesign ? { id: 'customDesign' as ActiveFeature, label: 'Custom' } : null,
    inputs.blog ? { id: 'blog' as ActiveFeature, label: 'Blog' } : null,
    inputs.contactForm ? { id: 'contactForm' as ActiveFeature, label: 'Contact' } : null,
    inputs.booking ? { id: 'booking' as ActiveFeature, label: 'Booking' } : null,
  ].filter(Boolean) as { id: ActiveFeature; label: string }[]

  const remainingPages = Math.max(0, inputs.pages - 1 - featureNav.length)
  const navItems = [
    ...featureNav,
    ...Array.from({ length: remainingPages }, (_, i) => ({
      id: 'page' as ActiveFeature,
      label: `Page ${featureNav.length + i + 2}`,
    })),
  ]

  const previewCards = [
    { title: 'Fast setup', desc: 'Launch quickly with a clean modern structure.' },
    { title: 'Great UX', desc: 'Strong layout and smooth browsing on every device.' },
    { title: 'Built to grow', desc: 'Flexible foundation with room for more features.' },
  ]

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

              <div className="group">
                <button
                  type="button"
                  className={`dropbtn ${openSections.design ? 'open' : ''}`}
                  onClick={() => toggleSection('design')}
                >
                  <span className="label">{t.designComplexity}</span>
                  <span className="dropbtn-icon">
                    {openSections.design ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>

                <div className={`toggle-grid toggle-grid-3 dropdown-content ${openSections.design ? 'open' : ''}`}>
                  {(['standard', 'premium', 'elite'] as DesignLevel[]).map((level) => (
                    <label
                      key={level}
                      className={`toggle ${inputs.design === level ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={inputs.design === level}
                        onChange={() => updateInput('design', level)}
                      />
                      <span className="toggle-title design-level-title">{level}</span>
                      <span className="toggle-desc">{designDescriptions[level]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="group">
                <button
                  type="button"
                  className={`dropbtn ${openSections.colors ? 'open' : ''}`}
                  onClick={() => toggleSection('colors')}
                >
                  <span className="label">{t.colorStyle}</span>
                  <span className="dropbtn-icon">
                    {openSections.colors ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>

                <div className={`theme-grid dropdown-content ${openSections.colors ? 'open' : ''}`}>
                  {(Object.keys(themePalettes) as ColorTheme[]).map((themeKey) => {
                    const theme = themePalettes[themeKey]
                    const isActive = inputs.colorTheme === themeKey

                    return (
                      <button
                        key={themeKey}
                        type="button"
                        className={`theme-card ${isActive ? 'active' : ''}`}
                        onClick={() => updateInput('colorTheme', themeKey)}
                      >
                        <div className="theme-card-top">
                          <div>
                            <h4>{theme.name}</h4>
                            <p>{theme.description}</p>
                          </div>
                        </div>

                        <div className="theme-palette">
                          {theme.colors.map((color) => (
                            <span
                              key={color}
                              className="theme-swatch"
                              style={{ background: color }}
                            />
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="group">
                <button
                  type="button"
                  className={`dropbtn ${openSections.addons ? 'open' : ''}`}
                  onClick={() => toggleSection('addons')}
                >
                  <span className="label">{t.addons}</span>
                  <span className="dropbtn-icon">
                    {openSections.addons ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>

                <div className={`toggle-grid dropdown-content ${openSections.addons ? 'open' : ''}`}>
                  <label className={`toggle ${inputs.ecommerce ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={inputs.ecommerce}
                      onChange={(e) => updateInput('ecommerce', e.target.checked)}
                    />
                    <span className="toggle-title">
                      {t.ecommerceTitle} <FiPackage />
                    </span>
                    <span className="toggle-desc">{t.ecommerceDesc}</span>
                  </label>

                  <label className={`toggle ${inputs.seo ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={inputs.seo}
                      onChange={(e) => updateInput('seo', e.target.checked)}
                    />
                    <span className="toggle-title">
                      {t.seoTitle} <FiZap />
                    </span>
                    <span className="toggle-desc">{t.seoDesc}</span>
                  </label>

                  <label className={`toggle ${inputs.carePlan ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={inputs.carePlan}
                      onChange={(e) => updateInput('carePlan', e.target.checked)}
                    />
                    <span className="toggle-title">
                      {t.careTitle} <FiCheck />
                    </span>
                    <span className="toggle-desc">{t.careDesc}</span>
                  </label>
                </div>
              </div>

              <div className="group">
                <button
                  type="button"
                  className={`dropbtn ${openSections.configuration ? 'open' : ''}`}
                  onClick={() => toggleSection('configuration')}
                >
                  <span className="label">{t.configuration}</span>
                  <span className="dropbtn-icon">
                    {openSections.configuration ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>

                <div className={`toggle-grid dropdown-content ${openSections.configuration ? 'open' : ''}`}>
                  <label className={`toggle ${inputs.admin ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={inputs.admin}
                      onChange={(e) => updateInput('admin', e.target.checked)}
                    />
                    <span className="toggle-title">
                      {t.adminTitle} <FiShield />
                    </span>
                    <span className="toggle-desc">{t.adminDesc}</span>
                  </label>

                  <label
                    className={`toggle ${inputs.database ? 'checked' : ''} ${
                      inputs.ecommerce ? 'disabled' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={inputs.database}
                      disabled={inputs.ecommerce}
                      onChange={(e) => updateInput('database', e.target.checked)}
                    />
                    <span className="toggle-title">
                      {t.databaseTitle} <FiDatabase />
                    </span>
                    <span className="toggle-desc">
                      {inputs.ecommerce ? t.databaseDescRequired : t.databaseDesc}
                    </span>
                  </label>

                  <label className={`toggle ${inputs.ai ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={inputs.ai}
                      onChange={(e) => updateInput('ai', e.target.checked)}
                    />
                    <span className="toggle-title">
                      {t.aiTitle} <FiZap />
                    </span>
                    <span className="toggle-desc">{t.aiDesc}</span>
                  </label>
                </div>
              </div>

              <div className="group">
                <button
                  type="button"
                  className={`dropbtn ${openSections.extraFeatures ? 'open' : ''}`}
                  onClick={() => toggleSection('extraFeatures')}
                >
                  <span className="label">{t.extraFeatures}</span>
                  <span className="dropbtn-icon">
                    {openSections.extraFeatures ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>

                <div className={`toggle-grid dropdown-content ${openSections.extraFeatures ? 'open' : ''}`}>
                  {[
                    ['gallery', t.galleryTitle, t.galleryDesc],
                    ['viewer3D', t.viewer3DTitle, t.viewer3DDesc],
                    ['customDesign', t.customDesignTitle, t.customDesignDesc],
                    ['contactForm', t.contactFormTitle, t.contactFormDesc],
                    ['blog', t.blogTitle, t.blogDesc],
                    ['booking', t.bookingTitle, t.bookingDesc],
                  ].map(([key, title, desc]) => {
                    const typedKey = key as keyof InputsState
                    const checked = Boolean(inputs[typedKey])

                    return (
                      <label key={key} className={`toggle ${checked ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            updateInput(
                              typedKey,
                              e.target.checked as InputsState[keyof InputsState]
                            )
                          }
                        />
                        <span className="toggle-title">{title}</span>
                        <span className="toggle-desc">{desc}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {(inputs.ecommerce ||
                inputs.admin ||
                (inputs.database && !inputs.ecommerce) ||
                inputs.gallery ||
                inputs.viewer3D) && (
                <div className="group">
                  <button
                    type="button"
                    className={`dropbtn ${openSections.complexity ? 'open' : ''}`}
                    onClick={() => toggleSection('complexity')}
                  >
                    <span className="label">Complexity settings</span>
                    <span className="dropbtn-icon">
                      {openSections.complexity ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  </button>

                  <div className={`dropdown-content block ${openSections.complexity ? 'open' : ''}`}>
                    {inputs.ecommerce && (
                      <div className="mini-group">
                        <label className="label">
                          {t.ecommerceComplexity}
                          <span className="value">
                            {formatCurrency(
                              dyn(priceMap.ecommerce.min, priceMap.ecommerce.max, inputs.ecommerceLevel)
                            )}
                          </span>
                        </label>
                        <input
                          className="slider"
                          type="range"
                          min="1"
                          max="10"
                          value={inputs.ecommerceLevel}
                          onChange={(e) =>
                            updateInput('ecommerceLevel', parseInt(e.target.value, 10))
                          }
                        />
                        <div className="scale-row">
                          <span>{t.basic}</span>
                          <span>{t.advanced}</span>
                        </div>
                      </div>
                    )}

                    {inputs.admin && (
                      <div className="mini-group">
                        <label className="label">
                          {t.adminComplexity}
                          <span className="value">
                            {formatCurrency(dyn(priceMap.admin.min, priceMap.admin.max, inputs.adminLevel))}
                          </span>
                        </label>
                        <input
                          className="slider"
                          type="range"
                          min="1"
                          max="10"
                          value={inputs.adminLevel}
                          onChange={(e) => updateInput('adminLevel', parseInt(e.target.value, 10))}
                        />
                        <div className="scale-row">
                          <span>{t.basic}</span>
                          <span>{t.advanced}</span>
                        </div>
                      </div>
                    )}

                    {inputs.database && !inputs.ecommerce && (
                      <div className="mini-group">
                        <label className="label">
                          {t.databaseComplexity}
                          <span className="value">
                            {formatCurrency(
                              dyn(priceMap.database.min, priceMap.database.max, inputs.databaseLevel)
                            )}
                          </span>
                        </label>
                        <input
                          className="slider"
                          type="range"
                          min="1"
                          max="10"
                          value={inputs.databaseLevel}
                          onChange={(e) =>
                            updateInput('databaseLevel', parseInt(e.target.value, 10))
                          }
                        />
                        <div className="scale-row">
                          <span>{t.basic}</span>
                          <span>{t.advanced}</span>
                        </div>
                      </div>
                    )}

                    {inputs.gallery && (
                      <div className="mini-group">
                        <label className="label">
                          {t.galleryComplexity}
                          <span className="value">
                            {formatCurrency(
                              dyn(priceMap.gallery.min, priceMap.gallery.max, inputs.galleryLevel)
                            )}
                          </span>
                        </label>
                        <input
                          className="slider"
                          type="range"
                          min="1"
                          max="10"
                          value={inputs.galleryLevel}
                          onChange={(e) =>
                            updateInput('galleryLevel', parseInt(e.target.value, 10))
                          }
                        />
                        <div className="scale-row">
                          <span>{t.basic}</span>
                          <span>{t.advanced}</span>
                        </div>
                      </div>
                    )}

                    {inputs.viewer3D && (
                      <div className="mini-group">
                        <label className="label">
                          {t.viewer3DComplexity}
                          <span className="value">
                            {formatCurrency(
                              dyn(priceMap.viewer3D.min, priceMap.viewer3D.max, inputs.viewer3DLevel)
                            )}
                          </span>
                        </label>
                        <input
                          className="slider"
                          type="range"
                          min="1"
                          max="10"
                          value={inputs.viewer3DLevel}
                          onChange={(e) =>
                            updateInput('viewer3DLevel', parseInt(e.target.value, 10))
                          }
                        />
                        <div className="scale-row">
                          <span>{t.basic}</span>
                          <span>{t.advanced}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="disclaimer">???? {t.priceDisclaimer}</p>
            </div>

            <div>
              <div className="preview glass">
                <div className="mock-header">
                  <span className="mock-dot red"></span>
                  <span className="mock-dot yellow"></span>
                  <span className="mock-dot green"></span>
                </div>

                {inputs.admin && (
                  <div className="view-switch">
                    <button
                      className={`view-btn ${previewMode === 'website' ? 'active' : ''}`}
                      onClick={() => setPreviewMode('website')}
                      type="button"
                    >
                      <FiGlobe /> {t.website}
                    </button>
                    <button
                      className={`view-btn ${previewMode === 'admin' ? 'active' : ''}`}
                      onClick={() => setPreviewMode('admin')}
                      type="button"
                    >
                      <FiShield /> {t.adminPanel}
                    </button>
                  </div>
                )}

                {previewMode === 'admin' && inputs.admin ? (
                  <div className={`admin-panel ${tDesignClass}`} style={previewStyle}>
                    <div className="admin-header">
                      <h3>Admin Dashboard</h3>
                      <span className="muted">v2.0</span>
                    </div>

                    <div className="stats">
                      {[
                        ['Visitors today', '1,284'],
                        ['Orders', '47'],
                        ['Revenue', 'NOK 28,450'],
                        ['Conversion rate', '3.7%'],
                      ].map(([k, v], i) => (
                        <div key={i} className="stat">
                          <h4>{k}</h4>
                          <p>{v}</p>
                        </div>
                      ))}
                    </div>

                    <div className="admin-menu">
                      <div className="admin-item">
                        <FiPackage /> Products
                      </div>
                      <div className="admin-item">
                        <FiSliders /> Settings
                      </div>
                      <div className="admin-item">
                        <FiDatabase /> Database
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`mock-site ${tDesignClass} ${bgEffectClass}`} style={previewStyle}>
                    <div className="site-inner">
                      <div className="site-top">
                        <div className="site-logo">BrandName</div>

                        <nav className="site-nav">
                          {navItems.length > 5 ? (
                            <div className="hambox">
                              <button
                                className={`hamburger ${menuOpen ? 'open' : ''}`}
                                onClick={() => setMenuOpen(!menuOpen)}
                                type="button"
                              >
                                <span />
                                <span />
                                <span />
                              </button>

                              {menuOpen && (
                                <div className={`dropdown ${tDesignClass}`}>
                                  {navItems.map((n, i) => (
                                    <div
                                      key={i}
                                      className="menu-item"
                                      onClick={() => {
                                        if (n.id !== 'page') setActiveFeature(n.id)
                                      }}
                                    >
                                      {n.label}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            navItems.map((n, i) => (
                              <span
                                key={i}
                                className="nav-link"
                                onClick={() => {
                                  if (n.id !== 'page') setActiveFeature(n.id)
                                }}
                              >
                                {n.label}
                              </span>
                            ))
                          )}

                          {inputs.ecommerce && (
                            <button
                              className={`cart ${tDesignClass}`}
                              type="button"
                              onClick={() => setCartOpen(true)}
                            >
                              <span className="cart-ico">
                                <FiPackage />
                                {cartCount > 0 && <span className={`badge ${tDesignClass}`}>{cartCount}</span>}
                              </span>
                              <span className="cart-text">
                                {cartCount > 0 ? formatCurrency(cartTotal) : 'Cart'}
                              </span>
                            </button>
                          )}
                        </nav>
                      </div>

                      {activeFeature === 'gallery' && inputs.gallery ? (
                        <div className="gallery">
                          {[
                            'linear-gradient(135deg, #ddd6fe, #e0e7ff)',
                            'linear-gradient(135deg, #fce7f3, #fbcfe8)',
                            'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                            'linear-gradient(135deg, #fef3c7, #fde68a)',
                            'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                            'linear-gradient(135deg, #fecaca, #fca5a5)',
                          ].map((c, i) => (
                            <div key={i} className={`g-img ${tDesignClass}`} style={{ background: c }} />
                          ))}
                        </div>
                      ) : activeFeature === 'viewer3D' && inputs.viewer3D ? (
                        <div className="viewer3d">
                          <div className="viewer-canvas">
                            ????<span className="badge-360">360??</span>
                          </div>
                          <div className="viewer-controls">
                            <button type="button">Rotate</button>
                            <button type="button">Zoom</button>
                            <button type="button">Settings</button>
                          </div>
                          <p className="muted center">
                            Interactive 3D viewing lets customers explore products from every angle.
                          </p>
                        </div>
                      ) : activeFeature === 'customDesign' && inputs.customDesign ? (
                        <div className="custom-design">
                          <h3 className="cd-title">Custom Design</h3>
                          <p className="cd-note">
                            Tailored design direction with visual personality, layout ideas and effects.
                          </p>

                          <div className="cd-grid">
                            {[
                              ['Color Systems', 'Connected theme palettes matched to the preview.'],
                              ['Custom Layouts', 'More unique page structures for your content.'],
                              ['Visual Effects', 'Gradients, glow, motion and layered presentation.'],
                              ['Interactions', 'Hover states, small animations and micro-interactions.'],
                              ['Responsive Design', 'Strong scaling across desktop and mobile.'],
                              ['Conversion Focus', 'Layout choices designed to support action.'],
                            ].map(([h, p], i) => (
                              <div key={i} className="cd-option">
                                <h4>{h}</h4>
                                <p>{p}</p>
                              </div>
                            ))}
                          </div>

                          <p className="cd-note">
                            <strong>Preview background effects:</strong>
                          </p>

                          <div className="bg-buttons">
                            <button
                              className={`bg-btn ${previewBackgroundEffect === 'default' ? 'active' : ''}`}
                              onClick={() => setPreviewBackgroundEffect('default')}
                              type="button"
                            >
                              Default
                            </button>
                            <button
                              className={`bg-btn ${previewBackgroundEffect === 'stars' ? 'active' : ''}`}
                              onClick={() => setPreviewBackgroundEffect('stars')}
                              type="button"
                            >
                              Stars
                            </button>
                            <button
                              className={`bg-btn ${previewBackgroundEffect === 'wave' ? 'active' : ''}`}
                              onClick={() => setPreviewBackgroundEffect('wave')}
                              type="button"
                            >
                              Gradient Wave
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="hero-mock">
                            <div className="tier-badge">{inputs.design}</div>

                            <h2 className={`mock-title ${tDesignClass}`}>
                              {activeFeature === 'ecommerce' && inputs.ecommerce
                                ? 'Online Store'
                                : inputs.design === 'standard'
                                ? 'Simple Website'
                                : inputs.design === 'premium'
                                ? 'Premium Experience'
                                : 'Elite Brand Experience'}
                            </h2>

                            <p className={`mock-sub ${tDesignClass}`}>
                              {activeFeature === 'ecommerce' && inputs.ecommerce
                                ? 'Smooth shopping flow with clean product presentation.'
                                : inputs.design === 'standard'
                                ? 'Clear structure, basic layout and solid usability.'
                                : inputs.design === 'premium'
                                ? 'A polished website with stronger visuals and soft motion.'
                                : 'A rich, animated and high-end presentation built to stand out.'}
                            </p>

                            <span className={`mock-btn ${tDesignClass}`}>
                              {activeFeature === 'ecommerce' && inputs.ecommerce ? 'View products' : 'Get started'}
                            </span>
                          </div>

                          {activeFeature === 'ecommerce' && inputs.ecommerce ? (
                            <>
                              <div className="hero-mock">
                                <div className="tier-badge">{inputs.design}</div>
                                <h2 className={`mock-title ${tDesignClass}`}>Online Store</h2>
                                <p className={`mock-sub ${tDesignClass}`}>
                                  Smooth shopping flow with clean product presentation.
                                </p>
                                <span className={`mock-btn ${tDesignClass}`}>View products</span>
                              </div>

                              <div className="product-grid">
                                {demoProducts.map((p) => (
                                  <div key={p.id} className={`product ${tDesignClass}`}>
                                    <div
                                      className={`p-img ${tDesignClass}`}
                                      style={{
                                        background: `linear-gradient(135deg, ${p.c1}, ${p.c2})`,
                                      }}
                                    />
                                    <div className="p-info">
                                      <h4 className={`p-name ${tDesignClass}`}>{p.name}</h4>
                                      <p className={`p-price ${tDesignClass}`}>{p.priceLabel}</p>
                                    </div>
                                    <button
                                      className={`p-add ${tDesignClass}`}
                                      type="button"
                                      onClick={() => addToCart(p)}
                                    >
                                      Add to cart
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className={`payments ${tDesignClass}`}>
                                <p className={`pay-label ${tDesignClass}`}>Secure payment methods</p>
                                <div className="pay-icons">
                                  <span className={`pay-ico ${tDesignClass}`}>
                                    <FaCcVisa />
                                  </span>
                                  <span className={`pay-ico ${tDesignClass}`}>
                                    <FaCcMastercard />
                                  </span>
                                  <span className={`vipps ${tDesignClass}`}>Vipps</span>
                                  {inputs.design !== 'standard' && (
                                    <span className={`pay-ico ${tDesignClass}`}>
                                      <FaPaypal />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="three-cards">
                              {previewCards.map((card, i) => (
                                <div key={i} className={`tcard ${tDesignClass}`}>
                                  <h4>{card.title}</h4>
                                  <p>{card.desc}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {inputs.ai && (
                        <div className={`ai-btn ${tDesignClass}`}>
                          <span className="ai-ico">????</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {cartOpen && (
                  <>
                    <div className="cart-overlay" onClick={() => setCartOpen(false)} />
                    <aside className={`cart-drawer ${tDesignClass}`}>
                      <div className="cart-drawer-head">
                        <h3>Your cart</h3>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setCartOpen(false)}
                        >
                          <FiX />
                        </button>
                      </div>

                      <div className="cart-drawer-body">
                        {cart.length === 0 ? (
                          <div className="cart-empty">
                            <p>No products added yet.</p>
                            <span>Try adding one of the demo products.</span>
                          </div>
                        ) : (
                          cart.map((item) => (
                            <div key={item.id} className="cart-item">
                              <div
                                className="cart-thumb"
                                style={{ background: item.image }}
                              />
                              <div className="cart-item-info">
                                <h4>{item.name}</h4>
                                <p>{formatCurrency(item.price)}</p>
                                <button
                                  type="button"
                                  className="remove-btn"
                                  onClick={() => removeItem(item.id)}
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="cart-item-actions">
                                <button
                                  type="button"
                                  onClick={() => decreaseQty(item.id)}
                                >
                                  <FiMinus />
                                </button>
                                <span>{item.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => increaseQty(item.id)}
                                >
                                  <FiPlus />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="cart-drawer-foot">
                        <div className="cart-total-row">
                          <span>Total</span>
                          <strong>{formatCurrency(cartTotal)}</strong>
                        </div>
                        <button type="button" className="checkout-btn">
                          Go to checkout
                        </button>
                      </div>
                    </aside>
                  </>
                )}
              </div>

              <div className="panel glass sticky">
                <h2 className="section-title">
                  <FiDollarSign /> {t.estimateTitle}
                </h2>
                <span className="note">{t.estimateNote}</span>

                <div className="total">
                  <p className="label">{t.estimatedCost}</p>
                  <h3 className="price">{formatCurrency(breakdown.oneTimeCost)}</h3>
                  <span className="qualifier">{t.exVat}</span>
                </div>

                <div className="total">
                  <p className="label">{t.estimatedWaitTime}</p>
                  <p className="weeks">
                    ~{breakdown.weeks} {t.weeks}
                  </p>
                </div>

                {breakdown.monthlyCost > 0 && (
                  <div className="total">
                    <p className="label">{t.monthlyLabel}</p>
                    <h3 className="price">
                      {formatCurrency(breakdown.monthlyCost)}
                      <span className="qualifier">{t.perMonth}</span>
                    </h3>
                  </div>
                )}

                <div className="breakdown">
                  <button
                    className="breakdown-head"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    type="button"
                  >
                    <span>{t.costBreakdown}</span>
                    {showBreakdown ? <FiChevronUp /> : <FiChevronDown />}
                  </button>

                  {showBreakdown && (
                    <div className="breakdown-list">
                      {breakdown.items.map((it, i) => (
                        <div key={i} className="breakdown-item">
                          <span>{it.name}</span>
                          <span className="b-val">{formatCurrency(it.cost)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="vat">
                  <label className="label">{t.selectCountry}</label>
                  <select
                    className="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value as Country)}
                  >
                    <option value="NO">Norway (25% VAT)</option>
                    <option value="SE">Sweden (25% VAT)</option>
                    <option value="DK">Denmark (25% VAT)</option>
                    <option value="FI">Finland (24% VAT)</option>
                    <option value="DE">Germany (19% VAT)</option>
                    <option value="FR">France (20% VAT)</option>
                    <option value="UK">United Kingdom (20% VAT)</option>
                    <option value="US">United States (0% tax)</option>
                  </select>

                  <div className="tax-sum">
                    <div className="tax-row">
                      <span>{t.priceBeforeVat}</span>
                      <span>{formatCurrency(breakdown.oneTimeCost)}</span>
                    </div>
                    <div className="tax-row">
                      <span>
                        {t.vat} ({breakdown.vatRate}%):
                      </span>
                      <span>{formatCurrency(breakdown.vatAmount)}</span>
                    </div>
                    <div className="tax-row total">
                      <span>{t.totalInclVat}</span>
                      <span>{formatCurrency(breakdown.totalWithVat)}</span>
                    </div>
                  </div>
                </div>

                <Link href="/auth/login">
                  <button className="cta" type="button">
                    {t.loginForAccess} <FiArrowRight />
                  </button>
                </Link>

                <div className="small-actions">
                  <button className="small" onClick={copyEstimate} type="button">
                    <FiCopy /> {t.copy}
                  </button>
                  <button className="small" onClick={resetCalculator} type="button">
                    <FiRefreshCw /> {t.reset}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
