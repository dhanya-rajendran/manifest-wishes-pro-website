import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

type CreateTaskBody = {
  id?: string
  title: string
  category: string
  done?: boolean
}

function isString(x: unknown): x is string {
  return typeof x === 'string'
}

function isBoolean(x: unknown): x is boolean {
  return typeof x === 'boolean'
}

function parseCreateTaskBody(input: unknown): CreateTaskBody | null {
  if (!input || typeof input !== 'object') return null
  const obj = input as Record<string, unknown>
  const title = obj.title
  const category = obj.category
  if (!isString(title) || !isString(category)) return null
  const id = obj.id
  const done = obj.done
  if (id !== undefined && !isString(id)) return null
  if (done !== undefined && !isBoolean(done)) return null
  return { title, category, id: id as string | undefined, done: done as boolean | undefined }
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

export async function GET(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || undefined
  const titleParam = searchParams.get('title') || undefined
  const categoriesParam = searchParams.get('categories') || undefined
  const statusParam = searchParams.get('status') || undefined
  const createdFromParam = searchParams.get('createdFrom') || undefined
  const createdToParam = searchParams.get('createdTo') || undefined
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')
  const page = pageParam ? Math.max(1, Number(pageParam)) : 1
  const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam))) : 10

  // Build Prisma where based on query params
  const where: Record<string, unknown> = { userId, deletedAt: null, ...(category ? { category } : {}) }

  if (titleParam) {
    // Use contains without case mode for broader provider support
    where.title = { contains: titleParam }
  }

  if (categoriesParam) {
    const cats = categoriesParam.split(',').map((s) => s.trim()).filter(Boolean)
    if (cats.length > 0) where.category = { in: cats }
  }

  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean)
    const hasOpen = statuses.includes('open')
    const hasDone = statuses.includes('done')
    // Only filter if a single status is selected; both means no filter
    if (hasOpen && !hasDone) where.done = false
    else if (!hasOpen && hasDone) where.done = true
  }

  if (createdFromParam || createdToParam) {
    const createdAt: Record<string, Date> = {}
    if (createdFromParam) {
      // Start of day UTC for from date
      createdAt.gte = new Date(`${createdFromParam}T00:00:00.000Z`)
    }
    if (createdToParam) {
      // End of day UTC for to date
      createdAt.lte = new Date(`${createdToParam}T23:59:59.999Z`)
    }
    where.createdAt = createdAt
  }
  const total = await prisma.task.count({ where })

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })
  return NextResponse.json({ ok: true, tasks, page, limit, total })
}

export async function POST(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  let json: unknown
  try { json = await request.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }
  const body = parseCreateTaskBody(json)
  if (!body) return NextResponse.json({ ok: false, error: 'Missing title or category' }, { status: 400 })
  const { id, title, category, done } = body

  const task = await prisma.task.create({
    data: {
      id: id ?? crypto.randomUUID(),
      userId,
      title,
      category,
      done: done ?? false,
    },
  })
  return NextResponse.json({ ok: true, task })
}

export async function DELETE(request: Request) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  await prisma.task.updateMany({ where: { userId, deletedAt: null }, data: { deletedAt: new Date() } })
  return NextResponse.json({ ok: true })
}