"use client"
import { useEffect, useState } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import { useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, CalendarRange, Calendar, Heart, Plus, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/base-button'
import { Input } from '@/components/ui/base-input'

type Entry = { id: number; period: string; periodKey: string; payload: unknown; createdAt: string }

function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((v) => typeof v === 'string')
}

function normalizePayloadToItems(val: unknown): string[] {
  if (typeof val === 'string') {
    return val.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  }
  if (Array.isArray(val)) {
    return (val as unknown[])
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export default function GratitudePage() {
  const [period, setPeriod] = useState<'daily'|'weekly'|'monthly'>('daily')
  const [day, setDay] = useState<string>(new Date().toISOString().slice(0,10))
  const [weekStart, setWeekStart] = useState<string>(() => {
    const d = new Date(); const first = new Date(d); first.setDate(d.getDate() - d.getDay());
    return first.toISOString().slice(0,10)
  })
  const [month, setMonth] = useState<string>(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [periodKey, setPeriodKey] = useState<string>('')
  const [items, setItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [entry, setEntry] = useState<Entry | null>(null)

  useEffect(() => {
    setPeriodKey(computePeriodKey(period, { day, weekStart, month }))
  }, [period, day, weekStart, month])

  function computePeriodKey(p: 'daily'|'weekly'|'monthly', sel: { day: string; weekStart: string; month: string }) {
    if (p === 'daily') return sel.day
    if (p === 'weekly') {
      const first = new Date(sel.weekStart)
      const last = new Date(first)
      last.setDate(first.getDate() + 6)
      return `${first.toISOString().slice(0,10)}_${last.toISOString().slice(0,10)}`
    }
    return sel.month
  }

  async function load(signal?: AbortSignal) {
    try {
      setLoading(true)
      const params = new URLSearchParams({ period, periodKey })
      const res = await fetch(`/api/gratitude?${params.toString()}`, { credentials: 'include', signal })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setEntry(data.entry ?? null)
      const p = data.entry?.payload
      setItems(normalizePayloadToItems(p))
    } finally { setLoading(false) }
  }

  async function save() {
    const res = await fetch('/api/gratitude', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, periodKey, payload: items })
    })
    if (res.ok) await load()
  }

  function addItem() {
    const t = newItem.trim()
    if (!t) return
    setItems((prev) => Array.from(new Set([...prev, t])))
    setNewItem('')
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    // Defer loading to avoid synchronous setState in effect; add cleanup.
    const ac = new AbortController()
    const t = window.setTimeout(() => { void load(ac.signal) }, 0)
    return () => { ac.abort(); window.clearTimeout(t) }
  }, [period, periodKey])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="daily" value={period} onValueChange={(v) => setPeriod(v as 'daily'|'weekly'|'monthly')} className="text-sm text-muted-foreground">
          <TabsList variant="line">
            <TabsTrigger value="daily">
              <CalendarDays className="mr-2 h-4 w-4" /> Daily
            </TabsTrigger>
            <TabsTrigger value="weekly">
              <CalendarRange className="mr-2 h-4 w-4" /> Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <Calendar className="mr-2 h-4 w-4" /> Monthly
            </TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <DailyPicker day={day} setDay={setDay} />
          </TabsContent>
          <TabsContent value="weekly">
            <WeeklyPicker weekStart={weekStart} setWeekStart={setWeekStart} />
          </TabsContent>
          <TabsContent value="monthly">
            <MonthlyPicker month={month} setMonth={setMonth} />
          </TabsContent>
        </Tabs>
        <span className="ml-4 text-xs text-gray-600">Key: {periodKey}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
          <Heart className="h-5 w-5" />
        </span>
        <div>
          <div className="text-base font-semibold">Gratitude Journal</div>
          <div className="text-xs text-gray-600">Capture daily, weekly, or monthly appreciations</div>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Gratitude Items</div>
          <div className="text-xs text-gray-600">{items.length} items</div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
            placeholder="Add a gratitude item"
            className="flex-1"
          />
          <Button onClick={addItem} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add
          </Button>
          <Button onClick={save} variant="primary" className="inline-flex items-center gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {items.length === 0 ? (
            <div className="text-xs text-gray-600">No items yet.</div>
          ) : items.map((it, idx) => (
            <span
              key={`${it}-${idx}`}
              className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs shadow-sm hover:bg-gray-50"
            >
              <Heart className="h-3 w-3 text-pink-600" /> {it}
              <button
                onClick={() => removeItem(idx)}
                aria-label="Remove"
                className="inline-flex items-center justify-center rounded-full bg-red-50 px-2 py-0.5 text-red-600 hover:bg-red-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        {loading && <div className="mt-4 text-xs text-gray-600">Loading...</div>}
      </div>
    </div>
  )
}

