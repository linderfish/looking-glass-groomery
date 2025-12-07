// apps/web/src/app/wonderland/why-kimmie/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const certifications = [
  {
    name: 'Force-Free & Fear-Free',
    icon: '💜',
    description: 'No intimidation, stress-minimized handling. Your pet\'s emotional wellbeing comes first.',
  },
  {
    name: 'Breed Standard Cuts',
    icon: '✂️',
    description: 'Show-quality precision for every breed. From poodles to schnauzers, done right.',
  },
  {
    name: 'Dangerous/Aggressive Dogs',
    icon: '🛡️',
    description: 'Certified to safely handle dogs that other groomers refuse. Every pet deserves care.',
  },
  {
    name: 'Anxious/Nervous/Fearful',
    icon: '🌸',
    description: 'Gentle approach and infinite patience for pets who need extra time and understanding.',
  },
  {
    name: 'Nursing Moms & Puppies',
    icon: '🍼',
    description: 'Delicate, specialized care for the most vulnerable. Handled with the utmost gentleness.',
  },
  {
    name: 'Service Animals',
    icon: '⭐',
    description: 'Fast, expeditious service. Owner can wait. We understand these aren\'t just pets—they\'re partners.',
  },
  {
    name: 'Creative Grooming Artist',
    icon: '🎨',
    description: 'Certified in pet-safe color application. Turn your pet into a walking work of art.',
  },
  {
    name: 'Basic Safety Certified',
    icon: '✓',
    description: 'Foundation certification in pet handling, first aid, and safety protocols.',
  },
]

const animals = [
  { name: 'Dogs', emoji: '🐕', note: 'All sizes, all temperaments' },
  { name: 'Cats', emoji: '🐱', note: 'Creative color, grooming, bath/nails' },
  { name: 'Goats', emoji: '🐐', note: 'Creative color' },
  { name: 'Pigs', emoji: '🐷', note: 'Creative color' },
  { name: 'Guinea Pigs', emoji: '🐹', note: 'Creative color' },
]

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

export default function WhyKimmiePage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-4xl md:text-6xl mb-4">
            <span className="text-gradient">Why</span>{' '}
            <span className="text-psychedelic">Kimmie?</span>
          </h1>
          <p className="text-white text-xl max-w-2xl mx-auto drop-shadow-lg">
            Not all groomers are created equal. Here&apos;s why your pet deserves the Wonderland experience.
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-16"
        >
          <h2 className="font-display text-2xl md:text-3xl text-alice-gold mb-6 text-center">
            The Story Behind the Magic
          </h2>
          <div className="prose prose-invert max-w-none text-wonderland-text space-y-4">
            <p className="text-lg">
              Through the Looking Glass Groomery isn&apos;t just a business—it&apos;s a passion project born from
              a deep love for animals and a belief that every pet, regardless of temperament or special needs,
              deserves to look and feel their absolute best.
            </p>
            <p>
              Based in Nuevo, California, Kimmie has dedicated years to mastering not just the art of grooming,
              but the science of understanding animal behavior. This means your nervous rescue can feel safe.
              Your reactive pup can be handled with expertise. Your beloved senior can be treated with the
              gentleness they deserve.
            </p>
            <p>
              And for those who want to go beyond traditional grooming? Welcome to Wonderland, where
              creative color and artistic expression transform your pet into a one-of-a-kind masterpiece.
            </p>
          </div>
        </motion.div>

        {/* Certifications Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">
            <span className="text-gradient">Certified</span>{' '}
            <span className="text-psychedelic">Excellence</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {certifications.map((cert, i) => (
              <motion.div
                key={cert.name}
                custom={i}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card-wonderland p-6 flex gap-4"
              >
                <span className="text-4xl flex-shrink-0">{cert.icon}</span>
                <div>
                  <h3 className="font-display text-lg text-alice-gold mb-1">{cert.name}</h3>
                  <p className="text-wonderland-muted text-sm">{cert.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Animals Served */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-16"
        >
          <h2 className="font-display text-2xl md:text-3xl text-alice-gold mb-8 text-center">
            Animals We Serve
          </h2>

          <div className="flex flex-wrap justify-center gap-6">
            {animals.map((animal, i) => (
              <motion.div
                key={animal.name}
                custom={i}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <span className="text-5xl block mb-2">{animal.emoji}</span>
                <h3 className="font-display text-lg text-wonderland-text">{animal.name}</h3>
                <p className="text-wonderland-muted text-xs">{animal.note}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-psyche-pink mt-6 text-sm italic">
            Sorry, no birds at this time
          </p>
        </motion.div>

        {/* Philosophy */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">
            <span className="text-psychedelic">The Wonderland</span>{' '}
            <span className="text-gradient">Philosophy</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-wonderland p-6 text-center">
              <span className="text-4xl block mb-4">🪄</span>
              <h3 className="font-display text-lg text-alice-gold mb-2">Every Pet is Magic</h3>
              <p className="text-wonderland-muted text-sm">
                No two pets are alike. We tailor every experience to your pet&apos;s unique personality and needs.
              </p>
            </div>
            <div className="card-wonderland p-6 text-center">
              <span className="text-4xl block mb-4">💫</span>
              <h3 className="font-display text-lg text-alice-gold mb-2">Trust Takes Time</h3>
              <p className="text-wonderland-muted text-sm">
                We never rush. If your pet needs extra time to feel comfortable, they get it. Period.
              </p>
            </div>
            <div className="card-wonderland p-6 text-center">
              <span className="text-4xl block mb-4">🎭</span>
              <h3 className="font-display text-lg text-alice-gold mb-2">Art Meets Care</h3>
              <p className="text-wonderland-muted text-sm">
                Whether it&apos;s a classic cut or rainbow creativity, every groom is crafted with artistic precision.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Shelter Work */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-16 bg-gradient-to-br from-wonderland-card to-psyche-pink/10"
        >
          <h2 className="font-display text-2xl md:text-3xl text-alice-gold mb-6 text-center">
            Giving Back: Shelter Angels
          </h2>
          <p className="text-wonderland-text text-center max-w-2xl mx-auto mb-6">
            Through our 501(c)(3) nonprofit arm, Through the Looking Glass Rescue, we provide
            makeovers to shelter pets at risk of euthanasia. A fresh groom can mean the difference
            between being overlooked and finding a forever home.
          </p>
          <div className="text-center">
            <Link href="/wonderland/shelter-angels" className="btn-wonderland text-white inline-block">
              Meet Our Shelter Angels
            </Link>
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
            Ready to experience the difference?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/wonderland/services" className="btn-wonderland text-white">
              View Services
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
