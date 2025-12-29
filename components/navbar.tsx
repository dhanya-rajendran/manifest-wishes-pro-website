"use client"
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from './theme-toggle'
import ChromeBanner from './chrome-banner'
import { X } from 'lucide-react'
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSeparator,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
  AccordionMenuIndicator,
} from '@/components/ui/accordion-menu'
import {
  ClipboardIcon,
  HomeIcon,
  FileTextIcon,
  LayersIcon,
  HeartIcon,
  EyeOpenIcon,
  MagicWandIcon,
  ClockIcon,
  CalendarIcon,
} from '@radix-ui/react-icons'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ id: string | number; email: string; name: string } | null>(null)
  const router = useRouter()
  const pathname = usePathname()

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
    <>
      <ChromeBanner />
      <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Logo" width={80} height={60} />
              {/* <span className="text-base font-semibold">Manifest Wishes Pro</span> */}
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
                {/* Add Extension moved to top banner */}
                <div className="flex items-center">
                  <ThemeToggle />
                </div>
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
                {/* Add Extension moved to top banner */}
                <div className="flex items-center">
                  <ThemeToggle />
                </div>
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
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 z-[70] h-full w-80 max-w-[85vw] bg-white shadow-xl md:hidden">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Image src="/logo.svg" alt="Logo" width={22} height={22} />
                <span className="text-sm font-semibold">Menu</span>
              </div>
              <button
                aria-label="Close menu"
                className="rounded-md p-2 hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-gray-600">Theme</span>
                <ThemeToggle />
              </div>
              {user ? (
                <div className="overflow-hidden border border-border rounded-md p-2">
                  <AccordionMenu
                    type="multiple"
                    defaultValue={["/dashboard/tasks"]}
                    selectedValue={pathname || ''}
                    matchPath={(path: string) => {
                      const groupPrefixes = ['/dashboard/tasks']
                      if (groupPrefixes.includes(path)) {
                        return (pathname || '').startsWith(path)
                      }
                      return path === pathname
                    }}
                    onItemClick={(value) => {
                      if (value && value.startsWith('/')) {
                        router.push(value)
                        setOpen(false)
                      }
                    }}
                    classNames={{ separator: '-mx-2 mb-2.5' }}
                  >
                    <AccordionMenuLabel>
                      <span className="text-sm font-semibold">Menu Items</span>
                    </AccordionMenuLabel>
                    <AccordionMenuSeparator />

                    <AccordionMenuGroup>
                      <AccordionMenuItem value="/dashboard">
                        <HomeIcon />
                        <span>Dashboard</span>
                      </AccordionMenuItem>

                      <AccordionMenuSub value="/dashboard/tasks">
                        <AccordionMenuSubTrigger value="/dashboard/tasks">
                          <ClipboardIcon />
                          <span>Tasks</span>
                          <AccordionMenuIndicator />
                        </AccordionMenuSubTrigger>
                        <AccordionMenuSubContent type="single" collapsible parentValue="/dashboard/tasks">
                          <AccordionMenuGroup>
                            <AccordionMenuItem value="/dashboard/tasks">
                              <FileTextIcon />
                              <span>Table View</span>
                            </AccordionMenuItem>
                            <AccordionMenuItem value="/dashboard/tasks/kanban">
                              <LayersIcon />
                              <span>Kanban View</span>
                            </AccordionMenuItem>
                            <AccordionMenuItem value="/dashboard/tasks/calendar">
                              <CalendarIcon />
                              <span>Calendar View</span>
                            </AccordionMenuItem>
                          </AccordionMenuGroup>
                        </AccordionMenuSubContent>
                      </AccordionMenuSub>

                      <AccordionMenuItem value="/dashboard/gratitude">
                        <HeartIcon />
                        <span>Gratitude</span>
                      </AccordionMenuItem>
                      <AccordionMenuItem value="/dashboard/vision">
                        <EyeOpenIcon />
                        <span>Vision Board</span>
                      </AccordionMenuItem>
                      <AccordionMenuItem value="/dashboard/method-369">
                        <MagicWandIcon />
                        <span>369 Method</span>
                      </AccordionMenuItem>
                      <AccordionMenuItem value="/dashboard/focus-timer">
                        <ClockIcon />
                        <span>Focus Timer</span>
                      </AccordionMenuItem>
                    </AccordionMenuGroup>
                  </AccordionMenu>

                  <div className="mt-3 grid grid-cols-1 gap-1">
                    {/* Add Extension moved to top banner */}
                    <button onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100">Logout</button>
                  </div>
                </div>
              ) : (
                <nav className="grid grid-cols-1 gap-1">
                  <Link href="/pricing" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-gray-100">Pricing</Link>
                  <Link href="/contact" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-gray-100">Contact</Link>
                  {/* Add Extension moved to top banner */}
                  <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-gray-100">Login</Link>
                </nav>
              )}
            </div>
          </div>
        </>
      )}
      </header>
    </>
  )
}