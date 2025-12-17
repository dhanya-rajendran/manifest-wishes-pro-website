import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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
  const active = await prisma.focusSession.findFirst({ where: { userId, endAt: null }, orderBy: { startAt: 'desc' } })
  if (!active) return NextResponse.json({ ok: true, session: null })
  // If targetEnd is present, client can compute remaining; if paused, compute remaining at pause
  let remainingMs: number | undefined = undefined
  if (!active.targetEnd) {
    try {
      const pauses = await prisma.$queryRaw<Array<{ startedAt: Date; endedAt: Date | null }>>`
        SELECT startedAt, endedAt FROM \`TimerPause\` WHERE sessionId = ${active.id} ORDER BY startedAt ASC
      `
      let completedPauseMs = 0
      let lastOpenPauseStart: Date | null = null
      for (const p of pauses) {
        if (p.endedAt) {
          completedPauseMs += Math.max(0, p.endedAt.getTime() - p.startedAt.getTime())
        } else {
          lastOpenPauseStart = p.startedAt
        }
      }
      const plannedMin = active.plannedMinutes ?? (active.mode === 'break' ? 5 : 25)
      const plannedMs = plannedMin * 60000
      const untilPauseMs = lastOpenPauseStart ? Math.max(0, lastOpenPauseStart.getTime() - new Date(active.startAt).getTime() - completedPauseMs) : 0
      remainingMs = Math.max(0, plannedMs - untilPauseMs)
    } catch {
      remainingMs = undefined
    }
  }
  return NextResponse.json({ ok: true, session: active, remainingMs })
}