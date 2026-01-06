// apps/web/src/components/schema/FAQSchema.tsx
// FAQ structured data for AI citation optimization

import Script from 'next/script'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSchemaProps {
  faqs: FAQItem[]
  id?: string
}

export function FAQSchema({ faqs, id = 'faq-schema' }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy="afterInteractive"
    >
      {JSON.stringify(schema)}
    </Script>
  )
}

// Pre-built FAQ sets for different pages

export const serviceFAQs: FAQItem[] = [
  {
    question: "How much does dog grooming cost in Nuevo, CA?",
    answer: "Dog grooming in Nuevo, CA at Through the Looking Glass Groomery costs $45-$85 for a full groom depending on size. Small dogs (under 25 lbs) start at $45, medium dogs at $55, large dogs at $65, and extra large dogs at $75-$85+. Bath and tidy services start at $25."
  },
  {
    question: "What services are included in a full dog groom?",
    answer: "A full groom at Through the Looking Glass Groomery includes bath with premium shampoo, blow dry, full haircut to your preferred style, nail trim, ear cleaning, and sanitary trim. Creative add-ons like pet-safe color and stencil art are available."
  },
  {
    question: "Do you groom cats in Nuevo, CA?",
    answer: "Yes! Through the Looking Glass Groomery grooms cats, dogs, goats, pigs, and guinea pigs. Cat grooming services include bath, nail trim, sanitary trim, and lion cuts. We specialize in handling anxious and nervous pets with force-free techniques."
  },
  {
    question: "What is Asian Fusion dog grooming?",
    answer: "Asian Fusion is a trendy grooming style originating from Asia featuring rounded faces, fluffy legs, and sculpted looks. Popular styles include Teddy Bear cuts, Korean Round Face, and Lamb cuts. Through the Looking Glass Groomery specializes in these creative styles."
  },
  {
    question: "Is pet-safe hair color available for dogs?",
    answer: "Yes! Through the Looking Glass Groomery offers pet-safe color using OPAWZ certified products. Colors are non-toxic, semi-permanent, and safe for your pet's skin and coat. Creative color starts at $30 and can include patterns, gradients, and full coverage."
  },
  {
    question: "How do I book a grooming appointment in Nuevo, CA?",
    answer: "Book your grooming appointment at Through the Looking Glass Groomery through our website, Instagram DM (@looknglass.groomery), or by texting. We serve Nuevo, Perris, Sun City, Menifee, and surrounding Riverside County areas."
  }
]

export const shelterAngelsFAQs: FAQItem[] = [
  {
    question: "What is Shelter Angels pet grooming?",
    answer: "Shelter Angels is a 501(c)(3) nonprofit program by Through the Looking Glass Groomery that provides free grooming makeovers to shelter pets awaiting adoption. Donations fund grooming sessions that help pets look their best and find forever homes faster."
  },
  {
    question: "How can I donate to help shelter pets get groomed?",
    answer: "Donate to Shelter Angels through our website. Donation tiers: $25 helps with supplies, $50 sponsors a small dog makeover, $100 sponsors a large dog makeover, and $250 sponsors multiple pets. All donations are tax-deductible."
  }
]

export const contactFAQs: FAQItem[] = [
  {
    question: "Where is Through the Looking Glass Groomery located?",
    answer: "Through the Looking Glass Groomery is located in Nuevo, CA (Riverside County). We serve clients in Nuevo, Perris, Sun City, Menifee, and surrounding areas within Riverside County."
  },
  {
    question: "What are the grooming hours at Through the Looking Glass?",
    answer: "Through the Looking Glass Groomery is open Monday through Saturday, 9 AM to 5 PM. We are closed on Sundays. Appointments are required - book through our website, Instagram DM, or text."
  },
  {
    question: "Does Through the Looking Glass Groomery handle anxious dogs?",
    answer: "Yes! Through the Looking Glass Groomery specializes in anxious, nervous, and fearful pets. Our groomer Kimmie is force-free certified and uses gentle, patient techniques. We also work with senior dogs, puppies, and pets with special needs."
  }
]
