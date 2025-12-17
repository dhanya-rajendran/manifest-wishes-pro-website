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
  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date')
  const date = dateStr ? new Date(dateStr) : new Date()
  const key = date.toISOString().slice(0, 10)
  const entry = await prisma.method369Entry.findUnique({ where: { userId_date: { userId, date: new Date(key) } } })
  return NextResponse.json({ ok: true, entry })
}

export async function POST(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  let json: unknown
  try { json = await request.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
  const body = json as { phrase?: string; date?: string; morningCount?: number; afternoonCount?: number; eveningCount?: number }
  const dateKey = body.date ? new Date(body.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10)
  if (!body.phrase) return NextResponse.json({ ok: false, error: 'Missing phrase' }, { status: 400 })
  const entry = await prisma.method369Entry.upsert({
    where: { userId_date: { userId, date: new Date(dateKey) } },
    create: {
      id: crypto.randomUUID(), userId, phrase: body.phrase, date: new Date(dateKey),
      morningCount: body.morningCount ?? 0,
      afternoonCount: body.afternoonCount ?? 0,
      eveningCount: body.eveningCount ?? 0,
    },
    update: {
      phrase: body.phrase,
      morningCount: body.morningCount ?? undefined,
      afternoonCount: body.afternoonCount ?? undefined,
      eveningCount: body.eveningCount ?? undefined,
    }
  })
  return NextResponse.json({ ok: true, entry })
}