import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manifest Wishes Pro',
  description: 'Track goals and gratitude with a beautiful UX.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased bg-white text-gray-900">{children}</body>
    </html>
  )
}