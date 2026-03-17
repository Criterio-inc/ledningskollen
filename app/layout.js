import './globals.css'

export const metadata = {
  title: 'Ledningspuls | Curago',
  description: 'På 5 minuter får ni en bild av er digitala styrförmåga. 10 påståenden, omedelbart resultat med er mognadsprofil.',
  openGraph: {
    title: 'Ledningspuls | Curago',
    description: 'Gratis självskattning av er digitala styrförmåga. 10 frågor, 5 minuter, omedelbart resultat.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}
