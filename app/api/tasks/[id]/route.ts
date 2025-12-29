import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

type UpdateTaskBody = {
  title?: string
  category?: string
  done?: boolean
}

function parseUpdateTaskBody(input: unknown): UpdateTaskBody | null {
  if (!input || typeof input !== 'object') return null
  const obj = input as Record<string, unknown>
  const out: UpdateTaskBody = {}
  if (typeof obj.title === 'string') out.title = obj.title
  if (typeof obj.category === 'string') out.category = obj.category
  if (typeof obj.done === 'boolean') out.done = obj.done
  return out
}

function getUserId(request: Request): number | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null
  const payload = verifyToken<{ uid: string | number }>(token)
  if (!payload) return null
  if (payload.uid === 'demo') return null
  return Number(payload.uid)
}

export async function PATCH(request: Request, context: any) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  let json: unknown
  try { json = await request.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
  const body = parseUpdateTaskBody(json)
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
  if (Object.keys(body).length === 0) return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 })

  const { id } = (context?.params ?? {}) as { id: string }
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  if (existing.userId !== userId) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  const updated = await prisma.task.update({ where: { id }, data: body })
  return NextResponse.json({ ok: true, task: updated })
}

export async function DELETE(request: Request, context: any) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = (context?.params ?? {}) as { id: string }
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing || existing.deletedAt || existing.userId !== userId) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ ok: true })
}