// apps/web/src/app/wonderland/services/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const services = [
  {
    category: "The Queen's Full Groom",
    icon: '👑',
    description: 'The complete royal treatment for your furry nobility',
    items: [
      { name: 'Small Dogs (under 25 lbs)', price: '$45-55', time: '1.5-2 hrs' },
      { name: 'Medium Dogs (25-50 lbs)', price: '$55-70', time: '2-2.5 hrs' },
      { name: 'Large Dogs (50-80 lbs)', price: '$70-85', time: '2.5-3 hrs' },
      { name: 'Extra Large Dogs (80+ lbs)', price: '$85+', time: '3+ hrs' },
    ],
    includes: ['Bath & blow dry', 'Haircut & styling', 'Nail trim & file', 'Ear cleaning', 'Sanitary trim', 'Bow or bandana'],
  },
  {
    category: 'Bath & Tidy',
    icon: '🛁',
    description: 'A refreshing spa day without the full haircut',
    items: [
      { name: 'Small Dogs', price: '$25-35', time: '45 min-1 hr' },
      { name: 'Medium Dogs', price: '$35-45', time: '1-1.5 hrs' },
      { name: 'Large Dogs', price: '$45-60', time: '1.5-2 hrs' },
      { name: 'Extra Large Dogs', price: '$60+', time: '2+ hrs' },
    ],
    includes: ['Bath & blow dry', 'Brush out', 'Nail trim', 'Ear cleaning', 'Paw pad trim', 'Light face trim'],
  },
  {
    category: 'A La Carte',
    icon: '✨',
    description: 'Pick and choose your pet\'s perfect pampering',
    items: [
      { name: 'Nail Trim', price: '$15', time: '15 min' },
      { name: 'Nail Grind (smooth finish)', price: '$20', time: '20 min' },
      { name: 'Teeth Brushing', price: '$10', time: '10 min' },
      { name: 'De-shedding Treatment', price: '$15-30', time: '30+ min' },
      { name: 'Flea Bath', price: '$15 add-on', time: 'included' },
      { name: 'Medicated Bath', price: '$15 add-on', time: 'included' },
    ],
    includes: [],
  },
]

const creativeServices = [
  {
    name: 'Pet-Safe Color',
    icon: '🎨',
    description: 'Temporary, pet-safe colors to make your pet stand out',
    options: [
      { name: 'Accent Color (ears, tail, paws)', price: '$20-35' },
      { name: 'Full Creative Color', price: '$50-100+' },
      { name: 'Stencil Art', price: '$25-50' },
      { name: 'Glitter Application', price: '$10-20' },
    ],
    note: 'All colors are OPAWZ certified pet-safe and temporary',
  },
  {
    name: 'Asian Fusion Styling',
    icon: '🌸',
    description: 'Trendy Japanese and Korean grooming styles',
    options: [
      { name: 'Teddy Bear Cut', price: 'Included in full groom' },
      { name: 'Lamb Cut', price: 'Included in full groom' },
      { name: 'Korean Round Face', price: 'Included in full groom' },
      { name: 'Custom Asian Fusion', price: '+$10-20' },
    ],
    note: 'Perfect for Poodles, Bichons, Shih Tzus, and similar breeds',
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
            <Link href="/wonderland/looking-glass" className="btn-wonderland text-white">
              Preview Your Style 🪞
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
  )
}
