// apps/web/src/app/privacy/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl mb-4">
            <span className="text-gradient">Privacy</span>{' '}
            <span className="text-psychedelic">Policy</span>
          </h1>
          <p className="text-wonderland-muted">
            Last updated: January 6, 2025
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card-wonderland p-8 space-y-8"
        >
          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Introduction</h2>
            <p className="text-wonderland-muted leading-relaxed">
              Through the Looking Glass Groomery (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy
              and is committed to protecting your personal information. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our
              services or visit our website at lookingglassgroomery.com.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Information We Collect</h2>
            <p className="text-wonderland-muted leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="text-wonderland-muted space-y-2 ml-4">
              <li>• <strong className="text-wonderland-text">Contact Information:</strong> Name, email address, phone number, and mailing address</li>
              <li>• <strong className="text-wonderland-text">Pet Information:</strong> Pet name, breed, age, weight, health conditions, vaccination records, and grooming preferences</li>
              <li>• <strong className="text-wonderland-text">Appointment Details:</strong> Booking history, service preferences, and scheduling information</li>
              <li>• <strong className="text-wonderland-text">Payment Information:</strong> Payment method details processed securely through our payment providers</li>
              <li>• <strong className="text-wonderland-text">Communications:</strong> Messages, inquiries, and feedback you send us</li>
              <li>• <strong className="text-wonderland-text">Photos and Media:</strong> Photos of your pet taken during grooming sessions</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">How We Use Your Information</h2>
            <p className="text-wonderland-muted leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="text-wonderland-muted space-y-2 ml-4">
              <li>• Provide, maintain, and improve our grooming services</li>
              <li>• Schedule and manage appointments</li>
              <li>• Communicate with you about services, appointments, and promotions</li>
              <li>• Process payments and send transaction confirmations</li>
              <li>• Maintain pet health and grooming records for better service</li>
              <li>• Share photos of your pet on social media (with your consent)</li>
              <li>• Respond to your inquiries and provide customer support</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Photo Usage & Social Media</h2>
            <p className="text-wonderland-muted leading-relaxed">
              We love showcasing our furry clients! With your consent, we may share photos of your
              pet on our social media accounts (Instagram, Facebook, TikTok) and website. You can
              opt out of photo sharing at any time by letting us know. If you&apos;ve previously
              consented and wish to have photos removed, please contact us and we&apos;ll remove them
              promptly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Information Sharing</h2>
            <p className="text-wonderland-muted leading-relaxed mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="text-wonderland-muted space-y-2 ml-4">
              <li>• <strong className="text-wonderland-text">Service Providers:</strong> Third parties that help us operate our business (payment processors, booking systems, email services)</li>
              <li>• <strong className="text-wonderland-text">Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li>• <strong className="text-wonderland-text">Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Data Security</h2>
            <p className="text-wonderland-muted leading-relaxed">
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. However, no method of transmission over the Internet is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Your California Privacy Rights</h2>
            <p className="text-wonderland-muted leading-relaxed mb-4">
              If you are a California resident, you have specific rights under the California
              Consumer Privacy Act (CCPA):
            </p>
            <ul className="text-wonderland-muted space-y-2 ml-4">
              <li>• <strong className="text-wonderland-text">Right to Know:</strong> Request information about what personal data we collect and how we use it</li>
              <li>• <strong className="text-wonderland-text">Right to Delete:</strong> Request deletion of your personal information</li>
              <li>• <strong className="text-wonderland-text">Right to Opt-Out:</strong> Opt out of the sale of your personal information (we don&apos;t sell your data)</li>
              <li>• <strong className="text-wonderland-text">Right to Non-Discrimination:</strong> You won&apos;t receive different service for exercising your privacy rights</li>
            </ul>
            <p className="text-wonderland-muted leading-relaxed mt-4">
              To exercise these rights, please contact us using the information below.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Cookies & Tracking</h2>
            <p className="text-wonderland-muted leading-relaxed">
              Our website may use cookies and similar technologies to enhance your experience,
              analyze usage patterns, and deliver personalized content. You can control cookies
              through your browser settings. Disabling cookies may affect some website functionality.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Data Retention</h2>
            <p className="text-wonderland-muted leading-relaxed">
              We retain your personal information for as long as necessary to provide our services
              and fulfill the purposes described in this policy. Pet health records and grooming
              history may be retained longer to ensure continuity of care for your pet.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Children&apos;s Privacy</h2>
            <p className="text-wonderland-muted leading-relaxed">
              Our services are not directed to children under 13. We do not knowingly collect
              personal information from children under 13. If you believe we have collected
              information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Changes to This Policy</h2>
            <p className="text-wonderland-muted leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Contact Us</h2>
            <p className="text-wonderland-muted leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your privacy
              rights, please contact us:
            </p>
            <div className="mt-4 text-wonderland-muted">
              <p><strong className="text-wonderland-text">Through the Looking Glass Groomery</strong></p>
              <p>Nuevo, CA (Riverside County)</p>
              <p>Email: kimmieserrati@gmail.com</p>
              <p>Instagram: @looknglass.groomery</p>
            </div>
          </section>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <Link
            href="/"
            className="text-alice-gold hover:text-alice-gold/80 transition-colors font-display"
          >
            ← Back to Wonderland
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
