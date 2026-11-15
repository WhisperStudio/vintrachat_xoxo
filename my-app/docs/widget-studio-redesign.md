# Widget Studio: moduloversikt og verifisering

Studioet bruker de eksisterende konfigurasjonene, API-ene og lagringsfunksjonene. Konfigurasjon åpnes nå fra en moduloversikt. Hver modul har en egen hvit side med forklaring, tydelige påkrevde felt, lagring og autofyll der nettsideimport er relevant.

## Fokuserte sider og trygg fjerning

Hver modul har et eget faglig ikon med farge. Moduler og designområder åpnes som separate, hvite sidevisninger med tilbakeknapp, uten administrasjonsmeny rundt. URL-en viser valgt side og widget, og nettleserens tilbake/frem fungerer mens utkastet beholdes.

Valgfrie moduler kan fjernes direkte fra listen eller fra modulens side. Fjerning, sletting og nullstilling bruker samme sikkerhetsknapp: første klikk viser varseltekst og starter fem sekunders nedtelling, deretter må brukeren bekrefte med et nytt klikk. Ingenting slettes automatisk. Sletting av hele widgeten krever også avkryssing for permanent sletting. Bekreftelsen nullstilles ved bytte av element.

## Obligatoriske deler

- Min bedrift: bedriftsnavn, bransje og beskrivelse eller produkter/tjenester.
- Chat og språk: automatiske svar og standardspråk.
- Svarstil og regler: personlighet, kommunikasjon, instruksjoner og grenser.

Nye widgets og nye bedriftskontoer starter med disse tre delene. Tillegg legges til med pluss under riktig hovedkategori. Eksisterende widgets beholder aktive funksjoner og eksisterende innhold.

## Valgfrie moduler

| Kategori | Moduler |
| --- | --- |
| Bedriften | Priser og prøveperioder; Kundevilkår; Avdelinger og lokasjoner; Kunnskapsdokumenter |
| Funksjoner | Ekstra språk; Starthilsen; Spørsmålsforslag; Hjelpekort; Menneskelig support; Deling av kontaktinfo; Anmeldelser; Booking og bestilling; Flere handlinger |

Å legge til en funksjon aktiverer den ikke i kundechatten før modulen er konfigurert og lagret. Avbryt forkaster redigeringen på siden; den tillagte, uferdige modulen blir stående med rødt varsel. Valgfrie moduler kan fjernes etter bekreftelse. Fjerning av kunnskapsmoduler fjerner innholdet i disse fra utkastet.

## Status og designgjennomgang

- Rødt: påkrevde felt mangler, eller en tillagt modul er ikke konfigurert.
- Gult: kan brukes, men valgfrie felt mangler eller standardvalg bør ses over.
- Grønt: nødvendig innhold og de kontrollerte valgfrie feltene er på plass.

Status vises både med ikon og tekst. Tomme valgfrie felter blokkerer ikke lagring. En modul kan lagres separat mens andre obligatoriske deler fortsatt mangler innhold; hele førstegangsoppsettet kan først fullføres når de obligatoriske feltene er klare.

Nye moduler med synlige komponenter gir gult varsel i Design. Å åpne riktig designområde markerer det som gjennomgått. Modulvalg, konfigurerte deler og gjennomgåtte designområder lagres under assistentens studio-metadata, og overlever lagring og gjeninnlasting. Designgjennomgang som bare er gjort lokalt følger vanlig lagringsstatus for ulagrede endringer.

## Autofyll

Autofyll bruker eksisterende nettsideskanning, men endrer bare feltene i den åpne modulen, samt kildelenkene. Brukeren får se forslaget og velger selv om det skal brukes. Funksjonsvalg og svarstil styres ikke av nettsideimporten. Egne dokumenter lastes opp av brukeren.

## Verifisering

- TypeScript-kontroll bestått.
- Tester dekker nye widgets og kontoer, migrering av eksisterende oppsett, rødt/gult/grønt, modulvis lagring, avgrenset autofyll, fjerning og gjenoppretting av moduler, varsel om designgjennomgang og lagring av metadata.
- Sikkerhetsknappen testes for tidsgrense, obligatorisk avkryssing, ingen automatisk utføring, dobbeltklikk og feilrespons.
- Nettleser: separate hvite modul-/designsider, tilbake/frem, bevart utkast, fem sekunders sperre, avbryt og fjerning fra listen er kontrollert i Edge på desktop og mobil.
- Tidligere nettleserkontroll: Edge, desktop på 1440 px og mobil på 390 px. Kontrollert modulliste, plussmeny, validering, separate redigeringsvinduer, bevarte data, fokusretur, tastaturnavigasjon, Escape, mobilforhåndsvisning og designvarsler.
- Innlogget lagring mot ekte database er ikke testet i nettleseren. Lagringsflyten og servernormaliseringen testes med faktiske funksjoner og isolerte avhengigheter.

## Design med direkte forhåndsvisning

Designoversikten og hvert designområde viser chatten i en fast høyrekolonne på desktop. Valgt chatdel har vedvarende markering; peker og tastaturfokus i oversikten markerer tilsvarende del. Kontakt, anmeldelser og support bytter til relevant forhåndsvisningsside. På mindre skjermer åpnes forhåndsvisningen med «Vis chatten». Nettlesertest dekker plassering, hover, vedvarende markering og mobilvisning.
