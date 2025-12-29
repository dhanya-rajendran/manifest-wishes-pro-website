"use client"

import * as React from 'react'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import AddTaskDialog from '@/components/add-task-dialog'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { ScrollArea } from '@/components/ui/scroll-area'
// Removed unused toast import

type Task = { id: string; title: string; category?: string; createdAt?: string; done?: boolean }

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

// removed unused truncateText helper

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
  // removed unused error state

  const [categories, setCategories] = React.useState<string[]>([])
  const [canAddCategory, setCanAddCategory] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(current)

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

  const loadTasks = React.useCallback(async () => {
    setLoading(true)
    const { start, end } = getMonthRange(current)
    const params = new URLSearchParams({ createdFrom: start, createdTo: end, limit: '100' })
    try {
      const res = await fetch(`/api/tasks?${params.toString()}`, { credentials: 'include' })
      const data = await res.json().catch(() => null)
      if (!data?.ok) {
        setTasks([])
      } else {
        setTasks((data.tasks || []) as Task[])
      }
    } catch (e) {
      console.log("🚀 ~ loadTasks ~ e:", e)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [current])

  React.useEffect(() => {
    loadCategories()
  }, [])

  React.useEffect(() => {
    loadTasks()
  }, [loadTasks])

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

      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 sm:gap-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="hidden lg:block text-xs font-medium text-muted-foreground px-1">{d}</div>
        ))}
        {loading ? (
          Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-20 sm:h-24 w-full" />)
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
              <Card key={key} className={`h-20 sm:h-24 overflow-hidden ${isToday ? 'border-2 border-primary' : ''} ${list.length > 0 ? 'bg-primary/5' : ''}`}>
                <CardHeader className="relative p-1.5 sm:p-2 h-full">
                  <span className={`absolute left-1/2 -translate-x-1/2 ${isToday ? 'font-bold' : 'font-semibold'} text-base sm:text-lg`}>{d.getUTCDate()}</span>
                  <div className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 flex items-center gap-1">
                    {list.length > 0 && (
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
                    )}
                    {canAddHere && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => { setSelectedDate(d); setAddOpen(true) }}
                        aria-label="Add task"
                      >
                        <Plus className="size-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            )
          })
        )}
        </div>
      </div>

      <AddTaskDialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o)
          if (!o) setSelectedDate(null)
        }}
        categories={categories}
        canAddCategory={canAddCategory}
        selectedDate={selectedDate ? formatDate(selectedDate) : null}
        onSuccess={async () => {
          await loadTasks()
        }}
      />
    </div>
  )
}