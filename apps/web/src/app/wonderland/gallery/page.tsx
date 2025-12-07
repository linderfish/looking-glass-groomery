// apps/web/src/app/wonderland/gallery/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// Placeholder gallery data - in production, this would come from Instagram API or database
const galleryItems = [
  { id: 1, category: 'creative', title: 'Rainbow Poodle', before: true },
  { id: 2, category: 'teddy', title: 'Teddy Bear Bichon', before: true },
  { id: 3, category: 'asian', title: 'Korean Style Maltese', before: false },
  { id: 4, category: 'creative', title: 'Pink Ears Yorkie', before: true },
  { id: 5, category: 'lion', title: 'Lion Cut Pom', before: false },
  { id: 6, category: 'breed', title: 'Show Cut Shih Tzu', before: true },
  { id: 7, category: 'creative', title: 'Galaxy Color Golden', before: true },
  { id: 8, category: 'teddy', title: 'Fluffy Goldendoodle', before: false },
  { id: 9, category: 'asian', title: 'Japanese Style Poodle', before: true },
  { id: 10, category: 'creative', title: 'Mermaid Tail Samoyed', before: false },
  { id: 11, category: 'breed', title: 'Classic Schnauzer', before: true },
  { id: 12, category: 'lion', title: 'Mini Lion Pekingese', before: false },
]

const categories = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'creative', name: 'Creative Color', icon: '🎨' },
  { id: 'teddy', name: 'Teddy Bear', icon: '🧸' },
  { id: 'asian', name: 'Asian Fusion', icon: '🌸' },
  { id: 'lion', name: 'Lion Cut', icon: '🦁' },
  { id: 'breed', name: 'Breed Standard', icon: '🏆' },
]

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState<number | null>(null)

  const filteredItems =
    activeCategory === 'all'
      ? galleryItems
      : galleryItems.filter(item => item.category === activeCategory)

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-6xl mb-4">
            <span className="text-gradient">Transformation</span>{' '}
            <span className="text-psychedelic">Gallery</span>
          </h1>
          <p className="text-white text-xl drop-shadow-lg">
            Every pet that enters leaves as a masterpiece
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
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedItem(item.id)}
                className="cursor-pointer group"
              >
                <div className="card-wonderland overflow-hidden">
                  <div className="aspect-square relative">
                    {/* Placeholder - in production, real images */}
                    <div className="absolute inset-0 bg-gradient-to-br from-alice-purple/30 to-psyche-pink/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform">
                        🐾
                      </span>
                    </div>

                    {/* Before/After badge */}
                    {item.before && (
                      <div className="absolute top-2 right-2 bg-alice-gold text-wonderland-bg text-xs px-2 py-1 rounded-full font-bold">
                        B/A
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-wonderland-bg via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div>
                        <span className="text-white font-display block">{item.title}</span>
                        <span className="text-wonderland-muted text-sm">
                          {categories.find(c => c.id === item.category)?.name}
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
        {filteredItems.length === 0 && (
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
              href="https://instagram.com/throughthelookingglass"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wonderland text-white inline-flex items-center gap-2"
            >
              <span>@throughthelookingglass</span>
              <span>📸</span>
            </a>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-white mb-4 drop-shadow-lg">
            Ready for your pet&apos;s transformation?
          </p>
          <Link href="/wonderland/looking-glass" className="btn-wonderland text-white">
            Try the Looking Glass 🪞
          </Link>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
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
                <div className="absolute inset-0 bg-gradient-to-br from-alice-purple/30 to-psyche-pink/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-9xl opacity-50">🐾</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display text-xl text-wonderland-text">
                    {galleryItems.find(i => i.id === selectedItem)?.title}
                  </h3>
                  <p className="text-wonderland-muted text-sm">
                    {categories.find(
                      c => c.id === galleryItems.find(i => i.id === selectedItem)?.category
                    )?.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
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
  )
}
