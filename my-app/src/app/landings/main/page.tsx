import Header from '@/components/header'
import AnimatedBrowserMockup from '@/svgs/web'
import Link from 'next/link'
import CircuitBoardViewer from '@/components/board'

export default function MainLanding() {
  return (
    <>
      <Header />
      <main className="page">
        <section className="hero">
          <span className="badge">Guest view</span>
          <h1>Welcome to Vintra</h1>
          <p>
            Utforsk nettsider og chat widgets f??r du logger inn. Denne siden er laget
            for ?? gi en ryddig f??rstegangsopplevelse.
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
            <p>Se hva vi tilbyr av nettsidemaler og l??sninger som guest.</p>
            <div style={{ width: 500 }}>
      <AnimatedBrowserMockup />
    </div>  
            <Link href="/landings/guest/websites">
              <button className="secondaryBtn">Check it out</button>
            </Link>
          </div>

          <div className="featureCard">
            <h2>Want to have a chat widget?</h2>
            <p>Test konseptet og se hvordan widget-l??sningen fungerer.</p>
            <section style={{ padding: '40px' }}>
      
    </section>
            <Link href="/landings/guest/chatWidget">
              <button className="primaryBtn">Check it out</button>
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
