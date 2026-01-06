// apps/web/src/app/terms/page.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function TermsPage() {
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
            <span className="text-gradient">Terms of</span>{' '}
            <span className="text-psychedelic">Service</span>
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
            <h2 className="font-display text-2xl text-alice-gold mb-4">Agreement to Terms</h2>
            <p className="text-wonderland-muted leading-relaxed">
              By booking an appointment or using services provided by Through the Looking Glass
              Groomery (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Services</h2>
            <p className="text-wonderland-muted leading-relaxed">
              We provide professional pet grooming services including bathing, haircuts, nail
              trimming, ear cleaning, creative coloring, and related pet care services. All
              services are provided by appointment only at our location in Nuevo, California.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Booking & Appointments</h2>
            <ul className="text-wonderland-muted space-y-3 ml-4">
              <li>• <strong className="text-wonderland-text">Scheduling:</strong> Appointments can be booked online, via Instagram DM, text, or email. Confirmation will be sent via your preferred contact method.</li>
              <li>• <strong className="text-wonderland-text">Arrival:</strong> Please arrive on time. Late arrivals may result in shortened service time or rescheduling.</li>
              <li>• <strong className="text-wonderland-text">Duration:</strong> Grooming appointments typically last 2-4 hours depending on breed, coat condition, and services requested.</li>
              <li>• <strong className="text-wonderland-text">Pick-up:</strong> Please pick up your pet promptly at the agreed time. Extended stays may incur additional fees.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Cancellation Policy</h2>
            <ul className="text-wonderland-muted space-y-3 ml-4">
              <li>• <strong className="text-wonderland-text">24+ Hours Notice:</strong> Full refund or free reschedule</li>
              <li>• <strong className="text-wonderland-text">Less Than 24 Hours:</strong> 50% cancellation fee may apply</li>
              <li>• <strong className="text-wonderland-text">No-Shows:</strong> Full service fee may be charged; future appointments may require a deposit</li>
              <li>• <strong className="text-wonderland-text">Emergencies:</strong> We understand life happens! Contact us as soon as possible and we&apos;ll work with you.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Pet Requirements</h2>
            <ul className="text-wonderland-muted space-y-3 ml-4">
              <li>• <strong className="text-wonderland-text">Vaccinations:</strong> Proof of current rabies vaccination is required for all pets. We strongly recommend all core vaccinations be up to date.</li>
              <li>• <strong className="text-wonderland-text">Health:</strong> Pets must be in good health. Please inform us of any medical conditions, allergies, skin issues, or recent surgeries.</li>
              <li>• <strong className="text-wonderland-text">Parasites:</strong> Pets must be free of fleas and ticks. If parasites are discovered, a flea bath will be required at additional cost.</li>
              <li>• <strong className="text-wonderland-text">Behavior:</strong> Please disclose any history of aggression, biting, or anxiety. We reserve the right to refuse service if a pet poses a safety risk.</li>
              <li>• <strong className="text-wonderland-text">Age:</strong> Puppies must be at least 12 weeks old and have completed their initial vaccination series.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Matted Coats</h2>
            <p className="text-wonderland-muted leading-relaxed mb-4">
              Severely matted coats require extra time and care. In cases of extreme matting:
            </p>
            <ul className="text-wonderland-muted space-y-2 ml-4">
              <li>• Additional de-matting fees may apply</li>
              <li>• We may recommend a &quot;humanitarian shave&quot; for your pet&apos;s comfort and safety</li>
              <li>• Shaving matted coats may reveal underlying skin issues not visible beforehand</li>
              <li>• We will discuss options with you before proceeding</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Creative Coloring</h2>
            <p className="text-wonderland-muted leading-relaxed mb-4">
              Our creative coloring services use only OPAWZ-certified pet-safe, non-toxic dyes. Please note:
            </p>
            <ul className="text-wonderland-muted space-y-2 ml-4">
              <li>• Colors work best on light-colored or white fur</li>
              <li>• Results may vary based on coat type and condition</li>
              <li>• Colors are semi-permanent and will fade over time (typically 4-8 weeks)</li>
              <li>• A patch test may be recommended for pets with sensitive skin</li>
              <li>• Color applications require an extended appointment time</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Payment</h2>
            <ul className="text-wonderland-muted space-y-3 ml-4">
              <li>• <strong className="text-wonderland-text">Methods:</strong> We accept cash, credit/debit cards, Venmo, and Zelle</li>
              <li>• <strong className="text-wonderland-text">When Due:</strong> Payment is due at the time of service unless otherwise arranged</li>
              <li>• <strong className="text-wonderland-text">Deposits:</strong> A deposit may be required for new clients, creative services, or after missed appointments</li>
              <li>• <strong className="text-wonderland-text">Pricing:</strong> Final pricing may vary based on coat condition, size, and time required</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Photo & Media Consent</h2>
            <p className="text-wonderland-muted leading-relaxed">
              By using our services, you grant us permission to photograph your pet and use these
              images on our website, social media accounts, and marketing materials unless you
              specifically opt out. You may opt out at any time by notifying us in writing or
              verbally before your appointment. We love showing off our work, but your privacy
              preferences always come first!
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Liability & Assumption of Risk</h2>
            <p className="text-wonderland-muted leading-relaxed mb-4">
              While we take every precaution to ensure your pet&apos;s safety and comfort:
            </p>
            <ul className="text-wonderland-muted space-y-2 ml-4">
              <li>• Grooming involves inherent risks including nicks, cuts, and stress</li>
              <li>• Pre-existing conditions may be discovered or aggravated during grooming</li>
              <li>• We are not responsible for irritation from products, clipper sensitivity, or reactions to grooming in pets with underlying conditions</li>
              <li>• By using our services, you acknowledge these risks and agree to hold us harmless except in cases of gross negligence</li>
            </ul>
            <p className="text-wonderland-muted leading-relaxed mt-4">
              We will immediately notify you of any concerns or incidents that occur during grooming.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Emergency Care</h2>
            <p className="text-wonderland-muted leading-relaxed">
              In the unlikely event of a medical emergency during grooming, we will attempt to
              contact you immediately. If we cannot reach you, we reserve the right to seek
              emergency veterinary care for your pet. You agree to be responsible for any
              emergency veterinary costs incurred.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Right to Refuse Service</h2>
            <p className="text-wonderland-muted leading-relaxed">
              We reserve the right to refuse service to any pet that poses a safety risk to
              themselves, our staff, or other animals. This includes pets with aggressive behavior,
              contagious conditions, or severe matting that would cause undue suffering. If we
              must stop a service in progress for safety reasons, you will be charged for the
              work completed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Satisfaction Guarantee</h2>
            <p className="text-wonderland-muted leading-relaxed">
              Your satisfaction is important to us! If you&apos;re not happy with any aspect of your
              pet&apos;s groom, please contact us within 48 hours and we&apos;ll make it right. We may
              offer a complimentary touch-up, partial refund, or credit toward future services
              at our discretion.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Changes to Terms</h2>
            <p className="text-wonderland-muted leading-relaxed">
              We may update these Terms of Service from time to time. Continued use of our
              services after changes constitutes acceptance of the updated terms. We encourage
              you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Governing Law</h2>
            <p className="text-wonderland-muted leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the
              laws of the State of California, without regard to its conflict of law provisions.
              Any disputes arising from these terms shall be resolved in the courts of Riverside
              County, California.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-alice-gold mb-4">Contact Us</h2>
            <p className="text-wonderland-muted leading-relaxed">
              Questions about these Terms of Service? Reach out to us:
            </p>
            <div className="mt-4 text-wonderland-muted">
              <p><strong className="text-wonderland-text">Through the Looking Glass Groomery</strong></p>
              <p>Nuevo, CA (Riverside County)</p>
              <p>Email: hello@throughthelookingglass.pet</p>
              <p>Instagram: @throughthelookingglass</p>
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
