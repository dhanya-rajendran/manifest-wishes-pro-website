"use client";
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

type Category = string
type Task = { id: string; title: string; category: Category; done: boolean; createdAt: string }
const DEFAULT_CATEGORIES: { key: Category; label: string }[] = [
  { key: 'work', label: 'Work' },
  { key: 'health', label: 'Health' },
  { key: 'personal', label: 'Personal' },
  { key: 'goal', label: 'Goal' },
]

export default function TasksPanel() {
  const [categories] = useState(DEFAULT_CATEGORIES)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('work')
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const loadTasks = async () => {
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
  }

  useEffect(() => { loadTasks() }, [filter])

  const addTask = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed, category, done: false }),
      })
      if (!res.ok) throw new Error('Failed to create')
      setTitle('')
      await loadTasks()
    } catch {}
  }

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
    } catch {}
  }

  const removeTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to delete')
      await loadTasks()
    } catch {}
  }

  const clearAll = async () => {
    if (tasks.length === 0) return
    const ok = window.confirm('Clear all tasks?')
    if (!ok) return
    try {
      const res = await fetch('/api/tasks', { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to clear')
      await loadTasks()
    } catch {}
  }

  const filtered = useMemo(() => {
    const list = filter === 'all' ? tasks : tasks.filter(t => t.category === filter)
    return list
  }, [tasks, filter])

  const totalCount = tasks.length
  const completedCount = tasks.filter(t => t.done).length

  const categoryCounts = useMemo(() => {
    const counts = new Map<Category, number>()
    categories.forEach(c => counts.set(c.key, 0))
    tasks.forEach(t => counts.set(t.category, (counts.get(t.category) ?? 0) + 1))
    return counts
  }, [tasks, categories])

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
          {categories.map(c => (<option key={c.key} value={c.key}>{c.label}</option>))}
        </select>
        <div className="text-sm text-gray-600">All: {totalCount} · Completed: {completedCount}</div>
        <div className="-mb-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
          {categories.map(c => (
            <span key={c.key} className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5">
              <span className="text-gray-700">{c.label}:</span>
              <span className="font-medium text-gray-900">{categoryCounts.get(c.key) ?? 0}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Add Task</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="min-w-[220px] flex-1 rounded border px-3 py-2 text-sm"/>
          <select value={category} onChange={e => setCategory(e.target.value)} className="rounded border px-2.5 py-2 text-sm">
            {categories.map(c => (<option key={c.key} value={c.key}>{c.label}</option>))}
          </select>
          <button onClick={addTask} className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white">Add</button>
        </div>
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
                <span className="rounded border bg-white px-2 py-0.5 text-xs text-gray-700">{t.category}</span>
                <button onClick={() => removeTask(t.id)} className="rounded bg-red-500 px-2 py-1 text-xs text-white">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}