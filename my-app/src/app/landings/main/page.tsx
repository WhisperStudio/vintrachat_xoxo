import Header from '@/components/header'
import Link from 'next/link'

export default function MainLanding() {
  return (
    <>
      <Header />
      <main className="page">
        <section className="hero">
          <span className="badge">Guest view</span>
          <h1>Velkommen til V.O.T.E</h1>
          <p>
            Utforsk nettsider og chat widgets før du logger inn. Denne siden er laget
            for å gi en ryddig førstegangsopplevelse.
          </p>

          <div className="heroActions">
            <Link href="/auth/signup">
              <button className="primaryBtn">Get Started</button>
            </Link>
            <Link href="/auth/login">
              <button className="secondaryBtn">Log In</button>
            </Link>
          </div>
        </section>

        <section className="cardGrid">
          <div className="featureCard">
            <h2>Want to make a website?</h2>
            <p>Se hva vi tilbyr av nettsidemaler og løsninger som guest.</p>
            <Link href="/landings/guest/websites">
              <button className="secondaryBtn">Check it out</button>
            </Link>
          </div>

          <div className="featureCard">
            <h2>Want to have a chat widget?</h2>
            <p>Test konseptet og se hvordan widget-løsningen fungerer.</p>
            <Link href="/landings/guest/chat-widget">
              <button className="primaryBtn">Check it out</button>
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}