function DailyPicker({ day, setDay }: { day: string; setDay: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const label = day ? format(new Date(day), 'yyyy-MM-dd') : 'Pick a date'
  return (
    <div ref={containerRef} className="relative">
      <button type="button" className="relative inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm pr-10 hover:bg-gray-50" onClick={() => setOpen(o => !o)}>
        <Calendar className="h-4 w-4 text-gray-600" />
        <span className="truncate">{label}</span>
        {day && (
          <span className="absolute right-2 inset-y-0 inline-flex items-center justify-center w-6 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setDay(''); setOpen(false) }} role="button" aria-label="Clear date">
            <X className="h-3 w-3" />
          </span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-2 rounded border bg-white p-2 shadow-lg">
          <DayPicker
            mode="single"
            selected={day ? new Date(day) : undefined}
            onSelect={(date) => {
              if (date) setDay(format(date, 'yyyy-MM-dd'))
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

function WeeklyPicker({ weekStart, setWeekStart }: { weekStart: string; setWeekStart: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const start = weekStart ? new Date(weekStart) : undefined
  const end = start ? addDays(start, 6) : undefined
  const label = start && end ? `${format(start, 'yyyy-MM-dd')} – ${format(end, 'yyyy-MM-dd')}` : 'Pick week'
  return (
    <div className="relative">
      <button type="button" className="relative inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm pr-10 hover:bg-gray-50" onClick={() => setOpen(o => !o)}>
        <Calendar className="h-4 w-4 text-gray-600" />
        <span className="truncate">{label}</span>
        {weekStart && (
          <span className="absolute right-2 inset-y-0 inline-flex items-center justify-center w-6 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setWeekStart(''); setOpen(false) }} role="button" aria-label="Clear week">
            <X className="h-3 w-3" />
          </span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-2 rounded border bg-white p-2 shadow-lg">
          <DayPicker
            mode="single"
            selected={start}
            onSelect={(date) => {
              if (date) {
                const s = startOfWeek(date, { weekStartsOn: 0 })
                setWeekStart(format(s, 'yyyy-MM-dd'))
              }
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

function MonthlyPicker({ month, setMonth }: { month: string; setMonth: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = month ? new Date(`${month}-01`) : undefined
  const label = selected ? format(selected, 'yyyy-MM') : 'Pick month'
  return (
    <div className="relative">
      <button type="button" className="relative inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm pr-10 hover:bg-gray-50" onClick={() => setOpen(o => !o)}>
        <Calendar className="h-4 w-4 text-gray-600" />
        <span className="truncate">{label}</span>
        {month && (
          <span className="absolute right-2 inset-y-0 inline-flex items-center justify-center w-6 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setMonth(''); setOpen(false) }} role="button" aria-label="Clear month">
            <X className="h-3 w-3" />
          </span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-2 rounded border bg-white p-2 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onMonthChange={(date) => {
              if (date) setMonth(format(date, 'yyyy-MM'))
            }}
            onSelect={(date) => {
              if (date) setMonth(format(date, 'yyyy-MM'))
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}