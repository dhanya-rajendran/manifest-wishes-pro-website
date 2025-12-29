"use client";
import { useEffect, useMemo, useState, useCallback, type ChangeEvent } from 'react'
import { Briefcase, HeartPulse, User, Target, Tag } from 'lucide-react'
import AddTaskDialog from '@/components/add-task-dialog'
import { Button } from '@/components/ui/button'

type Category = string
type Task = { id: string; title: string; category: Category; done: boolean; createdAt: string }
const DEFAULT_CATEGORIES = ['work', 'health', 'personal', 'goal'] as const

export default function TasksPanel() {
  const [categories, setCategories] = useState<string[]>(Array.from(DEFAULT_CATEGORIES))
  const [canAddCategory, setCanAddCategory] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const cats: string[] = Array.isArray(data?.categories) ? data.categories : Array.from(DEFAULT_CATEGORIES)
      setCategories(cats)
      setCanAddCategory(Boolean(data?.canAdd))
    } catch {
      setCategories(Array.from(DEFAULT_CATEGORIES))
      setCanAddCategory(false)
    }
  }

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const url = filter === 'all' ? '/api/tasks' : `/api/tasks?category=${encodeURIComponent(filter)}`
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks(data?.tasks ?? [])
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadTasks() }, [loadTasks])
  useEffect(() => { loadCategories() }, [])

  

  const toggleDone = async (id: string, done: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await loadTasks()
    } catch { void 0 }
  }

  const removeTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to delete')
      await loadTasks()
    } catch { void 0 }
  }

  const clearAll = async () => {
    if (tasks.length === 0) return
    const ok = window.confirm('Clear all tasks?')
    if (!ok) return
    try {
      const res = await fetch('/api/tasks', { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to clear')
      await loadTasks()
    } catch { void 0 }
  }

  const filtered = useMemo(() => {
    const list = filter === 'all' ? tasks : tasks.filter(t => t.category === filter)
    // Sort by createdAt descending so newest appears first
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [tasks, filter])

  const totalCount = tasks.length
  const completedCount = tasks.filter(t => t.done).length

  const categoryCounts = useMemo(() => {
    const counts = new Map<Category, number>()
    categories.forEach(c => counts.set(c, 0))
    tasks.forEach(t => counts.set(t.category, (counts.get(t.category) ?? 0) + 1))
    return counts
  }, [tasks, categories])

  const getCategoryIcon = (c: string) => {
    const key = c.toLowerCase()
    if (key === 'work') return Briefcase
    if (key === 'health') return HeartPulse
    if (key === 'personal') return User
    if (key === 'goal') return Target
    return Tag
  }

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p className="text-xs text-gray-600">Persisted to your account</p>
        </div>
        <button onClick={clearAll} className="rounded bg-red-500 px-3 py-1.5 text-xs text-white">Clear</button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-sm text-gray-600">Filter:</span>
        <select
          value={filter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const v = e.target.value
            setFilter(v === 'all' ? 'all' : (v as Category))
          }}
          className="rounded border px-2 py-1.5 text-sm"
        >
          <option value="all">All</option>
          {categories.map(c => (<option key={c} value={c}>{c}</option>))}
        </select>
        <div className="text-sm text-gray-600">All: {totalCount} · Completed: {completedCount}</div>
        <div className="-mb-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
          {categories.map(c => {
            const Icon = getCategoryIcon(c)
            return (
              <span key={c} className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5">
                <Icon className="size-3.5 text-gray-500" />
                <span className="text-gray-700 capitalize">{c}:</span>
                <span className="font-medium text-gray-900">{categoryCounts.get(c) ?? 0}</span>
              </span>
            )
          })}
        </div>
      </div>

      <div className="mt-4 rounded border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Add Task</h3>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>Add Task</Button>
        </div>
        <AddTaskDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          categories={categories}
          canAddCategory={canAddCategory}
          onSuccess={async () => { await loadTasks() }}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {!mounted || loading ? (
          <div className="rounded border bg-white p-3">
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-200"/>
              <div className="h-3 w-1/3 rounded bg-gray-200"/>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-600">No tasks yet. Add one above.</p>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <button onClick={() => toggleDone(t.id, !t.done)} aria-label="Toggle done" className={`inline-block h-2.5 w-2.5 rounded-full ${t.done ? 'bg-green-500' : 'bg-gray-300'}`}/>
                <span className={`text-gray-900 ${t.done ? 'line-through text-gray-500' : ''}`}>{t.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getCategoryIcon(t.category)
                  return (
                    <span className="inline-flex items-center gap-1 rounded border bg-white px-2 py-0.5 text-xs text-gray-700">
                      <Icon className="size-3.5 text-gray-500" />
                      <span className="capitalize">{t.category}</span>
                    </span>
                  )
                })()}
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => { setEditTask(t); setEditOpen(true); }}
                >
                  Edit
                </Button>
                <button onClick={() => removeTask(t.id)} className="rounded bg-red-500 px-2 py-1 text-xs text-white">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit dialog */}
      <AddTaskDialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o)
          if (!o) setEditTask(null)
        }}
        categories={categories}
        canAddCategory={canAddCategory}
        task={editTask ? { id: editTask.id, title: editTask.title, category: editTask.category } : undefined}
        onSuccess={async () => { await loadTasks() }}
      />
    </div>
  )
}