"use client"
import TasksKanban from '@/components/tasks-kanban'
import { Filters, createFilter, type Filter, type FilterFieldConfig } from '@/components/ui/filters'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function KanbanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [filters, setFilters] = React.useState<Filter[]>([])

  const fields: FilterFieldConfig[] = [
    { key: 'title', label: 'Title', type: 'text', className: 'w-48', placeholder: 'Search title…' },
    { key: 'category', label: 'Category', type: 'multiselect', className: 'w-[300px]', options: [
      { value: 'work', label: 'Work' },
      { value: 'health', label: 'Health' },
      { value: 'personal', label: 'Personal' },
      { value: 'goal', label: 'Goal' },
    ] },
    { key: 'status', label: 'Status', type: 'multiselect', className: 'w-[220px]', options: [ { value: 'open', label: 'Open' }, { value: 'done', label: 'Done' } ] },
    { key: 'createdAt', label: 'Created At', type: 'dateRange', className: 'w-[360px]' },
  ]

  // Hydrate from URL
  React.useEffect(() => {
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

  const applyFilters = (next: Filter[]) => {
    setFilters(next)
    const params = new URLSearchParams()
    for (const f of next) {
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
    const qs = params.toString()
    const qsPretty = qs.replace(/%2C/g, ',')
    router.replace(`${pathname}?${qsPretty}`)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks Kanban</h1>
      </div>
      <div className="mb-2">
        <Filters
          filters={filters}
          fields={fields}
          radius="full"
          size="sm"
          variant="outline"
          onChange={applyFilters}
        />
      </div>
      <TasksKanban filters={filters} />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <KanbanContent />
    </Suspense>
  )
}