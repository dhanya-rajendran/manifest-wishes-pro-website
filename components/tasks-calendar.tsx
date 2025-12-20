"use client"

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

type Task = { id: string; title: string; category?: string; createdAt?: string; done?: boolean }

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function truncateText(s: string, n = 12) {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

function getMonthRange(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = new Date(Date.UTC(year, month, 1))
  const end = new Date(Date.UTC(year, month + 1, 0))
  return { start: formatDate(start), end: formatDate(end) }
}

function getMonthDays(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  const days: Date[] = []
  // Sunday-start grid: add leading blanks
  const leading = firstDay.getUTCDay() // 0..6
  for (let i = 0; i < leading; i++) days.push(new Date(NaN))
  for (let d = 1; d <= lastDay.getUTCDate(); d++) days.push(new Date(Date.UTC(year, month, d)))
  // Pad to complete weeks (7 columns)
  while (days.length % 7 !== 0) days.push(new Date(NaN))
  return days
}

export default function TasksCalendar() {
  const [current, setCurrent] = React.useState(() => new Date())
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [categories, setCategories] = React.useState<string[]>([])
  const [canAddCategory, setCanAddCategory] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [newCategory, setNewCategory] = React.useState('work')
  const [newTitle, setNewTitle] = React.useState('')

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(current)

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories', { credentials: 'include' })
      const data = await res.json().catch(() => null)
      if (data?.ok) {
        setCategories(data.categories || [])
        setCanAddCategory(Boolean(data.canAdd))
      }
    } catch {}
  }

  async function loadTasks() {
    setLoading(true)
    setError(null)
    const { start, end } = getMonthRange(current)
    const params = new URLSearchParams({ createdFrom: start, createdTo: end, limit: '100' })
    try {
      const res = await fetch(`/api/tasks?${params.toString()}`, { credentials: 'include' })
      const data = await res.json().catch(() => null)
      if (!data?.ok) {
        setError('Failed to load tasks')
        setTasks([])
      } else {
        setTasks((data.tasks || []) as Task[])
      }
    } catch (e) {
      setError('Failed to load tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadCategories()
  }, [])

  React.useEffect(() => {
    loadTasks()
  }, [current])

  const byDate = React.useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      const d = (t.createdAt || '').slice(0, 10)
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(t)
    }
    return map
  }, [tasks])

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tasks Calendar</h1>
          <p className="text-sm text-muted-foreground">Month view of tasks by creation date</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrent(new Date(Date.UTC(current.getFullYear(), current.getMonth() - 1, 1)))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium">{monthLabel}</span>
          <Button variant="outline" onClick={() => setCurrent(new Date(Date.UTC(current.getFullYear(), current.getMonth() + 1, 1)))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const now = new Date()
              const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
              setSelectedDate(todayUTC)
              setAddOpen(true)
            }}
            className="ml-2"
          >
            <Plus className="mr-2 size-4" />Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-xs font-medium text-muted-foreground px-1">{d}</div>
        ))}
        {loading ? (
          Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          getMonthDays(current).map((d, idx) => {
            const isBlank = Number.isNaN(d.getTime())
            if (isBlank) return <div key={idx} className="h-24 rounded-md border bg-muted/30" />
            const key = formatDate(d)
            const list = byDate.get(key) || []
            const now = new Date()
            const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
            const canAddHere = d.getTime() >= todayUTC.getTime()
            const isToday = d.getUTCFullYear() === todayUTC.getUTCFullYear() && d.getUTCMonth() === todayUTC.getUTCMonth() && d.getUTCDate() === todayUTC.getUTCDate()
            return (
              <Card key={key} className={`h-28 overflow-hidden ${isToday ? 'ring-2 ring-primary' : ''} ${list.length > 0 ? 'bg-primary/5' : ''}`}>
                <CardHeader className="p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{d.getUTCDate()}</span>
                    <div className="flex items-center gap-1">
                      {list.length > 0 ? (
                        <HoverCard openDelay={100} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <Badge variant="secondary" className="h-5 px-1 text-[10px] cursor-pointer">{list.length}</Badge>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64 p-2">
                            <div className="text-xs font-medium mb-2">Tasks on {key}</div>
                            <ScrollArea className="h-40">
                              <div className="space-y-2 pr-2">
                                {list.map((t) => (
                                  <div key={t.id} className="rounded-md border bg-card p-2">
                                    <div className="text-[11px] font-medium truncate">{t.title}</div>
                                    <div className="text-[11px] text-muted-foreground">
                                      <span className="capitalize">{t.category}</span> · {t.done ? 'Done' : 'Open'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </HoverCardContent>
                        </HoverCard>
                      ) : null}
                      {canAddHere ? (
                        <Button
                          variant="ghost"
                          onClick={() => { setSelectedDate(d); setAddOpen(true) }}
                          className="h-5 px-2"
                          aria-label="Add task"
                        >
                          <Plus className="size-3" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="-mt-2 px-2 pb-2">
                  <ScrollArea className="h-20">
                    <ul className="space-y-1 pr-2">
                      {list.map((t) => (
                        <li key={t.id}>
                          <HoverCard openDelay={100} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center justify-between rounded-md border bg-card px-2 py-1">
                                <div className="text-[11px] font-medium truncate">
                                  {truncateText(t.title || '')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-[10px] px-1">
                                    {t.done ? 'Done' : 'Open'}
                                  </Badge>
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64 p-2">
                              <div className="text-xs font-medium mb-1">{t.title}</div>
                              <div className="text-[11px] text-muted-foreground">
                                <span className="capitalize">{t.category}</span> · {t.done ? 'Done' : 'Open'}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>
              {selectedDate ? `Create on ${formatDate(selectedDate)}. Select a category and enter task details.` : 'Select a category and enter task details.'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="mb-3">
              <ToggleGroup
                type="single"
                value={newCategory}
                onValueChange={(v) => v && setNewCategory(v)}
                className="flex flex-wrap gap-2"
              >
                {categories.map((c) => (
                  <ToggleGroupItem key={c} value={c} aria-label={c} className="capitalize">
                    {c}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="mb-2">
              <textarea
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Task title"
                className="w-full rounded-md border bg-background p-2 text-sm"
                rows={3}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={async () => {
                const title = newTitle.trim()
                if (!title) return
                try {
                  const res = await fetch('/api/tasks', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, category: newCategory, done: false, ...(selectedDate ? { createdAt: formatDate(selectedDate) } : {}) }),
                  })
                  if (!res.ok) throw new Error('Failed to create')
                  setAddOpen(false)
                  setNewTitle('')
                  setSelectedDate(null)
                  await loadTasks()
                  toast.success('Task created', { description: 'Added to calendar' })
                } catch (e) {
                  toast.error('Failed to create task')
                }
              }}
              disabled={!newTitle.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}