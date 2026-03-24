import Header from '@/components/header'
import Link from 'next/link'

export default function GuestChatWidget() {
  return (
    <>
      <Header />
      <main className="page narrow">
        <div className="infoCard">
          <h1>Chat Widget for guests</h1>
          <p>
            Se hvordan widgeten kan brukes på nettsider, med en enkel preview av
            design, oppsett og funksjoner.
          </p>
        </div>

        <div className="infoCard">
          <h2>Included in preview</h2>
          <ul className="cleanList">
            <li>Responsivt widget-design</li>
            <li>Enkel integrasjon</li>
            <li>Mulighet for videre adminpanel</li>
          </ul>

          <Link href="/auth/login">
            <button className="primaryBtn">Log in for full access</button>
          </Link>
        </div>
      </main>
    </>
  )
}