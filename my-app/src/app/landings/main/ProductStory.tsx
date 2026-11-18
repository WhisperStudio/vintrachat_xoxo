'use client'

import { useEffect, useRef, useState } from 'react'
import VintraHost from '@/svgs/VintraHost'
import StoryMountain from '@/svgs/StoryMountain'
import StoryWidget from './StoryWidget'
import StoryAdminPreview from './StoryAdminPreview'

type Language = 'no' | 'en'
const chapters = {
  no: [
    { label: 'Nettsiden', title: 'Først, et sted kunden vil bli.', body: 'En nettside skal gjøre det enkelt å forstå hvem dere er, hva dere tilbyr og hvordan kunden kommer videre. Vi bygger et tydelig førsteinntrykk som fungerer på mobil og desktop.', points: ['Design som passer bedriften', 'Tjenestene dine, enkelt forklart', 'En tydelig vei til kontakt'], host: 'Vi starter her. Dette er nettsiden til Fjord Studio, en eksempelbedrift.' },
    { label: 'Første spørsmål', title: 'Så kommer det et spørsmål.', body: 'Kunden er interessert, men trenger litt hjelp. Chatbotten er tilgjengelig på nettsiden og gir en naturlig vei inn i samtalen, uten at kunden må lete etter riktig side.', points: ['Hjelp der kunden allerede er', 'Svar også utenfor åpningstid', 'Tilpasset ditt visuelle uttrykk'], host: 'Lurer kunden på noe? Jeg viser hvordan chatten kan hjelpe.' },
    { label: 'Et nyttig svar', title: 'Fra nysgjerrig til litt tryggere.', body: 'Gi chatbotten informasjon om bedriften, tjenestene og vanlige spørsmål. Da kan den forklare tilbudet ditt og hjelpe kunden å finne riktig neste steg.', points: ['Kunnskap du legger inn', 'Tone og språk som passer dere', 'Veiledning til riktig tjeneste'], host: 'Et godt svar gjør tilbudet enklere å forstå. Se hvordan samtalen utvikler seg.' },
    { label: 'Menneskelig hjelp', title: 'Noen ganger trengs et menneske.', body: 'Når kunden trenger mer hjelp, kan samtalen merkes for oppfølging. Teamet får med seg spørsmålene som allerede er stilt, så kunden slipper å begynne på nytt.', points: ['Be om oppfølging i samtalen', 'Bevar konteksten fra dialogen', 'La teamet ta neste steg'], host: 'Denne kunden vil snakke med teamet. Da følger sammenhengen med videre.' },
    { label: 'Alt på ett sted', title: 'Og du beholder oversikten.', body: 'I administrasjonen finner du samtalene, følger opp henvendelser og justerer chatbotten. Ett sted å jobbe videre, med informasjonen fra kundedialogen tilgjengelig.', points: ['Samtaler og oppfølging', 'Kunnskap og chatbotdesign', 'Oversikt over aktiviteten'], host: 'Her møtes alt: samtalene, oppgavene og innstillingene dine.' },
  ],
  en: [
    { label: 'The website', title: 'First, a place worth staying.', body: 'Your website should make it easy to understand who you are, what you offer and how to take the next step. We build a clear first impression for mobile and desktop.', points: ['Design that fits your business', 'Your services, clearly explained', 'A clear path to getting in touch'], host: 'Let’s start here. This is Fjord Studio, our example business.' },
    { label: 'The first question', title: 'Then comes a question.', body: 'Your customer is interested but needs a little help. A chatbot on your website creates a natural way into a conversation without having to find the right page.', points: ['Help where customers already are', 'Answers outside business hours', 'Designed to match your identity'], host: 'Have a question? Let me show you how the chat can help.' },
    { label: 'A useful answer', title: 'From curious to more confident.', body: 'Give your chatbot information about your business, services and frequently asked questions. It can explain what you offer and help customers find their next step.', points: ['Knowledge you provide', 'Your own tone and language', 'Guidance to the right service'], host: 'A useful answer makes your offering easier to understand. Watch the conversation unfold.' },
    { label: 'Human help', title: 'Sometimes, it takes a person.', body: 'When a customer needs more help, the conversation can be flagged for follow-up. Your team can see what has already been discussed, without asking the customer to start again.', points: ['Request follow-up in the chat', 'Keep the conversation context', 'Let your team take the next step'], host: 'This customer wants to speak with the team. The context goes with them.' },
    { label: 'One workspace', title: 'And you stay in the picture.', body: 'Find conversations, follow up on enquiries and adjust your chatbot in the administration workspace. One place to continue working, with the customer conversation at hand.', points: ['Conversations and follow-up', 'Knowledge and chatbot design', 'An overview of activity'], host: 'Here it all comes together: conversations, tasks and settings.' },
  ],
}

