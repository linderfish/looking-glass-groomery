// apps/web/src/app/wonderland/contact/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book Pet Grooming | Through the Looking Glass Groomery',
  description: 'Book your pet grooming appointment in Nuevo, CA. Online booking available. Full groom from $45. Instagram DM, email, or text. Serving Nuevo, Perris, Sun City, Menifee.',
  keywords: ['book pet grooming Nuevo CA', 'dog grooming appointment', 'pet groomer booking', 'schedule dog grooming'],
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
