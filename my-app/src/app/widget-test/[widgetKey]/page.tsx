import Script from 'next/script'

export default async function WidgetTestPage({
  params,
}: {
  params: Promise<{ widgetKey: string }>
}) {
  const { widgetKey } = await params

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px',
        background:
          'radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 30%), radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.08), transparent 30%), #f8fafc',
        fontFamily: 'Inter, Arial, sans-serif',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          padding: '16px 18px',
          borderRadius: 18,
          background: 'rgba(255, 255, 255, 0.86)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
        }}
      >
        <strong style={{ display: 'block', marginBottom: 8 }}>Export Test Surface</strong>
        <p style={{ margin: 0, color: '#475569', lineHeight: 1.55 }}>
          This page loads the exported widget script exactly like a customer website
          would.
        </p>
      </div>

      <Script src={`/widget/${widgetKey}.js?open=1`} strategy="afterInteractive" />
    </main>
  )
}
