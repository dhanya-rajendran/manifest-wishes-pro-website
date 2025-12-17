import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return NextResponse.json({ user: null }, { status: 401 })

  const payload = verifyToken<{ uid: string | number; email: string }>(token)
  if (!payload) return NextResponse.json({ user: null }, { status: 401 })

  // Demo user support (no DB record)
  if (payload.uid === 'demo') {
    return NextResponse.json({ user: { id: 'demo', email: payload.email, name: 'Demo User' } })
  }

  const user = await prisma.user.findUnique({ where: { id: Number(payload.uid) } })
  if (!user) return NextResponse.json({ user: null }, { status: 404 })
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
}