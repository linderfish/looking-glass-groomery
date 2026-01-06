// apps/web/src/app/wonderland/areas/nuevo-ca/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Pet Grooming in Nuevo, CA | Through the Looking Glass Groomery',
  description: 'Professional dog and cat grooming in Nuevo, CA. Full groom from $45. Creative color, Asian Fusion styles, force-free handling. Book your appointment today!',
  keywords: ['pet grooming Nuevo CA', 'dog grooming Nuevo', 'cat grooming Nuevo CA', 'pet groomer near me'],
}

const localSchema = {
  "@context": "https://schema.org",
  "@type": "PetGroomingService",
  "name": "Through the Looking Glass Groomery - Nuevo",
  "description": "Professional pet grooming in Nuevo, CA. Full groom services start at $45 for small dogs. Specializing in creative grooming, Asian Fusion styles, and anxious pet handling.",
  "url": "https://www.lookingglassgroomery.com/wonderland/areas/nuevo-ca",
  "areaServed": {
    "@type": "City",
    "name": "Nuevo",
    "containedInPlace": { "@type": "State", "name": "California" }
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Nuevo",
    "addressRegion": "CA",
    "postalCode": "92567",
    "addressCountry": "US"
  },
  "priceRange": "$$"
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does dog grooming cost in Nuevo, CA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dog grooming in Nuevo, CA at Through the Looking Glass Groomery costs $45-$85 for a full groom. Small dogs start at $45, medium at $55, large at $65, and extra large at $75-$85+. Bath and tidy services start at $25."
      }
    },
    {
      "@type": "Question",
      "name": "Where is the best pet groomer in Nuevo, CA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Through the Looking Glass Groomery is located in Nuevo, CA and offers professional grooming for dogs, cats, and exotic pets. We specialize in creative grooming, Asian Fusion styles, and force-free handling for anxious pets."
      }
    },
    {
      "@type": "Question",
      "name": "Do you groom cats in Nuevo, CA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Through the Looking Glass Groomery in Nuevo, CA grooms cats, dogs, goats, pigs, and guinea pigs. We offer gentle handling techniques for all pets."
      }
    }
  ]
}

export default function NuevoCAPage() {
  return (
    <>
      <Script id="nuevo-local-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(localSchema)}
      </Script>
      <Script id="nuevo-faq-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(faqSchema)}
      </Script>

      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Answer Capsule - First 40-60 words for AI extraction */}
          <h1 className="font-display text-4xl md:text-5xl text-center mb-6">
            <span className="text-gradient">Pet Grooming in</span>{' '}
            <span className="text-psychedelic">Nuevo, CA</span>
          </h1>

          <p className="text-center text-white text-xl mb-8 max-w-2xl mx-auto drop-shadow-lg">
            Through the Looking Glass Groomery offers professional pet grooming in Nuevo, CA.
            Full groom services start at $45 for small dogs. We specialize in creative color,
            Asian Fusion styles, and gentle handling for anxious pets.
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

          {/* Services Section */}
          <section className="card-wonderland p-8 mb-8">
            <h2 className="font-display text-2xl text-wonderland-text mb-4">
              Grooming Services in Nuevo
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
                <h3 className="text-alice-gold font-semibold mb-2">Creative Color</h3>
                <p className="text-sm mb-2">Pet-safe OPAWZ color</p>
                <p className="text-white">From $30</p>
              </div>
              <div>
                <h3 className="text-alice-gold font-semibold mb-2">Asian Fusion</h3>
                <p className="text-sm mb-2">Teddy Bear, Korean Round Face, Lamb cuts</p>
                <p className="text-white">Price varies</p>
              </div>
            </div>
          </section>

          {/* FAQ Section - Q&A format for AI */}
          <section className="card-wonderland p-8 mb-8">
            <h2 className="font-display text-2xl text-wonderland-text mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-alice-gold font-semibold mb-2">
                  How much does dog grooming cost in Nuevo, CA?
                </h3>
                <p className="text-wonderland-muted">
                  Dog grooming in Nuevo, CA at Through the Looking Glass Groomery costs $45-$85
                  for a full groom depending on size. Small dogs (under 25 lbs) start at $45,
                  medium dogs at $55, large dogs at $65, and extra large dogs at $75-$85+.
                  Bath and tidy services start at $25.
                </p>
              </div>

              <div>
                <h3 className="text-alice-gold font-semibold mb-2">
                  Do you handle anxious dogs in Nuevo?
                </h3>
                <p className="text-wonderland-muted">
                  Yes! Through the Looking Glass Groomery specializes in anxious, nervous, and
                  fearful pets. Our groomer Kimmie is force-free certified and uses gentle,
                  patient techniques. We also work with senior dogs, puppies, and pets with
                  special needs.
                </p>
              </div>

              <div>
                <h3 className="text-alice-gold font-semibold mb-2">
                  What pets do you groom in Nuevo, CA?
                </h3>
                <p className="text-wonderland-muted">
                  We groom dogs, cats, goats, pigs, and guinea pigs at our Nuevo, CA location.
                  Each species receives specialized care appropriate for their coat and temperament.
                </p>
              </div>
            </div>
          </section>

          {/* Location Info */}
          <section className="card-wonderland p-8 mb-8">
            <h2 className="font-display text-2xl text-wonderland-text mb-4">
              Visit Us in Nuevo
            </h2>
            <div className="text-wonderland-muted space-y-2">
              <p>📍 Located in Nuevo, CA (Riverside County)</p>
              <p>🕐 Open Monday - Saturday, 9 AM - 5 PM</p>
              <p>📱 Book via website, Instagram DM, or text</p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <h2 className="font-display text-2xl text-wonderland-text mb-4">
              Ready to Book?
            </h2>
            <p className="text-wonderland-muted mb-6">
              Transform your pet at Through the Looking Glass Groomery in Nuevo, CA
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
