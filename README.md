# Ledningspuls

**Digital mognadsmätning för ledningsgrupper** -- utvecklad av [Curago](https://curago.se).

Ledningspuls hjälper ledningsgrupper att på 5 minuter skatta sin digitala styrförmåga. Verktyget innehåller 10 påståenden som ger en omedelbar mognadsprofil med spindeldiagram, AI-analys och PDF-rapport.

## Funktioner

- **10 självskattningsfrågor** -- täcker strategi, prioritering, uppföljning och genomförandeförmåga
- **Mognadsprofil** -- poäng mappas till fem nivåer (Startläge -> Ledande)
- **Spindeldiagram (SVG)** -- visuell profil över fyra dimensioner
- **AI-analys** -- automatisk analys via Claude API (Anthropic)
- **PDF-rapport** -- ladda ner resultat med diagram, logotyp och QR-kod
- **Responsiv design** -- fungerar på desktop och mobil

## Tech stack

- **Next.js 14** (App Router)
- **React 18**
- **Recharts** -- diagram
- **jsPDF** -- PDF-generering
- **qrcode.react** -- QR-koder
- **Anthropic Claude API** -- AI-driven analys

## Kom igång

```bash
# Installera beroenden
npm install

# Skapa .env.local med din API-nyckel (valfritt -- fallback-analys används annars)
echo "ANTHROPIC_API_KEY=din-nyckel" > .env.local

# Starta utvecklingsservern
npm run dev
```

Appen körs på [http://localhost:3000](http://localhost:3000).

## Bygge för produktion

```bash
npm run build
npm start
```

## Projektstruktur

```
app/
  page.js              # Startsida
  layout.js            # Root layout med metadata
  ledningskollen.js    # Huvudkomponent (frågor, diagram, resultat)
  api/analyze/route.js # API-route för AI-analys
  globals.css          # Globala stilar
```

## Licens

Proprietär -- Curago AB.
