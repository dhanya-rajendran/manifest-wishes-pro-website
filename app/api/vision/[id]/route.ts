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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const existing = await prisma.visionItem.findUnique({ where: { id: params.id } })
  if (!existing || existing.userId !== userId) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  let json: unknown
  try { json = await request.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
  const body = json as { title?: string; imageUrl?: string; description?: string }
  const updated = await prisma.visionItem.update({ where: { id: params.id }, data: body })
  return NextResponse.json({ ok: true, item: updated })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const existing = await prisma.visionItem.findUnique({ where: { id: params.id } })
  if (!existing || existing.userId !== userId) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  await prisma.visionItem.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}