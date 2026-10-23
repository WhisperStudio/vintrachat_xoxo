import { NextRequest } from 'next/server'
import { verifyActiveUserToken } from '@/lib/verified-auth.server'
import { isSuperAdmin } from '@/lib/notifications/core.mjs'

export class VintraAdminAuthError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'VintraAdminAuthError'
    this.status = status
  }
}

export async function requireVintraAdmin(req: NextRequest) {
  const authorization = req.headers.get('authorization') || ''
  const token = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : ''

  if (!token) {
    throw new VintraAdminAuthError(401, 'Missing authorization token')
  }

  const decoded = await verifyActiveUserToken(token).catch(() => { throw new VintraAdminAuthError(401, 'Invalid session') })
  if (!isSuperAdmin(decoded)) {
    throw new VintraAdminAuthError(403, 'Forbidden')
  }

  return decoded
}
