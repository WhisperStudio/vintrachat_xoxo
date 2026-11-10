export const SITE_SEASONS = ['standard', 'winter', 'halloween', 'summer', 'easter'] as const

export type SiteSeason = (typeof SITE_SEASONS)[number]

export function isSiteSeason(value: unknown): value is SiteSeason {
  return typeof value === 'string' && SITE_SEASONS.includes(value as SiteSeason)
}

export function normalizeSiteSeason(value: unknown): SiteSeason {
  return isSiteSeason(value) ? value : 'standard'
}
