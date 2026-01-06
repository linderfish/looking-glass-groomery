// apps/web/src/app/wonderland/gallery/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { galleryPhotos, categories, getPhotoUrl, type GalleryPhoto } from '@/data/gallery'

// FAQ Schema for AI search visibility
const galleryFAQSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What grooming styles does Through the Looking Glass Groomery offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Through the Looking Glass Groomery offers creative color grooming, Asian Fusion styles (Teddy Bear, Korean Round Face, Lamb cuts), lion cuts, and breed-standard cuts. We groom dogs, cats, goats, pigs, and guinea pigs."
      }
    },
    {
      "@type": "Question",
      "name": "Can I see examples of creative pet grooming?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Our gallery showcases before and after transformations including rainbow colors, pink accents, galaxy patterns, and more. We use pet-safe OPAWZ colors. Follow us on Instagram @looknglass.groomery for daily updates."
      }
    }
  ]
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)

  const filteredPhotos =
    activeCategory === 'all'
      ? galleryPhotos
      : galleryPhotos.filter(photo => photo.category === activeCategory)

  return (
    <>
      <Script id="gallery-faq-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(galleryFAQSchema)}
      </Script>

      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with Answer Capsule */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl md:text-6xl mb-4">
              <span className="text-gradient">Transformation</span>{' '}
              <span className="text-psychedelic">Gallery</span>
            </h1>
            <p className="text-white text-xl drop-shadow-lg max-w-2xl mx-auto">
              Through the Looking Glass Groomery transforms pets with creative color,
              Asian Fusion styles, and breed-standard cuts. See our before and after
              grooming photos from Nuevo, CA.
            </p>
          </motion.div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-display text-sm transition-all ${
                  activeCategory === cat.id
                    ? 'bg-alice-purple text-white'
                    : 'bg-wonderland-card text-wonderland-muted hover:bg-alice-purple/20'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {filteredPhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPhoto(photo)}
                  className="cursor-pointer group"
                >
                  <div className="card-wonderland overflow-hidden">
                    <div className="aspect-square relative">
                      {/* Photo or placeholder */}
                      {photo.filename ? (
                        <Image
                          src={getPhotoUrl(photo.filename)}
                          alt={`${photo.title} - ${photo.breed || 'pet'} grooming`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-alice-purple/30 to-psyche-pink/30" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform">
                              🐾
                            </span>
                          </div>
                        </>
                      )}

                      {/* Before/After badge */}
                      {photo.beforeAfter && (
                        <div className="absolute top-2 right-2 bg-alice-gold text-wonderland-bg text-xs px-2 py-1 rounded-full font-bold">
                          B/A
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-wonderland-bg via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <div>
                          <span className="text-white font-display block">{photo.title}</span>
                          <span className="text-wonderland-muted text-sm">
                            {categories.find(c => c.id === photo.category)?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty state */}
          {filteredPhotos.length === 0 && (
            <div className="text-center py-20">
              <span className="text-6xl block mb-4">🔍</span>
              <p className="text-wonderland-muted">No transformations in this category yet</p>
            </div>
          )}

          {/* Instagram CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="card-wonderland p-8 inline-block">
              <h2 className="font-display text-2xl text-wonderland-text mb-4">
                See More on Instagram
              </h2>
              <p className="text-wonderland-muted mb-6">
                Follow us for daily transformations and behind-the-scenes magic
              </p>
              <a
                href="https://instagram.com/looknglass.groomery"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wonderland text-white inline-flex items-center gap-2"
              >
                <span>@looknglass.groomery</span>
                <span>📸</span>
              </a>
            </div>
          </motion.div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-white mb-4 drop-shadow-lg">
              Ready for your pet&apos;s transformation?
            </p>
            <Link href="/wonderland/contact" className="btn-wonderland text-white">
              Book Your Groom ✨
            </Link>
          </div>
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="fixed inset-0 z-50 bg-wonderland-bg/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={e => e.stopPropagation()}
                className="card-wonderland p-4 max-w-2xl w-full"
              >
                <div className="aspect-square relative rounded-xl overflow-hidden mb-4">
                  {selectedPhoto.filename ? (
                    <Image
                      src={getPhotoUrl(selectedPhoto.filename)}
                      alt={`${selectedPhoto.title} - ${selectedPhoto.breed || 'pet'} grooming by Through the Looking Glass Groomery`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 672px"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-alice-purple/30 to-psyche-pink/30" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-9xl opacity-50">🐾</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-display text-xl text-wonderland-text">
                      {selectedPhoto.title}
                    </h3>
                    <p className="text-wonderland-muted text-sm">
                      {selectedPhoto.breed && `${selectedPhoto.breed} • `}
                      {categories.find(c => c.id === selectedPhoto.category)?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="text-wonderland-muted hover:text-white transition-colors text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
