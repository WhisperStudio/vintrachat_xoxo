import './globals.css'
import { AuthProvider } from '@/components/auth-provider'

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}