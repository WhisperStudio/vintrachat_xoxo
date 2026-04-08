export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'transparent',
      }}
    >
      {children}
    </div>
  )
}
