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
          <h1>Welcome to Vintra</h1>
          <h2>
            Explore our solutions and possibilities. 
          </h2>
          <h3>Try to create your own mockup with cost estimates before logging in.</h3>

        </section>

        <section className="cardGrid">
          <div className="featureCard">
            <h2>Want to make a website?</h2>
            <p>See our website templates and options. If something doesn't fit your needs, chat with us and we can make a custom solution for you.</p>
            <div style={{ width: 500 }}>
      <AnimatedBrowserMockup />
    </div>  
            <Link href="/landings/guest/websites">
              <button className="secondaryBtn">Check it out</button>
            </Link>
          </div>

          <div className="featureCard">
            <h2>Want to have a chat widget?</h2>
            <p>Design the widget and see how it looks before implementing it.</p>
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
