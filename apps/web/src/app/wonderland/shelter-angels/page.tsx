// apps/web/src/app/wonderland/shelter-angels/page.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const impactStats = [
  { number: '50+', label: 'Pets Groomed', icon: '✂️' },
  { number: '30+', label: 'Adoptions Helped', icon: '🏠' },
  { number: '$2,500+', label: 'Donated Value', icon: '💝' },
  { number: '5', label: 'Shelter Partners', icon: '🤝' },
]

const shelterPartners = [
  { name: 'Riverside County Animal Shelter', location: 'Riverside, CA' },
  { name: 'Animal Friends of the Valleys', location: 'Wildomar, CA' },
  { name: 'Ramona Humane Society', location: 'San Jacinto, CA' },
]

export default function ShelterAngelsPage() {
  const [donationAmount, setDonationAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')

  const donationTiers = [
    { amount: 25, description: 'Nail trim for a shelter pet', pets: 1 },
    { amount: 50, description: 'Bath & brush for a shelter pet', pets: 1 },
    { amount: 100, description: 'Full groom for a shelter pet', pets: 1 },
    { amount: 250, description: 'Groom 3 shelter pets', pets: 3 },
  ]

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.span
            className="text-8xl block mb-6"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            😇
          </motion.span>
          <h1 className="font-display text-4xl md:text-6xl mb-4">
            <span className="text-gradient">Shelter</span>{' '}
            <span className="text-psychedelic">Angels</span>
          </h1>
          <p className="text-white text-xl max-w-2xl mx-auto drop-shadow-lg">
            Help shelter pets look their best and find their forever homes.
            Every groom increases adoption chances by up to 50%.
          </p>
        </motion.div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {impactStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-wonderland p-6 text-center"
            >
              <span className="text-3xl block mb-2">{stat.icon}</span>
              <span className="font-display text-2xl md:text-3xl text-alice-gold block">
                {stat.number}
              </span>
              <span className="text-wonderland-muted text-sm">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-16"
        >
          <h2 className="font-display text-2xl md:text-3xl text-center mb-8 text-wonderland-text">
            How Shelter Angels Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-alice-purple to-psyche-pink flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="font-display text-lg text-wonderland-text mb-2">You Donate</h3>
              <p className="text-wonderland-muted text-sm">
                Choose a donation tier or custom amount to sponsor a shelter pet&apos;s groom
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-psyche-pink to-alice-gold flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="font-display text-lg text-wonderland-text mb-2">We Groom</h3>
              <p className="text-wonderland-muted text-sm">
                Kimmie volunteers her time to groom pets at local shelters
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-alice-gold to-psyche-blue flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="font-display text-lg text-wonderland-text mb-2">They Find Homes</h3>
              <p className="text-wonderland-muted text-sm">
                Clean, groomed pets are more likely to be adopted
              </p>
            </div>
          </div>
        </motion.div>

        {/* Donation Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 mb-16"
        >
          <h2 className="font-display text-2xl md:text-3xl text-center mb-8 text-wonderland-text">
            Sponsor a Shelter Pet&apos;s Groom
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {donationTiers.map(tier => (
              <button
                key={tier.amount}
                onClick={() => {
                  setDonationAmount(tier.amount)
                  setCustomAmount('')
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  donationAmount === tier.amount
                    ? 'border-alice-gold bg-alice-gold/10'
                    : 'border-alice-purple/30 hover:border-alice-purple'
                }`}
              >
                <span className="font-display text-2xl text-alice-gold block mb-1">
                  ${tier.amount}
                </span>
                <span className="text-wonderland-text text-sm block mb-2">
                  {tier.description}
                </span>
                <span className="text-psyche-pink text-xs">
                  🐾 Helps {tier.pets} pet{tier.pets > 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </div>

          <div className="max-w-md mx-auto">
            <label className="block text-wonderland-muted text-sm mb-2">
              Or enter a custom amount:
            </label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-wonderland-muted">
                  $
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => {
                    setCustomAmount(e.target.value)
                    setDonationAmount(null)
                  }}
                  placeholder="0"
                  className="w-full bg-wonderland-bg border border-alice-purple/30 rounded-xl py-3 pl-8 pr-4 text-wonderland-text focus:border-alice-purple focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <a
              href={`https://venmo.com/throughthelookingglass?txn=pay&amount=${
                donationAmount || customAmount || 0
              }&note=Shelter%20Angels%20Donation`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wonderland text-white inline-block"
            >
              Donate via Venmo 💝
            </a>
            <p className="text-wonderland-muted text-sm mt-4">
              100% of donations go directly to shelter pet grooming supplies
            </p>
          </div>
        </motion.div>

        {/* 501c3 Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-alice-gold/10 border border-alice-gold/30 rounded-2xl p-6 mb-16 text-center"
        >
          <span className="text-4xl block mb-3">📋</span>
          <h3 className="font-display text-lg text-alice-gold mb-2">
            501(c)(3) Status Coming Soon
          </h3>
          <p className="text-wonderland-muted text-sm max-w-xl mx-auto">
            We&apos;re working on our nonprofit status! Soon, your donations will be tax-deductible.
            For now, donations go directly to supplies and shelter partnerships.
          </p>
        </motion.div>

        {/* Shelter Partners */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="font-display text-2xl text-center mb-8 text-wonderland-text">
            Our Shelter Partners
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {shelterPartners.map(shelter => (
              <div key={shelter.name} className="card-wonderland p-6 text-center">
                <span className="text-4xl block mb-3">🏠</span>
                <h3 className="font-display text-lg text-wonderland-text mb-1">
                  {shelter.name}
                </h3>
                <p className="text-wonderland-muted text-sm">{shelter.location}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Volunteer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-wonderland p-8 text-center"
        >
          <h2 className="font-display text-2xl text-wonderland-text mb-4">
            Want to Help More?
          </h2>
          <p className="text-wonderland-muted mb-6 max-w-lg mx-auto">
            We&apos;re always looking for volunteers to help transport pets, assist at grooming days,
            or help spread the word about adoptable pets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://instagram.com/throughthelookingglass"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wonderland text-white"
            >
              Contact Us 📱
            </a>
            <Link
              href="/wonderland/gallery"
              className="px-6 py-3 rounded-full font-display border-2 border-white text-white hover:bg-white/10 transition-colors"
            >
              See Transformations
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
