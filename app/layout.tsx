import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manifest Wishes Pro',
  description: 'Track goals and gratitude with a beautiful UX.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-fancy">
      <body className="min-h-dvh antialiased bg-background text-foreground">{children}</body>
    </html>
  )
}