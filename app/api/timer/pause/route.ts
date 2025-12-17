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
  const body = json as { sessionId: string; startedAt?: string }
  if (!body.sessionId) return NextResponse.json({ ok: false, error: 'Missing sessionId' }, { status: 400 })
  const session = await prisma.focusSession.findUnique({ where: { id: body.sessionId } })
  if (!session || session.userId !== userId) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  const startedAt = body.startedAt ? new Date(body.startedAt) : new Date()
  const id = crypto.randomUUID()
  // Use a parameterized raw insert to avoid relying on missing Prisma model property
  await prisma.$executeRaw`
    INSERT INTO \`TimerPause\` (id, sessionId, userId, startedAt)
    VALUES (${id}, ${session.id}, ${userId}, ${startedAt})
  `
  // Mark session as paused by clearing targetEnd
  await prisma.focusSession.update({ where: { id: session.id }, data: { targetEnd: null } })
  return NextResponse.json({ ok: true, pause: { id, sessionId: session.id, userId, startAt: startedAt.toISOString(), endAt: null } })
}