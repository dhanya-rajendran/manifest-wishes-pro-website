import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'
// Note: relax typing for dynamic filters to avoid TS mismatches with client types

function getUserId(request: Request): number | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null
  const payload = verifyToken<{ uid: string | number }>(token)
  if (!payload || payload.uid === 'demo') return null
  return Number(payload.uid)
}

export async function GET(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || undefined
  const createdFrom = searchParams.get('createdFrom') || undefined
  const createdTo = searchParams.get('createdTo') || undefined
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '10')))

  // Avoid `any` by typing only the fields we use; this remains compatible with Prisma's `FocusSessionWhereInput`
  const where: { userId: number; mode?: 'focus' | 'break'; createdAt?: { gte?: Date; lte?: Date } } = { userId }
  if (mode === 'focus' || mode === 'break') where.mode = mode
  if (createdFrom || createdTo) {
    const createdAt: { gte?: Date; lte?: Date } = {}
    if (createdFrom) createdAt.gte = new Date(`${createdFrom}T00:00:00.000Z`)
    if (createdTo) createdAt.lte = new Date(`${createdTo}T23:59:59.999Z`)
    where.createdAt = createdAt
  }

  const total = await prisma.focusSession.count({ where })
  const sessions = await prisma.focusSession.findMany({
    where,
    orderBy: { startAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })
  // Attach pause/stop history without relying on include typings
  const ids = sessions.map((s) => s.id)
  let pauses: Array<{ id: string; sessionId: string; startedAt: Date; endedAt: Date | null }> = []
  let stops: Array<{ id: string; sessionId: string; stoppedAt: Date }> = []
  if (ids.length) {
    try {
      const pauseRows = await prisma.$queryRaw<Array<{ id: string; sessionId: string; startedAt: Date; endedAt: Date | null }>>`
        SELECT id, sessionId, startedAt, endedAt
        FROM \`TimerPause\`
        WHERE sessionId IN (${Prisma.join(ids)})
        ORDER BY startedAt ASC
      `
      pauses = pauseRows
    } catch {
      // If the table doesn't exist yet, gracefully fall back to no pauses
      pauses = []
    }
    try {
      const stopRows = await prisma.$queryRaw<Array<{ id: string; sessionId: string; stoppedAt: Date }>>`
        SELECT id, sessionId, stoppedAt
        FROM \`TimerStop\`
        WHERE sessionId IN (${Prisma.join(ids)})
        ORDER BY stoppedAt ASC
      `
      stops = stopRows
    } catch {
      // If the table doesn't exist yet, gracefully fall back to no stops
      stops = []
    }
  }
  const pauseMap = new Map<string, typeof pauses>()
  const stopMap = new Map<string, typeof stops>()
  for (const p of pauses) {
    const arr = pauseMap.get(p.sessionId) || []
    arr.push(p)
    pauseMap.set(p.sessionId, arr)
  }
  for (const s of stops) {
    const arr = stopMap.get(s.sessionId) || []
    arr.push(s)
    stopMap.set(s.sessionId, arr)
  }
  const sessionsWith = sessions.map((s) => ({
    ...s,
    pauses: (pauseMap.get(s.id) || []).map((p) => ({ id: p.id, startAt: p.startedAt.toISOString(), endAt: p.endedAt ? p.endedAt.toISOString() : null })),
    stops: (stopMap.get(s.id) || []).map((st) => ({ id: st.id, stopAt: st.stoppedAt.toISOString() })),
  }))
  return NextResponse.json({ ok: true, sessions: sessionsWith, page, limit, total })
}

// Legacy endpoint retained for compatibility (saving completed sessions)
export async function POST(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  let json: unknown
  try { json = await request.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
  const body = json as { startAt?: string; endAt?: string; durationMinutes?: number; note?: string }
  const startAt = body.startAt ? new Date(body.startAt) : new Date()
  const endAt = body.endAt ? new Date(body.endAt) : null
  const session = await prisma.focusSession.create({
    data: {
      id: crypto.randomUUID(), userId, startAt, endAt: endAt ?? undefined, durationMinutes: body.durationMinutes, note: body.note
    }
  })
  return NextResponse.json({ ok: true, session })
}
