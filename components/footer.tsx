import Image from 'next/image'
import Link from 'next/link'
import { Github, Twitter, Linkedin } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-24">
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 to-fuchsia-600" />
      <div className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo.svg" alt="Logo" width={32} height={32} />
                <span className="text-lg font-semibold">Manifest Wishes Pro</span>
              </Link>
              <p className="mt-4 max-w-md text-sm text-gray-600">
                Visualize your goals, cultivate gratitude, and build habits that stick. A simple, beautiful hub synced with your Chrome extension.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li><Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-900">Pricing</Link></li>
                <li><a href="#" className="hover:text-gray-900">Chrome Extension</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><Link href="/contact" className="hover:text-gray-900">Contact</Link></li>
                <li><a href="#" className="hover:text-gray-900">Careers</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t pt-6">
            <p className="text-sm text-gray-600">© {year} Manifest Wishes Pro. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="GitHub" className="rounded-lg border p-2 text-gray-700 hover:bg-gray-50">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="rounded-lg border p-2 text-gray-700 hover:bg-gray-50">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="rounded-lg border p-2 text-gray-700 hover:bg-gray-50">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}