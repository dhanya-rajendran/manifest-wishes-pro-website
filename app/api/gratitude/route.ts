import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function getUserFromCookie(request: Request): { id: number | 'demo'; email: string } | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null
  const payload = verifyToken<{ uid: string | number; email: string }>(token)
  if (!payload) return null
  if (payload.uid === 'demo') return { id: 'demo', email: payload.email }
  return { id: Number(payload.uid), email: payload.email }
}

export async function GET(request: Request) {
  const user = getUserFromCookie(request)
  if (!user || user.id === 'demo') return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || undefined
  const periodKey = searchParams.get('periodKey') || undefined
  if (!period || !periodKey) {
    return NextResponse.json({ ok: false, error: 'Missing period or periodKey' }, { status: 400 })
  }

  const entry = await prisma.gratitudeEntry.findUnique({
    where: { userId_period_periodKey: { userId: Number(user.id), period, periodKey } },
  })

  return NextResponse.json({ ok: true, entry })
}

export async function POST(request: Request) {
  const user = getUserFromCookie(request)
  if (!user || user.id === 'demo') return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const period: string | undefined = body?.period
  const periodKey: string | undefined = body?.periodKey
  const payload: unknown = body?.payload
  if (!period || !periodKey || payload == null) {
    return NextResponse.json({ ok: false, error: 'Missing period, periodKey, or payload' }, { status: 400 })
  }

  const entry = await prisma.gratitudeEntry.upsert({
    where: { userId_period_periodKey: { userId: Number(user.id), period, periodKey } },
    create: { userId: Number(user.id), period, periodKey, payload },
    update: { payload },
  })

  return NextResponse.json({ ok: true, entry })
}