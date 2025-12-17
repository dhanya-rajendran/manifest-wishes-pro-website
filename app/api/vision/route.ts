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
  const items = await prisma.visionItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ ok: true, items })
}

type CreateVisionBody = { title: string; imageUrl?: string; description?: string }
export async function POST(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  let json: unknown
  try { json = await request.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
  const body = json as Partial<CreateVisionBody>
  if (!body.title) return NextResponse.json({ ok: false, error: 'Missing title' }, { status: 400 })
  const item = await prisma.visionItem.create({ data: { id: crypto.randomUUID(), userId, title: body.title, imageUrl: body.imageUrl, description: body.description } })
  return NextResponse.json({ ok: true, item })
}

export async function DELETE(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  await prisma.visionItem.deleteMany({ where: { userId } })
  return NextResponse.json({ ok: true })
}