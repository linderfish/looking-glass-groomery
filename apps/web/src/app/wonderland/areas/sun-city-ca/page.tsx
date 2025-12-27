// apps/web/src/app/wonderland/areas/sun-city-ca/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Pet Grooming Near Sun City, CA | Through the Looking Glass Groomery',
  description: 'Professional dog and cat grooming near Sun City, CA. Full groom from $45. Creative color, Asian Fusion styles, force-free handling. Just 15 minutes from Sun City!',
  keywords: ['pet grooming Sun City CA', 'dog grooming Sun City', 'cat grooming Sun City CA', 'pet groomer near Sun City'],
}

const localSchema = {
  "@context": "https://schema.org",
  "@type": "PetGroomingService",
  "name": "Through the Looking Glass Groomery - Serving Sun City",
  "description": "Professional pet grooming serving Sun City, CA. Located in nearby Nuevo, just 15 minutes away. Full groom services start at $45.",
  "url": "https://throughthelookingglass.pet/wonderland/areas/sun-city-ca",
  "areaServed": {
    "@type": "City",
    "name": "Sun City",
    "containedInPlace": { "@type": "State", "name": "California" }
  },
  "priceRange": "$$"
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Where is the best dog groomer near Sun City, CA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Through the Looking Glass Groomery is located in Nuevo, CA, just 15 minutes from Sun City. We offer professional grooming for dogs, cats, and exotic pets with prices starting at $45 for a full groom."
      }
    },
    {
      "@type": "Question",
      "name": "How much does dog grooming cost near Sun City, CA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dog grooming near Sun City at Through the Looking Glass Groomery costs $45-$85 for a full groom. Small dogs start at $45, medium at $55, large at $65, and extra large at $75-$85+."
      }
    },
    {
      "@type": "Question",
      "name": "Do you groom senior dogs near Sun City?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Through the Looking Glass Groomery specializes in gentle handling for senior dogs. Our groomer Kimmie uses force-free techniques and takes extra care with older pets who may have mobility issues or anxiety."
      }
    }
  ]
}

export default function SunCityCAPage() {
  return (
    <>
      <Script id="sun-city-local-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(localSchema)}
      </Script>
      <Script id="sun-city-faq-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(faqSchema)}
      </Script>

      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Answer Capsule */}
          <h1 className="font-display text-4xl md:text-5xl text-center mb-6">
            <span className="text-gradient">Pet Grooming Near</span>{' '}
            <span className="text-psychedelic">Sun City, CA</span>
          </h1>

          <p className="text-center text-white text-xl mb-8 max-w-2xl mx-auto drop-shadow-lg">
            Through the Looking Glass Groomery serves Sun City, CA from our Nuevo location,
            just 15 minutes away. Full groom services start at $45 for small dogs.
            Specializing in creative color, Asian Fusion styles, and senior pet care.
          </p>

          <div className="flex justify-center gap-4 mb-12">
            <Link href="/wonderland/contact" className="btn-wonderland">
              Book Now ✨
            </Link>
            <Link
              href="/wonderland/services"
              className="px-6 py-3 rounded-full font-display border-2 border-white text-white hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>

          {/* Distance Info */}
          <div className="card-wonderland p-6 mb-8 text-center">
            <p className="text-alice-gold text-lg font-display">
              📍 Just 15 minutes from Sun City
            </p>
            <p className="text-wonderland-muted">
              Located in Nuevo, CA - easy access via Menifee Road or I-215
            </p>
          </div>

          {/* Services Section */}
          <section className="card-wonderland p-8 mb-8">
            <h2 className="font-display text-2xl text-wonderland-text mb-4">
              Grooming Services for Sun City Pets
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-wonderland-muted">
              <div>
                <h3 className="text-alice-gold font-semibold mb-2">Full Groom</h3>
                <p className="text-sm mb-2">Bath, haircut, nails, ears, sanitary trim</p>
                <p className="text-white">$45 - $85+ (by size)</p>
              </div>
              <div>
                <h3 className="text-alice-gold font-semibold mb-2">Bath & Tidy</h3>
                <p className="text-sm mb-2">Bath, light trim, nails, ears</p>
                <p className="text-white">$25 - $60 (by size)</p>
              </div>
              <div>
                <h3 className="text-alice-gold font-semibold mb-2">Senior Pet Care</h3>
                <p className="text-sm mb-2">Gentle handling, extra patience</p>
                <p className="text-white">No extra charge</p>
              </div>
              <div>
                <h3 className="text-alice-gold font-semibold mb-2">Creative Color</h3>
                <p className="text-sm mb-2">Pet-safe OPAWZ color</p>
                <p className="text-white">From $30</p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="card-wonderland p-8 mb-8">
            <h2 className="font-display text-2xl text-wonderland-text mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-alice-gold font-semibold mb-2">
                  Where is the best dog groomer near Sun City, CA?
                </h3>
                <p className="text-wonderland-muted">
                  Through the Looking Glass Groomery is located in Nuevo, CA, just 15 minutes
                  from Sun City. We offer professional grooming for dogs, cats, and exotic pets
                  with prices starting at $45 for a full groom.
                </p>
              </div>

              <div>
                <h3 className="text-alice-gold font-semibold mb-2">
                  How much does dog grooming cost near Sun City?
                </h3>
                <p className="text-wonderland-muted">
                  Dog grooming near Sun City at Through the Looking Glass Groomery costs $45-$85
                  for a full groom depending on size. Small dogs start at $45, medium at $55,
                  large at $65, and extra large at $75-$85+.
                </p>
              </div>

              <div>
                <h3 className="text-alice-gold font-semibold mb-2">
                  Do you groom senior dogs near Sun City?
                </h3>
                <p className="text-wonderland-muted">
                  Yes! We specialize in gentle handling for senior dogs. Our groomer Kimmie
                  uses force-free techniques and takes extra care with older pets who may
                  have mobility issues or anxiety. No extra charge for senior pet care.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <h2 className="font-display text-2xl text-wonderland-text mb-4">
              Sun City Pet Owners Welcome!
            </h2>
            <p className="text-wonderland-muted mb-6">
              Book your grooming appointment - we&apos;re just a short drive from Sun City
            </p>
            <Link href="/wonderland/contact" className="btn-wonderland">
              Book Your Appointment ✨
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
