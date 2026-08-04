import type { Metadata } from 'next'
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { CartProvider } from '@/providers/CartProvider'
import { SiteFx } from '@/components/fx/SiteFx'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bracumongoltori.com'),
  title: {
    default: 'BRACU Mongol-Tori | Mars Rover Team',
    template: '%s | BRACU Mongol-Tori',
  },
  description:
    'BRACU Mongol-Tori is BRAC University\'s competitive Mars rover team, participating in URC, IRC, and ERC competitions.',
  keywords: ['BRACU', 'Mongol-Tori', 'Mars Rover', 'BRAC University', 'URC', 'IRC', 'ERC'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'BRACU Mongol-Tori',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {/* Wraps everything because the cart badge lives in the shared
              Navbar, so any page can render it. State is localStorage-backed
              and hydrates client-side — no data fetching happens here. */}
          <CartProvider>
            <SiteFx />
            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
