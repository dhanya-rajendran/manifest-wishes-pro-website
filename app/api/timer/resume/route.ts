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
  const body = json as { sessionId: string; endedAt?: string; targetEnd?: string }
  if (!body.sessionId) return NextResponse.json({ ok: false, error: 'Missing sessionId' }, { status: 400 })
  const session = await prisma.focusSession.findUnique({ where: { id: body.sessionId } })
  if (!session || session.userId !== userId) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  const endedAt = body.endedAt ? new Date(body.endedAt) : new Date()
  const targetEnd = body.targetEnd ? new Date(body.targetEnd) : null
  // Close the latest open pause (if any) using a raw UPDATE to avoid missing Prisma model properties
  await prisma.$executeRaw`
    UPDATE \`TimerPause\`
    SET endedAt = ${endedAt}
    WHERE sessionId = ${session.id} AND endedAt IS NULL
    ORDER BY startedAt DESC
    LIMIT 1
  `
  if (targetEnd) {
    await prisma.focusSession.update({ where: { id: session.id }, data: { targetEnd } })
  }
  return NextResponse.json({ ok: true, session })
}