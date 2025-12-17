"use client"
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ id: string | number; email: string; name: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch current user from server using cookie (no localStorage)
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null
        const data = await res.json()
        return data.user ?? null
      })
      .then((u) => setUser(u))
      .catch(() => setUser(null))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    router.replace('/login')
  }
  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Logo" width={28} height={28} />
              <span className="text-base font-semibold">Manifest Wishes Pro</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            {user ? (
              <>
                <Link href="/dashboard/tasks" className="text-gray-700 hover:text-gray-900">Tasks</Link>
                <Link href="/dashboard/gratitude" className="text-gray-700 hover:text-gray-900">Gratitude</Link>
                <Link href="/dashboard/vision" className="text-gray-700 hover:text-gray-900">Vision Board</Link>
                <Link href="/dashboard/method-369" className="text-gray-700 hover:text-gray-900">369 Method</Link>
                <Link href="/dashboard/focus-timer" className="text-gray-700 hover:text-gray-900">Focus Timer</Link>
                <a
                  href="#"
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-gray-800 hover:bg-gray-100"
                  title="Add Chrome Extension"
                >
                  <Image src="/chrome-icon.svg" alt="Chrome" width={18} height={18} />
                  <span className="hidden sm:inline">Add Extension</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-gray-800 px-3 py-2 text-white shadow-sm hover:bg-gray-900"
                  title={`Logged in as ${user.name}`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="text-gray-700 hover:text-gray-900">Pricing</Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900">Contact</Link>
                <a
                  href="#"
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-gray-800 hover:bg-gray-100"
                  title="Add Chrome Extension"
                >
                  <Image src="/chrome-icon.svg" alt="Chrome" width={18} height={18} />
                  <span className="hidden sm:inline">Add Extension</span>
                </a>
                <Link href="/login" className="rounded-lg bg-gradient-to-tr from-purple-600 to-fuchsia-600 px-3 py-2 text-white shadow-sm hover:from-purple-700 hover:to-fuchsia-700">Login</Link>
              </>
            )}
          </nav>
          <button
            className="md:hidden rounded-lg border px-3 py-2 text-gray-800"
            aria-label="Toggle Menu"
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t bg-white/90">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/dashboard/tasks" className="py-2">Tasks</Link>
                <Link href="/dashboard/gratitude" className="py-2">Gratitude</Link>
                <Link href="/dashboard/vision" className="py-2">Vision Board</Link>
                <Link href="/dashboard/method-369" className="py-2">369 Method</Link>
                <Link href="/dashboard/focus-timer" className="py-2">Focus Timer</Link>
                <a href="#" className="py-2">Add Extension</a>
                <button onClick={handleLogout} className="py-2 text-left">Logout</button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="py-2">Pricing</Link>
                <Link href="/contact" className="py-2">Contact</Link>
                <a href="#" className="py-2">Add Extension</a>
                <Link href="/login" className="py-2">Login</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}