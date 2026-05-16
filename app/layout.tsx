/**
 * Корневой layout приложения.
 * Здесь — html/body, провайдер темы, шрифты, skip-link.
 * Header/Footer публичного сайта живут в app/(site)/layout.tsx,
 * админ-панель — в app/admin/layout.tsx (со своим shell).
 */
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { SITE } from '@/lib/constants'
import { env } from '@/lib/env'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: SITE.name,
    template: `%s — ${SITE.titleSuffix}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  generator: 'Next.js',
  openGraph: {
    type: 'website',
    locale: SITE.defaultLocale,
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.name,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={SITE.htmlLang}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
