"use client"
import Navbar from '@/components/navbar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FocusTimerProvider } from '@/components/FocusTimerProvider'
import { Toaster } from 'sonner'

function titleFromPath(pathname: string): string {
  // Normalize to remove trailing slashes
  const path = pathname.replace(/\/$/, '')
  if (path === '/dashboard') return 'Dashboard'
  if (path.startsWith('/dashboard/')) {
    const sub = path.slice('/dashboard/'.length)
    switch (sub) {
      case 'tasks':
        return 'Tasks'
      case 'gratitude':
        return 'Gratitude'
      case 'vision':
        return 'Vision Board'
      case 'method-369':
        return '369 Method'
      case 'focus-timer':
        return 'Focus Timer'
      default:
        return sub.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
  }
  return 'Dashboard'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const header = titleFromPath(pathname || '/dashboard')
  return (
    <div>
      <Navbar />
      <FocusTimerProvider>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{header}</h1>
          </div>
          {children}
        </main>
      </FocusTimerProvider>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}