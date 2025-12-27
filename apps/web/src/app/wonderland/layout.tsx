// apps/web/src/app/wonderland/layout.tsx
import { Metadata } from 'next'
import { WonderlandNav } from '@/components/layout/WonderlandNav'
import { CheshireChat } from '@/components/layout/CheshireChat'
import { Footer } from '@/components/layout/Footer'
import { DynamicBackground } from '@/components/effects/DynamicBackground'

export const metadata: Metadata = {
  title: {
    default: 'Through the Looking Glass Groomery | Pet Grooming Nuevo CA',
    template: '%s | Through the Looking Glass Groomery',
  },
  description: 'Professional pet grooming in Nuevo, CA. Full groom from $45. Creative color, Asian Fusion styles, force-free handling. Serving Nuevo, Perris, Sun City, Menifee.',
  openGraph: {
    title: 'Through the Looking Glass Groomery',
    description: 'Professional pet grooming in Nuevo, CA. Full groom from $45.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Through the Looking Glass Groomery',
  },
}

export default function WonderlandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      {/* AI-generated immersive background - changes per route */}
      <DynamicBackground />

      {/* Navigation */}
      <WonderlandNav />

      {/* Main content */}
      <main className="relative z-10 pt-20">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Cheshire Chat Widget */}
      <CheshireChat />
    </div>
  )
}
