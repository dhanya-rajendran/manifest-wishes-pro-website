"use client"
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header'
import { DataGridPagination } from '@/components/ui/data-grid-pagination'
import { ColumnDef, ExpandedState, getCoreRowModel, getPaginationRowModel, PaginationState, useReactTable, type Row, getSortedRowModel, SortingState } from '@tanstack/react-table'

type TimerMode = 'focus' | 'break'

interface TimerPause {
  id: string
  startAt: string
  endAt: string | null
}

interface TimerStop {
  id: string
  stopAt: string
}

interface FocusSession {
  id: string
  startAt: string
  endAt: string | null
  plannedMinutes: number | null
  durationMinutes: number | null
  mode: TimerMode
  note: string | null
  targetEnd: string | null
  pauses: TimerPause[]
  stops: TimerStop[]
}

interface ApiResponse { ok: boolean; sessions: FocusSession[]; total: number }

// Sub-grid rows representing session events (hoisted)
type EventRow = { id: string; type: 'Paused' | 'Resumed' | 'Stopped'; at: string }

function SessionEventsSubTable({ items }: { items: EventRow[] }) {
  const [subPagination, setSubPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 5 })
  const [subSorting, setSubSorting] = React.useState<SortingState>([])

  const subColumns = React.useMemo<ColumnDef<EventRow>[]>(() => [
    {
      accessorKey: 'type',
      header: ({ column }) => <DataGridColumnHeader title="Event" column={column} />, 
      cell: ({ row }) => {
        const t = row.original.type
        const variant: 'secondary' | 'primary' | 'destructive' = t === 'Paused' ? 'secondary' : t === 'Resumed' ? 'primary' : 'destructive'
        return <Badge variant={variant}>{t}</Badge>
      },
      enableSorting: true,
      size: 140,
    },
    {
      accessorKey: 'at',
      header: ({ column }) => <DataGridColumnHeader title="Timestamp" column={column} />, 
      cell: ({ row }) => fmt(row.original.at),
      enableSorting: true,
      size: 220,
    },
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

function fmt(dt: string | null) {
  if (!dt) return '-'
  try {
    const d = new Date(dt)
    return d.toLocaleString()
  } catch {
    return dt
  }
}

export default function RecentSessionsPage() {
  const [modeFilter, setModeFilter] = React.useState<'all' | TimerMode>('all')
  const [createdFrom, setCreatedFrom] = React.useState<string>('')
  const [createdTo, setCreatedTo] = React.useState<string>('')

  const [data, setData] = React.useState<FocusSession[]>([])
  const [total, setTotal] = React.useState<number>(0)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [active, setActive] = React.useState<{ id: string; mode: TimerMode; startAt: string; endAt: string | null; targetEnd: string | null } | null>(null)

  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])

  const buildEventRows = React.useCallback((sess: FocusSession): EventRow[] => {
    const events: EventRow[] = []
    for (const p of sess.pauses ?? []) {
      events.push({ id: `pause-${p.id}`, type: 'Paused', at: p.startAt })
      if (p.endAt) events.push({ id: `resume-${p.id}`, type: 'Resumed', at: p.endAt })
    }
    for (const s of sess.stops ?? []) {
      events.push({ id: `stop-${s.id}`, type: 'Stopped', at: s.stopAt })
    }
    return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  }, [])

  

  const columns = React.useMemo<ColumnDef<FocusSession, unknown>[]>(() => [
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => (
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
      ),
      size: 40,
      meta: {
        expandedContent: (sess: FocusSession) => <SessionEventsSubTable items={buildEventRows(sess)} />,
        cellClassName: 'text-center',
      },
    },
    {
      accessorKey: 'mode',
      header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />, 
      cell: ({ row }) => {
        const m: TimerMode = row.original.mode
        return <Badge variant={m === 'focus' ? 'primary' : 'secondary'}>{m === 'focus' ? 'Focus' : 'Break'}</Badge>
      },
      enableSorting: true,
      size: 100,
    },
    {
      accessorKey: 'startAt',
      header: ({ column }) => <DataGridColumnHeader title="Created" column={column} />, 
      cell: ({ row }) => fmt(row.original.startAt),
      enableSorting: true,
      size: 220,
    },
    {
      accessorKey: 'endAt',
      header: ({ column }) => <DataGridColumnHeader title="End Time" column={column} />, 
      cell: ({ row }) => fmt(row.original.endAt),
      enableSorting: true,
      size: 220,
    },
  ], [buildEventRows])

  // Determine expandability based on whether there are events to show
  const canExpand = React.useCallback((row: Row<FocusSession>) => {
    const sess = row.original
    const hasPauses = Array.isArray(sess.pauses) && sess.pauses.length > 0
    const hasStops = Array.isArray(sess.stops) && sess.stops.length > 0
    return hasPauses || hasStops
  }, [])

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

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.pageIndex + 1))
      params.set('limit', String(pagination.pageSize))
      if (modeFilter !== 'all') params.set('mode', modeFilter)
      if (createdFrom) params.set('createdFrom', createdFrom)
      if (createdTo) params.set('createdTo', createdTo)
      const res = await fetch(`/api/timer?${params.toString()}`)
      const json: ApiResponse = await res.json()
      setData(json.sessions)
      setTotal(json.total)
    } catch (err) {
      console.error('Failed to load sessions', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, modeFilter, createdFrom, createdTo])

  React.useEffect(() => { fetchData() }, [fetchData])

  // Fetch currently active session to surface at top
  React.useEffect(() => {
    let cancelled = false
    async function loadActive() {
      try {
        const res = await fetch('/api/timer/active', { credentials: 'include' })
        if (!res.ok) return
        const json = await res.json()
        const sess = json.session as { id: string; mode: TimerMode; startAt: string; endAt: string | null; targetEnd: string | null } | null
        if (!cancelled) setActive(sess ?? null)
      } catch { void 0 }
    }
    void loadActive()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-4">
      {active && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="font-semibold">Active Session</div>
            <div className="text-xs text-muted-foreground">{new Date(active.startAt).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={active.targetEnd ? 'primary' : 'secondary'}>{active.targetEnd ? 'Running' : 'Paused'}</Badge>
          </div>
        </div>
      )}
      <div className="flex items-end gap-3">
        <div className="flex flex-col">
          <label className="text-sm mb-1">Type</label>
          <select
            className="border rounded px-2 py-1"
            value={modeFilter}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all' || v === 'focus' || v === 'break') setModeFilter(v)
            }}
          >
            <option value="all">All</option>
            <option value="focus">Focus</option>
            <option value="break">Break</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Created From</label>
          <input type="date" className="border rounded px-2 py-1" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Created To</label>
          <input type="date" className="border rounded px-2 py-1" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
        </div>
        <Button onClick={() => fetchData()} disabled={loading}>{loading ? 'Loading…' : 'Apply'}</Button>
      </div>
      <DataGrid table={table} recordCount={total} tableLayout={{ headerBackground: true, headerBorder: true, rowBorder: true }}>
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
  )
}