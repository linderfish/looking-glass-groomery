// apps/web/src/app/layout.tsx
import type { Metadata } from 'next'
import { Playfair_Display, Inter, Pacifico } from 'next/font/google'
import '@/styles/globals.css'
// BackgroundPreloader removed - we now use pre-generated static backgrounds
// to avoid fal.ai API calls on every visitor (see /public/backgrounds/)
import { LocalBusinessSchema } from '@/components/schema'
import { GoogleAnalytics, GoogleSiteVerification } from '@/components/analytics'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-whimsy',
})

export const metadata: Metadata = {
  title: 'Through the Looking Glass Groomery | Pet Grooming in Nuevo, CA',
  description: 'Step through the looking glass into a wonderland of pet transformations. Creative grooming, color magic, and personalized care for your furry friends in Riverside County.',
  keywords: ['pet grooming', 'Nuevo CA', 'creative grooming', 'dog grooming', 'cat grooming', 'pet spa', 'Riverside County'],
  openGraph: {
    title: 'Through the Looking Glass Groomery',
    description: 'Where pet grooming meets wonderland magic',
    type: 'website',
    locale: 'en_US',
    siteName: 'Through the Looking Glass Groomery',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Through the Looking Glass Groomery',
    description: 'Where pet grooming meets wonderland magic',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${pacifico.variable}`}>
      <head>
        <GoogleSiteVerification />
      </head>
      <body className="min-h-screen bg-wonderland-bg">
        {/* Structured data for SEO and AI search visibility */}
        <LocalBusinessSchema />
        {/* Google Analytics 4 */}
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}
