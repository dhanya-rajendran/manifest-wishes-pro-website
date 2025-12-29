"use client"
export const dynamic = 'force-dynamic'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { ComponentType, SVGProps } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2, Briefcase, Heart, User as UserIcon, Target, Tag, Bell, Car, Newspaper, Plus } from 'lucide-react'
import { Toast } from '@base-ui/react/toast'
import { Filters, createFilter, type Filter, type FilterFieldConfig } from '@/components/ui/filters'
import { ReToastViewport } from '@/components/ui/reui-toast'
import { Button } from '@/components/ui/button'
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid'
import { DataGridTable } from '@/components/ui/data-grid-table'
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header'
import { DataGridPagination } from '@/components/ui/data-grid-pagination'
import { ColumnDef, ExpandedState, getCoreRowModel, getPaginationRowModel, PaginationState, useReactTable } from '@tanstack/react-table'
import AddTaskDialog from '@/components/add-task-dialog'

type Category = 'work' | 'health' | 'personal' | 'goal'
type Task = { id: string; title: string; category: Category; done: boolean; createdAt: string; updatedAt: string }

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'work', label: 'Work' },
  { key: 'health', label: 'Health' },
  { key: 'personal', label: 'Personal' },
  { key: 'goal', label: 'Goal' },
]

const CATEGORY_META: Record<string, { label: string; classes: string; icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  work: { label: 'Work', classes: 'border-indigo-600 text-indigo-700 bg-white', icon: Briefcase },
  health: { label: 'Health', classes: 'border-green-600 text-green-700 bg-white', icon: Heart },
  personal: { label: 'Personal', classes: 'border-violet-600 text-violet-700 bg-white', icon: UserIcon },
  goal: { label: 'Goal', classes: 'border-blue-600 text-blue-700 bg-white', icon: Target },
}

function getIconForCategory(name?: string) {
  const key = (name || '').toLowerCase()
  if (key === 'work') return Briefcase
  if (key === 'health') return Heart
  if (key === 'personal') return UserIcon
  if (key === 'goal') return Target
  if (/car|vehicle|auto/.test(key)) return Car
  if (/news|article|feed/.test(key)) return Newspaper
  if (/reminder|alert|notify|bell/.test(key)) return Bell
  return Tag
}

function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

function TasksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filter[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [categories, setCategories] = useState<string[]>([])
  const [canAddCategory, setCanAddCategory] = useState(false)
  const toastManager = useMemo(() => Toast.createToastManager(), [])
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    toastManager.add({ title: type === 'success' ? 'Success' : 'Error', description: message, type, timeout: 3000 })
  }, [toastManager])

  function truncate20(s: string) { return s.length > 20 ? `${s.slice(0, 20)}…` : s }

  const columns = useMemo<ColumnDef<Task>[]>(() => [
    { id: 'expand', header: () => null, cell: ({ row }) => (
      <span
        role="button"
        onClick={row.getToggleExpandedHandler()}
        className="text-xs font-medium text-primary hover:text-primary/80 cursor-pointer select-none"
        aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
        title={row.getIsExpanded() ? 'Collapse' : 'Expand'}
      >
        [{row.getIsExpanded() ? '-' : '+'}]
      </span>
    ), size: 40, enableSorting: false, meta: { expandedContent: (t: Task) => (
      <div className="bg-muted/30 p-3">
        <div className="rounded-lg border bg-card p-3 text-sm">
          <div className="font-medium mb-2">{t.title}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div><span className="font-medium text-foreground">Created:</span> {formatDisplay(t.createdAt)}</div>
            <div><span className="font-medium text-foreground">Updated:</span> {t.updatedAt ? formatDisplay(t.updatedAt) : '-'}</div>
            <div><span className="font-medium text-foreground">Status:</span> {t.done ? 'Done' : 'Open'}</div>
          </div>
        </div>
      </div>
    ) } },
    { accessorKey: 'title', header: ({ column }) => <DataGridColumnHeader title="Title" column={column} className="text-foreground font-medium" />, cell: ({ row }) => (
      <span className="block max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">{truncate20(row.original.title)}</span>
    ), enableSorting: false, size: 220 },
    { accessorKey: 'category', header: ({ column }) => <DataGridColumnHeader title="Category" column={column} className="text-foreground font-medium" />, cell: ({ row }) => {
        const cat = row.original.category
        const key = String(cat).toLowerCase()
        const meta = CATEGORY_META[key]
        const Icon = meta?.icon ?? getIconForCategory(key)
        const classes = meta?.classes ?? 'border-gray-300 text-gray-700 bg-white'
        const label = meta?.label ?? capitalize(key)
        return (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${classes}`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
        )
      }, enableSorting: true, size: 120 },
    { accessorKey: 'createdAt', header: ({ column }) => <DataGridColumnHeader title="Created" column={column} className="text-foreground font-medium" />, cell: ({ row }) => formatDisplay(row.original.createdAt), enableSorting: true, size: 160 },
    { accessorKey: 'updatedAt', header: ({ column }) => <DataGridColumnHeader title="Updated" column={column} className="text-foreground font-medium" />, cell: ({ row }) => row.original.updatedAt ? formatDisplay(row.original.updatedAt) : '-', enableSorting: true, size: 160 },
    { id: 'status', header: ({ column }) => <DataGridColumnHeader title="Status" column={column} className="text-foreground font-medium" />, cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${row.original.done ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
          {row.original.done ? 'Done' : 'Open'}
        </span>
      ), enableSorting: false, size: 120 },
    { id: 'actions', header: ({ column }) => <DataGridColumnHeader title="Actions" column={column} className="text-foreground font-medium" />, cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" onClick={() => openEdit(row.original)} aria-label="Edit task" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="xs" onClick={() => removeTask(row.original.id)} aria-label="Delete task" title="Delete" className="text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="primary" size="xs" onClick={() => toggleDone(row.original.id, !row.original.done)}>
            {row.original.done ? 'Mark Open' : 'Mark Done'}
          </Button>
        </div>
      ), enableSorting: false, size: 180 },
  ], [openEdit, removeTask, toggleDone])

  const canExpand = () => true
  const table = useReactTable({
    data: tasks,
    columns,
    pageCount: Math.max(1, Math.ceil((total || 0) / pagination.pageSize)),
    state: { pagination, expanded },
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => canExpand(),
    getRowId: (row) => row.id,
  })

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(pagination.pageIndex + 1))
      params.set('limit', String(pagination.pageSize))
      // Map filters into query params for backend
      for (const f of filters) {
        if (f.key === 'title' && f.op === 'contains') {
          params.set('title', String(f.values[0] ?? ''))
        } else if (f.key === 'category' && f.op === 'in') {
          const cats = (f.values ?? []).map(String).join(',')
          if (cats) params.set('categories', cats)
        } else if (f.key === 'status' && f.op === 'in') {
          const statuses = (f.values ?? []).map(String).join(',')
          if (statuses) params.set('status', statuses)
        } else if (f.key === 'createdAt' && f.op === 'between') {
          const from = String(f.values[0] ?? '')
          const to = String(f.values[1] ?? '')
          if (from) params.set('createdFrom', from)
          if (to) params.set('createdTo', to)
        }
      }
      // Keep URL in sync with current filters
      const qsEncoded = params.toString()
      const qsPretty = qsEncoded.replace(/%2C/g, ',')
      router.replace(`${pathname}?${qsPretty}`)
      // Use encoded query for fetch to ensure compatibility
      const res = await fetch(`/api/tasks?${qsEncoded}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setTasks(data.tasks ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, filters, router, pathname])

  useEffect(() => { loadTasks() }, [pagination.pageIndex, pagination.pageSize, filters, loadTasks])

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories', { credentials: 'include' })
      const data = await res.json().catch(() => null)
      if (data?.ok) {
        setCategories(data.categories || [])
        setCanAddCategory(Boolean(data.canAdd))
      }
    } catch { void 0 }
  }

  useEffect(() => { loadCategories() }, [])

  // Parse URL params into filters and hydrate UI selections
  useEffect(() => {
    if (!searchParams) return
    const next: Filter[] = []
    const title = searchParams.get('title')
    const categories = searchParams.get('categories')
    const status = searchParams.get('status')
    const createdFrom = searchParams.get('createdFrom')
    const createdTo = searchParams.get('createdTo')
    if (title) next.push(createFilter('title', 'contains', [title]))
    if (categories) next.push(createFilter('category', 'in', categories.split(',').filter(Boolean)))
    if (status) next.push(createFilter('status', 'in', status.split(',').filter(Boolean)))
    if (createdFrom || createdTo) next.push(createFilter('createdAt', 'between', [createdFrom ?? '', createdTo ?? '']))
    setFilters(next)
  }, [searchParams])

  const openAdd = useCallback(() => {
    setEditing(null)
    setAddOpen(true)
  }, [])
  const openEdit = useCallback((t: Task) => {
    setEditing(t)
    setAddOpen(true)
  }, [])

  // Add/edit handled by AddTaskDialog; table actions still use API for mark/delete

  const toggleDone = useCallback(async (id: string, done: boolean) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done })
    })
    if (res.ok) await loadTasks()
  }, [loadTasks])
  const removeTask = useCallback(async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      showToast('Task deleted successfully', 'success')
      await loadTasks()
    } else {
      showToast('Failed to delete task', 'error')
    }
  }, [loadTasks, showToast])

  // Removed legacy totalPages calculation that referenced old `limit` state

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <ReToastViewport manager={toastManager} />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-gray-600">Manage tasks with filters, pagination, and editing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="mb-4">
        {(() => {
          const fields: FilterFieldConfig[] = [
            { key: 'title', label: 'Title', type: 'text', className: 'w-48', placeholder: 'Search title…' },
            { key: 'category', label: 'Category', type: 'multiselect', className: 'w-[300px]', options: CATEGORIES.map(c => ({ value: c.key, label: c.label })) },
            { key: 'status', label: 'Status', type: 'multiselect', className: 'w-[220px]', options: [ { value: 'open', label: 'Open' }, { value: 'done', label: 'Done' } ] },
            { key: 'createdAt', label: 'Created At', type: 'dateRange', className: 'w-[360px]' },
          ]
          return (
            <Filters
              filters={filters}
              fields={fields}
              radius="full"
              size="sm"
              variant="outline"
              onChange={(next) => {
                // Update filters and sync URL via loadTasks effect
                setFilters(next)
              }}
            />
          )
        })()}
      </div>

      <div className="overflow-x-auto max-w-full">
        <DataGrid
          table={table}
          recordCount={total}
          isLoading={loading}
          emptyMessage="No tasks found"
          tableLayout={{ headerBackground: true, headerBorder: true, headerSticky: true, rowBorder: true, cellBorder: true }}
        >
          <DataGridContainer>
            <DataGridTable />
          </DataGridContainer>
          <DataGridPagination />
        </DataGrid>
      </div>

      <AddTaskDialog
        open={addOpen}
        onOpenChange={(o) => setAddOpen(o)}
        categories={categories.length ? categories : CATEGORIES.map(c => c.key)}
        canAddCategory={canAddCategory}
        task={editing ? { id: editing.id, title: editing.title, category: editing.category } : undefined}
        onSuccess={async () => {
          // Ensure newest appears first by returning to page 1
          setPagination(p => ({ ...p, pageIndex: 0 }))
          await loadTasks()
        }}
      />
    </div>
  )
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksContent />
    </Suspense>
  )
}

function formatDisplay(dateString: string) {
  const d = new Date(dateString)
  return format(d, 'd MMM yyyy, HH:mm:ss')
}