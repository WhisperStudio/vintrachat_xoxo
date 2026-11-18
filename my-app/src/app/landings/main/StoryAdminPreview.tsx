'use client'

﻿import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiBarChart2, FiCheckSquare, FiCreditCard, FiGrid, FiLayout, FiMessageSquare, FiSettings, FiSliders, FiStar, FiUsers } from 'react-icons/fi'
import VintraHost from '@/svgs/VintraHost'
import { businessAdminI18n } from '@/lib/i18n'
import { useEffect, useState } from 'react'

type View = 'chats' | 'tasks' | 'overview'
const views: View[] = ['chats', 'tasks', 'overview']

function AdminScene({ language, view }: { language: 'no' | 'en'; view: View }) {
  const no = language === 'no'
  const labels = businessAdminI18n[language].sidebar
  const groups = [
    { title: no ? 'Arbeidsområde' : 'Workspace', items: [{ id: 'overview', label: labels.overview, icon: FiGrid }, { id: 'chats', label: labels.chats, icon: FiMessageSquare }, { id: 'tasks', label: labels.tasks, icon: FiCheckSquare }, { id: 'feedback', label: labels.feedback, icon: FiStar }] },
    { title: no ? 'Bygg og design' : 'Build and design', items: [{ id: 'websites', label: no ? 'Nettsidebygging' : 'Website builder', icon: FiLayout }, { id: 'widgets', label: 'Widget studio', icon: FiSliders }] },
    { title: labels.administrative, items: [{ id: 'analytics', label: labels.analytics, icon: FiBarChart2 }, { id: 'users', label: labels.userManagement, icon: FiUsers }, { id: 'settings', label: labels.settings, icon: FiSettings }, { id: 'subscriptions', label: no ? 'Abonnementer' : 'Subscriptions', icon: FiCreditCard }] },
  ]
  return <div className="exampleAdmin" data-admin-view={view}>
    <aside className="exampleAdminSidebar">
      <div className="exampleAdminBrand"><img src="/image/logo.png" width="25" height="25" alt=""/><strong>vintra<small>NORDIC</small></strong></div>
      <div className="exampleAdminBusiness"><span>F</span><div><strong>Fjord Studio</strong><small>{no ? 'Din bedrift' : 'Your business'}</small></div></div>
      <div className="exampleAdminNavHome"><FiArrowLeft/><span>{no ? 'Gå til hovedsiden' : 'Go to homepage'}</span></div>
      {groups.map(group => <div className="exampleAdminNavGroup" key={group.title}><small>{group.title}</small>{group.items.map(item => <div className="exampleAdminNavItem" data-current={view === item.id} key={item.id}><item.icon/><span>{item.label}</span></div>)}</div>)}
      <div className="exampleAdminProfile"><span>FS</span><div><strong>Fjord Studio</strong><small>{no ? 'Min konto' : 'My account'}</small></div></div>
    </aside>
    <div className="exampleAdminContent"><header><span>{no ? 'Arbeidsområdet ditt' : 'Your workspace'} / {labels[view]}</span><span className="exampleAdminUser">FS</span></header>
      <div className="adminSceneContent" key={view}>
        <h3>{view === 'chats' ? labels.chats : view === 'tasks' ? labels.tasks : (no ? 'Hei, Fjord Studio.' : 'Hello, Fjord Studio.')}</h3>
        {view === 'chats' ? <>
          <p className="adminSceneIntro">{no ? 'Hele kundesamtalen, klar for teamet ditt.' : 'The whole conversation, ready for your team.'}</p>
          <div className="adminConversation"><div className="adminConversationTop"><strong>{no ? 'Hjelp med et lite kontor' : 'Help with a small office'}</strong><span>{no ? 'Til oppfølging' : 'Follow-up'}</span></div><div className="adminConversationMessage adminConversationMessageUser">{no ? 'Kan dere hjelpe oss med å innrede et lite kontor?' : 'Can you help us design a small office?'}</div><div className="adminConversationMessage adminReplyHost"><VintraHost expression="explaining"/>{no ? 'Ja! Vi hjelper med planløsning og interiør. Vil du at teamet følger opp?' : 'Yes! We help with layouts and interiors. Would you like the team to follow up?'}</div><div className="adminConversationMessage adminConversationMessageUser">{no ? 'Ja takk, kan noen kontakte meg?' : 'Yes please, can someone contact me?'}</div><div className="adminConversationSummary"><FiMessageSquare/>{no ? 'Sammenhengen følger med videre.' : 'The context stays with the conversation.'}</div></div>
        </> : view === 'tasks' ? <>
          <p className="adminSceneIntro">{no ? 'Gjør henvendelser til tydelige neste steg.' : 'Turn enquiries into clear next steps.'}</p>
          <div className="adminTaskFilters"><span>{no ? 'Alle oppgaver' : 'All tasks'}</span><span>{no ? 'Åpne' : 'Open'} · 2</span></div>
          <div className="adminTaskCard"><span className="adminTaskState">{no ? 'ÅPEN' : 'OPEN'}</span><h4>{no ? 'Kontakt kunden om kontorprosjektet' : 'Contact the customer about the office project'}</h4><p>{no ? 'Avklar behov, størrelse og ønsket tidspunkt. Kundedialogen ligger ved.' : 'Clarify the needs, size and timing. The customer conversation is attached.'}</p><div><span><FiMessageSquare/>{no ? 'Fra kundesamtale' : 'From conversation'}</span><span>FS</span></div></div>
          <div className="adminTaskCard adminTaskCardSecondary"><span className="adminTaskState">{no ? 'PÅGÅR' : 'IN PROGRESS'}</span><h4>{no ? 'Forbered første møte' : 'Prepare the first meeting'}</h4></div>
        </> : <>
          <p className="adminSceneIntro">{no ? 'Se hva som skjer. Finn det som trenger deg.' : 'See what is happening. Find what needs you.'}</p>
          <div className="exampleAdminMetrics"><div><small>{labels.chats}</small><strong>3</strong></div><div><small>{labels.tasks}</small><strong>2</strong></div><div><small>{no ? 'Til oppfølging' : 'Follow-up'}</small><strong>1<span className="storyStatus"/></strong></div></div>
          <div className="adminOverviewActivity"><strong>{no ? 'Siste aktivitet' : 'Recent activity'}</strong><div><FiMessageSquare/><p>{no ? 'Ny samtale om kontorinnredning' : 'New conversation about office design'}<small>{no ? 'Klar for oppfølging' : 'Ready for follow-up'}</small></p></div><div><FiCheckSquare/><p>{no ? 'Kontakt kunden om prosjektet' : 'Contact the customer about the project'}<small>{no ? 'Oppgave opprettet' : 'Task created'}</small></p></div></div>
        </>}
      </div>
    </div>
  </div>
}

