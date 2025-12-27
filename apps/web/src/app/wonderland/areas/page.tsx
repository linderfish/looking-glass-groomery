// apps/web/src/app/wonderland/areas/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Service Areas | Through the Looking Glass Groomery',
  description: 'Professional pet grooming serving Nuevo, Perris, Sun City, Menifee, and Riverside County, CA. Full groom from $45. Book your appointment today.',
}

const serviceAreas = [
  {
    city: 'Nuevo',
    slug: 'nuevo-ca',
    description: 'Our home base! Full grooming services in Nuevo, CA.',
    distance: 'Home location',
  },
  {
    city: 'Perris',
    slug: 'perris-ca',
    description: 'Serving pet owners in Perris with creative grooming.',
    distance: '10 minutes away',
  },
  {
    city: 'Sun City',
    slug: 'sun-city-ca',
    description: 'Professional grooming for Sun City pets.',
    distance: '15 minutes away',
  },
  {
    city: 'Menifee',
    slug: 'menifee-ca',
    description: 'Quality pet grooming for Menifee families.',
    distance: '20 minutes away',
  },
]

export default function ServiceAreasPage() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl text-center mb-6">
          <span className="text-gradient">Pet Grooming</span>{' '}
          <span className="text-psychedelic">Service Areas</span>
        </h1>

        <p className="text-center text-white text-xl mb-12 max-w-2xl mx-auto drop-shadow-lg">
          Through the Looking Glass Groomery serves Nuevo, Perris, Sun City, Menifee,
          and surrounding Riverside County areas. Full groom services start at $45.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {serviceAreas.map((area) => (
            <Link
              key={area.slug}
              href={`/wonderland/areas/${area.slug}`}
              className="card-wonderland p-6 hover:scale-105 transition-transform"
            >
              <h2 className="font-display text-2xl text-wonderland-text mb-2">
                {area.city}, CA
              </h2>
              <p className="text-wonderland-muted text-sm mb-3">
                {area.description}
              </p>
              <span className="text-alice-gold text-sm">
                📍 {area.distance}
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <p className="text-wonderland-muted mb-4">
            Don&apos;t see your city? We may still serve your area!
          </p>
          <Link href="/wonderland/contact" className="btn-wonderland">
            Contact Us to Check ✨
          </Link>
        </div>
      </div>
    </div>
  )
}
