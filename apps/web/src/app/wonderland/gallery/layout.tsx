// apps/web/src/app/wonderland/gallery/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pet Grooming Gallery | Through the Looking Glass Groomery',
  description: 'See before and after pet grooming transformations at Through the Looking Glass Groomery in Nuevo, CA. Creative color, Asian Fusion styles, teddy bear cuts, and more.',
  keywords: ['pet grooming photos', 'dog grooming before after', 'creative pet grooming gallery', 'Asian Fusion dog cuts'],
}

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
