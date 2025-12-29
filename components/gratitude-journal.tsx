"use client"
import React, { useState } from 'react'

type LineProps = {
  placeholder?: string
}

function BulletLine({ placeholder }: LineProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-3 w-3 rounded-full border border-gray-400/70 bg-gray-300/20" />
      <input
        type="text"
        placeholder={placeholder}
        className="flex-1 border-b border-gray-400/60 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  )
}

function Droplet({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onToggle}
      className={`inline-flex h-6 w-4 items-center justify-center rounded-sm transition ${
        checked ? 'text-blue-600' : 'text-gray-500'
      }`}
      title="Water intake"
    >
      {/* simple droplet */}
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 2c2.5 3.7 6 7.2 6 11.1A6 6 0 1 1 6 13.1C6 9.2 9.5 5.7 12 2z" />
      </svg>
    </button>
  )
}

function WeatherIcon({ label, icon, selected, onSelect }: { label: string; icon: React.ReactNode; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
        selected ? 'bg-gray-200 text-gray-700' : 'bg-transparent text-gray-500'
      }`}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  )
}

export default function GratitudeJournal() {
  const [droplets, setDroplets] = useState<boolean[]>(Array(9).fill(false))
  const [weather, setWeather] = useState<'sun' | 'cloud' | 'rain' | 'storm' | 'snow' | null>(null)

  function toggleDroplet(i: number) {
    setDroplets((d) => d.map((v, idx) => (idx === i ? !v : v)))
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border bg-[#f7f3e9] p-8 text-gray-700 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="text-3xl font-serif tracking-wide text-gray-700">GRATITUDE JOURNAL</div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>DATE:</span>
            <input type="text" className="min-w-[200px] border-b border-gray-400/60 bg-transparent px-1 py-0.5 outline-none" placeholder="YYYY-MM-DD" />
          </div>
          <div className="flex gap-4">
            {['S','M','T','W','T','F','S'].map((d) => (
              <span key={d} className="text-[11px] tracking-wide text-gray-600">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Grateful for */}
      <section className="mb-6">
        <div className="text-xs font-semibold tracking-wider text-gray-600">TODAY I'M GRATEFUL FOR</div>
        <div className="mt-3 space-y-3">
          <BulletLine placeholder="" />
          <BulletLine placeholder="" />
          <BulletLine placeholder="" />
        </div>
      </section>

      {/* Middle grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Water intake + Weather + Notes */}
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold tracking-wider text-gray-600">WATER INTAKE</div>
            <div className="mt-2 flex items-center gap-2">
              {droplets.map((checked, i) => (
                <Droplet key={i} checked={checked} onToggle={() => toggleDroplet(i)} />
              ))}
            </div>
            <div className="mt-1 flex gap-8 text-[11px] text-gray-500">
              <span>1L</span>
              <span>2L</span>
              <span>3L</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wider text-gray-600">WEATHER</div>
            <div className="mt-3 flex items-center gap-3">
              <WeatherIcon label="Sunny" selected={weather==='sun'} onSelect={() => setWeather('sun')} icon={<span>☀️</span>} />
              <WeatherIcon label="Cloudy" selected={weather==='cloud'} onSelect={() => setWeather('cloud')} icon={<span>☁️</span>} />
              <WeatherIcon label="Rain" selected={weather==='rain'} onSelect={() => setWeather('rain')} icon={<span>🌧️</span>} />
              <WeatherIcon label="Storm" selected={weather==='storm'} onSelect={() => setWeather('storm')} icon={<span>⛈️</span>} />
              <WeatherIcon label="Snow" selected={weather==='snow'} onSelect={() => setWeather('snow')} icon={<span>❄️</span>} />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wider text-gray-600">NOTES / REMINDERS</div>
            <textarea rows={9} className="mt-3 w-full resize-none rounded-md border border-gray-300 bg-white/60 p-3 text-sm outline-none" placeholder="Write your notes here" />
          </div>
        </div>

        {/* Right column: Affirmation + Proud of + Tomorrow */}
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold tracking-wider text-gray-600">TODAY'S AFFIRMATION</div>
            <div className="mt-3 space-y-3">
              <BulletLine />
              <BulletLine />
              <BulletLine />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wider text-gray-600">SOMETHING I'M PROUD OF</div>
            <div className="mt-3 space-y-3">
              <BulletLine />
              <BulletLine />
              <BulletLine />
              <BulletLine />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wider text-gray-600">TOMORROW I LOOK FORWARD TO</div>
            <div className="mt-3 space-y-3">
              <BulletLine />
              <BulletLine />
              <BulletLine />
              <BulletLine />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}