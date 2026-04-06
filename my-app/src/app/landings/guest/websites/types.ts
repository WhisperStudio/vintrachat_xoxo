export type Country = 'NO' | 'SE' | 'DK' | 'FI' | 'DE' | 'FR' | 'UK' | 'US'
export type PreviewMode = 'website' | 'admin'
export type DesignLevel = 'standard' | 'premium' | 'elite'
export type PreviewBackgroundEffect = 'default' | 'stars' | 'wave'
export type ColorTheme = 'modern' | 'chilling' | 'corporate' | 'luxury'
export type ActiveFeature =
  | 'home'
  | 'ecommerce'
  | 'gallery'
  | 'viewer3D'
  | 'customDesign'
  | 'contactForm'
  | 'blog'
  | 'booking'
  | 'page'

export type InputsState = {
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
