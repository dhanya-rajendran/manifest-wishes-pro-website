"use client"
import { useEffect, useState } from 'react'

function getExtensionUrl(): string | null {
  if (typeof window === 'undefined') return null
  const url = process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL || ''
  return url || null
}

export default function ChromeBanner() {
  const [installed, setInstalled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chromeExtensionInstalled') === 'true'
    } catch {
      return false
    }
  })
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chromeBannerDismissed') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    // Optional: extension can postMessage({ mwpExtensionInstalled: true }) to the page
    function onMessage(e: MessageEvent) {
      if (e?.data && (e.data.mwpExtensionInstalled === true || e.data.__MWP_EXT_INSTALLED__ === true)) {
        setInstalled(true)
        try { localStorage.setItem('chromeExtensionInstalled', 'true') } catch { void 0 }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const extUrl = getExtensionUrl() || '#'
  const hidden = installed || dismissed

  if (hidden) return null

  return (
    <div className="relative w-screen bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white shadow-sm">
      <div className="relative w-screen">
        <div className="flex h-10 items-center justify-center">
          <div className="flex items-center gap-[10px]">
            <span className="truncate text-center font-semibold text-[12px] md:text-sm">Add our Chrome extension for quick capture, handy shortcuts, and faster flow.</span>
            <a
              href={extUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-gray-900 shadow-sm hover:bg-white"
              aria-label="Add Chrome extension"
            >
              <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48" width="18" height="18" className="shrink-0">
                <defs>
                  <linearGradient id="a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#d93025" />
                    <stop offset="1" stopColor="#ea4335" />
                  </linearGradient>
                  <linearGradient id="b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#fcc934" />
                    <stop offset="1" stopColor="#fbbc04" />
                  </linearGradient>
                  <linearGradient id="c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#1e8e3e" />
                    <stop offset="1" stopColor="#34a853" />
                  </linearGradient>
                </defs>
                <circle cx="24" cy="23.9947" r="12" style={{ fill: '#fff' }} />
                <path d="M3.2154,36A24,24,0,1,0,12,3.2154,24,24,0,0,0,3.2154,36ZM34.3923,18A12,12,0,1,1,18,13.6077,12,12,0,0,1,34.3923,18Z" style={{ fill: 'none' }} />
                <path d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z" style={{ fill: 'url(#a)' }} />
                <circle cx="24" cy="24" r="9.5" style={{ fill: '#1a73e8' }} />
                <path d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z" style={{ fill: 'url(#b)' }} />
                <path d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z" style={{ fill: 'url(#c)' }} />
              </svg>
              Add to Chrome
            </a>
          </div>
          <button
            type="button"
          className="absolute right-[20px] top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/90 hover:bg-white/10"
            onClick={() => { setDismissed(true); try { localStorage.setItem('chromeBannerDismissed', 'true') } catch { void 0 } }}
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}