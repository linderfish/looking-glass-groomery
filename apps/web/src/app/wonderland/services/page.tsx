// apps/web/src/app/wonderland/services/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Script from 'next/script'

// FAQ Schema for AI search visibility
const serviceFAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does dog grooming cost in Nuevo, CA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Dog grooming at Through the Looking Glass Groomery in Nuevo, CA costs $75-$130 for a full Magic Mirror Makeover depending on size. Small dogs start at $75, medium dogs at $85, large dogs at $95, and extra large dogs at $130. Bath and tidy services (Whimsical Wash & Tidy) start at $55."
      }
    },
    {
      "@type": "Question",
      "name": "What is included in a full dog groom?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A full groom at Through the Looking Glass Groomery includes bath and blow dry, haircut and styling, nail trim and file, ear cleaning, sanitary trim, and a bow or bandana. Service takes 1.5-3+ hours depending on dog size."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer creative color grooming for dogs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Through the Looking Glass Groomery offers pet-safe creative color grooming. Options include The Cheshire Pop Of Color ($15), MadHatter Highlights ($25), and Curiouser & Curiouser Full Body Creation ($100)."
      }
    },
    {
      "@type": "Question",
      "name": "What is Asian Fusion dog grooming?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Asian Fusion grooming includes trendy Japanese and Korean styling like Teddy Bear cuts, Lamb cuts, and Korean Round Face styles. These cuts are perfect for Poodles, Bichons, Shih Tzus, and similar breeds. Included in full groom price at Through the Looking Glass Groomery."
      }
    }
  ]
}

const services = [
  {
    category: 'Grooming Services',
    icon: '✨',
    description: 'Step into Wonderland with our magical grooming experience',
    items: [
      { name: "Cheshire Cat's Glow Up", price: '$120', time: '2-3 hrs', description: 'A whimsical bathing experience for your feline companion' },
      { name: 'Small Dog Magic Mirror Makeover', price: '$75', time: '1.5-2 hrs', description: 'Step into Wonderland with our Small Dog Magic Mirror Makeover' },
      { name: 'Medium Dog Magic Mirror Makeover', price: '$85', time: '2-2.5 hrs', description: 'Step into Wonderland with our medium Dog Magic Mirror Makeover' },
      { name: 'Large Dog Magic Mirror Makeover', price: '$95', time: '2.5-3 hrs', description: 'Step into Wonderland with our large Dog Magic Mirror Makeover' },
      { name: 'Extra Large Dog Magic Mirror Makeover', price: '$130', time: '3+ hrs', description: 'Step into Wonderland with our extra large Dog Magic Mirror Makeover' },
    ],
    includes: ['Bath & blow dry', 'Haircut & styling', 'Nail trim & file', 'Ear cleaning', 'Sanitary trim', 'Bow or bandana'],
  },
  {
    category: 'Bath Only',
    icon: '🛁',
    description: 'Delight your pet with our Whimsical Wash & Tidy',
    items: [
      { name: "Cheshire Cat's Bath", price: '$80', time: '1-1.5 hrs', description: "A whimsical bathing experience for your feline companion" },
      { name: 'Small Dog Whimsical Wash & Tidy', price: '$55', time: '45 min-1 hr', description: 'Delight your small dog with our Whimsical Wash & Tidy' },
      { name: 'Medium Dog Whimsical Wash & Tidy', price: '$65', time: '1-1.5 hrs', description: 'Delight your medium dog with our Whimsical Wash & Tidy' },
      { name: 'Large Dog Whimsical Wash & Tidy', price: '$85', time: '1.5-2 hrs', description: 'Delight your large dog with our Whimsical Wash & Tidy' },
      { name: 'XL Dog Whimsical Wash & Tidy', price: '$115', time: '2+ hrs', description: 'Delight your XL dog with our Whimsical Wash & Tidy' },
    ],
    includes: ['Bath & blow dry', 'Brush out', 'Nail trim', 'Ear cleaning', 'Paw pad trim', 'Light face trim'],
  },
  {
    category: 'Add-ons',
    icon: '🎨',
    description: 'Enhance your pet\'s pampering with our magical add-ons',
    items: [
      { name: 'Curiouser & Curiouser Full Body Creation', price: '$100', time: '1-2 hrs', description: 'A bespoke design that brings the most curious Wonderland ideas to life' },
      { name: 'Customer Pick Up Service', price: '$15', time: '30 min', description: 'Customer Pick Up Service provides a delightful and personalized experience' },
      { name: 'The Cheshire Pop Of Color', price: '$15', time: '30 min', description: 'Add a vibrant and playful pop of color to your pet' },
      { name: 'MadHatter Highlights', price: '$25', time: '45 min', description: 'Add a playful twist to your pet\'s appearance' },
      { name: "The Queen's Royal Claws", price: '$25', time: '30 min', description: 'Experience the ultimate pampering with a luxurious mini trim and polish' },
      { name: 'Pretty Paws and Claws Nail Grinding and Trimming', price: '$20', time: '20 min', description: 'Treat your pet to a paw-some adventure with our nail grinding and trimming' },
      { name: 'Extra Care', price: '$10', time: '15 min', description: 'Handling fee for super spicy furry friends' },
    ],
    includes: [],
  },
]

