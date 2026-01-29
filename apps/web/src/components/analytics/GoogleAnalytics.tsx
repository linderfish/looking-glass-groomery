// apps/web/src/components/analytics/GoogleAnalytics.tsx
// GA4 + Google Search Console verification
// Set NEXT_PUBLIC_GA_MEASUREMENT_ID in .env.local to enable
// Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in .env.local for Search Console

import Script from 'next/script'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            send_page_view: true,
          });
        `}
      </Script>
    </>
  )
}

export function GoogleSiteVerification() {
  const verificationId = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  if (!verificationId) return null

  return (
    <meta name="google-site-verification" content={verificationId} />
  )
}
