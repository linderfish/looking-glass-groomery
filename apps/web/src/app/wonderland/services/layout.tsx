// apps/web/src/app/wonderland/services/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pet Grooming Services & Prices | Through the Looking Glass Groomery',
  description: 'Full groom from $45, bath & tidy from $25. Creative color, Asian Fusion styles, force-free handling. Dog, cat, and exotic pet grooming in Nuevo, CA.',
  keywords: ['pet grooming prices', 'dog grooming cost', 'cat grooming Nuevo CA', 'creative pet grooming', 'Asian Fusion dog grooming'],
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
