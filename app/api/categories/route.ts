import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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

const DEFAULT_CATEGORIES = ['work', 'health', 'personal', 'goal']

export async function GET(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, plan: true } })
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const custom = await prisma.userCategory.findMany({ where: { userId }, orderBy: { name: 'asc' } })
  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...custom.map(c => c.name)]))
  const canAdd = user.plan === 'pro'
  return NextResponse.json({ ok: true, categories, canAdd })
}

export async function POST(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, plan: true } })
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  if (user.plan !== 'pro') return NextResponse.json({ ok: false, error: 'Pro plan required' }, { status: 403 })

  let json: unknown
  try { json = await request.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
  const body = json as { name?: string }
  const name = (body.name || '').trim().toLowerCase()
  if (!name || name.length < 2 || name.length > 32) {
    return NextResponse.json({ ok: false, error: 'Category name must be 2–32 characters' }, { status: 400 })
  }
  // Disallow duplicates of default categories
  if (DEFAULT_CATEGORIES.includes(name)) {
    return NextResponse.json({ ok: false, error: 'Category already exists' }, { status: 400 })
  }
  try {
    await prisma.userCategory.create({ data: { userId, name } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Category already exists' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}