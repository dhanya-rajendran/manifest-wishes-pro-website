"use client"
import React, { useState } from 'react'
import Image from 'next/image'

type Slot = { id: string; url?: string }

const INITIAL_SLOTS: Slot[] = Array.from({ length: 14 }).map((_, i) => ({ id: `slot-${i + 1}` }))

export default function DreamCanvas() {
  const [title, setTitle] = useState('VISION BOARD')
  const [subtitle, setSubtitle] = useState("let's go all in !")
  const [slots, setSlots] = useState<Slot[]>(INITIAL_SLOTS)
  const [error, setError] = useState<string>('')

  async function uploadImage(file: File, idx: number) {
    setError('')
    const allowed = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Unsupported type. Use PNG/JPEG/WEBP')
      return
    }
    const max = 500 * 1024
    if (file.size > max) {
      setError('File too large. Max 500KB')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/vision', { method: 'POST', credentials: 'include', body: fd })
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}))
      setError(msg?.error || 'Upload failed')
      return
    }
    const data = await res.json()
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, url: data.url } : s)))
  }

  function clearSlot(idx: number) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { id: s.id } : s)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Dream Canvas</h2>
        <div className="flex items-center gap-2 text-xs text-gray-600"><span>Max image size: 500KB</span></div>
      </div>

      {/* Controls */}
      <div className="rounded border bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="Board Title" />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="Subtitle" />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      {/* Canvas */}
      <div className="rounded-2xl border bg-[#f7f3e9] p-6 shadow-sm">
        <div className="grid grid-cols-12 gap-3">
          {/* Collage ring: top row */}
          {slots.map((slot, idx) => (
            <div key={slot.id}
              className={
                // Create a collage layout by placing slots around center using col spans
                `relative ${
                  idx < 5
                    ? 'col-span-2'
                    : idx < 9
                    ? 'col-span-3'
                    : 'col-span-2'
                }`
              }
            >
              <div className="rounded bg-white p-1 shadow">
                {slot.url ? (
                  <div className="relative h-28">
                    <Image src={slot.url} alt="vision" fill sizes="(max-width: 768px) 100vw, 33vw" className="rounded object-cover" unoptimized />
                    <div className="absolute bottom-1 right-1">
                      <button onClick={() => clearSlot(idx)} className="rounded bg-white/80 px-2 py-0.5 text-[11px]">Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className="flex h-28 w-full cursor-pointer items-center justify-center rounded border border-dashed text-xs text-gray-600">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void uploadImage(f, idx)
                      }}
                    />
                    + Add Image
                  </label>
                )}
              </div>
            </div>
          ))}

          {/* Center area spanning multiple columns */}
          <div className="col-span-12 my-6">
            <div className="relative mx-auto max-w-3xl rounded-lg bg-[#efe7df] px-8 py-12 text-center">
              <div className="text-4xl font-serif tracking-wide text-gray-800">{title}</div>
              <div className="mt-3 text-lg italic text-gray-700">{subtitle}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}