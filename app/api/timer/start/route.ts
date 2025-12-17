import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, signToken, hashPassword } from '@/lib/auth'

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
  let userId = getUserId(request)
  // If not logged in, create or reuse a demo user and set an auth cookie
  let setDemoCookieToken: string | null = null
  if (!userId) {
    const demoEmail = 'demo@example.com'
    const demo = await prisma.user.upsert({
      where: { email: demoEmail },
      update: {},
      create: { email: demoEmail, name: 'Demo', password: await hashPassword('demo') }
    })
    userId = demo.id
    setDemoCookieToken = signToken({ uid: userId })
  }
  let json: unknown
  try { json = await request.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
  const body = json as { startAt?: string; note?: string; plannedMinutes?: number; targetEnd?: string; mode?: 'focus' | 'break' }
  const startAt = body.startAt ? new Date(body.startAt) : new Date()
  const targetEnd = body.targetEnd ? new Date(body.targetEnd) : undefined
  const session = await prisma.focusSession.create({
    data: {
      id: crypto.randomUUID(),
      userId: userId!,
      startAt,
      note: body.note,
      plannedMinutes: body.plannedMinutes,
      targetEnd,
      mode: body.mode ?? 'focus',
    }
  })
  const res = NextResponse.json({ ok: true, session })
  if (setDemoCookieToken) {
    res.headers.set('Set-Cookie', `auth_token=${setDemoCookieToken}; Path=/; HttpOnly; SameSite=Lax`)
  }
  return res
}