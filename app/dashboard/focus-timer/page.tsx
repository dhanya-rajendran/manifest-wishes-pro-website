"use client"
export const dynamic = 'force-dynamic'
import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/base-button'
import { Input } from '@/components/ui/base-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Timer, Coffee, PauseCircle, PlayCircle, Volume2, VolumeX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Toast from '@/components/ui/toast'
import { useFocusTimer } from '@/components/FocusTimerProvider'
import { Slider, SliderThumb } from '@/components/ui/slider'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header'
import { DataGridPagination } from '@/components/ui/data-grid-pagination'
import { ColumnDef, ExpandedState, getCoreRowModel, getPaginationRowModel, PaginationState, useReactTable, type Row, getSortedRowModel, SortingState } from '@tanstack/react-table'
import { Filters, createFilter, type Filter, type FilterFieldConfig } from '@/components/ui/filters'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type TimerMode = 'focus' | 'break'
type FocusSession = {
  id: string
  startAt: string
  endAt: string | null
  plannedMinutes: number | null
  durationMinutes: number | null
  mode: TimerMode
  note: string | null
  targetEnd: string | null
  pauses: { id: string; startAt: string; endAt: string | null }[]
  stops: { id: string; stopAt: string }[]
}
interface ApiResponse { ok: boolean; sessions: FocusSession[]; total: number }

// Shared helpers and types (hoisted to module scope)
function fmt(dt: string | null) {
  if (!dt) return '-'
  try { return new Date(dt).toLocaleString() } catch { return dt ?? '-' }
}
type EventRow = { id: string; type: 'Paused' | 'Resumed' | 'Stopped'; at: string }

// Sub-table component for expanded events (hoisted out of FocusTimerContent)
function SessionEventsSubTable({ items }: { items: EventRow[] }) {
  const [subPagination, setSubPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 })
  const [subSorting, setSubSorting] = useState<SortingState>([])
  const subColumns = useMemo<ColumnDef<EventRow>[]>(() => [
    { accessorKey: 'type', header: ({ column }) => <DataGridColumnHeader title="Event" column={column} />, cell: ({ row }) => {
        const t = row.original.type
        const variant: 'secondary' | 'primary' | 'destructive' = t === 'Paused' ? 'secondary' : t === 'Resumed' ? 'primary' : 'destructive'
        return <Badge variant={variant} appearance="light">{t}</Badge>
      }, enableSorting: true, size: 140 },
    { accessorKey: 'at', header: ({ column }) => <DataGridColumnHeader title="Timestamp" column={column} />, cell: ({ row }) => fmt(row.original.at), enableSorting: true, size: 220 },
  ], [])
  // eslint-disable-next-line react-hooks/incompatible-library
  const subTable = useReactTable({ data: items, columns: subColumns, pageCount: Math.ceil(items.length / subPagination.pageSize), state: { sorting: subSorting, pagination: subPagination }, onSortingChange: setSubSorting, onPaginationChange: setSubPagination, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), getRowId: (row: EventRow) => row.id })
  return (
    <div className="bg-muted/30 p-3">
      <DataGrid table={subTable} recordCount={items.length} tableLayout={{ cellBorder: true, rowBorder: true, headerBackground: true, headerBorder: true }}>
        <div className="w-full space-y-2.5">
          <div className="bg-card rounded-lg border border-muted-foreground/20">
            <DataGridContainer>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </DataGridContainer>
          </div>
          <DataGridPagination className="pb-1.5" />
        </div>
      </DataGrid>
    </div>
  )
}

