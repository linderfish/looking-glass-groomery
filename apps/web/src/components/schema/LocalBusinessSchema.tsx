// apps/web/src/components/schema/LocalBusinessSchema.tsx
// JSON-LD structured data for local business SEO and AI search visibility
// Uses Next.js Script component for safe injection

import Script from 'next/script'

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "PetGroomingService",
  "@id": "https://www.lookingglassgroomery.com/#business",
  "name": "Through the Looking Glass Groomery",
  "alternateName": "Looking Glass Groomery",
  "description": "Professional pet grooming in Nuevo, CA. Full groom services start at $45 for small dogs. Specializing in creative grooming, Asian Fusion styles, pet-safe color, and anxious pet handling. Force-free certified groomer serving Nuevo, Perris, Sun City, and Riverside County.",
  "url": "https://www.lookingglassgroomery.com",
  "email": "kimmieserrati@gmail.com",
  "image": "https://www.lookingglassgroomery.com/og-image.jpg",
  "logo": "https://www.lookingglassgroomery.com/logo.png",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Nuevo",
    "addressLocality": "Nuevo",
    "addressRegion": "CA",
    "postalCode": "92567",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.8030,
    "longitude": -117.1430
  },
  "areaServed": [
    { "@type": "City", "name": "Nuevo" },
    { "@type": "City", "name": "Perris" },
    { "@type": "City", "name": "Sun City" },
    { "@type": "City", "name": "Menifee" },
    { "@type": "AdministrativeArea", "name": "Riverside County" }
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Pet Grooming Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Full Groom",
          "description": "Complete grooming including bath, blow dry, haircut, nail trim, ear cleaning"
        },
        "priceSpecification": {
          "@type": "PriceSpecification",
          "priceCurrency": "USD",
          "minPrice": "45",
          "maxPrice": "85"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Bath and Tidy",
          "description": "Quick refresh with bath, blow dry, nail trim, and light trimming"
        },
        "priceSpecification": {
          "@type": "PriceSpecification",
          "priceCurrency": "USD",
          "minPrice": "25",
          "maxPrice": "60"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Creative Color",
          "description": "Pet-safe OPAWZ color application for bold transformations"
        },
        "priceSpecification": {
          "@type": "PriceSpecification",
          "priceCurrency": "USD",
          "price": "30"
        }
      }
    ]
  },
  "knowsAbout": [
    "Dog Grooming",
    "Cat Grooming",
    "Creative Pet Grooming",
    "Asian Fusion Dog Grooming",
    "Teddy Bear Cuts",
    "Pet-Safe Color",
    "Anxious Dog Grooming",
    "Force-Free Grooming"
  ],
  "sameAs": [
    "https://instagram.com/looknglass.groomery",
    "https://facebook.com/lookingglassgroomery"
  ]
}

export function LocalBusinessSchema() {
  return (
    <Script
      id="local-business-schema"
      type="application/ld+json"
      strategy="afterInteractive"
    >
      {JSON.stringify(localBusinessSchema)}
    </Script>
  )
}
