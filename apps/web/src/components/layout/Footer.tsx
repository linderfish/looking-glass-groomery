// apps/web/src/components/layout/Footer.tsx
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-alice-purple/20 bg-wonderland-card/50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/wonderland" className="flex items-center gap-2 mb-4">
              <span className="text-3xl">😼</span>
              <span className="font-display text-xl text-gradient">
                Looking Glass
              </span>
            </Link>
            <p className="text-sm text-wonderland-muted">
              Where every pet becomes a work of art. Professional grooming with
              a touch of magic in Nuevo, CA.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg text-wonderland-text mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { href: '/wonderland/services', label: 'Services' },
                { href: '/wonderland/gallery', label: 'Gallery' },
                { href: '/wonderland/why-kimmie', label: 'Why Kimmie' },
                { href: '/wonderland/shelter-angels', label: 'Shelter Angels' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-wonderland-muted hover:text-alice-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg text-wonderland-text mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-wonderland-muted">
              <li>📍 Nuevo, CA</li>
              <li>📧 kimmieserrati@gmail.com</li>
              <li>📱 Book via chat or Instagram DM</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display text-lg text-wonderland-text mb-4">
              Follow the Magic
            </h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/looknglass.groomery"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-wonderland-bg border border-alice-purple/30 flex items-center justify-center hover:border-alice-purple transition-colors"
              >
                📸
              </a>
              <a
                href="https://facebook.com/lookingglassgroomery"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-wonderland-bg border border-alice-purple/30 flex items-center justify-center hover:border-alice-purple transition-colors"
              >
                👍
              </a>
              <a
                href="https://tiktok.com/@lookingglassgroomery"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-wonderland-bg border border-alice-purple/30 flex items-center justify-center hover:border-alice-purple transition-colors"
              >
                🎵
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-alice-purple/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-wonderland-muted">
            © {new Date().getFullYear()} Through the Looking Glass Groomery. All
            rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-wonderland-muted">
            <Link href="/privacy" className="hover:text-alice-gold transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-alice-gold transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
