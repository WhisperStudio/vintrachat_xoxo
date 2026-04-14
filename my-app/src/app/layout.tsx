import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import AppShell from '@/components/AppShell'

export const metadata = {
  title: 'V.O.T.E',
  description: 'Landing and dashboard demo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