export default function StoryAdminPreview({ language, playing = false, staticViews = false }: { language: 'no' | 'en'; playing?: boolean; staticViews?: boolean }) {
  const [phase, setPhase] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (!playing || paused || staticViews || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => { if (!document.hidden) setPhase(current => (current + 1) % views.length) }, 6500)
    return () => window.clearInterval(timer)
  }, [playing, staticViews, paused, phase])
  if (staticViews) return <div className="adminStaticScenes">{views.map(view => <AdminScene key={view} language={language} view={view}/>)}</div>
  const labels = businessAdminI18n[language].sidebar
  const no = language === 'no'
  const select = (index: number) => { setPhase(index); setPaused(true) }
  return <div className="adminPresentation">
    <nav className="adminPresentationSteps" aria-label={no ? 'Visninger i adminpanelet' : 'Admin presentation views'}>{views.map((view,i) => <button type="button" aria-current={i === phase ? 'step' : undefined} data-current={i === phase} key={view} onClick={() => select(i)}><span>{i + 1}</span>{labels[view]}<i key={String(phase) + String(paused)} data-playing={playing && !paused}/></button>)}</nav>
    <div className="adminPresentationControls"><span aria-live="polite">{phase + 1} / {views.length} &middot; {phase < views.length - 1 ? (no ? 'Neste: ' : 'Next: ') + labels[views[phase + 1]] : (no ? 'Tilbake til samtalene' : 'Back to conversations')}</span><div><button type="button" aria-label={no ? 'Forrige visning' : 'Previous view'} onClick={() => select((phase + views.length - 1) % views.length)}><FiChevronLeft aria-hidden="true"/></button><button type="button" onClick={() => setPaused(value => !value)}>{paused ? (no ? 'Spill av' : 'Play') : (no ? 'Pause' : 'Pause')}</button><button type="button" aria-label={no ? 'Neste visning' : 'Next view'} onClick={() => select((phase + 1) % views.length)}><FiChevronRight aria-hidden="true"/></button></div></div>
    <AdminScene language={language} view={views[phase]}/>
  </div>
}
