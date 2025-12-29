import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, comparePassword, hashPassword } from '@/lib/auth'

function getUserIdFromCookie(req: Request): number | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/auth_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null
  const payload = verifyToken<{ uid: number | string }>(token)
  if (!payload) return null
  const uid = payload.uid
  return typeof uid === 'string' ? (uid === 'demo' ? null : parseInt(uid, 10)) : uid
}

export async function POST(req: Request) {
  const userId = getUserIdFromCookie(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json().catch(() => ({}))
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ok = await comparePassword(currentPassword, user.password)
  if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  const hashed = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
  return NextResponse.json({ ok: true })
}