import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function getUserId(request: Request): number | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null
  const payload = verifyToken<{ uid: string | number }>(token)
  if (!payload) return null
  if (payload.uid === 'demo') return null
  return Number(payload.uid)
}

function toDateKey(d: Date): string {
  // YYYY-MM-DD UTC
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

export async function GET(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const daysParam = searchParams.get('days')
  const days = daysParam ? Math.min(90, Math.max(1, Number(daysParam))) : 30

  // Summary counts (all-time)
  const [total, completed] = await Promise.all([
    prisma.task.count({ where: { userId, deletedAt: null } }),
    prisma.task.count({ where: { userId, deletedAt: null, done: true } }),
  ])
  const open = total - completed

  // Category distribution (all-time)
  const byCategory = await prisma.task.groupBy({
    by: ['category'],
    where: { userId, deletedAt: null },
    _count: { _all: true },
  })
  const categoryCounts = Object.fromEntries(
    byCategory.map((c: { category: string; _count: { _all: number } }) => [c.category, c._count._all])
  )

  // Created by day (last N days), compute in JS for portability across providers
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - days + 1)
  since.setUTCHours(0, 0, 0, 0)
  const recentTasks = await prisma.task.findMany({
    where: { userId, deletedAt: null, createdAt: { gte: since } },
    select: { id: true, createdAt: true, category: true },
    orderBy: { createdAt: 'asc' },
  })
  const createdByDayMap = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setUTCDate(since.getUTCDate() + i)
    createdByDayMap.set(toDateKey(d), 0)
  }
  for (const t of recentTasks) {
    const key = toDateKey(new Date(t.createdAt))
    createdByDayMap.set(key, (createdByDayMap.get(key) ?? 0) + 1)
  }
  const createdByDay = Array.from(createdByDayMap.entries()).map(([date, count]) => ({ date, created: count }))

  const todayKey = toDateKey(new Date())
  const createdToday = createdByDay.find((d) => d.date === todayKey)?.created ?? 0

  // Per-category created by day series for last N days
  // Ensure TypeScript infers a string[] for categories so it can be used
  // as an index type for the per-day category map initialization.
  const categories: string[] = Array.from(
    new Set(byCategory.map((c: { category: string }) => c.category))
  ).sort()
  const byDayByCategoryMap = new Map<string, Record<string, number>>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setUTCDate(since.getUTCDate() + i)
    const key = toDateKey(d)
    const init: Record<string, number> = {}
    for (const cat of categories) init[cat] = 0
    byDayByCategoryMap.set(key, init)
  }
  for (const t of recentTasks) {
    const key = toDateKey(new Date(t.createdAt))
    const row = byDayByCategoryMap.get(key)
    if (row) {
      row[t.category] = (row[t.category] ?? 0) + 1
      byDayByCategoryMap.set(key, row)
    }
  }
  const createdByDayByCategory = Array.from(byDayByCategoryMap.entries()).map(([date, counts]) => ({ date, ...counts }))

  return NextResponse.json({
    ok: true,
    summary: { total, completed, open, createdToday },
    categoryCounts,
    createdByDay,
    categories,
    createdByDayByCategory,
  })
}