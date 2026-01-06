// apps/web/src/app/wonderland/contact/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Script from 'next/script'

// TODO: Verify Calendly username matches actual account
const CALENDLY_URL = 'https://calendly.com/lookingglassgroomery'

// FAQ Schema for AI search visibility
const contactFAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Where is Through the Looking Glass Groomery located?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Through the Looking Glass Groomery is located in Nuevo, CA (Riverside County). We serve Nuevo, Perris, Menifee, Sun City, Homeland, and Winchester areas."
      }
    },
    {
      "@type": "Question",
      "name": "How do I book a grooming appointment in Nuevo, CA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can book online via our Calendly booking system, message us on Instagram @looknglass.groomery, email kimmieserrati@gmail.com, or text Kimmie directly. We recommend booking 1-2 weeks in advance."
      }
    },
    {
      "@type": "Question",
      "name": "What are the hours for pet grooming at Through the Looking Glass?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Hours are Monday-Friday 9am-5pm, Saturday 9am-3pm, Sunday closed. All appointments are by booking only."
      }
    },
    {
      "@type": "Question",
      "name": "Is the creative pet color safe?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Through the Looking Glass Groomery only uses OPAWZ certified pet-safe colors that are non-toxic and temporary. Safe for dogs and approved for pet use."
      }
    }
  ]
}

const contactMethods = [
  {
    icon: '📱',
    title: 'Instagram DM',
    description: 'Fastest response! DM us anytime',
    action: 'Message on Instagram',
    href: 'https://instagram.com/looknglass.groomery',
    primary: true,
  },
  {
    icon: '📧',
    title: 'Email',
    description: 'For detailed inquiries',
    action: 'kimmieserrati@gmail.com',
    href: 'mailto:kimmieserrati@gmail.com',
    primary: false,
  },
  {
    icon: '💬',
    title: 'Text',
    description: 'Quick questions & booking',
    action: 'Text Kimmie',
    href: 'sms:+1234567890',
    primary: false,
  },
]

const faqs = [
  {
    q: 'Where are you located?',
    a: 'We\'re based in Nuevo, CA (Riverside County). We serve Nuevo, Perris, Menifee, Sun City, and surrounding areas.',
  },
  {
    q: 'Do you offer mobile grooming?',
    a: 'Currently we operate from our home studio. Mobile grooming is coming soon!',
  },
  {
    q: 'How far in advance should I book?',
    a: 'We recommend booking 1-2 weeks in advance, especially for weekends. Last-minute appointments may be available!',
  },
  {
    q: 'What breeds do you groom?',
    a: 'We groom all breeds of dogs! Cats and other pets on a case-by-case basis.',
  },
  {
    q: 'Is the creative color safe?',
    a: 'Absolutely! We only use OPAWZ certified pet-safe colors that are non-toxic and temporary.',
  },
  {
    q: 'What vaccines are required?',
    a: 'We require proof of current rabies vaccination. Other vaccines are strongly recommended.',
  },
]

export default function ContactPage() {
  return (
    <>
      <Script id="contact-faq-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(contactFAQSchema)}
      </Script>
      {/* Calendly widget script */}
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-4xl md:text-6xl mb-4">
            <span className="text-gradient">Let&apos;s</span>{' '}
            <span className="text-psychedelic">Connect</span>
          </h1>
          <p className="text-white text-xl drop-shadow-lg">
            Ready to book your pet&apos;s transformation? We&apos;d love to hear from you!
          </p>
        </motion.div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {contactMethods.map((method, i) => (
            <motion.a
              key={method.title}
              href={method.href}
              target={method.href.startsWith('http') ? '_blank' : undefined}
              rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`card-wonderland p-6 text-center hover:scale-105 transition-transform ${
                method.primary ? 'ring-2 ring-alice-gold' : ''
              }`}
            >
              <span className="text-5xl block mb-4">{method.icon}</span>
              <h2 className="font-display text-xl text-wonderland-text mb-2">{method.title}</h2>
              <p className="text-wonderland-muted text-sm mb-4">{method.description}</p>
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-display ${
                  method.primary
                    ? 'bg-alice-gold text-wonderland-bg'
                    : 'bg-alice-purple/20 text-alice-purple'
                }`}
              >
                {method.action}
              </span>
            </motion.a>
          ))}
        </div>

        {/* Calendly Booking Widget */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-16"
        >
          <h2 className="font-display text-2xl text-center mb-6 text-wonderland-text">
            📅 Book Online
          </h2>
          <p className="text-center text-wonderland-muted mb-6">
            Select a time that works for you. Full groom appointments are typically 2-3 hours.
          </p>
          <div
            className="calendly-inline-widget rounded-xl overflow-hidden"
            data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=1a1625&text_color=f5f5f5&primary_color=ffd700`}
            style={{ minWidth: '320px', height: '700px' }}
          />
          <p className="text-center text-wonderland-muted text-sm mt-4">
            Don&apos;t see a time that works? Message us on Instagram for more options!
          </p>
        </motion.div>

        {/* Cheshire Chat */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-16 text-center"
        >
          <span className="text-6xl block mb-4">😼</span>
          <h2 className="font-display text-2xl text-wonderland-text mb-4">
            Chat with the Cheshire Cat
          </h2>
          <p className="text-wonderland-muted mb-6">
            Got a quick question? Our AI assistant can help with pricing, services, and booking info!
          </p>
          <p className="text-alice-gold text-sm">
            Look for the chat bubble in the bottom right corner →
          </p>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-16"
        >
          <h2 className="font-display text-2xl text-center mb-6 text-wonderland-text">
            📍 Service Area
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display text-lg text-alice-gold mb-3">Based In</h3>
              <p className="text-wonderland-text mb-4">
                Nuevo, California<br />
                <span className="text-wonderland-muted">Riverside County</span>
              </p>
              <h3 className="font-display text-lg text-alice-gold mb-3">Areas We Serve</h3>
              <ul className="text-wonderland-muted space-y-1">
                <li>• Nuevo</li>
                <li>• Perris</li>
                <li>• Menifee</li>
                <li>• Sun City</li>
                <li>• Homeland</li>
                <li>• Winchester</li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-lg text-alice-gold mb-3">Hours</h3>
              <div className="text-wonderland-muted space-y-1">
                <p>Monday - Friday: 9am - 5pm</p>
                <p>Saturday: 9am - 3pm</p>
                <p>Sunday: Closed</p>
              </div>
              <p className="text-psyche-pink text-sm mt-4">
                * By appointment only
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="font-display text-2xl md:text-3xl text-center mb-8 text-wonderland-text">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card-wonderland p-6"
              >
                <h3 className="font-display text-lg text-alice-gold mb-2">{faq.q}</h3>
                <p className="text-wonderland-muted">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-white text-xl mb-6 drop-shadow-lg">
            Ready to see the magic?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/wonderland/gallery" className="btn-wonderland text-white">
              See Our Work 📸
            </Link>
            <Link
              href="/wonderland/services"
              className="px-6 py-3 rounded-full font-display border-2 border-white text-white hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  )
}
