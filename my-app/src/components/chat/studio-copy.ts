'use client'
import { useVintraLanguage } from '@/lib/i18n'
import { useCallback } from 'react'

const norwegian: Record<string, string> = {
  'Label': 'Knappetekst', 'Message sent': 'Melding som sendes', 'Description': 'Beskrivelse',
  'Optional': 'Valgfritt', 'Options': 'Valg', 'Add option': 'Legg til valg', 'Remove': 'Fjern',
  'Edit card icon': 'Endre kortikon', 'Untitled card': 'Kort uten tittel', 'Add a short description': 'Legg til en kort beskrivelse',
  'Edit title': 'Endre tittel', 'Opening hours': 'Åpningstider', 'Edit description': 'Endre beskrivelse',
  'Help visitors choose the right topic.': 'Hjelp besøkende med å velge riktig tema.',
  'Card icon': 'Kortikon', 'Shown on the starter card unless the card is image-first.': 'Vises på startkortet når kortet ikke bruker bildevisning.',
  'Edit card image': 'Endre kortbilde', 'Add card image': 'Legg til kortbilde', 'Image URL': 'Bildelenke',
  'How can you help me?': 'Hva kan dere hjelpe meg med?', 'Example question': 'Eksempelspørsmål',
  'Help visitors choose the right topic quickly.': 'Hjelp besøkende med å finne riktig tema raskt.',
  'Replace this with a real next step.': 'Bytt ut dette med et relevant neste steg.', 'No description yet': 'Ingen beskrivelse ennå',
  'Chat bubble': 'Chatknapp', 'Avatar': 'Profilikon', 'Close': 'Lukk', 'Go back': 'Tilbake',
  'Hero': 'Velkomstikon', 'AI': 'AI-assistent', 'Support': 'Kundestøtte', 'User': 'Besøkende', 'Send': 'Send',
  'Floating launch button when orb mode is not active.': 'Ikonet på chatknappen når kulevisning ikke er valgt.',
  'Header avatar when no logo is uploaded.': 'Profilikon øverst i chatten når ingen logo er lastet opp.',
  'Close button in the chat header.': 'Lukkeknappen øverst i chatten.',
  'Back button inside starter-card option flows.': 'Tilbakeknappen når besøkende utforsker et startkort.',
  'Starter-card welcome icon and hero fallback.': 'Velkomstikon over startkortene.',
  'Assistant message and typing indicator icon.': 'Ikon ved AI-svar og når assistenten skriver.',
  'Human support message icon.': 'Ikon ved meldinger fra kundestøtte.',
  'Visitor message icon.': 'Ikon ved meldinger fra besøkende.', 'Message composer send button.': 'Sendeknappen ved skrivefeltet.',
  'Available on Pro and Enterprise plans.': 'Tilgjengelig med Pro og Enterprise.',
  'Available on Pro and Enterprise plans': 'Tilgjengelig med Pro og Enterprise',
  'Orb mode uses the orb visual instead of the launcher icon.': 'Kulevisning bruker den animerte kulen som chatknapp.',
  'Orb behavior': 'Kulens oppførsel', 'Set one hover letter, up to three reply letters, and up to five idle letters.': 'Velg én bokstav ved peker, opptil tre under svar og opptil fem ved inaktivitet.',
  'Show hover symbol': 'Vis symbol ved peker', 'Hover letter': 'Bokstav ved peker', 'Show reply symbol': 'Vis symbol under svar',
  'Reply letters': 'Bokstaver under svar', 'Show inactive symbol': 'Vis symbol ved inaktivitet', 'Inactive letters': 'Bokstaver ved inaktivitet',
  'Inactive min (min)': 'Minste ventetid (min)', 'Inactive max (min)': 'Største ventetid (min)', 'Launcher mode': 'Type chatknapp',
  'Drag inside the circle to reposition': 'Dra inni sirkelen for å flytte bildet', 'Drop a PNG logo here': 'Slipp en PNG-logo her',
  'or click to choose a file': 'eller klikk for å velge en fil', 'Horizontal position': 'Vannrett plassering', 'Vertical position': 'Loddrett plassering',
  'Remove logo': 'Fjern logo', 'Reset crop': 'Nullstill utsnitt', 'PNG only. Drop a file, then drag within the circle or adjust the sliders.': 'Kun PNG. Slipp en fil, og juster utsnittet i sirkelen eller med skyveknappene.',
  'Choose an icon': 'Velg et ikon', 'Empty': 'Ikke valgt', 'Search icons...': 'Søk etter ikoner...', 'None': 'Ingen',
  'Robot outline': 'Robot med omriss', 'Agent': 'Kundebehandler', 'Robot': 'Robot', 'Chat': 'Chat',
  'Color chat': 'Farget chat', 'Color spark': 'Farget gnist', 'Color shield': 'Farget skjold', 'Color globe': 'Farget globus',
  'Message circle': 'Rund snakkeboble', 'Message square': 'Firkantet snakkeboble', 'Business person': 'Forretningsperson',
  'Graduate': 'Student', 'Doctor': 'Lege', 'Nurse': 'Sykepleier', 'Astronaut': 'Astronaut', 'Operator': 'Operatør',
  'Security person': 'Sikkerhetsvakt', 'Worker': 'Arbeider', 'Developer': 'Utvikler', 'User plus': 'Legg til person',
  'User check': 'Bekreftet person', 'Approved person': 'Godkjent person', 'Briefcase': 'Koffert', 'Globe': 'Globus',
  'Search': 'Søk', 'Shield': 'Skjold', 'Zap': 'Lyn', 'Layers': 'Lag', 'Clock': 'Klokke', 'Map pin': 'Kartnål',
  'Target': 'Mål', 'Upload': 'Last opp', 'Phone': 'Telefon', 'Check circle': 'Hake i sirkel',
  'Arrow left': 'Pil mot venstre', 'Arrow right': 'Pil mot høyre', 'Help': 'Hjelp',
}
export function useStudioCopy() {
  const { language } = useVintraLanguage()
  return useCallback((text: string) => language === 'no' ? norwegian[text] || text : text === 'Message sent' ? 'Message to send' : text, [language])
}
