// apps/web/src/app/wonderland/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const features = [
  {
    icon: '✂️',
    title: "The Queen's Spa",
    description: 'Full grooming services from bath to beautiful',
    href: '/wonderland/services',
    color: 'from-alice-purple to-psyche-pink',
  },
  {
    icon: '🪞',
    title: 'The Looking Glass',
    description: 'See your pet transformed before the groom',
    href: '/wonderland/looking-glass',
    color: 'from-psyche-blue to-alice-teal',
  },
  {
    icon: '🎨',
    title: 'Creative Color',
    description: 'Pet-safe colors for the boldest transformations',
    href: '/wonderland/services#creative',
    color: 'from-psyche-orange to-psyche-pink',
  },
  {
    icon: '😇',
    title: 'Shelter Angels',
    description: 'Help rescue pets find their forever homes',
    href: '/wonderland/shelter-angels',
    color: 'from-alice-gold to-psyche-orange',
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

export default function WonderlandHome() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl mb-6"
          >
            <span className="text-gradient">Welcome to</span>
            <br />
            <span className="text-psychedelic">Wonderland</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-body text-xl md:text-2xl text-wonderland-muted max-w-2xl mx-auto mb-12"
          >
            Where every pet becomes a masterpiece. Professional grooming with a
            touch of magic in Nuevo, CA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/wonderland/looking-glass" className="btn-wonderland">
              Try the Looking Glass 🪞
            </Link>
            <Link
              href="/wonderland/services"
              className="px-6 py-3 rounded-full font-display text-lg border border-alice-purple text-alice-purple hover:bg-alice-purple/10 transition-colors"
            >
              View Services
            </Link>
          </motion.div>
        </div>

        {/* Floating decorations */}
        <motion.div
          className="absolute top-20 left-10 text-6xl opacity-20"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          🍄
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-10 text-6xl opacity-20"
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          🫖
        </motion.div>
        <motion.div
          className="absolute top-1/2 right-20 text-4xl opacity-20"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          🃏
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl text-center mb-16"
          >
            <span className="text-gradient">Curiouser and Curiouser</span>
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Link href={feature.href}>
                  <div className="card-wonderland p-6 h-full hover:scale-105 transition-transform cursor-pointer">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-4`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="font-display text-xl mb-2 text-wonderland-text">
                      {feature.title}
                    </h3>
                    <p className="text-wonderland-muted text-sm">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transformation Gallery Preview */}
      <section className="py-20 px-4 bg-wonderland-card/50">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl mb-6"
          >
            <span className="text-gradient">Recent Transformations</span>
          </motion.h2>
          <p className="text-wonderland-muted mb-12">
            Every pet leaves looking like royalty 👑
          </p>

          {/* Placeholder for transformation gallery */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="aspect-square bg-wonderland-card rounded-xl overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-alice-purple/20 to-psyche-pink/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl opacity-30">🐾</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-wonderland-bg to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-sm text-wonderland-text">
                    View transformation
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <Link
            href="/wonderland/gallery"
            className="inline-block mt-8 text-alice-gold hover:text-alice-pink transition-colors"
          >
            View all transformations →
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-wonderland p-12"
          >
            <h2 className="font-display text-3xl md:text-4xl mb-6">
              Ready for the <span className="text-psychedelic">Transformation</span>?
            </h2>
            <p className="text-wonderland-muted mb-8 max-w-xl mx-auto">
              Book your pet&apos;s wonderland experience. From basic grooms to
              creative masterpieces, we make magic happen.
            </p>
            <Link href="/wonderland/looking-glass" className="btn-wonderland">
              Start Your Consultation 🪞
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
