'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import './admin-components.css'

function normalizeBaseUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

export default function AdminExportTestPanel() {
  const { business } = useAuth()
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_APP_URL || '')

  useEffect(() => {
    if (!baseUrl && typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [baseUrl])

  if (!business?.chatWidgetKey) {
    return (
      <div className="infoCard adminDataCard">
        <h1>Export Test</h1>
        <p>No widget key found for this business yet.</p>
      </div>
    )
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const embedUrl = `${normalizedBaseUrl || ''}/widget/${business.chatWidgetKey}.js`
  const testUrl = `/widget-test/${business.chatWidgetKey}`

  return (
    <div className="infoCard adminDataCard">
      <h1>Export Test</h1>
      <p>
        This page tests the actual exported widget script in an isolated surface inside the
        admin panel.
      </p>

      <div className="adminExportMeta">
        <div className="adminExportMetaItem">
          <strong>Widget key</strong>
          <code>{business.chatWidgetKey}</code>
        </div>
        <div className="adminExportMetaItem">
          <strong>Embed script</strong>
          <code>{embedUrl}</code>
        </div>
      </div>

      <iframe title="Export test" className="adminExportFrame" src={testUrl} />
    </div>
  )
}
