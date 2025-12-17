"use client"
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { ComponentType, SVGProps } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2, Briefcase, Heart, User as UserIcon, Target, Check } from 'lucide-react'
import { Toast } from '@base-ui/react/toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filters, createFilter, type Filter, type FilterFieldConfig } from '@/components/ui/filters'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@base-ui/react/input'
import { ReToastViewport } from '@/components/ui/reui-toast'
import { ColumnDef, getCoreRowModel, flexRender, useReactTable } from '@tanstack/react-table'

type Category = 'work' | 'health' | 'personal' | 'goal'
type Task = { id: string; title: string; category: Category; done: boolean; createdAt: string; updatedAt: string }

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'work', label: 'Work' },
  { key: 'health', label: 'Health' },
  { key: 'personal', label: 'Personal' },
  { key: 'goal', label: 'Goal' },
]

const CATEGORY_META: Record<Category, { label: string; classes: string; icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  work: { label: 'Work', classes: 'border-indigo-600 text-indigo-700 bg-white', icon: Briefcase },
  health: { label: 'Health', classes: 'border-green-600 text-green-700 bg-white', icon: Heart },
  personal: { label: 'Personal', classes: 'border-violet-600 text-violet-700 bg-white', icon: UserIcon },
  goal: { label: 'Goal', classes: 'border-blue-600 text-blue-700 bg-white', icon: Target },
}

export default function TasksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [tasks, setTasks] = useState<Task[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filter[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('work')
  const toastManager = useMemo(() => Toast.createToastManager(), [])
  function showToast(message: string, type: 'success' | 'error') {
    toastManager.add({ title: type === 'success' ? 'Success' : 'Error', description: message, type, timeout: 3000 })
  }

  const columns = useMemo<ColumnDef<Task>[]>(() => [
    { header: 'Title', accessorKey: 'title' },
    {
      header: 'Category',
      cell: ({ row }) => {
        const cat = row.original.category
        const meta = CATEGORY_META[cat]
        const Icon = meta.icon
        return (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${meta.classes}`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        )
      }
    },
    {
      header: 'Created',
      cell: ({ row }) => formatDisplay(row.original.createdAt),
    },
    {
      header: 'Updated',
      cell: ({ row }) => row.original.updatedAt ? formatDisplay(row.original.updatedAt) : '-',
    },
    {
      header: 'Status',
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${row.original.done ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
          {row.original.done ? 'Done' : 'Open'}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center rounded border px-2 py-1 text-xs hover:bg-gray-100"
            onClick={() => openEdit(row.original)}
            aria-label="Edit task"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="inline-flex items-center rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            onClick={() => removeTask(row.original.id)}
            aria-label="Delete task"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            className="rounded border px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
            onClick={() => toggleDone(row.original.id, !row.original.done)}
          >{row.original.done ? 'Mark Open' : 'Mark Done'}</button>
        </div>
      )
    }
  ], [])

  const table = useReactTable({ data: tasks, columns, getCoreRowModel: getCoreRowModel() })

  async function loadTasks() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
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
  }

  useEffect(() => { loadTasks() }, [page, limit, filters])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function openAdd() {
    setEditing(null)
    setTitle('')
    setCategory('work')
    setDrawerOpen(true)
  }
  function openEdit(t: Task) {
    setEditing(t)
    setTitle(t.title)
    setCategory(t.category)
    setDrawerOpen(true)
  }
  function closeDrawer() { setDrawerOpen(false) }

  async function saveTask() {
    const trimmed = title.trim()
    if (!trimmed) return
    if (editing) {
      const res = await fetch(`/api/tasks/${editing.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed, category })
      })
      if (!res.ok) {
        showToast('Failed to update task', 'error')
        return
      }
      showToast('Task updated successfully', 'success')
    } else {
      const res = await fetch('/api/tasks', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed, category, done: false })
      })
      if (!res.ok) {
        showToast('Failed to add task', 'error')
        return
      }
      showToast('Task added successfully', 'success')
    }
    closeDrawer()
    await loadTasks()
  }

  async function toggleDone(id: string, done: boolean) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done })
    })
    if (res.ok) await loadTasks()
  }
  async function removeTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      showToast('Task deleted successfully', 'success')
      await loadTasks()
    } else {
      showToast('Failed to delete task', 'error')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <ReToastViewport manager={toastManager} />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-gray-600">Manage tasks with filters, pagination, and editing</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAdd}
            className="rounded bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
          >Add Task</button>
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

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} className="px-4 py-2 text-left font-semibold">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6" colSpan={columns.length}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-28" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-28" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-28" />
                      </div>
                    </div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr><td className="px-4 py-6" colSpan={columns.length}>No tasks found.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-t">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-2">
                        {cell.column.columnDef.cell
                          ? flexRender(cell.column.columnDef.cell, cell.getContext())
                          : String(cell.getValue() ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2">
          <div className="text-xs text-gray-600">Page {page} of {totalPages} · Total {total}</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className="rounded border px-2 py-1 text-xs disabled:opacity-50">Prev</button>
            <button disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} className="rounded border px-2 py-1 text-xs disabled:opacity-50">Next</button>
            <Select indicatorPosition="left" value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger size="xs" className="w-auto">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{`${n}/page`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 h-full w-[360px] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{editing ? 'Edit Task' : 'Add Task'}</h2>
              <button onClick={closeDrawer} className="rounded border px-2 py-1 text-xs">Close</button>
            </div>
            <div className="space-y-3 p-4">
              <label className="block text-xs font-medium text-gray-700">Title</label>
              <Input value={title} onValueChange={setTitle} placeholder="Task title" className="w-full rounded border px-3 py-2 text-sm" />
              <label className="block text-xs font-medium text-gray-700">Category</label>
              <Select indicatorPosition="left" value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger size="md" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button onClick={saveTask} className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDisplay(dateString: string) {
  const d = new Date(dateString)
  return format(d, 'd MMM yyyy, HH:mm:ss')
}