function WebsitePreview({ language, onOpen }: { language: Language; onOpen: () => void }) {
  const no = language === 'no'
  return <div className="exampleWebsite">
    <div className="exampleSiteNav"><strong>fjord<span>studio</span></strong><span>{no ? 'Design med omtanke.' : 'Thoughtful design.'}</span></div>
    <div className="exampleSiteHero"><span className="exampleSiteEyebrow">ARKITEKTUR & INTERIØR</span><h3>{no ? 'Rom for det som betyr noe.' : 'Room for what matters.'}</h3><p>{no ? 'Vi skaper gjennomtenkte rom for mennesker og hverdagen deres.' : 'Considered spaces for people and their everyday lives.'}</p><a href="#contact">{no ? 'La oss snakke om prosjektet ditt' : 'Let’s talk about your project'} ↗</a><div className="exampleArchitecture" aria-hidden="true"><div className="exampleArchitectureSun"/><div className="exampleArchitectureBack"/><div className="exampleArchitectureBuilding"><i/><i/><i/></div><div className="exampleArchitectureFloor"/></div></div>
    <div className="exampleServices">{(no ? ['Fra første idé', 'Til et sted å høre til', 'Med deg hele veien'] : ['From the first idea', 'To a place to belong', 'With you all the way']).map((item,i)=><span key={item}><small>0{i+1}</small>{item}</span>)}</div>

  </div>
}

function ChatPreview({ language, step }: { language: Language; step: number }) {
 return <StoryWidget language={language} step={step} />
}

