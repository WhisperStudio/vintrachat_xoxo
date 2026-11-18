import Link from 'next/link'
import VintraHost from '@/svgs/VintraHost'

export default function DesignReference() {
  return <main className="page narrow">
    <section className="hero"><span className="badge">VINTRA / DESIGNREFERANSE</span><h1>Et felles uttrykk.</h1><p>Rolige flater, tydelige handlinger og en vennlig kundevert. Bruk temavelgeren i navigasjonen for å se begge palettene.</p></section>
    <div className="cardGrid"><section className="featureCard"><h2>Farger og flater</h2><div style={{display:'grid', gap:12}}>{[['bg','Bakgrunn'],['surface','Kort'],['elevated','Forhøyet flate'],['border','Ramme'],['text','Primærtekst'],['secondary','Sekundærtekst'],['muted','Dempet tekst'],['teal','Turkis aksent'],['blue','Blå aksent']].map(([token,label])=><div key={token} style={{display:'flex',alignItems:'center',gap:12}}><span style={{width:36,height:36,borderRadius:10,border:'1px solid var(--brand-border)',background:'var(--brand-'+token+')'}}/>{label}</div>)}</div></section>
    <section className="featureCard"><h2>Vintra, kundeverten din</h2><VintraHost className="designHost"/><p>Vennlig, rolig og hjelpsom. Samme figur og formspråk gjennom hele reisen.</p><div className="heroActions"><Link className="primaryBtn" href="/landings/auth/chatWidget">Lag en chatbot</Link><Link className="secondaryBtn" href="/priser">Se priser</Link></div></section></div>
    <section className="infoCard" style={{marginTop:20}}><h2>Knapper og rammer</h2><p>12 px hjørner på knapper, 20 px på kort og en tynn, sammenhengende ramme. Turkis viser hovedhandlingen; blått brukes til lenker og sekundære signaler.</p><div className="heroActions"><Link className="primaryBtn" href="/landings/main">Til forsiden</Link><Link className="secondaryBtn" href="/priser">Sammenlign planer</Link><button className="primaryBtn" disabled>Utilgjengelig</button></div></section>
  </main>
}
