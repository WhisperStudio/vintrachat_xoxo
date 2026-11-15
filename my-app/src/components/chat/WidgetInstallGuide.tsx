'use client'

import { useState } from 'react'
import { FiCode, FiCopy, FiDownload } from 'react-icons/fi'
import { siteConfig } from '@/lib/site-config'

const formats = ['HTML', 'JavaScript', 'TypeScript', 'React'] as const
type Format = typeof formats[number]

export default function WidgetInstallGuide({ widgetKey, no, busy, run, onCopied }: {
  widgetKey: string; no: boolean; busy: boolean
  run: (action: () => Promise<void>) => Promise<boolean>
  onCopied: () => void
}) {
  const [format, setFormat] = useState<Format>('HTML')
  const src = `https://chat.vintrastudio.com/widget/${encodeURIComponent(widgetKey)}.js`
  const loader = (typed: boolean) => `const script${typed ? ': HTMLScriptElement' : ''} = document.createElement('script');\nscript.src = '${src}';\nscript.async = true;\ndocument.body.appendChild(script);`
  const examples: Record<Format, string> = {
    HTML: `<script src="${src}" async></script>`,
    JavaScript: loader(false),
    TypeScript: loader(true),
    React: `'use client';\n\nimport { useEffect } from 'react';\n\nexport default function VintraChat() {\n  useEffect(() => {\n    ${loader(false).replaceAll('\n', '\n    ')}\n    return () => { script.remove(); };\n  }, []);\n\n  return null;\n}`,
  }
  const instructions: Record<Format, string> = no ? {
    HTML: 'Lim inn koden rett før </body> i HTML-filen, eller i nettsidebyggerens felt for egendefinert kode i bunnteksten. Legg den i en felles mal hvis chatten skal vises på alle sider.',
    JavaScript: 'Legg dette i JavaScript-filen som kjøres i nettleseren. Kjør koden etter at siden er lastet, slik at document.body finnes.',
    TypeScript: 'Legg dette i TypeScript-koden for nettsiden. Koden må kjøres i nettleseren etter at siden er lastet, ikke på serveren.',
    React: 'Lagre som VintraChat.jsx eller VintraChat.tsx og legg <VintraChat /> én gang i appens felles layout. I Next.js skal komponenten være en klientkomponent, som vist her.',
  } : {
    HTML: 'Paste this just before </body> in your HTML file, or in your website builder’s custom footer code field. Use a shared template to show the chat on every page.',
    JavaScript: 'Add this to the JavaScript file that runs in the browser. Run it after the page has loaded so document.body exists.',
    TypeScript: 'Add this to your website’s TypeScript code. Run it in the browser after the page has loaded, rather than on the server.',
    React: 'Save as VintraChat.jsx or VintraChat.tsx and render <VintraChat /> once in your shared app layout. In Next.js, use a client component as shown here.',
  }
  const code = examples[format]
  return <section className="widgetStudioCard widgetInstallGuide">
    <div className="widgetStudioCardHeading"><span className="widgetStudioIcon"><FiCode aria-hidden="true" /></span><div><h2>{no ? 'Legg assistenten på nettsiden' : 'Add your assistant to your website'}</h2><p>{no ? 'Velg eksemplet som passer nettsiden din. Du trenger bare én av variantene, og koden er klar for den valgte widgeten.' : 'Choose the example that suits your website. You only need one option, and the code is ready for your selected widget.'}</p></div></div>
    <ol className="widgetInstallSteps">
      <li><strong>{no ? 'Lagre assistenten' : 'Save your assistant'}</strong><p>{no ? 'Lagre innhold og design under Assistenten før du installerer.' : 'Save your content and design under Assistant before installing.'}</p></li>
      <li><strong>{no ? 'Tillat nettsiden' : 'Allow your website'}</strong><p>{no ? 'Åpne Synlighet og legg til domenet chatten skal vises på. Husk også testdomenet hvis du prøver på en forhåndsvisning.' : 'Open Visibility and add the domain where the chat should appear. Include your test domain if you are using a preview.'}</p></li>
      <li><strong>{no ? 'Legg inn koden og publiser' : 'Add the code and publish'}</strong><p>{no ? 'Bruk én av variantene under, publiser nettsiden og åpne den på nytt for å prøve chatten. Senere lagrede endringer vises uten at du må lime inn koden på nytt.' : 'Use one of the options below, publish your website and reload it to try the chat. Future saved changes appear without replacing the code.'}</p></li>
    </ol>
    <div className="widgetInstallFormats" role="group" aria-label={no ? 'Velg kodeeksempel' : 'Choose code example'}>{formats.map(item => <button type="button" key={item} aria-pressed={format === item} onClick={() => setFormat(item)}>{item}</button>)}</div>
    <p className="widgetInstallInstruction">{instructions[format]}</p>
    <pre className="widgetStudioCode" tabIndex={0} aria-label={`${format} ${no ? 'kodeeksempel' : 'code example'}`}><code>{code}</code></pre>
    <div className="widgetStudioActions"><button type="button" disabled={!widgetKey || busy} onClick={() => void run(async () => { await navigator.clipboard.writeText(code); onCopied() })}><FiCopy aria-hidden="true" />{no ? 'Kopier kode' : 'Copy code'}</button><button type="button" className="secondary" disabled={!widgetKey} onClick={() => {
      const extension = { HTML: 'html', JavaScript: 'js', TypeScript: 'ts', React: 'tsx' }[format]
      const url = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' }))
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `vintra-chat-widget.${extension}`; anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }}><FiDownload aria-hidden="true" />{no ? 'Last ned' : 'Download'}</button></div>
    <aside className="widgetInstallHelp"><h3>{no ? 'Trenger du hjelp med oppsettet?' : 'Need help getting set up?'}</h3><p>{no ? 'Bare kontakt oss, så hjelper vi deg med å få chatten på plass. Fortell gjerne hvilken nettside eller plattform du bruker.' : 'Just contact us and we’ll help you get the chat running. Let us know which website or platform you use.'}</p><a href={`mailto:${siteConfig.contact.email}`}>{no ? 'Kontakt oss' : 'Contact us'} · {siteConfig.contact.email}</a><p>{no ? 'Vises ikke chatten? Sjekk at riktig domene er tillatt under Synlighet, at koden er publisert, og at du ikke har installert flere varianter samtidig.' : 'Chat not showing? Check that your domain is allowed under Visibility, that the code is published, and that you have installed only one option.'}</p></aside>
  </section>
}
