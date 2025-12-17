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

export async function POST(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  let json: unknown
  try { json = await request.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
  const body = json as { sessionId: string; stoppedAt?: string; remainingMs?: number }
  if (!body.sessionId) return NextResponse.json({ ok: false, error: 'Missing sessionId' }, { status: 400 })
  const session = await prisma.focusSession.findUnique({ where: { id: body.sessionId } })
  if (!session || session.userId !== userId) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  const stoppedAt = body.stoppedAt ? new Date(body.stoppedAt) : new Date()
  const actualMinutes = (() => {
    const ms = stoppedAt.getTime() - new Date(session.startAt).getTime()
    return Math.max(1, Math.round(ms / 60000))
  })()
  const id = crypto.randomUUID()
  // Use a parameterized raw insert to avoid relying on a missing Prisma model
  await prisma.$executeRaw`
    INSERT INTO \`TimerStop\` (id, sessionId, userId, stoppedAt)
    VALUES (${id}, ${session.id}, ${userId}, ${stoppedAt})
  `
  const stop = { id, sessionId: session.id, userId, stoppedAt }
  const updated = await prisma.focusSession.update({ where: { id: session.id }, data: { endAt: stoppedAt, durationMinutes: actualMinutes } })
  return NextResponse.json({ ok: true, session: updated, stop })
}