const creativeServices = [
  {
    name: 'Creative Color & Styling',
    icon: '🎨',
    description: 'Whimsical designs and colors to make your pet stand out',
    options: [
      { name: 'Curiouser & Curiouser Full Body Creation', price: '$100' },
      { name: 'The Cheshire Pop Of Color', price: '$15' },
      { name: 'MadHatter Highlights', price: '$25' },
    ],
    note: 'All colors are pet-safe and temporary, inspired by the playful spirit of Wonderland',
  },
  {
    name: 'Nail & Paw Care',
    icon: '💅',
    description: 'Pamper your pet\'s paws with royal treatment',
    options: [
      { name: "The Queen's Royal Claws", price: '$25' },
      { name: 'Pretty Paws and Claws Nail Grinding and Trimming', price: '$20' },
    ],
    note: 'Perfect for pets who deserve to feel like royalty',
  },
]

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

export default function ServicesPage() {
  return (
    <>
      <Script id="services-faq-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(serviceFAQSchema)}
      </Script>
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-4xl md:text-6xl mb-4">
            <span className="text-gradient">The Queen&apos;s</span>{' '}
            <span className="text-psychedelic">Spa Menu</span>
          </h1>
          <p className="text-white text-xl max-w-2xl mx-auto drop-shadow-lg">
            Every pet deserves to feel like royalty. Choose your pampering adventure.
          </p>
        </motion.div>

        {/* Main Services */}
        <div className="space-y-12 mb-20">
          {services.map((service, i) => (
            <motion.div
              key={service.category}
              custom={i}
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="card-wonderland p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl">{service.icon}</span>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl text-wonderland-text">
                    {service.category}
                  </h2>
                  <p className="text-wonderland-muted">{service.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-display text-lg text-alice-gold mb-4">Pricing</h3>
                  <div className="space-y-3">
                    {service.items.map(item => (
                      <div
                        key={item.name}
                        className="flex justify-between items-center py-2 border-b border-alice-purple/20"
                      >
                        <span className="text-wonderland-text">{item.name}</span>
                        <div className="text-right">
                          <span className="text-alice-gold font-semibold">{item.price}</span>
                          <span className="text-wonderland-muted text-sm ml-2">({item.time})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {service.includes.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg text-alice-gold mb-4">Includes</h3>
                    <ul className="space-y-2">
                      {service.includes.map(item => (
                        <li key={item} className="flex items-center gap-2 text-wonderland-text">
                          <span className="text-psyche-pink">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Creative Color Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-20"
          id="creative"
        >
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">
            <span className="text-psychedelic">Creative Color</span>{' '}
            <span className="text-gradient">& Styling</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {creativeServices.map((service, i) => (
              <motion.div
                key={service.name}
                custom={i}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card-wonderland p-6 bg-gradient-to-br from-wonderland-card to-alice-purple/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{service.icon}</span>
                  <h3 className="font-display text-xl text-wonderland-text">{service.name}</h3>
                </div>
                <p className="text-wonderland-muted mb-4">{service.description}</p>

                <div className="space-y-2 mb-4">
                  {service.options.map(option => (
                    <div
                      key={option.name}
                      className="flex justify-between py-1 border-b border-alice-purple/10"
                    >
                      <span className="text-wonderland-text text-sm">{option.name}</span>
                      <span className="text-alice-gold text-sm">{option.price}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-psyche-pink italic">{service.note}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Policies */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-12"
        >
          <h2 className="font-display text-2xl text-center mb-6 text-alice-gold">
            Important Notes
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-wonderland-muted">
            <div>
              <h3 className="text-wonderland-text font-semibold mb-2">Pricing</h3>
              <ul className="space-y-1">
                <li>• Prices may vary based on coat condition</li>
                <li>• Matted coats may require additional fees</li>
                <li>• Breed-specific styling available</li>
                <li>• Senior pets handled with extra care</li>
              </ul>
            </div>
            <div>
              <h3 className="text-wonderland-text font-semibold mb-2">Appointments</h3>
              <ul className="space-y-1">
                <li>• 24-hour cancellation notice required</li>
                <li>• Late arrivals may need rescheduling</li>
                <li>• Vaccines must be up to date</li>
                <li>• Serving Nuevo, CA and surrounding areas</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section - Q&A format for AI extraction */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-12"
        >
          <h2 className="font-display text-2xl text-center mb-8 text-alice-gold">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-wonderland-text font-semibold mb-2">
                How much does dog grooming cost in Nuevo, CA?
              </h3>
              <p className="text-wonderland-muted">
                Dog grooming at Through the Looking Glass Groomery costs $75-$130 for a full Magic Mirror Makeover
                depending on size. Small dogs start at $75, medium dogs at $85,
                large dogs at $95, and extra large dogs at $130. Bath and tidy services (Whimsical Wash & Tidy) start at $55.
              </p>
            </div>
            <div>
              <h3 className="text-wonderland-text font-semibold mb-2">
                What is included in a full dog groom?
              </h3>
              <p className="text-wonderland-muted">
                A full groom includes bath and blow dry, haircut and styling, nail trim and file,
                ear cleaning, sanitary trim, and a bow or bandana. Service takes 1.5-3+ hours
                depending on dog size.
              </p>
            </div>
            <div>
              <h3 className="text-wonderland-text font-semibold mb-2">
                Do you offer creative color grooming?
              </h3>
              <p className="text-wonderland-muted">
                Yes! We offer pet-safe creative color and styling. Options include
                The Cheshire Pop Of Color ($15), MadHatter Highlights ($25), and
                Curiouser & Curiouser Full Body Creation ($100).
              </p>
            </div>
            <div>
              <h3 className="text-wonderland-text font-semibold mb-2">
                What is Asian Fusion dog grooming?
              </h3>
              <p className="text-wonderland-muted">
                Asian Fusion includes trendy Japanese and Korean styles like Teddy Bear cuts, Lamb cuts,
                and Korean Round Face. Perfect for Poodles, Bichons, Shih Tzus, and similar breeds.
                Included in full groom price.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-2xl md:text-3xl mb-6 text-wonderland-text">
            Ready to book your pet&apos;s transformation?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/wonderland/contact" className="btn-wonderland text-white">
              Book Your Groom ✨
            </Link>
            <Link
              href="/wonderland/contact"
              className="px-6 py-3 rounded-full font-display text-lg border-2 border-white text-white bg-wonderland-bg/50 hover:bg-white/20 transition-colors"
            >
              Book Now
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  )
}