export default function ProductStory({ language }: { language: Language }) {
  const no = language === 'no'
  const steps = chapters[language]
  const [active, setActive] = useState(0)
  const [guideVisible, setGuideVisible] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sections = [...root.querySelectorAll<HTMLElement>('[data-chapter]')]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, target = 0, current = 0, last = 0
    let positions: number[] = []
    const measure = () => { positions = sections.map(el => el.getBoundingClientRect().top + window.scrollY); update() }
    const animate = (time: number) => {
      const delta = Math.min((time - last) / 1000 || .016, .05)
      last = time
      current += (target - current) * (1 - Math.exp(-5 * delta))
      root.style.setProperty('--story-drift', String(current))
      if (Math.abs(target-current) > .001) frame = requestAnimationFrame(animate)
      else frame = 0
    }
    const update = () => {
      const marker = window.scrollY + Math.min(window.innerHeight * .56, 650)
      let index = 0
      positions.forEach((top,i) => { if (marker >= top) index = i })
      setActive(previous => previous === index ? previous : index)
      target = Math.min(Math.max((marker - (positions[0] || 0)) / Math.max((positions.at(-1) || 1) - (positions[0] || 0),1),0),1)
      if (reduced.matches) { current = target; root.style.setProperty('--story-drift',String(current)) }
      else if (!frame) { last = performance.now(); frame = requestAnimationFrame(animate) }
    }
    measure()
    window.addEventListener('scroll',update,{passive:true})
    window.addEventListener('resize',measure)
    const resize = new ResizeObserver(measure)
    resize.observe(root)
    return () => { cancelAnimationFrame(frame); resize.disconnect(); window.removeEventListener('scroll',update); window.removeEventListener('resize',measure) }
  }, [language])
  useEffect(() => {
    const layout = rootRef.current?.querySelector('.storyLayout')
    if (!layout) return
    const observer = new IntersectionObserver(([entry]) => setGuideVisible(entry.isIntersecting), { rootMargin: '0px 0px -12% 0px', threshold: 0 })
    observer.observe(layout)
    return () => observer.disconnect()
  }, [])
  const goTo = (step: number) => { setActive(step); document.getElementById('story-step-'+step)?.scrollIntoView({block:'start'}) }
  return <section ref={rootRef} className="productStory" id="solutions" aria-label={no ? 'Fra nettside til oppfølging' : 'From website to follow-up'}>
    <div className="storyMountainIntro" id="story-mountain"><div className="storyMountainArt" aria-hidden="true"><StoryMountain /></div><div className="storyIntro"><span className="storyEyebrow">{no ? 'FØLG EN KUNDEREISE' : 'FOLLOW A CUSTOMER JOURNEY'}</span><h2>{no ? 'Se hvordan det henger sammen.' : 'See how it all connects.'}</h2><p>{no ? 'Én eksempelbedrift. Ett spørsmål. Hele veien fra første besøk til teamets oversikt.' : 'One example business. One question. All the way from the first visit to your team’s overview.'}</p></div></div>
    <div className="storyLayout"><div className="storyChapters">{steps.map((step,i)=><article id={'story-step-'+i} data-chapter={i} data-active={active===i} className="storyChapter" key={step.label}><span className="storyChapterNumber">0{i+1} / 05 <span>{step.label}</span></span><h2>{step.title}</h2><p>{step.body}</p><ul>{step.points.map(point=><li key={point}><span aria-hidden="true">✓</span>{point}</li>)}</ul><div className="storyStaticPreview" inert>{i===0 ? <WebsitePreview language={language} onOpen={()=>goTo(1)}/> : i===4 ? <StoryAdminPreview language={language} staticViews/> : <ChatPreview language={language} step={i}/>}</div><a className="storyNext" href={i < 4 ? '#story-step-'+(i+1) : '#contact'}>{i < 4 ? (no ? 'Neste steg' : 'Next step') : (no ? 'La oss finne din løsning' : 'Let’s find your solution')} <span aria-hidden="true">↓</span></a></article>)}</div>
    <div className="storyVisual" data-guide-visible={guideVisible}><nav className="storySteps" aria-label={no ? 'Trinn i demonstrasjonen' : 'Demo steps'}>{steps.map((step,i)=><button type="button" key={step.label} aria-label={step.label} aria-current={active===i?'step':undefined} onClick={()=>goTo(i)}><span>0{i+1}</span><i/></button>)}</nav>
      <div className="storyBrowser" data-scene={active} role="img" aria-label={no ? 'Visning av nettside, chatbot og adminpanel' : 'Presentation of the website, chatbot and admin workspace'}>
        <div className="storyBrowserBar"><span className="storyBrowserDots" aria-hidden="true"><i/><i/><i/></span><span>{active===4 ? 'vintra / fjord studio' : 'fjordstudio.no'}</span></div>
        <div className="storyBrowserCanvas" inert><div className="storyWebsiteLayer" inert={active===4}><WebsitePreview language={language} onOpen={()=>goTo(1)}/></div>{active<4 && <div className="storyWidgetLayer"><StoryWidget language={language} step={active} onOpen={()=>goTo(1)} onClose={()=>goTo(0)}/></div>}{active===4 && <div className="storyAdminLayer"><StoryAdminPreview language={language} playing={guideVisible}/></div>}</div>
      </div>
      <div className="storyHostCaption"><div className="storyGuideFigure" data-expression={active===3?'attentive':active===4?'happy':'guiding'}><VintraHost expression={active===3?'attentive':active===4?'happy':'guiding'}/></div><div key={active} className="storyHostWords"><small>{no ? 'VERTEN DIN' : 'YOUR GUIDE'}</small><p>{steps[active].host}</p></div></div>

    </div></div>
  </section>
}
