import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(request: Request) {
  const { email, password, name } = await request.json()
  if (!email || !password || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email in use' }, { status: 400 })
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({ data: { email, password: passwordHash, name, plan: 'free' } })
  const token = signToken({ uid: user.id, email: user.email })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('auth_token', token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return res
}