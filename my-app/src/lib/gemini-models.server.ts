const ALLOWED_GEMINI_MODELS = ['gemini-2.5-flash-lite']

type ModelListResponse = {
  models?: Array<{
    name?: string
  }>
}

type CacheEntry = {
  expiresAt: number
  models: string[]
}

const modelCache = new Map<string, CacheEntry>()
const MODEL_CACHE_TTL_MS = 5 * 60 * 1000

function normalizeModelName(value: string | null | undefined) {
  const model = String(value || '').trim()
  if (!model) return null
  const cleaned = model.startsWith('models/') ? model.slice('models/'.length) : model
  return ALLOWED_GEMINI_MODELS.includes(cleaned) ? cleaned : null
}

function parseModelList(value?: string | null) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

async function fetchAvailableGeminiModels(apiKey: string) {
  const cacheKey = apiKey.slice(0, 12)
  const cached = modelCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.models
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  if (!response.ok) {
    modelCache.set(cacheKey, {
      expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
      models: [],
    })
    return []
  }

  const payload = (await response.json()) as ModelListResponse
  const models = (payload.models || [])
    .map((entry) => normalizeModelName(entry.name))
    .filter((entry): entry is string => Boolean(entry))

  modelCache.set(cacheKey, {
    expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
    models,
  })

  return models
}

export async function getGeminiModelCandidates(primaryModel: string, apiKey?: string | null) {
  const normalizedPrimary = normalizeModelName(primaryModel) || 'gemini-2.5-flash-lite'
  const configuredFallbacks = parseModelList(process.env.GEMINI_MODEL_FALLBACKS)
    .map((model) => normalizeModelName(model))
    .filter((model): model is string => Boolean(model))
  const configuredOrder = configuredFallbacks.length > 0 ? configuredFallbacks : ALLOWED_GEMINI_MODELS

  if (!apiKey) {
    return [normalizedPrimary, ...configuredOrder].filter((model, index, self) => self.indexOf(model) === index)
  }

  const availableModels = await fetchAvailableGeminiModels(apiKey)
  const modelPool = availableModels.length > 0 ? availableModels : ALLOWED_GEMINI_MODELS
  const preferredOrder = configuredOrder.filter((model) => modelPool.includes(model))

  return [normalizedPrimary, ...preferredOrder].filter((model, index, self) => self.indexOf(model) === index)
}

export function getAllowedGeminiModels() {
  return [...ALLOWED_GEMINI_MODELS]
}
