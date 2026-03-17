# CLAUDE.md

## Projektöversikt

Ledningspuls -- ett Next.js-verktyg för digital mognadsmätning riktat till ledningsgrupper. Utvecklat av Curago.

## Kommandon

- `npm run dev` -- starta utvecklingsserver (port 3000)
- `npm run build` -- bygg för produktion
- `npm start` -- kör produktionsbygge

## Arkitektur

- **Next.js 14 App Router** med JavaScript (ej TypeScript)
- Enskild huvudkomponent: `app/ledningskollen.js` ("use client")
- API-route: `app/api/analyze/route.js` -- anropar Anthropic Claude API, har fallback om API-nyckel saknas
- Inga tester konfigurerade
- Inga linters konfigurerade

## Kodkonventioner

- Språk i UI: **svenska**
- Kommentarer och variabelnamn: engelska eller svenska (blandat, följ befintlig stil)
- Komponenter: funktionella React-komponenter med hooks
- Stilar: inline styles och globals.css (ingen CSS-modul eller Tailwind)
- Commitmeddelanden: svenska

## Viktigt att veta

- `.env.local` innehåller `ANTHROPIC_API_KEY` -- commitas inte (finns i .gitignore)
- PDF-generering sker klientsidigt med jsPDF
- Spindeldiagrammet är ren SVG (ingen extern diagrambibliotek)
- Appen har fem mognadsnivåer och fyra dimensioner som konfigureras i `ledningskollen.js`