function FocusTimerContent() {
  const { running, paused, mode, durationMin, remaining, note, restoring, setNote, setDurationMin, setMode, start, pause, resume, stopAndSave } = useFocusTimer()
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  // Recent Sessions filters and table state
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [filters, setFilters] = useState<Filter[]>([])
  const [data, setData] = useState<FocusSession[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loadingRecent, setLoadingRecent] = useState<boolean>(false)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  // Filters configuration
  const fields: FilterFieldConfig[] = [
    { key: 'mode', label: 'Type', type: 'select', className: 'w-[220px]', options: [ { value: 'focus', label: 'Focus' }, { value: 'break', label: 'Break' } ] },
    { key: 'createdAt', label: 'Created', type: 'dateRange', className: 'w-[360px]' },
  ]

  // Helpers
  const buildEventRows = useCallback((sess: FocusSession): EventRow[] => {
    const events: EventRow[] = []
    for (const p of sess.pauses ?? []) {
      events.push({ id: `pause-${p.id}`, type: 'Paused', at: p.startAt })
      if (p.endAt) events.push({ id: `resume-${p.id}`, type: 'Resumed', at: p.endAt })
    }
    for (const s of sess.stops ?? []) { events.push({ id: `stop-${s.id}`, type: 'Stopped', at: s.stopAt }) }
    return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  }, [])


  // Main grid columns and table
  const columns = useMemo<ColumnDef<FocusSession, unknown>[]>(() => [
    { id: 'expand', header: () => null, cell: ({ row }) => (
      row.getCanExpand() ? (
        <span
          role="button"
          onClick={row.getToggleExpandedHandler()}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer select-none"
          aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
          title={row.getIsExpanded() ? 'Collapse' : 'Expand'}
        >
          [{row.getIsExpanded() ? '-' : '+'}]
        </span>
      ) : null
    ), size: 40, enableSorting: false, meta: { expandedContent: (sess: FocusSession) => <SessionEventsSubTable items={buildEventRows(sess)} />, cellClassName: 'text-center' } },
    { accessorKey: 'mode', header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />, cell: ({ row }) => { const m: TimerMode = row.original.mode; const Icon = m === 'focus' ? Timer : Coffee; const variant = m === 'focus' ? 'primary' : 'secondary'; return (<Badge variant={variant as 'primary' | 'secondary'} appearance="light" className="gap-1"><Icon className="h-3.5 w-3.5" /> {m === 'focus' ? 'Focus' : 'Break'}</Badge>) }, enableSorting: true, size: 120 },
    { accessorKey: 'startAt', header: ({ column }) => <DataGridColumnHeader title="Created" column={column} />, cell: ({ row }) => fmt(row.original.startAt), enableSorting: true, size: 220 },
    { accessorKey: 'endAt', header: ({ column }) => <DataGridColumnHeader title="Ended" column={column} />, cell: ({ row }) => fmt(row.original.endAt), enableSorting: true, size: 220 },
    { accessorKey: 'plannedMinutes', header: ({ column }) => <DataGridColumnHeader title="Planned" column={column} />, cell: ({ row }) => { const v = row.original.plannedMinutes; return v ? `${v}m` : '-' }, enableSorting: true, size: 110 },
    { accessorKey: 'note', header: ({ column }) => <DataGridColumnHeader title="Note" column={column} />, cell: ({ row }) => <span className="truncate inline-block max-w-[280px]">{row.original.note || '-'}</span>, enableSorting: false, size: 240 },
    { id: 'status', header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />, cell: ({ row }) => { const s = row.original; const isRunning = !!s.targetEnd && !s.endAt; const isPaused = !s.targetEnd && !s.endAt; const isStopped = !!s.endAt; if (isRunning) return <Badge variant="success" appearance="light" className="gap-1"><PlayCircle className="h-3.5 w-3.5" /> Running</Badge>; if (isPaused) return <Badge variant="warning" appearance="light" className="gap-1"><PauseCircle className="h-3.5 w-3.5" /> Paused</Badge>; if (isStopped) return <Badge variant="destructive" appearance="light" className="gap-1">Stopped</Badge>; return <Badge variant="outline">-</Badge> }, enableSorting: false, size: 140 },
    // removed actions button column; expand is now a simple [+] in the first column
  ], [buildEventRows])
  const canExpand = (row: Row<FocusSession>) => { const sess = row.original; const hasPauses = Array.isArray(sess.pauses) && sess.pauses.length > 0; const hasStops = Array.isArray(sess.stops) && sess.stops.length > 0; return hasPauses || hasStops }
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil((total || 0) / pagination.pageSize),
    state: { pagination, expanded, sorting },
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: (row) => canExpand(row),
    getRowId: (row) => row.id,
  })

  // Data fetch
  const fetchData = useCallback(async () => {
    setLoadingRecent(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.pageIndex + 1))
      params.set('limit', String(pagination.pageSize))
      for (const f of filters) {
        if (f.key === 'mode' && (f.op === 'is' || f.op === 'equals')) {
          const v = String(f.values[0] ?? '')
          if (v) params.set('mode', v)
        } else if (f.key === 'createdAt' && f.op === 'between') {
          const from = String(f.values[0] ?? '')
          const to = String(f.values[1] ?? '')
          if (from) params.set('createdFrom', from)
          if (to) params.set('createdTo', to)
        }
      }
      const qsEncoded = params.toString()
      const qsPretty = qsEncoded.replace(/%2C/g, ',')
      router.replace(`${pathname}?${qsPretty}`)
      const res = await fetch(`/api/timer?${qsEncoded}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load')
      const json: ApiResponse = await res.json()
      setData(json.sessions)
      setTotal(json.total)
    } finally {
      setLoadingRecent(false)
    }
  }, [filters, pagination.pageIndex, pagination.pageSize, router, pathname])
  useEffect(() => { void fetchData() }, [fetchData])
  useEffect(() => {
    if (!searchParams) return
    const next: Filter[] = []
    const mode = searchParams.get('mode')
    const createdFrom = searchParams.get('createdFrom')
    const createdTo = searchParams.get('createdTo')
    if (mode) next.push(createFilter('mode', 'is', [mode]))
    if (createdFrom || createdTo) next.push(createFilter('createdAt', 'between', [createdFrom ?? '', createdTo ?? '']))
    setFilters(next)
  }, [searchParams])

  async function handleStopSave() {
    // Stop any playing audio when stopping the timer
    try {
      const el = audioRef.current
      if (el) {
        el.pause()
        el.currentTime = 0
      }
    } catch { void 0 }
    await stopAndSave()
    setToast({ message: 'Session saved', type: 'success' })
    // Refresh recent grid after saving
    await fetchData()
  }

  const mm = Math.floor(remaining / 60000)
  const ss = Math.floor((remaining % 60000) / 1000)

  // Sound on start
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const didAutoPlayOnMountRef = useRef<boolean>(false)
  const [soundUnlockNeeded, setSoundUnlockNeeded] = useState<boolean>(false)
  useEffect(() => {
    try {
      const v = typeof window !== 'undefined' ? window.localStorage.getItem('focus-timer-sound') : null
      if (v === 'off') setSoundEnabled(false)
    } catch { void 0 }
  }, [])
  useEffect(() => {
    try { window.localStorage.setItem('focus-timer-sound', soundEnabled ? 'on' : 'off') } catch { void 0 }
  }, [soundEnabled])
  // React to mute/unmute: ensure audio element reflects the state
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    try {
      if (!soundEnabled) {
        el.pause()
        el.currentTime = 0
        el.muted = true
        setSoundUnlockNeeded(false)
      } else {
        el.muted = false
        // If unmuting while the timer is running and not paused, resume audio
        if (running && !paused) {
          const p = el.play()
          if (p && typeof (p as Promise<void>).then === 'function') {
            void (p as Promise<void>).then(() => setSoundUnlockNeeded(false)).catch(() => setSoundUnlockNeeded(true))
          }
        }
      }
    } catch { void 0 }
  }, [soundEnabled, running, paused])
  const playAffirmation = useCallback(() => {
    const el = audioRef.current
    if (!el || !soundEnabled) return
    try {
      el.currentTime = 0
      const p = el.play()
      if (p && typeof (p as Promise<void>).then === 'function') {
        void (p as Promise<void>).then(() => setSoundUnlockNeeded(false)).catch(() => setSoundUnlockNeeded(true))
      }
    } catch { void 0 }
  }, [soundEnabled])
  const stopAffirmation = useCallback((reset: boolean = true) => {
    const el = audioRef.current
    if (!el) return
    try {
      el.pause()
      if (reset) el.currentTime = 0
    } catch { void 0 }
  }, [])

  // Ensure audio is stopped when timer is paused or stopped
  useEffect(() => {
    if (paused || !running) {
      stopAffirmation(true)
    }
  }, [paused, running, stopAffirmation])

  // On refresh (initial hydration), if an active running session exists and is not paused, play audio once
  useEffect(() => {
    if (didAutoPlayOnMountRef.current) return
    if (running && !paused) {
      playAffirmation()
      didAutoPlayOnMountRef.current = true
    }
  }, [running, paused, playAffirmation])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <Timer className="h-5 w-5" />
        </span>
        <div>
          <div className="text-base font-semibold">Focus Timer</div>
          <div className="text-xs text-gray-600">Run focused sessions and restorative breaks</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'focus'|'break')} className="text-sm text-muted-foreground">
          <TabsList variant="line">
            <TabsTrigger value="focus">
              <Timer className="mr-2 h-4 w-4" /> Focus
            </TabsTrigger>
            <TabsTrigger value="break">
              <Coffee className="mr-2 h-4 w-4" /> Break
            </TabsTrigger>
          </TabsList>
          <TabsContent value="focus" />
          <TabsContent value="break" />
        </Tabs>
      </div>
      <div className="relative rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-5 md:p-6 shadow-sm">
        {/* Volume toggle at top-right */}
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" aria-label={soundEnabled ? 'Mute start sound' : 'Unmute start sound'} onClick={() => setSoundEnabled((v) => !v)} className="rounded-full">
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>

        {/* Responsive grid: show timer first on mobile (order-1), form second; 9/3 on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:min-h-[220px]">
          {/* Timer values (3 columns on md+, order-right, centered both axes) */}
          <div className="order-1 md:order-2 md:col-span-3 md:flex md:flex-col md:justify-center md:items-center md:border-l md:border-indigo-100 md:pl-6">
            {restoring ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center md:justify-center">
                  <Skeleton className="h-12 w-40 md:w-44" />
                </div>
                <div className="flex items-center justify-center md:justify-center">
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center md:justify-center">
                  <div className="text-5xl font-bold tabular-nums tracking-tight">
                    {String(mm).padStart(2,'0')}:{String(ss).padStart(2,'0')}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center md:justify-center">
                  {paused && (
                    <Badge variant="warning" appearance="light" className="gap-1">
                      <PauseCircle className="h-3.5 w-3.5" /> Paused
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Form entries (9 columns on md+, order-left) */}
          <div className="order-2 md:order-1 md:col-span-9">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="uppercase tracking-wide">{mode === 'focus' ? 'Focus Length' : 'Break Length'}</span>
              <span className="font-medium text-gray-700">{durationMin} min</span>
            </div>
            <Slider
              value={[durationMin]}
              onValueChange={(v) => { const n = v[0]; if (typeof n === 'number') setDurationMin(Math.max(5, Math.min(120, Math.round(n)))) }}
              min={5}
              max={120}
              step={5}
              disabled={restoring || (running && !paused)}
              aria-label="Duration slider"
              className="h-6"
            >
              <SliderThumb className="size-5 border-[3px] shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" />
            </Slider>
            <div className="mt-3 flex flex-wrap gap-2">
              {([5,10,15,20,25,30,45,60] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={restoring || (running && !paused)}
                  onClick={() => setDurationMin(m)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${durationMin === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
                >
                  {m}m
                </button>
              ))}
            </div>

            <div className="mt-4">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full"
                disabled={restoring}
              />
            </div>

            {/* Controls pinned to the end/right of the form */}
            <div className="mt-6 flex flex-wrap items-center gap-2 md:justify-end md:text-right">
              {!running && (
                <Button variant="primary" size="sm" disabled={restoring} onClick={() => { start(); playAffirmation() }}>
                  <PlayCircle className="h-4 w-4 mr-2" /> Start
                </Button>
              )}
              {running && !paused && (
                <Button variant="secondary" size="sm" disabled={restoring} onClick={() => { pause(); stopAffirmation(true) }}>
                  <PauseCircle className="h-4 w-4 mr-2" /> Pause
                </Button>
              )}
              {running && paused && (
                <Button variant="primary" size="sm" disabled={restoring} onClick={() => { resume(); playAffirmation() }}>
                  <PlayCircle className="h-4 w-4 mr-2" /> Resume
                </Button>
              )}
              {running && (
                <Button variant="destructive" size="sm" disabled={restoring} onClick={handleStopSave}>Stop & Save</Button>
              )}
              {soundUnlockNeeded && soundEnabled && running && !paused && (
                <span className="ml-2 text-xs">
                  <button type="button" onClick={() => playAffirmation()} className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                    Enable Sound
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Embedded Recent Sessions with filters and expandable details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">Recent Sessions</div>
            <div className="text-xs text-gray-600">History with pause/resume/stop details</div>
          </div>
        </div>
        <Filters
          filters={filters}
          fields={fields}
          radius="full"
          size="sm"
          variant="outline"
          onChange={(next) => setFilters(next)}
        />

        <DataGrid table={table} recordCount={total} aria-busy={loadingRecent} tableLayout={{ headerBackground: true, headerBorder: true, rowBorder: true }}>
          <div className="w-full space-y-2.5">
            <DataGridContainer>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </DataGridContainer>
            <DataGridPagination />
          </div>
        </DataGrid>
      </div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <audio ref={audioRef} src="/affirmation.mp3" preload="auto" />
    </div>
  )
}

export default function FocusTimerPage() {
  return (
    <Suspense>
      <FocusTimerContent />
    </Suspense>
  )
}