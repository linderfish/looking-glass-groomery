// apps/web/src/app/wonderland/layout.tsx
import { WonderlandNav } from '@/components/layout/WonderlandNav'
import { CheshireChat } from '@/components/layout/CheshireChat'
import { Footer } from '@/components/layout/Footer'
import { BreathingBackground } from '@/components/effects/BreathingBackground'

export default function WonderlandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      {/* Animated background */}
      <BreathingBackground />

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
