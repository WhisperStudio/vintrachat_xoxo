import './page.css'
import VintraAdminClient from './VintraAdminClient'

export const metadata = {
  title: 'Vintra Admin',
  description: 'Internal Vintra control center',
}

export default function VintraAdminPage() {
  return <VintraAdminClient />
}
